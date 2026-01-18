import { GoogleGenAI, Type } from "@google/genai";
import { VocabularyCard, CardStatus, Language } from "../types";
import { GEMINI_MODEL } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const recognizeHandwriting = async (base64Image: string): Promise<string> => {
  // Clean base64 string if it contains metadata
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            }
          },
          {
            text: "Identify the handwritten text in this image. Return ONLY the text string found. Do not include any explanation. If it is Korean or Japanese, return it exactly as written."
          }
        ]
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to recognize handwriting.");
  }
};

export const generateVocabularyCard = async (
  term: string
): Promise<VocabularyCard> => {
  
  const systemInstruction = `
    You are an expert linguist and translator (English <-> Korean <-> Japanese) with broad knowledge across all fields.
    
    Task: Analyze the input term and generate a structured vocabulary card that covers its most important meanings comprehensively.

    ### LOGIC:
    1. **If Input is English or Korean (Target Language)**:
       - Detect Language.
       - Provide meanings in **Japanese**.
       - **Context Selection**: Do NOT focus on Economics unless the word is specifically an economic term. Instead, cover the most relevant contexts for that word (e.g., General, Business, IT, Medical, Slang, Academic, etc.).
       - Order meanings by frequency of use (Most common -> Specific/Slang).

    2. **If Input is Japanese (Reverse Lookup)**:
       - Detect Language as JP.
       - **Provide translations for BOTH English AND Korean.**
       - For EACH target language, provide 2-3 distinct options based on nuance (e.g., Casual vs Formal, Written vs Spoken).
       - **CRITICAL**: The 'contextType' MUST start with the language name.
       - Example: "English (General)", "English (Formal)", "Korean (Casual)", "Korean (Honorific)".

    ### Rules for 'meanings' array:
    - **contextType**: string. Choose the most fitting category. Examples: "General", "Business", "IT", "Legal", "Slang", "Academic".
    - **definition**: string (The meaning in Japanese OR the Translated Term)
    - **nuance**: string (Japanese explanation of the vibe, usage restriction, or synonyms)
    - **example**: A sentence using the *definition* term.

    ### Output JSON Schema:
    Return JSON matching the schema below.
  `;

  const prompt = `Term to explain: "${term}"`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, enum: [Language.EN, Language.KR, Language.JP] },
            pronunciation: { type: Type.STRING, description: "Reading guide (Katakana for KR, IPA for EN, or Hiragana for JP)" },
            crossRefTerm: { type: Type.STRING, description: "A simple representative equivalent term or synonym" },
            meanings: {
              type: Type.ARRAY,
              description: "List of meanings or translations by context",
              items: {
                type: Type.OBJECT,
                properties: {
                  contextType: { type: Type.STRING, description: "e.g., 'General', 'Business', 'Slang', 'IT', 'English (Formal)'" },
                  definition: { type: Type.STRING, description: "The Japanese meaning OR the English/Korean translation" },
                  nuance: { type: Type.STRING, description: "Usage guide, tone, or vibe in Japanese" },
                  example: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING, description: "Sentence using the definition word" },
                      translation: { type: Type.STRING, description: "Japanese translation of the sentence" }
                    }
                  }
                },
                required: ["contextType", "definition", "nuance", "example"]
              }
            }
          },
          required: ["detectedLanguage", "meanings"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText);

    return {
      id: crypto.randomUUID(),
      term: term,
      detectedLanguage: data.detectedLanguage as Language,
      pronunciation: data.pronunciation || "",
      meanings: data.meanings,
      crossRefTerm: data.crossRefTerm || "",
      createdAt: Date.now(),
      status: CardStatus.NEW
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate card content. Please check your network or API key.");
  }
};