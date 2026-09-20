'use strict';

const { CAPABILITIES } = require('./job-contract');

const DEFAULT_PROVIDERS = Object.freeze({
  ollama:{local:true,capabilities:['chat','reason','code','vision','tools','embedding'],privacy:'local'},
  llamacpp:{local:true,capabilities:['chat','reason','code','embedding'],privacy:'local'},
  vllm:{local:true,capabilities:['chat','reason','code','vision','tools','embedding','rerank'],privacy:'local'},
  comfyui:{local:true,capabilities:['image','video'],privacy:'local'},
  huggingface:{local:false,capabilities:['chat','reason','code','vision','embedding','rerank','image','speech'],privacy:'cloud'},
  gemini:{local:false,capabilities:['chat','reason','code','vision','tools'],privacy:'cloud'},
  codex:{local:false,capabilities:['chat','reason','code','tools'],privacy:'cloud'},
  openai:{local:false,capabilities:['chat','reason','code','vision','tools','image','speech'],privacy:'cloud'},
  grok:{local:false,capabilities:['chat','reason','code','vision','tools'],privacy:'cloud'}
});
function createProviderGateway(overrides={}) {
  const providers={...DEFAULT_PROVIDERS,...overrides};
  function catalog(){return Object.entries(providers).map(([id,value])=>({id,...value,capabilities:value.capabilities.filter(item=>CAPABILITIES.includes(item))}))}
  function route(request,metrics={}) {
    const required=request.capabilities?.length?request.capabilities:[request.kind==='image'?'image':request.kind==='video'?'video':request.kind==='audio'?'speech':request.kind==='code'?'code':'chat'];
    const candidates=catalog().map(provider=>{const missing=required.filter(cap=>!provider.capabilities.includes(cap));const memory=Number(metrics[provider.id]?.memoryPressure||0);const latency=Number(metrics[provider.id]?.latencyMs||1000);const available=metrics[provider.id]?.available!==false;const rejected=[];if(missing.length)rejected.push(`missing ${missing.join(', ')}`);if(!available)rejected.push('runtime unavailable');if(request.privacy==='local'&&!provider.local)rejected.push('cloud not explicitly selected');if(request.provider&&request.provider!==provider.id)rejected.push('not operator-selected');const score=100-missing.length*40-(available?0:100)-memory*20-Math.min(20,latency/500);return{provider:provider.id,model:metrics[provider.id]?.model||null,local:provider.local,score:Math.round(score),rejected}});
    const accepted=candidates.filter(item=>!item.rejected.length).sort((a,b)=>b.score-a.score); if(!accepted.length)return{selected:null,task:request.kind,required,candidates,reason:'No provider meets the required capability, privacy, and availability constraints.'};
    return{selected:accepted[0],task:request.kind,required,candidates,reason:`Highest measured fit for ${required.join(', ')} with ${accepted[0].local?'local':'explicit cloud'} residency.`};
  }
  return{catalog,route};
}
module.exports={DEFAULT_PROVIDERS,createProviderGateway};
