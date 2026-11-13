# qd-auto-register-service — perfil de teste local

Cadastro automatizado do parceiro (fluxo v2 em `/api/v2/self-registration/*`) e painel gerencial do manager.

## Infra

- Mongo Atlas Local, Kafka SASL_SSL e MinIO (bucket `qd-auto-register-local`). Sem Redis.
- Tópicos: ver `TOPICS` em `profile.env`. O analytics do qd-packages escreve em `RECORD_ANALYTICS_TOPIC`.
- S3: o `S3Client` não tem endpoint configurável no código, mas o SDK v3 lê `AWS_ENDPOINT_URL_S3`. Com o endpoint num IP (`http://127.0.0.1:9000`), ele usa path-style e o MinIO aceita as URLs assinadas de upload e download.
- Terceiros (api-geral, places, data-enrichment, communication) vão para o stub. O fluxo de upload não chama nenhum.

## Autenticação

- Parceiro: `Authorization: Bearer <jwt>` com `{ data: { registerId } }`, assinado com `SECRET_KEY`.
- Manager (rotas do painel, `/api/registers/:id/...`): `Authorization: Basic <API_BASIC_TOKEN>` + cabeçalho `managerauth` (JSON com `isRoot`, `cityIds`...) + `managerauth-signature` = HMAC-SHA256 hex do `managerauth` com `MANAGER_AUTH_HMAC_SECRET`. O painel chega por proxy do qd-api-geral, que só repassa.

## Seed

`seed.ts` usa o `generateMockRegisterEntity` dos testes e grava dois registros nos dois bancos:
- `…0001` em `DADOS_PINO_LOCALIZACAO`, pronto para negócio, catálogo e endereço;
- `…0002` com CPF recusado por "Divergência de nome", pronto para `POST /api/document-confirmation`.

## Cenários

- `scenario-upload.mjs`: URL assinada → PUT no bucket → negócio (logo/capa) → catálogo → documento → listagem de anexos como o painel → download de cada anexo.
- `scenario-attachments-contract.mjs <porta> <rótulo> <db>`: grava pelo driver cru um registro legado (anexo do manager sem origem, documento e catálogo com nome original), lê anexos, registro (`GET /v2/registers/:id`) e rascunho (`GET /v2/self-registration`), reenvia catálogo e documento e lê de novo. Serve para qualquer mudança no formato dos anexos.

## Contrato dos anexos

- O schema `AttachmentRegister` (só na listagem de anexos) tem `additionalProperties: false` e enums de `origin` e `category`; a validação de resposta está ligada, então valor fora do enum vira 500.
- O rascunho exige `name` nos arquivos de catálogo (`SelfRegistrationDraftFile`), e esse nome vem do anexo.
- `GET /v2/registers` e `/v2/registers/search` não trazem anexos. A busca precisa de índice Atlas Search, que não existe no Mongo local: volta vazia.
- Nenhuma mensagem Kafka do serviço leva anexos.

## Armadilhas

- O `.env` do repo aponta para o Mongo de STG. A trava de segredos libera ler uma chave exata para variável, sem imprimir. Para dados reais de STG, só leitura, e o `mongosh` do Homebrew roda fora do sandbox.
- Nome dos anexos (desde 13/11/2026): logo `logo.<ext>`, capa `capa.<ext>`, catálogo `catalogo_<n>.<ext>`, documento `<tipo>.<ext>` ou `<tipo>_frente`/`_verso`. O arquivo no S3 continua com o id do upload.

## Histórico de execuções

| Data | Tarefa | Resultado |
|---|---|---|
| 13/11/2026 | nomes de anexos (catálogo e documento) | branch e stage com status iguais; diferença só nos nomes e na categoria do documento |
| 13/11/2026 | MER-11647, contrato e uploads antigos | todas as rotas de leitura 200 nas duas versões; anexos legados mantêm o nome até o parceiro reenviar; primeiro uso dos scripts da skill (infra ~15 s, `run.sh start` com os dois builds ~4 min) |
