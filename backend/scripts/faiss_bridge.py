import os
import sys
import json
import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

# Paths are relative to this script's location (VeriLedger/backend/scripts)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "..", "databaseBuilding", "data")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "index", "faiss_index.bin")
METADATA_PATH = os.path.join(DATA_DIR, "index", "metadata.parquet")
TEXT_PATH = os.path.join(DATA_DIR, "index", "text.parquet")

MODEL_NAME = "BAAI/bge-base-en-v1.5"

def load_resources():
    """
    Loads necessary resources for vector search including the embedding model, 
    FAISS index, and metadata dataframe.

    Returns:
        tuple: (SentenceTransformer model, faiss.Index, pd.DataFrame)
    """
    try:
        # Load embedding model
        model = SentenceTransformer(MODEL_NAME)
        
        # Load FAISS index
        if not os.path.exists(FAISS_INDEX_PATH):
            raise FileNotFoundError(f"FAISS index not found at {FAISS_INDEX_PATH}")
        index = faiss.read_index(FAISS_INDEX_PATH)
        
        # Load metadata and text
        metadata = pd.read_parquet(METADATA_PATH)
        texts = pd.read_parquet(TEXT_PATH)
        df = pd.concat([metadata, texts], axis=1)
        
        return model, index, df
    except Exception as e:
        print(json.dumps({"error": f"Failed to load resources: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

def run_search(model, index, df, query, company=None, top_k=5):
    """
    Executes a similarity search against the FAISS index. 
    If a company is provided, the search is filtered to that company's records.

    Args:
        model (SentenceTransformer): Model used to encode the query.
        index (faiss.Index): FAISS index to search.
        df (pd.DataFrame): Dataframe containing metadata and text chunks.
        query (str): The search query text.
        company (str, optional): Company name to filter by. Defaults to None.
        top_k (int, optional): Number of top results to return. Defaults to 5.

    Returns:
        list: A list of dicts containing search results with text and metadata.
    """
    try:
        # Filter metadata if company is provided
        filtered_df = df
        if company:
            filtered_df = df[df["company"] == company]
            print(f"DEBUG: Filtered to {len(filtered_df)} records for company '{company}'", file=sys.stderr)
        
        if len(filtered_df) == 0:
            print(f"DEBUG: No records found for company '{company}'", file=sys.stderr)
            return []

        # Get vector IDs for the filtered subset
        ids = filtered_df.index.to_numpy()
        
        # Embed query
        query_vector = model.encode([query], normalize_embeddings=True)
        
        # Since we might be searching a subset, we reconstruct vectors or just search the whole index and filter
        # To be consistent with search.py, we reconstruct vectors from the filtered subset
        try:
            print(f"DEBUG: Reconstructing {len(ids)} vectors for similarity search...", file=sys.stderr)
            # Efficiently reconstruct vectors in batch rather than one-by-one in a Python loop
            subset_vectors = index.reconstruct_batch(ids.astype('int64'))
            
            # Similarity search (dot product for normalized vectors)
            scores = subset_vectors @ query_vector.T
            scores = scores.flatten()
            
            # Top-K
            top_idx = np.argsort(-scores)[:top_k]
            
            results = []
            for idx in top_idx:
                row = filtered_df.iloc[idx]
                print(f"DEBUG: Match found: {row.company}_{row.section}_{row.chunk_id} (Score: {scores[idx]:.4f})", file=sys.stderr)
                results.append({
                    "id": str(ids[idx]),
                    "documentId": f"{row.company}_{row.filing_type}_{row.year}_{row.section}_{row.chunk_id}",
                    "score": float(scores[idx]),
                    "company": row.company,
                    "filing_type": row.filing_type,
                    "year": int(row.year),
                    "section": row.section,
                    "text": row.text,
                    "metadata": {
                        "text": row.text[:500] # for quick preview
                    }
                })
            return results
        except Exception as e:
            # Fallback for large indices where reconstruction might be slow/complex
            # Search whole index and filter result IDs
            
            # A safety margin of 10x top_k is used to increase the probability of 
            # finding enough matches from the filtered subset (e.g., the specific company).
            distances, indices = index.search(query_vector, k=top_k * 10)
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx in ids: # if this result is in our company's subset
                    row = df.iloc[idx]
                    results.append({
                        "id": str(idx),
                        "documentId": f"{row.company}_{row.filing_type}_{row.year}_{row.section}_{row.chunk_id}",
                        "score": float(dist),
                        "company": row.company,
                        "filing_type": row.filing_type,
                        "year": int(row.year),
                        "section": row.section,
                        "text": row.text,
                        "metadata": {
                            "text": row.text[:500]
                        }
                    })
                    if len(results) >= top_k:
                        break
            return results
            
    except Exception as e:
        print(json.dumps({"error": f"Search failed: {str(e)}"}), file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing query argument"}), file=sys.stderr)
        sys.exit(1)
        
    query = sys.argv[1]
    company = sys.argv[2] if len(sys.argv) > 2 else None
    top_k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    mode = sys.argv[4] if len(sys.argv) > 4 else "search"

    model, index, df = load_resources()
    
    if mode == "embed":
        vector = model.encode([query], normalize_embeddings=True)[0]
        print(json.dumps({"embedding": vector.tolist()}))
    else:
        results = run_search(model, index, df, query, company, top_k)
        print(json.dumps(results))
