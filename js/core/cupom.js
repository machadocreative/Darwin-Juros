// ── VALIDAÇÃO DE CUPONS ──
// Códigos auto-verificáveis: o próprio código carrega um bloco verificador
// derivado do miolo + um segredo. O app recalcula e confere — sem servidor.
//
// IMPORTANTE: por ser um app client-side, o segredo abaixo é visível para quem
// abrir o DevTools. Isso impede "chutar" um código válido por acaso, mas não é
// criptografia forte. Adequado para cupons promocionais / uso pessoal.
//
// Este MESMO arquivo (mesmo SEGREDO e mesmo ALFABETO) é usado pelo gerador em
// tools/gerador-cupons.html. Se mudar o segredo aqui, os códigos já distribuídos
// deixam de valer.

// Alfabeto sem caracteres ambíguos (sem O/0, I/1) — facilita ditar/digitar.
const CUPOM_ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CUPOM_PREFIXO  = 'DRW';
const CUPOM_SEGREDO  = 'darwin-juros-2026-obra-evolucao'; // troque para invalidar tudo

// Hash determinístico simples (FNV-1a 32 bits) → suficiente para checksum.
function _cupomHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // força inteiro sem sinal
}

// Gera o bloco verificador (2 caracteres) a partir do miolo + segredo.
function _cupomChecksum(miolo) {
  const h = _cupomHash(CUPOM_SEGREDO + '|' + miolo);
  const a = CUPOM_ALFABETO[h % CUPOM_ALFABETO.length];
  const b = CUPOM_ALFABETO[Math.floor(h / CUPOM_ALFABETO.length) % CUPOM_ALFABETO.length];
  return a + b;
}

// Normaliza: maiúsculas, remove espaços. Mantém hífens para o split.
function _cupomNormalizar(code) {
  return (code || '').toUpperCase().replace(/\s+/g, '').trim();
}

// Valida um cupom auto-verificável no formato DRW-XXXX-XXXX-CC.
// Retorna true se o checksum bate com o miolo.
function validarCupomUnico(code) {
  const c = _cupomNormalizar(code);
  const partes = c.split('-');
  // Espera: [PREFIXO, BLOCO1(4), BLOCO2(4), VERIF(2)]
  if (partes.length !== 4) return false;
  const [prefixo, b1, b2, verif] = partes;
  if (prefixo !== CUPOM_PREFIXO) return false;
  if (b1.length !== 4 || b2.length !== 4 || verif.length !== 2) return false;

  // todos os caracteres devem pertencer ao alfabeto
  const corpo = b1 + b2 + verif;
  for (const ch of corpo) {
    if (!CUPOM_ALFABETO.includes(ch)) return false;
  }

  const miolo = b1 + b2;
  return _cupomChecksum(miolo) === verif;
}

// Validador único usado pelo app: aceita o código fixo legado E os códigos únicos.
// (CUPOM_VALIDO continua definido em state.js para compatibilidade.)
function validarCupom(code) {
  const c = _cupomNormalizar(code);
  if (typeof CUPOM_VALIDO !== 'undefined' && c === CUPOM_VALIDO) return true;
  return validarCupomUnico(c);
}
