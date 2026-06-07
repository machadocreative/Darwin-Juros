// ── PRÉ-PAYWALL: tela de confirmação antes do pagamento ──
function showPrePaywall() {
  screen = 'prePaywall';
  _navPush('prePaywall');
  showBottomNav();

  const mesLabel = form.mesInicial ? mLabelFull(form.mesInicial) : '(não informado)';
  const vtLabel  = form.valorTotal  ? fmtBRL(parseFloat(form.valorTotal)) : '(não informado)';

  setHtml(`
    <div class="result-header" style="margin-bottom:20px">
      <h2>🔓 Liberar Premium</h2>
      <p>Após o desbloqueio, os campos abaixo serão bloqueados para edição. Confirme antes de prosseguir.</p>
    </div>

    <div class="result-card large" style="margin-bottom:8px">
      <div class="card-large-left">
        <div class="qrc-label">Data de início</div>
        <div class="qrc-note">Bloqueado após desbloqueio</div>
      </div>
      <div class="qrc-val" style="font-size:18px">🔒 ${mesLabel}</div>
    </div>

    <div class="result-card large" style="margin-bottom:16px">
      <div class="card-large-left">
        <div class="qrc-label">Valor total do imóvel</div>
        <div class="qrc-note">Bloqueado após desbloqueio</div>
      </div>
      <div class="qrc-val" style="font-size:18px">🔒 ${vtLabel}</div>
    </div>

    <div class="info-box" style="margin-bottom:20px">⚠️ Estes dados não poderão ser editados depois. Para usar outros valores, crie uma nova simulação.</div>

    <button class="btn btn-primary" onclick="showPaywall()" style="margin-top:0">Prosseguir para pagamento →</button>
    <button class="btn btn-back" onclick="editarSimulacao()" style="margin-top:10px;color:var(--text);font-weight:600">✏️ Editar dados antes de prosseguir</button>
    <button class="btn btn-back" onclick="history.back()" style="margin-top:8px">← Voltar</button>
  `);
}

// ── PAYWALL ──
function showPaywall() {
  const existing = document.getElementById('paywall-overlay');
  if (existing) existing.remove();

  const mesIniLabel = form.mesInicial
    ? `<div class="confirm-box" style="margin:8px 0 0;text-align:left">
        <div class="c-label">Data de início atual</div>
        <div class="c-val">${mLabelFull(form.mesInicial)}</div>
      </div>`
    : '';

  const vtLabel = form.valorTotal
    ? `<div class="confirm-box" style="margin:8px 0 0;text-align:left">
        <div class="c-label">Valor total do imóvel atual</div>
        <div class="c-val">${fmtBRL(parseFloat(form.valorTotal))}</div>
      </div>`
    : '';

  const overlay = document.createElement('div');
  overlay.id        = 'paywall-overlay';
  overlay.className = 'paywall-overlay';
  overlay.innerHTML = `
    <div class="paywall-card">
      <div class="paywall-icon">🔓</div>
      <div class="paywall-title">Libere funcionalidades premium</div>
      <div class="paywall-sub">Previsão e acompanhamento de parcelas mês a mês com maior precisão · % de evolução de obra para cada prestação · Histórico de parcelas pagas com o valor da Taxa Referencial · Mais funcionaliades em breve </div>
      <div class="info-box" style="margin:14px 0 0;text-align:left">⚠️ <strong>Atenção:</strong> O desbloqueio é feito individualmente para cada perfil. Após o pagamento, alguns dados ficam bloqueados para edição. A <strong>data de início</strong> e o <strong>valor total do imóvel</strong> não poderão mais ser editados.<br>Caso deseje corrigir estes dados, realize esta correção e confirme antes de prosseguir.</div>
      ${mesIniLabel}
      ${vtLabel}
      <div class="paywall-price">
        <span class="paywall-amount">R$ 10,99</span>
        <span class="paywall-terms">Pagamento único · Sem assinatura</span>
      </div>
      <button class="paywall-btn-pay" disabled title="Em breve">💳 Pagar</button>
      <button class="paywall-btn-cupom" onclick="showCupomInput()">🎟️ Tenho um cupom de desconto</button>
      <div id="cupom-area" style="display:none">
        <input type="text" id="cupom-input" placeholder="Digite seu cupom" maxlength="20"
          style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:var(--font);font-size:14px;margin-top:8px;text-transform:uppercase;letter-spacing:.08em;outline:none;">
        <button class="paywall-btn-aplicar" onclick="aplicarCupom()">Aplicar cupom</button>
      </div>
      <button class="paywall-btn-voltar" onclick="closePaywall()">← Voltar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePaywall(); });
}

function closePaywall() {
  document.getElementById('paywall-overlay')?.remove();
}

function showCupomInput() {
  const area = document.getElementById('cupom-area');
  if (area) { area.style.display = 'block'; document.getElementById('cupom-input')?.focus(); }
}

function aplicarCupom() {
  const el  = document.getElementById('cupom-input');
  if (!el) return;
  const val = (el.value || '').trim().toUpperCase();
  if (validarCupom(val)) {
    closePaywall();
    ativarPremiumPerfil();
    _showPremiumConfirmacao();
  } else {
    el.style.borderColor  = 'var(--danger)';
    el.style.background   = 'var(--danger-light)';
    showToast('⚠️ Cupom inválido. Tente novamente.');
  }
}

function _showPremiumConfirmacao() {
  const mesLabel = form.mesInicial ? mLabelFull(form.mesInicial) : '(não informado)';
  const vtLabel  = form.valorTotal  ? fmtBRL(parseFloat(form.valorTotal)) : '(não informado)';
  const overlay = document.createElement('div');
  overlay.id = 'premium-confirmacao-overlay';
  overlay.className = 'paywall-overlay';
  overlay.innerHTML = `
    <div class="paywall-card">
      <div class="paywall-icon">✅</div>
      <div class="paywall-title">Acesso completo liberado!</div>
      <div class="paywall-sub">Seu perfil agora tem acesso aos recursos Premium</div>
      <div class="confirm-box" style="margin:16px 0 4px;text-align:left">
        <div class="c-val">${mesLabel}</div>
        <div class="c-label">🔒 Data de início bloqueada</div>
      </div>
      <div class="confirm-box" style="margin:0 0 8px;text-align:left">
        <div class="c-val">${vtLabel}</div>
        <div class="c-label">🔒 Valor total do imóvel bloqueado</div>
      </div>
      <div class="info-box" style="text-align: left; margin-bottom: 15px;">Esses campos não poderão mais ser editados. Para simular com outros valores, crie uma nova simulação.</div>
      <button class="paywall-btn-pay" style="opacity:1;pointer-events:all" onclick="document.getElementById('premium-confirmacao-overlay').remove();_navGoBack(renderResult)">Ver resultado →</button>
    </div>
  `;
  document.body.appendChild(overlay);
}
