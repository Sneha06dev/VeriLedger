const axios = require("axios");

const { embed } = require("./embeddingService");
const { cosineSimilarity } = require("./similarity");
const { extractArticleText } = require("./articleExtractor");

const TRUSTED_SOURCES = [
  "Reuters",
  "Bloomberg",
  "Financial Times",
  "CNBC",
  "BBC News",
  "BusinessLine",
  "The Wall Street Journal",
  "TechCrunch",
  "The Verge",
  "Forbes",
  "Business Insider",
  "MarketWatch",
  "Investopedia",
  "Yahoo Finance",
  "Barron's"
];

async function rankArticles(claim, articles) {

  const claimEmbedding = await embed(claim);

  const scored = [];

  for (const article of articles) {

    const articleText = await extractArticleText(article.url);

    const content = article.title + " " + articleText;

    const articleEmbedding = await embed(content);

    const score = cosineSimilarity(claimEmbedding, articleEmbedding);

    scored.push({
      article,
      score
    });
  }

  scored.sort((a,b) => b.score - a.score);

  // DEBUG PRINT
  console.log("\nRAG Candidate Articles:\n");

  scored.forEach((item, index) => {

    console.log(`Candidate ${index + 1}`);
    console.log("Title:", item.article.title);
    console.log("Source:", item.article.source.name);
    console.log("Score:", item.score.toFixed(4));
    console.log("URL:", item.article.url);
    console.log("-----------------------------------\n");

  });

  return scored.map(item => item.article);
}

async function searchNews(claim) {

  const url = "https://newsapi.org/v2/everything";

  const query = `${claim} earnings`;

  const response = await axios.get(url, {
    params: {
      q: query,
      language: "en",
      sortBy: "relevancy",
      pageSize: 10,
      apiKey: process.env.NEWS_API_KEY
    }
  });

  let articles = response.data.articles;

  articles = articles.filter(article =>
    TRUSTED_SOURCES.includes(article.source.name)
  );

  articles = await rankArticles(claim, articles);

  return articles.slice(0,5).map(article => ({
    title: article.title,
    source: article.source.name,
    url: article.url,
    description: article.description
  }));
}

module.exports = { searchNews };