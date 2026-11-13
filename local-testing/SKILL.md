---
name: local-testing
description: Teste local de qualquer projeto (backend, web ou mobile) antes de dar uma melhoria por pronta — sobe a infra local reaproveitável (Mongo Atlas Local, Kafka SASL_SSL, Redis, MinIO como bucket S3), roda a branch e a base lado a lado com .env sintético, semeia dados, executa os cenários e compara A/B. Mantém um perfil por projeto (infra, tópicos, env, seed, cenários, armadilhas) que é lido e atualizado a cada execução. Use ao testar localmente um serviço backend, um frontend web ou um app mobile, ao preparar a verificação local de um PR, ou quando o usuário pedir "roda local", "testa o upload/endpoint localmente", "sobe o ambiente".
argument-hint: "[repo ou caminho] [cenário]"
---

# Local Testing

Toda melhoria termina com o projeto rodando localmente e o comportamento conferido contra a base. Esta skill guarda **o que cada projeto precisa para subir** e melhora a cada uso: o perfil do projeto é a memória local dele.

## When to Use
- Antes de commitar, abrir ou atualizar o PR de uma mudança com efeito em runtime (backend, web ou mobile)
- Para reproduzir um bug com dados sintéticos
- Quando o usuário pedir para testar localmente, subir bucket, Kafka, Mongo ou o app

## Do Not Use When
- A mudança não tem efeito em runtime (docs, CI, comentários): diga que pulou e por quê
- O objetivo é consultar dados reais de STG: isso é leitura pontual (ver `modules/backend.md` → Dados reais)

## Workflow

1. **Carregar a memória do projeto.**
   - Perfil: `projects/<repo>/` (`profile.md`, `profile.env`, `env.template`, seeds, cenários).
   - Memória do Claude: no `MEMORY.md` do diretório de trabalho, procure linhas com o nome do repo, "local", "stub", "minikube" e "worktree", e leia essas memórias.
   - Sem perfil: crie seguindo `modules/profiles.md` antes de rodar.
   - Notas da organização: se existir `local/`, leia os arquivos de lá (libs compartilhadas e suas armadilhas, serviços ainda sem perfil, apps).
2. **Ler o código da base remota**, não o checkout local: `git fetch` e `git show origin/<padrão>:<arquivo>`.
3. **Subir a infra** com `scripts/infra.sh up $INFRA`, depois `infra.sh topics $TOPICS` e `infra.sh bucket $BUCKET`. Os containers são reaproveitados entre execuções.
4. **Subir branch e base** com `scripts/run.sh start <repo>`. Ele compila as duas versões, gera os `.env` sintéticos, sobe o stub de terceiros e espera o health.
5. **Semear e executar.** Rode o seed do perfil e os cenários que a mudança toca, nas duas portas. Cenário novo que valha repetir vai para o perfil.
6. **Comparar e reportar.** Monte uma tabela de chamada × status (branch vs base), as diferenças, o que foi simulado e o que ficou de fora. Use `scripts/ab-diff.js` em respostas grandes.
7. **Desligar.** `run.sh stop <repo>` e `infra.sh stop`, que mantém os containers. Use `infra.sh down` só quando pedirem.
8. **Atualizar a memória.** No `profile.md`: armadilhas novas, cenários, e uma linha no histórico (data, tarefa, resultado). Regra genérica que vale para vários projetos vai para `modules/`; se ela citar serviço, lib ou app interno, vai para `local/`. Fato fora do teste local vai para a memória do Claude.

## Modules (Read When Relevant)

- **Backend (Node, Mongo, Kafka): regras, infra, armadilhas** — `modules/backend.md`
- **Frontend web e mobile** — `modules/frontend-mobile.md`
- **Formato do perfil e como criar um** — `modules/profiles.md`

`projects/` e `local/` ficam só na máquina (ignorados pelo git): é onde vão os nomes de serviços, tópicos, variáveis e armadilhas de libs internas. O texto versionado da skill fica genérico.

## Scripts

| Script | Uso |
|---|---|
| `scripts/infra.sh` | `up [mongo kafka redis minio]`, `topics`, `bucket`, `status`, `stop`, `down` |
| `scripts/run.sh` | `start`/`stop`/`logs <repo>`: compila e sobe a branch e a base com o perfil |
| `scripts/stub.js` | stub HTTP de terceiros, com log de cada chamada e regras opcionais (`stub-rules.json`) |
| `scripts/mongo-reset.sh` | apaga os bancos locais antes de semear de novo |
| `scripts/ab-diff.js` | diff de respostas, normalizando ids, datas, JWT e URLs assinadas |

O estado local (certificados, logs, worktree da base, resultados) fica em `LT_HOME` (padrão `~/.local/share/local-testing`), fora dos repositórios.

## Regras que não mudam

- Nada aponta para STG ou PRD. Cada execução usa o próprio `environments/.env` sintético, gerado do `env.template`.
- Nada de copiar dados de STG ou PRD (PII). Os seeds são sintéticos e reproduzem o formato dos dados reais.
- Nunca imprima segredo. Para usar um valor do `.env` real, leia a chave exata para uma variável sem imprimir: `U=$(grep -E '^CHAVE=' environments/.env | cut -d= -f2-)`.
- Resposta vazia contra resposta vazia não prova nada: confira que o cenário produziu dados.
