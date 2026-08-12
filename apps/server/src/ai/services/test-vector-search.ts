import { generateEmbedding } from "./embedding.service";
import { VectorSearchService } from "./vector-search.service";

const searchService = new VectorSearchService();

const test = async () => {

    const question = "How much did I spend on groceries?";

    const embedding = await generateEmbedding(question);

    const result = await searchService.search(embedding);

    console.log("Question:", question);
    console.log("Result:", result);
};

test();