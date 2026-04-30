const MAX_MESES = 48;
const STORAGE_KEY = 'juros_obra_perfis';
const TOTAL_STEPS = 7;

let currentStep = 0;
let currentProfileId = null;
let screen = 'onboarding';
let hasUnsavedChanges = false;

const form = {
  mesInicial:'', valorTotal:'', percFinanciado:80,
  valorTerreno:'', seguro:'', taxaAdm:'',
  taxaAnual:'', trInicial:0.001, mesEntrega:'',
  nomeSimulacao:''
};
let meses = [];

// ── STORAGE ──
function loadProfiles(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }catch(e){return[];} }
function saveProfiles(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

function ultimaPercPaga(mesArr){
  // percorre de trás para frente e acha a última linha paga não bloqueada
  for(let i=mesArr.length-1;i>=0;i--){
    if(mesArr[i].pago && !mesArr[i].bloqueado) return mesArr[i].perc;
  }
  return null;
}

function saveProfile(){
  const profiles=loadProfiles();
  const data={
    id:currentProfileId||Date.now().toString(),
    nome:form.nomeSimulacao||'Apto 1',
    form:{...form},
    meses:JSON.parse(JSON.stringify(meses)),
    savedAt:new Date().toISOString()
  };
  const idx=profiles.findIndex(p=>p.id===data.id);
  if(idx>=0) profiles[idx]=data; else profiles.push(data);
  currentProfileId=data.id;
  saveProfiles(profiles);
  hasUnsavedChanges=false;
  showToast('Perfil salvo com sucesso!');
}

function deleteProfile(id){
  const card=document.getElementById('pc-'+id);
  if(!card) return;
  if(card.dataset.confirming==='1'){
    saveProfiles(loadProfiles().filter(p=>p.id!==id));
    showToast('Perfil excluído.');
    renderProfiles();
    return;
  }
  card.dataset.confirming='1';
  const btn=document.getElementById('del-'+id);
  if(btn){ btn.textContent='Confirmar?'; btn.style.color='var(--danger)'; btn.style.borderColor='var(--danger)'; }
  setTimeout(()=>{
    if(card&&card.dataset.confirming==='1'){
      card.dataset.confirming='0';
      if(btn){ btn.textContent='Excluir'; btn.style.color=''; btn.style.borderColor=''; }
    }
  },4000);
}

function loadProfile(id){
  const p=loadProfiles().find(p=>p.id===id);
  if(!p) return;
  currentProfileId=p.id;
  Object.assign(form,p.form);
  meses=JSON.parse(JSON.stringify(p.meses));
  screen='result';
  renderResult();
}

// ── HELPERS ──
function fmtBRL(v){ return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2}); }
function fmtPerc(v,d=4){ return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%'; }
function sanitizeName(s){ return s.replace(/[<>"'`\\\/\{\}\[\]]/g,'').trim().slice(0,30); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function parseMS(s){ if(!s) return null; const [y,m]=s.split('-').map(Number); return {y,m}; }
function mBetween(a,b){ return (b.y-a.y)*12+(b.m-a.m); }
function addM(base,n){ let m=base.m+n,y=base.y; while(m>12){m-=12;y++;} return {y,m}; }
function mLabel(ym){ return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][ym.m-1]+'/'+ym.y; }
function mLabelFull(s){ if(!s) return ''; const ym=parseMS(s); return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][ym.m-1]+' de '+ym.y; }
function fmtDate(iso){ return new Date(iso).toLocaleDateString('pt-BR'); }
// Normaliza vírgula → ponto para parseFloat funcionar em ambos os locales
function parseDecimal(val){ return parseFloat(String(val).replace(',','.')); }

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
function markError(id){ const el=document.getElementById(id); if(el){el.classList.add('invalid');el.focus();} }
function setHtml(html){ document.getElementById('main').innerHTML=html; }

function renderProgress(){
  return `<div class="progress-wrap">${Array.from({length:TOTAL_STEPS},(_,i)=>`<div class="progress-dot ${i<currentStep?'done':i===currentStep?'active':''}"></div>`).join('')}</div>`;
}

// ── CÁLCULO ──
function calcTable(){
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
  const ter=parseFloat(form.valorTerreno);
  const enc=parseFloat(form.seguro||0)+parseFloat(form.taxaAdm||25);
  const tm=parseFloat(form.taxaAnual)/100/12;
  const sMax=fin-ter;
  const ini=parseMS(form.mesInicial),ent=parseMS(form.mesEntrega);
  const total=Math.min(mBetween(ini,ent),MAX_MESES);
  const rows=[];
  // Parcela 1 = primeiro mês (terreno, perc 0)
  rows.push({mes:mLabel(ini),perc:0,saldo:ter,tr:form.trInicial,previsto:(tm+form.trInicial)*ter+enc,pago:false,bloqueado:false});
  for(let i=1;i<=total;i++){
    const ym=addM(ini,i);
    const perc=parseFloat(((i/total)*100).toFixed(1));
    const saldo=ter+sMax*(perc/100);
    rows.push({mes:mLabel(ym),perc,saldo,tr:form.trInicial,previsto:(tm+form.trInicial)*saldo+enc,pago:false,bloqueado:false});
  }
  return rows;
}

function recalcRow(i){
  const r=meses[i];
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
  const ter=parseFloat(form.valorTerreno);
  const enc=parseFloat(form.seguro||0)+parseFloat(form.taxaAdm||25);
  const tm=parseFloat(form.taxaAnual)/100/12;
  r.saldo=ter+(fin-ter)*(r.perc/100);
  r.previsto=(tm+r.tr)*r.saldo+enc;
}

function aplicaBloqueio(){
  let found=false;
  meses.forEach(r=>{ if(found){r.bloqueado=true;} else if(r.perc>=100){found=true;r.bloqueado=false;} else{r.bloqueado=false;} });
}

function proximoMes(){
  const ini=parseMS(form.mesInicial);
  return mLabel(addM(ini,meses.length));
}

// retorna o mês/ano da última parcela ativa (não bloqueada)
function ultimoMesAtivo(){
  const ativas=meses.filter(r=>!r.bloqueado);
  return ativas.length ? ativas[ativas.length-1].mes : mLabel(parseMS(form.mesInicial));
}

function adicionarLinha(){
  if(meses.length>=MAX_MESES+1) return;
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
  const ter=parseFloat(form.valorTerreno);
  const enc=parseFloat(form.seguro||0)+parseFloat(form.taxaAdm||25);
  const tm=parseFloat(form.taxaAnual)/100/12;
  const perc=Math.min(meses[meses.length-1]?.perc||0,100);
  const saldo=ter+(fin-ter)*(perc/100);
  meses.push({mes:proximoMes(),perc,saldo,tr:form.trInicial,previsto:(tm+form.trInicial)*saldo+enc,pago:false,bloqueado:false});
  aplicaBloqueio();
  hasUnsavedChanges=true;
  renderResult();
}

function removerLinha(){
  const last=meses[meses.length-1];
  if(!last||last.pago||meses.length<=1) return;
  meses.pop();
  aplicaBloqueio();
  hasUnsavedChanges=true;
  renderResult();
}

// ── NAVEGAÇÃO COM LEMBRETE DE SALVAR ──
function goProfilesSafe(){
  if(screen==='result' && hasUnsavedChanges){
    showSaveReminder(()=>{ hasUnsavedChanges=false; goProfiles(); });
  } else {
    goProfiles();
  }
}

function novaSimulacaoSafe(){
  if(screen==='result' && hasUnsavedChanges){
    showSaveReminder(()=>{ hasUnsavedChanges=false; novaSimulacao(); });
  } else {
    novaSimulacao();
  }
}

// ── EDITAR SIMULAÇÃO EXISTENTE ──
// Volta ao onboarding mantendo todos os dados já preenchidos.
// O usuário edita apenas o que quiser e ao chegar na tela de resultado
// os dados de meses (% e pago) são preservados se o nº de meses não mudou,
// ou regenerados se mudou o prazo.
function editarSimulacao(){
  if(hasUnsavedChanges){
    showSaveReminder(()=>{ hasUnsavedChanges=false; _iniciarEdicao(); });
  } else {
    _iniciarEdicao();
  }
}

function _iniciarEdicao(){
  // guarda os dados de resultado para restaurar após o onboarding
  const mesesBackup=JSON.parse(JSON.stringify(meses));
  const profileIdBackup=currentProfileId;
  screen='onboarding';
  currentStep=0;
  // ao terminar o onboarding em modo edição, reconcilia os meses
  window._editMode={ mesesBackup, profileIdBackup };
  renderStep();
}

function showSaveReminder(onDiscard){
  const existing=document.getElementById('save-reminder');
  if(existing) existing.remove();

  const banner=document.createElement('div');
  banner.id='save-reminder';
  banner.innerHTML=`
    <div class="save-reminder-title">💾 Você tem alterações não salvas</div>
    <div class="save-reminder-sub">Salve antes de sair para não perder as atualizações de % de obra e TR.</div>
    <div class="save-reminder-actions">
      <button class="save-reminder-save" id="reminder-save-btn">💾 Salvar agora</button>
      <button class="save-reminder-discard" id="reminder-discard-btn">Sair sem salvar</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('reminder-save-btn').addEventListener('click',()=>{
    saveProfile();
    banner.remove();
  });
  document.getElementById('reminder-discard-btn').addEventListener('click',()=>{
    banner.remove();
    onDiscard();
  });
}

// ── CELEBRAÇÃO ──
function showCelebration(){
  launchConfetti();
  document.getElementById('celebration').classList.add('show');
}
function closeCelebration(){
  document.getElementById('celebration').classList.remove('show');
}
function launchConfetti(){
  const colors=['#1A6B4A','#F6C90E','#E74C3C','#3498DB','#9B59B6','#2ECC71','#F39C12'];
  const cel=document.getElementById('celebration');
  for(let i=0;i<60;i++){
    const el=document.createElement('div');
    el.className='confetti-piece';
    // cssText aqui é intencional: valores gerados aleatoriamente em runtime (posição, cor, tamanho, duração)
    el.style.cssText=`
      left:${Math.random()*100}%;
      top:${-10-Math.random()*20}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;
      border-radius:${Math.random()>0.5?'50%':'2px'};
      animation-duration:${1.5+Math.random()*2}s;
      animation-delay:${Math.random()*0.5}s;
    `;
    cel.appendChild(el);
    setTimeout(()=>el.remove(), 4000);
  }
}

// ── TOGGLE PAGO ──
function togglePago(i){
  const r=meses[i];
  if(r.bloqueado) return;
  if(!r.pago){
    for(let j=0;j<i;j++){
      if(!meses[j].bloqueado&&!meses[j].pago){showToast('⚠️ Marque primeiro a parcela de '+meses[j].mes+'.');return;}
    }
    r.pago=true;
    hasUnsavedChanges=true;
    // verifica se é a parcela com 100% de obra
    if(r.perc>=100) setTimeout(showCelebration,300);
  } else {
    for(let j=i+1;j<meses.length;j++){
      if(!meses[j].bloqueado&&meses[j].pago){showToast('⚠️ Desmarque primeiro a parcela de '+meses[j].mes+'.');return;}
    }
    r.pago=false;
    hasUnsavedChanges=true;
  }
  refreshTable();
}

// ── EDIÇÃO INLINE ──
function updatePerc(i, rawVal){
  const el=document.getElementById('pi-'+i);

  // bloqueia edição em linhas já pagas
  if(meses[i].pago){
    if(el) el.value=meses[i].perc; // restaura valor original
    showToast('⚠️ Desmarque "Pago" antes de editar a % desta parcela.');
    return;
  }

  const v=parseDecimal(rawVal);
  if(rawVal===''||isNaN(v)||v<0||v>100){ if(el) el.classList.add('invalid'); return; }

  // impede valor decrescente em relação à linha anterior não-bloqueada
  let prevPerc=-1;
  for(let j=i-1;j>=0;j--){
    if(!meses[j].bloqueado){ prevPerc=meses[j].perc; break; }
  }
  if(v<prevPerc){
    if(el){ el.classList.add('invalid'); el.title='O valor não pode ser menor que a linha anterior ('+prevPerc+'%).'; }
    showToast('⚠️ % de obra não pode diminuir. Anterior: '+prevPerc+'%');
    return;
  }

  if(el){ el.classList.remove('invalid'); el.title=''; }
  meses[i].perc=v;
  recalcRow(i);
  aplicaBloqueio();
  hasUnsavedChanges=true;
  refreshTable();
}

function validatePercBlur(i){
  const el=document.getElementById('pi-'+i); if(!el) return;
  const v=parseDecimal(el.value);
  if(el.value===''||isNaN(v)||v<0||v>100){ el.classList.add('invalid'); }
  else { el.classList.remove('invalid'); }
}

function updateTR(i, rawVal){
  const el=document.getElementById('ti-'+i);
  const v=parseDecimal(rawVal);
  if(rawVal===''||isNaN(v)||v<0){ if(el) el.classList.add('invalid'); return; }
  if(el){ el.classList.remove('invalid'); el.title=''; }
  meses[i].tr=v/100;
  recalcRow(i);
  hasUnsavedChanges=true;
  const elP=document.getElementById('rp-'+i);
  if(elP) elP.textContent=meses[i].bloqueado?'—':fmtBRL(meses[i].previsto);
  updateSummary();
}

function validateTRBlur(i){
  const el=document.getElementById('ti-'+i); if(!el) return;
  const v=parseDecimal(el.value);
  if(el.value===''||isNaN(v)||v<0){ el.classList.add('invalid'); }
  else { el.classList.remove('invalid'); }
}

function refreshTable(){
  meses.forEach((r,i)=>{
    const row=document.getElementById('row-'+i); if(!row) return;
    row.className=r.bloqueado?'obra-done':r.pago?'pago-row':'';
    const pi=document.getElementById('pi-'+i);
    if(pi){
      pi.disabled=r.bloqueado;
      if(!r.bloqueado) pi.value=r.perc;
      pi.classList.toggle('perc-locked', r.pago && !r.bloqueado);
    }
    const ti=document.getElementById('ti-'+i);
    if(ti) ti.disabled=r.bloqueado;
    const rs=document.getElementById('rs-'+i);
    if(rs) rs.textContent=r.bloqueado?'—':fmtBRL(r.saldo);
    const rp=document.getElementById('rp-'+i);
    if(rp) rp.textContent=r.bloqueado?'—':fmtBRL(r.previsto);
    const bp=document.getElementById('bp-'+i);
    if(bp){
      if(r.bloqueado)      bp.outerHTML=`<span id="bp-${i}" class="badge-blocked">—</span>`;
      else if(r.pago)      bp.outerHTML=`<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`;
      else                 bp.outerHTML=`<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">—</button>`;
    }
  });
  const btnAdd=document.getElementById('btn-add'),btnRem=document.getElementById('btn-rem'),rcInfo=document.getElementById('rc-info');
  if(btnAdd) btnAdd.disabled=meses.length>=MAX_MESES+1;
  if(btnRem){ const last=meses[meses.length-1]; btnRem.disabled=meses.length<=1||(last&&last.pago); }
  if(rcInfo) rcInfo.textContent=(meses.length-1)+' parcela(s) · máx. '+MAX_MESES;
  // atualiza subtítulo com mês inicial e último mês ativo
  const sub=document.getElementById('result-subtitle');
  const ativasCount=meses.filter(r=>!r.bloqueado).length;
  if(sub) sub.textContent=ativasCount+' parcelas · '+(meses[0]?.mes||'')+' → '+ultimoMesAtivo();
  updateSummary();
}

