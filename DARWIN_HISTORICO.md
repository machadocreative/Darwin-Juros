# Darwin — Histórico de Desenvolvimento

> Aplicativo mobile para simulação de juros de evolução de obra (financiamento imobiliário CAIXA).
> Desenvolvido em Vanilla JavaScript, hospedado via GitHub Pages como PWA.

---

## Visão Geral do Produto

**Problema resolvido:** Compradores de imóveis na planta não são informados com clareza pelos bancos ou corretores sobre os valores que pagarão mês a mês durante a obra. O Darwin traduz essa complexidade em linguagem acessível.

**Público-alvo:** Compradores de imóveis financiados pela CAIXA Econômica Federal, especialmente pelo MCMV. Sem exigência de conhecimentos em matemática financeira.

**Modelo de negócio:** Gratuito com freemium. O primeiro perfil é grátis; perfis adicionais (e funcionalidades avançadas) são desbloqueados via plano Premium.

**Stack:** Vanilla JS + HTML + CSS. Sem frameworks. Sem build tools. Totalmente editável manualmente.

---

## Fase 1 — Conceito e Planilha Original

- Ponto de partida: planilha Excel com fórmulas para cálculo dos juros de obra CAIXA
- Identificação da dor: usuários não conseguem usar a planilha sem conhecimento de Excel
- Decisão: transformar a planilha em um app com fluxo de perguntas guiadas
- Referência técnica principal: `TEMPLATE____Juros_de_Obra_CAIXA.xlsx` e `Cartilha_Juros_Fase_de_Obras.pdf`

---

## Fase 2 — MVP Inicial (Fluxo A — Onboarding Completo)

**Estrutura inicial do app:**

- Fluxo único de onboarding com 7 perguntas (depois reduzido para 6 com merge de telas de datas)
- Cada pergunta corresponde a uma célula da planilha original
- Tela de resultado com tabela de parcelas mês a mês
- Múltiplos perfis por usuário (ex: "Apto 101", "Apto 102")
- Paywall com cupom (`DARWIN10`) para desbloquear perfis adicionais

**Arquivos criados nessa fase:**
`state.js`, `calculator.js`, `onboarding.js`, `result.js`, `paywall.js`, `format.js`, `storage.js`, `ui.js`, `main.js`, `index.html`, `style.css`, `manifest.json`

---

## Fase 3 — Modularização do JavaScript

- Refatoração do código monolítico para arquitetura modular
- Cada responsabilidade passou a ter seu próprio arquivo `.js`
- Essa mudança preparou o terreno para adicionar novos fluxos sem bagunçar o código existente
- Introdução do `flowEngine.js` para orquestrar os fluxos de tela

---

## Fase 4 — Bifurcação de Fluxos (Rápido vs. Completo)

**Problema identificado:** O onboarding completo era longo demais para quem só queria uma estimativa rápida.

**Solução:** Tela de bifurcação na entrada, com dois caminhos:

### Simulação Rápida (`quickSim.js`)
- 5 a 6 perguntas (fluxo curto)
- Pergunta o que o usuário já sabe: valor financiado, saldo devedor, taxa, % da obra, mês da medição
- Resultado com slider interativo para explorar cenários futuros
- Parcela de financiamento (opcional) com aviso de ultrapassagem
- CTA para migrar para a Simulação Completa

### Simulação Completa (`onboarding.js`)
- 6 perguntas (reduzido de 7 com merge das telas de data)
- Calcula projeção completa mês a mês até a entrega
- Mini-tabela inline de histórico de pagamentos já realizados
- Pré-preenchimento automático dos dados trazidos da Simulação Rápida

**Arquivo abolido:** `fluxoB.js` → substituído pelo `quickSim.js`

---

## Fase 5 — Integração da TR (Taxa Referencial)

- Criado arquivo `tr-historico.json` com histórico mensal da TR (puro JSON, sem ES modules)
- Carregamento assíncrono na inicialização via `_carregarTRHistorico()` em `main.js`
- Helper global `getTRParaMes(ym)` retorna o valor decimal por mês
- `calculator.js` e `adicionarLinha()` passaram a consumir a TR real por linha
- Sliders usam TR=0 por design (exibido como "+ TR Mensal" na interface)
- Diff-box da tela de taxa mantém "0,1000%" como referência didática apenas
- Adicionado `trhistorico.js` para exibir histórico na tela de Educação

---

## Fase 6 — Tela de Resultado (result.js)

Reestruturação completa da tela de resultado:

- Nova ordem dos elementos: header com botão de exclusão → cards de resumo → slider → banner de parcelas pendentes → tabela inline (premium)
- **Slider tricolor:** faixa verde (pagas) + faixa laranja (simulação) + faixa cinza (vazio), ancorado na última % paga
- **Banner "parcelas pendentes":** inline, universal para todos os perfis (não só Fluxo B)
- **Botão de exclusão** com dupla confirmação no header
- **Tabela inline** de parcelas para usuários Premium
- Diferenciação de step do slider: free (5%) vs premium (1%)
- Função `perguntarMarcarPagas` inline e sem vínculo com fluxo específico

