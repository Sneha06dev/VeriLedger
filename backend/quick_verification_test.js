#!/usr/bin/env node

/**
 * Quick Verification Test
 * Tests your entire claim verification pipeline end-to-end
 * Run: node quick_verification_test.js
 * 
 * This test:
 * 1. Connects to MongoDB
 * 2. Generates an embedding for a claim
 * 3. Searches Pinecone for similar documents
 * 4. Fetches full document text from MongoDB
 * 5. Generates a verdict using Gemini
 */

require("dotenv").config({ path: "./.env" });

const { getDb, connect } = require("./services/mongoClient");
const vectorDbService = require("./services/vectorDbService");
const embeddingService = require("./services/embeddingService");
const evidenceRetrievalService = require("./services/evidenceRetrievalService");
const verdictService = require("./services/verdictService");

async function runQuickTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     VERILEDGER - QUICK VERIFICATION TEST                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // Step 1: Connect to MongoDB
    console.log("Step 1️⃣  Connecting to MongoDB...");
    await connect();
    const db = getDb();
    
    const docCount = await db.collection("Documents").countDocuments();
    console.log(`✓ Connected! Found ${docCount} documents\n`);

    // Step 2: Test claim
    const claim = "Apple's revenue exceeded $400 billion in 2025";
    const company = "AAPL";
    
    console.log("Step 2️⃣  Testing Claim Verification");
    console.log(`   Claim: "${claim}"`);
    console.log(`   Company: ${company}\n`);

    // Step 3: Check embedding status
    console.log("Step 3️⃣  Generating Embedding...");
    console.log(`   Using: ${embeddingService.isMocking() ? "Mock Embeddings (768-dim)" : "OpenAI API (1536-dim)"}`);
    const embedding = await embeddingService.generateEmbedding(claim);
    console.log(`   ✓ Generated ${embedding.length}-dimensional vector\n`);

    // Step 4: Retrieve evidence
    console.log("Step 4️⃣  Searching for Similar Documents in Pinecone...");
    const evidence = await evidenceRetrievalService.retrieveEvidence(
      claim,
      {
        company: company,
        topK: 5
      }
    );
    
    if (!evidence || evidence.length === 0) {
      console.log("   ⚠️  No documents found in Pinecone search");
      console.log("   This could mean:");
      console.log("   - Pinecone index is empty");
      console.log("   - Pinecone dimension mismatch (expected 768 or 1536)");
      console.log("   - Connection error\n");
      throw new Error("No evidence retrieved from Pinecone");
    }
    
    console.log(`   ✓ Found ${evidence.length} relevant documents\n`);
    
    evidence.forEach((doc, i) => {
      console.log(`   ${i + 1}. Similarity: ${doc.similarityScore?.toFixed(3) || "N/A"}`);
      console.log(`      Type: ${doc.filing_type} ${doc.year}`);
      console.log(`      Section: ${doc.section}`);
      console.log(`      Preview: ${doc.text?.substring(0, 80)}...\n`);
    });

    // Step 5: Generate verdict
    console.log("Step 5️⃣  Generating Verdict using Gemini...");
    const verdict = await verdictService.generateVerdict(claim, evidence);
    
    console.log("   ✓ Verdict Generated!\n");
    console.log(`   Result: ${verdict.verdict}`);
    console.log(`   Confidence: ${(verdict.confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${verdict.reasoning?.substring(0, 150)}...\n`);

    // Summary
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    ✅ TEST SUCCESSFUL                      ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("\nYour verification pipeline is working!\n");
    console.log("Current configuration:");
    console.log(`  - MongoDB: ✓ Connected (${docCount} documents)`);
    console.log(`  - Embeddings: ✓ ${embeddingService.isMocking() ? "Mock Mode (768-dim)" : "OpenAI (1536-dim)"}`);
    console.log(`  - Pinecone: ✓ Initialized (${evidence.length} results)`);
    console.log(`  - Gemini: ✓ Working\n`);
    console.log("Next steps:");
    console.log("  1. npm start           - Start the backend server");
    console.log("  2. Test API endpoints  - See VERIFICATION_TESTING.md");
    console.log("  3. Try different claims - Vary company, year, section");
    console.log("  4. Check accuracy     - Compare verdicts with actual filings\n");

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.log("\nDebugging Tips:");
    console.log("  MongoDB:");
    console.log("    - Check MONGODB_URI in .env");
    console.log("    - Verify network connectivity to MongoDB Atlas");
    console.log("    - Check if Documents collection has data\n");
    
    console.log("  Embeddings:");
    console.log("    - Currently using: " + (embeddingService.isMocking() ? "MOCK MODE" : "OPENAI API"));
    console.log("    - If OpenAI fails, automatically switches to mock");
    console.log("    - Mock embeddings work but may be less accurate\n");
    
    console.log("  Pinecone:");
    console.log("    - Check PINECONE_API_KEY in .env");
    console.log("    - Check PINECONE_INDEX name is correct");
    console.log("    - Verify embeddings dimension matches (should be 768 or 1536)\n");
    
    console.log("  Gemini:");
    console.log("    - Check GEMINI_API_KEY in .env");
    console.log("    - Verify API key is valid\n");
    
    console.log("Error stack:");
    console.error(err.stack);
    process.exit(1);
  }
}

// Run test
runQuickTest().then(() => process.exit(0));