function updateSummary(){
  const ativas=meses.filter(r=>!r.bloqueado);
  const total=ativas.reduce((s,r)=>s+r.previsto,0);
  const pago=ativas.filter(r=>r.pago).reduce((s,r)=>s+r.previsto,0);
  const media=ativas.length?total/ativas.length:0;
  const e=id=>document.getElementById(id);
  if(e('sum-total')) e('sum-total').textContent=fmtBRL(total);
  if(e('sum-pago'))  e('sum-pago').textContent=fmtBRL(pago);
  if(e('sum-media')) e('sum-media').textContent=fmtBRL(media);
}

// ── TELA: PERFIS ──
function goProfiles(){ screen='profiles'; renderProfiles(); }

function renderProfiles(){
  const profiles=loadProfiles();
  const list=profiles.length
    ? profiles.map(p=>{
        const perc=ultimaPercPaga(p.meses);
        const percLabel=perc!==null?`✅ Última parcela paga: ${perc}% de obra`:'Nenhuma parcela paga ainda';
        return `<div class="profile-card" id="pc-${p.id}" onclick="loadProfile('${p.id}')">
          <div>
            <div class="pc-name">${escHtml(p.nome)}</div>
            <div class="pc-sub">Salvo em ${fmtDate(p.savedAt)} · ${p.meses.length} parcelas</div>
            <div class="pc-perc">${percLabel}</div>
          </div>
          <div class="pc-actions" onclick="event.stopPropagation()">
            <button class="pc-btn" onclick="loadProfile('${p.id}')">Abrir</button>
            <button class="pc-btn del" id="del-${p.id}" onclick="deleteProfile('${p.id}')">Excluir</button>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">📭</div><p>Nenhum perfil salvo ainda.<br>Faça uma simulação e clique em <strong>Salvar</strong>.</p></div>`;

  setHtml(`
    <div class="screen-title">Meus Imóveis</div>
    <div class="screen-sub">Simule e salve quantos perfis quiser.</div>
    <div class="profile-list">${list}</div>
    <button class="btn btn-primary" onclick="novaSimulacao()">+ Nova simulação</button>
  `);
}

function novaSimulacao(){
  currentProfileId=null;
  window._editMode=null;
  Object.keys(form).forEach(k=>{ form[k]=''; });
  form.percFinanciado=80; form.trInicial=0.001; // TR padrão fixo: 0,1000%
  meses=[]; currentStep=0; screen='onboarding';
  renderStep();
}

// ── ONBOARDING ──
function nextStep(){
  try{
    if(currentStep===0){
      const v=document.getElementById('inp-mesInicial').value;
      if(!v){markError('inp-mesInicial');return;} form.mesInicial=v;
    } else if(currentStep===1){
      const v=document.getElementById('inp-valorTotal').value;
      if(!v||parseFloat(v)<=0){markError('inp-valorTotal');return;}
      form.valorTotal=v; form.percFinanciado=document.getElementById('inp-percFinanciado').value||80;
    } else if(currentStep===2){
      const v=document.getElementById('inp-valorTerreno').value;
      const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
      if(!v||parseFloat(v)<=0){markError('inp-valorTerreno');return;}
      if(parseFloat(v)>=fin){markError('inp-valorTerreno');document.getElementById('err-terreno').style.display='block';return;}
      form.valorTerreno=v;
    } else if(currentStep===3){
      const s=document.getElementById('inp-seguro').value;
      if(!s||parseFloat(s)<=0){markError('inp-seguro');return;}
      form.seguro=s; form.taxaAdm=document.getElementById('inp-taxaAdm').value||25;
    } else if(currentStep===4){
      const v=document.getElementById('inp-taxaAnual').value;
      if(!v||parseFloat(v)<=0){markError('inp-taxaAnual');return;} form.taxaAnual=v;
    } else if(currentStep===5){
      const v=document.getElementById('inp-mesEntrega').value;
      if(!v){markError('inp-mesEntrega');return;}
      const ini=parseMS(form.mesInicial),fin=parseMS(v);
      if(mBetween(ini,fin)<=0){markError('inp-mesEntrega');return;}
      form.mesEntrega=v;
    } else if(currentStep===6){
      form.nomeSimulacao=sanitizeName(document.getElementById('inp-nome').value)||'Apto 1';
    }
    currentStep++;
    if(currentStep>=TOTAL_STEPS){
      const edit=window._editMode;
      if(edit){
        // modo edição: reconstrói a tabela com o novo prazo
        const newTable=calcTable();
        const backup=edit.mesesBackup;
        // preserva perc, tr e pago das linhas existentes, completa com novas
        meses=newTable.map((row,i)=>{
          if(i<backup.length){
            return { ...row, perc:backup[i].perc, tr:backup[i].tr, pago:backup[i].pago };
          }
          return row;
        });
        // recalcula saldo/previsto de cada linha com os valores restaurados
        meses.forEach((_,i)=>recalcRow(i));
        aplicaBloqueio();
        currentProfileId=edit.profileIdBackup;
        window._editMode=null;
        hasUnsavedChanges=true;
      } else {
        meses=calcTable();
      }
      screen='result';
      renderResult();
    }
    else renderStep();
  } catch(e){ console.error(e); }
}

function prevStep(){ if(currentStep>0){currentStep--;renderStep();} }

function renderStep(){
  const fin_val=form.valorTotal?parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100):0;
  const ter=parseFloat(form.valorTerreno)||0;
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100)||0;
  const seg=parseFloat(form.seguro)||0;
  const ta=parseFloat(form.taxaAnual)||0;

  const steps=[
    `<div class="step-num">01 / 07</div>
    <div class="step-title">Qual o mês da 1ª parcela de evolução?</div>
    <div class="step-hint">Consta no seu contrato com a Caixa Econômica.</div>
    <input type="month" id="inp-mesInicial" value="${form.mesInicial}" oninput="this.classList.remove('invalid')">`,

    `<div class="step-num">02 / 07</div>
    <div class="step-title">Qual o valor total do imóvel?</div>
    <div class="step-hint">O valor cheio do apartamento conforme contrato.</div>
    <label class="field-label">Valor total</label>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-valorTotal" class="has-pre" placeholder="250000" value="${form.valorTotal}" min="0" step="100" oninput="atualizaFin()"></div>
    <div class="field-group">
      <label class="field-label">Percentual financiado</label>
      <div class="input-wrap"><input type="number" id="inp-percFinanciado" class="has-suf" placeholder="80" value="${form.percFinanciado}" min="1" max="100" step="1" oninput="atualizaFin()"><span class="suf">%</span></div>
    </div>
    <div class="confirm-box" id="box-fin" style="${fin_val>0?'':'display:none'}">
      <div><div class="c-label">Valor financiado</div><div class="c-sublabel">Confirme antes de continuar</div></div>
      <div class="c-val" id="val-fin">${fin_val>0?fmtBRL(fin_val):''}</div>
    </div>`,

    `<div class="step-num">03 / 07</div>
    <div class="step-title">Qual o valor do terreno?</div>
    <div class="step-hint">Nos contratos da Caixa Econômica, consta no <strong>item 1.7</strong> do seu contrato Caixa.</div>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-valorTerreno" class="has-pre" placeholder="12000" value="${form.valorTerreno}" min="0" step="100" oninput="atualizaTer();this.classList.remove('invalid');document.getElementById('err-terreno').style.display='none'"></div>
    <div class="error-msg" id="err-terreno">O valor do terreno deve ser menor que o financiado (${fmtBRL(fin)}).</div>
    <div class="diff-box" id="box-ter" style="${ter>0?'':'display:none'}">
      <div class="d-title">Composição do financiamento</div>
      <div class="diff-row"><span class="d-label">Valor financiado total</span><span class="d-val">${fmtBRL(fin)}</span></div>
      <div class="diff-row"><span class="d-label">(−) Terreno</span><span class="d-val" id="d-ter">${ter>0?fmtBRL(ter):'—'}</span></div>
      <hr class="diff-divider">
      <div class="diff-row hl"><span class="d-label">Saldo máximo durante a obra</span><span class="d-val" id="d-saldo">${ter>0?fmtBRL(fin-ter):'—'}</span></div>
    </div>
    <div class="info-box">💡 O valor terreno já está incluso como saldo devedor desde a assinatura. Isso explica porque você terá pagamento de parcelas mesmo em 0% de Evolução de Obra.</div>`,

    `<div class="step-num">04 / 07</div>
    <div class="step-title">Quais os seus encargos mensais?</div>
    <div class="step-hint">Valores cobrados mensalmente pela Caixa, independente do andamento da obra.</div>
    <label class="field-label">1. Seguro</label>
    <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-seguro" class="has-pre" placeholder="00,00" value="${form.seguro}" min="0" step="0.01" oninput="atualizaEncargos();this.classList.remove('invalid')"></div>
    <div class="field-group">
      <label class="field-label">2. Taxa Administrativa</label>
      <div class="input-wrap"><span class="pre">R$</span><input type="number" id="inp-taxaAdm" class="has-pre" placeholder="25,00" value="${form.taxaAdm||''}" min="0" step="0.01" oninput="atualizaEncargos()"></div>
      <div class="info-box">O valor de seguro é diferente para cada comprador - Verifique no seu contrato. Já a Taxa de Administração da Caixa Econômica possui um valor fixo de R$ 25,00.</div>
    </div>
    <div class="confirm-box" id="box-enc" style="${seg>0?'':'display:none'}">
      <div><div class="c-label">Total de encargos mensais</div></div>
      <div class="c-val" id="val-enc">${seg>0?fmtBRL(seg+25):''}</div>
    </div>`,

    `<div class="step-num">05 / 07</div>
    <div class="step-title">Qual a sua taxa de juros anual?</div>
    <div class="step-hint">Consta na primeira página do contrato. O app converte para taxa mensal automaticamente.</div>
    <div class="input-wrap"><input type="number" id="inp-taxaAnual" class="has-suf" placeholder="10,0000" value="${form.taxaAnual}" min="0" step="0.01" oninput="atualizaTaxa()"><span class="suf">% a.a.</span></div>
    <div class="confirm-box" id="box-taxa" style="${ta>0?'':'display:none'}">
      <div>
        <div class="c-label">Taxa mensal + TR base (0,1000%)</div>
        <div class="c-sublabel">Usada nos cálculos mensais de cada parcela</div>
      </div>
      <div class="c-val" id="val-taxa">${ta>0?fmtPerc(ta/12+0.001,4):''}</div>
    </div>
    <div class="info-box">O valor de cada parcela de Evolução de Obra é calculado pela soma da <strong>Taxa de Juros mensal</strong> do seu financiamento com a <strong>Taxa Referencial (TR)</strong>, divulgada pelo Banco Central todo mês. Utilizaremos 0,1000% de TR como valor inicial — você poderá editar esse valor mês a mês na sua tela de resultados para maior precisão.</div>`,

    `<div class="step-num">06 / 07</div>
    <div class="step-title">Qual a data de entrega prevista?</div>
    <div class="step-hint">Sua 1ª parcela começa em <strong>${mLabelFull(form.mesInicial)}</strong>. A entrega define quantos meses de evolução serão simulados.</div>
    <input type="month" id="inp-mesEntrega" value="${form.mesEntrega}" oninput="atualizaMeses();this.classList.remove('invalid')">
    <div id="badge-meses"></div>`,

    `<div class="step-num">07 / 07</div>
    <div class="step-title">Como quer chamar essa simulação?</div>
    <div class="step-hint">Máximo 30 caracteres. Ex: Apto Centro, Torre B, Meu apê.</div>
    <input type="text" id="inp-nome" placeholder="Apto 1" value="${escHtml(form.nomeSimulacao||'')}" maxlength="30" oninput="updateCharCount(this)">
    <div class="char-count" id="char-count">0 / 30</div>`
  ];

  const btnLabel=currentStep===6?'Ver resultados →':(currentStep===1?'Confirmar e continuar →':'Continuar →');
  setHtml(`
    ${renderProgress()}
    <div class="step-card">
      ${steps[currentStep]}
      <button class="btn btn-primary" onclick="nextStep()">${btnLabel}</button>
      ${currentStep>0?'<button class="btn btn-back" onclick="prevStep()">← Voltar</button>':''}
    </div>`);

  if(currentStep===5) setTimeout(()=>{if(form.mesEntrega)atualizaMeses();},50);
  if(currentStep===6) setTimeout(()=>{ const el=document.getElementById('inp-nome'); if(el) updateCharCount(el); },50);
  if(currentStep===2) setTimeout(()=>{if(ter>0)atualizaTer();},50);
  setTimeout(()=>{ const f=document.querySelector('.step-card input'); if(f) f.focus(); },80);
}

