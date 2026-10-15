import { EmbeddingProvider } from "./embedding.provider";
import { BadRequestError, ServiceUnavailableError } from "../../error/AppError";

export interface OllamaEmbeddingConfig {
    baseUrl?: string;
    model?: string;
    expectedDimensions?: number;
    timeoutMs?: number;
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly expectedDimensions: number;
    private readonly timeoutMs: number;

    constructor(config: OllamaEmbeddingConfig = {}) {
        this.baseUrl = (config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
        this.model = config.model || process.env.OLLAMA_EMBEDDING_MODEL || "qwen3-embedding:4b";
        this.expectedDimensions = config.expectedDimensions ?? 2560;
        this.timeoutMs = config.timeoutMs ?? (Number(process.env.OLLAMA_TIMEOUT_MS) || 5000);
    }

    getModelName(): string {
        return this.model;
    }

    getExpectedDimensions(): number {
        return this.expectedDimensions;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!text || typeof text !== "string" || text.trim().length === 0) {
            throw new BadRequestError("Cannot generate embedding for empty text");
        }

        const endpoint = `${this.baseUrl}/api/embed`;
        let response: Response;

        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text.trim(),
                }),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch (error: any) {
            if (error?.name === "TimeoutError" || error?.name === "AbortError") {
                console.error(`[AI Embedding] Request timed out after ${this.timeoutMs}ms connecting to ${endpoint}`);
                throw new ServiceUnavailableError("AI embedding service timed out. Please verify provider connectivity.");
            }
            console.error(`[AI Embedding] Connection error reaching provider at ${endpoint}:`, error?.message || error);
            throw new ServiceUnavailableError("AI embedding service is currently unreachable. Please verify that Ollama is running.");
        }

        if (!response.ok) {
            let errorBody = "";
            try {
                errorBody = await response.text();
            } catch {
                // ignore text read error
            }

            console.error(`[AI Embedding] Provider HTTP error ${response.status} ${response.statusText}:`, errorBody);

            if (response.status === 404 || errorBody.toLowerCase().includes("model not found") || errorBody.toLowerCase().includes("not found")) {
                throw new ServiceUnavailableError(`AI embedding model '${this.model}' is not available on the provider.`);
            }

            throw new ServiceUnavailableError(`AI embedding provider returned HTTP status ${response.status}`);
        }

        let data: any;
        try {
            data = await response.json();
        } catch (parseError: any) {
            console.error("[AI Embedding] Failed to parse JSON response from embedding provider:", parseError);
            throw new ServiceUnavailableError("Invalid JSON received from AI embedding provider.");
        }

        if (!data || typeof data !== "object") {
            throw new ServiceUnavailableError("Unexpected response structure from AI embedding provider.");
        }

        const embeddingsArray = data.embeddings;
        if (!Array.isArray(embeddingsArray) || embeddingsArray.length === 0 || !Array.isArray(embeddingsArray[0])) {
            console.error("[AI Embedding] Malformed embeddings structure in response:", data);
            throw new ServiceUnavailableError("Malformed embedding payload received from provider.");
        }

        const vector = embeddingsArray[0];

        if (vector.length !== this.expectedDimensions) {
            console.error(`[AI Embedding] Dimension mismatch: expected ${this.expectedDimensions}, received ${vector.length}`);
            throw new ServiceUnavailableError(
                `Embedding dimension mismatch: expected ${this.expectedDimensions}, but received ${vector.length}`
            );
        }

        for (let i = 0; i < vector.length; i++) {
            const val = vector[i];
            if (typeof val !== "number" || !Number.isFinite(val)) {
                console.error(`[AI Embedding] Non-finite vector value at index ${i}:`, val);
                throw new ServiceUnavailableError("Generated embedding contains invalid or non-finite values.");
            }
        }

        return vector;
    }
}
