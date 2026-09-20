'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createJobRequest, createJobEvent, TERMINAL_JOB_EVENTS, typedJobError } = require('./job-contract');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function atomic(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); const temp=`${file}.${process.pid}.tmp`; fs.writeFileSync(temp, `${JSON.stringify(value,null,2)}\n`, { mode:0o600 }); fs.renameSync(temp,file); }
function createJobOrchestrator(file) {
  let state; try { state=JSON.parse(fs.readFileSync(file,'utf8')); } catch { state={version:1,jobs:[]}; }
  if (!Array.isArray(state.jobs)) state.jobs=[];
  for (const job of state.jobs) if (!TERMINAL_JOB_EVENTS.has(job.status) && !['paused','recoverable'].includes(job.status)) { job.status='recoverable'; job.stage='waiting'; job.updatedAt=new Date().toISOString(); }
  atomic(file,state);
  const save=()=>atomic(file,state);
  const find=id=>state.jobs.find(job=>job.request.requestId===String(id));
  function submit(input={}) {
    const request=createJobRequest(input); const existing=find(request.requestId) || state.jobs.find(job=>job.request.idempotencyKey===request.idempotencyKey);
    if (existing) return { job:clone(existing), created:false };
    const accepted=createJobEvent(request.requestId,'accepted',{sequence:1,message:'Request accepted',progress:1});
    const job={request,status:'accepted',stage:'accepted',progress:1,events:[accepted],plan:[],planCursor:0,route:null,artifacts:[],error:null,createdAt:request.createdAt,updatedAt:request.createdAt};
    state.jobs.unshift(job); state.jobs=state.jobs.slice(0,1000); save(); return {job:clone(job),created:true};
  }
  function event(id,name,detail={}) { const job=find(id); if(!job)throw new Error('Job was not found.'); const entry=createJobEvent(id,name,{...detail,sequence:job.events.length+1}); job.events.push(entry); job.status=name; job.stage=name; job.progress=entry.progress||job.progress; job.updatedAt=entry.at; if(entry.error)job.error=entry.error; save(); return clone(job); }
  function setRoute(id,route) { const job=find(id); if(!job)throw new Error('Job was not found.'); job.route=clone(route); save(); return event(id,'routing',{message:`Selected ${route.provider}${route.model?` · ${route.model}`:''}`,progress:8,receipt:route}); }
  function setPlan(id,plan=[]) { const job=find(id); if(!job)throw new Error('Job was not found.'); job.plan=plan.map((step,index)=>({id:String(step.id||`step-${index+1}`),title:String(step.title||step.description||`Step ${index+1}`),status:String(step.status||'pending'),evidence:step.evidence||null,stopCondition:step.stopCondition||null})); job.planCursor=0; save(); return event(id,'planning',{message:`${job.plan.length} step plan ready`,progress:12}); }
  function checkpoint(id,stepId,evidence) { const job=find(id); if(!job)throw new Error('Job was not found.'); const index=job.plan.findIndex(step=>step.id===String(stepId)); if(index<0)throw new Error('Plan step was not found.'); job.plan[index].status='complete'; job.plan[index].evidence=evidence||null; job.planCursor=Math.max(job.planCursor,index+1); save(); return event(id,'executing',{message:`Completed ${job.plan[index].title}`,progress:Math.min(90,20+Math.round(job.planCursor/Math.max(1,job.plan.length)*65)),evidence:evidence?[evidence]:[]}); }
  function addArtifact(id,artifact) { const job=find(id); if(!job)throw new Error('Job was not found.'); if(!job.artifacts.some(item=>item.id===artifact.id||item.sha256&&item.sha256===artifact.sha256))job.artifacts.push(clone(artifact)); save(); return clone(job); }
  function setResult(id,result) { const job=find(id); if(!job)throw new Error('Job was not found.'); job.result=clone(result); save(); return clone(job); }
  function action(id,action,payload={}) { const job=find(id); if(!job)throw new Error('Job was not found.'); if(action==='cancel')return event(id,'cancelled',{message:'Cancelled by operator',progress:job.progress}); if(action==='pause'){job.status='paused';job.stage='waiting';job.updatedAt=new Date().toISOString();save();return clone(job)} if(action==='resume'||action==='retry')return event(id,'waiting',{message:action==='retry'?'Retry requested':'Resume requested',progress:job.progress}); if(action==='steer'){job.request.parameters.steering=String(payload.steering||'').slice(0,12000);save();return event(id,'planning',{message:'Operator steering added',progress:job.progress})} throw new Error('Unknown job action.'); }
  function fail(id,error,context={}) { return event(id,'failed',{message:String(error?.message||error),progress:100,error:typedJobError(error,context)}); }
  return {submit,event,setRoute,setPlan,checkpoint,addArtifact,setResult,action,fail,get:id=>clone(find(id)||null),list:(limit=100)=>clone(state.jobs.slice(0,Math.min(1000,Math.max(1,Number(limit)||100)))),filePath:file};
}

module.exports = { createJobOrchestrator };
