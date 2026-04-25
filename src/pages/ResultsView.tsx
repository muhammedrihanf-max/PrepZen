import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RefreshCw, BarChart } from 'lucide-react';
import '../styles/ResultsView.css';

const ResultsView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, total, correct } = location.state || { score: 0, total: 0, correct: 0 };
  
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="results-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="results-card premium-card"
      >
        <div className="trophy-container">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy size={80} color="#f59e0b" />
          </motion.div>
        </div>

        <h1>Exam Completed!</h1>
        <p className="results-subtitle">Great effort! Here's how you performed.</p>

        <div className="score-main">
          <span className="score-value">{score}</span>
          <span className="score-label">Total Points</span>
        </div>

        <motion.div 
          className="stats-breakdown"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.4 }
            }
          }}
        >
          <motion.div className="stat-item" variants={{ hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}>
            <span className="stat-val">{correct}</span>
            <span className="stat-lab">Correct Answers</span>
          </motion.div>
          <motion.div className="stat-item" variants={{ hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}>
            <span className="stat-val">{percentage}%</span>
            <span className="stat-lab">Accuracy</span>
          </motion.div>
        </motion.div>

        <motion.div 
          className="results-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            <BarChart size={20} /> View Leaderboard
          </button>
          <button className="btn-glass" onClick={() => navigate('/dashboard')}>
            <RefreshCw size={20} /> Retry Exam
          </button>
        </motion.div>

        <button className="btn-icon-glass back-home-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
          <ArrowLeft size={16} />
        </button>
      </motion.div>
    </div>
  );
};

export default ResultsView;
