---
name: frontend-refactor
description: Refatora telas e componentes web sem mudar o que o usuário vê, provando com capturas antes/depois em celular, notebook e desktop Full HD. Use quando o usuário pedir para refatorar, migrar (React Query, TypeScript, nova arquitetura, classe para hooks) ou reorganizar código de UI de uma tela que já existe.
---

# Frontend refactor

Um refactor muda **como** o código funciona, nunca **o que** o usuário vê. "Igual" significa zero pixel diferente nos três tamanhos de tela, provado por captura, e não por inspeção visual ou por memória.

## Regras

1. **A tela fica exatamente igual.** Mesma estrutura, ordem, textos, espaçamentos, cores, ícones, estados (carregando, vazio, erro) e comportamento responsivo. Nenhum elemento entra ou sai: nem aviso, nem skeleton, nem tooltip, nem mensagem nova.
2. **Bugs podem ser corrigidos, mas o que muda o visual é avisado.** Toda correção feita no refactor é classificada:
   - **Invisível** (cálculo, request, estado interno, sem efeito na tela nos casos que hoje funcionam): entra direto e vai listada no PR.
   - **Visível** (muda texto, número exibido, layout ou estado da tela em algum cenário): **pare e avise o usuário** antes de seguir, com o que muda, em qual situação e as capturas antes/depois. Sem o OK dele, a correção fica fora do refactor e vira task própria.
3. **Prova visual antes do PR**, nos três tamanhos:

   | Nome | Viewport | Observação |
   | --- | --- | --- |
   | `celular` | 390 × 844 | escala 3x, touch e `isMobile` |
   | `notebook` | 1366 × 768 | escala 1x |
   | `desktop-fullhd` | 1920 × 1080 | escala 1x |

4. **Diferença sem explicação significa refactor não terminado.** Uma diferença só é aceita quando vem de uma correção visível já aprovada (regra 2) ou de um dado volátil mascarado (relógio, ids, conteúdo que muda sozinho). Nunca use máscara para esconder uma diferença do próprio layout.

## Passos

1. **Inventário de estados.** Leia a versão atual a partir do código commitado (`git show <branch-base>:<caminho>`), não do working tree. Liste cada estado visível: cada aba, visão, agrupamento ou filtro que muda o layout, além de vazio, erro, modal ou dropdown aberto, conteúdo longo e diferenças por permissão.
   **Pronto quando** cada ramo de renderização do código antigo (`if`, `switch`, `&&`, ternário no JSX) estiver ligado a um cenário.

2. **Refatore** seguindo as skills do projeto (arquitetura, requests, testes). Anote cada bug encontrado e classifique-o pela regra 2 assim que o achar. Um bug visível é avisado na hora, e não no fim.

3. **Suba as duas versões lado a lado:**
   - a base, num worktree destacado da branch padrão (`git worktree add --detach <dir> origin/<branch-base>`);
   - a branch do refactor, em outra porta;
   - as duas apontando para o mesmo backend e usando o mesmo usuário, para que os dados sejam os mesmos.

   Em seguida, num diretório de rascunho **fora do repositório**:
   ```bash
   npm init -y && npm i playwright@1.56.1 && npx playwright install chromium
   npx playwright codegen --save-storage=auth.json <url-da-base>   # faça login e feche
   ```
   **Pronto quando** as duas versões abrem a tela logadas.

4. **Escreva o `scenarios.json`** (formato abaixo), com um cenário por estado do inventário, e rode no diretório de rascunho:
   ```bash
   node ~/dev/skills/frontend-refactor/scripts/visual-compare.cjs scenarios.json
   ```
   O script captura antes e depois em sequência, nos três tamanhos, com a página inteira, animações congeladas, fontes carregadas e fuso `America/Sao_Paulo`. Depois compara pixel a pixel e grava `report.md` e, para cada diferença, um `--diff.png` (vermelho = pixel que mudou). Ele sai com código 0 só quando tudo é idêntico.

5. **Investigue cada diferença** pelo `--diff.png`, corrija e rode de novo.
   **Pronto quando** o script sai com código 0, ou quando cada linha "diferente" do `report.md` corresponde a uma correção visível aprovada (regra 2).

6. **Reporte no PR:**
   - a tabela do `report.md`;
   - os prints dos três tamanhos de pelo menos o cenário principal;
   - os prints de antes e depois das diferenças aprovadas (o `--diff.png` serve para investigar, não vai para o PR);
   - a lista de bugs corrigidos, cada um marcado como visível (com o OK de quem aprovou) ou invisível.

## Formato do `scenarios.json`

```json
{
  "before": "http://localhost:5173",
  "after": "http://localhost:5174",
  "storageState": "auth.json",
  "out": "visual-compare",
  "mask": ["[data-testid=relogio]"],
  "scenarios": [
    { "name": "municipio-tabela", "path": "/relatorios/vendas?agruparPor=MUNICIPIO" },
    {
      "name": "municipio-grafico",
      "path": "/relatorios/vendas?agruparPor=MUNICIPIO",
      "steps": [{ "click": "button:has(i.chart.bar)" }, { "waitMs": 1500 }]
    }
  ]
}
```

- **Passos (`steps`):** `click`, `fill: { selector, value }`, `select: { selector, value }`, `waitFor`, `waitForHidden` e `waitMs`, todos com seletores do Playwright, além de `evaluate` (JavaScript executado na página).
- **Máscaras (`mask`):** podem ser globais ou por cenário.
- **Opcionais:** `channelTolerance` (padrão 0), `locale` e `timezoneId`.

## Armadilhas

- **Dados que mudam entre a captura de antes e a de depois** (pedidos em tempo real, contadores): o script já captura as duas em sequência. Se ainda assim variar, aponte as duas versões para o mesmo mock, ou mascare só a região do dado.
- **Gráficos em canvas** (chart.js) animam por JavaScript, e o CSS de congelamento não os para. Adicione `waitMs` depois de o gráfico aparecer.
- **Datas relativas a "hoje"** (botões de mês, projeção): rode a comparação de uma vez só, para as duas versões verem o mesmo dia.
- **Estado global que carrega depois da tela** (listas do Redux, dados do usuário): numa abertura direta pela URL, a versão antiga pode montar antes de esses dados chegarem e renderizar diferente a cada execução. Para comparar o resto da tela, abra numa rota neutra e navegue client-side até a tela com `evaluate` (`history.pushState` + `PopStateEvent('popstate')`). Mantenha um cenário de abertura direta para mostrar a diferença.
- **Servidor de dev frio** (Vite otimizando dependências) recarrega a página no meio da captura. Abra cada versão uma vez antes de rodar o script.
- **Worktree aninhado** (`<repo>/.claude/worktrees/…`): plugins que leem a config do ESLint (como o `vite-plugin-eslint`) acham duas configs e derrubam a página. Rode a versão a partir de uma cópia fora do repositório (`rsync` sem `node_modules` e `.git`).
- **`node_modules` em symlink quebra fontes e imagens no Vite:** o caminho real fica fora do `server.fs.allow`, e o Vite recusa servir os assets (ícones viram quadrados nas duas versões, então o diff dá igual). Copie com clone APFS (`cp -Rc <origem>/node_modules <destino>/`), que é instantâneo e não ocupa espaço extra. O script avisa (`AVISO …`) quando algum arquivo da própria origem falha; capture de novo se aparecer algum.
- **Tamanhos de página diferentes** (`antes 1366x900 depois 1366x912`) já contam como diferença: algo cresceu ou encolheu.
