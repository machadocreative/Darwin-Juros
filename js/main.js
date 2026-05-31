// ── NAVEGAÇÃO POR GESTOS / HISTORY API ──

let _isPopState = false;

function _navPush(screenName, extra) {
  if (_isPopState) return;
  history.pushState({ screen: screenName, ...(extra || {}) }, '', '');
}

window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (!state || !state.screen) return;

  _isPopState = true;
  const s = state.screen;

  if (s === 'nova') {
    renderHome();
  } else if (s === 'perfis') {
    renderProfiles();
  } else if (s === 'educacao') {
    renderEducacao();
  } else if (s === 'sobre') {
    renderSobre();
  } else if (s === 'trHistorico') {
    renderTRHistorico();
  } else if (s === 'bifurcacao') {
    renderBifurcacao();
  } else if (s === 'result') {
    renderResult();
  } else if (s === 'resultQuick') {
    renderResultQuick();
  } else if (s === 'sliderResult') {
    renderSliderResult();
  } else if (s === 'tabela') {
    if (isPremium()) renderTabela(); else renderMiniTabela();
  } else if (s === 'quick' || s === 'onboarding') {
    if (state.step !== undefined) currentFlowStep = state.step;
    renderFlowStep();
  } else {
    renderHome();
  }

  _isPopState = false;
});

// ── INICIALIZAÇÃO ──
window.addEventListener('load', async () => {
  setTimeout(() => { document.getElementById('splash').classList.add('hide'); }, 1200);

  // Carrega série histórica de TR em memória antes de qualquer cálculo
  await _carregarTRHistorico();

  renderHome();
});

// ── CARREGAMENTO DO JSON DE TR ──
// Popula window._trHistorico uma única vez na inicialização.
// calcTable() e adicionarLinha() consultam de forma síncrona depois.
async function _carregarTRHistorico() {
  try {
    const res = await fetch('data/tr-historico.json');
    if (!res.ok) throw new Error('not found');
    window._trHistorico = await res.json();
  } catch {
    window._trHistorico = {};
  }
}

// ── HELPER: busca TR do JSON para um mês {y, m} ──
// Retorna 0 se: mês futuro (null no JSON), chave ausente, ou JSON não carregado.
function getTRParaMes(ym) {
  if (!window._trHistorico) return 0;
  const key = `${ym.y}-${String(ym.m).padStart(2, '0')}`;
  const val = window._trHistorico[key];
  if (val === null || val === undefined) return 0;
  return val / 100; // converte % → decimal (0.1687 → 0.001687)
}
