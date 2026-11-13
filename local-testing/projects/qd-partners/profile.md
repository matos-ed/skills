# qd-partners — perfil de teste local

App web do parceiro. React 19, Vite 7, TanStack Router (rotas por arquivo em `src/routes/`), TanStack Query. Branch padrão: `stage`.

## Rodar

- `yarn dev` sobe o Vite na porta 2021. `yarn preview` serve o build na 8080.
- `.env` local não vem no repo (pedir ao Scrum Master); o `.env.example` lista as variáveis com prefixo `REACT_APP_` (`REACT_APP_API_URL`, `REACT_APP_BACKOFFICE_API_URL`, `REACT_APP_WEBSOCKET_URL`, `REACT_APP_DISABLE_RECAPTCHA`, `REACT_APP_FRONT_ENV`...).
- Build de produção também pede `SENTRY_AUTH_TOKEN`, `SENTRY_PROJECT` e `SENTRY_ORG`.

## Testes

- Vitest 2 + jsdom, Testing Library 16, `user-event`, `jest-dom`, MSW 1.x.
- Setup em `src/setupTests.ts`: simula `motion/react`, o `apiClient`, o `AxiosApi` legado e APIs do navegador, e sobe o MSW. Depois de cada teste roda `assertNoUnhandledRequests()`: **requisição sem handler reprova o teste**.
- Handlers: `mockGetRequest`/`mockPostRequest`/`mockPutRequest`/`mockOptionsRequest` em `src/__mocks__/server.ts`, com base `https://testapi.querodelivery.com`. Builders em `src/__mocks__/features/*`.
- Tela com rota: renderize com `setupWithFileRouter` (`src/__tests__/file-route-utils.tsx`), que usa o `routeTree.gen` gerado.
- Comandos:
  - `yarn routes:generate` **antes** dos testes;
  - `yarn vitest run <arquivos>` para os testes da mudança;
  - `yarn vitest run` para a suíte toda;
  - `yarn test:ui` com cobertura.

## CI

- PR (base diferente de `main`): commitlint, `yarn tsc`, `yarn lint`, seleção dos testes afetados (`scripts/ci/select-tests.mjs`) e `yarn vitest run --coverage` nessa seleção.
- Push na `stage`: suíte em 4 shards, `yarn release` e PR automático `stage` → `main`.
- Antes do PR, rode localmente `yarn tsc`, `yarn lint` e os testes afetados.

## E2E

- O Cypress do repo está desativado (`cypress.config.ts` existe, a dependência não): `yarn e2e` falha.
- E2E de verdade: o workflow `run-e2e-tests.yml` dispara o `qd-test-automation-web` contra `stagepartners.quero.io`.

## Armadilhas

- `@fortawesome/pro-*` exige `FONT_AWESOME_TOKEN` no `.npmrc`.
- `yarn format` está quebrado (aponta para `.prettierrc`; o arquivo é `prettier.config.cjs`).
- `ai-context/stack.md` tem versões desatualizadas: confira o `package.json`.
- O merlot-web embute uma cópia do merlot-core: patch tem que mirar os dois pacotes (memória `merlot-web-bundles-core`).

## Histórico de execuções

| Data | Tarefa | Resultado |
|---|---|---|
