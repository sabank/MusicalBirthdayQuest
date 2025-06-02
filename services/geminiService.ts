
import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { GEMINI_MODEL_TEXT, IMAGEN_MODEL, INITIAL_SYSTEM_PROMPT, IMAGE_STYLE_PROMPT_SUFFIX } from '../constants';
import { GeminiHistoryPart } from "../types";

let chat: Chat | null = null;
let ai: GoogleGenAI | null = null;

function getGoogleAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function initializeChatSession(history: GeminiHistoryPart[]): Promise<string> {
  const googleAI = getGoogleAI();
  chat = googleAI.chats.create({
    model: GEMINI_MODEL_TEXT,
    config: { systemInstruction: INITIAL_SYSTEM_PROMPT },
    history: history, // Provide existing history if any (e.g. for system prompt)
  });
  // The initial message to start the game will be sent by App.tsx via sendNarrationToChat
  // This function just sets up the chat.
  // For the very first message, App.tsx will call sendNarrationToChat with STAGE_SETUP_NARRATIVES[0]
  return "Chat initialized. Ready for the first stage.";
}

export async function sendMessageToChat(userInput: string, currentHistory: GeminiHistoryPart[]): Promise<string> {
  const googleAI = getGoogleAI();
  if (!chat) { // Fallback initialization if chat somehow not set up
    // This situation implies we are starting fresh OR there was an error.
    // We'll re-initialize. If currentHistory is empty, it means system prompt only.
    // If it has content, it means we're trying to recover.
     chat = googleAI.chats.create({
        model: GEMINI_MODEL_TEXT,
        config: { systemInstruction: INITIAL_SYSTEM_PROMPT },
        history: currentHistory,
      });
  }

  // The chat object internally manages history, but sending currentHistory to `startChat` or `create`
  // is good for re-establishing context if the Chat object was lost or for the first message.
  // For subsequent messages with an active `chat` object, `sendMessage` uses its internal history.

  const result: GenerateContentResponse = await chat.sendMessage({ message: userInput });
  return result.text;
}


export async function generateImage(prompt: string): Promise<string> {
  const googleAI = getGoogleAI();
  const fullPrompt = `${prompt}${IMAGE_STYLE_PROMPT_SUFFIX}`;
  
  try {
    const response = await googleAI.models.generateImages({
      model: IMAGEN_MODEL,
      prompt: fullPrompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      console.warn("Image generation did not return expected data, using placeholder.");
      return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512`; // Placeholder
    }
  } catch (error) {
    console.error("Error generating image with Imagen:", error);
    console.warn("Falling back to placeholder image due to Imagen API error.");
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512`; // Placeholder on error
  }
}
