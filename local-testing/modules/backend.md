# Backend (Node, Mongo, Kafka)

## Infra local

| Componente | Porta | Por quê |
|---|---|---|
| Mongo Atlas Local (`lt-mongo`) | 27027 | suporta `$search`; conecte com `?directConnection=true` |
| Kafka (`lt-kafka`) | 19093 | SASL_SSL com SASL PLAIN (`local`/`local`): libs de Kafka que fixam `ssl: true` não conectam num broker em texto puro |
| Redis (`lt-redis`) | 6390 | só para serviços com cache |
| MinIO (`lt-minio`) | 9000 | bucket S3; o SDK v3 lê `AWS_ENDPOINT_URL_S3`, e com endpoint em IP usa path-style sem mexer no código |

- O Node roda com `NODE_EXTRA_CA_CERTS=$LT_HOME/certs/cert.pem`, que mantém a verificação TLS ligada.
- Crie todos os tópicos antes de subir: procure `topic:`, `_TOPIC` e o prefixo de tópicos da organização no código. Libs compartilhadas podem produzir em tópicos próprios (ver `local/`); não conte com criação automática.
- Os erros `GroupCoordinator`/`Metadata` no primeiro boot são transitórios. Se persistirem, falta um tópico.
- Confirme `Producer Connected` e `Consumer Connected` no log.

## Branch × base

- A base é um worktree de `origin/stage` em `$LT_HOME/runs/<repo>/base-src`, fora do repo. Worktree aninhado em `<repo>/.claude/worktrees` herda o `.npmrc` e o ESLint do pai e quebra yarn e lint.
- Mesmo `package.json` e lockfile: o `run.sh` faz symlink do `node_modules`. Senão, copia o `.npmrc` (que usa `${GITHUB_TOKEN}`) e instala.
- Se a `stage` andou desde que a branch saiu, teste o que vai entrar: um worktree em `origin/stage` com `git merge --no-commit origin/<branch>`.
- Um banco por build (`DB_BRANCH`/`DB_BASE`) e o mesmo seed nos dois.

## Dados

- Só dados sintéticos. Copiar documentos de STG ou PRD é PII e o classificador nega.
- Gere documentos com os mocks dos testes do próprio repo (`src/__tests__/mock/*`), assim o formato acompanha o código.
- Inclua ao menos um documento "legado" gravado pelo driver cru, no formato anterior à mudança.
- Com dado sintético incompleto, a validação de resposta do OpenAPI dá 500. A comparação A/B separa dado ruim de regressão.
- O `default` do Mongoose só vale para documentos criados pelo model. Quem grava pelo driver cru ou `updateOne` não recebe o default: confira o documento salvo, não o schema.

### Dados reais (leitura pontual)

Para entender um caso de STG, leia sem copiar:
- `U=$(grep -E '^MONGO_DB_URI=' environments/.env | cut -d= -f2-)`, sem imprimir. Verifique se aponta para local ou remoto com `case "$U" in *localhost*) ...`.
- O `mongosh` do Homebrew falha no sandbox (SRV `ESERVFAIL`); rode fora dele. Script em arquivo, projeção mínima, nada de dump.
- Alternativa: `kubectl` com o kubeconfig de STG e `jsonpath` de uma chave. O modo automático pode bloquear o cluster.

## Terceiros

- Tudo vai para `scripts/stub.js` (porta 4010). Variáveis de URL apontam para `__STUB__` no `env.template`.
- Host fixo no código: use `node -r preload-rewrite.js` dos scripts da `backend-dev`, que reescreve os paths do cliente HTTP compartilhado (`HTTP_CLIENT_PACKAGE` indica o pacote).
- Respostas específicas vão em `projects/<repo>/stub-rules.json`. A regra tem que casar com o que o serviço envia de fato: por exemplo, o geocoding passa o endereço para minúsculas e tira acentos antes de chamar o Google.
- Quando um resultado surpreender, leia o `stub.log` antes de culpar o código.

## Kafka

- Há consumers que derrubam o processo com mensagem sem key (`key.toString()` em `null` + SIGTERM do crash handler). Ao publicar à mão, sempre mande key: `--property parse.key=true --property key.separator='|'`.
- Para sair do loop de crash: `kafka-consumer-groups.sh --reset-offsets --to-latest --topic <T> --execute`.
- Branch e base dividem o `groupId`. Teste consumer só na branch, com a base parada.
- Registre os offsets por tópico antes e depois do cenário (`kafka-get-offsets.sh`) para conferir que as duas versões produzem o mesmo.

## Medições

- Benchmark de memória ou CPU em arm64. Container amd64 no Mac roda o Node com `--no-opt` e distorce os números.
- Rota pesada em serviço com limite de memória apertado: reproduza no minikube com os limites de prod, nunca com heap snapshot em prod.
- Redis "meio aberto": `docker pause lt-redis` reproduz o comando pendurado; `docker stop` só dá conexão recusada.

## Serviços sem perfil

Observações de serviços que ainda não têm perfil (variável de banco, autenticação, dependências) ficam em `local/services.md`. Ao rodar um deles pela primeira vez, transforme a linha num perfil em `projects/`.
