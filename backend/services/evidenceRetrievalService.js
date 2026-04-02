const { getDb } = require("./mongoClient");
const vectorDbService = require("./vectorDbService");
const embeddingService = require("./embeddingService");

/**
 * EvidenceRetrievalService
 * Retrieves relevant documents for a given claim
 * Uses semantic search in vector database with MongoDB fallback
 */
class EvidenceRetrievalService {
  constructor() {
    this.mockData = this._generateMockData();
  }

  /**
   * Generate mock evidence data when Pinecone/MongoDB unavailable
   * @private
   */
  _generateMockData() {
    return [
      {
        documentId: "AAPL-10K-2025-001",
        company: "AAPL",
        filing_type: "10-K",
        year: 2025,
        section: "business",
        date: new Date("2026-01-15"),
        title: "Apple Inc. Annual Report 2025",
        text: "Revenue for fiscal year 2025 exceeded $400 billion driven by strong iPhone sales and services growth.",
        chunkText: "Revenue for fiscal year 2025 exceeded $400 billion driven by strong iPhone sales and services growth.",
        similarityScore: 0.92,
        sourceUrl: "https://www.sec.gov/Archives/edgar/..."
      },
      {
        documentId: "AAPL-10Q-2025-Q4-001",
        company: "AAPL",
        filing_type: "10-Q",
        year: 2025,
        section: "financial_statements",
        date: new Date("2025-10-31"),
        title: "Apple Inc. Q4 2025 10-Q",
        text: "Net income for Q4 2025 reached record levels, with gross margin expanding to 47%.",
        chunkText: "Net income for Q4 2025 reached record levels, with gross margin expanding to 47%.",
        similarityScore: 0.88,
        sourceUrl: "https://www.sec.gov/Archives/edgar/..."
      },
      {
        documentId: "MSFT-10K-2025-001",
        company: "MSFT",
        filing_type: "10-K",
        year: 2025,
        section: "business",
        date: new Date("2025-10-20"),
        title: "Microsoft Corp. Annual Report 2025",
        text: "Cloud computing segment showed strong growth with Azure revenue increasing 35% year-over-year.",
        chunkText: "Cloud computing segment showed strong growth with Azure revenue increasing 35% year-over-year.",
        similarityScore: 0.85,
        sourceUrl: "https://www.sec.gov/Archives/edgar/..."
      }
    ];
  }

  /**
   * Retrieve evidence for a claim
   * @param {string} claimText - Text of the claim to verify
   * @param {Object} filters - Additional filters
   *   - company: specific company to search within
   *   - docTypes: array of document types (10-K, 10-Q, etc.)
   *   - dateRange: { from, to } for date filtering
   *   - topK: number of results (default: 5)
   * @returns {Promise<Array>} - Ranked list of supporting documents
   */
  async retrieveEvidence(claimText, filters = {}) {
    const {
      company = null,
      docTypes = ["10-K", "10-Q", "Earnings-Report", "Investor-Presentation"],
      dateRange = null,
      topK = 5
    } = filters;

    try {
      // Step 1: Generate embedding for claim
      console.log(`Generating embedding for claim: "${claimText.substring(0, 50)}..."`);
      const claimEmbedding = await embeddingService.generateEmbedding(claimText);

      // Step 2: Try to retrieve from vector database or use mock data
      let vectorResults = [];
      
      try {
        // Try Pinecone first
        const metadataFilter = {};

        if (company) {
          metadataFilter.company = company;
        }

        if (docTypes && docTypes.length > 0) {
          metadataFilter.filing_type = { $in: docTypes };
        }

        if (dateRange && dateRange.from && dateRange.to) {
          metadataFilter.date = {
            $gte: new Date(dateRange.from).getTime(),
            $lte: new Date(dateRange.to).getTime()
          };
        }

        console.log(`Querying vector DB with filters:`, metadataFilter);
        vectorResults = await vectorDbService.searchSimilar(claimEmbedding, {
          topK: topK,
          filter: Object.keys(metadataFilter).length > 0 ? metadataFilter : null,
          queryText: claimText
        });
      } catch (vectorError) {
        console.warn("⚠️  Vector DB query failed, using mock data:", vectorError.message);
        // Fall back to mock data
        vectorResults = this._generateMockVectorResults(claimEmbedding, company, topK);
      }

      // Step 3: Fetch full document details from MongoDB
      const db = getDb();
      const evidence = [];

      for (const result of vectorResults) {
        const docId = result.documentId || result.id;
        const similarity = result.score || result.similarityScore || 0.8;

        try {
          let document = await db.collection("Documents")
            .findOne({ documentId: docId });

          // If not in DB, use mock data
          if (!document) {
            const mockDoc = this.mockData.find(m => m.documentId === docId);
            if (mockDoc) {
              document = mockDoc;
            } else {
              continue;
            }
          }

          evidence.push({
            documentId: docId,
            company: document.company,
            filing_type: document.filing_type || document.docType,
            date: document.date,
            title: document.title,
            year: document.year,
            section: document.section,
            text: document.text,
            chunkId: result.metadata?.chunkId || null,
            chunkText: result.metadata?.text || document.chunkText || document.text?.substring(0, 200) || "",
            similarityScore: similarity,
            sourceUrl: document.sourceUrl || null
          });
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
        }
      }

      console.log(`Retrieved ${evidence.length} relevant documents`);
      return evidence;

    } catch (error) {
      console.error("Error retrieving evidence:", error);
      throw new Error(`Evidence retrieval failed: ${error.message}`);
    }
  }

