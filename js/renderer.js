const { ipcRenderer } = require('electron');
const puppeteer = require('puppeteer');
const supportURL = "https://op.market/ref/thedevilofgames";

let inventory;
let htmlitems = {
    Wheels: {
      term: 'Wheels',
      data: ''
    },
    Decal: {
      term: 'Decal',
      data: ''
    },
    Topper: {
      term: 'Topper',
      data: ''
    },
    RocketBoost: {
      term: 'Rocket Boost',
      data: ''
    },
    Banner: {
      term: 'Player Banner',
      data: ''
    },
    Antenna: {
      term: 'Antenna',
      data: ''
    },
    Body: {
      term: 'Body',
      data: ''
    },
    GoalExplosion: {
      term: 'Goal Explosion',
      data: ''
    },
    Trail: {
      term: 'Trail',
      data: ''
    },
    PaintFinish: {
      term: 'Paint Finish',
      data: ''
    },
    GiftPack: {
      term: 'Gift Pack',
      data: ''
    },
    AvatarBorder: {
      term: 'Avatar Border',
      data: ''
    },
    EngineAudio: {
      term: 'Engine Audio',
      data: ''
    }
  };

const colors = [
    "Unpainted",
    "Black",
    "Purple",
    "Titanium White",
    "Grey",
    "Pink",
    "Forest Green",
    "Sky Blue",
    "Cobalt",
    "Lime",
    "Saffron",
    "Crimson",
    "Burnt Sienna",
    "Orange",
    "Gold"
];

// Carica il file JSON
ipcRenderer.on('json-data', (event, jsonData) => {
    if (Array.isArray(jsonData)) {
        inventory = jsonData.filter(item => item.tradeable === 'true');
        fetchPricesOP()
            .then(() => createTable())
            .catch(error => console.error('Error loading htmlContent:', error));
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
            { title: "Special Edition", field: "special_edition", headerFilter: "input", sorter: "string", formatter: specialEditionFormatter, resizable: false},
            { title: "OPMarket Price", field: "price", headerFilter: "input", sorter: customPriceSorter, resizable: false}
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
                const price_image = searchAndDisplay(item.name, item.paint, item.slot);
                item.price = price_image.price;
                item.image = price_image.image;
                itemsToAdd.push(item);
            }
        }
        table.setData(itemsToAdd);
    });
}

function rearrangeName(name) {
    // Define an array of keywords to check for (OPMarket puts these before the name, idk why)
    const keywords = ["Inverted", "Infinite", "Holographic"];
  
    // Iterate through the keywords
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        // If the name contains the keyword, rearrange it and return
        const rearrangedName = `${keyword}: ${name.replace(keyword, "").trim()}`;
        // Remove the trailing ":"
        return rearrangedName.replace(/:$/, "");
      }
    }
  
    // If none of the keywords were found, return the original name
    return name;
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

async function fetchPricesOP() {
    try {
        const response = await fetch("https://op.market/en/prices/pc");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        htmlContent = await response.text();
        // Fix image URLs by adding the domain "https://op.market" before "/_next"
        htmlContent = htmlContent.replace(/\/_next/g, 'https://op.market/_next');
        // Now you have the HTML content with all images loaded
        setGlobalSearchable(htmlContent);
        return htmlContent;
    } catch (error) {
        console.error('Error fetching HTML:', error);
        // Handle the error as needed
        throw error;
    }
}

function setGlobalSearchable(htmlContent) {
    // Create a temporary div element to parse the HTML string
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    // Select all elements with the specified class
    htmlitems.Wheels.data = tempDiv.querySelector('div[id="Wheels"]');
    htmlitems.Decal.data = tempDiv.querySelector('div[id="Decal"]');
    htmlitems.Topper.data = tempDiv.querySelector('div[id="Topper"]');
    htmlitems.RocketBoost.data = tempDiv.querySelector('div[id="Rocket Boost"]');
    htmlitems.Banner.data = tempDiv.querySelector('div[id="Player Banner"]');
    htmlitems.Antenna.data = tempDiv.querySelector('div[id="Antenna"]');
    htmlitems.Body.data = tempDiv.querySelector('div[id="Body"]');
    htmlitems.GoalExplosion.data = tempDiv.querySelector('div[id="Goal Explosion"]');
    htmlitems.Trail.data = tempDiv.querySelector('div[id="Trail"]');
    htmlitems.PaintFinish.data = tempDiv.querySelector('div[id="Paint Finish"]');
    htmlitems.GiftPack.data = tempDiv.querySelector('div[id="Gift Pack"]');
    htmlitems.AvatarBorder.data = tempDiv.querySelector('div[id="Avatar Border"]');
    htmlitems.EngineAudio.data = tempDiv.querySelector('div[id="Engine Audio"]');
}

function searchAndDisplay(nameToSearch, colortoSearch, slottoSearch) {
    let returnobj = {
        image: "https://op.market/_next/static/media/FallbackItemImage.89e7bb87.svg",
        price: "-",
    }
    nameToSearch=rearrangeName(nameToSearch);
    try {
        for (let key in htmlitems) {
            if (htmlitems[key].term === slottoSearch) {
                // Select all elements that contain info about one item
                let searchcontainer = htmlitems[key].data.querySelectorAll('.rounded-lg');
                if (searchcontainer) {
                    // Iterate through the containers
                    searchcontainer.forEach((container) => {
                        // Select all child elements that contain the item name
                        const childElements = container.querySelectorAll('.text-xl');
                        if (childElements) {
                            // Iterate through the child elements
                            childElements.forEach((nameElement) => {
                                // Check if the name matches the one you're looking for
                                if (nameElement.textContent.trim() === nameToSearch) {
                                    const photoElement = container.querySelector('.mix-blend-screen');
                                    returnobj.image = photoElement.src;
                                    // Select the table with the prices
                                    var styleElements = container.querySelectorAll('.grid-rows-5');
                                    if (styleElements.length > 0) {
                                        styleElements.forEach((styleElement) => {
                                            // Select all divs inside styleElement, each one is a color
                                            const divprices = styleElement.querySelectorAll('div');
                                            if (divprices) {
                                                divprices.forEach((divprice, index) => {
                                                    if (colors[index] === colortoSearch) {
                                                        const priceText = divprice.textContent.trim();
                                                        const priceParts = priceText.split('-');
                                                        price = priceParts.length > 0 ? priceParts[0].trim() : "Unknown";
                                                        returnobj.price = price;
                                                        return returnobj;
                                                    }
                                                });
                                            } else {
                                                console.log('divprices is null:', container);
                                            }
                                        });
                                    } else {
                                        //If item has only unpainted version
                                        styleElements = container.querySelector('.text-sm');
                                        if (styleElements) {
                                            const priceText = styleElements.textContent.trim();
                                            const priceParts = priceText.split('-');
                                            price = priceParts.length > 0 ? priceParts[0].trim() : "Unknown";
                                            returnobj.price = price;
                                            return returnobj;
                                        } else {
                                            console.log('styleElements is null:', container);
                                        }
                                    }
                                }
                            });
                        } else {
                            console.log('ChildElements is null:', container);
                        }
                    });
                } else {
                    console.log('SearchContainer is null:', searchcontainer);
                }
            }
        }
    } catch (error) {
        console.error('Error parsing and searching HTML:', error);
    }
    return returnobj;
}