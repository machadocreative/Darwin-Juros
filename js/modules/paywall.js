// ── PAYWALL ──
function showPaywall() {
  const existing = document.getElementById('paywall-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'paywall-overlay';
  overlay.className = 'paywall-overlay';
  overlay.innerHTML = `
    <div class="paywall-card">
      <div class="paywall-icon">🔓</div>
      <div class="paywall-title">Libere a tabela completa de parcelas</div>
      <div class="paywall-sub">Veja todas as parcelas mês a mês, edite % de obra livremente, acrescente Taxa Referencial e acompanhe o que já foi pago.</div>
      <div class="paywall-price">
        <span class="paywall-amount">R$ 4,99</span>
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
  if (val === CUPOM_VALIDO) {
    closePaywall();
    ativarPremiumPerfil();
    showToast('✅ Cupom aplicado! Acesso completo liberado.');
    renderTabela();
  } else {
    el.style.borderColor  = 'var(--danger)';
    el.style.background   = 'var(--danger-light)';
    showToast('⚠️ Cupom inválido. Tente novamente.');
  }
}
