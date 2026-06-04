// ── UI HELPERS ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function markError(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('invalid'); el.focus(); }
}

function setHtml(html) {
  document.getElementById('main').innerHTML = html;
}

// ── MODAL DE AJUDA ──
function openHelpModal(questionKey) {
  const q = questions[questionKey];
  if (!q?.help) return;
  const { title, img, alt, caption } = q.help;
  const overlay = document.createElement('div');
  overlay.id = 'help-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">${title || 'Como encontrar?'}</div>
      ${img ? `<img src="${img}" alt="${alt || ''}" class="help-image">` : ''}
      <p class="help-caption">${caption}</p>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="closeHelpModal()">Entendi ✓</button>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeHelpModal(); });
  document.body.appendChild(overlay);
}

function closeHelpModal() {
  document.getElementById('help-modal-overlay')?.remove();
}

function updateCharCount(inp) {
  const len = sanitizeName(inp.value).length;
  const el = document.getElementById('char-count');
  if (el) { el.textContent = len + ' / 30'; el.className = 'char-count' + (len >= 28 ? ' warn' : ''); }
}

// ── CELEBRAÇÃO ──
function showCelebration() {
  launchConfetti();
  document.getElementById('celebration').classList.add('show');
}

function closeCelebration() {
  document.getElementById('celebration').classList.remove('show');
}

function launchConfetti() {
  const colors = ['#1A6B4A', '#F6C90E', '#E74C3C', '#3498DB', '#9B59B6', '#2ECC71', '#F39C12'];
  const cel = document.getElementById('celebration');
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    // cssText aqui é intencional: valores gerados aleatoriamente em runtime
    el.style.cssText = `
      left:${Math.random() * 100}%;
      top:${-10 - Math.random() * 20}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration:${1.5 + Math.random() * 2}s;
      animation-delay:${Math.random() * 0.5}s;
    `;
    cel.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// ── LEMBRETE DE SALVAR ──
function showSaveReminder(onDiscard) {
  const existing = document.getElementById('save-reminder');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'save-reminder';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">Você tem alterações não salvas</div>
      <div class="save-reminder-sub">Deseja manter suas alterações ou continuar sem salvar?</div>
      <div class="modal-actions">
        <button class="btn btn-back" id="reminder-discard-btn">Continuar sem salvar</button>
        <button class="btn btn-primary" id="reminder-save-btn">💾 Manter alterações</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('reminder-save-btn').addEventListener('click', () => {
    saveProfile();
    overlay.remove();
  });
  document.getElementById('reminder-discard-btn').addEventListener('click', () => {
    overlay.remove();
    onDiscard();
  });
}
