
import { GoogleGenAI, GenerateContentResponse, Type, Chat } from "@google/genai";
import { GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const chat: Chat = ai.chats.create({
  model: 'gemini-3-flash-preview',
  config: {
    systemInstruction: 'You are a friendly and helpful chatbot for the CodeHustlers website. Your purpose is to answer user questions about the features of the site and provide general information about any topic by searching the web when necessary. Keep your answers concise and easy to understand.',
    tools: [{ googleSearch: {} }],
  },
});

export interface ChatResponse {
    text: string;
    sources: GroundingSource[];
}

export const getChatbotResponse = async (message: string): Promise<ChatResponse> => {
    try {
        const response = await chat.sendMessage({ message });
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = chunks?.map((chunk: any) => ({
            title: chunk.web?.title || "Source",
            uri: chunk.web?.uri
        })).filter((s: any) => s.uri) || [];

        return { 
            text: response.text || "I'm sorry, I couldn't generate a response.",
            sources 
        };
    } catch (error) {
        console.error("Error with chatbot:", error);
        throw new Error("Failed to get a response from the chatbot. Please try again later.");
    }
};

export const analyzeImageForAI = async (base64Image: string, mimeType: string): Promise<any> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Analyze this image for signs of AI generation. Focus on intrinsic features like texture inconsistencies, noise patterns, and known AI artifacts. Provide a classification ('AI-generated', 'Authentic', or 'Uncertain'), a confidence score (0-100), and a brief explanation of your reasoning.",
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["classification", "confidence", "explanation"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error('Failed to analyze image. Please try again.');
  }
};

export const extractArticleTextFromHtml = async (html: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Extract the main article text from this HTML, ignoring ads and navigation: "${html.substring(0, 35000)}"`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Error extracting text:", error);
        throw new Error('Failed to extract article content.');
    }
};

export const analyzeArticleContent = async (content: string): Promise<any> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this article and identify misinformation risk: "${content}"`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskLevel: { type: Type.STRING },
                        credibilityScore: { type: Type.INTEGER },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        summary: { type: Type.STRING },
                        claims: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    claim: { type: Type.STRING },
                                    verification: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ["riskLevel", "credibilityScore", "summary", "claims"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error analyzing article:", error);
        throw new Error('Failed to analyze article.');
    }
};

export const generateAwarenessTemplateText = async (prompt: string): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate an awareness kit for: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "highlights", "tips"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating kit:", error);
        throw new Error('Failed to generate kit.');
    }
};

export const getTrendingTopics = async (): Promise<{ topic: string; risk: string; score: number; sources: GroundingSource[] }[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "List top 5 trending misinformation narratives. Respond with a JSON array.",
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            risk: { type: Type.STRING },
                            score: { type: Type.INTEGER }
                        },
                        required: ["topic", "risk", "score"]
                    }
                }
            },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const allSources: GroundingSource[] = chunks?.map((chunk: any) => ({
            title: chunk.web?.title || "Search Source",
            uri: chunk.web?.uri
        })).filter((s: any) => s.uri) || [];

        const topics = JSON.parse(response.text.trim());
        return topics.map((t: any) => ({ ...t, sources: allSources }));
    } catch (error) {
        console.error("Error fetching trends:", error);
        throw new Error('Failed to fetch trending topics.');
    }
};

export const understandVoiceCommand = async (command: string, context: { hasImage: boolean; hasArticle: boolean }): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User said: "${command}". Context: Image ${context.hasImage ? 'exists' : 'no'}, Article ${context.hasArticle ? 'exists' : 'no'}. Determine intent and parameters.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            parameters: {
              type: Type.OBJECT,
              properties: {
                article: { type: Type.STRING },
                topic: { type: Type.STRING }
              }
            },
            responseText: { type: Type.STRING }
          },
          required: ["intent", "responseText"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Voice parsing error:", error);
    throw new Error("I couldn't understand that command.");
  }
};

export const summarizeResultForSpeech = async (resultType: 'image' | 'article', result: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize for voice: ${resultType} analysis result. ${JSON.stringify(result)}`,
    });
    return response.text || "Analysis complete.";
  } catch (error) {
    return "The analysis is ready.";
  }
}
