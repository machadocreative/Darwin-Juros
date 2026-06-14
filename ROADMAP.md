# 🗺️ Roadmap até a Play Store — Darwin Juros

Plano completo, em fases, do que falta para publicar o app com pagamento real.
Pensado para ser seguido por etapas, respeitando as dependências entre elas.

## Como ler este documento

Cada passo tem uma etiqueta de **quem executa**:
- **[Você]** — decisão sua, conteúdo, ou ação em painel/conta externa.
- **[Código]** — eu implemento no código.
- **[Externo]** — depende de terceiro (Google, advogado, conta paga).

Tamanho relativo: 🟢 pequeno · 🟡 médio · 🔴 grande.

**Caminho crítico:** Fase 0 → Fase 1 → (Fase 2 → Fase 3). As Fases 4 (legal) e
parte da 5 podem correr em paralelo. A Play Store (Fase 5) só fecha com 1, 3 e 4 prontas.

---

## Fase 0 — Consolidar o que já existe 🟢
*Objetivo: deixar o que já foi feito no ar e funcionando, antes de construir por cima.*

1. **[Você+Código]** Commitar e publicar todo o trabalho acumulado desta fase
   (correções de cálculo, sync, máscaras, segurança, UI). Hoje está tudo local.
2. **[Você]** **Republicar o `firestore.rules`** no Firebase Console
   (Firestore → Regras → Publicar). ⚠️ *Mais urgente:* o código já espera as
   regras novas (subcoleção `excluidos`, validação de cupom). Sem republicar, a
   sincronização de exclusões e o rastreio de cupons não funcionam direito.
3. **[Você]** Preencher seu **UID real** no lugar de `COLE_SEU_UID_AQUI` em dois
   arquivos (`tools/gerador-cupons.html` e `firestore.rules`) e republicar as regras.
4. **[Você]** No Console, **restringir a API key** (HTTP referrer para o domínio
   do app).
5. **[Você]** Re-testar a sincronização entre 2 dispositivos depois de tudo acima.

---

## Fase 1 — PWA offline de verdade 🟡
*Objetivo: o app virar um PWA instalável e funcional sem internet. Pré-requisito da Play Store.*

1. **[Código]** Criar um **service worker** (`sw.js`): cache dos arquivos
   (HTML, CSS, JS, ícones, `tr-historico.json`), com **versionamento** e
   **fluxo de atualização** (não servir versão velha após deploy).
2. **[Código]** Registrar o service worker no app e revisar o `manifest.json`
   para instalabilidade completa.
3. **[Você]** Testar "Adicionar à tela inicial" no celular e rodar o **Lighthouse**
   (auditoria PWA do Chrome) até passar verde.

> Bônus: com o `tr-historico.json` em cache, o aviso de "falha ao carregar TR"
> que adicionamos quase nunca dispara.

---

## Fase 2 — Backend de segurança (antes de qualquer dinheiro) 🔴
*Objetivo: tirar do cliente o que não pode ficar no cliente. Pré-requisito de pagamento.*

> Hoje o status "premium" e a validação de cupom são resolvidos no navegador —
> qualquer pessoa com conhecimento técnico consegue se conceder premium de graça.
> Aceitável com cupons-cortesia; **inaceitável cobrando de verdade.**

1. **[Você/Externo]** Ativar o **plano Blaze** do Firebase (pague-por-uso; tem
   cota grátis generosa — provavelmente custo zero no início).
2. **[Código]** Criar **Cloud Functions** (backend) que passam a ser a fonte da
   verdade do acesso premium (um "entitlement" que só o servidor escreve).
3. **[Código]** Mover a validação de cupom para o servidor (o segredo do cupom
   sai do app público).
4. **[Código]** O app passa a **ler** o entitlement em vez de confiar no flag local.
5. **[Você]** Testar que não dá mais para "virar premium" pelo navegador.

---

## Fase 3 — Pagamento real 🔴
*Objetivo: vender o premium de fato. Depende inteiramente da Fase 2.*

1. **[Você]** **Decisão-chave:** canal de cobrança (ver seção "Decisões" abaixo).
   Para Play Store, o caminho é o **Google Play Billing** (obrigatório para
   produtos digitais).
2. **[Externo/Código]** Integrar o Play Billing (no app empacotado) + verificação
   da compra no backend (Cloud Function que confirma o pagamento com o Google).
3. **[Código]** **Migrar** os perfis que já são premium-via-cupom para o novo modelo.
4. **[Código]** UX de **"restaurar compra"** (recuperar o premium num aparelho novo).
5. **[Código]** **Centralizar o preço** num único lugar (hoje `R$ 10,99` está
   escrito em 2 pontos do código).

---

## Fase 4 — Conformidade legal e de loja 🟡
*Pode ser feita em paralelo às Fases 1–3. Obrigatória para publicar.*

1. **[Você/Externo]** **Política de Privacidade** e **Termos de Uso** (idealmente
   revisados por alguém de jurídico — a Play exige a URL da política).
