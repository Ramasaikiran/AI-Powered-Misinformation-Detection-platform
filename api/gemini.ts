import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { action, payload } = req.body;

    if (action === 'chat') {
        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: 'You are a friendly and helpful chatbot for the CodeHustlers website. Your purpose is to answer user questions about the features of the site and provide general information about any topic by searching the web when necessary. Keep your answers concise and easy to understand.',
            tools: [{ googleSearch: {} }],
          },
        });
        const response = await chat.sendMessage({ message: payload.message });
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = chunks?.map((chunk: any) => ({
            title: chunk.web?.title || "Source",
            uri: chunk.web?.uri
        })).filter((s: any) => s.uri) || [];

        return res.status(200).json({ 
            text: response.text || "I'm sorry, I couldn't generate a response.",
            sources 
        });
    }

    if (action === 'analyzeImage') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: payload.mimeType,
                  data: payload.base64Image,
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
        return res.status(200).json(JSON.parse(response.text?.trim() || "{}"));
    }

    if (action === 'extractArticleText') {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Extract the main article text from this HTML, ignoring ads and navigation: "${payload.html.substring(0, 35000)}"`,
        });
        return res.status(200).json({ text: response.text || "" });
    }

    if (action === 'analyzeArticle') {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this article and identify misinformation risk: "${payload.content}"`,
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
        return res.status(200).json(JSON.parse(response.text?.trim() || "{}"));
    }

    if (action === 'generateTemplate') {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate an awareness kit for: "${payload.prompt}"`,
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
        return res.status(200).json(JSON.parse(response.text?.trim() || "{}"));
    }

    if (action === 'getTrendingTopics') {
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
        const allSources = chunks?.map((chunk: any) => ({
            title: chunk.web?.title || "Search Source",
            uri: chunk.web?.uri
        })).filter((s: any) => s.uri) || [];

        const topics = JSON.parse(response.text?.trim() || "{}");
        return res.status(200).json(topics.map((t: any) => ({ ...t, sources: allSources })));
    }

    if (action === 'understandVoiceCommand') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `User said: "${payload.command}". Context: Image ${payload.context?.hasImage ? 'exists' : 'no'}, Article ${payload.context?.hasArticle ? 'exists' : 'no'}. Determine intent and parameters.`,
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
        return res.status(200).json(JSON.parse(response.text?.trim() || "{}"));
    }

    if (action === 'summarizeResultForSpeech') {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Summarize for voice: ${payload.resultType} analysis result. ${JSON.stringify(payload.result)}`,
        });
        return res.status(200).json({ text: response.text || "Analysis complete." });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (error: any) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
