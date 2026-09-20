'use strict';
(()=>{
  const stage=document.getElementById('holoStage'),layers=[document.getElementById('novaMotionA'),document.getElementById('novaMotionB')];
  if(!stage||layers.some(layer=>!layer))return;
  const sources={idle:'assets/characters/motion/nova-idle.mp4',ready:'assets/characters/motion/nova-attention.mp4',listening:'assets/characters/motion/nova-attention.mp4',thinking:'assets/characters/motion/nova-attention.mp4',speaking:'assets/characters/motion/nova-reporting.mp4',success:'assets/characters/motion/nova-reporting.mp4',error:'assets/characters/motion/nova-attention.mp4',wave:'assets/characters/motion/nova-reporting.mp4'};
  let enabled=false,active=0,current='';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.getElementById('app')?.dataset.reduceMotion==='true';
  function stop(){for(const layer of layers){layer.pause();layer.classList.remove('active');layer.removeAttribute('src');layer.load()}stage.classList.remove('motion-active');current=''}
  function setState(state='idle',force=false){if(!enabled||reduced()){stop();return}const source=sources[state]||sources.idle;if(!force&&source===current)return;const next=active===0?1:0,target=layers[next],previous=layers[active];target.src=source;target.currentTime=0;target.muted=true;target.loop=true;target.playsInline=true;target.oncanplay=()=>{target.classList.add('active');previous.classList.remove('active');stage.classList.add('motion-active');target.play().catch(()=>stage.classList.remove('motion-active'));active=next;current=source;target.oncanplay=null};target.load()}
  function setEnabled(value){enabled=Boolean(value);if(enabled)setState(document.getElementById('app')?.dataset.state||'idle',true);else stop()}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)layers.forEach(layer=>layer.pause());else if(enabled&&!reduced())layers[active].play().catch(()=>{})});
  window.masterChiefLivingPortrait={setState,setEnabled,isEnabled:()=>enabled};
  window.dispatchEvent(new CustomEvent('master-chief-living-ready'));
})();