function atualizaFin(){
  const vt=parseFloat(document.getElementById('inp-valorTotal')?.value)||0;
  const p=parseFloat(document.getElementById('inp-percFinanciado')?.value)||80;
  const fin=vt*(p/100);
  const box=document.getElementById('box-fin'),val=document.getElementById('val-fin');
  if(box&&val){box.style.display=vt>0?'flex':'none';val.textContent=fmtBRL(fin);}
}
function atualizaTer(){
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
  const ter=parseFloat(document.getElementById('inp-valorTerreno')?.value)||0;
  const box=document.getElementById('box-ter');
  if(box) box.style.display=ter>0?'block':'none';
  const dt=document.getElementById('d-ter'),ds=document.getElementById('d-saldo');
  if(dt) dt.textContent=fmtBRL(ter);
  if(ds) ds.textContent=fmtBRL(Math.max(0,fin-ter));
}
function atualizaEncargos(){
  const s=parseFloat(document.getElementById('inp-seguro')?.value)||0;
  const a=parseFloat(document.getElementById('inp-taxaAdm')?.value)||25;
  const box=document.getElementById('box-enc'),val=document.getElementById('val-enc');
  if(box&&val){box.style.display=s>0?'flex':'none';val.textContent=fmtBRL(s+a);}
}
function atualizaTaxa(){
  const ta=parseFloat(document.getElementById('inp-taxaAnual')?.value)||0;
  const box=document.getElementById('box-taxa'),val=document.getElementById('val-taxa');
  // mostra taxa mensal + TR base (0,1000%) = taxa combinada usada no cálculo
  if(box&&val){box.style.display=ta>0?'flex':'none';val.textContent=fmtPerc(ta/12+0.001,4);}
}
function atualizaMeses(){
  const v=document.getElementById('inp-mesEntrega')?.value;
  if(!v||!form.mesInicial) return;
  const ini=parseMS(form.mesInicial),fin=parseMS(v);
  const n=mBetween(ini,fin);
  const badge=document.getElementById('badge-meses');
  if(!badge) return;
  if(n>=1&&n<=MAX_MESES)
    badge.innerHTML=`<div class="months-badge">📅 ${mLabelFull(form.mesInicial)} → ${mLabelFull(v)} = <strong>${n} parcela(s)</strong></div>`;
  else if(n>MAX_MESES)
    badge.innerHTML=`<div class="months-badge err">⚠️ Máximo ${MAX_MESES} parcelas. Serão exibidas as primeiras ${MAX_MESES}.</div>`;
  else
    badge.innerHTML=`<div class="months-badge err">⚠️ A entrega deve ser após a 1ª parcela.</div>`;
}
function updateCharCount(inp){
  const len=sanitizeName(inp.value).length;
  const el=document.getElementById('char-count');
  if(el){el.textContent=len+' / 30';el.className='char-count'+(len>=28?' warn':'');}
}

