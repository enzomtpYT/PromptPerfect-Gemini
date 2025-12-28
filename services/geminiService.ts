
import { GoogleGenAI } from "@google/genai";
import { RefinementGoal } from "../types.ts";

const getSystemInstruction = (goal: RefinementGoal) => {
  const base = `You are a world-class prompt engineer and AI optimization expert.
  Your task is to take a raw, simple, or poorly constructed user prompt and transform it into a high-quality instruction for a Large Language Model.
  
  Follow these principles:
  1. Clarity & Precision: Eliminate ambiguity.
  2. Contextual Depth: Add relevant context that helps the AI understand the underlying goal.
  3. Formatting: Use Markdown structure (headings, lists) where appropriate to increase readability for the AI.
  4. Role Play: Often, assigning a specific persona helps (e.g., 'You are a senior data scientist').
  5. Negative Constraints: Specify what NOT to do if relevant.
  `;

  const goals: Record<RefinementGoal, string> = {
    [RefinementGoal.GENERAL]: "Provide a well-balanced, professional, and clear version of the user's prompt.",
    [RefinementGoal.TECHNICAL]: "Focus on precision, terminology accuracy, and logical sequence. Ensure the prompt asks for evidence-based or mathematically sound responses.",
    [RefinementGoal.CREATIVE]: "Enhance descriptive language, encourage stylistic flair, and broaden the imaginative scope. Add sensory details and emotional tone requirements.",
    [RefinementGoal.CONCISE]: "Strip away fluff. Make the prompt direct and efficient while retaining the core intent. Use imperative language.",
    [RefinementGoal.CODING]: "Focus on architecture, clean code principles, edge cases, and specific programming paradigms. Include requirements for documentation and testing.",
    [RefinementGoal.STRUCTURED]: "Ensure the prompt asks for a strictly structured output (like JSON, Table, or CSV). Add schema requirements and type definitions."
  };

  return `${base}\n\nSPECIFIC GOAL: ${goals[goal]}\n\nRespond ONLY with the refined prompt. Do not provide meta-commentary like 'Here is your prompt'. Just the prompt text itself.`;
};

/**
 * Refines a user prompt based on a specific goal using Gemini AI.
 * Always initializes a new instance of GoogleGenAI to ensure the latest API key is used.
 */
export const refinePrompt = async (
  rawPrompt: string,
  goal: RefinementGoal,
  modelName: string = "gemini-2.5-flash-lite",
  customApiKey?: string
): Promise<string> => {
  // Require the custom API key.
  if (!customApiKey) {
    throw new Error("No API key provided. Please set your Gemini API key in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey: customApiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: rawPrompt,
      config: {
        systemInstruction: getSystemInstruction(goal),
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // The .text property directly returns the generated string.
    return response.text?.trim() || "Failed to generate a refined prompt.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Handle specific error code for missing/invalid API key configuration.
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("Requested entity was not found. This often indicates a model or API key mismatch. Please check your API key selection.");
    }
    throw new Error(error.message || "The AI encountered an issue refining your prompt.");
  }
};
