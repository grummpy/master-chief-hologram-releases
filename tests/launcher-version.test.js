'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
test('desktop launcher replaces a stale installed version',()=>{const script=fs.readFileSync(path.join(__dirname,'..','scripts','launch-mac.sh'),'utf8');assert.match(script,/EXPECTED_VERSION/);assert.match(script,/INSTALLED_VERSION/);assert.match(script,/NEED_INSTALL/);assert.match(script,/CFBundleShortVersionString/) });
