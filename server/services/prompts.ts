import { storage } from "../storage.js";
import { generateMemoryPrompt } from "./openai.js";

export async function getPromptsForCategory(category?: string) {
  return await storage.getMemoryPrompts(category);
}

export async function getRandomPrompt() {
  return await storage.getRandomPrompt();
}

export async function generateAIPrompt(category?: string) {
  try {
    const prompt = await generateMemoryPrompt(category);
    return { prompt, category: category || "general" };
  } catch (error) {
    console.error("Error generating AI prompt:", error);
    throw error;
  }
}

export const promptCategories = [
  "childhood",
  "daily",
  "relationships", 
  "travel",
  "achievements",
  "family",
  "work",
  "hobbies"
];
