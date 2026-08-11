// this files creates and abstracts the embedding of ollama model 
// then it anstars the same model 

import { EmbeddingProvider } from "../providers/embedding.provider";
// interface for embedding  input and response 

import { OllamaEmbeddingProvider } from "../providers/ollama-embedding.provider";
// this is the file which creates the way as it takes user string and sends it to th model for embedding 


export const embeddingProvider : EmbeddingProvider = 
  new OllamaEmbeddingProvider(); // intialising the object for ollama embeddings 


  