import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, UserPlus, 
  Mail, Calendar, BarChart2, CheckCircle, 
  XCircle, Edit2, Trash2, ArrowUpRight, X
} from 'lucide-react';
import { subscribeToStudents, updateUserProfile, deleteUserProfile, type UserProfile } from '../services/users';
import { getLatestResultForStudent } from '../services/analytics';
import { useAuth } from '../context/AuthContext';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, unknown>>({});
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'approved'>('all');
  const { activateStudent, register } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      // Fetch latest results for each student
      data.forEach(async (student) => {
        const result = await getLatestResultForStudent(student.id);
        if (result) {
          setPerformanceData(prev => ({
            ...prev,
            [student.id]: result
          }));
        }
      });
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const name = student?.name || '';
      const email = student?.email || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await deleteUserProfile(id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleSaveStudent = async (data: Partial<UserProfile> & { password?: string }) => {
    if (editingStudent) {
      try {
        await updateUserProfile(editingStudent.id, data);
      } catch (err) {
        console.error("Update failed:", err);
      }
    } else {
      try {
        await register(data.email!, data.password!, data.name!, 'student');
      } catch (err: any) {
        console.error("Creation failed:", err);
        alert(`Failed to create student: ${err.message}`);
      }
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleApprove = async (id: string) => {
    if (approvingIds.has(id)) return;
    
    setApprovingIds(prev => new Set(prev).add(id));
    try {
      await activateStudent(id);
      // Manually update local state to reflect the change immediately
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      alert("Student account successfully activated!");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Approval failed:", error);
      alert(`Failed to approve student: ${error.message || 'Unknown error'}`);
    } finally {
      setApprovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openEditModal = (student: UserProfile) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="student-management">
      <header className="management-header">
        <div className="search-bar glass-card">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search students by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <div className="glass-card compact-select">
            <Filter size={18} />
            <select 
              title="Filter by status"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'pending' | 'approved')}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {students.some(s => s.status === 'pending') && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="pending-count-badge"
              onClick={() => setStatusFilter('pending')}
            >
              {students.filter(s => s.status === 'pending').length} Requests
            </motion.div>
          )}
          
          <button className="btn-primary-glow" onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}>
            <UserPlus size={20} />
            <span>Add Student</span>
          </button>
        </div>
      </header>

      <div className="student-grid">
        <AnimatePresence mode="popLayout">
          {filteredStudents.map((student, index) => (
            <motion.div 
              key={student.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="student-card premium-card"
            >
              <div className="student-card-header">
                <div className="student-avatar-group">
                  <div className="student-avatar-ring">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/png?seed=${student.avatarSeed}`} 
                      alt={student.name} 
                    />
                  </div>
                  <div className={`status-dot ${student.isOnline ? 'active' : 'inactive'} pulse`} />
                </div>
                <div className="card-top-actions">
                  {student.status === 'pending' && (
                    <button 
                      className={`btn-approve-success ${approvingIds.has(student.id) ? 'loading' : ''}`} 
                      onClick={() => handleApprove(student.id)}
                      disabled={approvingIds.has(student.id)}
                      title="Approve Student"
                    >
                      {approvingIds.has(student.id) ? (
                        <div className="spinner-tiny" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      {approvingIds.has(student.id) ? 'Approving...' : 'Approve'}
                    </button>
                  )}
                  <button className="btn-icon-glass text-primary" onClick={() => openEditModal(student)} title="Edit Student"><Edit2 size={16} /></button>
                  <button className="btn-icon-glass text-error" onClick={() => handleDelete(student.id)} title="Delete Student"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="student-info">
                <h3>{student.name}</h3>
                <div className="student-meta">
                  <span><Mail size={14} /> {student.email}</span>
                  <span><Calendar size={14} /> Joined {student.joinedDate}</span>
                </div>
              </div>

              <div className="student-stats-row">
                <div className="stat-pill glass-card">
                  <BarChart2 size={16} />
                  <div className="stat-details">
                    <small>Avg. Score</small>
                    <strong>{(performanceData[student.id] as { score?: number })?.score || student.avgScore || 0}%</strong>
                  </div>
                </div>
                <div className="stat-pill glass-card">
                  <ArrowUpRight size={16} />
                  <div className="stat-details">
                    <small>Last Exam</small>
                    <strong>{(performanceData[student.id] as { examName?: string })?.examName || student.lastExam || 'No exams yet'}</strong>
                  </div>
                </div>
              </div>

              <div className="student-card-footer">
                <div className="status-badge-container">
                  <div className={`status-badge ${student.status}`}>
                    {(student.status === 'active' || student.status === 'approved') ? <CheckCircle size={14} className="pulse-icon" /> : 
                     student.status === 'pending' ? <Calendar size={14} /> :
                     <XCircle size={14} />}
                    <span>{student.status}</span>
                  </div>
                </div>
                <button className="btn-icon-glass" title="View Detailed Report"><BarChart2 size={18} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <StudentModal 
            student={editingStudent} 
            onSave={handleSaveStudent} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .student-management {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 12px var(--spacing-lg);
          border-radius: var(--radius-xl);
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text-current);
          font-size: 0.9375rem;
          width: 100%;
        }

        .search-bar input:focus { outline: none; }

        .filter-group {
          display: flex;
          gap: var(--spacing-md);
        }

        .compact-select {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 8px 16px;
          border-radius: var(--radius-lg);
        }

        .compact-select select {
          background: none;
          border: none;
          color: var(--text-current);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          width: auto;
        }

        .student-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
        }

        .student-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .student-card:hover {
          transform: translateY(-8px);
        }

        .student-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-top-actions {
          display: flex;
          gap: 8px;
        }

        .student-avatar-group {
          position: relative;
        }

        .student-avatar-ring {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          padding: 4px;
          background: var(--primary-gradient);
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
        }

        .student-avatar-ring img {
          width: 100%;
          height: 100%;
          border-radius: 17px;
          background: var(--surface-current);
          object-fit: cover;
        }

        .status-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid var(--surface-current);
        }

        .status-dot.active { background: var(--success); }
        .status-dot.inactive { background: var(--text-tertiary); }
        
        .status-dot.active.pulse {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .pulse-icon {
          animation: pulse-opacity 2s infinite;
        }

        @keyframes pulse-opacity {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          gap: 6px;
        }

        .status-badge.inactive {
          background: rgba(100, 116, 139, 0.1);
          color: var(--text-tertiary);
          gap: 6px;
        }

        .student-info h3 {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0 0 8px;
        }

        .student-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--text-tertiary);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .student-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .student-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 10px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
        }

        .stat-pill svg { color: #6366f1; }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-details small {
          font-size: 0.625rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }

        .stat-details strong {
          font-size: 0.8125rem;
          font-weight: 800;
        }

        .student-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-current);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .status-badge.active, .status-badge.approved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.inactive { background: rgba(100, 116, 139, 0.1); color: var(--text-tertiary); }

        .pending-count-badge {
          background: #f59e0b;
          color: white;
          padding: 8px 14px;
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 0.8125rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-approve-success {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--success);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          transition: all 0.2s;
        }

        .btn-approve-success:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner-tiny {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .text-primary { color: #6366f1; }
        .text-error { color: var(--error); }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5000;
          padding: 20px;
        }

        .student-modal {
          width: 100%;
          max-width: 500px;
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-current);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .input-group input, .input-group select {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-current);
          border-radius: var(--radius-md);
          padding: 12px;
          color: var(--text-current);
          font-size: 1rem;
          transition: all 0.2s;
        }

        .input-group input:focus, .input-group select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .btn-cancel {
          background: none;
          border: 1px solid var(--border-current);
          color: var(--text-current);
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 768px) {
          .management-header {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

interface StudentModalProps {
  student: UserProfile | null;
  onSave: (data: Partial<UserProfile> & { password?: string }) => void;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    password: '',
    status: student?.status || 'active' as 'active' | 'inactive' | 'pending' | 'approved'
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="student-modal glass-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{student ? 'Edit Student' : 'New Student'}</h2>
          <button className="close-btn" onClick={onClose} title="Close"><X size={24} /></button>
        </div>

        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@example.com"
            />
          </div>
          {!student && (
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Set initial password"
              />
            </div>
          )}
          <div className="input-group">
            <label>Account Status</label>
            <select 
              title="Select status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'pending' | 'approved' })}
            >
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-glow">
              {student ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default StudentManagement;
