import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { subscribeToGlobalLeaderboard } from '../services/analytics';
import { useAuth } from '../context/AuthContext';

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

      <style>{`
        .leaderboard-tabs {
          display: flex;
          padding: 4px;
          gap: 4px;
        }

        .leaderboard-tabs button {
          padding: 8px 16px;
          border: none;
          background: none;
          color: var(--text-tertiary);
          font-weight: 600;
          font-size: 0.8125rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .leaderboard-tabs button:hover { color: var(--text-current); }

        .leaderboard-tabs button.active {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .podium-section {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
          padding-top: 40px;
        }

        .podium-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          position: relative;
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .podium-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .podium-avatar-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .rank-1 .podium-avatar-wrapper { width: 100px; height: 100px; }

        .podium-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
        }

        .rank-1 .podium-avatar { border-color: #f59e0b; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4); }
        .rank-2 .podium-avatar { border-color: var(--text-secondary); }
        .rank-3 .podium-avatar { border-color: #d97706; }

        .rank-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          background: var(--surface-current);
          border: 2px solid var(--border-current);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.75rem;
        }

        .rank-1 .rank-badge { background: #f59e0b; color: white; border-color: #f59e0b; }

        .podium-name { font-size: 1rem; font-weight: 700; }
        .podium-score { font-size: 0.875rem; color: var(--text-tertiary); font-weight: 600; }

        .king-crown {
          position: absolute;
          top: -40px;
          color: #f59e0b;
          z-index: 5;
        }

        .current-user-rank {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .purple-glow { border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.05); }

        .rank-info { display: flex; flex-direction: column; }
        .rank-label { font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .rank-number { font-size: 1.5rem; font-weight: 800; color: #8b5cf6; }

        .rank-trend {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-trend.positive { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .rankings-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

        .rank-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px var(--spacing-lg);
          transition: transform 0.2s;
        }

        .rank-card:hover { transform: translateX(8px); border-color: rgba(99, 102, 241, 0.3); }

        .rank-card-left { display: flex; align-items: center; gap: var(--spacing-md); }
        .rank-card-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--surface-current); }
        .rank-card-name { font-weight: 700; }

        .rank-card-right { display: flex; align-items: center; gap: var(--spacing-xl); }
        .score-cell { font-weight: 700; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
        .rank-card-rank { font-weight: 800; font-size: 1rem; width: 40px; text-align: right; }

        .rank-card-trend.up { color: #10b981; }
        .rank-card-trend.down { color: #ef4444; }

        .empty-leaderboard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px var(--spacing-xl);
          text-align: center;
          gap: var(--spacing-lg);
          margin: var(--spacing-xl) 0;
          min-height: 300px;
        }

        .empty-icon {
          width: 84px;
          height: 84px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          margin-bottom: 8px;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.05);
        }

        .empty-leaderboard h3 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-leaderboard p {
          color: var(--text-secondary);
          margin: 0;
          max-width: 450px;
          line-height: 1.6;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
