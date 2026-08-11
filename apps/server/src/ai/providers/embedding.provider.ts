// We are designing the AI system so that the embedding/model
// implementation can be changed without changing the rest of the system.

// An interface defines what something promises to do.

// It acts as a contract that defines the expected input and output.

// It describes the shape/behavior that an embedding provider must have.

// Any class that implements this interface must provide
// generateEmbedding() with the required input and output.

// This allows the rest of the AI system to depend on the
// EmbeddingProvider abstraction instead of depending directly
// on Ollama or another specific model/provider.





export interface EmbeddingProvider{

    generateEmbedding(
        text : string 
    ): Promise<number[]>;
}