// ── RESULTADO ──
function renderResult(){
  aplicaBloqueio();
  hasUnsavedChanges=false; // reset ao entrar pela primeira vez / recarregar
  const fin=parseFloat(form.valorTotal)*(parseFloat(form.percFinanciado)/100);
  const ativas=meses.filter(r=>!r.bloqueado);
  const total=ativas.reduce((s,r)=>s+r.previsto,0);
  const pago=ativas.filter(r=>r.pago).reduce((s,r)=>s+r.previsto,0);
  const media=ativas.length?total/ativas.length:0;
  const lastPago=meses[meses.length-1]?.pago||false;

  // numeração começa em 1
  const tableRows=meses.map((r,i)=>`
    <tr id="row-${i}" class="${r.bloqueado?'obra-done':r.pago?'pago-row':''}">
      <td class="num-col">${i+1}</td>
      <td class="td-mes">${escHtml(r.mes)}</td>
      <td class="td-right">
        <input id="pi-${i}" class="perc-input${r.pago?' perc-locked':''}" type="text" inputmode="decimal" value="${r.perc}"
          ${r.bloqueado?'disabled':''}
          onchange="updatePerc(${i},this.value)"
          onblur="validatePercBlur(${i})">
      </td>
      <td id="rs-${i}" class="val-col">${r.bloqueado?'—':fmtBRL(r.saldo)}</td>
      <td class="td-right">
        <input id="ti-${i}" class="tr-input" type="text" inputmode="decimal" value="${(r.tr*100).toFixed(4)}"
          ${r.bloqueado?'disabled':''}
          onchange="updateTR(${i},this.value)"
          onblur="validateTRBlur(${i})">
      </td>
      <td id="rp-${i}" class="val-col td-prev">${r.bloqueado?'—':fmtBRL(r.previsto)}</td>
      <td class="td-center">
        ${r.bloqueado?`<span id="bp-${i}" class="badge-blocked">—</span>`
          :r.pago?`<button id="bp-${i}" class="badge-pago" onclick="togglePago(${i})">✓ Pago</button>`
          :`<button id="bp-${i}" class="badge-nao" onclick="togglePago(${i})">—</button>`}
      </td>
    </tr>`).join('');

  setHtml(`    
    <div class="result-header">
      <h2>${escHtml(form.nomeSimulacao||'Apto 1')}</h2>
      <p id="result-subtitle">${ativas.length} parcelas · ${meses[0]?.mes||''} → ${ultimoMesAtivo()}</p>
      <div class="rh-actions">
        <button class="rh-btn save" onclick="saveProfile()">💾 Salvar</button>
        <button class="rh-btn" onclick="editarSimulacao()">✏️ Editar</button>
      </div>
    </div>

    <div class="sticky-summary">
      <div class="summary-grid">
        <div class="summary-card"><div class="s-label">Financiado</div><div class="s-val">${fmtBRL(fin)}</div></div>
        <div class="summary-card"><div class="s-label">Média estimada</div><div class="s-val" id="sum-media">${fmtBRL(media)}</div></div>
        <div class="summary-card paid"><div class="s-label">Total pago até agora</div><div class="s-val" id="sum-pago">${fmtBRL(pago)}</div></div>
        <div class="summary-card accent"><div class="s-label">Total estimado</div><div class="s-val" id="sum-total">${fmtBRL(total)}</div></div>
      </div>
    </div>

    <div class="alert">TR editável por mês (coluna TR%). Atualize com o valor oficial do Banco Central a cada mês. <a href="https://www.debit.com.br/tabelas/tr-bacen" target="_blank">Consulte aqui</a></div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th class="th-center">#</th><th>Mês</th>
          <th class="th-right">% Obra</th><th class="th-right">Saldo dev.</th>
          <th class="th-right">TR %</th><th class="th-right">Previsto</th>
          <th class="th-center">Pago?</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="row-controls">
        <span class="rc-info" id="rc-info">${ativas.length} parcela(s) · máx. ${MAX_MESES}</span>
        <button class="rc-btn" id="btn-rem" onclick="removerLinha()" title="Remover última parcela" ${meses.length<=1||lastPago?'disabled':''}>−</button>
        <button class="rc-btn" id="btn-add" onclick="adicionarLinha()" title="Adicionar parcela" ${meses.length>=MAX_MESES+1?'disabled':''}>+</button>
      </div>
    </div>
    <p class="note">Edite % de obra e TR mês a mês. Use + / − para ajustar o número de parcelas.</p>
    <button class="btn-reset" onclick="goProfilesSafe()">← Voltar aos perfis</button>
  `);
}

// ── INIT ──
window.addEventListener('load',()=>{
  setTimeout(()=>{ document.getElementById('splash').classList.add('hide'); },1200);
  const profiles=loadProfiles();
  if(profiles.length>0){ screen='profiles'; renderProfiles(); }
  else { screen='onboarding'; renderStep(); }
});
