# VeriLedger: AI-Powered Claim Verification

VeriLedger is a sophisticated Fact-Checking and Verification system designed to validate corporate financial claims from earnings call transcripts against official SEC filings (10-K, 10-Q) using Retrieval-Augmented Generation (RAG).

---

## 🚀 Core Features

- **Automated Claim Extraction**: Uses Google Gemini to scan transcripts and identify key financial, strategic, and operational claims.
- **Evidence Retrieval (RAG)**: Employs semantic search via FAISS (local) or Pinecone (remote) to find the most relevant sections of SEC filings for any given claim.
- **Multi-Source Fact Checking**: Cross-references claims against a high-fidelity MongoDB transcript store and vector index.
- **AI-Powered Verdicts**: Generates objective verdicts (**SUPPORTED**, **REFUTED**, or **UNCERTAIN**) with detailed reasoning and citation references.
- **Interactive Dashboard**: A modern React-based frontend for processing YouTube transcripts and visualizing verification results.

---

## 🏗️ Architecture & Tech Stack

For a detailed visual guide to the system flows and data architecture, please see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Backend
- **Node.js & Express**: Core API server handles orchestration, database coordination, and LLM communication.
- **MongoDB Atlas**: Primary persistent store for transcripts, extracted claims, and processed SEC filing text.
- **Vector Database**: 
  - **FAISS (Local Mode)**: High-performance local vector similarity search via a Python bridge.
  - **Pinecone (Remote Mode)**: Scalable cloud-based vector store for production environments.
- **Embedding Model**: `BAAI/bge-base-en-v1.5` for state-of-the-art semantic representation.
- **LLM**: Google Gemini (1.5 Flash/Pro) for intelligent extraction and reasoning.

### Frontend
- **React (Vite)**: Fast, modern UI powered by Tailwind CSS.
- **State Management**: React hooks and local state for real-time processing feedback.

### Data Processing Pipeline (Python)
- **SEC Filing Scraper**: Automated downloading and parsing of SEC documents.
- **Document Chunking**: Intelligent splitting of large filings into semantically coherent chunks.
- **Indexing Pipeline**: Batch embedding and syncing of data to both MongoDB and the Vector DB.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python 3.9+ (with `venv`)
- MongoDB Atlas account
- API Keys: Gemini API, OpenAI API (optional), Pinecone (optional)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   MONGO_URI=your_mongodb_uri
   MONGO_DB=transcripts
   GEMINI_API_KEY=your_gemini_key
   GEMINI_MODEL=gemini-2.5-flash

   OPENAI_API_KEY=
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   VECTOR_DB_PROVIDER=faiss # or 'pinecone'

   PINECONE_API_KEY=
   PINECONE_INDEX=earnings-docs
   PINECONE_ENVIRONMENT=us-east-1

   PYTHON_PATH=path/to/your/python3
   SERVER_PORT=5000
   FRONTEND_URL=http://localhost:5173

   ```
3. Initialize the Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

---

## 🏎️ Running the Application

### 1. Start the Backend
```bash
cd backend
npm start
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Processing a Transcript
- Enter a YouTube URL in the frontend dashboard.
- The system will process the video, extract claims, and automatically initiate the verification pipeline.

---

## 🧪 Verification & Testing

You can run a quick end-to-end verification test to ensure all components (MongoDB, Vector DB, Gemini) are communicating correctly:

```bash
cd backend
node quick_verification_test.js
```

### Interpretation of Results
- **Similarity Score (0.0 - 1.0)**: Measures semantic alignment. Scores above **0.70** are considered strong matches.
- **Relevance**: A document is counted as "relevant" only if it appears in the vector search **AND** its full metadata is successfully fetched from MongoDB.

---

## 🔍 Troubleshooting

- **Gemini 404 Error**: If you see "Model Not Found", ensure your `GEMINI_API_KEY` is valid and the `GEMINI_MODEL` is set correctly in `.env`
- **Retrieved 0 documents**: Ensure your FAISS index (`faiss_index.bin`) and data files present in the drive link are extracted and exist in `databaseBuilding/data/index/`.
- **MongoDB Connection**: Verify your IP is whitelisted in MongoDB Atlas.

