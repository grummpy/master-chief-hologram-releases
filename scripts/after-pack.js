'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = async context => {
  if (context.electronPlatformName !== 'darwin') return;
  const productName = context.packager.appInfo.productFilename;
  const plist = path.join(context.appOutDir, `${productName}.app`, 'Contents', 'Info.plist');
  const plutil = args => execFileSync('/usr/bin/plutil', args, { stdio: 'pipe' });
  plutil(['-replace', 'NSAppTransportSecurity.NSAllowsArbitraryLoads', '-bool', 'NO', plist]);
  plutil(['-replace', 'NSAppTransportSecurity.NSAllowsLocalNetworking', '-bool', 'YES', plist]);
  for (const key of ['NSCameraUsageDescription', 'NSBluetoothAlwaysUsageDescription', 'NSBluetoothPeripheralUsageDescription']) {
    try { plutil(['-remove', key, plist]); } catch { /* Electron versions vary; absence is acceptable. */ }
  }
};
