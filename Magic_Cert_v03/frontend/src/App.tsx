import { useEffect, useState } from 'react';
import {
  explainAnswerWithAi,
  fetchQuestions,
  getProgress,
  getStatistics,
  login,
  register,
  saveProgress,
  Question as APIQuestion
} from './services/api';

type QuizMode = 'welcome' | 'quiz' | 'complete';
type Dataset = 'basic' | 'extended';

function VersionBadge() {
  return (
    <div className="version-badge" aria-label="Application version">
      <span className="version-badge-main">v03</span>
      <span className="version-badge-detail">Serverless + GitHub Actions + OIDC + Bedrock</span>
      <span className="version-badge-stack">S3 + API Gateway + Lambda + DynamoDB + Nova</span>
    </div>
  );
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return <span key={index}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: JSX.Element[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`paragraph-${blocks.length}`}>{renderInlineMarkdown(paragraph.join(' '))}</p>);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`list-${blocks.length}`}>
          {list.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);

    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const Heading = heading[1].length === 2 ? 'h4' : 'h5';
      blocks.push(<Heading key={`heading-${index}`}>{renderInlineMarkdown(heading[2])}</Heading>);
    } else if (trimmed === '---') {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`rule-${index}`} />);
    } else if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  });

  flushParagraph();
  flushList();

  return <div className="markdown-content">{blocks}</div>;
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
  const [authUser, setAuthUser] = useState<any>(() => {
    const stored = localStorage.getItem('magicCertUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [showProgress, setShowProgress] = useState(false);
  const [progressStats, setProgressStats] = useState<any>(null);
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<any[]>([]);
  const [quizStartedAt, setQuizStartedAt] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  const currentQuestion = questions[currentQuestionIndex];

  const getCorrectAnswers = (question: APIQuestion) => {
    const answer = question as APIQuestion & { correctAnswers?: string[] };
    if (Array.isArray(answer.correctAnswers)) return answer.correctAnswers;
    return Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
  };

  useEffect(() => {
    if (!authToken) return;
    getStatistics(authToken).then((response) => {
      if (response.success) setProgressStats(response);
    });
  }, [authToken]);

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
      setAnswerHistory([]);
      setQuizStartedAt(new Date().toISOString());
      setProgressMessage('');
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
    const correctAnswers = getCorrectAnswers(currentQuestion);
    
    const isCorrect = 
      correctAnswers.length === selectedAnswers.length &&
      correctAnswers.every(id => selectedAnswers.includes(id));
    
    if (isCorrect) {
      setScore(score + 1);
    }
    setAnswerHistory((previous) => [...previous, {
      questionId: (currentQuestion as APIQuestion & { questionId?: string }).questionId || currentQuestion.id,
      selectedAnswers,
      correctAnswers,
      isCorrect
    }]);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setAiExplanation('');
      setAiError('');
    } else {
      if (authToken) {
        const saved = await saveProgress(authToken, {
          certification: 'SAA-C03',
          dataset,
          domain: selectedDomain,
          totalQuestions: questions.length,
          correctAnswers: answerHistory.filter((answer) => answer.isCorrect).length,
          score: Math.round((score / questions.length) * 100),
          answers: answerHistory,
          startedAt: quizStartedAt,
          durationSeconds: Math.max(0, Math.round((Date.now() - new Date(quizStartedAt).getTime()) / 1000))
        });
        setProgressMessage(saved ? 'Progress saved to your account.' : 'Could not save progress.');
        if (saved) {
          const updatedStats = await getStatistics(authToken);
          if (updatedStats.success) setProgressStats(updatedStats);
        }
      }
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

    const correctAnswers = getCorrectAnswers(currentQuestion);

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
      if (result.user) localStorage.setItem('magicCertUser', JSON.stringify(result.user));
      setAuthToken(result.token);
      setAuthUser(result.user || null);
      setAuthMessage(`Signed in as ${result.user?.name || result.user?.email || authEmail}`);
      setAuthPassword('');
    } else {
      setAuthMessage(result.error || 'Authentication failed.');
    }

    setAuthLoading(false);
  };

  const handleShowProgress = async () => {
    setProgressLoading(true);
    const response = await getProgress(authToken);
    if (response.success) setProgressHistory(response.history || []);
    setProgressLoading(false);
    setShowProgress(true);
  };

  if (showProgress && authToken) {
    return (
      <div className="app">
        <div className="container">
          <VersionBadge />
          <div className="progress-page">
            <div className="progress-page-header">
              <div>
                <span className="auth-kicker">Account dashboard</span>
                <h1>{authUser?.name || 'Student'}'s progress</h1>
                <p>{authUser?.email}</p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setShowProgress(false)}>Back to quiz</button>
            </div>
            {progressLoading ? <p>Loading progress...</p> : (
              <>
                <div className="progress-stats-grid">
                  <div className="progress-stat"><strong>{progressStats?.totalAttempts || 0}</strong><span>Tests completed</span></div>
                  <div className="progress-stat"><strong>{progressStats?.averageScore || 0}%</strong><span>Average score</span></div>
                  <div className="progress-stat"><strong>{progressStats?.bestScore || 0}%</strong><span>Best score</span></div>
                  <div className="progress-stat"><strong>{progressStats?.totalQuestions || 0}</strong><span>Questions answered</span></div>
                </div>
                <h2>Test history</h2>
                {progressHistory.length === 0 ? <p>No completed tests yet.</p> : (
                  <div className="progress-history">
                    {progressHistory.map((attempt) => (
                      <div className="progress-attempt" key={attempt.attemptId || attempt.SK}>
                        <div>
                          <strong>{attempt.certification || 'SAA-C03'} · {attempt.domain || 'all'}</strong>
                          <span>{new Date(attempt.completedAt || attempt.SK?.replace('ATTEMPT#', '')).toLocaleString()}</span>
                        </div>
                        <strong>{attempt.score || 0}%</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                  <div className="auth-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleShowProgress}>View progress</button>
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      localStorage.removeItem('magicCertToken');
                      localStorage.removeItem('magicCertUser');
                      setAuthToken('');
                      setAuthUser(null);
                      setAuthMessage('');
                    }}>Sign out</button>
                  </div>
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
              {progressMessage && <p className="progress-message">{progressMessage}</p>}
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
              const correctAnswers = getCorrectAnswers(currentQuestion);
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
                  <MarkdownContent content={aiExplanation} />
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
