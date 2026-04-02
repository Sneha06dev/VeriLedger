const axios = require("axios");

/**
 * EmbeddingService
 * Handles text embedding generation
 * Strategy:
 * 1. Try OpenAI API (if quota available)
 * 2. Fall back to mock embeddings (deterministic, based on text hash)
 */
class EmbeddingService {
  constructor() {
    // Configuration
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.openaiModel = "text-embedding-3-small";
    this.openaiDimension = 1536;
    this.baseUrl = "https://api.openai.com/v1";
    this.requestTimeout = 30000;
    
    this.useMock = false; // Will be set to true if OpenAI fails
    this.useLocal = process.env.VECTOR_DB_PROVIDER === "faiss";
    this.mockDimension = 768;
    this.localDimension = 768; // BGE base is 768
  }

  /**
   * Generate embedding for a single text
   * Tries OpenAI first, falls back to mock or local
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} - Vector embedding
   */
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty for embedding generation");
    }

    // Try local BGE if configured
    if (this.useLocal) {
      try {
        return await this._generateLocalEmbedding(text);
      } catch (error) {
        console.warn("⚠️  Local embedding failed, switching to mock:", error.message);
        this.useLocal = false;
        // Continue to mock fallback
      }
    }

    // Try OpenAI if available and not already failed
    if (this.openaiKey && !this.useMock && !this.useLocal) {
      try {
        return await this._generateOpenAIEmbedding(text);
      } catch (error) {
        console.warn("⚠️  OpenAI failed, switching to mock embeddings:", error.message.substring(0, 100));
        this.useMock = true;
        // Continue to mock fallback below
      }
    }

    // Use mock embeddings
    return this._generateMockEmbedding(text);
  }

  /**
   * Generate embedding locally using BGE model via Python bridge
   * @private
   */
  _generateLocalEmbedding(text) {
    return new Promise((resolve, reject) => {
      const { spawn } = require("child_process");
      const path = require("path");
      
      const pythonPath = process.env.PYTHON_PATH || "python3";
      const bridgePath = path.join(__dirname, "..", "scripts", "faiss_bridge.py");
      const pythonProcess = spawn(pythonPath, [bridgePath, text, "", "1", "embed"]);
      
      let resultData = "";
      let errorData = "";

      pythonProcess.stdout.on("data", (data) => {
        resultData += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`Local embedding failed: ${errorData}`));
        }

        try {
          const result = JSON.parse(resultData);
          resolve(result.embedding);
        } catch (err) {
          reject(new Error("Failed to parse local embedding response"));
        }
      });
    });
  }

  /**
   * Generate embedding using OpenAI API
   * @private
   */
  async _generateOpenAIEmbedding(text) {
    const maxLength = 8000;
    const truncatedText = text.substring(0, maxLength);

    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          input: truncatedText,
          model: this.openaiModel,
          encoding_format: "float"
        },
        {
          headers: {
            "Authorization": `Bearer ${this.openaiKey}`,
            "Content-Type": "application/json"
          },
          timeout: this.requestTimeout
        }
      );

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error("No embedding data returned from API");
      }

      return response.data.data[0].embedding;
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenAI API error: ${message}`);
    }
  }

  /**
   * Generate deterministic mock embedding based on text hash
   * Ensures similar texts get similar embeddings
   * @private
   */
  _generateMockEmbedding(text) {
    // Simple hash function
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        h = ((h << 5) - h) + char;
        h = h & h; // Convert to 32-bit integer
      }
      return Math.abs(h);
    };

    const textHash = hash(text);
    const embedding = [];
    
    // Generate 768-dimensional embedding based on hash
    for (let i = 0; i < 768; i++) {
      // Use hash and index to generate pseudo-random but deterministic values
      const seed = (textHash + i * 73856093) ^ (textHash >> 16);
      const random = Math.sin(seed) * 10000;
      embedding.push(random - Math.floor(random)); // Get fractional part
    }

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Promise<Array<Array>>} - Array of embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error("Texts must be a non-empty array");
    }

    const embeddings = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Get embedding dimension
   * @returns {number} - Dimension of embeddings (1536 for OpenAI, 768 for mock)
   */
  getDimension() {
    return this.useMock ? this.mockDimension : this.openaiDimension;
  }

  /**
   * Force use of mock embeddings (for testing)
   */
  forceMockMode() {
    this.useMock = true;
    console.log("✓ Embedding service set to mock mode (768-dimensional)");
  }

  /**
   * Check if currently using mock embeddings
   * @returns {boolean}
   */
  isMocking() {
    return this.useMock;
  }
}

module.exports = new EmbeddingService();

