# AGENTS.md — Regras de trabalho neste projeto

Este arquivo vale pra qualquer assistente de IA (Claude, ChatGPT, Gemini, etc.) que for mexer neste repositório. Leia antes de fazer qualquer alteração.

## Contexto do projeto

Este é o sistema interno da **LB Marketplace** — uma agência de gestão de marketplace (Shopee, Mercado Livre, TikTok Shop, Shein). O sistema principal (`clienteslb`) é um **único arquivo HTML** (`index.html`), sem processo de build, hospedado no GitHub Pages. Não há Node.js, npm, bundler ou pipeline de CI/CD.

O time é pequeno (o dono + poucas colaboradoras) e **ninguém no time programa** — todo o código é mantido com ajuda de assistentes de IA. Por isso, as regras abaixo são propositalmente **simples e leves**, sem ferramentas de engenharia de software pesadas (sem lint, sem testes automatizados, sem pipeline de observabilidade paga) — isso seria desproporcional ao tamanho do projeto.

## Regra 1 — Toda mudança relevante vira uma Issue

Antes de fazer uma correção, melhoria ou funcionalidade nova, **crie uma Issue no GitHub** descrevendo:
- O que será feito (correção / melhoria / funcionalidade nova)
- Por que (qual problema resolve, ou qual pedido do dono da empresa)

## Regra 2 — Mudanças passam por Pull Request

Não edite o `index.html` (ou qualquer arquivo do repositório) direto na branch principal quando possível. Prefira:
1. Criar uma branch nova a partir da Issue
2. Abrir um **Pull Request (PR)**
3. **Mencionar a Issue na descrição do PR** (ex: `Closes #12`)
4. Só então mesclar (merge) na branch principal

**Exceção:** como o time não usa Git localmente (edita direto pela interface do GitHub), é aceitável commitar direto na `main` para correções urgentes — mas ainda assim, registre a Issue correspondente, mesmo que já fechada, para manter o histórico.

## Regra 3 — Sempre valide antes de entregar

Antes de entregar qualquer arquivo `.html` ou `.js` pro dono da empresa colar no GitHub:
- Confirme que a sintaxe JavaScript está correta (sem erros de parênteses/chaves faltando)
- Confirme que nenhuma função usada em `onclick=""`/`onblur=""` ficou faltando o prefixo `window.` (esse projeto usa `<script type="module">`, então funções chamadas por atributos HTML **precisam** estar em `window.nomeDaFuncao`)
- Nunca corte um arquivo no meio — sempre entregue o arquivo completo

## Regra 4 — O dono da empresa não edita código manualmente

Sempre entregue o arquivo **pronto pra colar**, com passo a passo claro de onde subir (qual repositório, qual arquivo, GitHub Pages vs Vercel).

## O que este projeto **não usa** (e por quê)

- **Testes automatizados / Playwright / Codecov**: desproporcional a um projeto de arquivo único mantido sem programadores.
- **Lint / Biome / ESLint / Knip / Stryker**: mesma razão — exigiria criar um pipeline de build que não existe hoje.
- **Datadog / NewRelic / OpenTelemetry**: ferramentas de observabilidade de infraestrutura complexa, não fazem sentido pra um app estático + Firebase usado por poucas pessoas.
- **Monitoramento de erro leve (opcional)**: se quiser saber quando algo quebra na tela de um usuário real, uma opção leve e gratuita é o Sentry (só um `<script>` no `<head>`, sem precisar de build) — mas isso é opcional, não obrigatório.
