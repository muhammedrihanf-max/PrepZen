import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { subscribeToGlobalLeaderboard } from '../services/analytics';
import { useAuth } from '../context/AuthContext';
import '../styles/Leaderboard.css';

interface RankingStudent {
  id: string;
  name: string;
  score: number;
  rank: number;
  seed: string;
  trend: 'up' | 'down';
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboardTab, setLeaderboardTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [rankingData, setRankingData] = useState<RankingStudent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalLeaderboard((data) => {
      setRankingData(data);
    });
    return () => unsubscribe();
  }, [leaderboardTab]);

  const userRank = rankingData.find(r => r.id === user?.uid);

  return (
    <div className="leaderboard-container">
      <div className="section-header-top">
        <div className="leaderboard-tabs glass-card">
          <button className={leaderboardTab === 'daily' ? 'active' : ''} onClick={() => setLeaderboardTab('daily')}>Daily</button>
          <button className={leaderboardTab === 'weekly' ? 'active' : ''} onClick={() => setLeaderboardTab('weekly')}>Weekly</button>
          <button className={leaderboardTab === 'monthly' ? 'active' : ''} onClick={() => setLeaderboardTab('monthly')}>Monthly</button>
        </div>
      </div>
      
      {rankingData.length > 0 ? (
        <>
          <div className="podium-section">
            <div className="podium-card rank-2">
              <div className="podium-avatar-wrapper">
                <img src={`https://api.dicebear.com/7.x/avataaars/png?seed=${rankingData[1]?.seed || '2'}`} alt={rankingData[1]?.name} className="podium-avatar" />
                <span className="rank-badge">2</span>
              </div>
              <strong className="podium-name">{rankingData[1]?.name || '---'}</strong>
              <span className="podium-score">{rankingData[1]?.score?.toLocaleString() || 0} pts</span>
            </div>
            
            <div className="podium-card rank-1">
              <motion.div 
                className="king-crown"
                animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Crown size={32} />
              </motion.div>
              <div className="podium-avatar-wrapper">
                <img src={`https://api.dicebear.com/7.x/avataaars/png?seed=${rankingData[0]?.seed || '1'}`} alt={rankingData[0]?.name} className="podium-avatar" />
                <span className="rank-badge">1</span>
              </div>
              <strong className="podium-name">{rankingData[0]?.name || '---'}</strong>
              <span className="podium-score">{rankingData[0]?.score?.toLocaleString() || 0} pts</span>
            </div>
            
            <div className="podium-card rank-3">
              <div className="podium-avatar-wrapper">
                <img src={`https://api.dicebear.com/7.x/avataaars/png?seed=${rankingData[2]?.seed || '3'}`} alt={rankingData[2]?.name} className="podium-avatar" />
                <span className="rank-badge">3</span>
              </div>
              <strong className="podium-name">{rankingData[2]?.name || '---'}</strong>
              <span className="podium-score">{rankingData[2]?.score?.toLocaleString() || 0} pts</span>
            </div>
          </div>

          <div className="current-user-rank premium-card purple-glow">
            <div className="rank-info">
              <span className="rank-label">Your Current Rank</span>
              <span className="rank-number">{userRank ? `#${userRank.rank}` : 'Unranked'}</span>
            </div>
            <div className={`rank-trend ${userRank?.trend || 'positive'}`}>
              <TrendingUp size={20} />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-leaderboard glass-card">
          <div className="empty-icon"><Trophy size={48} /></div>
          <h3>No Rankings Yet</h3>
          <p>Be the first to complete an exam and claim the top spot!</p>
        </div>
      )}

      <div className="rankings-list">
        <AnimatePresence mode="popLayout">
          {rankingData.filter(r => r.rank > 3).map((student, i) => (
            <motion.div 
              key={student.id} 
              className="rank-card glass-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              <div className="rank-card-left">
                <img src={`https://api.dicebear.com/7.x/avataaars/png?seed=${student.seed}`} alt={student.name} className="rank-card-avatar" />
                <span className="rank-card-name">{student.name}</span>
              </div>
              <div className="rank-card-right">
                <span className="score-cell">{student.score} pts</span>
                <div className={`rank-card-trend ${student.trend}`}>
                  {student.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <span className="rank-card-rank">#{student.rank}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Leaderboard;
