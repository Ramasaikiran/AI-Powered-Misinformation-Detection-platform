export type Page = 'home' | 'dashboard' | 'faq' | 'contact' | 'login' | 'register' | 'profile';

export interface ImageDetectionResult {
  classification: 'AI-generated' | 'Authentic' | 'Uncertain';
  confidence: number;
  explanation: string;
}

export interface ArticleAnalysisResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  credibilityScore: number;
  tags: string[];
  summary: string;
  claims: { claim: string; verification: string }[];
}

export interface UserHistoryItem {
  id: string;
  type: 'image' | 'article';
  query: string;
  result: string;
  timestamp: string;
}

export interface User {
  name: string;
  email: string;
  username: string;
  profileImageUrl: string | null;
}