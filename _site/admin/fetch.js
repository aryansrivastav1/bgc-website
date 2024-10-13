const axios = require("axios");
const fs = require("fs");

async function fetchData() {
  try {
    const categoriesResponse = await axios.get("http://localhost:3000/categories");
    const variationsResponse = await axios.get("http://localhost:3000/variations");

    // Save categories data
    fs.writeFileSync("src/categories.json", JSON.stringify(categoriesResponse.data));
    
    // Save variations data
    fs.writeFileSync("src/variations.json", JSON.stringify(variationsResponse.data));

    console.log("Data fetched and saved.");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchData();
