import { GoogleGenAI } from "@google/genai";

const PROMPT = `
You are an expert voice analyst. Your task is to analyze the provided audio clip and generate a detailed, descriptive prompt that can be used in a Text-to-Speech (TTS) generator to replicate a similar voice style.

Analyze the following characteristics of the voice:
- **Tone**: Is it warm, friendly, authoritative, calm, energetic, melancholic?
- **Pitch**: Is it high, low, medium? Does it have a wide or narrow range?
- **Pace**: Is the speech fast, slow, moderate? Are there pauses?
- **Articulation**: Is it crisp and clear, or soft and mumbled?
- **Timbre**: Describe the quality of the voice (e.g., raspy, smooth, breathy, rich, nasal).
- **Emotion**: What emotions are conveyed? (e.g., happiness, sincerity, confidence).

Based on your analysis, synthesize these elements into a concise and effective TTS prompt. The prompt should be a single paragraph of descriptive text. Start the description directly, without any preamble like "This voice has..." or "Here is the description:".

Example Output:
"A medium-pitched male voice with a warm, friendly, and reassuring tone. The pace is moderate and conversational, with clear articulation. The timbre is smooth and rich, conveying a sense of calm confidence and sincerity."
`;

export async function analyzeVoiceTone(base64Audio: string, mimeType: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("A valid Gemini API key is required to perform the analysis.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: PROMPT,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [audioPart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    // Log the detailed, technical error to the console for debugging purposes.
    console.error("Gemini API Request Failed: Full error object:", error);

    let userFriendlyMessage = "An unknown error occurred while communicating with the Gemini API.";

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Provide more specific, user-friendly messages for common issues.
      if (message.includes('api key not valid') || message.includes('permission denied')) {
        userFriendlyMessage = 'The provided API key is not valid or lacks the necessary permissions. Please check your key and try again.';
      } else if (message.includes('quota')) {
        userFriendlyMessage = 'You have exceeded your API quota. Please check your usage and billing information with Google AI Studio.';
      } else if (message.includes('400 bad request')) {
        userFriendlyMessage = 'The request was invalid. This may be due to a problem with the uploaded audio file or its format.';
      } else {
        // For other errors, provide a message that's still helpful without being overly technical.
        userFriendlyMessage = `An error occurred during analysis. Please try again later.`;
      }
    }
    
    // Throw a new error with the user-friendly message to be displayed in the UI.
    throw new Error(userFriendlyMessage);
  }
}