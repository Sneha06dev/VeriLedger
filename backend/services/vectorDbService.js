const { Pinecone } = require("@pinecone-database/pinecone");

/**
 * VectorDbService
 * Abstraction layer for vector database operations
 * Supports Pinecone (primary) and FAISS (fallback for development)
 */
class VectorDbService {
  constructor() {
    this.provider = process.env.VECTOR_DB_PROVIDER || "pinecone";
    this.index = null;
    this.initialized = false;

    if (this.provider === "pinecone") {
      this.initPinecone();
    } else if (this.provider === "faiss") {
      this.initFAISS();
    }
  }

  /**
   * Initialize Pinecone connection
   */
  async initPinecone() {
    try {
      // Pinecone SDK v2.0+ uses apiKey only, no environment parameter
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      this.index = pinecone.Index(process.env.PINECONE_INDEX || "earnings-docs");
      this.initialized = true;
      console.log("Pinecone vector DB initialized");
    } catch (error) {
      console.error("Failed to initialize Pinecone:", error);
      console.warn("Vector DB initialization deferred - will retry on first use");
      this.initialized = false;
    }
  }

  /**
   * Initialize FAISS (local development option)
   */
  initFAISS() {
    // FAISS initialization would go here
    // For now, this is a placeholder
    console.log("FAISS vector DB (local development mode)");
    this.initialized = true;
  }

  /**
   * Upsert embeddings into vector database
   * @param {string} documentId - Unique document identifier
   * @param {Array<number>} embedding - Vector embedding
   * @param {Object} metadata - Associated metadata (company, docType, date, etc.)
   */
  async upsertEmbedding(documentId, embedding, metadata = {}) {
    if (!documentId || !embedding || embedding.length === 0) {
      throw new Error("DocumentId and embedding are required");
    }

    try {
      if (this.provider === "pinecone") {
        await this.index.upsert([
          {
            id: documentId,
            values: embedding,
            metadata: metadata
          }
        ]);
      }
      console.log(`Embedding upserted: ${documentId}`);
    } catch (error) {
      console.error(`Error upserting embedding ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Upsert multiple embeddings in batch
   * @param {Array<{id, values, metadata}>} vectors - Array of vectors to upsert
   */
  async upsertBatch(vectors) {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error("Vectors must be a non-empty array");
    }

    try {
      if (this.provider === "pinecone") {
        // Pinecone supports batch upsert (max 100 at a time)
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, Math.min(i + batchSize, vectors.length));
          await this.index.upsert(batch);
        }
      }
      console.log(`${vectors.length} embeddings upserted in batches`);
    } catch (error) {
      console.error("Error upserting batch embeddings:", error);
      throw error;
    }
  }

  /**
   * Query similar embeddings
   * @param {Array<number>} queryEmbedding - Query vector
   * @param {Object} options - Query options
   *   - topK: number of results to return (default: 5)
   *   - filter: metadata filter (optional)
   *   - namespace: Pinecone namespace (optional)
   *   - queryText: Original text (if embedding service was bypassed)
   * @returns {Promise<Array>} - Top K similar results with scores
   */
  async searchSimilar(queryEmbedding, options = {}) {
    const { topK = 5, filter = null, namespace = "", queryText = null } = options;

    try {
      if (this.provider === "faiss") {
        const results = await this._searchLocalFAISS(queryText || "", filter?.company, topK);
        console.log(`FAISS search returned ${results.length} documents for ${filter?.company || "all companies"}`);
        results.forEach((res, i) => {
          console.log(`  [${i+1}] ${res.documentId} (Score: ${res.score.toFixed(4)})`);
        });
        return results;
      }

      if (this.provider === "pinecone") {
        if (!queryEmbedding || queryEmbedding.length === 0) {
          throw new Error("Query embedding cannot be empty for Pinecone");
        }
        
        const queryOptions = {
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true
        };

        if (filter) {
          queryOptions.filter = filter;
        }

        if (namespace) {
          queryOptions.namespace = namespace;
        }

        const results = await this.index.query(queryOptions);
        return results.matches || [];
      }
    } catch (error) {
      console.error("Error searching similar embeddings:", error);
      throw error;
    }
  }

  /**
   * Search local FAISS index via Python bridge
   * @private
   */
  _searchLocalFAISS(queryText, company, topK) {
    return new Promise((resolve, reject) => {
      const { spawn } = require("child_process");
      const path = require("path");
      
      const pythonPath = process.env.PYTHON_PATH || "python3";
      const bridgePath = path.join(__dirname, "..", "scripts", "faiss_bridge.py");
      const pythonProcess = spawn(pythonPath, [bridgePath, queryText, company || "", topK.toString()]);
      
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
          console.error(`FAISS bridge error (code ${code}):`, errorData);
          return reject(new Error(`FAISS bridge failed: ${errorData}`));
        }

        try {
          // Log stdout if needed for debugging
          // console.log("FAISS Bridge Raw Output:", resultData);
          const results = JSON.parse(resultData);
          resolve(results);
        } catch (err) {
          console.error("Failed to parse JSON from FAISS bridge:", resultData);
          reject(new Error("Failed to parse FAISS bridge response"));
        }
      });
    });
  }

  /**
   * Delete embedding by ID
   * @param {string} documentId - Document ID to delete
   */
  async deleteEmbedding(documentId) {
    try {
      if (this.provider === "pinecone") {
        await this.index.deleteOne(documentId);
      }
      console.log(`Embedding deleted: ${documentId}`);
    } catch (error) {
      console.error(`Error deleting embedding ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get vector database statistics
   * @returns {Promise<Object>} - DB stats (dimension, count, etc.)
   */
  async getStats() {
    try {
      if (this.provider === "pinecone") {
        const description = await this.index.describeIndexStats();
        return {
          provider: "pinecone",
          dimension: description.dimension,
          indexFullness: description.indexFullness,
          totalVectors: description.totalVectorCount,
          namespaces: description.namespaces
        };
      }
    } catch (error) {
      console.error("Error getting vector DB stats:", error);
      throw error;
    }
  }

  /**
   * Health check for vector database
   * @returns {Promise<boolean>} - True if healthy, false otherwise
   */
  async healthCheck() {
    try {
      const stats = await this.getStats();
      return !!stats;
    } catch (error) {
      console.error("Vector DB health check failed:", error);
      return false;
    }
  }
}

module.exports = new VectorDbService();
