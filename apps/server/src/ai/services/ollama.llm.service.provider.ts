import { LLMProvider } from "../types/query-extractor.types";

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
                    model: "qwen3",
                    prompt,
                    stream: false,
                }),
            }
        );

        const data = await response.json();

        return data.response;
    }
}