// ── QUESTIONS.JS ──
// Módulo centralizado de questões para simulação rápida e completa
// Cada questão encapsula: render, validação, mascaramento, ajuda e callbacks
// IDs são UNIFICADOS — a mesma questão usa o mesmo ID em ambos os fluxos
// O fluxo (FLOW_QUICKSIM ou FLOW_FULLSIM) determina qual questão aparece onde

const questions = {

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES COMPARTILHADAS
  // ════════════════════════════════════════════════════════════════

  taxaAnual: {
    id: 'inp-taxaAnual',
    maskType: 'perc4',
    render: () => {
      const ta = parseFloat(form.taxaAnual) || parseFloat(formQuick.taxaAnual) || 0;
      return `
        <div class="field-label">Qual a Taxa de Juros anual do seu Financiamento?</div>
        <div class="label-hint">O app irá converter sua taxa anual para mensal abaixo.</div>
        <div class="input-wrap">
          <input type="text" id="inp-taxaAnual" class="has-suf" placeholder="5,4321" inputmode="numeric" 
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
      const el = document.getElementById('inp-taxaAnual');
      const v = maskRead(el);
      if (!v || v <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe a taxa de juros.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById('inp-taxaAnual');
      const v = maskRead(el);
      form.taxaAnual = String(v);
      formQuick.taxaAnual = v;
    },
    init: () => {
      const initialValue = form.taxaAnual || formQuick.taxaAnual;
      attachMask('inp-taxaAnual', 'perc4', initialValue || '');
      const el = document.getElementById('inp-taxaAnual');
      if (el) {
        el.oninput = () => { maskValue(el, 'perc4'); el.classList.remove('invalid'); atualizaTaxa(); _atualizaTaxaQuick(); };
        if (initialValue) { atualizaTaxa(); _atualizaTaxaQuick(); }
      }
    }
  },

  seguro: {
    id: 'inp-seguro',
    maskType: 'brl',
    render: () => {
      const seg = parseFloat(form.seguro) || parseFloat(formQuick.seguro) || 0;
      const adm = parseFloat(form.taxaAdm) || parseFloat(formQuick.taxaAdm) || 25;
      return `
        <label class="field-label">1. Seguro</label>
        <div class="label-hint">O valor de seguro é único para cada comprador — Verifique no seu contrato.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="inp-seguro" class="has-pre" placeholder="00,00" inputmode="numeric"
            oninput="maskOnInput(this);atualizaEncargos();atualizaEncargosQuick();this.classList.remove('invalid')">
        </div>
        <div class="field-group">
          <label class="field-label">2. Taxa Administrativa</label>
          <div class="label-hint">A Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
          <div class="input-wrap">
            <span class="pre">R$</span>
            <input type="text" id="inp-taxaAdm" class="has-pre" placeholder="25,00" inputmode="numeric"
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
      const el = document.getElementById('inp-seguro');
      const v = maskRead(el);
      if (!v || v <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe o valor do seguro.');
        return false;
      }
      return true;
    },
    save: () => {
      const elSeg = document.getElementById('inp-seguro');
      const elAdm = document.getElementById('inp-taxaAdm');
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
      attachMask('inp-seguro', 'brl', initialSeg || '');
      attachMask('inp-taxaAdm', 'brl', initialAdm || 25);
      const elSeg = document.getElementById('inp-seguro');
      const elAdm = document.getElementById('inp-taxaAdm');
      if (elSeg) elSeg.oninput = () => { maskValue(elSeg, 'brl'); elSeg.classList.remove('invalid'); atualizaEncargos(); atualizaEncargosQuick(); };
      if (elAdm) elAdm.oninput = () => { maskValue(elAdm, 'brl'); atualizaEncargos(); atualizaEncargosQuick(); };
    }
  },

  percentualObra: {
    id: 'inp-percentualObra',
    maskType: 'perc2',
    render: () => {
      const percCalc = _calcPercAutomatico();
      const diferenca = Math.abs(percCalc - (formQuick.percObra || percCalc));
      const temDiscrepancia = diferenca > 10;
      return `
        <div class="field-group">
          <label class="field-label">Percentual atual de Evolução de Obra</label>
          <div class="label-hint">Baseado nos dados informados, estimamos ${percCalc.toFixed(1)}%. Está correto?</div>
          <div class="input-wrap">
            <input type="text" id="inp-percentualObra" class="has-suf" placeholder="00,00" inputmode="numeric"
              oninput="maskOnInput(this);_limitPercQuick(this);this.classList.remove('invalid')">
            <span class="suf">%</span>
          </div>
        </div>
        
        ${temDiscrepancia ? `
          <div class="info-box" style="background:var(--warn-bg);border-color:#F6E0A0">
          ⚠️ Atenção: há uma diferença de ${diferenca.toFixed(1)}% entre o % calculado e o informado. Verifique se os valores estão corretos.
          </div>
          <br>` : ''}`;
    },
    validate: () => {
      const el = document.getElementById('inp-percentualObra');
      const v = maskRead(el);
      if (!v || v <= 0 || v > 100) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe uma evolução entre 0,01% e 100%.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById('inp-percentualObra');
      formQuick.percObra = maskRead(el);
    },
    init: () => {
      const percCalc = _calcPercAutomatico();
      const valorInicial = formQuick.percObra || percCalc;
      attachMask('inp-percentualObra', 'perc2', valorInicial);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES EXCLUSIVAS QUICKSIM
  // ════════════════════════════════════════════════════════════════

  financiamentoTotal: {
    id: 'inp-financiamentoTotal',
    maskType: 'brl',
    render: () => `
      <div class="field-group">
        <label class="field-label">Valor do seu Financiamento</label>
        <div class="label-hint">O total de crédito liberado pelo banco — Sem a entrada da Construtora.</div>
        <div class="input-wrap">
          <span class="pre">R$</span>
          <input type="text" id="inp-financiamentoTotal" class="has-pre" placeholder="150.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid')">
        </div>
      </div>`,
    validate: () => {
      const el = document.getElementById('inp-financiamentoTotal');
      const total = maskRead(el);
      if (!total || total <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe o valor total do financiamento.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById('inp-financiamentoTotal');
      formQuick.totalFinanciado = maskRead(el);
    },
    init: () => {
      attachMask('inp-financiamentoTotal', 'brl', formQuick.totalFinanciado || '');
    }
  },

  saldoDevedor: {
    id: 'inp-saldoDevedor',
    maskType: 'brl',
    render: () => `
      <label class="field-label">Saldo devedor atual</label>
      <div class="label-hint">Valor repassado à Construtora até o momento</div>
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="inp-saldoDevedor" class="has-pre" placeholder="125.000,00" inputmode="numeric" oninput="maskOnInput(this);this.classList.remove('invalid');_atualizaPercCalculado()">
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
      const elTotal = document.getElementById('inp-financiamentoTotal');
      const elSaldo = document.getElementById('inp-saldoDevedor');
      const total = maskRead(elTotal);
      const saldo = maskRead(elSaldo);
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
      const el = document.getElementById('inp-saldoDevedor');
      formQuick.saldoAtual = maskRead(el);
    },
    init: () => {
      attachMask('inp-saldoDevedor', 'brl', formQuick.saldoAtual || '');
      _atualizaPercCalculado();
    }
  },

  mesMedido: {
    id: 'inp-mesMedido',
    maskType: null,
    render: () => `
      <div class="field-group">
        <label class="field-label">Mês dessa Medição</label>
        <div class="label-hint">A qual mês essa % de obra se refere?</div>
        <div class="month-input-row">
          <input type="month" id="inp-mesMedido" value="" oninput="this.classList.remove('invalid');_atualizaTRInfo()">
          <button type="button" class="btn-current-month" onclick="preencherMesAtual()">Inserir Mês atual</button>
        </div>
      </div>
      <div class="info-box" id="box-tr-info" style="display: none;">
        <span id="tr-info-text"></span>
      </div>`,
    validate: () => {
      const el = document.getElementById('inp-mesMedido');
      const mes = el?.value;
      if (!mes) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe o mês da medição.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById('inp-mesMedido');
      formQuick.mesMedido = el?.value || '';
    },
    init: () => {
      const el = document.getElementById('inp-mesMedido');
      if (el && formQuick.mesMedido) el.value = formQuick.mesMedido;
      _atualizaTRInfo();
    }
  },

  parcelaFinanciamento: {
    id: 'inp-parcelaFinanciamento',
    maskType: 'brl',
    render: () => `
      <div class="input-wrap">
        <span class="pre">R$</span>
        <input type="text" id="inp-parcelaFinanciamento" class="has-pre" placeholder="1.234,56" inputmode="numeric"
          oninput="maskOnInput(this)">
      </div>`,
    validate: () => {
      const el = document.getElementById('inp-parcelaFinanciamento');
      const v = maskRead(el);
      const total = formQuick.totalFinanciado || 0;

      if (!v || v <= 0) {
        el?.classList.add('invalid');
        showToast('⚠️ Informe o valor da parcela.');
        return false;
      }
      if (v > total) {
        el?.classList.add('invalid');
        showToast('⚠️ Parcela não pode ser maior que o valor total financiado.');
        return false;
      }
      return true;
    },
    save: () => {
      const el = document.getElementById('inp-parcelaFinanciamento');
      const v = maskRead(el);
      formQuick.parcelaFinanciamento = v;
    },
    init: () => {
      attachMask('inp-parcelaFinanciamento', 'brl', formQuick.parcelaFinanciamento || '');
    }
  },

  // ════════════════════════════════════════════════════════════════
  // QUESTÕES EXCLUSIVAS FULLSIM (ONBOARDING)
  // ════════════════════════════════════════════════════════════════

  mesInicial: {
    id: 'inp-mesInicial',
    maskType: null,
    render: () => `
      <div class="field-group">
        <label class="field-label">Quando inicia o pagamento de Juros de Evolução de Obra?</label>
        <div class="label-hint">Mês da sua primeira prestação.</div>
        <input type="month" id="inp-mesInicial" value="${form.mesInicial}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
      </div>
      <br>
      <div class="field-group">
        <label class="field-label">Qual a data de entrega prevista?</label>
        <div class="label-hint">A data de entrega define quantos meses de evolução serão simulados.</div>
        <input type="month" id="inp-mesEntrega" value="${form.mesEntrega}" oninput="atualizaMesesStep0();this.classList.remove('invalid')">
      </div>
      <div id="badge-meses"></div>
      <div class="info-box">💡 A entrega do seu imóvel poderá ser antecipada ou sofrer atrasos — Altere essa data sempre que for necessário.</div>`,
    validate: () => {
      const elIni = document.getElementById('inp-mesInicial');
      const elFim = document.getElementById('inp-mesEntrega');
      if (!elIni.value) {
        markError('inp-mesInicial');
        return false;
      }
      if (!elFim.value) {
        markError('inp-mesEntrega');
        return false;
      }
      const ini = parseMS(elIni.value), fim = parseMS(elFim.value);
      if (mBetween(ini, fim) < 1) {
        markError('inp-mesEntrega');
        showToast('⚠️ A data de entrega deve ser após a 1ª parcela.');
        return false;
      }
      return true;
    },
    save: () => {
      form.mesInicial = document.getElementById('inp-mesInicial').value;
      form.mesEntrega = document.getElementById('inp-mesEntrega').value;
    },
    init: () => {
      atualizaMesesStep0();
    }
  },

  valorImovel: {
    id: 'inp-valorTotal',
    maskType: 'brl',
    render: () => {
      const fin_val = form.valorTotal ? parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) : 0;
      return `
        <div class="field-group">
          <label class="field-label">Qual o valor do seu imóvel?</label>
          <div class="label-hint">O valor total do apartamento conforme contrato.</div>
          <label class="field-label">Valor total</label>
          <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-valorTotal" class="has-pre" placeholder="300.000,00" inputmode="numeric" oninput="atualizaFin()"></div>
        </div>
        <div class="field-group">
          <label class="field-label">Percentual financiado</label>
          <div class="input-wrap"><input type="text" id="inp-percFinanciado" class="has-suf" placeholder="80,00" inputmode="numeric" oninput="atualizaFin()"><span class="suf">%</span></div>
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
      const elVT = document.getElementById('inp-valorTotal');
      const elPF = document.getElementById('inp-percFinanciado');
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
      const elVT = document.getElementById('inp-valorTotal');
      const elPF = document.getElementById('inp-percFinanciado');
      const v = maskRead(elVT);
      const pf = maskRead(elPF);
      form.valorTotal = String(v);
      form.percFinanciado = pf;
    },
    init: () => {
      attachMask('inp-valorTotal', 'brl', form.valorTotal || '');
      attachMask('inp-percFinanciado', 'perc2', form.percFinanciado || 80);
      const vt = document.getElementById('inp-valorTotal');
      const pf = document.getElementById('inp-percFinanciado');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); atualizaFin(); };
      if (pf) pf.oninput = () => { maskValue(pf, 'perc2'); pf.classList.remove('invalid'); atualizaFin(); };
    }
  },

  valorTerreno: {
    id: 'inp-valorTerreno',
    maskType: 'brl',
    render: () => {
      const fin = parseFloat(form.valorTotal) * (parseFloat(form.percFinanciado) / 100) || 0;
      return `
        <div class="field-group">
          <label class="field-label">Qual o valor do terreno?</label>
          <div class="label-hint">Nos contratos da Caixa/Minha Casa Minha Vida, consta no <strong>item 1.7</strong>.</div>
          <div class="input-wrap"><span class="pre">R$</span><input type="text" id="inp-valorTerreno" class="has-pre" placeholder="10.000,00" inputmode="numeric" oninput="atualizaTer();this.classList.remove('invalid');document.getElementById('err-terreno').style.display='none'"></div>
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
      const elTer = document.getElementById('inp-valorTerreno');
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
      const elTer = document.getElementById('inp-valorTerreno');
      form.valorTerreno = String(maskRead(elTer));
    },
    init: () => {
      attachMask('inp-valorTerreno', 'brl', form.valorTerreno || '');
      const vt = document.getElementById('inp-valorTerreno');
      if (vt) vt.oninput = () => { maskValue(vt, 'brl'); vt.classList.remove('invalid'); document.getElementById('err-terreno').style.display = 'none'; atualizaTer(); };
      atualizaTer();
    }
  },

  historicoP agamentos: {
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
    id: 'inp-nome',
    maskType: null,
    render: () => `
      <div class="field-group">
        <label class="field-label">Como quer chamar essa simulação?</label> 
        <div class="label-hint">Máximo 30 caracteres. Ex: Apto Centro, Torre B, Meu apê...</div>
        <input type="text" id="inp-nome" placeholder="Apto 101" value="${escHtml(form.nomeSimulacao || '')}" maxlength="30" oninput="updateCharCount(this)">
        <div class="char-count" id="char-count">0 / 30</div>
      </div>`,
    validate: () => {
      const raw = sanitizeName(document.getElementById('inp-nome').value) || 'Apto 101';
      const profiles = loadProfiles();
      const duplicado = profiles.find(p => p.nome.toLowerCase() === raw.toLowerCase() && p.id !== currentProfileId);
      if (duplicado) {
        showToast('⚠️ Já existe um perfil com esse nome. Utilize um nome diferente.');
        markError('inp-nome');
        return false;
      }
      return true;
    },
    save: () => {
      form.nomeSimulacao = sanitizeName(document.getElementById('inp-nome').value) || 'Apto 101';
    },
    init: () => {
      const el = document.getElementById('inp-nome');
      if (el) updateCharCount(el);
    }
  }
};
