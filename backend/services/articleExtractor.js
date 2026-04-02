const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

async function extractArticleText(url) {

  try {

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const dom = new JSDOM(response.data, { url });

    const reader = new Readability(dom.window.document);

    const article = reader.parse();

    if (!article) return "";

    return article.textContent.slice(0, 2000); // limit text length

  } catch (error) {

    console.log("Failed to extract article:", url);

    return "";
  }
}

module.exports = { extractArticleText };