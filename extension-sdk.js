'use strict';
const fs=require('fs');const path=require('path');const crypto=require('crypto');
const SDK_VERSION='1.0';
function validateExtensionManifest(value={}){
  const manifest={id:String(value.id||''),name:String(value.name||''),version:String(value.version||''),sdkVersion:String(value.sdkVersion||''),capabilities:Array.isArray(value.capabilities)?value.capabilities.map(String):[],entry:String(value.entry||'')};
  if(!/^[a-z0-9][a-z0-9.-]{2,80}$/.test(manifest.id))throw new Error('Extension id is invalid.');
  if(!manifest.name||!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(manifest.version))throw new Error('Extension name and semantic version are required.');
  if(manifest.sdkVersion!==SDK_VERSION)throw new Error(`Extension requires unsupported SDK ${manifest.sdkVersion||'unknown'}.`);
  const allowed=new Set(['provider.recipe','model.recipe','tool.read-only','renderer.panel']);if(manifest.capabilities.some(item=>!allowed.has(item)))throw new Error('Extension requests an unsupported capability.');
  if(manifest.entry&&(!/^[A-Za-z0-9._/-]+$/.test(manifest.entry)||manifest.entry.includes('..')))throw new Error('Extension entry path is invalid.');return manifest;
}
function discoverRecipes(root){const base=path.resolve(root);let entries=[];try{entries=fs.readdirSync(base,{withFileTypes:true})}catch{return[]};return entries.filter(item=>item.isFile()&&item.name.endsWith('.json')).flatMap(item=>{try{const raw=fs.readFileSync(path.join(base,item.name),'utf8');const manifest=validateExtensionManifest(JSON.parse(raw));return[{...manifest,reviewStatus:'local-review-required',sha256:crypto.createHash('sha256').update(raw).digest('hex'),file:item.name}]}catch{return[]}})}
module.exports={SDK_VERSION,validateExtensionManifest,discoverRecipes};
