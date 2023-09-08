const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const supportURL = "https://op.market/ref/thedevilofgames";

let inventory;

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        createTable()
    } else {
        console.error('Invalid JSON data received:', jsonData);
    }
});

// Richiedi il file JSON al processo principale
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
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false}
        ],
    });

    table.on("tableBuilt", async function(){
        const itemsToAdd = [];
        for (const item of inventory) {
            if (item.quality !== '' && item.quality !== 'Common') {
                item.slot = handleDecal(item.slot);
                item.paint = handleNotPainted(item.paint);
                item.rank_label = handleNotCertificated(item.rank_label);
                item.special_edition = handleNotSE(item.special_edition);
                item.image = searchImage(item.product_id, item.slot);
                itemsToAdd.push(item);
            }
        }
        table.setData(itemsToAdd);
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
                document.body.appendChild(newtable);
                inventory = parsedDataArray.filter(item => item.tradeable === 'true');
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

function searchImage(item_id) {
    const projectPath = path.join(__dirname); // Assuming the project folder is in the same directory as your script

    // Check if the specified project folder exists
    if (!fs.existsSync(projectPath)) {
        console.log(`Project folder '${projectPath}' does not exist.`);
        return;
    }

    const imageDirectoryPath = path.join(projectPath, 'img', 'png_id');

    // Check if the image directory exists
    if (!fs.existsSync(imageDirectoryPath)) {
        console.log(`Image directory does not exist.`);
        return;
    }
    // Search for the image in this subfolder
    const imageFileName = `${item_id}.png`;
    const imageFilePath = path.join(imageDirectoryPath, imageFileName);

    if (fs.existsSync(imageFilePath) && isImageFile(imageFilePath)) {
        console.log(`Found image '${imageFileName}'.`);
        return imageFilePath; // Return the path to the found image
    }

    console.log(`Image '${item_id}' not found in any subfolder.`);
    return "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg"; // Return base image if the image is not found
}

// Helper function to check if a file is an image (you can customize this as needed)
function isImageFile(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
}