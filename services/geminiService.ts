import { GoogleGenerativeAI, Part, GenerativeModel, CountTokensRequest, Type } from "@google/generative-ai";
import { VocabularyCard, CardStatus, Language } from "../types";
import { GEMINI_MODEL } from "../constants";

const GEMINI_API_KEY = "AIzaSyBSgKQSamvZ6wHre_tt251-9lcA7Rb-rlM";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const ai = genAI.getGenerativeModel({ model: GEMINI_MODEL });

export const recognizeHandwriting = async (base64Image: string): Promise<string> => {
  // Clean base64 string if it contains metadata
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const result = await ai.generateContent({
      contents: [
        {
          role: "user",
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
      ]
    });
    const response = result.response;

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
    const result = await ai.generateContent({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
    const response = result.response;

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