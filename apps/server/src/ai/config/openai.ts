// we are creating an open ai client on this system 
// that is essentially our falicitator in the project 


import OpenAI from "openai";
import dotenv from "dotenv"; 
dotenv.config(); 

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

