import { LLMProvider } from "../types/query-extractor.types";
import { ServiceUnavailableError } from "../../error/AppError";

export interface OllamaLLMConfig {
    baseUrl?: string;
    model?: string;
    timeoutMs?: number;
}

export class OllamaLLMProvider implements LLMProvider {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;

    constructor(config: OllamaLLMConfig = {}) {
        this.baseUrl = (config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
        this.model = config.model || process.env.OLLAMA_LLM_MODEL || "qwen3:4b";
        this.timeoutMs = config.timeoutMs ?? (Number(process.env.OLLAMA_LLM_TIMEOUT_MS) || 15000);
    }

    async generate(prompt: string): Promise<string> {
        const endpoint = `${this.baseUrl}/api/generate`;
        let response: Response;

        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    stream: false,
                }),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch (error: any) {
            if (error?.name === "TimeoutError" || error?.name === "AbortError") {
                console.error(`[AI LLM] Request timed out after ${this.timeoutMs}ms connecting to ${endpoint}`);
                throw new ServiceUnavailableError("AI language model timed out. Please try again later.");
            }
            console.error(`[AI LLM] Connection error reaching provider at ${endpoint}:`, error?.message || error);
            throw new ServiceUnavailableError("AI language model service is currently unreachable.");
        }

        if (!response.ok) {
            let errorBody = "";
            try {
                errorBody = await response.text();
            } catch {
                // ignore text read error
            }

            console.error(`[AI LLM] Provider HTTP error ${response.status} ${response.statusText}:`, errorBody);

            if (response.status === 404 || errorBody.toLowerCase().includes("model not found")) {
                throw new ServiceUnavailableError(`AI model '${this.model}' is not available on the provider.`);
            }

            throw new ServiceUnavailableError(`AI language model provider returned status ${response.status}`);
        }

        let data: any;
        try {
            data = await response.json();
        } catch (parseError: any) {
            console.error("[AI LLM] Failed to parse JSON response:", parseError);
            throw new ServiceUnavailableError("Invalid response received from AI language model.");
        }

        if (!data || typeof data.response !== "string") {
            console.error("[AI LLM] Unexpected response format:", data);
            throw new ServiceUnavailableError("Malformed response structure received from AI language model.");
        }

        return data.response;
    }
}