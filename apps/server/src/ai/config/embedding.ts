import { EmbeddingProvider } from "../providers/embedding.provider";
import { OllamaEmbeddingProvider } from "../providers/ollama-embedding.provider";

export const EMBEDDING_CONFIG = {
    model: process.env.OLLAMA_EMBEDDING_MODEL || "qwen3-embedding:4b",
    dimensions: 2560,
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 5000,
    confidenceThreshold: Number(process.env.AI_CONFIDENCE_THRESHOLD) || 0.70,
};

export const embeddingProvider: EmbeddingProvider = new OllamaEmbeddingProvider({
    baseUrl: EMBEDDING_CONFIG.baseUrl,
    model: EMBEDDING_CONFIG.model,
    expectedDimensions: EMBEDDING_CONFIG.dimensions,
    timeoutMs: EMBEDDING_CONFIG.timeoutMs,
});





  