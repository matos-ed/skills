# qd-app-cliente — perfil de teste local

App mobile do cliente. React Native 0.81 bare (sem Expo), React 19, TypeScript 5.8, Yarn 1, Node ≥ 20. Branch padrão: `main` (PRs vão para `stage`).

## Rodar

- `yarn start` sobe o Metro. `yarn android-dev` / `yarn ios-dev` (scheme `QueroDeliveryDev`, simulador "iPhone 12 (Rosetta)").
- Ambiente por `ENVFILE` com `react-native-config`: `.env.dev`, `.env.stage`, `.env.production`. Variáveis principais: `API_URL`, `FALL_BACK_API_URL`, `CDN_*`, `GROWTHBOOK_*`, `PUSHER_APP_KEY`, `SENTRY_DSN`. O `firebaseconfig.sh` troca a config do Firebase.
- iOS: `cd ios && pod install` (há `Gemfile`).
- Contra backend local: crie um `.env` próprio com `API_URL` apontando para o serviço local (`10.0.2.2:<porta>` no emulador Android, `localhost:<porta>` no simulador iOS).

## Testes

- Jest 29 com preset `react-native` (não é jsdom), `@testing-library/react-native` 12, `jest-native`, MSW 2.
- Setup em `jestSetup.ts`: simula Adjust, GrowthBook, permissões, Reanimated, AsyncStorage, NetInfo, Clipboard, WebView e o `apiClient` (aponta para `TEST_BASE_URL`). As animações viram síncronas.
- Handlers: `mockGetRequest`/`mockPostRequest`/`mockPutRequest`/`mockPatchRequest`/`mockDeleteRequest` em `__mocks__/server/index.ts`. Mantenha o `moduleNameMapper` de `^msw/node$`.
- Wrappers: `createQueryClientWrapper()` (`__mocks__/lib/react-query-mock.tsx`), `renderWithProviders` e `createReduxWrapper` (`__mocks__/mock-providers/`).
- Regras do repo (`ai-context/stack.md`):
  - afirme sobre texto e acessibilidade;
  - use `fireEvent.press`;
  - simule a navegação com `jest.requireActual` + spread;
  - prefira MSW a `jest.mock` do `apiClient`.
- Teste novo fica ao lado do arquivo. Não crie arquivos em `__tests__/components` nem `__tests__/screens` (legado).
- Comandos: `yarn test <arquivos>`, `yarn test:ci` (JSON + cobertura, como no CI).

## CI

- PR (base diferente de `main`): `yarn install --immutable` e `yarn test:ci`. ESLint e `tsc` estão comentados no workflow; rode localmente mesmo assim.
- Push na `stage`: `yarn test:ci`, artefato de cobertura e PR `stage` → `main`.

## E2E

- WebdriverIO 9 + Appium 2 + Allure, configs em `__tests__/e2e/config/wdio.{android,ios,shared}.conf.ts`.
- Comandos: `yarn wdio-android`, `yarn wdio-ios`. Exigem um `.env.test`, que não vem no repo.
- Detox está nas dependências, mas é legado.
- E2E central: o workflow `run-e2e-tests.yml` dispara o `qd-test-automation-mobile` contra STG.

## Armadilhas

- O `.npmrc` precisa de `GITHUB_TOKEN`, `FONT_AWESOME_TOKEN` e `QD_MOBILE_NPM_TOKEN`; o `.env` e o `.npmrc` reais vêm do Scrum Master.
- Os scripts `*-staging` usam `ENVFILE=.env.staging`, mas o arquivo do repo é `.env.stage`: confira antes de usar.
- `ai-context/stack.md` tem versões desatualizadas (app e merlot-native): confira o `package.json`.

## Histórico de execuções

| Data | Tarefa | Resultado |
|---|---|---|
