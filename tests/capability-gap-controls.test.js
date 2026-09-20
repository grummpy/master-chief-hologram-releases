'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {getToolRegistry,normalizeApprovals}=require('../tool-registry');
test('local vision has a dedicated default-deny permission',()=>{const tool=getToolRegistry().find(item=>item.id==='vision.analyze_local_image');assert.ok(tool);assert.equal(tool.approvalRequired,true);assert.equal(normalizeApprovals({})[tool.id],false)});
test('renderer exposes response review and explicit vision model controls',()=>{const source=fs.readFileSync(path.join(__dirname,'..','renderer.js'),'utf8');assert.match(source,/renderResponseQuality\(result\.quality,text\)/);assert.match(source,/Review and retry/);assert.match(source,/getVisionModels/);assert.match(source,/visionModelSelect/)});
