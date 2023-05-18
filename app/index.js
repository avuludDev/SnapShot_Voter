const { app, BrowserWindow } = require('electron');

const createWindow = () => {

  const mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    resizable: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false

    }
  })
  mainWindow.loadFile('index.html');
  mainWindow.removeMenu();
}



app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

