/**
 * Example Usage of QuestionLoader
 * 
 * This file demonstrates how to use the QuestionLoader utility
 * to load and manage quiz questions
 */

import { loadQuestionsFromData, QuestionLoader } from './questionLoader';
import saac03Data from '../data/saa-c03-questions.json';

// Example 1: Load questions
const questionLoader: QuestionLoader = loadQuestionsFromData(saac03Data);

// Example 2: Get all questions
const allQuestions = questionLoader.getAllQuestions();
console.log(`Total questions: ${allQuestions.length}`);

// Example 3: Get questions by certification
const saac03Questions = questionLoader.getByCertification('SAA-C03');
console.log(`SAA-C03 questions: ${saac03Questions.length}`);

// Example 4: Get questions by category
const storageQuestions = questionLoader.getByCategory('Storage');
console.log(`Storage questions: ${storageQuestions.length}`);

// Example 5: Get questions by difficulty
const easyQuestions = questionLoader.getByDifficulty('easy');
const mediumQuestions = questionLoader.getByDifficulty('medium');
const hardQuestions = questionLoader.getByDifficulty('hard');
console.log(`Easy: ${easyQuestions.length}, Medium: ${mediumQuestions.length}, Hard: ${hardQuestions.length}`);

// Example 6: Get questions by tag
const highAvailabilityQuestions = questionLoader.getByTag('high-availability');
console.log(`High availability questions: ${highAvailabilityQuestions.length}`);

// Example 7: Search questions
const ec2Questions = questionLoader.searchQuestions('EC2');
console.log(`Questions mentioning EC2: ${ec2Questions.length}`);

// Example 8: Get random questions for a quiz
const randomQuiz = questionLoader.getRandomQuestions(5, {
  certification: 'SAA-C03',
  difficulty: 'medium'
});
console.log(`Random medium SAA-C03 questions: ${randomQuiz.length}`);

// Example 9: Get a specific question by ID
const question = questionLoader.getById('saa-c03-001');
if (question) {
  console.log(`Question: ${question.question}`);
  console.log(`Category: ${question.category}`);
  console.log(`Difficulty: ${question.difficulty}`);
}

// Example 10: Get available categories
const categories = questionLoader.getCategories('SAA-C03');
console.log(`Available categories:`, categories);

// Example 11: Get subcategories for a category
const computeSubcategories = questionLoader.getSubcategories('Compute', 'SAA-C03');
console.log(`Compute subcategories:`, computeSubcategories);

// Example 12: Get statistics
const stats = questionLoader.getStatistics('SAA-C03');
console.log('Question Bank Statistics:', JSON.stringify(stats, null, 2));

// Example 13: Create a custom quiz with mixed difficulties
const mixedQuiz = [
  ...questionLoader.getRandomQuestions(2, { certification: 'SAA-C03', difficulty: 'easy' }),
  ...questionLoader.getRandomQuestions(5, { certification: 'SAA-C03', difficulty: 'medium' }),
  ...questionLoader.getRandomQuestions(3, { certification: 'SAA-C03', difficulty: 'hard' })
];
console.log(`Mixed difficulty quiz: ${mixedQuiz.length} questions`);

// Example 14: Create a category-specific quiz
const storageQuiz = questionLoader.getRandomQuestions(5, {
  certification: 'SAA-C03',
  category: 'Storage'
});
console.log(`Storage-focused quiz: ${storageQuiz.length} questions`);

// Example 15: Validate question structure
function validateQuestion(question: any): boolean {
  const requiredFields = ['id', 'certification', 'category', 'difficulty', 'question', 'options', 'explanation'];
  const hasAllFields = requiredFields.every(field => question.hasOwnProperty(field));
  const hasCorrectAnswer = question.options?.some((opt: any) => opt.isCorrect === true);
  const hasEnoughOptions = question.options?.length >= 4;
  
  return hasAllFields && hasCorrectAnswer && hasEnoughOptions;
}

// Validate all questions
const invalidQuestions = allQuestions.filter(q => !validateQuestion(q));
if (invalidQuestions.length === 0) {
  console.log('✅ All questions are valid!');
} else {
  console.log(`❌ Found ${invalidQuestions.length} invalid questions`);
  invalidQuestions.forEach(q => console.log(`Invalid question: ${q.id}`));
}

export {
  questionLoader,
  validateQuestion
};
