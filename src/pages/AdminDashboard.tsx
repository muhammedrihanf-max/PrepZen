import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { 
  LogOut, GraduationCap, Users, FileText, BarChart3, Plus, 
  Trash2, Edit2, Eye, TrendingUp, TrendingDown, Zap, Target, 
  Calendar, Search, Bell, Briefcase, MessageSquare, Clock, Send, CheckCircle, Image as ImageIcon, X, Megaphone, ShieldAlert, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionForm from '../components/QuestionForm';
import ExamView from './ExamView';
import Leaderboard from '../components/Leaderboard';
import StudentManagement from '../components/StudentManagement';
import TeacherManagement from '../components/TeacherManagement';
import StaffManagement from '../components/StaffManagement';
import StudentForum from '../components/StudentForum';
import AdaptiveAdUnit from '../components/AdaptiveAdUnit';
import { uploadFile } from '../services/storage';
import { getAllExams, saveExam, deleteExam, getQuestionsByYear, type ExamMetadata } from '../services/exams';
import { getGlobalStats, subscribeToRecentResults } from '../services/analytics';
import '../styles/AdminDashboard.css';
import type { Question } from '../components/QuestionForm';

const AdminDashboard: React.FC = () => {
  const { 
    user, logout, notifications, markNotificationsAsRead, 
    markNotificationAsRead, deleteNotification, clearNotifications, addReply, sendBroadcast 
  } = useAuth();
  
  const handleExportCSV = () => {
    // Generate mock CSV data
    const headers = "Student Name,Exam Name,Score,Date\n";
    const rows = recentAttempts.map(a => `${a.studentName || 'Student'},${a.examName || 'Exam'},${a.score}%,${new Date(a.timestamp).toLocaleDateString()}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prepzen_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'leaderboard' | 'students' | 'teachers' | 'staff' | 'inquiries' | 'forum' | 'reports'>('overview');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [previewYear, setPreviewYear] = useState<string | null>(null);
  const [exams, setExams] = useState<Record<string, Question[]>>({});
  const [examList, setExamList] = useState<ExamMetadata[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<{
    id?: string;
    studentId: string;
    studentName?: string;
    examName: string;
    score: number;
    timestamp: string;
  }[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [replyText, setReplyText] = useState<Record<string | number, string>>({});
  const [replyAttachment, setReplyAttachment] = useState<Record<string | number, string | null>>({});
  const [replyAttachmentFile, setReplyAttachmentFile] = useState<Record<string | number, File | null>>({});
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [globalStats, setGlobalStats] = useState({
    studentCount: 0,
    examCount: 0,
    avgScore: '0%',
    activeAttempts: 0,
    examParticipation: {} as Record<string, number>
  });

  const handleReplyFileChange = (notiId: string | number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large. Please select a file smaller than 5MB.");
        return;
      }
      setReplyAttachmentFile(prev => ({ ...prev, [notiId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyAttachment(prev => ({ ...prev, [notiId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReply = async (notiId: string | number) => {
    if (!replyText[notiId]?.trim() && !replyAttachmentFile[notiId]) return;
    
    try {
      let finalUrl = undefined;
      if (replyAttachmentFile[notiId]) {
        const path = `support_replies/${user?.uid}_${Date.now()}`;
        finalUrl = await uploadFile(path, replyAttachmentFile[notiId]!);
      }

      addReply(notiId.toString(), replyText[notiId] || '', finalUrl);
      setReplyText(prev => ({ ...prev, [notiId]: '' }));
      setReplyAttachment(prev => ({ ...prev, [notiId]: null }));
      setReplyAttachmentFile(prev => ({ ...prev, [notiId]: null }));
    } catch (error) {
      console.error(error);
      alert("Failed to send reply. Please try again.");
    }
  };

  // Fetch all exams from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoadingExams(true);
      const [examsData, statsData] = await Promise.all([
        getAllExams(),
        getGlobalStats()
      ]);
      setExamList(examsData);
      setGlobalStats(statsData);
      setLoadingExams(false);
    };
    fetchData();

    const unsubscribeRecent = subscribeToRecentResults((data) => {
      setRecentAttempts(data);
    });

    return () => unsubscribeRecent();
  }, []);


  const stats = [
    { label: 'Total Exams', value: examList.length, change: 'Baseline', isPositive: true, icon: FileText, color: 'purple' },
    { label: 'Total Students', value: globalStats.studentCount.toString(), change: 'Starting point', isPositive: true, icon: Users, color: 'blue' },
    { label: 'Avg. Score', value: globalStats.avgScore, change: 'Overall Performance', isPositive: true, icon: Target, color: 'pink' },
    { label: 'Active Attempts', value: globalStats.activeAttempts.toString(), change: 'Platform Wide', isPositive: true, icon: Zap, color: 'orange' }
  ];



  const handleCreateExam = () => {
    const newYear = (new Date().getFullYear() + 1).toString();
    setEditingYear(newYear);
    setShowQuestionForm(true);
  };

  const handleEditExam = async (year: string) => {
    if (!exams[year]) {
      try {
        setLoadingExams(true);
        const questions = await getQuestionsByYear(year);
        setExams(prev => ({ ...prev, [year]: questions }));
      } catch (error) {
        console.error(error);
        alert("Failed to fetch exam questions.");
        return;
      } finally {
        setLoadingExams(false);
      }
    }
    setEditingYear(year);
    setShowQuestionForm(true);
  };

  const handlePreviewExam = async (year: string) => {
    if (!exams[year]) {
      try {
        setLoadingExams(true);
        const questions = await getQuestionsByYear(year);
        setExams(prev => ({ ...prev, [year]: questions }));
      } catch (error) {
        console.error(error);
        alert("Failed to fetch questions for preview.");
        return;
      } finally {
        setLoadingExams(false);
      }
    }
    setPreviewYear(year);
  };

  const handleSaveQuestions = async (questions: Question[], subject: string, grade: string, title: string) => {
    if (editingYear) {
      try {
        setLoadingExams(true);
        await saveExam(editingYear, questions, subject, grade, title);
        
        // Update local state
        setExams(prev => ({
          ...prev,
          [editingYear]: questions
        }));
        
        // Refresh the metadata list
        const updatedList = await getAllExams();
        setExamList(updatedList);
      } catch (error: any) {
        console.error(error);
        alert(`Failed to save exam to database: ${error.message || "Unknown error"}`);
      } finally {
        setLoadingExams(false);
      }
    }
    setShowQuestionForm(false);
    setEditingYear(null);
  };

  const handleDeleteExam = async (year: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the ${year} mock exam?`)) {
      try {
        setLoadingExams(true);
        await deleteExam(year);
        
        const newExams = { ...exams };
        delete newExams[year];
        setExams(newExams);
        
        const updatedList = await getAllExams();
        setExamList(updatedList);
      } catch (error) {
        console.error(error);
        alert("Failed to delete exam.");
      } finally {
        setLoadingExams(false);
      }
    }
  };

  return (
    <div className="admin-layout">


      <aside className="admin-sidebar glass-card">
        {/* Profile moved to footer */}

        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">
            <img src="/favicon.png" alt="PrepZen Logo" className="brand-icon-img" />
          </div>
          <div className="brand-text">
            <span>PrepZen</span>
            <small>Admin Portal</small>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={20} />
            <span>Overview</span>
            {activeTab === 'overview' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={activeTab === 'exams' ? 'active' : ''} 
            onClick={() => setActiveTab('exams')}
          >
            <FileText size={20} />
            <span>Manage Exams</span>
            {activeTab === 'exams' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={activeTab === 'leaderboard' ? 'active' : ''} 
            onClick={() => setActiveTab('leaderboard')}
          >
            <Users size={20} />
            <span>Leaderboard</span>
            {activeTab === 'leaderboard' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={activeTab === 'students' ? 'active' : ''} 
            onClick={() => setActiveTab('students')}
          >
            <GraduationCap size={20} />
            <span>Students</span>
            {activeTab === 'students' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={`tab-btn-relative ${activeTab === 'inquiries' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inquiries')}
            title="Manage Student Inquiries"
          >
            <div className="tab-icon-wrapper">
              <MessageSquare size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="sidebar-noti-dot" />
              )}
            </div>
            <span>Student Inquiries</span>
            {activeTab === 'inquiries' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={activeTab === 'forum' ? 'active' : ''} 
            onClick={() => setActiveTab('forum')}
          >
            <MessageSquare size={20} />
            <span>Community Forum</span>
            {activeTab === 'forum' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''} 
            onClick={() => setActiveTab('reports')}
          >
            <BarChart3 size={20} />
            <span>Reports</span>
            {activeTab === 'reports' && <motion.div layoutId="active-pill" className="active-pill" />}
          </button>
          {user?.role === 'management' && (
            <button 
              className={activeTab === 'teachers' ? 'active' : ''} 
              onClick={() => setActiveTab('teachers')}
            >
              <Briefcase size={20} />
              <span>Teachers</span>
              {activeTab === 'teachers' && <motion.div layoutId="active-pill" className="active-pill" />}
            </button>
          )}
          {user?.role === 'management' && (
            <button 
              className={activeTab === 'staff' ? 'active' : ''} 
              onClick={() => setActiveTab('staff')}
            >
              <ShieldAlert size={20} />
              <span>Staff Management</span>
              {activeTab === 'staff' && <motion.div layoutId="active-pill" className="active-pill" />}
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-profile-section">
            <div className="user-avatar">
              {user?.email?.[0].toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <p>{user?.email}</p>
              <small>Administrator</small>
            </div>
          </div>
          {Capacitor.isNativePlatform() && (
            <>
              <div className="sidebar-footer-ads-container">
                <AdaptiveAdUnit adMobId="ca-app-pub-mobile-sidebar" />
              </div>
              <div className="sidebar-footer-ads-container">
                <AdaptiveAdUnit adMobId="ca-app-pub-mobile-sidebar" />
              </div>
            </>
          )}
          
          <button onClick={logout} className="sidebar-logout-btn-full">
            <LogOut size={18} />
            <span>Logout Account</span>
          </button>

          <div className="sidebar-copyright">
            © 2026 Muhammad Rihan
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="dashboard-header">
          <div className="header-search glass-card">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search exams, students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <div className="notification-wrapper">
              <button 
                className={`icon-btn-plain ${showNotifications ? 'active' : ''}`} 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && <span className="notification-badge pulse" />}
              </button>


              <button 
                className="icon-btn-highlight" 
                onClick={() => setShowBroadcastModal(true)}
                title="Send Broadcast Message"
              >
                <Megaphone size={20} />
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="notification-popover glass-card"
                  >
                    <div className="popover-header">
                      <h3>Student Inquiries</h3>
                      <button onClick={markNotificationsAsRead}>Mark all read</button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="empty-notifications">
                          <MessageSquare size={32} />
                          <p>No questions yet</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'} ${n.isBroadcast ? 'broadcast-item' : ''}`}>
                            <div className="noti-header">
                              <span className="noti-user">
                                {n.isBroadcast && <Megaphone size={12} className="broadcast-icon" />}
                                {n.from}
                                {n.isBroadcast && <span className="broadcast-badge">GLOBAL ALERT</span>}
                              </span>
                              <span className="noti-time"><Clock size={10} /> {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="noti-message">{n.message}</p>
                            
                            {n.attachment && (
                              <div className="noti-attachment">
                                <img src={n.attachment} alt="Attachment" onClick={() => window.open(n.attachment, '_blank')} />
                              </div>
                            )}
                            
                            {n.reply ? (
                              <div className="reply-preview">
                                <div className="reply-header">
                                  <span className="reply-author">Response from {n.reply.author}</span>
                                  <CheckCircle size={12} color="#22c55e" />
                                </div>
                                <p>{n.reply.message}</p>
                              </div>
                            ) : (
                              <div className="reply-action-area">
                                <input 
                                  placeholder="Type your reply..."
                                  value={replyText[n.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [n.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply(n.id)}
                                />
                                <button onClick={() => handleSendReply(n.id)} className="btn-reply-premium" title="Send Reply">
                                  <Send size={14} />
                                  <span>Send</span>
                                </button>
                              </div>
                            )}
                            
                            {!n.read && <div className="noti-badge">New</div>}
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button className="clear-all-noti" onClick={clearNotifications}>
                        Clear all notifications
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="header-date">
              <Calendar size={18} />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.section 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Welcome back, Admin</h1>
                  <p>Here's what's happening with your exams today.</p>
                </div>
              </div>

              <motion.div 
                className="stats-grid"
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
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i} 
                    className={`stat-card premium-card ${stat.color}`}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    <div className="stat-icon"><stat.icon size={24} /></div>
                    <div className="stat-info">
                      <h3>{stat.label}</h3>
                      <div className="stat-value">{stat.value}</div>
                      <div className={`stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                        {stat.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {stat.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="dashboard-grid">
                <div className="recent-activity premium-card">
                  <div className="card-header">
                    <h3>Recent Exam Attempts</h3>
                    <button className="btn-text">View All</button>
                  </div>
                  <div className="activity-list">
                    {recentAttempts.length > 0 ? (
                      recentAttempts.map((attempt) => (
                        <div key={attempt.id} className="activity-item premium-card-mini">
                          <div className="activity-icon-box">
                            <GraduationCap size={16} />
                          </div>
                          <div className="activity-details">
                            <p><strong>{attempt.studentName || 'Student'}</strong> completed {attempt.examName || 'Exam'}</p>
                            <div className="activity-meta">
                              <span className="score-badge">{attempt.score}% Score</span>
                              <span className="time-ago"><Clock size={12} /> {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-activity">
                        <p>No recent exam attempts recorded.</p>
                        <small>Activity will appear here as students complete exams.</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="quick-actions premium-card">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button className="btn-glass-primary" onClick={handleCreateExam}>
                      <Plus size={20} />
                      <span>New Exam</span>
                    </button>
                    <button className="btn-glass" onClick={() => setActiveTab('students')}>
                      <Users size={20} />
                      <span>Manage Users</span>
                    </button>
                    <button className="btn-glass" onClick={() => setActiveTab('reports')}>
                      <BarChart3 size={20} />
                      <span>Reports</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'exams' && (
            <motion.section 
              key="exams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Manage Exams</h1>
                  <p>Create, edit and monitor your mock examinations.</p>
                </div>
                <button className="btn-primary" onClick={handleCreateExam}>
                  <Plus size={20} /> Create New Exam
                </button>
              </div>

              <div className="exams-grid">
                {examList.length > 0 ? (
                  examList
                    .filter(exam => 
                      exam.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(exam => (
                    <div key={exam.id} className="exam-card premium-card">
                      <div className="exam-card-header">
                        <div className="exam-badge">Supabase Cloud</div>
                        <div className="exam-year">{exam.id}</div>
                      </div>
                      <h3>{exam.title}</h3>
                      <div className="exam-stats">
                        <span><FileText size={14} /> {exam.questionCount} Questions</span>
                        <span><Users size={14} /> 0 Attempts</span>
                      </div>
                      <div className="exam-card-footer">
                        <div className="exam-actions-group">
                          <button className="btn-icon-glass" onClick={() => handlePreviewExam(exam.id)} title="Preview"><Eye size={18} /></button>
                          <button className="btn-icon-glass" onClick={() => handleEditExam(exam.id)} title="Edit"><Edit2 size={18} /></button>
                        </div>
                        <button className="btn-icon-glass text-error" onClick={() => handleDeleteExam(exam.id)} title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                ) : loadingExams ? (
                  <div className="loading-container">
                    <div className="spinner-mini spinner-centered" />
                    <p>Syncing with Question Bank...</p>
                  </div>
                ) : (
                  <div className="empty-exams-wrapper">
                    <div className="empty-exams-card glass-card empty-exams-modal">
                      <FileText size={28} className="empty-exams-icon" />
                      <h3 className="empty-exams-title">No Exams Created</h3>
                      <p className="empty-exams-text">Start by creating your first mock examination.</p>
                      <button className="btn-primary-glow btn-create-exam-mini" onClick={handleCreateExam}>
                        <Plus size={16} /> Create New Exam
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {activeTab === 'leaderboard' && (
            <motion.section 
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section leaderboard-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Leaderboard</h1>
                  <p>Monitoring top talent performance across the platform.</p>
                </div>
              </div>
              
              <Leaderboard />
            </motion.section>
          )}

          {activeTab === 'inquiries' && (
            <motion.section 
              key="inquiries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Student Inquiries</h1>
                  <p>Respond to student questions and manage support requests.</p>
                </div>
                <div className="inquiry-filters glass-card">
                  <button 
                    className={inquiryFilter === 'all' ? 'active' : ''} 
                    onClick={() => setInquiryFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={inquiryFilter === 'pending' ? 'active' : ''} 
                    onClick={() => setInquiryFilter('pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={inquiryFilter === 'replied' ? 'active' : ''} 
                    onClick={() => setInquiryFilter('replied')}
                  >
                    Replied
                  </button>
                </div>
              </div>
              
              <div className="inquiries-grid">
                {notifications
                  .filter(n => {
                    if (inquiryFilter === 'pending') return !n.reply;
                    if (inquiryFilter === 'replied') return n.reply;
                    return true;
                  })
                  .map(n => (
                    <motion.div 
                      key={n.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`inquiry-card glass-card ${!n.read ? 'unread' : ''}`}
                      onClick={() => !n.read && markNotificationAsRead(n.id)}
                    >
                      <div className="inquiry-badge-row">
                        {!n.read && <span className="badge-new">New</span>}
                        {n.reply && <span className="badge-replied">Replied</span>}
                        <button className="inquiry-delete-btn" title="Delete Inquiry" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="inquiry-header">
                        <div className="inquiry-user">
                          <div className="user-avatar-mini">{n.from.charAt(0)}</div>
                          <div>
                            <span className="user-name-small">{n.from}</span>
                            <span className="time-small">{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <p className="inquiry-message">{n.message}</p>

                      {n.attachment && (
                        <div className="inquiry-attachment" onClick={(e) => { e.stopPropagation(); window.open(n.attachment, '_blank'); }}>
                          <img src={n.attachment} alt="Attachment" />
                          <div className="attachment-overlay">
                            <Eye size={16} />
                            <span>View Full Image</span>
                          </div>
                        </div>
                      )}

                      {n.reply ? (
                        <div className="inquiry-reply-box">
                          <div className="reply-header-small">
                            <CheckCircle size={14} color="#22c55e" />
                            <span>Response from {n.reply.author}</span>
                            <span className="time-mini">{new Date(n.reply.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p>{n.reply.message}</p>
                        </div>
                      ) : (
                        <div className="inquiry-action-row" onClick={(e) => e.stopPropagation()}>
                          <div className="reply-input-group">
                            {replyAttachment[n.id] && (
                              <div className="reply-attachment-preview">
                                <img src={replyAttachment[n.id]!} alt="Preview" />
                                <button className="remove-preview" title="Remove Image" onClick={() => setReplyAttachment(prev => ({ ...prev, [n.id]: null }))}>
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                            <input 
                              placeholder="Type your response..."
                              value={replyText[n.id] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [n.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendReply(n.id)}
                            />
                            <label className="reply-attach-btn" title="Attach Image">
                              <ImageIcon size={16} />
                              <input 
                                type="file" 
                                accept="image/*" 
                                hidden 
                                onChange={(e) => handleReplyFileChange(n.id, e)}
                              />
                            </label>
                          </div>
                          <button className="btn-reply-premium" title="Send Reply" onClick={() => handleSendReply(n.id)}>
                            <Send size={14} />
                            <span>Reply</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}

                {notifications.filter(n => {
                    if (inquiryFilter === 'pending') return !n.reply;
                    if (inquiryFilter === 'replied') return n.reply;
                    return true;
                  }).length === 0 && (
                  <div className="empty-inquiries">
                    <MessageSquare size={48} opacity={0.2} />
                    <p>No inquiries found matching your selection.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

           {activeTab === 'forum' && (
            <motion.section 
              key="forum"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <StudentForum />
            </motion.section>
          )}

          {activeTab === 'students' && (
            <motion.section 
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Student Management</h1>
                  <p>Monitor, manage and support your growing student community.</p>
                </div>
              </div>
              
              <StudentManagement />
            </motion.section>
          )}

          {activeTab === 'teachers' && user?.role === 'management' && (
            <motion.section 
              key="teachers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Teacher Management</h1>
                  <p>Invite and manage educator profiles and permissions.</p>
                </div>
              </div>
              
              <TeacherManagement />
            </motion.section>
          )}

          {activeTab === 'staff' && user?.role === 'management' && (
            <motion.section 
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Staff Management</h1>
                  <p>Control administrative access and manage staff roles.</p>
                </div>
              </div>
              
              <StaffManagement />
            </motion.section>
          )}

          {activeTab === 'reports' && (
            <motion.section 
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="admin-section"
            >
              <div className="section-header-top">
                <div>
                  <h1>Performance Reports</h1>
                  <p>In-depth analytics and data exports for all examinations.</p>
                </div>
                <button className="btn-primary" onClick={handleExportCSV}>
                  <Download size={20} /> Export to CSV
                </button>
              </div>

              <div className="stats-grid">
                <div className="premium-card stats-card">
                  <div className="stats-header">
                    <div className="stats-icon-wrapper trend-icon">
                      <TrendingUp size={24} color="#6366f1" />
                    </div>
                    <div>
                      <h3>High Score Trend</h3>
                      <p>Latest top performing attempts</p>
                    </div>
                  </div>
                  <div className="stats-list">
                    {recentAttempts.filter(a => a.score >= 80).slice(0, 5).map(a => (
                      <div key={a.id} className="stats-item">
                        <span>{a.studentName}</span>
                        <strong>{a.score}%</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-card stats-card">
                  <div className="stats-header">
                    <div className="stats-icon-wrapper participation-icon">
                      <BarChart3 size={24} color="#a855f7" />
                    </div>
                    <div>
                      <h3>Exam Participation</h3>
                      <p>Engagement across modules</p>
                    </div>
                  </div>
                  <div className="stats-list">
                    {examList.slice(0, 5).map(e => {
                      const attempts = globalStats.examParticipation[e.id] || 0;
                      const percentage = globalStats.activeAttempts > 0 
                        ? (attempts / globalStats.activeAttempts * 100) 
                        : 0;
                      
                      return (
                        <div key={e.id} className="stats-item">
                          <span>{e.title}</span>
                          <div className="progress-wrapper">
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span>{attempts}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="premium-card table-card">
                <div className="table-header">
                  <h3>All Recent Attempts</h3>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-current)' }}>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Student</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Exam</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Score</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttempts.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border-current)' }}>
                          <td style={{ padding: '16px 24px' }}>{a.studentName}</td>
                          <td style={{ padding: '16px 24px' }}>{a.examName}</td>
                          <td style={{ padding: '16px 24px' }}><strong>{a.score}%</strong></td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ 
                              padding: '4px 12px', 
                              borderRadius: '99px', 
                              fontSize: '0.75rem', 
                              background: a.score >= 50 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: a.score >= 50 ? '#22c55e' : '#ef4444'
                            }}>
                              {a.score >= 50 ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showBroadcastModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="broadcast-modal glass-card"
            >
              <div className="modal-header">
                <div className="header-title">
                  <Megaphone size={24} color="#f59e0b" />
                  <h2>Broadcast Message</h2>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="close-btn" title="Close"><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p>Send an urgent alert to all students. This message will be highlighted in their dashboard.</p>
                <textarea 
                  placeholder="Type your priority message here..."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button className="btn-glass" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                <button 
                  className="btn-primary" 
                  title="Send Broadcast Alert"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  onClick={() => {
                    if (broadcastText.trim()) {
                      sendBroadcast(broadcastText);
                      setBroadcastText('');
                      setShowBroadcastModal(false);
                    }
                  }}
                >
                  <Send size={18} />
                  <span>Send Global Alert</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuestionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 3000 }}
          >
            <QuestionForm 
              examYear={editingYear || '2025'}
              initialQuestions={editingYear ? exams[editingYear] : []}
              initialSubject={examList.find(e => e.id === editingYear)?.subject}
              initialGrade={examList.find(e => e.id === editingYear)?.grade}
              initialTitle={examList.find(e => e.id === editingYear)?.title}
              onSave={handleSaveQuestions}
              onCancel={() => setShowQuestionForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewYear && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="preview-overlay"
            style={{ zIndex: 4000 }}
          >
            <ExamView 
              previewYear={previewYear}
              previewQuestions={exams[previewYear]}
              onExitPreview={() => setPreviewYear(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: transparent;
          color: var(--text-current);
        }

        /* Sidebar Styling */
        .admin-sidebar {
          width: 280px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: var(--spacing-xl) var(--spacing-md);
          border-radius: 0;
          border-right: 1px solid var(--border-current);
          z-index: 20;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          padding: 0 var(--spacing-sm);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .sidebar-brand:hover {
          transform: scale(1.02);
        }

        .brand-icon {
          background: var(--primary-gradient);
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand-text span {
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        .brand-text small {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          margin-top: var(--spacing-md);
        }

        .sidebar-nav button {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 14px var(--spacing-md);
          border: none;
          background: none;
          color: var(--text-secondary);
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .sidebar-nav button:hover {
          color: var(--text-current);
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .sidebar-nav button:active {
          transform: translateX(2px) scale(0.98);
        }

        .sidebar-nav button.active {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }

        .active-pill {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #6366f1;
          border-radius: 0 4px 4px 0;
        }

        .sidebar-noti-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--glass-card-bg);
          animation: dot-pulse 2s infinite;
        }

        .tab-icon-wrapper {
          position: relative;
        }

        .tab-btn-relative {
          position: relative;
        }

        @keyframes dot-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Inquiries Section Styles */
        .inquiry-filters {
          display: flex;
          padding: 4px;
          gap: 4px;
          border-radius: 12px;
        }

        .inquiry-filters button {
          padding: 6px 16px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.8125rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .inquiry-filters button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .inquiry-filters button.active {
          background: var(--primary-gradient);
          color: white;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
        }

        .inquiries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
        }

        .inquiry-card {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          border: 1px solid var(--border-current);
          transition: all 0.3s;
          position: relative;
        }

        .inquiry-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
        }

        .inquiry-card.unread {
          background: rgba(99, 102, 241, 0.03);
          border-left: 3px solid #6366f1;
        }

        .inquiry-badge-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .badge-new {
          background: #6366f1;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .badge-replied {
          background: #22c55e33;
          color: #22c55e;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .inquiry-delete-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          opacity: 0.4;
          transition: all 0.2s;
        }

        .inquiry-delete-btn:hover {
          color: #ef4444;
          opacity: 1;
        }

        .inquiry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .inquiry-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-avatar-mini {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-current);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #6366f1;
        }

        .user-name-small {
          display: block;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .time-small {
          display: block;
          font-size: 0.725rem;
          color: var(--text-tertiary);
        }

        .inquiry-message {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #e2e8f0;
          margin: 0;
        }

        .inquiry-attachment {
          position: relative;
          width: 100%;
          height: 180px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid var(--border-current);
        }

        .inquiry-attachment img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .attachment-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: all 0.3s;
          color: white;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .inquiry-attachment:hover .attachment-overlay {
          opacity: 1;
        }

        .inquiry-reply-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(34, 197, 94, 0.1);
          border-radius: 12px;
          padding: var(--spacing-md);
        }

        .reply-header-small {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.725rem;
          font-weight: 700;
          color: #22c55e;
          margin-bottom: 8px;
        }

        .time-mini {
          color: var(--text-tertiary);
          margin-left: auto;
        }

        .inquiry-reply-box p {
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .inquiry-action-row {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .inquiry-action-row input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-current);
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          font-size: 0.8125rem;
        }

        .inquiry-action-row input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .empty-inquiries {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 0;
          color: var(--text-tertiary);
          font-weight: 700;
        }

        /* Teacher Reply Attachments */
        .reply-input-group {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-current);
          border-radius: 8px;
          padding: 4px 8px;
          transition: border-color 0.2s;
        }

        .reply-input-group:focus-within {
          border-color: #6366f1;
        }

        .reply-input-group input {
          flex: 1;
          background: none !important;
          border: none !important;
          padding: 6px 4px !important;
        }

        .reply-attach-btn {
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .reply-attach-btn:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }

        .reply-attachment-preview {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .reply-attachment-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-preview {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: none;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .reply-attachment-preview:hover .remove-preview {
          opacity: 1;
        }
        .sidebar-footer {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 8px;
        }

        .footer-profile-section {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 14px;
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 12px;
          margin-bottom: 8px;
        }

        .sidebar-copyright {
          text-align: center;
          font-size: 0.625rem;
          color: var(--text-tertiary);
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.7;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
          margin-top: 4px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: var(--primary-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
          color: white;
        }

        .user-details {
          flex: 1;
          overflow: hidden;
        }

        .user-details p {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-details small {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-logout-btn-full {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #ef4444;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 4px;
        }

        .sidebar-logout-btn-full:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }

        .sidebar-logout-btn-full svg {
          transition: transform 0.3s;
        }

        .sidebar-logout-btn-full:hover svg {
          transform: translateX(2px);
        }

        /* Main Content Styling */
        .admin-main {
          flex: 1;
          background: var(--bg-current);
          overflow-y: auto;
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .header-search {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 10px var(--spacing-md);
          border-radius: var(--radius-xl);
        }

        .header-search input {
          background: none;
          border: none;
          padding: 0;
          width: 100%;
          color: var(--text-current);
          font-size: 0.875rem;
        }

        .header-search input:focus {
          outline: none;
        }

        .header-search span, .header-search input {
          line-height: 1;
          display: flex;
          align-items: center;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-date {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: var(--surface-current);
          padding: 8px 16px;
          border-radius: var(--radius-xl);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          border: 1px solid var(--border-current);
          transition: all 0.3s ease;
          cursor: default;
        }

        .header-date:hover {
          border-color: #6366f1;
          color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          transform: translateY(-1px);
        }

        .icon-btn-plain {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
          position: relative;
        }

        .icon-btn-plain:hover, .icon-btn-plain.active {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }

        .icon-btn-plain svg {
          display: block;
        }

        .notification-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid var(--bg-current);
        }

        .notification-popover {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 320px;
          padding: var(--spacing-md);
          z-index: 100;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-xs);
          border-bottom: 1px solid var(--border-current);
        }

        .popover-header h3 {
          font-size: 0.9rem;
          margin: 0;
        }

        .popover-header button {
          background: none;
          border: none;
          color: #6366f1;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          transition: background 0.2s;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .notification-item.read {
          opacity: 0.6;
        }

        .notification-item p {
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.4;
        }

        .notification-item small {
          color: var(--text-tertiary);
          font-size: 0.7rem;
        }

        .notification-badge.pulse {
          animation: badge-pulse 2s infinite;
        }

        @keyframes badge-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: var(--spacing-xl) 0;
          color: var(--text-tertiary);
        }

        .noti-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .noti-user {
          font-weight: 800;
          font-size: 0.8125rem;
          color: var(--text-current);
        }

        .noti-time {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .noti-message {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .noti-attachment {
          margin-top: 8px;
          width: 100%;
          max-height: 120px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-current);
          cursor: pointer;
        }

        .noti-attachment img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .notification-item.unread {
          background: rgba(99, 102, 241, 0.05);
          border-left: 3px solid #6366f1;
        }

        .noti-badge {
          display: inline-block;
          background: #6366f1;
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .clear-all-noti {
          width: 100%;
          background: none;
          border: none;
          padding: 10px;
          color: var(--text-tertiary);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border-top: 1px solid var(--border-current);
          margin-top: 10px;
          transition: all 0.2s;
        }

        .clear-all-noti:hover {
          color: var(--error);
          background: rgba(239, 68, 68, 0.05);
        }

        .reply-action-area {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .reply-action-area input {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-current);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
          color: white;
          font-size: 0.75rem;
        }

        .btn-reply-premium {
          padding: 6px 14px !important;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 800;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }

        .btn-reply-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(99, 102, 241, 0.5);
          background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
        }
          justify-content: center;
        }

        .reply-preview {
          margin-top: 10px;
          padding: 8px;
          background: rgba(34, 197, 94, 0.05);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(34, 197, 94, 0.1);
        }

        .reply-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .reply-author {
          font-size: 0.65rem;
          font-weight: 800;
          color: #22c55e;
          text-transform: uppercase;
        }

        .reply-preview p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
          font-style: italic;
        }

        .admin-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .section-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .section-header-top h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
        }

        .section-header-top p {
          color: var(--text-tertiary);
          margin: 4px 0 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-lg);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          transition: all 0.3s;
          cursor: default;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        }

        .stat-icon {
          width: 54px;
          height: 54px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .purple .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .blue .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .pink .stat-icon { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
        .orange .stat-icon { background: rgba(249, 115, 22, 0.1); color: #f97316; }

        .stat-info h3 {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin: 0;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 4px 0;
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-change.positive { color: var(--success); }
        .stat-change.negative { color: var(--text-tertiary); }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--spacing-lg);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .btn-text {
          background: none;
          border: none;
          color: #6366f1;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-text:hover {
          color: #818cf8;
          text-decoration: underline;
          transform: scale(1.05);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          transition: background 0.2s;
        }

        .activity-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .activity-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--surface-current);
          border: 1px solid var(--border-current);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #6366f1;
        }

        .activity-details {
          flex: 1;
        }

        .activity-details strong {
          display: block;
          font-size: 0.9375rem;
        }

        .activity-details p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .empty-activity {
          padding: var(--spacing-xl) var(--spacing-md);
          text-align: center;
          background: rgba(255, 255, 255, 0.01);
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-current);
        }

        .empty-activity p {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .empty-activity small {
          color: var(--text-tertiary);
        }

        .activity-score {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .score-badge {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .activity-score small {
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          background: var(--primary-gradient);
          color: white;
          border: none;
          padding: 14px;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          transition: all 0.3s;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
          filter: brightness(1.1);
        }

        .action-btn-outline {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          background: none;
          border: 1px solid var(--border-current);
          color: var(--text-current);
          padding: 14px;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--text-tertiary);
        }

        /* Exams View Grid */
        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .exam-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
        }

        .exam-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .exam-badge {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .exam-year {
          font-weight: 800;
          color: var(--text-tertiary);
        }

        .exam-card h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
        }

        .exam-stats {
          display: flex;
          gap: var(--spacing-md);
          color: var(--text-tertiary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .exam-stats span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .exam-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-current);
        }

        .exam-actions-group {
          display: flex;
          gap: var(--spacing-sm);
        }

        .icon-btn-round {
          background: var(--surface-current);
          border: 1px solid var(--border-current);
          color: var(--text-tertiary);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn-round:hover {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
          transform: translateY(-2px);
        }

        .icon-btn-round.text-error:hover {
          background: var(--error);
          border-color: var(--error);
        }

        /* Leaderboard Specific Styles */
        .leaderboard-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 30px;
        }

        .leaderboard-tabs button {
          padding: 8px 24px;
          border-radius: 25px;
          border: none;
          background: none;
          color: var(--text-tertiary);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .leaderboard-tabs button.active {
          background: #6366f1;
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .podium-section {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: var(--spacing-xl);
          padding: var(--spacing-xl) 0;
          margin-top: var(--spacing-lg);
        }

        .podium-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          position: relative;
        }

        .podium-avatar-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          padding: 4px;
        }

        .rank-2 .podium-avatar-wrapper { width: 85px; height: 85px; background: linear-gradient(135deg, var(--text-secondary), #475569); }
        .rank-1 .podium-avatar-wrapper { width: 120px; height: 120px; background: linear-gradient(135deg, #fbbf24, #f59e0b); }
        .rank-3 .podium-avatar-wrapper { width: 80px; height: 80px; background: linear-gradient(135deg, #d97706, #92400e); }

        .podium-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--surface-current);
          border: 3px solid var(--bg-current);
          object-fit: cover;
        }

        .podium-card .rank-badge {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
          border: 2px solid var(--bg-current);
        }

        .rank-1 .rank-badge { background: #fbbf24; }
        .rank-2 .rank-badge { background: var(--text-secondary); }
        .rank-3 .rank-badge { background: #d97706; }

        .king-crown {
          position: absolute;
          top: -35px;
          color: #fbbf24;
          filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.4));
        }

        .podium-name { font-size: 1.125rem; font-weight: 800; }
        .podium-score { font-size: 0.875rem; font-weight: 700; color: #6366f1; }

        .current-user-rank {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
          border: 1px solid rgba(139, 92, 246, 0.3);
          margin-top: var(--spacing-xl);
          border-radius: 20px;
        }

        .rank-label { font-weight: 700; color: #a78bfa; }
        .rank-number { font-size: 1.25rem; font-weight: 800; margin-left: var(--spacing-md); }

        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
        }

        .rank-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-radius: 20px;
          transition: transform 0.2s;
        }

        .rank-card:hover { transform: translateX(8px); }

        .rank-card-left { display: flex; align-items: center; gap: var(--spacing-md); }
        .rank-card-avatar { width: 45px; height: 45px; border-radius: 50%; background: var(--surface-current); }
        .rank-card-name { font-weight: 700; }

        .rank-card-right { display: flex; align-items: center; gap: var(--spacing-lg); }
        .rank-card-rank { font-weight: 800; font-size: 1.125rem; width: 30px; text-align: center; }
        
        .rank-card-trend.up { color: var(--success); }
        .rank-card-trend.down { color: var(--error); }

        /* Legacy Overrides */
        .leaderboard-container { padding: 0; overflow: hidden; }
        .premium-table { width: 100%; border-collapse: collapse; }

        .premium-table th {
          text-align: left;
          padding: var(--spacing-lg);
          background: rgba(255, 255, 255, 0.02);
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-tertiary);
          border-bottom: 1px solid var(--border-current);
        }

        .premium-table td {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-current);
        }

        .premium-table tr:last-child td {
          border-bottom: none;
        }

        .rank-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.8125rem;
        }

        .rank-1 { color: #d97706; }
        .rank-2 { color: #475569; }
        .rank-3 { color: #9a3412; }

        .student-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .student-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-current);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          color: #6366f1;
        }

        .score-cell {
          font-weight: 800;
          color: var(--success);
        }

        .btn-outline-danger {
          background: none;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--error);
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline-danger:hover {
          background: rgba(239, 68, 68, 0.05);
          border-color: var(--error);
        }

        .btn-primary-glow {
          background: var(--primary-gradient);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
          transition: all 0.3s;
        }

        .btn-primary-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.85);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          background: var(--bg-current);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .exam-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-current);
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            width: 80px;
            padding: var(--spacing-xl) var(--spacing-sm);
          }
          .brand-text, .sidebar-nav button span, .user-details, .active-pill {
            display: none;
          }
          .sidebar-brand, .sidebar-nav button, .user-info {
            justify-content: center;
          }
        }
        .empty-exams-container {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: var(--spacing-xxl) 0;
        }

        .empty-exams-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          padding: 60px 40px;
          text-align: center;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-xl);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow), 0 0 30px rgba(99, 102, 241, 0.1);
          animation: card-float 6s ease-in-out infinite;
        }

        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .empty-exams-card svg {
          color: #6366f1;
          filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
          animation: icon-pulse 2s ease-in-out infinite;
        }

        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        .empty-exams-card h3 {
          margin: var(--spacing-md) 0 0;
          font-size: 1.75rem;
          font-weight: 800;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-exams-card p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-bottom: var(--spacing-lg);
          opacity: 0.8;
        }

        .broadcast-modal {
          width: 100%;
          max-width: 500px;
          padding: 30px;
          border: 1px solid rgba(245, 158, 11, 0.3);
          box-shadow: 0 0 40px rgba(245, 158, 11, 0.1);
        }

        .broadcast-modal textarea {
          width: 100%;
          min-height: 150px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: 15px;
          color: #fff;
          font-size: 1rem;
          resize: none;
          margin-top: 15px;
          outline: none;
        }

        .broadcast-modal textarea:focus {
          border-color: #f59e0b;
        }

        .broadcast-item {
          border-left: 3px solid #f59e0b ! from ts;
          background: rgba(245, 158, 11, 0.05);
        }

        .broadcast-badge {
          font-size: 10px;
          background: #f59e0b;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
          margin-left: 8px;
        }

        .broadcast-icon {
          color: #f59e0b;
          margin-right: 6px;
        }

        .icon-btn-highlight {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
          transition: all 0.3s ease;
        }

        .icon-btn-highlight:hover {
          background: #f59e0b;
          color: #000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
      `}</style>

    </div>
  );
};

export default AdminDashboard;
