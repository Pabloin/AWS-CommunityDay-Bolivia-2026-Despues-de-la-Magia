import React, { useState } from 'react';
import originalData from './data/saa-c03-questions.json';
import extendedData from './data/saa-c03-questions-extended.json';
import { Question } from './types/question';

type QuizMode = 'welcome' | 'quiz' | 'complete';
type Dataset = 'basic' | 'extended';

function App() {
  // Quiz mode state
  const [mode, setMode] = useState<QuizMode>('welcome');
  const [dataset, setDataset] = useState<Dataset>('extended');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Get questions based on selection
  const getQuestions = (): Question[] => {
    const data = dataset === 'basic' ? originalData : extendedData;
    let questions = data.questions;

    // Filter by domain if extended dataset and not 'all'
    if (dataset === 'extended' && selectedDomain !== 'all') {
      questions = questions.filter((q: any) => q.domain === selectedDomain);
    }

    // Shuffle and limit to selected count
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentQuestionIndex];

  // Start quiz handler
  const handleStartQuiz = () => {
    setMode('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

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
    setMode('welcome');
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  // Welcome Screen
  if (mode === 'welcome') {
    const domains = [
      { id: 'all', name: 'All Domains', weight: '100%' },
      { id: 'domain1', name: 'Design Secure Architectures', weight: '30%' },
      { id: 'domain2', name: 'Design Resilient Architectures', weight: '26%' },
      { id: 'domain3', name: 'Design High-Performing Architectures', weight: '24%' },
      { id: 'domain4', name: 'Design Cost-Optimized Architectures', weight: '20%' },
    ];

    // Count questions for preview
    const basicCount = originalData.questions.length;
    const extendedCount = extendedData.questions.length;
    const selectedCount = getQuestions().length;

    return (
      <div className="app">
        <div className="container">
          <div className="welcome-screen">
            <div className="welcome-header">
              <h1>🪄 Magic Cert</h1>
              <p className="welcome-subtitle">AWS Solutions Architect Associate (SAA-C03)</p>
              <p className="welcome-description">
                Practice with real-world scenarios and detailed explanations
              </p>
            </div>

            <div className="quiz-options">
              <div className="option-section">
                <h2>📚 Select Question Set</h2>
                <div className="option-cards">
                  <div
                    className={`option-card ${dataset === 'basic' ? 'selected' : ''}`}
                    onClick={() => setDataset('basic')}
                  >
                    <div className="option-card-header">
                      <h3>Basic Set</h3>
                      <span className="question-count">{basicCount} questions</span>
                    </div>
                    <p>Fundamental topics covering core AWS services</p>
                    <ul className="option-features">
                      <li>✓ Core AWS services</li>
                      <li>✓ Quick practice</li>
                      <li>✓ Mixed difficulty</li>
                    </ul>
                  </div>

                  <div
                    className={`option-card ${dataset === 'extended' ? 'selected' : ''}`}
                    onClick={() => setDataset('extended')}
                  >
                    <div className="option-card-header">
                      <h3>Extended Set</h3>
                      <span className="question-count">{extendedCount} questions</span>
                    </div>
                    <p>Organized by official SAA-C03 exam domains</p>
                    <ul className="option-features">
                      <li>✓ Domain-organized</li>
                      <li>✓ Exam-aligned</li>
                      <li>✓ Advanced scenarios</li>
                    </ul>
                  </div>
                </div>
              </div>

              {dataset === 'extended' && (
                <div className="option-section">
                  <h2>🎯 Select Domain</h2>
                  <div className="domain-grid">
                    {domains.map((domain) => (
                      <div
                        key={domain.id}
                        className={`domain-card ${selectedDomain === domain.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDomain(domain.id)}
                      >
                        <div className="domain-card-content">
                          <h3>{domain.name}</h3>
                          <div className="domain-meta">
                            <span className="domain-weight">{domain.weight}</span>
                            {domain.id !== 'all' && (
                              <span className="domain-questions">
                                {extendedData.questions.filter((q: any) => q.domain === domain.id).length} questions
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="option-section">
                <h2>🔢 Number of Questions</h2>
                <div className="count-options">
                  {[3, 5, 10].map((count) => (
                    <button
                      key={count}
                      className={`count-btn ${questionCount === count ? 'selected' : ''}`}
                      onClick={() => setQuestionCount(count)}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div className="start-section">
                <div className="quiz-summary">
                  <p>
                    <strong>Selected:</strong> {dataset === 'basic' ? 'Basic' : 'Extended'} Set
                    {dataset === 'extended' && selectedDomain !== 'all' && (
                      <> • {domains.find(d => d.id === selectedDomain)?.name}</>
                    )}
                  </p>
                  <p className="quiz-count">
                    <strong>{selectedCount}</strong> question{selectedCount !== 1 ? 's' : ''} ready
                  </p>
                </div>
                <button
                  onClick={handleStartQuiz}
                  className="btn btn-primary btn-large"
                  disabled={selectedCount === 0}
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          </div>

          <footer className="footer">
            <p>Created with AI ✨ | AWS Community Day Bolivia 2026</p>
          </footer>
        </div>
      </div>
    );
  }

  // Quiz Complete Screen
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
