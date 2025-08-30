import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Gemini API with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    // Configure the model - using the latest model name
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });

    const prompt_template = `Generate a brief and well-structured note content based on this topic or initial content: ${prompt}`;

    const result = await model.generateContent(prompt_template);
    const response = await result.response;

    if (!response.text()) {
      throw new Error("No content generated");
    }

    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};
