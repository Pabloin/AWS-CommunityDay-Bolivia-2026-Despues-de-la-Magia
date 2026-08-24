import { Question } from '../types/question';

/**
 * Question Loader Utility
 * Handles loading, filtering, and managing quiz questions
 */

export class QuestionLoader {
  private questions: Question[] = [];

  constructor(questions: Question[]) {
    this.questions = questions;
  }

  /**
   * Get all questions
   */
  getAllQuestions(): Question[] {
    return [...this.questions];
  }

  /**
   * Get questions by certification
   */
  getByCertification(certification: string): Question[] {
    return this.questions.filter(q => q.certification === certification);
  }

  /**
   * Get questions by category
   */
  getByCategory(category: string): Question[] {
    return this.questions.filter(q => q.category === category);
  }

  /**
   * Get questions by difficulty
   */
  getByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Question[] {
    return this.questions.filter(q => q.difficulty === difficulty);
  }

  /**
   * Get questions by tag
   */
  getByTag(tag: string): Question[] {
    return this.questions.filter(q => 
      q.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  /**
   * Search questions by keyword
   */
  searchQuestions(keyword: string): Question[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.questions.filter(q =>
      q.question.toLowerCase().includes(lowerKeyword) ||
      q.explanation.toLowerCase().includes(lowerKeyword) ||
      q.category.toLowerCase().includes(lowerKeyword) ||
      q.subcategory?.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get random questions
   */
  getRandomQuestions(count: number, filters?: {
    certification?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Question[] {
    let filteredQuestions = [...this.questions];

    if (filters?.certification) {
      filteredQuestions = filteredQuestions.filter(
        q => q.certification === filters.certification
      );
    }

    if (filters?.category) {
      filteredQuestions = filteredQuestions.filter(
        q => q.category === filters.category
      );
    }

    if (filters?.difficulty) {
      filteredQuestions = filteredQuestions.filter(
        q => q.difficulty === filters.difficulty
      );
    }

    // Shuffle and return requested count
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get question by ID
   */
  getById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Get available categories for a certification
   */
  getCategories(certification?: string): string[] {
    const filtered = certification
      ? this.questions.filter(q => q.certification === certification)
      : this.questions;

    const categories = new Set(filtered.map(q => q.category));
    return Array.from(categories).sort();
  }

  /**
   * Get available subcategories for a category
   */
  getSubcategories(category: string, certification?: string): string[] {
    const filtered = this.questions.filter(q => {
      const matchesCategory = q.category === category;
      const matchesCertification = !certification || q.certification === certification;
      return matchesCategory && matchesCertification && q.subcategory;
    });

    const subcategories = new Set(
      filtered.map(q => q.subcategory).filter(Boolean) as string[]
    );
    return Array.from(subcategories).sort();
  }

  /**
   * Get statistics about the question bank
   */
  getStatistics(certification?: string) {
    const filtered = certification
      ? this.questions.filter(q => q.certification === certification)
      : this.questions;

    const categories = this.getCategories(certification);
    const categoryStats = categories.map(cat => ({
      category: cat,
      count: filtered.filter(q => q.category === cat).length,
      difficulties: {
        easy: filtered.filter(q => q.category === cat && q.difficulty === 'easy').length,
        medium: filtered.filter(q => q.category === cat && q.difficulty === 'medium').length,
        hard: filtered.filter(q => q.category === cat && q.difficulty === 'hard').length,
      }
    }));

    return {
      totalQuestions: filtered.length,
      categories: categoryStats,
      difficulties: {
        easy: filtered.filter(q => q.difficulty === 'easy').length,
        medium: filtered.filter(q => q.difficulty === 'medium').length,
        hard: filtered.filter(q => q.difficulty === 'hard').length,
      }
    };
  }
}

/**
 * Load questions from JSON data
 */
export function loadQuestionsFromData(data: any): QuestionLoader {
  const questions = data.questions || [];
  return new QuestionLoader(questions);
}
