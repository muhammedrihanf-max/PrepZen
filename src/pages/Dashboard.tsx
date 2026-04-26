import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { LogOut, GraduationCap, Clock, Trophy, Settings, HelpCircle, Send, CheckCircle, Image, X, Bell, Eye, Users, Megaphone, ShieldCheck, User, Phone, Mail, TrendingUp, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSettings from '../components/ProfileSettings';
import Leaderboard from '../components/Leaderboard';
import StudentForum from '../components/StudentForum';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { getStudentPerformance } from '../services/analytics';
import { uploadFile } from '../services/storage';
import { getAllExams, type ExamMetadata } from '../services/exams';
import { getAllTeachers, type UserProfile } from '../services/users';
import AdaptiveAdUnit from '../components/AdaptiveAdUnit';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout, notifications, addNotification, markInquiryAsReadByStudent, clearAllNotifications, deleteNotification } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (showNotifications) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showNotifications]);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'leaderboard' | 'help' | 'forum' | 'analytics' | 'teacher'>('practice');
  const [question, setQuestion] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [performanceData, setPerformanceData] = useState<{ 
    history: { date: string; score: number }[]; 
    topics: { subject: string; score: number; fullMark: number }[]; 
  }>({ history: [], topics: [] });
  const [examsList, setExamsList] = useState<ExamMetadata[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [teachersList, setTeachersList] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user && (activeTab === 'analytics' || activeTab === 'practice')) {
      const fetchAnalytics = async () => {
        const data = await getStudentPerformance(user.uid);
        setPerformanceData(data);
      };
      fetchAnalytics();
    }
  }, [user, activeTab]);

  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      const data = await getAllExams();
      setExamsList(data);
      setLoadingExams(false);
    };
    fetchExams();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      const data = await getAllTeachers();
      setTeachersList(data);
    };
    fetchTeachers();
  }, []);

  const PLEASANT_QUOTES = [
    "You're doing great! Your questions help everyone learn.",
    "Brave enough to ask? You're brave enough to succeed!",
    "Every question is a step closer to mastery.",
    "Curiosity is the engine of achievement. Well done!",
    "A question asked today is a problem solved tomorrow.",
    "Great effort! Asking questions is the first step toward understanding.",
    "Your dedication to learning is inspiring. Keep it up!"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large. Please select a file smaller than 5MB.");
        return;
      }
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRaiseQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSent(true); 
    
    try {
      let finalAttachmentUrl = undefined;
      
      if (attachmentFile) {
        const path = `support_tickets/${user?.uid}_${Date.now()}`;
        finalAttachmentUrl = await uploadFile(path, attachmentFile);
      }

      addNotification({
        type: 'question',
        from: user?.displayName || user?.email || 'Student',
        message: question,
        attachment: finalAttachmentUrl
      });

      setQuestion('');
      setAttachment(null);
      setAttachmentFile(null);
      
      // Set random quote
      setCurrentQuote(PLEASANT_QUOTES[Math.floor(Math.random() * PLEASANT_QUOTES.length)]);
      setShowQuote(true);

      setTimeout(() => {
        setIsSent(false);
        setShowQuote(false);
      }, 5000);
    } catch {
      alert("Failed to send question. Please try again.");
      setIsSent(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="main-header">
        {/* Left: Logo Section */}
        <div className="logo-section" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <img src="/favicon.png" alt="PrepZen" />
          </div>
          <span className="logo-text">PrepZen</span>
        </div>
        
        {/* Right: User Controls */}
        <div className="user-controls">
          
          {/* User Profile */}
          <div className="user-profile" onClick={() => setShowProfile(true)}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user?.displayName || 'Student'} className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                {user?.displayName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{user?.displayName || 'Student'}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
          
          {/* Settings Button */}
          <button 
            className="icon-button" 
            onClick={() => setShowProfile(true)} 
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          
          {/* Notifications Button */}
          <button 
            className={`icon-button ${showNotifications ? 'active' : ''} ${notifications.filter(n => n.reply && !n.read_by_student).length > 0 ? 'has-notification' : ''}`} 
            onClick={() => setShowNotifications(!showNotifications)} 
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
          
          {/* Logout Button */}
          <button 
            className="icon-button" 
            onClick={logout} 
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
          
        </div>
      </header>

      <AnimatePresence>
        {showProfile && (
          <ProfileSettings onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      <main className="dashboard-content">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="content-header"
        >
          <h1>Welcome back, {user?.displayName || 'student'}!</h1>
          <p>Ready to practice for your exams?</p>
          
          <div className="dashboard-tabs-container">
            <div className="dashboard-tabs glass-card">
              <button 
                className={activeTab === 'practice' ? 'active' : ''} 
                onClick={() => setActiveTab('practice')}
                title="Practice Exams"
              >
                <GraduationCap size={18} />
                <span>Practice Exams</span>
              </button>
              <button 
                className={activeTab === 'leaderboard' ? 'active' : ''} 
                onClick={() => setActiveTab('leaderboard')}
                title="Leaderboard Status"
              >
                <Trophy size={18} />
                <span>Leaderboard</span>
              </button>
              <button 
                className={`tab-btn-relative ${activeTab === 'help' ? 'active' : ''}`} 
                onClick={() => setActiveTab('help')}
                title="Help & Support Help Center"
              >
                <HelpCircle size={18} />
                <span>Help & Support</span>
                {notifications.filter(n => n.reply && !n.read_by_student).length > 0 && (
                  <span className="tab-noti-badge" />
                )}
              </button>
              <button 
                className={activeTab === 'analytics' ? 'active' : ''} 
                onClick={() => setActiveTab('analytics')}
                title="Performance Insights"
              >
                <TrendingUp size={18} />
                <span>Insights</span>
              </button>
              <button 
                className={activeTab === 'forum' ? 'active' : ''} 
                onClick={() => setActiveTab('forum')}
                title="Student Forum"
              >
                <Users size={18} />
                <span>Student Forum</span>
              </button>
              <button 
                className={activeTab === 'teacher' ? 'active' : ''} 
                onClick={() => setActiveTab('teacher')}
                title="Teacher Information"
              >
                <User size={18} />
                <span>Teacher Info</span>
              </button>
            </div>
          </div>
          {Capacitor.isNativePlatform() && (
            <div className="dashboard-ads">
              <AdaptiveAdUnit adMobId="ca-app-pub-mobile-dashboard-banner" className="adsense-placeholder-banner" />
            </div>
          )}
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === 'practice' ? (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <section className="exam-years">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Select Exam Year
                </motion.h2>
                <div className="years-grid">
                  {loadingExams ? (
                    <div className="practice-loading" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner-mini" style={{ margin: '0 auto 1rem' }} />
                      <p>Syncing with Question Bank...</p>
                    </div>
                  ) : examsList.length > 0 ? (
                    examsList.map((exam) => (
                      <div key={exam.id} className="practice-card glass-card" onClick={() => navigate(`/exam/${exam.id}`)}>
                        <div className="card-bg-glow"></div>
                        <div className="practice-card-content">
                          <div className="year-badge">Mock Examination</div>
                          <h3>{exam.title}</h3>
                          <p>
                            <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#6366f1' }} />
                            {exam.questionCount} Professional Questions
                          </p>
                          <div className="card-footer">
                            <span>Start Practice</span>
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-exams-placeholder">
                      <p>No exams available at the moment.</p>
                      <small>Please check back later or contact your instructor.</small>
                    </div>
                  )}
                </div>
              </section>

            </motion.div>
          ) : activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard />
            </motion.div>
          ) : activeTab === 'help' ? (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="help-content"
            >
              <div className="support-card glass-card">
                <div className="support-header">
                  <HelpCircle size={32} color="#6366f1" />
                  <div>
                    <h2>Raise a Question</h2>
                    <p>Facing difficulties? Ask your teacher directly.</p>
                  </div>
                </div>

                <div className="contact-card">
                  <h4><ShieldCheck size={18} color="#6366f1" /> Technical Support & Author</h4>
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="icon"><User size={16} /></span>
                      <span>Muhammed Rihan</span>
                    </div>
                    <a href="tel:+971566202782" className="contact-item contact-link">
                      <span className="icon"><Phone size={14} /></span>
                      <span>+971566202782</span>
                    </a>
                    <a href="mailto:muhammedrihanf@gmail.com" className="contact-item contact-link">
                      <span className="icon"><Mail size={14} /></span>
                      <span>muhammedrihanf@gmail.com</span>
                    </a>
                  </div>
                  <p className="author-description">
                    <strong>Muhammed Rihan</strong> is the author and developer of PrepZen.
                  </p>
                </div>

                <form onSubmit={handleRaiseQuestion} className="question-form">
                  <div className="input-group">
                    <label>Your Question</label>
                    <textarea 
                      placeholder="Type your question here in detail..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="attachment-area">
                    <label className="file-upload-btn">
                      <Image size={18} />
                      <span>{attachment ? 'Photo Attached' : 'Attach a Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                    </label>
                    {attachment && (
                      <div className="attachment-preview-box">
                        <img src={attachment} alt="Preview" />
                        <button type="button" onClick={() => setAttachment(null)} className="remove-attach" title="Remove Attachment">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <motion.div className="form-actions" layout>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`btn-primary-glow submit-btn ${isSent ? 'success' : ''}`}
                      type="submit"
                      disabled={isSent}
                    >
                      {isSent ? <><CheckCircle size={20} /> Sent Successfully!</> : <><Send size={20} /> Send to Teacher</>}
                    </motion.button>
                  </motion.div>
                </form>

                <AnimatePresence>
                  {showQuote && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="quote-card-feedback"
                    >
                      <div className="quote-sparkles">✨</div>
                      <p className="quote-text">"{currentQuote}"</p>
                      <div className="quote-sparkles">✨</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="response-note-container">
                  <p className="response-note">Your teacher will be notified immediately and usually responds within 24 hours.</p>
                </div>
              </div>

              <div className="inquiry-history-section glass-card">
                <div className="history-header">
                  <Clock size={20} color="#6366f1" />
                  <h3>Inquiry History</h3>
                </div>

                <div className="history-list">
                  {notifications.filter(n => n.from === (user?.displayName || user?.email)).length === 0 ? (
                    <div className="empty-history">
                      <p>No past inquiries found.</p>
                    </div>
                  ) : (
                    notifications
                      .filter(n => n.from === (user?.displayName || user?.email))
                      .map(n => (
                        <div key={n.id} className="history-item">
                          <div className="history-item-top">
                            <span className="history-date">{new Date(n.timestamp).toLocaleDateString()}</span>
                            <span className={`history-status ${n.reply ? 'replied' : 'pending'}`}>
                              {n.reply ? 'Replied' : 'Pending'}
                            </span>
                          </div>
                          <p className="history-msg">{n.message}</p>
                          
                          {n.attachment && (
                            <div className="history-attachment">
                              <img src={n.attachment} alt="Attached" onClick={() => window.open(n.attachment, '_blank')} />
                            </div>
                          )}
                          
                          {n.reply && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="history-reply"
                            >
                              <div className="reply-meta">
                                <CheckCircle size={12} />
                                <span>{n.reply.author}</span>
                              </div>
                              <p>{n.reply.message}</p>
                              {n.reply.attachment && (
                                <div className="reply-attachment" onClick={() => window.open(n.reply!.attachment, '_blank')}>
                                  <img src={n.reply.attachment} alt="Teacher Attachment" />
                                  <div className="attachment-overlay-mini">
                                    <Eye size={12} />
                                    <span>View Image</span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'forum' ? (
            <motion.div
              key="forum"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StudentForum />
            </motion.div>
          ) : activeTab === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PerformanceCharts 
                history={performanceData.history} 
                topics={performanceData.topics} 
              />
            </motion.div>
          ) : activeTab === 'teacher' ? (
            <motion.div
              key="teacher"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="teacher-info-content"
            >
              <section className="teacher-section">
                <h2>Our Faculty</h2>
                <div className="teachers-grid">
                  {teachersList.length > 0 ? (
                    teachersList.map((teacher) => (
                      <div key={teacher.uid} className="teacher-card glass-card">
                        <div className="teacher-profile-left">
                          <div className="teacher-avatar-glow">
                            {teacher.name.charAt(0)}
                          </div>
                          <div className="teacher-details">
                            <h3 className="teacher-name-text">{teacher.name}</h3>
                            <div className="teacher-meta-row">
                              <span className="teacher-badge-vibrant">
                                {teacher.department || 'General Instructor'}
                              </span>
                              <span className="teacher-email-muted">{teacher.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="teacher-actions-right">
                          <a href={`mailto:${teacher.email}`} className="btn-contact-teacher" title="Email Teacher">
                            <Mail size={18} />
                            <span>Contact</span>
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-teachers glass-card">
                      <p>No teacher information currently available.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop" 
              onClick={() => setShowNotifications(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              className="notification-modal"
            >
              <div className="modal-header">
                <div className="header-content">
                  <span className="notification-bell">🔔</span>
                  <h2 className="modal-title">Notifications</h2>
                </div>
                <div className="modal-actions-right">
                  {notifications.filter(n => n.reply || n.isBroadcast).length > 0 && (
                    <button className="btn-clear-all" onClick={() => {
                      if (window.confirm('Clear all notifications?')) {
                        clearAllNotifications();
                      }
                    }}>
                      Clear All
                    </button>
                  )}
                  <button className="close-button-modern" onClick={() => setShowNotifications(false)} aria-label="Close">
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="modal-body">
                {notifications.filter(n => n.reply || n.isBroadcast).length === 0 ? (
                  <div className="empty-state-container">
                    <div className="empty-state-icon">👋</div>
                    <h3 className="empty-state-title">No notifications yet</h3>
                    <p className="empty-state-subtitle">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="notification-list" style={{ padding: '20px 24px' }}>
                    {notifications
                      .filter(n => n.reply || n.isBroadcast)
                      .map(n => (
                        <div 
                          key={n.id} 
                          className={`student-noti-item ${!n.read_by_student ? 'unread' : ''} ${n.isBroadcast ? 'broadcast-noti' : ''}`}
                          onClick={() => {
                            if (n.isBroadcast) {
                              markInquiryAsReadByStudent(n.id);
                              return;
                            }
                            setActiveTab('help');
                            setShowNotifications(false);
                            markInquiryAsReadByStudent(n.id);
                          }}
                          style={{ marginBottom: '12px' }}
                        >
                          <div className="noti-icon-box">
                            {n.isBroadcast ? (
                              <Megaphone size={14} color="#f59e0b" />
                            ) : (
                              <CheckCircle size={14} color="#22c55e" />
                            )}
                          </div>
                          <div className="noti-info">
                            {n.isBroadcast ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <p className="broadcast-title"><strong>GLOBAL ALERT</strong></p>
                                  <small style={{ margin: 0, opacity: 0.6 }}>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)' }}>{n.message}</p>
                              </>
                            ) : (
                              <>
                                <p style={{ color: '#fff' }}><strong>New Reply:</strong> {n.reply?.message.substring(0, 40)}...</p>
                                <small style={{ opacity: 0.6 }}>{new Date(n.reply?.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                              </>
                            )}
                          </div>
                          {!n.read_by_student && <div className="unread-dot" />}
                          <button 
                            className="noti-delete-btn" 
                            title="Clear Notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="contact-support-button" onClick={() => { setActiveTab('help'); setShowNotifications(false); }}>
                  <span className="button-icon">💬</span>
                  <span>Contact Technical Support</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
