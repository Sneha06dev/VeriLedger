require("dotenv").config({ path: "../.env" });

const { searchNews } = require("./services/newsRetrievalService");

async function testRAG() {

  const claim = "Alphabet reported $113.8 billion revenue in Q4 2025";

  console.log("Searching evidence for claim:\n");
  console.log(claim);
  console.log("\n");

  const results = await searchNews(claim);

  console.log("Retrieved Evidence:\n");

  results.forEach((article, index) => {

    console.log(`Result ${index + 1}`);
    console.log("Title:", article.title);
    console.log("Source:", article.source);
    console.log("URL:", article.url);
    console.log("Description:", article.description);
    console.log("---------------------------------------------\n");

  });

}

testRAG();