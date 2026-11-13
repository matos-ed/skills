# Persistência e integrações

## MongoDB / Mongoose

- **Default do schema quase nunca vale.** `default: []` só é aplicado em `Model.create`, que é o que os testes usam. O `MongoRepository` (driver cru) ignora schema, defaults e `strict`. `updateOne` com `$set` também não aplica default. As leituras `lean` e os aggregates devolvem o que está no banco. Por isso, trate ausente, `null` e `[]` como vazio no código e nos filtros (`{ campo: { $in: [null, []] } }`).
- **Campo não declarado some em silêncio.** O schema raiz do register não tem `strict: 'throw'`: o `updateOne` descarta o campo e o `MongoRepository` grava sem checar. Declare o campo no schema e na projeção (`register.helper.repository.ts`) antes de gravar.
- **Toda query de listagem tem `$limit`.** Rota sem limite já derrubou pod por OOM (heap ≈ 50% do limit do container).
- Para provar que uma regra de persistência vale de verdade, teste pelo caminho de produção (o repositório real), não por `Model.create`.

## Redis

- O cliente precisa de timeout de comando (ex.: 500 ms). Uma conexão meio aberta pendura o comando para sempre, e cache não pode derrubar a rota.
- A escrita de cache (`setex`) vai sem `await` no caminho da request. A falha de cache vira `Logger.warn` e a request segue sem cache.
- Reproduza localmente com `docker pause` no container do Redis.

## HTTP externo

- Separe o "não achou" de "falhou". Leia o status de negócio do terceiro, não só o HTTP. O Google, por exemplo, responde `200` com `status: REQUEST_DENIED`. Só o "não achou" pode virar fallback.
- Em teste, o terceiro é stub: mock do `HttpClient`/serviço no teste de integração, e um stub HTTP local na verificação manual. Nunca aponte para STG/PRD nem use dado copiado de lá.
- Mensagem sem `key` no Kafka derruba o consumer. Produza sempre com key.
