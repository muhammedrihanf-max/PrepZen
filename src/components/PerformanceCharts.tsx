import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Area,
  AreaChart
} from 'recharts';
import { Target, Award, Brain, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/PerformanceCharts.css';

interface ScoreHistory {
  date: string;
  score: number;
}

interface TopicPerformance {
  subject: string;
  score: number;
  fullMark: number;
}

interface PerformanceChartsProps {
  history: ScoreHistory[];
  topics: TopicPerformance[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ history, topics }) => {
  const avgAccuracy = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) 
    : 0;

  const getMasteryLevel = (accuracy: number) => {
    if (accuracy >= 90) return 'Grandmaster';
    if (accuracy >= 80) return 'Expert';
    if (accuracy >= 60) return 'Intermediate';
    if (accuracy >= 40) return 'Novice';
    return 'Beginner';
  };

  const getTrend = () => {
    if (history.length < 2) return 'Keep practicing!';
    const last = history[history.length - 1].score;
    const prev = history[history.length - 2].score;
    const diff = last - prev;
    return diff >= 0 ? `+${diff}% from last session` : `${diff}% from last session`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="performance-charts-container"
    >
      {/* Premium Stat Cards - FORCED ROW */}
      <div className="stats-grid-premium">
        {[
          { 
            icon: Activity, 
            label: 'Avg. Accuracy', 
            value: `${avgAccuracy}%`, 
            trend: getTrend(), 
            color1: '#3b82f6', color2: '#4f46e5',
            shadow: 'rgba(59, 130, 246, 0.15)'
          },
          { 
            icon: Target, 
            label: 'Total Attempts', 
            value: history.length.toString(), 
            trend: `Target: ${Math.max(10, history.length + 5)}/month`, 
            color1: '#a855f7', color2: '#db2777',
            shadow: 'rgba(168, 85, 247, 0.15)'
          },
          { 
            icon: Award, 
            label: 'Global Rank', 
            value: history.length > 0 ? `#${Math.max(1, 100 - history.length)}` : 'N/A', 
            trend: 'Top Student!', 
            color1: '#f59e0b', color2: '#d97706',
            shadow: 'rgba(245, 158, 11, 0.15)'
          },
          { 
            icon: Brain, 
            label: 'Mastery Level', 
            value: getMasteryLevel(avgAccuracy), 
            trend: 'Fastest Learner', 
            color1: '#10b981', color2: '#0d9488',
            shadow: 'rgba(16, 185, 129, 0.15)'
          },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -3, scale: 1.01 }}
            className="stat-card-premium"
          >
            <div 
              className="stat-icon-container"
              style={{ background: `linear-gradient(135deg, ${stat.color1}, ${stat.color2})` }}
            >
              <stat.icon size={20} />
            </div>
            
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <h3 className="stat-value">{stat.value}</h3>
              <div className="stat-trend-badge">
                <Zap size={8} fill="currentColor" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="charts-grid-adaptive">
        {/* Animated Line Chart */}
        <motion.div 
          variants={itemVariants}
          className="chart-card-premium"
        >
          <div className="chart-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="chart-tooltip-custom">
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{payload[0].payload.date}</p>
                          <p style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorScore)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Animated Radar Chart */}
        <motion.div 
          variants={itemVariants}
          className="chart-card-premium"
        >
          <div className="chart-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topics}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fill="#a855f7"
                  fillOpacity={0.3}
                  animationDuration={2500}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="chart-tooltip-custom">
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>{payload[0].payload.subject}</p>
                          <p style={{ fontSize: '24px', fontWeight: 900, color: '#a855f7', margin: 0 }}>{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
