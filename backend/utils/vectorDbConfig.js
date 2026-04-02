/**
 * Vector Database Configuration
 */

const vectorDbConfigs = {
  pinecone: {
    apiKeyEnvVar: "PINECONE_API_KEY",
    indexEnvVar: "PINECONE_INDEX",
    environmentEnvVar: "PINECONE_ENVIRONMENT",
    defaultDimension: 1536,
    defaultMetric: "cosine",
    maxRetries: 3,
    retryDelay: 1000
  },

  weaviate: {
    urlEnvVar: "WEAVIATE_URL",
    apiKeyEnvVar: "WEAVIATE_API_KEY",
    defaultScheme: "http",
    defaultPort: 8080,
    defaultClassName: "Document"
  },

  faiss: {
    dataDir: process.env.FAISS_DATA_DIR || "./data/faiss",
    indexFile: "documents.index",
    metadataFile: "metadata.json"
  }
};

/**
 * Get vector DB config for provider
 */
function getConfig(provider) {
  return vectorDbConfigs[provider] || vectorDbConfigs.pinecone;
}

/**
 * Validate environment variables for provider
 */
function validateConfig(provider) {
  const config = getConfig(provider);
  const errors = [];

  if (provider === "pinecone") {
    if (!process.env[config.apiKeyEnvVar]) {
      errors.push(`Missing ${config.apiKeyEnvVar}`);
    }
    if (!process.env[config.indexEnvVar]) {
      errors.push(`Missing ${config.indexEnvVar}`);
    }
  } else if (provider === "weaviate") {
    if (!process.env[config.urlEnvVar]) {
      errors.push(`Missing ${config.urlEnvVar}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Vector DB configuration errors:\n${errors.join("\n")}`);
  }

  return true;
}

module.exports = {
  getConfig,
  validateConfig,
  vectorDbConfigs
};
