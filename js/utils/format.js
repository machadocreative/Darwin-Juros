// ── FORMATAÇÃO ──
function fmtBRL(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }); }
function fmtPerc(v, d = 4) { return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%'; }
function sanitizeName(s) { return s.replace(/[<>"'`\\\/\{\}\[\]]/g, '').trim().slice(0, 30); }
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ── HELPERS DE DATA ──
function parseMS(s) { if (!s) return null; const [y, m] = s.split('-').map(Number); return { y, m }; }
function mBetween(a, b) { return (b.y - a.y) * 12 + (b.m - a.m); }
function addM(base, n) { let m = base.m + n, y = base.y; while (m > 12) { m -= 12; y++; } return { y, m }; }
function mLabel(ym) { return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][ym.m - 1] + '/' + ym.y; }
function mLabelFull(s) {
  if (!s) return '';
  const ym = parseMS(s);
  return ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][ym.m - 1] + ' de ' + ym.y;
}
function fmtDate(iso) { return new Date(iso).toLocaleDateString('pt-BR'); }

// Normaliza vírgula → ponto para parseFloat funcionar em ambos os locales
function parseDecimal(val) { return parseFloat(String(val).replace(',', '.')); }

// ── MASKED INPUT ENGINE ──
// Cada campo tem um "tipo de máscara":
//   'brl'   → R$ 999.999,99   (centavos obrigatórios, 2 decimais)
//   'perc1' → 999,9%          (está sendo utilizado?)
//   'perc2' → 999,99%         (2 decimais — % de obra e % de financiamento)
//   'perc4' → 99,9999%        (2 inteiros, 4 decimais — taxa de juros e tr)
//   'int'   → número inteiro  (meses pagos no fluxo B)

function maskApply(rawDigits, tipo) {
  const d = rawDigits.replace(/\D/g, '');
  if (!d) return '';
  if (tipo === 'brl') {
    const n = parseInt(d, 10);
    const reais = Math.floor(n / 100);
    const cents = n % 100;
    return reais.toLocaleString('pt-BR') + ',' + (cents < 10 ? '0' : '') + cents;
  }
  if (tipo === 'perc1') {
    const n = parseInt(d, 10);
    const inteiro = Math.floor(n / 10);
    const dec = n % 10;
    return inteiro.toLocaleString('pt-BR') + ',' + dec;
  }
  if (tipo === 'perc2') {
    const limited = d.slice(0, 5); // máx: 10000 -> 100,00
    const n = parseInt(limited, 10) || 0;
    const inteiro = Math.floor(n / 100);
    const dec = String(n % 100).padStart(2, '0');
    return inteiro.toLocaleString('pt-BR') + ',' + dec;
  }
  if (tipo === 'perc4') {
    const limited = d.slice(0, 6); // máx: 99,9999
    const n = parseInt(limited, 10) || 0;
    const inteiro = Math.floor(n / 10000);
    const dec = String(n % 10000).padStart(4, '0');
    return inteiro.toLocaleString('pt-BR') + ',' + dec;
  }
  if (tipo === 'int') {
    return String(parseInt(d, 10));
  }
  return d;
}

function maskValue(el, tipo) {
  let digits = el.value.replace(/\D/g, '');
  if (tipo === 'perc2') {
    digits = digits.slice(0, 5); // 100,00
  }
  if (tipo === 'perc4') {
    digits = digits.slice(0, 6); // 99,9999
  }
  el.value = maskApply(digits, tipo);
  el.dataset.rawDigits = digits;
}

function maskInit(el, tipo, initialNumeric) {
  el.dataset.maskTipo = tipo;
  if (initialNumeric === '' || initialNumeric === null || initialNumeric === undefined) {
    el.value = ''; el.dataset.rawDigits = ''; return;
  }
  const num = parseFloat(initialNumeric) || 0;
  if (tipo === 'brl') {
    const cents = Math.round(num * 100);
    el.dataset.rawDigits = String(cents);
  } else if (tipo === 'perc1') {
    const tenths = Math.round(num * 10);
    el.dataset.rawDigits = String(tenths);
  } else if (tipo === 'perc2') {
    const hundredths = Math.round(num * 100);
    el.dataset.rawDigits = String(hundredths);
  } else if (tipo === 'perc4') {
    const ten4 = Math.round(num * 10000);
    el.dataset.rawDigits = String(ten4);
  } else if (tipo === 'int') {
    el.dataset.rawDigits = String(Math.round(num));
  }
  el.value = maskApply(el.dataset.rawDigits, tipo);
}

function maskRead(el) {
  const tipo = el?.dataset?.maskTipo;
  const digits = el?.dataset?.rawDigits || '';
  if (!digits) return NaN;
  const n = parseInt(digits, 10) || 0;
  if (tipo === 'brl')   return n / 100;
  if (tipo === 'perc1') return n / 10;
  if (tipo === 'perc2') return n / 100;
  if (tipo === 'perc4') return n / 10000;
  if (tipo === 'int')   return n;
  return NaN;
}

function maskOnInput(el) {
  maskValue(el, el.dataset.maskTipo);
}

function attachMask(id, tipo, initialNumeric) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.maskTipo = tipo;
  el.setAttribute('inputmode', 'numeric');
  el.type = 'text';
  maskInit(el, tipo, initialNumeric);
  el.oninput = () => { maskValue(el, tipo); el.classList.remove('invalid'); };
}
