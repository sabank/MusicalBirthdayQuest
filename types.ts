
export interface DisplayMessage {
  id: string;
  speaker: 'game' | 'user' | 'system';
  text: string;
  imagePrompt?: string; // Optional: The prompt used to generate an image for this message
  imageUrl?: string;    // Optional: The URL of the image associated with this message
}

// export type GameStage = 0 | 1 | 2 | 3 | 4 | 5; // 0-4 for stages, 5 for game over
export type CorrectAnswersCount = 0 | 1 | 2 | 3; // Tracks number of correct answers. 3 means game won.

// PuzzlePart is no longer needed as the message isn't revealed piece by piece.
// export interface PuzzlePart {
//   id: number;
//   text: string;
//   isDiscovered: boolean;
// }

// For Gemini API interactions, specifically for chat history
export interface GeminiHistoryPart {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
