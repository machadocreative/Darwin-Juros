// ── QUESTIONS.JS ──
// Módulo centralizado de questões para simulação rápida e completa
// Cada questão encapsula: render, validação, mascaramento, ajuda e callbacks
// IDs são UNIFICADOS em QUESTION_IDS object
// O fluxo (FLOW_QUICKSIM ou FLOW_FULLSIM) determina qual questão aparece onde

// ════════════════════════════════════════════════════════════════════════════════
// IDS CENTRALIZADOS — FONTE ÚNICA DE VERDADE
// ════════════════════════════════════════════════════════════════════════════════

const QUESTION_IDS = {
  // Questões compartilhadas
  taxaAnual: 'inp-taxaAnual',
  seguro: 'inp-seguro',
  taxaAdm: 'inp-taxaAdm',
  percentualObra: 'inp-percentualObra',
  mesMedido: 'inp-mesMedido',
  
  // Questões QuickSim
  financiamentoTotal: 'inp-financiamentoTotal',
  saldoDevedor: 'inp-saldoDevedor',
  parcelaFinanciamento: 'inp-parcelaFinanciamento',
  
  // Questões FullSim
  mesInicial: 'inp-mesInicial',
  mesEntrega: 'inp-mesEntrega',
  valorTotal: 'inp-valorTotal',
  percFinanciado: 'inp-percFinanciado',
  valorTerreno: 'inp-valorTerreno',
  nomePerfil: 'inp-nome'
};

