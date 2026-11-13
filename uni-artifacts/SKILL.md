---
name: uni-artifacts
description: Visual padrão Quero Delivery (Uni Design System) para Artifacts, páginas HTML, relatórios, dashboards e gráficos — tokens de cor, fonte Montserrat, raios, sombras, tema escuro derivado e paleta de gráficos validada para daltonismo. Load ANTES de escrever qualquer artifact ou página HTML para o time/organização, junto com artifact-design e dataviz; os tokens daqui substituem as escolhas de paleta e fonte dessas skills.
---

# Artifacts no padrão Uni

Todo artifact (relatório, dashboard, página, protótipo HTML) usa as cores, a
fonte e os raios do **Uni**, o design system da Quero Delivery. Esta skill
entrega os tokens prontos e as regras de uso. As skills `artifact-design` e
`dataviz` continuam valendo para layout, contrato da página e anatomia dos
gráficos. **Paleta, fonte e cantos vêm daqui, não delas.**

Fonte da verdade:
- código: `~/quero/frontend/uni/packages/tokens/src/colors.ts` e
  `src/themes/base/*.ts` (branch `main`)
- documentação: https://querodelivery.github.io/uni/?path=/story/come%C3%A7ar-tokens--tokens

## Regras

1. **Só valores do Uni.** Nenhum hex fora das escalas de `colors.ts`. Se faltar
   cor para um papel, use a escala mais próxima e anote no `:root`. Nunca
   invente uma cor.
2. **Nomes de token iguais aos do Uni**: `--uni-color-*`, `--uni-border-radius-*`,
   `--uni-shadow-*`, `--uni-font-*`. Assim um trecho do artifact pode ir para o
   código de produção sem renomear nada.
3. **Roxo é a cor de ação e de destaque** (`action-fill`, `text-highlight`).
   O **amarelo é exclusivo de CTA** (`cta-fill` com texto roxo). Não use o
   amarelo como cor de série nem como destaque decorativo.
4. **Cores de status ficam reservadas**: danger, warning, success e info servem
   só para indicar estado (alta de custo, erro, ok, aviso). Elas sempre vêm
   acompanhadas de rótulo ou ícone e nunca viram cor de série em gráfico.
5. **Montserrat em todo o texto**, que é o `font-family-sans` do Uni. Use
   `font-variant-numeric: tabular-nums` em números alinhados. Código e IDs vão
   em monospace do sistema, porque o Uni não define fonte mono.
6. **O tema escuro é derivado.** O Uni só publica o tema claro. O bloco escuro
   abaixo foi montado só com as escalas `graphite` e `gray` e o roxo claro.
   Ele não é oficial, então não leve esses valores para produto.

