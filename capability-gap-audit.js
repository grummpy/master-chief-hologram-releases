'use strict';
const AREAS=Object.freeze([
  {id:'reasoning',label:'Reasoning and answer quality',weight:14,target:100,score:88,gap:'Add model-graded domain benchmarks and citation entailment checks beyond deterministic contradiction and relevance scoring.'},
  {id:'context',label:'Context and durable memory',weight:11,target:100,score:91,gap:'Add provenance-aware memory summaries and larger retrieval-quality regression suites.'},
  {id:'orchestration',label:'Agent planning and recovery',weight:13,target:100,score:85,gap:'Resume from the exact interrupted tool step and add richer cross-tool compensation.'},
  {id:'tools',label:'Tools and connectors',weight:12,target:100,score:88,gap:'Expand the permissioned MCP client into a full typed tool browser with OAuth transports.'},
  {id:'artifacts',label:'Files and artifact production',weight:10,target:100,score:88,gap:'Add richer live document editing, preview diffs, and broader round-trip visual fidelity tests.'},
  {id:'research',label:'Research and evidence',weight:10,target:100,score:89,gap:'Add multi-page citation verification and automated temporal-conflict resolution.'},
  {id:'multimodal',label:'Image, audio, and video understanding',weight:10,target:100,score:82,gap:'Install a reviewed local vision model where absent and finish the external AMD video model/workflow bundle.'},
  {id:'recovery',label:'Reliability and self-repair',weight:8,target:100,score:91,gap:'Add automatic last-known-good binary rollback rehearsal and exact-step agent replay.'},
  {id:'ux',label:'Ease of use and accessibility',weight:7,target:100,score:89,gap:'Replace prompt-based MCP setup with a full visual tool browser and add automated screen-reader journeys.'},
  {id:'release',label:'Release and operations',weight:5,target:100,score:79,gap:'Obtain an Apple Developer ID, notarize production builds, and sign the update manifest with that identity.'}
]);
function runCapabilityGapAudit(){const weighted=AREAS.reduce((sum,item)=>sum+item.score*item.weight,0)/AREAS.reduce((sum,item)=>sum+item.weight,0);return{schemaVersion:1,benchmark:'Codex-style dependable local-first command center',assessedAt:new Date().toISOString(),score:Number(weighted.toFixed(1)),parity:false,areas:AREAS.map(item=>({...item,delta:item.target-item.score})),buildList:[...AREAS].sort((a,b)=>(b.target-b.score)*b.weight-(a.target-a.score)*a.weight).map((item,index)=>({priority:index+1,area:item.label,current:item.score,target:item.target,work:item.gap}))};}
module.exports={AREAS,runCapabilityGapAudit};
