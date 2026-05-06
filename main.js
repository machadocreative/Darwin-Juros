// ── INICIALIZAÇÃO ──
window.addEventListener('load', () => {
  setTimeout(() => { document.getElementById('splash').classList.add('hide'); }, 1200);
  const profiles = loadProfiles();
  if (profiles.length > 0) { screen = 'profiles'; renderProfiles(); }
  else { screen = 'onboarding'; renderStep(); }
});