## Bloco de tokens (copiar no topo do `<style>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap">
```

```css
:root {
  /* Uni — tema claro oficial (@querodelivery/uni-tokens) */
  --uni-color-base-surface: #ffffff;   /* gray.1 — cards */
  --uni-color-base-fill: #f9f9f9;      /* gray.2 — fundo da página */
  --uni-color-base-border: #d6d6d6;    /* gray.4 */
  --uni-color-base-border-2: #acacac;  /* gray.5 */
  --uni-color-base-icon: #707070;
  --uni-color-text-primary: #242424;   /* graphite.3 */
  --uni-color-text-secondary: #525252; /* graphite.2 */
  --uni-color-text-supporting: #707070;/* graphite.1 */
  --uni-color-text-highlight: #9B4DEE; /* purple.3 */
  --uni-color-action-fill: #9B4DEE;
  --uni-color-action-on-fill: #ffffff;
  --uni-color-action-surface: #F2E7FD; /* purple.1 */
  --uni-color-action-on-surface: #510080;
  --uni-color-cta-fill: #f7eb48;
  --uni-color-cta-on-fill: #9B4DEE;
  --uni-color-danger-surface: #ffe7e6;  --uni-color-danger-on-surface: #910803;  --uni-color-danger-fill: #fb3730;
  --uni-color-warning-surface: #fdf2e2; --uni-color-warning-on-surface: #734607; --uni-color-warning-fill: #f19920;
  --uni-color-success-surface: #eaf6ea; --uni-color-success-on-surface: #193518; --uni-color-success-fill: #4ba047;
  --uni-color-info-surface: #d7e3fe;    --uni-color-info-on-surface: #02246e;    --uni-color-info-fill: #105bfb;
  /* gráficos — ordem fixa, validada (ver seção Gráficos) */
  --viz-1: #9B4DEE; --viz-2: #E0457B; --viz-3: #3a7c37; --viz-4: #105bfb; --viz-5: #d3800d;
  --viz-grid: #f2f2f2; --viz-axis: #d6d6d6;
  /* forma */
  --uni-font-family-sans: Montserrat, system-ui, -apple-system, "Segoe UI", sans-serif;
  --uni-font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --uni-border-radius-xxs: 4px; --uni-border-radius-xs: 8px; --uni-border-radius-sm: 12px;
  --uni-border-radius-md: 16px; --uni-border-radius-lg: 24px; --uni-border-radius-pill: 500px;
  --uni-shadow-100: 0px 1px 0px 0px rgba(26, 26, 26, 0.07);
  --uni-shadow-300: 0px 4px 6px -2px rgba(26, 26, 26, 0.20);
}
/* Escuro derivado (não oficial) — mesmas variáveis */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { UNI_DARK } }
:root[data-theme="dark"] { UNI_DARK }
body { background: var(--uni-color-base-fill); color: var(--uni-color-text-primary); font-family: var(--uni-font-family-sans); }
```

Troque `UNI_DARK` nos dois lugares por este conteúdo (CSS não tem mixin, então
o bloco vai repetido):

```css
color-scheme: dark;
--uni-color-base-surface: #0d0d0d;   /* graphite.4 */
--uni-color-base-fill: #000000;      /* graphite.5 */
--uni-color-base-border: #242424;    /* graphite.3 */
--uni-color-base-border-2: #525252;
--uni-color-base-icon: #acacac;
--uni-color-text-primary: #f9f9f9;   /* gray.2 */
--uni-color-text-secondary: #d6d6d6; /* gray.4 */
--uni-color-text-supporting: #acacac;/* gray.5 */
--uni-color-text-highlight: #D0B8F9; /* purple.2 */
--uni-color-action-surface: #510080; --uni-color-action-on-surface: #F2E7FD;
--uni-color-danger-surface: #910803;  --uni-color-danger-on-surface: #ffe7e6;
--uni-color-warning-surface: #734607; --uni-color-warning-on-surface: #fdf2e2;
--uni-color-success-surface: #193518; --uni-color-success-on-surface: #eaf6ea;
--uni-color-info-surface: #02246e;    --uni-color-info-on-surface: #d7e3fe;
--viz-grid: #242424; --viz-axis: #525252;
```

## Papéis mais comuns

| Papel | Token |
|---|---|
| fundo da página / card | `base-fill` / `base-surface` + borda `base-border`, raio `xs` (8px) ou `sm` (12px) |
| título, texto, legenda | `text-primary`, `text-secondary`, `text-supporting` |
| link, número em destaque, eyebrow | `text-highlight` |
| linha ou chip destacado | fundo `action-surface`, texto `action-on-surface` |
| botão principal / CTA | `action-fill` + `action-on-fill` / `cta-fill` + `cta-on-fill` |
| piorou (custo subiu, erro) | texto `danger-on-surface`, ou chip `danger-surface` |
| melhorou / ok | `success-on-surface` / `success-surface` |
| atenção | `warning-on-surface` / `warning-surface` |

Escala de fonte do Uni em px: 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 56. Pesos:
400, 500, 600 e 700. Títulos em 600 ou 700 com `letter-spacing: -0.3px`.
Espaçamento em múltiplos de 4px.

## Gráficos

Todas as séries usam `--viz-1` a `--viz-5`, **sempre nesta ordem**: roxo,
vinho, verde, azul e laranja. Siga a `dataviz` para a anatomia: linhas de 2px,
tooltip, legenda e rótulos com as cores de texto.

A paleta foi validada com `dataviz/scripts/validate_palette.js` em 21/10/2026:

| Uso | Séries | Resultado |
|---|---|---|
| linhas e barras lado a lado, tema claro (fundo `#ffffff`) | até **5** | passa em todos os checks; pior par para daltônicos ΔE 11,3 |
| linhas e barras lado a lado, tema escuro (fundo `#0d0d0d`) | até **4** | passa em todos os checks |
| dispersão, mapa, barras coloridas por categoria (todos os pares) | até **3** | passa nos dois temas |

- Acima do limite, agrupe em "Outros" com `text-supporting` ou divida em
  gráficos pequenos.
- **No tema escuro, a 5ª série não existe**: o laranja sai da faixa de
  luminosidade. Use até 4.
- **Fundo dos gráficos no escuro**: use `base-surface` (`#0d0d0d`). Sobre
  `#242424`, o azul fica abaixo de 3:1.
- Não use roxo e azul juntos num gráfico de 2 cores por categoria: para
  daltônicos eles se confundem quando não são vizinhos. Use roxo e vinho, ou
  roxo e verde.
- Se mudar a paleta, rode o validador de novo:
  `node <dataviz>/scripts/validate_palette.js "<hexes>" --mode light --surface "#ffffff"`
  e `--mode dark --surface "#0d0d0d"`.

## Atualizar os tokens

O Uni muda pouco, mas confira antes de um artifact importante:

```bash
cd ~/quero/frontend/uni && git fetch -q origin && git show origin/main:packages/tokens/src/colors.ts
```

Se alguma escala mudar, atualize esta skill em `~/dev/skills/uni-artifacts`
e rode `skills-setup` para copiar para `~/.claude/skills`.