2. **[Você]** **E-mail de suporte** visível no app e na ficha da loja.
3. **[Código]** Telas/links no app apontando para esses documentos.
4. **[Você]** Preencher o formulário **"Segurança dos dados"** da Play (o que o
   app coleta — no caso, conta Google e dados de simulação).

---

## Fase 5 — Empacotamento e publicação na Play Store 🔴
*Fechamento. Precisa das Fases 1, 3 e 4 prontas.*

1. **[Você/Externo]** Criar a **conta de desenvolvedor Google Play** (US$ 25,
   pagamento único).
2. **[Você]** **Decisão:** domínio próprio? (ver "Decisões"). Afeta o passo 4.
3. **[Código]** Gerar o pacote **TWA** (app Android que embrulha o PWA), via
   PWABuilder ou Bubblewrap.
4. **[Você/Código]** Configurar o **Digital Asset Links** (`assetlinks.json`) —
   prova que você é dona do domínio. (Tem uma pegadinha com GitHub Pages — ver
   "Decisões".)
5. **[Você]** Preparar a **ficha da loja**: ícone, screenshots, descrição,
   classificação de conteúdo.
6. **[Você]** Publicar em **teste interno → fechado → produção** (a Google
   recomenda subir por etapas).

---

## 🔑 Decisões que só você pode tomar (quando chegarmos nelas)

- **Canal de cobrança:** Play Store (Play Billing) vs. web (Stripe/Mercado Pago).
  Se o objetivo é a Play Store, é Play Billing.
- **Domínio próprio** (ex.: `darwinjuros.com.br`) vs. continuar no
  `machadocreative.github.io`. Um domínio próprio simplifica o `assetlinks.json`
  da Play Store e passa mais credibilidade; tem custo anual de registro.
- **Modelo de preço:** manter pagamento único por perfil, ou rever (ex.: por conta).

---

## 💰 Custos previstos

- **Google Play** — US$ 25, uma vez.
- **Firebase Blaze** — pague-por-uso, com cota grátis; provável R$ 0 no começo.
- **Domínio próprio** — opcional, ~R$ 40/ano se optar.
- **Jurídico** — opcional, se contratar revisão dos termos.

---

## 🔄 Como funcionam os updates DEPOIS de publicado

A chave é entender o que é o app da Play Store no nosso caso: um **TWA** é uma
casca Android fininha que **abre o seu site** (GitHub Pages). O "miolo" do app
continua sendo a web. Por isso:

| O que você muda | Como atualiza | Passa pela Play Store? |
|---|---|---|
| HTML, CSS, JS (telas, cálculo, textos, UX) | `git push` → GitHub Pages | ❌ **Não** — vai pro ar na hora\* |
| `firestore.rules` | Republicar no Console | ❌ Não |
| Cloud Functions (backend) | Deploy no Firebase | ❌ Não |
| Ícone/nome do app, versão, config do TWA, integração nativa do Play Billing, atualização de SDK | Subir **novo pacote (AAB)** na Play | ✅ **Sim** — passa por revisão do Google |

\* *sujeito ao cache do **service worker**: o conteúdo novo está no servidor na
hora, mas o usuário pode ver a versão em cache até o SW atualizar. A velocidade
disso é controlada pela estratégia de atualização que eu configuro na Fase 1.*

**Traduzindo:** ~95% do seu trabalho do dia a dia (ajustar uma tela, corrigir um
cálculo, mudar um texto) **não toca a Play Store** — é o mesmo fluxo de hoje. Só
mexe na loja quando muda a *casca* (raro, depois de configurada).

**O que passa pela revisão do Google** (e como é):
- Você sobe um novo pacote (AAB) com o número de versão incrementado.
- A revisão costuma levar de algumas horas a poucos dias.
- Dá pra liberar por etapas (ex.: 10% dos usuários primeiro) e o update chega
  sozinho no celular (auto-update).

**É complexo mexer depois de publicado?**
- **Conteúdo/web:** não — tão fácil quanto hoje.
- **Backend/regras:** não passa pela loja; atualiza direto no Firebase.
- **A casca Android:** moderado, mas raro. O incômodo recorrente mais comum é a
  Google exigir, ~1x por ano, recompilar para uma versão de SDK mais nova.
- **Atenção:** uma versão nativa ruim não se desfaz instantaneamente (depende de
  novo release). Já um problema no conteúdo web, você corrige na hora com um push.

---

## ✅ Já concluído nesta jornada (para referência)

- Modelo de sincronização local-first com tombstones na nuvem (exclusões convergem).
- Validação extensa do núcleo de cálculo + documentação ([CALCULO.md](CALCULO.md)).
- Correções de máscaras de input, validações e arredondamento.
- Cupom de uso único via Firestore + ferramenta de rastreio.
- Endurecimento parcial das regras de segurança.
- Limpeza de código (debug, duplicações) e melhorias de UX.
