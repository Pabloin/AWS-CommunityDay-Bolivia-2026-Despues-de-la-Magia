import { useState } from 'react';
import {
  explainAnswerWithAi,
  fetchQuestions,
  login,
  register,
  Question as APIQuestion
} from './services/api';

type QuizMode = 'welcome' | 'quiz' | 'complete';
type Dataset = 'basic' | 'extended';

function VersionBadge() {
  return (
    <div className="version-badge" aria-label="Application version">
      <span className="version-badge-main">v03</span>
      <span className="version-badge-detail">Serverless + OIDC + Bedrock</span>
      <span className="version-badge-stack">S3 + API Gateway + Lambda + DynamoDB + Nova</span>
    </div>
  );
}

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
  const [questions, setQuestions] = useState<APIQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('magicCertToken') || '');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Start quiz handler - Fetch questions from API
  const handleStartQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const fetchedQuestions = await fetchQuestions('SAA-C03', selectedDomain, questionCount);
      
      if (fetchedQuestions.length === 0) {
        setError('No questions available from the API. Please check the backend.');
        setLoading(false);
        return;
      }
      
      setQuestions(fetchedQuestions);
      setMode('quiz');
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setAiExplanation('');
      setAiError('');
      setScore(0);
      setQuizComplete(false);
    } catch (err) {
      setError('Failed to load questions from API. Please try again.');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
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
    
    // API format uses correctAnswer (string or array)
    const correctAnswer = currentQuestion.correctAnswer;
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    
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
      setAiExplanation('');
      setAiError('');
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
    setAiExplanation('');
    setAiError('');
  };

  const handleAiExplanation = async () => {
    if (!authToken) {
      setAiError('Sign in to use Amazon Nova explanations.');
      return;
    }

    const correctAnswer = currentQuestion.correctAnswer;
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

    setAiLoading(true);
    setAiError('');

    const result = await explainAnswerWithAi(
      authToken,
      {
        question: currentQuestion,
        selectedAnswers,
        correctAnswers,
        explanation: currentQuestion.explanation
      }
    );

    if (result.success && result.explanation) {
      setAiExplanation(result.explanation);
    } else {
      setAiError(result.message || result.error || 'AI explanation is not available.');
    }

    setAiLoading(false);
  };

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    const result = authMode === 'login'
      ? await login(authEmail, authPassword)
      : await register(authEmail, authPassword, authName);

    if (result.success && result.token) {
      localStorage.setItem('magicCertToken', result.token);
      setAuthToken(result.token);
      setAuthMessage(`Signed in as ${result.user?.name || result.user?.email || authEmail}`);
      setAuthPassword('');
    } else {
      setAuthMessage(result.error || 'Authentication failed.');
    }

    setAuthLoading(false);
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

    // Count questions for preview (mock values for welcome screen)
    const basicCount = 265;
    const extendedCount = 532;
    const selectedCount = questionCount;

    return (
      <div className="app">
        <div className="container">
          <VersionBadge />
          <div className="welcome-screen">
            <div className="welcome-header">
              <h1>🪄 Magic Cert</h1>
              <p className="welcome-subtitle">AWS Solutions Architect Associate (SAA-C03)</p>
              <p className="welcome-description">
                Practice with real-world scenarios and detailed explanations
              </p>
            </div>

            <div className="auth-panel">
              {authToken ? (
                <div className="auth-signed-in">
                  <span>{authMessage || 'Signed in. Amazon Nova explanations are enabled.'}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      localStorage.removeItem('magicCertToken');
                      setAuthToken('');
                      setAuthMessage('');
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="auth-form">
                  <div className="auth-heading">
                    <h2>{authMode === 'login' ? 'Sign in for AI explanations' : 'Create an account'}</h2>
                    <button
                      type="button"
                      className="auth-switch"
                      onClick={() => {
                        setAuthMode(authMode === 'login' ? 'register' : 'login');
                        setAuthMessage('');
                      }}
                    >
                      {authMode === 'login' ? 'Create account' : 'Already registered? Sign in'}
                    </button>
                  </div>
                  {authMode === 'register' && (
                    <input
                      type="text"
                      placeholder="Name"
                      value={authName}
                      onChange={(event) => setAuthName(event.target.value)}
                      required
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    minLength={8}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Working...' : authMode === 'login' ? 'Sign in' : 'Register'}
                  </button>
                  {authMessage && <p className="auth-message">{authMessage}</p>}
                </form>
              )}
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
                              <span className="domain-questions">Mock questions</span>
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
                  disabled={selectedCount === 0 || loading}
                >
                  {loading ? 'Loading questions...' : 'Start Quiz →'}
                </button>
                {error && <div className="error-message" style={{color: 'red', marginTop: '1rem'}}>{error}</div>}
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
          <VersionBadge />
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
        <VersionBadge />
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
            <span className="badge badge-category">
              {currentQuestion.category}
            </span>
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>

          <div className="options">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswers.includes(option.id);
              const correctAnswer = currentQuestion.correctAnswer;
              const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
              const showCorrect = showExplanation && correctAnswers.includes(option.id);
              const showIncorrect = showExplanation && isSelected && !correctAnswers.includes(option.id);

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

          {showExplanation && currentQuestion.explanation && (
            <div className="explanation">
              <div className="explanation-heading">
                <h3>Explanation</h3>
                {authToken ? (
                  <button
                    onClick={handleAiExplanation}
                    className="btn btn-secondary ai-explain-btn"
                    disabled={aiLoading}
                    title="Ask Amazon Nova for an AI explanation"
                  >
                    <span className="ai-icon" aria-hidden="true">🤖</span>
                    {aiLoading ? 'Asking Nova...' : 'Explain with Amazon Nova'}
                  </button>
                ) : (
                  <p className="ai-login-required">Sign in to use Amazon Nova.</p>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
              {aiExplanation && (
                <div className="ai-explanation">
                  <h3>Amazon Nova explanation</h3>
                  <p>{aiExplanation}</p>
                </div>
              )}
              {aiError && <p className="ai-error">{aiError}</p>}
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
