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
