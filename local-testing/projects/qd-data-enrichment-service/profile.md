# qd-data-enrichment-service — perfil de teste local

Enriquecimento de CPF/CNPJ (rotas `/api/cpf*`, `/api/cnpj*`, consumer de `QD-DATA-ENRICHMENT-SERVICE`) e base PEP da CGU (`/api/pep/check`, importação).

## Infra

- Mongo Atlas Local e Kafka SASL_SSL. Tópicos em `profile.env`.
- Provedores pagos (Retriver/DirectD) desligados (`RETRIVER_LOCALIZADOR_PF_ENABLED=false`) ou apontados para o stub; a CGU (`PEP_SOURCE_URL`) também vai para o stub.
- Worker de rotinas (desde a MER-11586): `node dist/src/worker.js routine`; `--list` mostra os workers da imagem.

## Autenticação

`Authorization: Basic <DATA_ENRICHMENT_SERVICE_TOKEN>`. Header ausente responde 400.

## Cenários

- `scenario-smoke.mjs <porta>`: health, pedido de enriquecimento CPF e CNPJ, status do pedido, leitura de CPF/CNPJ, CPF inválido e sem auth.

## Armadilhas

- **Consumer compartilhado:** branch e base entram no mesmo consumer group. Um pedido feito na branch pode ser processado pela base, e o status fica `PENDING` na branch. Para testar o consumer, derrube a base (`kill $(lsof -ti tcp:3422)`), espere o rebalance (~25 s) e repita.
- O checkout principal pode estar com `node_modules` de outra versão do qd-packages; para revisar um PR antigo, use worktree com `yarn install` próprio.

## Histórico de execuções

| Data | Tarefa | Resultado |
|---|---|---|
| 13/11/2026 | MER-11640, qd-packages 5.11 → 6.5.1 | rotas iguais nas duas versões; consumer da branch processou sozinho em ~4 s |
