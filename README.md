# 🧰 skills

Minhas skills de IA, num lugar só.

Claude, Kimi, ou o modelo da moda daqui 6 meses — a fonte da verdade é
**aqui**. As ferramentas que se virem para acompanhar

> `skills-setup` ajuda no processo.

## 📁 Estrutura

```
<nome-da-skill>/
  SKILL.md    # o cérebro 🧠 (frontmatter + instruções)
  modules/    # os detalhes, lidos só quando precisa 📚
```

Plano -> No formato que as ferramentas leem nativamente.

## 🚀 Fluxo de trabalho

Rode `/skill:skills-setup` na ferramenta alvo.

## 🧙 A skills-setup

A skill que gerencia as skills.

Detecta em qual ferramenta está rodando e faz o merge: espelha
cópias, aponta o config, e instrui o modelo a buscar o melhor jeito.

Idempotente, pode rodar sem medo. 🛡️

## 📚 Referências

- [mattpocock/skills](https://github.com/mattpocock/skills) — inspiração
  original e fonte de várias skills daqui (copiadas e adaptadas). As que
  vêm dele carregam um comentário de referência no topo do `SKILL.md`
  apontando para a original.
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
  lista curada da comunidade, inspiração e ponto de partida pra descobrir skills novas. 🌟
