import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, ArrowRight, ArrowLeft, CheckCircle2, XCircle, GraduationCap } from 'lucide-react';
import MathText from '../components/MathText';
import { getQuestionsByYear } from '../services/exams';
import { saveExamResult } from '../services/analytics';
import { useAuth } from '../context/AuthContext';
import '../styles/ExamView.css';

interface Question {
  id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  imageUrl?: string;
  points: number;
}

const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'What is the capital of France?',
    options: ['Berlin', 'Madrid', 'Paris', 'Lisbon'],
    correctAnswer: 2,
    explanation: 'Paris is the capital and most populous city of France.',
    points: 5
  },
  {
    id: '2',
    text: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    correctAnswer: 1,
    explanation: 'Mars is often referred to as the Red Planet due to its reddish appearance.',
    points: 5
  }
];

interface ExamViewProps {
  previewQuestions?: Question[];
  previewYear?: string;
  onExitPreview?: () => void;
}

const ExamView: React.FC<ExamViewProps> = ({ previewQuestions, previewYear, onExitPreview }) => {
  const { year: paramYear } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const finishExamHandledRef = useRef(false);
  
  // Existing States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(previewQuestions || []);
  const [loading, setLoading] = useState(!previewQuestions);
  
  // New Exam Logic States
  const [timeLeft, setTimeLeft] = useState(7200); // 120 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [lastBreakTime, setLastBreakTime] = useState(7200); // Track timeLeft at last break
  const [showBreakButton, setShowBreakButton] = useState(false);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(10);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  const isPreview = !!previewQuestions;
  const year = previewYear || paramYear;

  useEffect(() => {
    if (isPreview) return;
    
    const fetchQuestions = async () => {
      if (!year) return;
      setLoading(true);
      try {
        const data = await getQuestionsByYear(year);
        // Fallback to mock if database is empty for specific IDs
        setQuestions(data.length > 0 ? data : mockQuestions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setQuestions(mockQuestions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [year, isPreview]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Final Scoring Logic
  const performActualSubmission = useCallback(() => {
    if (finishExamHandledRef.current) return;
    finishExamHandledRef.current = true;

    const score = Object.entries(selectedAnswers).reduce((acc, [idx, ans]) => {
      const qIdxNum = parseInt(idx);
      return acc + (ans === questions[qIdxNum].correctAnswer ? questions[qIdxNum].points : 0);
    }, 0);
    
    // Persist result to Firestore
    if (user && !isPreview) {
      saveExamResult(user.uid, (year || 'N/A') + " Mock Exam", score).catch(err => {
        console.error("Failed to save result:", err);
      });
    }
    
    navigate('/results', { 
      state: { 
        score, 
        total: questions.length * 5, 
        correct: Object.values(selectedAnswers).filter((ans, i) => {
          return ans === questions[i].correctAnswer;
        }).length 
      } 
    });
  }, [questions, selectedAnswers, navigate, user, isPreview, year]);

  // Manual & Automatic Finish Wrapper with Ad Interflow
  const handleFinishExam = () => {
    if (isPreview) {
      onExitPreview?.();
      return;
    }
    
    setIsFinishing(true);
    setShowAdOverlay(true);
    setAdTimeLeft(10);
    setIsPaused(true);
    setShowTimeUpModal(false);
    setShowBreakButton(false);
  };

  // Main Timer loop
  useEffect(() => {
    if (isPreview || isPaused || showAdOverlay || showTimeUpModal || isFinishing) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev > 0 ? prev - 1 : 0;
        
        if (nextTime === 0 && !isPreview) {
          setShowTimeUpModal(true);
          setIsPaused(true);
        }

        // Check for 15-minute intervals (900 seconds)
        const timeElapsedSinceLastBreak = lastBreakTime - nextTime;
        if (timeElapsedSinceLastBreak >= 900 && !showBreakButton && nextTime > 0) {
          setShowBreakButton(true);
        }
        
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPreview, isPaused, showAdOverlay, showTimeUpModal, isFinishing, lastBreakTime, showBreakButton]);

  // Ad Timer logic with auto-redirect for terminal phase
  useEffect(() => {
    let adInterval: ReturnType<typeof setInterval>;
    if (showAdOverlay && adTimeLeft > 0) {
      adInterval = setInterval(() => {
        setAdTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (showAdOverlay && adTimeLeft === 0 && isFinishing) {
      performActualSubmission();
    }
    return () => clearInterval(adInterval);
  }, [showAdOverlay, adTimeLeft, isFinishing, performActualSubmission]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isPaused || showAdOverlay || showTimeUpModal || isFinishing) return;
    if (selectedAnswers[currentQuestionIndex] !== undefined) return;
    
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex
    });

    if (optionIndex !== currentQuestion.correctAnswer) {
      setShowExplanation(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinishExam();
    } else {
      setShowExplanation(false);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const getOptionClass = (index: number) => {
    const selected = selectedAnswers[currentQuestionIndex];
    if (selected === undefined) return '';
    
    if (index === currentQuestion.correctAnswer) return 'correct';
    if (selected === index && index !== currentQuestion.correctAnswer) return 'wrong';
    return 'disabled';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large" />
        <h2>Gathering Question Bank...</h2>
        <p>Optimizing your practice session</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-container">
        <header className="exam-header glass-card">
          <div className="exam-info">No questions available for this exam.</div>
          {isPreview && <button onClick={onExitPreview} className="btn-outline">Exit Preview</button>}
        </header>
      </div>
    );
  }

  return (
    <div className={`exam-view-container ${isPreview ? 'preview-mode' : ''} ${(showTimeUpModal || isFinishing) ? 'locked' : ''}`}>
      <header className="exam-view-header glass-card">
        <div className="exam-view-info" onClick={() => !isPreview && navigate('/dashboard')}>
          <GraduationCap size={24} color="#6366f1" />
          <span>{year} Mock Exam {isPreview && '(Preview)'}</span>
        </div>
        <div className="exam-view-progress">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        {!isPreview && (
          <div className="exam-view-timer">
            <Timer size={20} className={timeLeft < 300 ? 'pulse text-error' : ''} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
        {isPreview ? (
          <button onClick={onExitPreview} className="icon-btn" title="Close Preview">
            <XCircle size={24} />
          </button>
        ) : (
          <button 
            className="btn-end-exam" 
            onClick={() => {
              if (window.confirm('Are you sure you want to end the exam? Your progress will be submitted.')) {
                handleFinishExam();
              }
            }}
          >
            End Exam
          </button>
        )}
      </header>

      <main className="exam-view-main">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="question-card premium-card"
          >
            <div className="exam-question-heading">
              <MathText text={currentQuestion.text} />
            </div>
            <motion.div 
              className="options-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  className={`option-btn ${getOptionClass(index)}`}
                  onClick={() => handleSelectOption(index)}
                  disabled={selectedAnswers[currentQuestionIndex] !== undefined || isPaused || showTimeUpModal || isFinishing}
                  variants={{
                    hidden: { x: -20, opacity: 0 },
                    visible: { x: 0, opacity: 1 }
                  }}
                >
                  <span className="option-label">{String.fromCharCode(65 + index)}</span>
                  <MathText text={option} className="option-text" />
                  {selectedAnswers[currentQuestionIndex] !== undefined && index === currentQuestion.correctAnswer && <CheckCircle2 className="status-icon" size={20} />}
                  {selectedAnswers[currentQuestionIndex] === index && index !== currentQuestion.correctAnswer && <XCircle className="status-icon" size={20} />}
                </motion.button>
              ))}
            </motion.div>

            {selectedAnswers[currentQuestionIndex] !== undefined && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="feedback-section"
              >
                {selectedAnswers[currentQuestionIndex] !== currentQuestion.correctAnswer && !showExplanation ? (
                  <button className="btn-glass-primary" onClick={() => setShowExplanation(true)}>
                    Check Explanation
                  </button>
                ) : (
                  <div className="explanation-box glass-card">
                    <h4>Explanation</h4>
                    {currentQuestion.imageUrl && (
                      <div className="explanation-image">
                        <img src={currentQuestion.imageUrl} alt="Explanation visualization" />
                      </div>
                    )}
                    <div className="explanation-content">
                      <MathText text={currentQuestion.explanation} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="exam-view-actions">
           <button 
             className="btn-glass" 
             onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
             disabled={currentQuestionIndex === 0 || isPaused || showTimeUpModal || isFinishing}
           >
             <ArrowLeft size={20} /> Previous
           </button>
          <button 
            className="btn-primary" 
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestionIndex] === undefined || isPaused || showTimeUpModal || isFinishing}
          >
            {isLastQuestion ? (isPreview ? 'Done' : 'Finish Exam') : 'Next Question'} <ArrowRight size={20} />
          </button>
        </div>
      </main>

      <AnimatePresence>
        {showBreakButton && !showAdOverlay && !showTimeUpModal && !isFinishing && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="break-trigger-container"
          >
            <div className="break-toast glass-card">
              <div className="break-toast-content">
                <Timer className="pulse" size={20} color="#f59e0b" />
                <div>
                  <h4>Time for a short break?</h4>
                  <p>15 minutes have passed since your last break.</p>
                </div>
              </div>
              <button 
                className="btn-primary break-action-btn" 
                onClick={() => {
                  setShowAdOverlay(true);
                  setAdTimeLeft(10);
                  setIsPaused(true);
                  setShowBreakButton(false);
                  setLastBreakTime(timeLeft);
                }}
              >
                Take Break
              </button>
            </div>
          </motion.div>
        )}

        {showAdOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ad-overlay"
          >
            <div className="ad-content glass-card">
              <div className="ad-badge">SPONSORED AD</div>
              <div className="ad-placeholder">
                <div className="ad-visual pulse">
                  <GraduationCap size={64} color="#6366f1" />
                  <h2 className="ad-title">
                    {isFinishing ? "Finalizing Your Results" : "PrepZen Premium"}
                  </h2>
                  <p className="ad-description">
                    {isFinishing 
                      ? "Great job! Please wait a few seconds while we calculate your performance." 
                      : "Unlock detailed analytics and personalized study plans for faster results."}
                  </p>
                </div>
              </div>
              <div className="ad-footer">
                {adTimeLeft > 0 ? (
                  <span className="ad-timer">
                    {isFinishing ? "Calculating results in" : "Resume exam in"} {adTimeLeft}s...
                  </span>
                ) : (
                  !isFinishing && (
                    <button 
                      className="btn-primary pulse" 
                      onClick={() => {
                        setShowAdOverlay(false);
                        setIsPaused(false);
                      }}
                    >
                      Resume Exam
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showTimeUpModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ad-overlay time-up-overlay"
          >
            <div className="ad-content glass-card border-error">
              <div className="time-up-visual animate-bounce">
                <Timer size={64} color="#ef4444" />
              </div>
              <h2 className="time-up-title text-error">Time's Up!</h2>
              <p className="time-up-description">
                Your exam time has expired. Please submit your answers to see your results.
              </p>
              <button 
                className="btn-primary btn-submit-timeup" 
                onClick={handleFinishExam}
              >
                Submit and View Results
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamView;
