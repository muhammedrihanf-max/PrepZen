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
      style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
    >
      {/* Premium Stat Cards - FORCED ROW */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        width: '100%'
      }}>
        {[
          { 
            icon: Activity, 
            label: 'Avg. Accuracy', 
            value: '82%', 
            trend: '+5.2% from last week', 
            color1: '#3b82f6', color2: '#4f46e5',
            shadow: 'rgba(59, 130, 246, 0.15)'
          },
          { 
            icon: Target, 
            label: 'Total Attempts', 
            value: history.length.toString(), 
            trend: 'Target: 50/month', 
            color1: '#a855f7', color2: '#db2777',
            shadow: 'rgba(168, 85, 247, 0.15)'
          },
          { 
            icon: Award, 
            label: 'Global Rank', 
            value: '#12', 
            trend: 'Top 5% Student', 
            color1: '#f59e0b', color2: '#d97706',
            shadow: 'rgba(245, 158, 11, 0.15)'
          },
          { 
            icon: Brain, 
            label: 'Mastery Level', 
            value: 'Expert', 
            trend: 'Fastest Learner', 
            color1: '#10b981', color2: '#0d9488',
            shadow: 'rgba(16, 185, 129, 0.15)'
          },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -3, scale: 1.01 }}
            style={{
              padding: '16px 20px',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #f1f5f9',
              boxShadow: `0 10px 15px -3px ${stat.shadow}`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: `linear-gradient(135deg, ${stat.color1}, ${stat.color2})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}>
              <stat.icon size={20} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', margin: 0, lineHeight: 1 }}>{stat.value}</h3>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                color: '#10b981', 
                fontSize: '9px', 
                fontWeight: 800, 
                backgroundColor: '#f0fdf4',
                padding: '2px 8px',
                borderRadius: '99px',
                width: 'fit-content',
                marginTop: '2px'
              }}>
                <Zap size={8} fill="currentColor" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', // FORCED ROW FOR CHARTS IF SPACE
        gap: '32px' 
      }}>
        {/* Animated Line Chart */}
        <motion.div 
          variants={itemVariants}
          style={{
            background: '#ffffff',
            border: '1px solid #f1f5f9',
            padding: '40px',
            borderRadius: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-secondary)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>{payload[0].payload.date}</p>
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
          style={{
            background: '#ffffff',
            border: '1px solid #f1f5f9',
            padding: '40px',
            borderRadius: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topics}>
                <PolarGrid stroke="rgba(0,0,0,0.05)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 13, fontWeight: 700 }} 
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
                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>{payload[0].payload.subject}</p>
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
