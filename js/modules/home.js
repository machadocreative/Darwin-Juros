// ── HOME.JS — Telas: Nova, Educação, Sobre, Histórico TR ──

// ── BOTTOM NAV ──
function showBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = '';
  document.body.classList.add('has-nav');
}

function hideBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = 'none';
  document.body.classList.remove('has-nav');
}

function setNavActive(tab) {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

// ── TELA NOVA (Home) ──
function renderHome() {
  screen = 'nova';
  showBottomNav();
  setNavActive('nova');

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
        <div class="greeting-logo">🏗️</div>
        <div class="greeting-title">Darwin Juros</div>
      </div>
      <div class="greeting-sub">Calcule sua evolução antes do boleto chegar</div>
    </div>

    <div class="primary-card">
      <div class="pc-eyebrow">Começar agora</div>
      <div class="pc-title">Calcule sua próxima parcela</div>
      <div class="pc-sub">Escolha o modo de simulação que combina com você</div>
      <div class="pc-btns">
        <button class="pc-btn" onclick="novaSimulacao('quick')">
          <span class="pc-btn-icon">⚡</span>
          <span class="pc-btn-label">Rápida</span>
          <span class="pc-btn-hint">~2 minutos</span>
        </button>
        <button class="pc-btn" onclick="novaSimulacao('complete')">
          <span class="pc-btn-icon">📋</span>
          <span class="pc-btn-label">Completa</span>
          <span class="pc-btn-hint">~5 minutos</span>
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
      <div class="feature-card" onclick="renderTRHistorico()">
        <span class="fc-badge new">Disponível</span>
        <div class="fc-icon">📈</div>
        <div class="fc-title">Histórico da TR</div>
        <div class="fc-desc">Taxa Referencial mês a mês desde 2020</div>
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

// ── TELA EDUCAÇÃO ──
function renderEducacao() {
  screen = 'educacao';
  showBottomNav();
  setNavActive('educacao');

  setHtml(`
    <div class="greeting">
      <div class="greeting-row">
        <div class="greeting-logo">🎓</div>
        <div class="greeting-title">Aprenda com Darwin</div>
      </div>
      <div class="greeting-sub">Entenda os termos sem precisar ser do mercado</div>
    </div>

    <div class="section-label">Vídeos</div>

    <div class="edu-card disabled">
      <div class="edu-thumb">
        <div class="edu-thumb-icon-circle">▶</div>
        <span class="edu-badge">Em breve</span>
      </div>
      <div class="edu-content">
        <div class="edu-title">Como funcionam os juros de obra?</div>
        <div class="edu-desc">Entenda por que sua parcela aumenta a cada mês</div>
      </div>
    </div>

    <div class="edu-card disabled">
      <div class="edu-thumb">
        <div class="edu-thumb-icon-circle">▶</div>
        <span class="edu-badge">Em breve</span>
      </div>
      <div class="edu-content">
        <div class="edu-title">O que é Taxa Referencial (TR)?</div>
        <div class="edu-desc">A variável invisível que afeta suas parcelas todo mês</div>
      </div>
    </div>

    <div class="edu-card disabled">
      <div class="edu-thumb">
        <div class="edu-thumb-icon-circle">▶</div>
        <span class="edu-badge">Em breve</span>
      </div>
      <div class="edu-content">
        <div class="edu-title">Por que a parcela inicial é tão baixa?</div>
        <div class="edu-desc">O efeito do saldo devedor pequeno no começo da obra</div>
      </div>
    </div>

    <div class="section-label">Artigos</div>

    <div class="edu-card disabled">
      <div class="edu-content" style="padding:16px">
        <div class="edu-title">📖 Glossário do comprador na planta</div>
        <div class="edu-desc">Saldo devedor, TR, evolução de obra, encargos... tudo explicado em linguagem simples</div>
        <span class="edu-badge" style="position:static;display:inline-block;margin-top:10px">Em breve</span>
      </div>
    </div>

    <div class="edu-card disabled">
      <div class="edu-content" style="padding:16px">
        <div class="edu-title">📰 Direitos do comprador</div>
        <div class="edu-desc">O que você pode e deve cobrar da construtora durante a obra</div>
        <span class="edu-badge" style="position:static;display:inline-block;margin-top:10px">Em breve</span>
      </div>
    </div>
  `);
}

// ── TELA SOBRE ──
function renderSobre() {
  screen = 'sobre';
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
      <div class="ab-title">💬 Sugestões e feedback</div>
      <div class="ab-text">
        O Darwin é construído com base no que você precisa. Tem uma ideia? Encontrou um bug? Quer pedir uma funcionalidade? Estamos sempre ouvindo.
      </div>
    </div>

    <div class="about-meta">
      Versão beta · Feito com 💚 no Brasil
    </div>
  `);
}

// ── TELA HISTÓRICO DA TR ──
function renderTRHistorico() {
  screen = 'trHistorico';
  hideBottomNav();

  const data = window._trHistorico || {};
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const byYear = {};
  Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined)
    .forEach(([key, val]) => {
      const year = key.split('-')[0];
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push({ key, val });
    });

  const rows = Object.entries(byYear)
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => `
      <div class="section-label">${year}</div>
      <div class="tr-table">
        ${items.map(({ key, val }) => {
          const mm = parseInt(key.split('-')[1], 10);
          const isZero = val === 0;
          return `<div class="tr-row">
            <span class="tr-mes">${months[mm - 1]}</span>
            <span class="tr-val${isZero ? ' tr-zero' : ''}">${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%</span>
          </div>`;
        }).join('')}
      </div>`).join('');

  setHtml(`
    <button class="btn-screen-back" onclick="renderHome()">← Voltar</button>
    <div class="screen-title">Histórico da TR</div>
    <div class="screen-sub">Taxa Referencial mensal divulgada pelo Banco Central do Brasil. Utilizada nos cálculos de evolução de obra.</div>
    ${rows}
  `);
}
