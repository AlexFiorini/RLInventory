const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('v8-compile-cache');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1012,
        height: 600,
        resizable: true,
        icon: path.join(__dirname, '../img/icon.ico'),
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
    console.log(path.join(__dirname, '../img/favicon-16x16.ico'));
    // Read the JSON data from the specified file path
    fs.readFile(jsonFilePath, 'utf8', (err, jsonData) => {
        if (err) {
            console.error('Error reading JSON data:', err);
            if (err.code === 'ENOENT') {
                console.error('JSON doesnt exist');
            }
        } else {
            try {
                const parsedData = JSON.parse(jsonData);
                if (Array.isArray(parsedData.inventory)) {
                    mainWindow.webContents.on('did-finish-load', () => {
                        mainWindow.webContents.send('json-data', parsedData.inventory);
                    });
                } else {
                    console.error('JSON data is not in the expected format.');
                }
            } catch (jsonParseError) {
                console.error('Error parsing JSON data:', jsonParseError);
            }
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