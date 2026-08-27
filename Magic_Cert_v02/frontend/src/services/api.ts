// API Service for Magic Cert v02 Backend
// Connects to AWS API Gateway + Lambda

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export interface Question {
  id?: string;
  questionId?: string;
  certification: string;
  domain?: string;
  domainName?: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer?: string | string[];
  correctAnswers?: string[];
  explanation?: string;
  category?: string;
}

export interface QuestionsResponse {
  success: boolean;
  questions: Question[];
  total: number;
  returned: number;
}

// Fetch questions from API
export async function fetchQuestions(
  certification: string = 'SAA-C03',
  domain: string = 'all',
  count: number = 5
): Promise<Question[]> {
  try {
    const params = new URLSearchParams({
      certification,
      domain,
      count: count.toString()
    });

    const response = await fetch(`${API_URL}/questions?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: QuestionsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API returned error');
    }

    return data.questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Fallback to local data
    return [];
  }
}

// Auth API
export interface AuthResponse {
  success: boolean;
  user?: {
    userId: string;
    email: string;
    name: string;
  };
  token?: string;
  error?: string;
}

export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Progress API
export interface ProgressData {
  certification: string;
  dataset: string;
  domain: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  answers: Array<{
    questionId: string;
    selectedAnswers: string[];
    correctAnswers: string[];
    isCorrect: boolean;
    timeSpent?: number;
  }>;
  startedAt: string;
  durationSeconds: number;
}

export async function saveProgress(token: string, progressData: ProgressData): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/user/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(progressData)
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
}

export async function getProgress(token: string, limit: number = 20) {
  try {
    const response = await fetch(`${API_URL}/user/progress?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function getStatistics(token: string) {
  try {
    const response = await fetch(`${API_URL}/user/progress?stats=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
