'use strict';
const fs=require('fs');const path=require('path');const crypto=require('crypto');const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');const pkg=require(path.join(root,'package.json'));const targets=['package.json','package-lock.json','build-info.json'].map(name=>path.join(root,name)).filter(fs.existsSync);
const files=targets.map(file=>({path:path.relative(root,file),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
let revision='unknown';try{revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}catch{}
const manifest={schemaVersion:1,product:pkg.name,version:pkg.version,revision,generatedAt:new Date().toISOString(),files};fs.mkdirSync(path.join(root,'release'),{recursive:true});fs.writeFileSync(path.join(root,'release','manifest.json'),JSON.stringify(manifest,null,2));console.log(`release manifest: v${pkg.version} ${files.length} files`);
