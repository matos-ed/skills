# Frontend web e mobile

Os apps não precisam da infra Docker: os testes de componente simulam a API com MSW, e a execução manual aponta para a API de STG ou para um backend local. O perfil de cada app fica em `projects/<repo>/profile.md`.

## O que rodar, por tipo de mudança

| Mudança | Teste |
|---|---|
| Componente, hook, regra de tela | teste de componente com Testing Library + MSW, do arquivo alterado e dos vizinhos |
| Contrato com o backend mudou | teste com o handler MSW no formato novo, e o app rodando contra o backend local da branch (ver abaixo) |
| Refatoração visual ou de layout | comparação visual antes/depois com a skill `frontend-refactor` |
| Fluxo crítico de ponta a ponta | E2E central (`qd-test-automation-web` / `qd-test-automation-mobile`) contra STG, disparado pelo workflow `run-e2e-tests.yml` |

## Regras comuns (qd-partners e qd-app-cliente)

- Teste co-localizado: `*.test.ts(x)` ao lado do arquivo.
- Requisição sempre por MSW, com os helpers `mockGetRequest`/`mockPostRequest`/`mockPutRequest`... de `__mocks__/server`. Prefira MSW a `jest.mock` do `apiClient`.
- Afirme sobre o que o usuário vê (texto, acessibilidade), não sobre chamadas internas.
- Dados de teste com `@faker-js/faker` e builders do `@jackfranklin/test-data-bot` que já existem em `__mocks__/`.
- Dado de servidor vai por TanStack Query + MSW, nunca por Redux ou `useState`.
- Pacotes privados: o `.npmrc` usa `GITHUB_TOKEN` (GitHub Packages) e `FONT_AWESOME_TOKEN` (`@fortawesome/pro-*`); o app mobile também usa `QD_MOBILE_NPM_TOKEN`. Sem eles, o `yarn install` falha. Nunca imprima o `.npmrc`.

## App contra o backend local

Para ver uma mudança de contrato antes do deploy:
1. Suba o serviço com `scripts/run.sh start <repo-do-serviço>` e semeie os dados.
2. Aponte o app para a porta da branch: no web, a variável de API do `.env` local (`REACT_APP_API_URL` no partners); no mobile, `API_URL` num `.env` próprio. No emulador Android, `localhost` do Mac é `10.0.2.2`; no simulador iOS é `localhost`.
3. Quando o app fala com a api-geral e ela faz proxy para o serviço, o caminho real passa por ela. Para testar só o serviço, chame a rota dele direto ou simule a api-geral no stub.

## Comparação visual (web)

Receita do qd-manager (memória `qd-manager-local-visual-compare`), que serve para os outros apps web com login:
- Base e branch em portas diferentes; a porta padrão do app é a que o OIDC aceita como redirect.
- A sessão fica em cookie, que vale para `localhost` em qualquer porta: logue uma vez (`npx playwright codegen --save-storage=auth.json <url>`, fechando a janela para gravar) e reaproveite. Apague o `auth.json` no fim.
- Rode a branch de uma cópia fora do repo (`rsync` sem `node_modules` e `.git`, com `node_modules` em symlink). Em worktree aninhado, o plugin de ESLint acha duas configs e devolve 500.
- Mascare o que muda sozinho (contadores ao vivo) e abra a tela navegando pelo app quando ela depende de dados carregados antes.
- Commit em repo com commitizen no hook: `HUSKY=0 git commit`, depois do lint manual.