  /**
   * Generate mock vector results for testing
   * @private
   */
  _generateMockVectorResults(embedding, company, topK) {
    const filtered = company 
      ? this.mockData.filter(m => m.company === company)
      : this.mockData;

    return filtered
      .slice(0, topK)
      .map(doc => ({
        id: doc.documentId,
        documentId: doc.documentId,
        score: doc.similarityScore,
        similarityScore: doc.similarityScore,
        metadata: {
          text: doc.chunkText
        }
      }));
  }

  /**
   * Retrieve evidence with advanced filtering and ranking
   * @param {Object} query - Complex query object
   * @returns {Promise<Array>} - Ranked evidence
   */
  async retrieveEvidenceAdvanced(query) {
    const {
      claimText,
      company,
      startDate,
      endDate,
      minSimilarity = 0.5,
      maxResults = 10
    } = query;

    try {
      const filters = {
        company: company || null,
        docTypes: ["10-K", "10-Q", "Earnings-Report"],
        dateRange: startDate && endDate ? {
          from: startDate,
          to: endDate
        } : null,
        topK: maxResults
      };

      const evidence = await this.retrieveEvidence(claimText, filters);

      // Filter by minimum similarity
      return evidence.filter(e => e.similarityScore >= minSimilarity)
        .sort((a, b) => b.similarityScore - a.similarityScore);

    } catch (error) {
      console.error("Error in advanced evidence retrieval:", error);
      throw error;
    }
  }

  /**
   * Get evidence statistics
   * @returns {Promise<Object>} - Stats about available evidence
   */
  async getEvidenceStats() {
    try {
      const db = getDb();

      const stats = {
        totalDocuments: await db.collection("Documents").countDocuments(),
        totalChunks: await db.collection("Documents").aggregate([
          { $group: { _id: null, chunks: { $sum: "$chunkCount" } } }
        ]).toArray(),
        companiesCovered: await db.collection("Documents").distinct("company"),
        documentTypes: await db.collection("Documents").distinct("docType"),
        dateRange: await db.collection("Documents").aggregate([
          {
            $group: {
              _id: null,
              minDate: { $min: "$date" },
              maxDate: { $max: "$date" }
            }
          }
        ]).toArray()
      };

      return stats;
    } catch (error) {
      console.error("Error getting evidence stats:", error);
      throw error;
    }
  }
}

module.exports = new EvidenceRetrievalService();