const questions = {

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES COMPARTILHADAS
  // ════════════════════════════════════════════════════════════════

  taxaAnual: {
    id: QUESTION_IDS.taxaAnual,
    maskType: 'perc4',
    render: () => {
      const ta = parseFloat(form.taxaAnual) || parseFloat(formQuick.taxaAnual) || 0;
      return `
        <div class="field-label">Qual sua Taxa de Juros Anual?</div>
        <div class="label-hint">Informe abaixo em 4 casas decimais. O app irá converter sua taxa anual para mensal.</div>
        <div class="input-wrap">
          <input type="text" id="${QUESTION_IDS.taxaAnual}" class="has-suf" placeholder="5,4321" inputmode="numeric" 
            oninput="maskOnInput(this);this.classList.remove('invalid');atualizaTaxa();_atualizaTaxaQuick()">
          <span class="suf">% a.a.</span>
        </div>
        <div class="diff-box" id="box-taxa" style="${ta > 0 ? '' : 'display:none'}">
          <div class="d-title">Como funcionam os juros na Evolução de Obra?</div>
          <div class="diff-row"><span class="d-label">Sua Taxa de Juros Mensal</span><span class="d-val" id="val-taxa-mensal">${ta > 0 ? fmtPerc(ta / 12, 4) : '—'}</span></div>
          <div class="diff-row"><span class="d-label">(+) Taxa Referencial do mês</span><span class="d-val">0,1000%</span></div>
          <hr class="diff-divider">
          <div class="diff-row hl"><span class="d-label">Taxa de Juros para cálculo</span><span class="d-val" id="val-taxa">${ta > 0 ? fmtPerc(ta / 12 + 0.1, 4) : '—'}</span></div>
        </div>
        <div class="info-box">💡 Aqui utilizamos TR de 0,1000% apenas como exemplo didático. O valor oficial é divulgado pelo Banco Central todos os meses.</div>
        <div class="help-section">
          <button class="help-toggle" onclick="toggleHelp('help-taxa')">
            ❓ Não sabe onde encontrar esse valor?
          </button>
          <div class="help-content" id="help-taxa" style="display:none">
            <img src="data/ajuda-taxa-juros.png" alt="Onde encontrar taxa de juros" class="help-image">
            <p class="help-caption">Consulte seu contrato ou app Habitação Caixa</p>
          </div>
        </div>`;
    },
    validate: () => {
      const el = document.getElementById(QUESTION_IDS.taxaAnual);
      const v = maskRead(el);
      if (!v || v <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe a taxa de juros.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById(QUESTION_IDS.taxaAnual);
      const v = maskRead(el);
      form.taxaAnual = String(v);
      formQuick.taxaAnual = v;
    },
    init: () => {
      const initialValue = form.taxaAnual || formQuick.taxaAnual;
      attachMask(QUESTION_IDS.taxaAnual, 'perc4', initialValue || '');
      const el = document.getElementById(QUESTION_IDS.taxaAnual);
      if (el) {
        el.oninput = () => { maskValue(el, 'perc4'); el.classList.remove('invalid'); atualizaTaxa(); _atualizaTaxaQuick(); };
        if (initialValue) { atualizaTaxa(); _atualizaTaxaQuick(); }
      }
      // ✅ Força renderização inicial
      atualizaTaxa();
      _atualizaTaxaQuick();
    }
  },

  seguro: {
    id: QUESTION_IDS.seguro,
    maskType: 'brl',
    render: () => {
      const seg = parseFloat(form.seguro) || parseFloat(formQuick.seguro) || 0;
      const adm = parseFloat(form.taxaAdm) || parseFloat(formQuick.taxaAdm) || 25;
      return `
        <div class="field-label">Quais os Encargos Mensais?</div>
        <div class="label-hint">São valores cobrados mensalmente pela Caixa, independente do andamento da obra.</div>
        <label class="field-label">1. Seguro</label>
        <div class="label-hint">O valor de seguro é único para cada comprador — Verifique no seu contrato.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="${QUESTION_IDS.seguro}" class="has-pre" placeholder="00,00" inputmode="numeric"
            oninput="maskOnInput(this);atualizaEncargos();atualizaEncargosQuick();this.classList.remove('invalid')">
        </div>
        <div class="field-group">
          <label class="field-label">2. Taxa Administrativa</label>
          <div class="label-hint">A Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
          <div class="input-wrap">
            <span class="pre">R$</span>
            <input type="text" id="${QUESTION_IDS.taxaAdm}" class="has-pre" placeholder="25,00" inputmode="numeric"
              oninput="maskOnInput(this);atualizaEncargos();atualizaEncargosQuick()">
          </div>
        </div>
        <div class="confirm-box" id="box-enc" style="${seg > 0 ? '' : 'display:none'}">
          <div><div class="c-label">Total de encargos mensais</div></div>
          <div class="c-val" id="val-enc">${seg > 0 ? fmtBRL(seg + adm) : ''}</div>
        </div>
        <div class="help-section">
          <button class="help-toggle" onclick="toggleHelp('help-encargos')">
            ❓ Não sabe onde encontrar esses valores?
          </button>
          <div class="help-content" id="help-encargos" style="display:none">
            <img src="data/ajuda-encargos.png" alt="Onde encontrar encargos" class="help-image">
            <p class="help-caption">Consulte seu extrato bancário ou contrato</p>
          </div>
        </div>`;
    },
    validate: () => {
      const el = document.getElementById(QUESTION_IDS.seguro);
      const v = maskRead(el);
      if (!v || v <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe o valor do seguro.');
        return false;
      }
      return true;
    },
    save: () => {
      const elSeg = document.getElementById(QUESTION_IDS.seguro);
      const elAdm = document.getElementById(QUESTION_IDS.taxaAdm);
      const seg = maskRead(elSeg);
      const adm = maskRead(elAdm) || 25;
      form.seguro = String(seg);
      form.taxaAdm = String(adm);
      formQuick.seguro = seg;
      formQuick.taxaAdm = adm;
    },
    init: () => {
      const initialSeg = form.seguro || formQuick.seguro;
      const initialAdm = form.taxaAdm || formQuick.taxaAdm || 25;
      attachMask(QUESTION_IDS.seguro, 'brl', initialSeg || '');
      attachMask(QUESTION_IDS.taxaAdm, 'brl', initialAdm || 25);
      const elSeg = document.getElementById(QUESTION_IDS.seguro);
      const elAdm = document.getElementById(QUESTION_IDS.taxaAdm);
      if (elSeg) elSeg.oninput = () => { maskValue(elSeg, 'brl'); elSeg.classList.remove('invalid'); atualizaEncargos(); atualizaEncargosQuick(); };
      if (elAdm) elAdm.oninput = () => { maskValue(elAdm, 'brl'); atualizaEncargos(); atualizaEncargosQuick(); };
      // ✅ Força renderização inicial
      atualizaEncargos();
      atualizaEncargosQuick();
    }
  },

  percentualObra: {
    id: QUESTION_IDS.percentualObra,
    maskType: 'perc2',
    render: () => {
      const percCalc = _calcPercAutomatico();
      const diferenca = Math.abs(percCalc - (formQuick.percObra || percCalc));
      const temDiscrepancia = diferenca > 10;
      return `
        <div class="field-label">Qual o Progresso atual da Obra?</div>
        <div class="label-hint">Consulte seu extrato bancário ou app Habitação Caixa.</div>
        <div class="field-group">
          <label class="field-label">Percentual atual de Evolução de Obra</label>
          <div class="label-hint">Baseado nos dados informados, estimamos ${percCalc.toFixed(1)}%. Está correto?</div>
          <div class="input-wrap">
            <input type="text" id="${QUESTION_IDS.percentualObra}" class="has-suf" placeholder="00,00" inputmode="numeric"
              oninput="maskOnInput(this);_limitPercQuick(this);this.classList.remove('invalid')">
            <span class="suf">%</span>
          </div>
        </div>
        
        ${temDiscrepancia ? `
          <div class="info-box" style="background:var(--warn-bg);border-color:#F6E0A0">
          ⚠️ Atenção: há uma diferença de ${diferenca.toFixed(1)}% entre o % calculado e o informado. Verifique se os valores estão corretos.
          </div>
          <br>` : ''}
        
        <div class="field-group">
          <label class="field-label">Mês dessa Medição</label>
          <div class="label-hint">A qual mês essa % de obra se refere?</div>
          <div class="month-input-row">
            <input type="month" id="${QUESTION_IDS.mesMedido}" value="" oninput="this.classList.remove('invalid');_atualizaTRInfo()">
            <button type="button" class="btn-current-month" onclick="preencherMesAtual()">Inserir Mês atual</button>
          </div>
        </div>
        <div class="info-box" id="box-tr-info" style="display: none;">
          <span id="tr-info-text"></span>
        </div>`;
    },
    validate: () => {
      const el = document.getElementById(QUESTION_IDS.percentualObra);
      const elMes = document.getElementById(QUESTION_IDS.mesMedido);
      const v = maskRead(el);
      const mes = elMes?.value;
      
      if (!v || v <= 0 || v > 100) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe uma evolução entre 0,01% e 100%.');
        return false;
      }
      
      if (!mes) {
        elMes?.classList.add('invalid');
        showToast('⚠️ Informe o mês da medição.');
        return false;
      }
      
      return true;
    },
    save: () => {
      const el = document.getElementById(QUESTION_IDS.percentualObra);
      const elMes = document.getElementById(QUESTION_IDS.mesMedido);
      const v = maskRead(el);
      formQuick.percObra = v;
      formQuick.mesMedido = elMes?.value || '';
    },
    init: () => {
      const percCalc = _calcPercAutomatico();
      const valorInicial = formQuick.percObra || percCalc;
      attachMask(QUESTION_IDS.percentualObra, 'perc2', valorInicial);
      const elMes = document.getElementById(QUESTION_IDS.mesMedido);
      if (elMes && formQuick.mesMedido) elMes.value = formQuick.mesMedido;
      _atualizaTRInfo();
    }
  },

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES EXCLUSIVAS QUICKSIM
  // ════════════════════════════════════════════════════════════════

  valorImovelQuick: {
    id: QUESTION_IDS.valorTotal,
    maskType: 'brl',
    render: () => {
      const vt  = parseFloat(formQuick.valorTotal      || 0);
      const fin = parseFloat(formQuick.totalFinanciado || 0);
      const showBox = vt > 0 && fin > 0 && fin < vt;
      return `
        <div class="field-label">Qual o valor total do seu imóvel?</div>
        <div class="label-hint">Compreende todo o valor de Entrada e Financiamento, conforme contrato.</div>
        <div class="field-group">
          <label class="field-label">Valor total do imóvel</label>
          <div class="label-hint">Conforme contrato com a Construtora.</div>
          <div class="input-wrap">
            <span class="pre">R$</span>
            <input type="text" id="${QUESTION_IDS.valorTotal}" class="has-pre" placeholder="300.000,00" inputmode="numeric"
              oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaImovelQuick()">
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Valor do Financiamento</label>
          <div class="label-hint">Crédito liberado pela Caixa — sem a entrada.</div>
          <div class="input-wrap">
            <span class="pre">R$</span>
            <input type="text" id="${QUESTION_IDS.financiamentoTotal}" class="has-pre" placeholder="240.000,00" inputmode="numeric"
              oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaImovelQuick()">
          </div>
        </div>
        <div class="diff-box" id="box-imovel-quick" style="${showBox ? '' : 'display:none'}">
          <div class="d-title">Composição do valor</div>
          <div class="diff-row"><span class="d-label">Valor total do imóvel</span><span class="d-val" id="dq-total">${showBox ? fmtBRL(vt) : '—'}</span></div>
          <div class="diff-row"><span class="d-label">(−) Entrada</span><span class="d-val" id="dq-entrada">${showBox ? fmtBRL(vt - fin) : '—'}</span></div>
          <hr class="diff-divider">
          <div class="diff-row hl"><span class="d-label">Valor financiado (<span id="dq-perc-fin">${showBox ? fmtPerc((fin / vt) * 100, 1) : '—'}</span>%)</span><span class="d-val" id="dq-fin">${showBox ? fmtBRL(fin) : '—'}</span></div>
        </div>
        <div class="help-section">
          <button class="help-toggle" onclick="toggleHelp('help-imovel-quick')">
            ❓ Não sabe onde encontrar esse valor?
          </button>
          <div class="help-content" id="help-imovel-quick" style="display:none">
            <p class="help-caption">Consulte seu contrato ou app Habitação Caixa</p>
          </div>
        </div>`;
    },
    validate: () => {
      const elVT  = document.getElementById(QUESTION_IDS.valorTotal);
      const elFin = document.getElementById(QUESTION_IDS.financiamentoTotal);
      const vt  = maskRead(elVT);
      const fin = maskRead(elFin);
      if (!vt || vt <= 0) {
        elVT?.classList.add('invalid');
        showToast('⚠️ Informe o valor total do imóvel.');
        return false;
      }
      if (!fin || fin <= 0) {
        elFin?.classList.add('invalid');
        showToast('⚠️ Informe o valor do financiamento.');
        return false;
      }
      if (fin >= vt) {
        elFin?.classList.add('invalid');
        showToast('⚠️ O financiamento deve ser menor que o valor total do imóvel.');
        return false;
      }
      return true;
    },
    save: () => {
      formQuick.valorTotal      = maskRead(document.getElementById(QUESTION_IDS.valorTotal));
      formQuick.totalFinanciado = maskRead(document.getElementById(QUESTION_IDS.financiamentoTotal));
    },
    init: () => {
      attachMask(QUESTION_IDS.valorTotal,        'brl', formQuick.valorTotal      || '');
      attachMask(QUESTION_IDS.financiamentoTotal, 'brl', formQuick.totalFinanciado || '');
      const elVT  = document.getElementById(QUESTION_IDS.valorTotal);
      const elFin = document.getElementById(QUESTION_IDS.financiamentoTotal);
      if (elVT)  elVT.oninput  = () => { maskValue(elVT,  'brl'); elVT.classList.remove('invalid');  _atualizaImovelQuick(); };
      if (elFin) elFin.oninput = () => { maskValue(elFin, 'brl'); elFin.classList.remove('invalid'); _atualizaImovelQuick(); };
      _atualizaImovelQuick();
    }
  },

  estadoObraQuick: {
    id: QUESTION_IDS.saldoDevedor,
    maskType: 'brl',
    render: () => {
      const percCalc = _calcPercAutomatico();
      const diferenca = Math.abs(percCalc - (formQuick.percObra || percCalc));
      const temDiscrepancia = diferenca > 10 && percCalc > 0;
      const hintPerc = percCalc > 0
        ? `Estimamos ${percCalc.toFixed(1)}% com base no saldo. Corrija se necessário.`
        : `Informe o percentual exato de evolução de obra.`;
      return `
        <div class="field-label">Qual o Progresso atual da Obra?</div>
        <div class="label-hint">Consulte seu extrato bancário ou app Habitação Caixa.</div>
        <div class="field-group">
          <label class="field-label">Saldo devedor atual</label>
          <div class="label-hint">Valor repassado à Construtora até o momento.</div>
          <div class="input-wrap">
            <span class="pre">R$</span>
            <input type="text" id="${QUESTION_IDS.saldoDevedor}" class="has-pre" placeholder="125.000,00" inputmode="numeric"
              oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaPercCalculado()">
          </div>
          <div class="info-box" id="box-perc-calc" style="display:none">
            📊 Darwin calculou: <strong>≈ <span id="perc-calc-valor">—</span>%</strong> de evolução de obra
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Percentual atual de Evolução de Obra</label>
          <div class="label-hint">${hintPerc}</div>
          <div class="input-wrap">
            <input type="text" id="${QUESTION_IDS.percentualObra}" class="has-suf" placeholder="00,00" inputmode="numeric"
              oninput="maskOnInput(this);_limitPercQuick(this);this.classList.remove('invalid')">
            <span class="suf">%</span>
          </div>
        </div>
        ${temDiscrepancia ? `
          <div class="info-box" style="background:var(--warn-bg);border-color:#F6E0A0">
            ⚠️ Atenção: há uma diferença de ${diferenca.toFixed(1)}% entre o % calculado e o informado. Verifique se os valores estão corretos.
          </div>` : ''}
        <div class="field-group">
          <label class="field-label">Mês dessa Medição</label>
          <div class="label-hint">A qual mês essa % de obra se refere?</div>
          <div class="month-input-row">
            <input type="month" id="${QUESTION_IDS.mesMedido}" value="" oninput="this.classList.remove('invalid');_atualizaTRInfo()">
            <button type="button" class="btn-current-month" onclick="preencherMesAtual()">Inserir Mês atual</button>
          </div>
        </div>
        <div class="info-box" id="box-tr-info" style="display:none">
          <span id="tr-info-text"></span>
        </div>
        <div class="help-section">
          <button class="help-toggle" onclick="toggleHelp('help-saldo-quick')">
            ❓ Não sabe onde encontrar esses valores? Clique aqui!
          </button>
          <div class="help-content" id="help-saldo-quick" style="display:none">
            <img src="data/ajuda-extrato-saldo.png" alt="Onde encontrar" class="help-image">
            <p class="help-caption">Consulte seu extrato bancário ou app Habitação Caixa</p>
          </div>
        </div>`;
    },
    validate: () => {
      const elSaldo = document.getElementById(QUESTION_IDS.saldoDevedor);
      const elPerc  = document.getElementById(QUESTION_IDS.percentualObra);
      const elMes   = document.getElementById(QUESTION_IDS.mesMedido);
      const saldo = maskRead(elSaldo);
      const v     = maskRead(elPerc);
      const mes   = elMes?.value;
      if (!saldo || saldo <= 0) {
        elSaldo?.classList.add('invalid');
        showToast('⚠️ Informe o saldo devedor atual.');
        return false;
      }
      const total = parseFloat(formQuick.totalFinanciado || 0);
      if (total > 0 && saldo > total) {
        elSaldo?.classList.add('invalid');
        showToast('⚠️ Saldo devedor não pode ser maior que o valor financiado.');
        return false;
      }
      if (!v || v <= 0 || v > 100) {
        elPerc?.classList.add('invalid');
        showToast('⚠️ Informe uma evolução entre 0,01% e 100%.');
        return false;
      }
      if (!mes) {
        elMes?.classList.add('invalid');
        showToast('⚠️ Informe o mês da medição.');
        return false;
      }
      return true;
    },
    save: () => {
      formQuick.saldoAtual = maskRead(document.getElementById(QUESTION_IDS.saldoDevedor));
      formQuick.percObra   = maskRead(document.getElementById(QUESTION_IDS.percentualObra));
      formQuick.mesMedido  = document.getElementById(QUESTION_IDS.mesMedido)?.value || '';
    },
    init: () => {
      attachMask(QUESTION_IDS.saldoDevedor,   'brl',   formQuick.saldoAtual || '');
      const percCalc = _calcPercAutomatico();
      attachMask(QUESTION_IDS.percentualObra, 'perc2', formQuick.percObra || percCalc || '');
      const elSaldo = document.getElementById(QUESTION_IDS.saldoDevedor);
      const elPerc  = document.getElementById(QUESTION_IDS.percentualObra);
      const elMes   = document.getElementById(QUESTION_IDS.mesMedido);
      if (elSaldo) elSaldo.oninput = () => { maskValue(elSaldo, 'brl');   elSaldo.classList.remove('invalid'); _atualizaPercCalculado(); };
      if (elPerc)  elPerc.oninput  = () => { maskValue(elPerc,  'perc2'); _limitPercQuick(elPerc); elPerc.classList.remove('invalid'); };
      if (elMes && formQuick.mesMedido) elMes.value = formQuick.mesMedido;
      _atualizaPercCalculado();
      _atualizaTRInfo();
    }
  },

  financiamentoTotal: {
    id: QUESTION_IDS.financiamentoTotal,
    maskType: 'brl',
    render: () => `
      <div class="field-label">Qual a situação atual do saldo?</div>
      <div class="label-hint">Consulte nos apps Caixa ou no seu contrato.</div>
      <div class="field-group">
        <label class="field-label">Valor do seu Financiamento</label>
        <div class="label-hint">O total de crédito liberado pelo banco — Sem a entrada da Construtora.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="${QUESTION_IDS.financiamentoTotal}" class="has-pre" placeholder="150.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
        </div>
      </div>
      
      <label class="field-label">Saldo devedor atual</label>
      <div class="label-hint">Valor repassado à Construtora até o momento</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="${QUESTION_IDS.saldoDevedor}" class="has-pre" placeholder="125.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaPercCalculado()">
      </div>
      <div class="info-box" id="box-perc-calc" style="display: none;">
        📊 Com base nos valores acima, Darwin calculou: <strong>Aproximadamente <span id="perc-calc-valor">—</span></strong>% de evolução de obra
      </div>
      <div class="help-section">
        <button class="help-toggle" onclick="toggleHelp('help-saldo')">
          ❓ Não sabe onde encontrar esses valores? Clique aqui! 
        </button>
        <div class="help-content" id="help-saldo" style="display:none">
          <img src="data/ajuda-extrato-saldo.png" alt="Onde encontrar" class="help-image">
          <p class="help-caption">Consulte seu extrato bancário ou app Habitação Caixa</p>
        </div>
      </div>`,
    validate: () => {
      const elTotal = document.getElementById(QUESTION_IDS.financiamentoTotal);
      const elSaldo = document.getElementById(QUESTION_IDS.saldoDevedor);
      const total = maskRead(elTotal);
      const saldo = maskRead(elSaldo);
      
      if (!total || total <= 0) {
        elTotal?.classList.add('invalid');
        showToast('⚠️ Informe o valor total do financiamento.');
        return false;
      }
      
      if (!saldo || saldo <= 0) {
        elSaldo?.classList.add('invalid');
        showToast('⚠️ Informe o saldo devedor atual.');
        return false;
      }
      
      if (saldo > total) {
        elSaldo?.classList.add('invalid');
        showToast('⚠️ Saldo devedor não pode ser maior que o valor financiado.');
        return false;
      }
      
      return true;
    },
    save: () => {
      const elTotal = document.getElementById(QUESTION_IDS.financiamentoTotal);
      const elSaldo = document.getElementById(QUESTION_IDS.saldoDevedor);
      formQuick.totalFinanciado = maskRead(elTotal);
      formQuick.saldoAtual = maskRead(elSaldo);
    },
    init: () => {
      attachMask(QUESTION_IDS.financiamentoTotal, 'brl', formQuick.totalFinanciado || '');
      attachMask(QUESTION_IDS.saldoDevedor, 'brl', formQuick.saldoAtual || '');
      _atualizaPercCalculado();
    }
  },

  parcelaFinanciamento: {
    id: QUESTION_IDS.parcelaFinanciamento,
    maskType: 'brl',
    render: () => `
      <div class="field-label">Valor da sua 1ª parcela do financiamento? — Opcional</div>
      <div class="label-hint">Compararemos o valor dos seus Juros de Evolução de Obra com a Parcela do Financiamento.</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="${QUESTION_IDS.parcelaFinanciamento}" class="has-pre" placeholder="1.234,56" inputmode="numeric"
          oninput="maskOnInput(this)">
      </div>`,
    optional: true,
    validate: () => true,
    onSkip: () => { formQuick.parcelaFinanciamento = null; },
    save: () => {
      const el = document.getElementById(QUESTION_IDS.parcelaFinanciamento);
      const v = maskRead(el);
      formQuick.parcelaFinanciamento = (v && v > 0) ? v : null;
    },
    init: () => {
      attachMask(QUESTION_IDS.parcelaFinanciamento, 'brl', formQuick.parcelaFinanciamento || '');
    }
  },

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES EXCLUSIVAS FULLSIM (ONBOARDING)
  // ════════════════════════════════════════════════════════════════

  mesInicial: {
    id: QUESTION_IDS.mesInicial,
    maskType: null,
    render: () => `
      <div class="field-label">Qual os prazos de início e término de pagamento de Evolução de Obra?</div>
      <div class="label-hint">Informe os meses abaixo.</div>
      <div class="field-group">
        <label class="field-label">Quando inicia o pagamento de Juros de Evolução de Obra?</label>
        <div class="label-hint">Mês da sua primeira prestação.</div>
        <input type="month" id="${QUESTION_IDS.mesInicial}" value="${form.mesInicial}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
      </div>
      <br>
      <div class="field-group">
        <label class="field-label">Qual a data de entrega prevista?</label>
        <div class="label-hint">A data de entrega define quantos meses de evolução serão simulados.</div>
        <input type="month" id="${QUESTION_IDS.mesEntrega}" value="${form.mesEntrega}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
      </div>
      <div id="badge-meses"></div>
      <div class="info-box">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que for necessário.</div>`,
    validate: () => {
      const elIni = document.getElementById(QUESTION_IDS.mesInicial);
      const elFim = document.getElementById(QUESTION_IDS.mesEntrega);
      
      if (!elIni.value) {
        markError(QUESTION_IDS.mesInicial);
        return false;
      }
      
      if (!elFim.value) {
        markError(QUESTION_IDS.mesEntrega);
        return false;
      }
      
      const ini = parseMS(elIni.value), fim = parseMS(elFim.value);
      if (mBetween(ini, fim) < 1) {
        markError(QUESTION_IDS.mesEntrega);
        showToast('⚠️ A data de entrega deve ser após a 1ª parcela.');
        return false;
      }
      
      return true;
    },
    save: () => {
      form.mesInicial = document.getElementById(QUESTION_IDS.mesInicial).value;
      form.mesEntrega = document.getElementById(QUESTION_IDS.mesEntrega).value;
    },
    init: () => {
      atualizaMesesStep0();
    }
  },

  valorImovel: {
    id: QUESTION_IDS.valorTotal,
    maskType: 'brl',
    render: () => {
      const fin_val = form.valorTotal ? parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) : 0;
      return `
        <div class="field-group">
          <label class="field-label">Qual o valor total do seu imóvel?</label>
          <div class="label-hint">Compreende todo o valor de Entrada e Financiamento, conforme contrato.</div>
          <label class="field-label">Valor total</label>
          <div class="input-wrap"><span class="pre">R$</span><input type="text" id="${QUESTION_IDS.valorTotal}" class="has-pre" placeholder="300.000,00" inputmode="numeric" oninput="atualizaFin()"></div>
        </div>
        <div class="field-group">
          <label class="field-label">Percentual financiado</label>
          <div class="input-wrap"><input type="text" id="${QUESTION_IDS.percFinanciado}" class="has-suf" placeholder="80,00" inputmode="numeric" oninput="atualizaFin()"><span class="suf">%</span></div>
        </div>
        <div class="diff-box" id="box-fin" style="${fin_val > 0 ? '' : 'display:none'}">
          <div class="d-title">Composição dos valores</div>
          <div class="diff-row"><span class="d-label">Valor total do imóvel</span><span class="d-val" id="val-total">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal)) : ''}</span></div>
          <div class="diff-row"><span class="d-label">(−) Valor não financiado (<span id="val-perc-label">${form.percFinanciado || 80}</span>% → <span id="val-nfin-perc">${parseFloat((100 - parseFloat(form.percFinanciado || 80)).toFixed(2))}</span>%)</span><span class="d-val" id="val-nfin">${fin_val > 0 ? fmtBRL(parseFloat(form.valorTotal) - fin_val) : ''}</span></div>
          <hr class="diff-divider">
          <div class="diff-row hl"><span class="d-label">Valor financiado</span><span class="d-val" id="val-fin">${fin_val > 0 ? fmtBRL(fin_val) : ''}</span></div>
        </div>`;
    },
    validate: () => {
      const elVT = document.getElementById(QUESTION_IDS.valorTotal);
      const elPF = document.getElementById(QUESTION_IDS.percFinanciado);
      const v = maskRead(elVT);
      const pf = maskRead(elPF);
      
      if (!v || v <= 0) {
        elVT?.classList.add('invalid');
        return false;
      }
      
      if (!pf || pf <= 10 || pf > 80) {
        elPF?.classList.add('invalid');
        showToast('⚠️ O percentual financiado deve ser entre 10% e 80%.');
        return false;
      }
      
      return true;
    },
    save: () => {
      const elVT = document.getElementById(QUESTION_IDS.valorTotal);
      const elPF = document.getElementById(QUESTION_IDS.percFinanciado);
      const v = maskRead(elVT);
      const pf = maskRead(elPF);
      form.valorTotal = String(v);
      form.percFinanciado = pf;
    },
    init: () => {
      attachMask(QUESTION_IDS.valorTotal, 'brl', form.valorTotal || '');
      attachMask(QUESTION_IDS.percFinanciado, 'perc2', form.percFinanciado || 80);
      const vt = document.getElementById(QUESTION_IDS.valorTotal);
      const pf = document.getElementById(QUESTION_IDS.percFinanciado);
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); atualizaFin(); };
      if (pf) pf.oninput = () => { maskValue(pf, 'perc2'); pf.classList.remove('invalid'); atualizaFin(); };
    }
  },

  valorTerreno: {
    id: QUESTION_IDS.valorTerreno,
    maskType: 'brl',
    render: () => {
      const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) || 0;
      return `
        <div class="field-group">
          <label class="field-label">Qual o valor correspondente ao terreno?</label>
          <div class="label-hint">Nos contratos da Caixa/Minha Casa Minha Vida, consta no <strong>item 1.7</strong>.</div>
          <div class="input-wrap"><span class="pre">R$</span><input type="text" id="${QUESTION_IDS.valorTerreno}" class="has-pre" placeholder="10.000,00" inputmode="numeric" oninput="atualizaTer();this.classList.remove('invalid');document.getElementById('err-terreno').style.display='none'"></div>
          <div class="error-msg" id="err-terreno">O valor do terreno deve ser menor que o total financiado (${fmtBRL(fin)}).</div>
        </div>
        <div class="diff-box" id="box-ter" style="${parseFloat(form.valorTerreno) > 0 ? '' : 'display:none'}">
          <div class="d-title">Composição do financiamento</div>
          <div class="diff-row"><span class="d-label">Valor total financiado</span><span class="d-val">${fmtBRL(fin)}</span></div>
          <div class="diff-row"><span class="d-label">(−) Terreno</span><span class="d-val" id="d-ter">${parseFloat(form.valorTerreno) > 0 ? fmtBRL(parseFloat(form.valorTerreno)) : '—'}</span></div>
          <hr class="diff-divider">
          <div class="diff-row hl"><span class="d-label">Saldo devedor repassado à Construtora</span><span class="d-val" id="d-saldo">${parseFloat(form.valorTerreno) > 0 ? fmtBRL(fin - parseFloat(form.valorTerreno)) : '—'}</span></div>
        </div>
        <div class="info-box">💡 O valor do terreno é considerado como saldo devedor desde o primeiro mês. Isso explica porque você terá pagamento de parcelas mesmo em 0% de Evolução de Obra.</div>`;
    },
    validate: () => {
      const elTer = document.getElementById(QUESTION_IDS.valorTerreno);
      const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100);
      const v = maskRead(elTer);
      
      if (!v || v <= 0) {
        elTer?.classList.add('invalid');
        return false;
      }
      
      if (v >= fin) {
        elTer?.classList.add('invalid');
        document.getElementById('err-terreno').style.display = 'block';
        return false;
      }
      
      return true;
    },
    save: () => {
      const elTer = document.getElementById(QUESTION_IDS.valorTerreno);
      form.valorTerreno = String(maskRead(elTer));
    },
    init: () => {
      attachMask(QUESTION_IDS.valorTerreno, 'brl', form.valorTerreno || '');
      const vt = document.getElementById(QUESTION_IDS.valorTerreno);
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); document.getElementById('err-terreno').style.display = 'none'; atualizaTer(); };
      atualizaTer();
    }
  },

  historicoPagamentos: {
    id: 'hist-table-wrap',
    maskType: 'brl',
    render: () => `
      <div class="field-group">
        <label class="field-label">Você já pagou alguma parcela? — Opcional</label>
        <div class="label-hint">Informe os valores de meses já debitados para acompanhamento. Deixe em branco se quiser pular ou se ainda não pagou nenhuma parcela.<br></div>
      </div>
      <div class="table-wrap" id="hist-table-wrap">
        <table>
          <thead><tr>
            <th class="th-center">#</th>
            <th>Mês</th>
            <th class="th-right">Valor pago</th>
          </tr></thead>
          <tbody id="hist-tbody"></tbody>
        </table>
        <div class="row-controls">
          <span class="rc-info" id="hist-rc-info">Use + / − para adicionar ou remover parcelas.</span>
          <button class="rc-btn" id="hist-btn-rem" onclick="histRemoverLinha()" disabled>−</button>
          <button class="rc-btn" id="hist-btn-add" onclick="histAdicionarLinha()">+</button>
        </div>
      </div>`,
    validate: () => {
      // Histórico é opcional
      return true;
    },
    save: () => {
      const rows = [];
      let i = 0;
      while (document.getElementById(`hist-val-${i}`)) {
        const el = document.getElementById(`hist-val-${i}`);
        const v = maskRead(el);
        rows.push({ valor: isNaN(v) || v < 0 ? 0 : v });
        i++;
      }
      form.historicoPagamentos = rows;
    },
    init: () => {
      const histRows = (form.historicoPagamentos && form.historicoPagamentos.length > 0)
        ? form.historicoPagamentos
        : [{ valor: 0 }];
      const tbody = document.getElementById('hist-tbody');
      if (!tbody) return;
      
      histRows.forEach((r, i) => {
        const mesLabel = form.mesInicial
          ? mLabel(addM(parseMS(form.mesInicial), i))
          : `Parcela ${i + 1}`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="num-col">${i + 1}</td>
          <td class="td-mes" style="font-size:12px">${mesLabel}</td>
          <td class="td-right">
            <div class="input-wrap">
              <span class="pre" style="font-size:12px">R$</span>
              <input type="text" id="hist-val-${i}" class="has-pre hist-val-input"
                placeholder="0,00" inputmode="numeric"
                oninput="maskOnInput(this)">
            </div>
          </td>`;
        tbody.appendChild(tr);
        attachMask(`hist-val-${i}`, 'brl', r.valor > 0 ? r.valor : '');
      });
      _updateHistControls();
    }
  },

  nomePerfil: {
    id: QUESTION_IDS.nomePerfil,
    maskType: null,
    render: () => `
      <div class="field-group">
        <label class="field-label">Como quer chamar essa simulação?</label>
        <input type="text" id="${QUESTION_IDS.nomePerfil}" placeholder="Apto 101" value="${escHtml(form.nomeSimulacao || '')}" maxlength="30" oninput="updateCharCount(this)">
        <div class="char-count" id="char-count">0 / 30</div>
      </div>`,
    validate: () => {
      const raw = sanitizeName(document.getElementById(QUESTION_IDS.nomePerfil).value) || 'Apto 101';
      const profiles = loadProfiles();
      const duplicado = profiles.find(p => p.nome.toLowerCase() === raw.toLowerCase() && p.id !== currentProfileId);
      
      if (duplicado) {
        showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.');
        markError(QUESTION_IDS.nomePerfil);
        return false;
      }
      
      return true;
    },
    save: () => {
      form.nomeSimulacao = sanitizeName(document.getElementById(QUESTION_IDS.nomePerfil).value) || 'Apto 101';
    },
    init: () => {
      const el = document.getElementById(QUESTION_IDS.nomePerfil);
      if (el) updateCharCount(el);
    }
  }
};