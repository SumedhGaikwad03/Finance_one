import { generateEmbedding } from "./embedding.service";

const test = async () => {

    const embedding = await generateEmbedding(
        "How much did I spend on groceries?"
    );

    console.log("Embedding generated");
    console.log("Dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));

};

test();