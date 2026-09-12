const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const window = new BrowserWindow({ width: 1600, height: 900, show: false, frame: false });
    await window.loadFile(path.join(__dirname, '..', 'docs', 'visual-brief.svg'));
    await new Promise(resolve => setTimeout(resolve, 500));
    const image = await window.webContents.capturePage();
    require('fs').writeFileSync(path.join(__dirname, '..', 'docs', 'visual-brief.png'), image.toPNG());
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    app.quit();
  }
});
