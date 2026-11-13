# qd-cities-service — perfil de teste local

Municípios (coleção `municipio`): leitura para outros serviços, configurações do painel, validação de endereço e consumo do tópico `UTILS`.

## Infra

- Mongo Atlas Local e Kafka SASL_SSL. Sem Redis nem bucket.
- Tópicos: ver `TOPICS` em `profile.env`. Produz em `QD-PROMOTIONAL-CAMPAIGNS-SERVICE`, consome `UTILS` com `RUN_WORKERS_KAFKA=true`.
- **Node 24** (`engines` do `package.json`; o yarn recusa o install no 22). `profile.env` aponta `NODE_BIN` para o nvm; rode `yarn install` com `PATH=~/.nvm/versions/node/v24.12.0/bin:$PATH`.
- O repo não versiona `.npmrc`: copie o de outro serviço (está no `.gitignore`), senão o qd-packages dá 401.
- Terceiros: ViaCEP e BrasilAPI ficam com URL fixa no código (`cep.external.service.ts`); só a validação de endereço chama. Para testá-la, use o `preload-rewrite`.

## Autenticação

`Authorization: Basic <CITIES_SERVICE_TOKEN>` em todas as rotas, sem papel por chamador. Header ausente responde **400**, não 401. `PUT /settings` também exige o header `userAuth` (JSON).

## Seed e cenários

- `seed.mjs <db>...`: dois municípios sintéticos, `…c0001` com delivery e `…c0002` sem.
- `scenario-read.mjs <porta>`: `GET /cities/:id`, `/cities/:id/status` (com, sem, inexistente, id inválido, sem auth) e `/cities/ids`.

## Armadilhas

- O build deixa `dist/` e o `test:ci` deixa `coverage/` sem estarem no `.gitignore`: não use `git add .`.

## Histórico de execuções

| Data | Tarefa | Resultado |
|---|---|---|
| 13/11/2026 | MER-11588, `GET /cities/:id/status` | rotas existentes iguais nas duas versões; rota nova 200/404/400 na branch, 404 na stage; boot com Kafka conectado em ~3 min (dois builds) |
