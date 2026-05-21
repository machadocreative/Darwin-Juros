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

function renderProgress() {
  return `<div class="progress-wrap">${Array.from({ length: TOTAL_STEPS }, (_, i) =>
    `<div class="progress-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

// ── TOGGLE AJUDA VISUAL ──
function toggleHelp(id) {
  const content = document.getElementById(id);
  if (!content) return;
  content.style.display = content.style.display === 'none' ? 'block' : 'none';
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

  const banner = document.createElement('div');
  banner.id = 'save-reminder';
  banner.innerHTML = `
    <div class="save-reminder-title">💾 Você tem alterações não salvas</div>
    <div class="save-reminder-sub">Salve antes de sair para não perder as atualizações de % de obra e TR.</div>
    <div class="save-reminder-actions">
      <button class="save-reminder-save" id="reminder-save-btn">💾 Salvar agora</button>
      <button class="save-reminder-discard" id="reminder-discard-btn">Sair sem salvar</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('reminder-save-btn').addEventListener('click', () => {
    saveProfile();
    banner.remove();
  });
  document.getElementById('reminder-discard-btn').addEventListener('click', () => {
    banner.remove();
    onDiscard();
  });
}
