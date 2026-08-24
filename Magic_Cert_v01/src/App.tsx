import React, { useState } from 'react';
import saaC03Data from './data/saa-c03-questions.json';
import { Question } from './types/question';

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const questions: Question[] = saaC03Data.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionId: string) => {
    if (showExplanation) return;

    const isMultiSelect = currentQuestion.question.includes('Choose TWO') || 
                          currentQuestion.question.includes('Choose THREE');

    if (isMultiSelect) {
      setSelectedAnswers(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedAnswers([optionId]);
    }
  };

  const handleSubmit = () => {
    setShowExplanation(true);
    
    const correctAnswers = currentQuestion.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt.id);
    
    const isCorrect = 
      correctAnswers.length === selectedAnswers.length &&
      correctAnswers.every(id => selectedAnswers.includes(id));
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    return (
      <div className="app">
        <div className="container">
          <div className="quiz-complete">
            <h1>🎉 Quiz Complete!</h1>
            <div className="score-card">
              <p className="score-text">Your Score</p>
              <p className="score-number">{score} / {questions.length}</p>
              <p className="percentage">
                {Math.round((score / questions.length) * 100)}%
              </p>
            </div>
            <button onClick={handleRestart} className="btn btn-primary">
              Restart Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🪄 Magic Cert</h1>
          <p className="subtitle">AWS Solutions Architect Associate (SAA-C03)</p>
          <div className="progress">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>
        </header>

        <div className="question-card">
          <div className="question-meta">
            <span className={`badge badge-${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="badge badge-category">
              {currentQuestion.category}
            </span>
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>

          <div className="options">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswers.includes(option.id);
              const showCorrect = showExplanation && option.isCorrect;
              const showIncorrect = showExplanation && isSelected && !option.isCorrect;

              return (
                <div
                  key={option.id}
                  className={`option ${isSelected ? 'selected' : ''} ${
                    showCorrect ? 'correct' : ''
                  } ${showIncorrect ? 'incorrect' : ''}`}
                  onClick={() => handleAnswerSelect(option.id)}
                >
                  <span className="option-id">{option.id.toUpperCase()}.</span>
                  <span className="option-text">{option.text}</span>
                  {showCorrect && <span className="icon">✓</span>}
                  {showIncorrect && <span className="icon">✗</span>}
                </div>
              );
            })}
          </div>

          {showExplanation && (
            <div className="explanation">
              <h3>Explanation</h3>
              <p>{currentQuestion.explanation}</p>
              {currentQuestion.references && currentQuestion.references.length > 0 && (
                <div className="references">
                  <h4>References:</h4>
                  <ul>
                    {currentQuestion.references.map((ref, idx) => (
                      <li key={idx}>
                        <a href={ref} target="_blank" rel="noopener noreferrer">
                          AWS Documentation ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="actions">
            {!showExplanation ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswers.length === 0}
                className="btn btn-primary"
              >
                Submit Answer
              </button>
            ) : (
              <button onClick={handleNext} className="btn btn-primary">
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>

        <footer className="footer">
          <p>Created with AI ✨ | AWS Community Day Bolivia 2026</p>
          <p className="note">Note: These are example questions for demonstration purposes.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
