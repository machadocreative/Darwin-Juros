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
