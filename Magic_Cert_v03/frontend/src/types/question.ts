/**
 * Question Types for AWS Certification Quiz Application
 */

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  certification: string; // e.g., "SAA-C03", "DVA-C02", "SOA-C02"
  category: string; // e.g., "Compute", "Storage", "Database", "Security"
  subcategory?: string; // e.g., "EC2", "S3", "RDS"
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: QuestionOption[];
  explanation: string;
  references?: string[]; // Links to AWS documentation
  tags?: string[]; // Additional tags for filtering
}

export interface QuizSession {
  id: string;
  certification: string;
  startTime: Date;
  endTime?: Date;
  questions: Question[];
  answers: Map<string, string[]>; // questionId -> selected optionIds
  score?: number;
}

export interface QuizStatistics {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  scorePercentage: number;
  categoryBreakdown: {
    [category: string]: {
      correct: number;
      total: number;
    };
  };
}
