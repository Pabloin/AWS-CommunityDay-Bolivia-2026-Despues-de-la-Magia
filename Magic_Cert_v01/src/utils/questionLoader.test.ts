import { describe, expect, it } from 'vitest';
import { QuestionLoader } from './questionLoader';
import type { Question } from '../types/question';

const questions: Question[] = [
  {
    id: 'compute-1',
    certification: 'SAA-C03',
    category: 'Compute',
    difficulty: 'easy',
    question: 'Which service runs virtual servers?',
    options: [{ id: 'ec2', text: 'EC2', isCorrect: true }],
    explanation: 'EC2 runs virtual servers.',
    tags: ['EC2'],
  },
  {
    id: 'storage-1',
    certification: 'DVA-C02',
    category: 'Storage',
    difficulty: 'hard',
    question: 'Where are objects stored?',
    options: [{ id: 's3', text: 'S3', isCorrect: true }],
    explanation: 'S3 stores objects.',
    tags: ['S3'],
  },
];

describe('QuestionLoader', () => {
  const loader = new QuestionLoader(questions);

  it('filters questions by certification and tag', () => {
    expect(loader.getByCertification('SAA-C03').map(q => q.id)).toEqual(['compute-1']);
    expect(loader.getByTag('ec2').map(q => q.id)).toEqual(['compute-1']);
  });

  it('limits random questions to those matching every filter', () => {
    expect(loader.getRandomQuestions(5, { certification: 'SAA-C03', category: 'Compute' }).map(q => q.id)).toEqual(['compute-1']);
    expect(loader.getRandomQuestions(5, { certification: 'SAA-C03', category: 'Storage' })).toEqual([]);
  });

  it('calculates statistics for a certification', () => {
    expect(loader.getStatistics('SAA-C03')).toEqual({
      totalQuestions: 1,
      categories: [{ category: 'Compute', count: 1, difficulties: { easy: 1, medium: 0, hard: 0 } }],
      difficulties: { easy: 1, medium: 0, hard: 0 },
    });
  });
});
