import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, History, Trophy, Settings, HelpCircle, Send, CheckCircle, Image, X, Bell, Eye, Users, Megaphone, ShieldCheck, User, Phone, Mail, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSettings from '../components/ProfileSettings';
import Leaderboard from '../components/Leaderboard';
import StudentForum from '../components/StudentForum';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { getStudentPerformance } from '../services/analytics';
import { uploadFile } from '../services/storage';
import { getAllExams, type ExamMetadata } from '../services/exams';
import { getAllTeachers, type UserProfile } from '../services/users';
import AdSenseUnit from '../components/AdSenseUnit';

const Dashboard: React.FC = () => {
  const { user, logout, notifications, addNotification, markInquiryAsReadByStudent, clearAllNotifications, deleteNotification } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
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
      <nav className="dashboard-nav glass-card">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <img src="/favicon.png" alt="PrepZen Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
          <span>PrepZen</span>
        </div>
        <div className="nav-user">
          <div className="user-profile-trigger" onClick={() => setShowProfile(true)}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="nav-avatar" />
            ) : (
              <div className="nav-avatar-placeholder">
                {user?.displayName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-text">
              <span className="user-name">{user?.displayName || 'Student'}</span>
              <span className="user-role">Student</span>
            </div>
            <Settings size={16} className="settings-icon" />
          </div>
          <div className="nav-divider"></div>
          
          <div className="notification-wrapper">
            <button 
              className={`btn-icon-glass ${showNotifications ? 'active' : ''}`} 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.filter(n => n.reply && !n.read_by_student).length > 0 && (
                <span className="noti-badge-mini" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="student-noti-popover glass-card"
                >
                  <div className="popover-header">
                    <h3>Notifications</h3>
                    <div className="popover-actions">
                      {notifications.length > 0 && (
                        <button className="btn-clear-all" onClick={clearAllNotifications}>Clear All</button>
                      )}
                      <button className="btn-close-pop" onClick={() => setShowNotifications(false)} title="Close Notifications"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="popover-content">
                    {notifications.filter(n => n.reply || n.isBroadcast).length === 0 ? (
                      <p className="empty-text">No notifications yet.</p>
                    ) : (
                      notifications
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
                                  <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{n.message}</p>
                                </>
                              ) : (
                                <>
                                  <p><strong>New Reply:</strong> {n.reply?.message.substring(0, 40)}...</p>
                                  <small>{new Date(n.reply?.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
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
                        ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="nav-divider"></div>
          <button onClick={logout} className="btn-icon-glass" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

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
          <div className="dashboard-ads" style={{ margin: '1rem 0' }}>
            <AdSenseUnit slot="student-dashboard-banner" style={{ minHeight: '90px' }} />
          </div>
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
                      <div key={exam.id} className="practice-card glass-card year-card" onClick={() => navigate(`/exam/${exam.id}`)}>
                        <div className="card-bg-glow"></div>
                        <div className="practice-card-content">
                          <div className="year-badge">{exam.id}</div>
                          <h3>{exam.title}</h3>
                          <p>{exam.questionCount} Professional Questions</p>
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="var(--text-secondary)" />
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>Muhammed Rihan</span>
                    </div>
                    <a href="tel:+971566202782" className="contact-link">
                      <Phone size={14} /> +971566202782
                    </a>
                    <a href="mailto:muhammedrihanf@gmail.com" className="contact-link">
                      <Mail size={14} /> muhammedrihanf@gmail.com
                    </a>
                  </div>
                  <p className="contact-description">
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
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`btn-primary-glow ${isSent ? 'success' : ''}`}
                    type="submit"
                    disabled={isSent}
                  >
                    {isSent ? <><CheckCircle size={20} /> Sent Successfully!</> : <><Send size={20} /> Send to Teacher</>}
                  </motion.button>
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

                <div className="support-info">
                  <p>Your teacher will be notified immediately and usually responds within 24 hours.</p>
                </div>
              </div>

              <div className="inquiry-history glass-card">
                <div className="history-header">
                  <History size={20} color="#6366f1" />
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
                <div className="teachers-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '24px',
                  marginTop: '20px' 
                }}>
                  {teachersList.length > 0 ? (
                    teachersList.map((teacher) => (
                      <div key={teacher.uid} className="teacher-card glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                        <div className="teacher-avatar-large" style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          color: 'white',
                          fontWeight: 800
                        }}>
                          {teacher.name.charAt(0)}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#f8fafc' }}>{teacher.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            color: '#6366f1', 
                            fontWeight: 700, 
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            padding: '4px 12px',
                            borderRadius: '99px',
                            margin: '0 auto'
                          }}>
                            {teacher.department || 'General Instructor'}
                          </span>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '8px 0' }}>{teacher.email}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                            <a href={`mailto:${teacher.email}`} className="contact-link-circle" title="Email Teacher">
                              <Mail size={18} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-teachers glass-card" style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>No teacher information currently available.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background: transparent;
          color: var(--text-current);
        }
        .dashboard-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px var(--spacing-xl);
          margin: var(--spacing-md);
          border-radius: var(--radius-lg);
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -1px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .nav-brand:hover {
          transform: scale(1.02);
        }
        .nav-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-profile-trigger {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 6px 12px 6px 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-current);
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-profile-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--text-tertiary);
          transform: translateY(-1px);
        }

        .nav-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #6366f1;
        }

        .nav-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
        }

        .user-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.2;
        }

        .user-name {
          font-weight: 700;
          font-size: 0.875rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .settings-icon { color: var(--text-tertiary); margin-left: 4px; }

        .nav-divider {
          width: 1px;
          height: 24px;
          background: var(--border-current);
        }


        .content-header p { color: var(--text-tertiary); font-size: 1.125rem; margin-bottom: var(--spacing-lg); }

        .dashboard-tabs-container {
          display: flex;
          justify-content: center;
          margin-bottom: var(--spacing-xl);
        }

        .dashboard-tabs {
          display: flex;
          padding: 6px;
          gap: 8px;
          border-radius: 40px;
        }

        .dashboard-tabs button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1;
        }

        .dashboard-tabs button:hover {
          color: var(--text-current);
          background: rgba(255, 255, 255, 0.05);
        }

        .dashboard-tabs button.active {
          background: var(--primary-gradient);
          color: white;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
        }

        .dashboard-content {
          padding: var(--spacing-xl);
          max-width: 1200px;
          margin: 0 auto;
        }

        .content-header {
          margin-bottom: var(--spacing-xl);
        }
        .content-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin-bottom: 8px;
        }
        .content-header p { color: var(--text-tertiary); font-size: 1.125rem; }

        .years-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        .year-card {
          text-align: left;
          cursor: pointer;
          padding: var(--spacing-lg);
          transition: all 0.3s;
        }
        .year-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border-color: #6366f1;
        }

        .year-card:active {
          transform: translateY(-4px) scale(0.98);
        }
        .year-card h3 {
          margin: 0 0 var(--spacing-xs);
          font-size: 1.25rem;
          font-weight: 800;
        }
        .year-card p {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }
        .card-footer {
          margin-top: var(--spacing-lg);
          font-weight: 700;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-lg);
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }
        .stat-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          border-color: #6366f133;
        }
        .stat-card h3 { font-size: 1.75rem; font-weight: 800; margin: 0; }
        .stat-card p { margin: 0; font-size: 0.875rem; color: var(--text-tertiary); font-weight: 600; }
        .stat-card svg { color: #6366f1; }

        .empty-exams-placeholder {
          grid-column: 1 / -1;
          padding: 60px var(--spacing-xl);
          text-align: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-xl);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
          color: var(--text-current);
          animation: card-float 6s ease-in-out infinite;
        }

        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .empty-exams-placeholder p {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 8px;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-exams-placeholder small {
          color: var(--text-secondary);
          font-size: 1rem;
          opacity: 0.8;
        }
        .help-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .support-card {
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .support-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .support-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
        }

        .support-header p {
          margin: 4px 0 0;
          font-size: 0.95rem;
          color: var(--text-tertiary);
        }

        .question-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .question-form textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-current);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          color: var(--text-current);
          min-height: 150px;
          resize: vertical;
          font-family: inherit;
          transition: all 0.2s;
        }

        .question-form textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .support-info p {
          margin: 0;
          font-size: 0.875rem;
          color: #6366f1;
          font-weight: 600;
          text-align: center;
        }

        .btn-primary-glow {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 10px;
        }

        .btn-primary-glow:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.6);
          background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
        }

        .btn-primary-glow:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary-glow.success {
          background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }

        .btn-primary-glow:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .attachment-area {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-sm);
        }

        .file-upload-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed var(--border-current);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-upload-btn:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
          color: #6366f1;
        }

        .attachment-preview-box {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-current);
        }

        .attachment-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-attach {
          position: absolute;
          top: 0;
          right: 0;
          background: rgba(239, 68, 68, 0.8);
          border: none;
          color: white;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .quote-card-feedback {
          margin-top: 20px;
          background: var(--primary-gradient);
          padding: 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .quote-text {
          font-style: italic;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .quote-sparkles {
          font-size: 1.5rem;
        }

        .history-attachment {
          margin-top: 10px;
          width: 100%;
          max-height: 200px;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-current);
          cursor: pointer;
        }

        .history-attachment img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: rgba(0, 0, 0, 0.2);
        }

        .inquiry-history {
          margin-top: var(--spacing-xl);
          padding: var(--spacing-xl);
        }

        .history-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: var(--spacing-lg);
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-current);
        }

        .history-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .history-item {
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-current);
        }

        .history-item-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .history-date {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .history-status {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .history-status.pending { background: rgba(234, 179, 8, 0.1); color: #eab308; }
        .history-status.replied { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

        .history-msg {
          font-size: 0.875rem;
          margin: 0;
          color: var(--text-current);
          line-height: 1.5;
        }

        .history-reply {
          margin-top: 12px;
          padding: 10px;
          background: rgba(34, 197, 94, 0.05);
          border-radius: var(--radius-sm);
          border-left: 3px solid #22c55e;
        }

        .reply-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #22c55e;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .history-reply p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .empty-history {
          text-align: center;
          padding: var(--spacing-lg);
          color: var(--text-tertiary);
          font-style: italic;
          font-size: 0.9rem;
        }

        .reply-attachment {
          margin-top: 10px;
          position: relative;
          width: 100%;
          max-width: 250px;
          height: 140px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .reply-attachment img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .attachment-overlay-mini {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
          font-weight: 700;
          font-size: 0.65rem;
        }

        .reply-attachment:hover .attachment-overlay-mini {
          opacity: 1;
        }

        /* Student Notification System Styles */
        .notification-wrapper {
          position: relative;
        }

        .noti-badge-mini {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--bg-current);
          animation: badge-pulse-mini 2s infinite;
        }

        @keyframes badge-pulse-mini {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .tab-btn-relative {
          position: relative;
        }

        .tab-noti-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 10px;
          height: 10px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--bg-current);
          animation: badge-pulse-mini 2s infinite;
        }

        .student-noti-popover {
          position: absolute;
          top: calc(100% + 15px);
          right: -10px;
          width: 320px;
          z-index: 1000;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          overflow: hidden;
        }

        .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--border-current);
        }

        .popover-header h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 800;
        }

        .popover-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-clear-all {
          background: none;
          border: none;
          color: #6366f1;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .btn-clear-all:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .btn-close-pop {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .btn-close-pop:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }

        .popover-content {
          max-height: 350px;
          overflow-y: auto;
        }

        .student-noti-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--border-current);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .student-noti-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .noti-delete-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          opacity: 0;
          transition: all 0.2s;
        }

        .student-noti-item:hover .noti-delete-btn {
          opacity: 1;
        }

        .noti-delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          transform: translateY(-50%) rotate(90deg);
        }

        .student-noti-item.unread {
          background: rgba(99, 102, 241, 0.05);
          border-left: 3px solid #6366f1;
        }

        .noti-icon-box {
          background: rgba(34, 197, 94, 0.1);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .noti-info p {
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.4;
        }

        .noti-info small {
          color: var(--text-tertiary);
          font-size: 0.725rem;
        }

        .unread-dot {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #6366f1;
          border-radius: 50%;
        }

        .empty-text {
          padding: 30px;
          text-align: center;
          color: var(--text-tertiary);
          font-style: italic;
          font-size: 0.875rem;
        }

        .app-footer {
          margin-top: 60px;
          padding: 40px 20px;
          text-align: center;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-tertiary);
          border-top: 1px solid var(--border-current);
          letter-spacing: 0.025em;
          opacity: 0.7;
        }
      `}</style>
      <footer className="app-footer">
        © 2026 Muhammad Rihan. All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;
