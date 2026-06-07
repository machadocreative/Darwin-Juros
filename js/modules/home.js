// ── HOME.JS — Telas: Nova, Educação, Sobre, Histórico TR ──

// ── BOTTOM NAV ──
function showBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = '';
  document.body.classList.add('has-nav');

  const header = document.getElementById('app-header');
  if (header) header.style.display = '';
  document.body.classList.add('has-header');
}

function hideBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = 'none';
  document.body.classList.remove('has-nav');

  const header = document.getElementById('app-header');
  if (header) header.style.display = 'none';
  document.body.classList.remove('has-header');
}

function setNavActive(tab) {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

function _navGuard(target) {
  if ((screen === 'result' || screen === 'tabela') && hasUnsavedChanges) {
    showSaveReminder(() => { hasUnsavedChanges = false; target(); });
  } else {
    target();
  }
}

// ── TELA NOVA (Home) ──
function renderHome() {
  screen = 'nova';
  _navPush('nova');
  showBottomNav();
  setNavActive('inicio');

  const profiles = loadProfiles().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  const last = profiles[0];

  const lastHtml = last ? `
    <div class="section-label">Continuar de onde parou</div>
    <div class="last-profile" onclick="loadProfile('${last.id}')">
      <div class="lp-icon">🏠</div>
      <div class="lp-content">
        <div class="lp-label">Último acesso · ${fmtDateRelative(last.savedAt)}</div>
        <div class="lp-name">${escHtml(last.nome)}</div>
      </div>
      <div class="lp-arrow">›</div>
    </div>` : '';

  setHtml(`
    <div class="greeting">
      <div class="greeting-row">
        <div class="greeting-logo"><img src="assets/favicons/android-chrome-192x192.png" alt="Darwin" class="greeting-logo-img"></div>
        <div class="greeting-title">Darwin Juros</div>
      </div>
      <div class="greeting-sub">Calcule sua evolução antes do boleto chegar</div>
    </div>

    <div class="primary-card">
      <div class="pc-eyebrow">Começar agora</div>
      <div class="pc-title">Calcule sua próxima parcela</div>
      <div class="pc-sub">Escolha o modo de simulação que combina com você</div>
      <div class="sim-btns">
        <button class="sim-btn" onclick="novaSimulacao('quick')">
          <span class="sim-btn-icon">⚡</span>
          <span class="sim-btn-label">Rápida</span>
          <span class="sim-btn-hint">~2 minutos</span>
        </button>
        <button class="sim-btn" onclick="novaSimulacao('complete')">
          <span class="sim-btn-icon">📋</span>
          <span class="sim-btn-label">Completa</span>
          <span class="sim-btn-hint">~5 minutos</span>
        </button>
      </div>
    </div>

    ${lastHtml}

    <div class="section-label">Em breve no Darwin</div>
    <div class="features-grid">
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge">Em breve</span>
        <div class="fc-icon">📊</div>
        <div class="fc-title">Evolução da obra</div>
        <div class="fc-desc">Gráfico mês a mês do avanço da sua obra</div>
      </div>
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge">Em breve</span>
        <div class="fc-icon">🔔</div>
        <div class="fc-title">Alertas de TR</div>
        <div class="fc-desc">Notificação quando a TR do mês for divulgada</div>
      </div>
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge">Em breve</span>
        <div class="fc-icon">⚖️</div>
        <div class="fc-title">Banco vs Realidade</div>
        <div class="fc-desc">Compare a projeção do contrato com o que veio</div>
      </div>
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge">Em breve</span>
        <div class="fc-icon">📅</div>
        <div class="fc-title">Calendário</div>
        <div class="fc-desc">Suas parcelas em uma timeline visual</div>
      </div>
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge premium">Premium</span>
        <div class="fc-icon">📸</div>
        <div class="fc-title">Exportar imagem</div>
        <div class="fc-desc">Compartilhe seus cards nas redes sociais</div>
      </div>
      <div class="feature-card disabled" onclick="showToast('Em breve! 🚧')">
        <span class="fc-badge premium">Premium</span>
        <div class="fc-icon">📑</div>
        <div class="fc-title">Exportar Excel</div>
        <div class="fc-desc">Baixe sua tabela completa em .xlsx</div>
      </div>
    </div>
  `);
}

// ── TELA SOBRE ──
function renderSobre() {
  screen = 'sobre';
  _navPush('sobre');
  showBottomNav();
  setNavActive('sobre');

  setHtml(`
    <div class="about-hero">
      <div class="about-logo">🏗️</div>
      <div class="about-title">Darwin Juros</div>
      <div class="about-tagline">Sua evolução sem surpresas</div>
    </div>

    <div class="about-block">
      <div class="ab-title">💡 Por que o Darwin existe?</div>
      <div class="ab-text">
        Quem compra imóvel na planta sabe: as parcelas de juros de evolução de obra crescem mês a mês — e quase ninguém entende como. Construtoras e bancos raramente explicam de forma clara, e o comprador é pego de surpresa todo mês.
        <br><br>
        O Darwin nasceu pra resolver isso. Sem planilhas. Sem papel e caneta. Sem mensalidade cara.
      </div>
    </div>


    <div class="about-block">
      <div class="ab-title">🧮 Como funciona o cálculo</div>
      <div class="ab-text">
        Usamos a fórmula oficial da Caixa Econômica Federal, considerando: taxa mensal de juros do seu contrato, Taxa Referencial (TR) do mês, saldo devedor atual e seus encargos (seguro e taxa administrativa).
      </div>
    </div>

    <div class="about-block">
      <div class="ab-title">🔒 Seus dados são seus</div>
      <div class="ab-text">
        Tudo fica salvo apenas no seu celular. Não enviamos nada para servidores, não criamos contas, não pedimos email. Você pode usar o Darwin offline depois de instalar.
      </div>
    </div>

    <div class="about-block">
      <div class="ab-title">💰 Versão premium?</div>
      <div class="ab-text">
        O pagamento é um incentivo ao tempo gasto no desenvolvimento do aplicativo. Ainda que as linhas de código tenham sido elaboradas por inteligência artificial, a designer (humana!) estará sempre testando os fluxos, buscando erros, encontrando formas de deixar o aplicativo e o processo de pagamento dos Juros de Evolução de obra mais didáticos e acessíveis. O pagamento do Darwin Premium é meramente simbólico para não prejudicar as pessoas que já passam por tanto aperto para pagar as prestações.
        <br><br>
        <strong>Se você chegou até aqui, use o código DARWIN10 para liberar os recursos pagos.</strong> Este cupom só estará disponível na versão beta.
      </div>
    </div>
    
    <div class="about-block">
      <div class="ab-title">💬 Sugestões e feedback</div>
      <div class="ab-text">
        O Darwin é construído com base no que você precisa. Tem uma ideia? Encontrou um bug? Quer pedir uma funcionalidade? Estamos sempre ouvindo.
      </div>
    </div>

    <div class="about-meta">
      Versão Beta para testes · Feito com 💚<br>
      Gabriela Machado com apoio da IA Claude
    </div>
  `);
}

