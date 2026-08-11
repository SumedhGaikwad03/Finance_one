// this is child class or an extentention of the inteface we just defined and here we defind as 


import { EmbeddingProvider } from "./embedding.provider";

export class OllamaEmbeddingProvider implements EmbeddingProvider { // this a class that implements the interface that we
//  impomneted prior  and honors the promise of that embedding 

    async generateEmbedding(text: string): Promise<number[]> {
        // we call ollama from here 

        const response = await fetch( 
             "http://localhost:11434/api/embed", // this req fectches the vector body of 2560 vectors as the op 
             //
             {
                method : "POST" , 

                headers :{
                    "Content-Type": "applications/json",
                },
                 body: JSON.stringify({
                    model: "qwen3-embedding:4b",
                    input: text,
                }), // we create the json object for the same 
             }




        );

        const data = await response.json();

        return data.embeddings[0];
    }
}


