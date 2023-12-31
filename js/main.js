const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const electron = require ('electron');
require('v8-compile-cache');
let mainWindow;

const appDataPath = app.getPath('appData'); // Get the application data directory
const jsonFilePath = path.join(appDataPath, 'bakkesmod/bakkesmod/data/inventory.json');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1160,
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
}

ipcMain.on('json-data', (event, data) => {
    try {
        const parsedDatafile = JSON.parse(data);
        const jsonString = JSON.stringify(parsedDatafile);
        if (Array.isArray(jsonString)) {
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('json-data', jsonString.inventory);
            });
        } else {
            console.error('JSON data is not in the expected format.');
        }
    } catch (jsonParseError) {
        console.error('Error parsing JSON data:', jsonParseError);
    }
});

ipcMain.on('show-div1', () => {
    mainWindow.webContents.executeJavaScript(`
        document.getElementById('loading-div').style.display = 'block';
        document.getElementById('table').style.display = 'none';
        document.getElementById('inventory-table').style.display = 'none';
    `);
});

ipcMain.on('show-div2', () => {
    mainWindow.webContents.executeJavaScript(`
        document.getElementById('loading-div').style.display = 'none';
        document.getElementById('table').style.display = 'block';
        document.getElementById('inventory-table').style.display = 'block';
    `);
});

ipcMain.on('load-json-inventory', () => {
    loadJsonInventory(jsonFilePath);
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Watch for changes in the JSON file
    watchJsonFile(jsonFilePath);

    // Load JSON inventory data initially
    loadJsonInventory(jsonFilePath);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('read-user-data', async (event, fileName) => {
    const path = electron.app.getPath('appData');
    const buf = path + '\\' + fileName;
    return buf;
});

function watchJsonFile(jsonFilePath) {
    fs.watch(jsonFilePath, (eventType, filename) => {
        if (eventType === 'change') {
            // Reload the mainWindow when the JSON file changes
            mainWindow.reload();
        }
    });
}

function loadJsonInventory(jsonFilePath) {
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
