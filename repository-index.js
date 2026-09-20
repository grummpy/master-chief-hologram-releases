'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEXT_EXTENSIONS = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.json','.md','.txt','.css','.html','.yml','.yaml','.toml','.py','.r','.sql','.sh','.ps1']);
function sha256(value){return crypto.createHash('sha256').update(value).digest('hex')}
function createRepositoryIndexer({root,execFile,indexDocument}){
  const repoRoot=path.resolve(root); if(typeof execFile!=='function'||typeof indexDocument!=='function')throw new Error('Repository indexer requires fixed Git and index adapters.');
  return async function indexRepository(options={}){
    const branch=(await execFile('git',['branch','--show-current'],{cwd:repoRoot,timeout:10000,maxBuffer:32768,windowsHide:true})).stdout.trim()||'detached';
    const revision=(await execFile('git',['rev-parse','HEAD'],{cwd:repoRoot,timeout:10000,maxBuffer:32768,windowsHide:true})).stdout.trim();
    const files=(await execFile('git',['ls-files'],{cwd:repoRoot,timeout:10000,maxBuffer:1024*1024,windowsHide:true})).stdout.split(/\r?\n/).filter(Boolean);
    const limit=Math.max(1,Math.min(1000,Number(options.limit)||500)); let indexed=0,bytes=0,skipped=0;
    for(const relative of files.slice(0,limit)){
      const target=path.resolve(repoRoot,relative); if(!target.startsWith(`${repoRoot}${path.sep}`)||!TEXT_EXTENSIONS.has(path.extname(target).toLowerCase())){skipped++;continue}
      let stat;try{stat=fs.statSync(target)}catch{skipped++;continue} if(!stat.isFile()||stat.size>512*1024){skipped++;continue}
      const text=fs.readFileSync(target,'utf8');if(text.includes('\u0000')){skipped++;continue}
      indexDocument(`repo:${relative}`,text,{collection:'repository',scope:`${branch}@${revision.slice(0,12)}`,provenance:{branch,revision,path:relative,sha256:sha256(text)}});indexed++;bytes+=stat.size;
    }
    return{root:repoRoot,branch,revision,indexed,skipped,bytes,limited:files.length>limit,completedAt:new Date().toISOString()};
  };
}
module.exports={createRepositoryIndexer,TEXT_EXTENSIONS};
