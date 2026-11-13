# Regras de domínio (DDD) — serviços Quero Delivery

A regra de negócio é da **entidade**, não do service. O service carrega, chama a entidade e persiste.

## Onde cada validação mora

| O que é | Onde | Erro |
|---|---|---|
| Forma do payload: campo obrigatório, tipo, enum, tamanho, campo condicional | Contrato OpenAPI (`express-openapi-validator`) | 400, automático |
| Invariante do domínio: dígito do CNPJ, data ≥ hoje, categoria existente, transição de step | Método da **entidade** | `BusinessError` (422) |
| Existência do agregado | Service, ao carregar pelo repositório | `NotFoundError` (404) |
| Token sem o id esperado | Controller | `UnauthorizedError` (401) |

Uma regra fica em **um** lugar só. Se o contrato já barra, não repita no service.

## Entidade rica

- Mudança de estado entra por um método com intenção no nome (`changeBusiness`, `changeAddress`, `validateTransitionToStep`). Ele **valida e atribui** junto: não existe entidade com estado inválido entre uma chamada e outra.
- **Nunca valide invariante no construtor.** O construtor reidrata documentos antigos. Um register salvo com data que já passou, ou com CNPJ legado inválido, quebraria na leitura. O construtor só normaliza (`CnpjNormalizer`, telefone).
- Semântica de PUT: campo opcional ausente no body limpa o valor na entidade (`undefined`), não mantém o antigo. Ex.: trocar CNPJ → CPF zera `cnpj` e `socialName`.
- Dependência pura (validador, normalizador) pode ser constante de módulo na entidade. Repositório e integração externa nunca entram na entidade.
- Entidade guarda o próprio estado: campos `readonly`, `constructor(params)` que só normaliza e `static restore`. O repositório devolve a entidade, não um objeto plano. Classe só com métodos estáticos que retornam interface não é entidade.

## Service orquestra

Fluxo de escrita: carregar o agregado (404 se não existir) → `new Entity(doc)` → método da entidade → persistir. O service não contém `if` de regra de negócio. Se aparecer um, ele é candidato a método da entidade.

Dependências entram como campos nomeados, no padrão dos outros serviços. Não use um objeto `deps` (`constructor(private readonly deps: I*Dependencies)` com `this.deps.x`), mesmo onde o repo já tiver esse padrão; não o copie para código novo.

```ts
export class PepImportService {
  private readonly source: IPepSource;

  constructor(params: IParamsCreatePepImportService) {
    this.source = params.source;
  }
}
```

`IParamsCreate*Service` fica no arquivo de interfaces do domínio.

## Contrato OpenAPI

- Campos condicionais usam `oneOf` + `discriminator` (`propertyName` + `mapping`). Cada ramo tem `additionalProperties: false` e lista todas as propriedades. Com `allOf`, o `additionalProperties: false` quebra.
- Enum do contrato em inglês (`PRESENTIAL|DELIVERY|PICKUP`). Se o valor gravado for outro, a entidade mapeia. Não exponha enum legado em pt no contrato novo.
- Data sem hora: `format: date`, que chega como string `YYYY-MM-DD`. "Hoje" é `format(new Date(), 'yyyy-MM-dd')` do `@querodelivery/qd-date-helper`, que já usa o fuso `America/Bahia`. Compare strings, nunca `new Date()` cru.

## Tipos e nomes

- Nada de tipo composto inline em assinatura (`Omit<X,'a'> & {…}`). Crie uma interface nomeada pelo propósito (`IParams*`, `I*DTO`), que pode estender `Omit`/`Pick`, no arquivo de interfaces do domínio que já existe (`<dominio>.interface.ts`).
- Payload com variantes: uma interface por ramo, mais uma união `T*DTO`, com o discriminante tipado pelo enum (`registrationType: ERegistrationType.CNPJ`).
- Enum com prefixo `E` (o lint exige `/^E[A-Z]/`). String repetida de infraestrutura vira enum: `EDbCollections.REGISTER` em vez de `new MongoRepository('register')`.
- Todo `if` tem chaves, inclusive o retorno antecipado de uma linha: `if (!doc) { return null; }` em três linhas, nunca `if (!doc) return null;`.
- Comentário de código em inglês.
- Importação nomeada sempre que o módulo oferecer: `import { compact, invert } from 'lodash'`, não `import _ from 'lodash'`. Vale para código novo; não reescreva o default import de um arquivo que você não está alterando.

## Erros

- **Mensagem para o usuário em pt-BR** (`'CNPJ inválido'`, `'Registro não encontrado.'`). Código, log e nome de teste ficam em inglês. As mensagens automáticas do `express-openapi-validator` saem em inglês e nomeiam o campo; não traduza caso a caso.
- `catch` que troca erro por fallback (`return null`, valor padrão) deve:
  1. capturar **só** o erro que significa "não achou" (confira quem lança);
  2. registrar `Logger.warn` (`traceability`) com contexto não sensível e a mensagem;
  3. deixar subir falha de integração (chave revogada, cota, indisponível) como `GeneralError` (500).
  Caso real: o Google devolve `REQUEST_DENIED` com `results: []`, e o código antigo tratava isso como "endereço não encontrado".

## Reuso antes de helper

Antes de escrever um validador ou utilitário, procure nas dependências do repo e no `@querodelivery/*`: `next-cnpj` (CNPJ numérico e alfanumérico, NTC 2025.001), `qd-date-helper` (datas no fuso certo; toda soma, subtração, início do dia ou formatação de data passa por ele, nunca `getTime()`, `Date.UTC` ou `getMonth()` na mão), `qd-packages` (erros, `HttpClient`, `mongoose`, e texto em `helpers/util.helper.ts`: `removeAccentsAndSpecialCharsPreserveSpaces`, `normalizeString`, `normalizeText`). Só crie um helper se nada cobrir o caso. Se criar, espelhe o comportamento de quem já grava o mesmo dado (ex.: `getDistanceInMeters` espelha o `geolib` do front v1).

## Testes (só integração nos serviços)

- Um caso por regra, com status **e** `body.message`: sucesso, cada invariante (422), cada ramo do contrato (400), agregado inexistente (404), token sem id e basic auth (401). Inclua as bordas: "hoje" aceito, CNPJ alfanumérico com máscara.
- Prove o teste: tire a regra e veja ele falhar (mutação manual) antes de confiar.
- Nome no padrão `qd-integration-tests` (método, rota e status no título).
