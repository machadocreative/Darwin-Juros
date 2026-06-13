# 📌 Backlog — Darwin Juros

Itens identificados em diagnóstico e adiados para um momento próprio.
Prioridade: 🔴 alta · 🟡 média · 🟢 baixa.

---

## 🔒 Etapa 5 — Preparação para pagamento real

> Estes itens são pré-requisito para cobrar de verdade (não só cupons).
> Devem ser atacados juntos quando iniciarmos a etapa de pagamento.

- 🔴 **Entitlement server-authoritative.** Hoje o status premium e a validação
  de cupom são resolvidos no cliente. Antes de envolver dinheiro, mover a fonte
  da verdade do acesso premium para o servidor (entitlement gravável apenas por
  backend/webhook), com o app lendo esse entitlement. Resolve de uma vez as duas
  pendências críticas de segurança levantadas no diagnóstico.
- 🔴 **Decisão de canal de cobrança** (define a arquitetura):
  - Web (GitHub Pages): Stripe ou Mercado Pago Checkout — exige backend
    (Cloud Functions / plano Blaze) para criar a sessão e **webhook** de
    confirmação.
  - Play Store (TWA): **Google Play Billing** é obrigatório para bens digitais.
- 🟡 **Migração** dos perfis premium-via-cupom existentes para o novo modelo de
  entitlement.
- 🟡 **Restauração de compra** atrelada ao `uid` (UX de "restaurar compra").
- 🟡 **Centralizar o preço** (`R$ 10,99` está hardcoded no paywall e no CTA da
  mini-tabela) numa única constante / origem do backend.
- 🟡 **LGPD / jurídico**: política de privacidade, termos de uso e e-mail de
  suporte antes de cobrar.

---

## 🔄 Sincronização

- 🟡 **Service Worker / PWA offline real.** O app se anuncia "offline" mas não há
  `sw.js`; hoje o offline depende do cache quente do navegador. Para PWA de
  verdade (e requisito de loja), implementar SW com cache de assets, versionamento
  e fluxo de atualização. É uma feature com design próprio — fazer em etapa
  dedicada.
- 🟢 **Tie-breaker por servidor.** O desempate do merge usa `savedAt` (relógio do
  dispositivo). Avaliar usar `serverTimestamp` como critério adicional para
  reduzir efeito de relógio adiantado/atrasado.
- 🟢 **Expiração de tombstones na nuvem.** As marcas de exclusão em
  `users/{uid}/excluidos` nunca expiram (acúmulo inofensivo). Limpeza periódica
  futura (o lado local já tem TTL de 90 dias).

---

## 🔐 Segurança — ações manuais (Firebase Console)

> Não são alterações de código; precisam ser feitas no painel.

- 🟡 **Restringir a API key** do Firebase no Console: HTTP referrer para o
  domínio do GitHub Pages e, depois, ativar **App Check**.
- 🟡 **Preencher `ADMIN_UIDS` / `isAdmin()`** com o UID real (em
  `tools/gerador-cupons.html` e `firestore.rules`) e **republicar as rules**.
- 🟡 **Republicar `firestore.rules`** sempre que o arquivo do repo mudar
  (a publicação não é automática).

---

## ♿ Acessibilidade / UX

- 🟢 Revisar contraste e navegação por teclado nas telas principais (passada
  geral de a11y antes da loja).