---

## Fase 7 — Tela Inicial (home.js)

- Criada tela `home.js` separada para gerenciar a listagem de perfis
- Cards de perfil com nome, status (grátis/premium) e acesso rápido
- Botão "+ Nova Simulação" que aciona a bifurcação de fluxos
- Cards "Em breve" visíveis na home: Exportar Excel, Exportar Imagem, Banco vs. Realidade, Timeline Visual, Calendário

---

## Fase 8 — Modularização dos Inputs (questions.js)

- Criado `questions.js` para centralizar todos os inputs reutilizáveis entre quickSim e onboarding
- Cada questão tem: `render()`, `validate()`, `init()`, máscara e chave do campo
- IDs centralizados no objeto `QUESTION_IDS`
- Questões compartilhadas usam a versão do quickSim como referência
- Preparação para migração futura quickSim → onboarding com pré-preenchimento

---

## Fase 9 — Tela de Educação (`educacao.js`)

- Cards de vídeo (3 cards com descrição orientada à dúvida do usuário)
- Artigos disponíveis (não mais "Em breve"): Glossário, Como o Darwin calcula, Direitos do comprador
- Cada artigo em formato `eac` (edu-article-card) com termos e definições em seções separadas
- CSS dedicado: `.edu-article-card`, `.eac-header`, `.eac-term`, etc.

---

## Fase 10 — Identidade Visual e PWA

- Design system: cores via CSS variables, tipografia DM Sans + DM Mono
- Identidade visual consistente com paleta verde-escuro como cor primária
- `manifest.json` configurado para instalação como PWA
- OG Image criada (2400×1260px) para compartilhamento em redes sociais e WhatsApp
- App testado via GitHub Pages com 3 usuários reais (beta inicial)

---

## Fase 11 — Preparação para Google Play

**Discussão sobre timing de publicação:**

- Funcionalidades prontas: simulação rápida + completa, slider, tabela, perfis, paywall (cupom), educação, histórico TR, tela Sobre, PWA
- Pendências identificadas antes da Play Store:
  1. **Pagamento Premium real** — botão "Pagar" desabilitado; apenas cupom funciona hoje. Decisão pendente: gateway (Stripe/Mercado Pago) ou liberar acesso via cupom durante beta
  2. **Feedback dos usuários beta** — coletar retorno estruturado antes de publicar (3 perguntas diretas)
- Funcionalidades "Em breve" não são bloqueantes para publicação

---

## Estado Atual dos Arquivos (junho/2026)

| Arquivo | Responsabilidade |
|---|---|
| `main.js` | Inicialização, roteamento de telas, carregamento da TR |
| `state.js` | Variáveis globais, `form`, `meses`, flags de estado |
| `calculator.js` | Cálculo da tabela de parcelas, `calcTable()`, `recalcRow()` |
| `flowEngine.js` | Orquestrador de fluxos de tela |
| `flows.js` | Definição dos fluxos disponíveis |
| `onboarding.js` | Simulação Completa (6 perguntas) |
| `quickSim.js` | Simulação Rápida (5-6 perguntas) |
| `questions.js` | Inputs reutilizáveis centralizados |
| `result.js` | Tela de resultado, slider, tabela, marcação de pagas |
| `home.js` | Tela inicial com listagem de perfis |
| `paywall.js` | Tela de upgrade Premium, validação de cupom |
| `educacao.js` | Tela de educação (vídeos + artigos) |
| `trhistorico.js` | Tela de histórico da TR |
| `format.js` | Máscaras de input, formatação de moeda/percentual |
| `storage.js` | Salvar/carregar perfis no localStorage |
| `ui.js` | Componentes genéricos de UI (toasts, lembrete de salvar) |
| `style.css` | Design system completo |
| `index.html` | Shell do app, carregamento dos módulos |
| `manifest.json` | Configuração PWA |

---

## Roadmap Futuro (funcionalidades planejadas)

- [ ] Exportar resultado como imagem para compartilhar
- [ ] Exportar tabela como Excel
- [ ] Banco vs. Realidade (comparar projeção original com valores reais pagos)
- [ ] Timeline visual das parcelas
- [ ] Calendário de vencimentos
- [ ] Notificações/lembretes (suporte PWA)
- [ ] Gráficos de evolução da obra e da TR
- [ ] Calculadora reversa ("quanto poupar até a entrega?")
- [ ] Compartilhamento de perfil (link read-only para cônjuge)
- [ ] Modo escuro
- [ ] Integração de gateway de pagamento (Stripe ou Mercado Pago) para Premium real
- [ ] Conteúdo educativo em vídeo

---

*Documento gerado em junho de 2026. Atualizar a cada fase relevante de desenvolvimento.*
