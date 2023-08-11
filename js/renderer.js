const toggleButton = document.getElementById('toggle-mode');
const body = document.body;
const { ipcRenderer } = require('electron');
const puppeteer = require('puppeteer');
const slotMapping = {
    'Animated Decal': 'decals',
    'Antenna': 'antennas',
    'Avatar Border': 'avatar_borders',
    'Body': 'cars',
    'Decal': 'decals',
    'Engine audio': 'engine_sounds',
    'Goal Explosion': 'goal_explosions',
    'Paint Finish': 'paint_finishes',
    'Player Banner': 'banners',
    'Rocket Boost': 'boosts',
    'Topper': 'toppers',
    'Trail': 'trails',
    'Wheels': 'wheels'
};

let inventory;

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        console.log(inventory);

        // Creazione della tabella solo dopo aver filtrato i dati
        createTable();
    } else {
        console.error('Invalid JSON data received:', jsonData);
    }
});

// Richiedi il file JSON al processo principale
ipcRenderer.send('get-json-data');

function createTable() {
    var table = new Tabulator("#inventory-table", {
        layout: "fitColumns",
        responsiveLayout: "collapse",
        columns: [
            { title: "Name", field: "name", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Slot", field: "slot", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Paint", field: "paint", headerFilter: "input", sorter: "string", formatter: paintFormatter, resizable: false},
            { title: "Rank Label", field: "rank_label", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Quality", field: "quality", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", resizable: false},
            // { title: "RLInsider Price min", headerFilter:"input", sorter: "string", resizable: false},
            // { title: "RLInsider Price max", headerFilter:"input", sorter: "string", resizable: false}
        ],
    });

    //load sample data into the table

    table.on("tableBuilt", async function(){
        for (const item of inventory) {
            // Controlla se la proprietà "quality" non è vuota
            if (item.quality !== '' && item.quality !== 'Common') {
                // // Effettua lo swap se è necessario
                // const slotValue = (slotMapping[item.slot.toLowerCase()] || item.slot).replace(/-/g, '_');
                // const swappedSlotValue = slotValue === 'rocket_boost' ? 'boosts' : slotValue;
                // const itemName = item.name.replace(/-/g, '_');
                
                // // Forma l'URL completo per l'elemento
                // const itemUrl = `https://rl.insider.gg/en/pc/${swappedSlotValue}/${itemName}${item.paint !== 'none' ? `/${item.paint}` : ''}`;
                
                // // Trasforma l'URL in minuscolo e rimuovi gli spazi
                // const lowercaseUrl = itemUrl.toLowerCase().replace(/\s+/g, '_');
                
                // // Esegui lo scraping dell'URL
                // const browser = await puppeteer.launch({ headless: 'new' });
                // const page = await browser.newPage();
                // await page.goto(lowercaseUrl, { waitUntil: 'domcontentloaded' });
    
                // const itemSummaryPrice = await page.evaluate(() => {
                //     const h1Element = document.querySelector('#itemSummaryPrice');
                //     return h1Element ? h1Element.textContent : null;
                // });
    
                // console.log(`Valore di h1 id="itemSummaryPrice" per ${item.name} ${item.paint}:`, itemSummaryPrice);
    
                // await browser.close();
                
                // Aggiungi la riga alla tabella
                table.addRow(item);
            }
        }
    });
}

function paintFormatter(cell, formatterParams, onRendered) {
    const color = cell.getValue();
    const backgroundStyle = getBackgroundStyleForColor(color);
    return `<div style="background: ${backgroundStyle}; padding: 5px; border-radius: 3px;">${handleNonePainted(color)}</div>`;
}

function handleNonePainted(value) {
    return value === 'none' ? 'Unpainted' : value;
}

function getBackgroundStyleForColor(color) {
    switch (color) {
        case 'Black':
            return 'linear-gradient(135deg,#5e5e5e,#000 80%)';
        case 'Titanium White':
            return 'linear-gradient(135deg,#fff,#e5e5e5 80%)';
        case 'Grey':
            return 'linear-gradient(135deg,#c4c4c4,#5d5d5d 80%)';
        case 'Crimson':
            return 'linear-gradient(135deg,#ff4d4d,#b00 80%)';
        case 'Pink':
            return 'linear-gradient(135deg,#ff8dce,#e52667 80%)';
        case 'Cobalt':
            return 'linear-gradient(135deg,#8c9eff,#25379b 80%)';
        case 'Sky Blue':
            return 'linear-gradient(135deg,#50f6ff,#008fda 80%)';
        case 'Burnt Sienna':
            return 'linear-gradient(135deg,#995e4d,#320000 80%)';
        case 'Saffron':
            return 'linear-gradient(135deg,#ff8,#e5d121 80%)';
        case 'Lime':
            return 'linear-gradient(135deg,#ccff4d,#65e500 80%)';
        case 'Forest Green':
            return 'linear-gradient(135deg,#99fc9d,#329536 80%)';
        case 'Orange':
            return 'linear-gradient(135deg,#ffff4d,#da9a00 80%)';
        case 'Purple':
            return 'linear-gradient(135deg,#e974fd,#820d96 80%)';
        case 'Gold':
            return 'linear-gradient(135deg,#EAF0A3,#9BA25F 80%)';
        case 'Unpainted':
            return '';
        default:
            return '';
    }
}