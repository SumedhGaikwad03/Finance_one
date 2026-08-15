import { LLMProvider } from "../types/query-extractor.types";

// this is not embedding but an service provider for the inferce carried out by our llm 
// it recives a string typr ip and op for in the same type 

export class OllamaLLMProvider implements LLMProvider {

    async generate(prompt: string): Promise<string> {

        const response = await fetch(
            "http://localhost:11434/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    model: "qwen3:4b",
                    prompt,
                    stream: false,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Ollama request failed: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();

        return data.response;
    }
}