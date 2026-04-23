// ════════════════════════════════════
//  AAKASH AI — Timer (timer.js)
//  Pomodoro focus timer
// ════════════════════════════════════

let pm = { on: false, time: 1500, mode: 'work', sess: 0 }, pi = null;

function rTimer(ct) {
  const min = Math.floor(pm.time / 60), sec = pm.time % 60;
  ct.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px">
  <div style="font-size:17px;font-weight:700;margin-bottom:8px">⏰ Pomodoro</div>
  <div style="font-size:14px;color:${pm.mode === 'work' ? 'var(--ac)' : 'var(--g)'};margin-bottom:32px;letter-spacing:3px;font-weight:600;text-transform:uppercase">${pm.mode === 'work' ? 'Focus' : 'Break'}</div>
  <div style="width:200px;height:200px;border-radius:50%;border:4px solid ${pm.mode === 'work' ? 'var(--ac)' : 'var(--g)'};display:flex;align-items:center;justify-content:center;margin-bottom:32px;${pm.on ? 'animation:pulse 2s infinite' : ''}">
    <div style="font-size:52px;font-weight:300;font-family:IBM Plex Mono,monospace">${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}</div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:24px">
    <button onclick="if(pm.on){clearInterval(pi);pm.on=false}else{pm.on=true;pi=setInterval(()=>{pm.time--;if(pm.time<=0){clearInterval(pi);pm.on=false;if(pm.mode==='work'){pm.sess++;pm.mode='break';pm.time=300}else{pm.mode='work';pm.time=1500}if('Notification' in window&&Notification.permission==='granted')new Notification('AAKASH AI',{body:pm.mode==='break'?'Break time!':'Focus!',icon:'icon-192.png'})}rTimer(document.getElementById('ct'))},1000)}rTimer(document.getElementById('ct'))" class="btn ${pm.on ? 'bs' : 'bp'}" style="padding:14px 36px;font-size:16px">${pm.on ? '⏸ Pause' : '▶ Start'}</button>
    <button onclick="clearInterval(pi);pm={on:false,time:1500,mode:'work',sess:pm.sess};rTimer(document.getElementById('ct'))" class="btn bs" style="padding:14px 24px">Reset</button>
  </div>
  <div style="font-size:14px;color:var(--t3)">Sessions: <span style="color:var(--ac);font-weight:700;font-size:18px">${pm.sess}</span></div></div>`;
}
