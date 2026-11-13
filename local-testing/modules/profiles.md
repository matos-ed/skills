# Perfil do projeto

Cada projeto tem uma pasta `projects/<nome-do-repo>/`. Ela é a memória local do projeto: o que precisa subir, como autenticar, como semear, quais cenários existem e o que já deu errado. Ler antes de rodar e atualizar depois de rodar é o que faz a próxima execução ser mais rápida.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `profile.env` | variáveis lidas pelos scripts: `INFRA`, `TOPICS`, `BUCKET`, `BASE_REF`, `BUILD_CMD`, `ENTRY`, `HEALTH_PATH`, `PORT_BRANCH`, `PORT_BASE`, `DB_BRANCH`, `DB_BASE`; opcionais `NODE_BIN`, `NODE_ARGS`, `STUB_PORT` |
| `env.template` | `environments/.env` sintético; placeholders `__PORT__`, `__DB_NAME__`, `__STUB__`, `__LT_HOME__` |
| `profile.md` | infra, autenticação, seed, cenários, armadilhas e histórico de execuções |
| `seed.*` | dados sintéticos para os dois bancos, de preferência usando os mocks de teste do repo |
| `scenario-*.mjs` | um arquivo por fluxo; recebe `<porta> <rótulo>` e grava o resultado em `$LT_HOME/runs/<repo>/` |
| `stub-rules.json` | respostas específicas do stub de terceiros (opcional) |

Frontend e mobile usam o mesmo `profile.md`, sem `profile.env`: ver `modules/frontend-mobile.md`.

## Criar um perfil

1. Leia as variáveis que o código usa (`src/configurations/env-constants.ts` ou equivalente). Liste só os nomes do `.env` real, nunca os valores.
2. Escreva o `env.template` com valores sintéticos para todas elas: URLs de terceiros em `__STUB__`, Mongo e Kafka locais, segredos `local-*`.
3. Levante tópicos (`topic:`, `_TOPIC`, prefixo de tópicos da organização), bucket, Redis e outras filas.
4. Descubra a autenticação das rotas (Bearer, Basic, cabeçalhos assinados) a partir do middleware e dos helpers de teste.
5. Escreva o seed a partir dos mocks de teste, e um cenário para o fluxo principal.
6. Rode uma vez e anote no `profile.md` o que precisou ser ajustado.

## Atualizar depois de rodar

- **Armadilha nova:** uma linha em "Armadilhas", com o sintoma e a correção.
- **Cenário novo** que valha repetir: salve como `scenario-<fluxo>.mjs` e liste em "Cenários".
- **Histórico:** uma linha com data, tarefa e resultado (`branch = base`, ou as diferenças).
- **Regra que vale para vários projetos:** vai para o módulo certo (`backend.md`, `frontend-mobile.md`) se for genérica; se citar lib, serviço ou app interno, vai para `local/`.
- **Fato que não é de teste local** (decisão de produto, onde fica um dado): vai para a memória do Claude, não para o perfil.

## Memória do Claude

A memória automática do diretório de trabalho (`~/.claude/projects/<dir>/memory/`) guarda fatos soltos. Ao começar, procure no `MEMORY.md` o nome do repo e as palavras "local", "stub", "minikube", "worktree", "seed"; leia as memórias encontradas e traga para o perfil o que for de teste local. Ao terminar, se uma memória ficou redundante com o perfil, troque o texto dela por um ponteiro para a skill.
