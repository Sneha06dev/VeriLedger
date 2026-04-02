/**
 * Document Chunker Utility
 * Splits large documents into overlapping chunks for embedding
 */
class DocumentChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000; // characters per chunk
    this.overlapSize = options.overlapSize || 200; // overlap between chunks
  }

  /**
   * Split text into overlapping chunks
   * @param {string} text - Text to chunk
   * @param {string} documentId - ID of parent document
   * @returns {Array<Object>} - Array of chunk objects
   */
  chunkText(text, documentId) {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks = [];
    const sentences = this._splitIntoSentences(text);
    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= this.chunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk.length > 0) {
          chunks.push({
            chunkId: `${documentId}_chunk_${chunkIndex}`,
            text: currentChunk.trim(),
            startIndex: text.indexOf(currentChunk),
            length: currentChunk.length,
            order: chunkIndex
          });
          chunkIndex++;

          // Create overlap by reusing last part of previous chunk
          const overlapText = currentChunk.slice(-this.overlapSize);
          currentChunk = overlapText + sentence;
        } else {
          currentChunk = sentence;
        }
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push({
        chunkId: `${documentId}_chunk_${chunkIndex}`,
        text: currentChunk.trim(),
        startIndex: text.lastIndexOf(currentChunk),
        length: currentChunk.length,
        order: chunkIndex
      });
    }

    return chunks;
  }

  /**
   * Split text into sentences
   * @private
   */
  _splitIntoSentences(text) {
    // Simple sentence splitter using common delimiters
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [];
    return sentences.map(s => s.trim());
  }

  /**
   * Chunk text with metadata
   */
  chunkTextWithMetadata(text, documentId, metadata = {}) {
    const chunks = this.chunkText(text, documentId);

    return chunks.map(chunk => ({
      ...chunk,
      ...metadata,
      documentId: documentId
    }));
  }
}

module.exports = DocumentChunker;
