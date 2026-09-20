'use strict';
const AREAS=Object.freeze([
  {id:'reasoning',label:'Reasoning and answer quality',weight:14,target:100,score:78,gap:'Add judge-based task evaluation, contradiction checks, and deliberate model routing.'},
  {id:'context',label:'Context and durable memory',weight:11,target:100,score:84,gap:'Add encrypted structured memory, provenance-aware summaries, and retrieval evaluation.'},
  {id:'orchestration',label:'Agent planning and recovery',weight:13,target:100,score:82,gap:'Add resumable execution from the exact interrupted step and richer cross-tool compensation.'},
  {id:'tools',label:'Tools and connectors',weight:12,target:100,score:76,gap:'Add a permissioned MCP client and broader typed connector actions.'},
  {id:'artifacts',label:'Files and artifact production',weight:10,target:100,score:86,gap:'Add richer live document editing, preview diffs, and round-trip fidelity tests.'},
  {id:'research',label:'Research and evidence',weight:10,target:100,score:77,gap:'Add full-page extraction, source-quality ranking, temporal conflict detection, and citation verification.'},
  {id:'multimodal',label:'Image, audio, and video understanding',weight:10,target:100,score:68,gap:'Add local vision/audio understanding and finish a verified AMD video workflow.'},
  {id:'recovery',label:'Reliability and self-repair',weight:8,target:100,score:84,gap:'Add crash-loop detection, exact step replay, and automated last-known-good rollback rehearsal.'},
  {id:'ux',label:'Ease of use and accessibility',weight:7,target:100,score:83,gap:'Add guided onboarding, compact layout, inline tool approvals, and full keyboard journey tests.'},
  {id:'release',label:'Release and operations',weight:5,target:100,score:64,gap:'Obtain Developer ID, notarize, add CI package smoke, and verify signed update manifests.'}
]);
function runCapabilityGapAudit(){const weighted=AREAS.reduce((sum,item)=>sum+item.score*item.weight,0)/AREAS.reduce((sum,item)=>sum+item.weight,0);return{schemaVersion:1,benchmark:'Codex-style dependable local-first command center',assessedAt:new Date().toISOString(),score:Number(weighted.toFixed(1)),parity:false,areas:AREAS.map(item=>({...item,delta:item.target-item.score})),buildList:[...AREAS].sort((a,b)=>(b.target-b.score)*b.weight-(a.target-a.score)*a.weight).map((item,index)=>({priority:index+1,area:item.label,current:item.score,target:item.target,work:item.gap}))};}
module.exports={AREAS,runCapabilityGapAudit};
