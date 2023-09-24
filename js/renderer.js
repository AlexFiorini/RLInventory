const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const app = require('electron');
const fetch = require('node-fetch');
const supportURL = "https://op.market/ref/thedevilofgames";
var firstJsonData;
const secondJsonPath = path.join(__dirname, './item_prices.json');
const secondJsonData = JSON.parse(fs.readFileSync(secondJsonPath, 'utf8'));

let inventory;

const qualitymap = {
    "Common": "0",
    "Uncommon": "1",
    "Rare": "2",
    "Very rare": "3",
    "Import": "4",
    "Exotic": "5",
    "Black market": "6",
    "Premium": "7",
    "Limited": "8",
    "Legacy": "9"
}

const slotmap = {
    "Body": "0",
    "Decal": "1",
    "Wheels": "2",
    "Rocket Boost": "3",
    "Antenna": "4",
    "Topper": "5",
    "Paint Finish": "7",
    "Gift Pack": "11",
    "Engine Audio": "13",
    "Trail": "14",
    "Goal Explosion": "15",
    "Player Banner": "16",
    "Avatar Border": "20"
}

const specialmap = {
    "Default": "0",
    "Holographic": "1",
    "Infinite": "2",
    "Inverted": "3",
    "Remixed": "4",
    "Color Match": "5",
    "Flare": "6"
}

const paintsmap = {
    "Unpainted": "0",
    "Crimson": "1",
    "Lime": "2",
    "Black": "3",
    "Sky Blue": "4",
    "Cobalt": "5",
    "Burnt Sienna": "6",
    "Forest Green": "7",
    "Purple": "8",
    "Pink": "9",
    "Orange": "10",
    "Grey": "11",
    "Titanium White": "12",
    "Saffron": "13",
    "Gold": "14"
}
// Load JSON file
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        (async () => {
            try {
                const result = await ipcRenderer.invoke('read-user-data', 'bakkesmod\\bakkesmod\\data\\inventory.json');
                saveFirstJsonData(result);
                // Now that ipcRenderer has finished, you can call getPrice safely.
                createTable()
            } catch (error) {
                // Handle any errors that occurred during ipcRenderer.invoke.
                console.error(error);
            }
        })();
    } else {
        console.error('Invalid JSON data received:', jsonData);
    }
});

// Ask JSON file to main process
ipcRenderer.send('get-json-data');

function createTable() {
    const table = new Tabulator("#inventory-table", {
        layout: "fitDataStretch",
        responsiveLayout: "collapse",
        columns: [
            { title: "Image", field: "image", headerSort:false, formatter: imageFormatter, resizable: false},
            { title: "Name", field: "name", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Slot", field: "slot", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Paint", field: "paint", headerFilter: "input", sorter: "string", formatter: paintFormatter, resizable: false},
            { title: "Certification", field: "rank_label", headerFilter: "input", sorter: "string", resizable: false},
            { title: "Quality", field: "quality", headerFilter: "input", sorter: customQualitySorter, resizable: false},
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false},
            { title: "OPMarket Price", field: "price", headerFilter: "input", sorter: "number", resizable: false}
        ],
    });

    table.on("tableBuilt", async function(){
        const itemsToAdd = [];
        const totalItems = inventory.length;
        let loadedItems = 0;
        for (const item of inventory) {
            if (item.quality !== '' && item.quality !== 'Common') {
                item.slot = handleDecal(item.slot);
                item.paint = handleNotPainted(item.paint);
                item.rank_label = handleNotCertificated(item.rank_label);
                item.special_edition = handleNotSE(item.special_edition);
                try {
                    item.image = await searchImage(item.product_id);
                } catch (error) {
                    item.image = "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg";
                }
                item.price = getPrice(  item.product_id, 
                                        qualitymap[item.quality], 
                                        slotmap[item.slot], 
                                        specialmap[item.special_edition], 
                                        paintsmap[item.paint]);
                itemsToAdd.push(item);
            }
            loadedItems++;
            const progress = (loadedItems / totalItems) * 100;
            updateLoadingProgress(progress);
        }
        table.setData(itemsToAdd);
        ipcRenderer.send('show-div2');
    });
}


document.getElementById('support').addEventListener('click', function() {
    require('electron').shell.openExternal(supportURL);
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;
            const parsedData = JSON.parse(fileContent);
            const parsedDataArray = Object.values(parsedData.inventory);
            if (Array.isArray(parsedDataArray)) {
                ipcRenderer.send('json-data', parsedDataArray);
                let table = document.getElementById('inventory-table');
                table.remove();
                var newtable = document.createElement("div");
                newtable.setAttribute("id", "inventory-table");
                document.getElementById("table").appendChild(newtable);
                inventory = parsedDataArray.filter(item => item.tradeable === 'true');
                ipcRenderer.send('show-div1');
                createTable();
            } else {
                console.error('JSON data is not in the expected format.');
            }
        } catch (jsonParseError) {
            console.error('Error parsing JSON data:', jsonParseError);
        }
    };

    reader.readAsText(selectedFile);
});

async function searchImage(item_id) {
    // Construct the URL for the image based on item_id
    const imageUrl = `https://ik.imagekit.io/2vhnpgodm/Rocket%20League/${item_id}.png`;

    try {
        // Attempt to fetch the image
        const response = await fetch(imageUrl);

        // Check if the response status is 200 (OK)
        if (response.status === 200) {
            return imageUrl; // Return the URL of the found image
        }
    } catch (error) {}

    // Return the fallback image URL if the image is not found or if there was an error
    return "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg";
}

function updateLoadingProgress(progress) {
    const loadingProgress = document.getElementById("loading-progress");
    loadingProgress.style.width = `${progress}%`;
}

function saveFirstJsonData(result) {
    firstJsonData = JSON.parse(fs.readFileSync(result, 'utf8'));
}

function getPrice(itemId, qualityId, slotId, specialId, paintId) {
    try {
        for (priceitem in secondJsonData.payload.items) {
            if (
                priceitem == itemId &&
                secondJsonData.payload.items[priceitem].quality == qualityId &&
                secondJsonData.payload.items[priceitem].slot == slotId &&
                secondJsonData.payload.items[priceitem].special == specialId
            ) {
                return secondJsonData.payload.items[priceitem].paints[paintId].price;
            }
        }
    } catch (err) {
        console.error(`Error reading or parsing the JSON file: ${err.message}`);
    }
    return "0";
}