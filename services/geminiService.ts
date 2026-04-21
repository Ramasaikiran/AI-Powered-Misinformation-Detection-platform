import { GroundingSource } from "../types";

export interface ChatResponse {
    text: string;
    sources: GroundingSource[];
}

const apiCall = async (action: string, payload: any = {}) => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
};

export const getChatbotResponse = async (message: string): Promise<ChatResponse> => {
    return apiCall('chat', { message });
};

export const analyzeImageForAI = async (base64Image: string, mimeType: string): Promise<any> => {
    return apiCall('analyzeImage', { base64Image, mimeType });
};

export const extractArticleTextFromHtml = async (html: string): Promise<string> => {
    const res = await apiCall('extractArticleText', { html });
    return res.text;
};

export const analyzeArticleContent = async (content: string): Promise<any> => {
    return apiCall('analyzeArticle', { content });
};

export const generateAwarenessTemplateText = async (prompt: string): Promise<any> => {
    return apiCall('generateTemplate', { prompt });
};

export const getTrendingTopics = async (): Promise<{ topic: string; risk: string; score: number; sources: GroundingSource[] }[]> => {
    return apiCall('getTrendingTopics');
};

export const understandVoiceCommand = async (command: string, context: { hasImage: boolean; hasArticle: boolean }): Promise<any> => {
    return apiCall('understandVoiceCommand', { command, context });
};

export const summarizeResultForSpeech = async (resultType: 'image' | 'article', result: any): Promise<string> => {
    const res = await apiCall('summarizeResultForSpeech', { resultType, result });
    return res.text;
};
