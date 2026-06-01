// ── TELA EDUCAÇÃO ──

function _eduToggle(id) {
  const el = document.getElementById(id);
  const btn = document.querySelector(`[data-edu-toggle="${id}"]`);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : '';
  if (btn) btn.textContent = open ? '›' : '‹';
}

function renderEducacao() {
  screen = 'educacao';
  _navPush('educacao');
  showBottomNav();
  setNavActive('educacao');

  const glossario = [
    { t: 'TR — Taxa Referencial',         d: 'Índice mensal divulgado pelo Banco Central que corrige o saldo devedor do financiamento. Mesmo que seja pequena, incide sobre o valor total financiado e sobe sua parcela todo mês.' },
    { t: 'Encargo mensal',                d: 'Tudo que você paga por mês: juros, atualização pela TR, seguro MIP, seguro DFI e taxa de administração. Na fase de obra não inclui amortização.' },
    { t: 'Amortização',                   d: 'Pagamento parcial do valor principal da dívida. Só começa após a entrega das chaves — durante a obra você paga apenas juros e encargos.' },
    { t: 'Saldo devedor',                 d: 'Quanto você ainda deve ao banco. Durante a obra, cresce à medida que o banco libera parcelas para a construtora. Depois da obra, diminui a cada amortização paga.' },
    { t: 'MIP — Seguro Morte e Invalidez',d: 'Seguro obrigatório que quita o saldo devedor em caso de falecimento ou invalidez permanente do titular do financiamento.' },
    { t: 'DFI — Danos Físicos no Imóvel', d: 'Seguro que cobre danos estruturais no imóvel, como incêndio e desabamento. Não cobre mau uso ou vícios de construção.' },
    { t: 'Alienação fiduciária',          d: 'Garantia do banco: o imóvel fica em nome da CAIXA até você quitar a dívida. Você tem a posse, mas a propriedade só passa para você após a quitação total.' },
    { t: 'CET — Custo Efetivo Total',     d: 'Planilha teórica entregue antes da assinatura do contrato com o custo total da operação. A TR não entra no cálculo, por isso os valores reais podem diferir.' },
    { t: 'Mútuo',                         d: 'Nome técnico do empréstimo habitacional. A CAIXA (credor) empresta o dinheiro e você (devedor) se compromete a devolver com juros e encargos.' },
    { t: 'Empreitada',                    d: 'Contrato firmado entre você e a construtora. É de sua responsabilidade acompanhar a evolução da obra e cobrar os prazos.' },
    { t: 'Mora',                          d: 'Atraso no pagamento das parcelas. Gera atualização monetária, juros, multa e pode resultar em registro em cadastros de crédito a partir do dia seguinte ao vencimento.' },
    { t: 'Adimplência',                   d: 'Estar em dia com os pagamentos. Condição essencial para o banco continuar liberando parcelas à construtora e para você não sofrer penalidades contratuais.' },
    { t: 'Liquidação',                    d: 'Pagamento total da dívida, também chamado de quitação. Após a liquidação, a propriedade do imóvel passa definitivamente para o seu nome.' },
    { t: 'FGTS',                          d: 'Fundo de Garantia do Tempo de Serviço. Pode ser usado como parte do pagamento ou para abater o saldo devedor, dependendo das condições do seu contrato.' },
    { t: 'FGHab',                         d: 'Fundo Garantidor da Habitação, presente em contratos do Minha Casa Minha Vida. Cobre temporariamente as parcelas em casos de desemprego ou perda súbita de renda.' },
  ];

  const glossHtml = glossario.map((item, i) => {
    const id = `glos-${i}`;
    return `
      <div class="edu-accordion-item">
        <button class="edu-accordion-header" onclick="_eduToggle('${id}')">
          <span class="edu-acc-title">${item.t}</span>
          <span class="edu-acc-arrow" data-edu-toggle="${id}">›</span>
        </button>
        <div class="edu-accordion-body" id="${id}" style="display:none">
          ${item.d}
        </div>
      </div>`;
  }).join('');

  setHtml(`
    <div class="greeting">
      <div class="greeting-row">
        <div class="greeting-logo">🎓</div>
        <div class="greeting-title">Aprenda com Darwin</div>
      </div>
      <div class="greeting-sub">Entenda os termos sem precisar ser do mercado</div>
    </div>

    <div class="section-label">Ferramentas</div>

    <div class="edu-card" onclick="renderTRHistorico()">
      <div class="edu-content" style="padding:16px">
        <div class="edu-title">📈 Histórico da TR</div>
        <div class="edu-desc">Taxa Referencial mês a mês desde 2020. Clique para simular sua taxa combinada com a TR de cada período.</div>
      </div>
      <div class="edu-arrow">›</div>
    </div>

    <div class="section-label">Entenda sua parcela</div>

    <div class="edu-card-static">
      <div class="edu-static-header">
        <div class="edu-static-title">🧾 O que compõe sua parcela mensal?</div>
        <div class="edu-static-sub">Fonte: Cartilha oficial da Caixa Econômica Federal</div>
      </div>

      <div class="edu-fase-block">
        <div class="edu-fase-label edu-fase-obra">Durante a obra</div>
        <div class="edu-fase-items">
          <div class="edu-fase-item">
            <span class="edu-fase-dot dot-juros"></span>
            <div>
              <strong>Juros contratuais</strong>
              <div class="edu-fase-hint">Taxa anual do seu contrato ÷ 12, aplicada sobre o saldo devedor do mês</div>
            </div>
          </div>
          <div class="edu-fase-item">
            <span class="edu-fase-dot dot-tr"></span>
            <div>
              <strong>Atualização monetária (TR)</strong>
              <div class="edu-fase-hint">Índice mensal do Banco Central aplicado sobre o saldo devedor</div>
            </div>
          </div>
          <div class="edu-fase-item">
            <span class="edu-fase-dot dot-seguro"></span>
            <div>
              <strong>Seguro MIP</strong>
              <div class="edu-fase-hint">Seguro obrigatório de morte e invalidez permanente</div>
            </div>
          </div>
          <div class="edu-fase-item">
            <span class="edu-fase-dot dot-adm"></span>
            <div>
              <strong>Taxa de administração mensal</strong>
              <div class="edu-fase-hint">Tarifa de gestão do contrato, quando devida</div>
            </div>
          </div>
        </div>
      </div>

      <div class="edu-fase-divider">+ após a entrega das chaves</div>

      <div class="edu-fase-block">
        <div class="edu-fase-label edu-fase-amort">Fase de amortização</div>
        <div class="edu-fase-items">
          <div class="edu-fase-item">
            <span class="edu-fase-dot dot-amort"></span>
            <div>
              <strong>Amortização</strong>
              <div class="edu-fase-hint">Parcela que reduz o saldo principal da dívida — só começa após a obra</div>
            </div>
          </div>
          <div class="edu-fase-item edu-fase-item-muted">
            <span class="edu-fase-dot dot-muted"></span>
            <div class="edu-fase-hint">+ todos os itens da fase de obra acima</div>
          </div>
        </div>
      </div>

      <div class="edu-formula-box">
        <div class="edu-formula-label">Fórmula (fase de obra)</div>
        <div class="edu-formula">Parcela = (taxa_m + TR) × saldo + encargos</div>
        <div class="edu-formula-hint">taxa_m = taxa anual ÷ 1200 &nbsp;·&nbsp; encargos = seguro + taxa adm</div>
      </div>
    </div>

    <div class="section-label">Glossário</div>

    <div class="edu-accordion">
      ${glossHtml}
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
        <div class="edu-title">📰 Direitos do comprador</div>
        <div class="edu-desc">O que você pode e deve cobrar da construtora durante a obra</div>
        <span class="edu-badge" style="position:static;display:inline-block;margin-top:10px">Em breve</span>
      </div>
    </div>
  `);
}
