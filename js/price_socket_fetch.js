const WebSocket = require("ws");
const readline = require("readline");
const socket = new WebSocket("wss://api.op.market/api/ws");

// Function to check the line count of the JSON file
function checkLineCount() {
  const rl = readline.createInterface({
    input: fs.createReadStream("output.json"),
  });

  let lineCount = 0;

  rl.on("line", () => {
    lineCount++;
  });

  rl.on("close", () => {
    if (lineCount >= 1000) {
      console.log("The JSON file has at least 1000 lines. Closing the WebSocket connection.");
      socket.close();
    } else {
      console.log("The JSON file has fewer than 1000 lines. Waiting for more updates...");
    }
  });
}

socket.addEventListener("open", (event) => {
  //console.log("WebSocket connection opened:", event);
  const message = JSON.stringify({ type: "getItems", payload: "pc", id: 2 });
  socket.send(message);
});

socket.addEventListener("message", (event) => {
  console.log("Message received from server");

  // Parse the received JSON data
  try {
    const jsonData = JSON.parse(event.data);

    // Save the data to a JSON file
    fs.writeFileSync("item_prices.json", JSON.stringify(jsonData, null, 2), "utf-8");
    console.log("Data saved to item_prices.json");

    // Check the line count
    checkLineCount();
  } catch (error) {
    //console.error("Error parsing or saving data:", error);
  }
});

socket.addEventListener("close", (event) => {
  if (event.wasClean) {
    console.log(
      `WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`
    );
  } else {
    console.error("WebSocket connection abruptly closed");
  }
});