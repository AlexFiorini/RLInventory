const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('v8-compile-cache');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1012,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    const appDataPath = app.getPath('appData'); // Get the application data directory
    const jsonFilePath = path.join(appDataPath, 'bakkesmod/bakkesmod/data/inventory.json');
    
    // Read the JSON data from the specified file path
    fs.readFile(jsonFilePath, 'utf8', (err, jsonData) => {
        if (err) {
            console.error('Error reading JSON data:', err);
        } else {
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('json-data', JSON.parse(jsonData).inventory);
            });
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('get-json-data', (event) => {
    const appDataPath = app.getPath('appData');
    const jsonFilePath = path.join(appDataPath, 'bakkesmod/bakkesmod/data/inventory.json');
    fs.readFile(jsonFilePath, 'utf8', (err, jsonData) => {
        if (err) {
            console.error('Error reading JSON data:', err);
        } else {
            event.reply('json-data', JSON.parse(jsonData));
        }
    });
});
