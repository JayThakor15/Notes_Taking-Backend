import type { Request, Response } from "express";
import { generateContent } from "../services/gemini.service.js";

const aiController = {
  generateNoteContent: async (req: Request, res: Response) => {
    try {
      console.log("Received AI generation request:", req.body);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          message: "Content is required for generation",
        });
      }

      const generatedContent = await generateContent(content);

      res.json({
        message: "Content generated successfully",
        generatedContent,
      });
    } catch (error) {
      console.error("Error in content generation:", error);
      res.status(500).json({
        message: "Error generating content",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};

export default aiController;
