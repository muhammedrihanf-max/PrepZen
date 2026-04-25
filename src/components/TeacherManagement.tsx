import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserPlus, Mail, Calendar, 
  CheckCircle, XCircle, Edit2, 
  Trash2, BookOpen, Briefcase, X
} from 'lucide-react';
import { subscribeToTeachers, updateUserProfile, deleteUserProfile, createTeacherAccount, type UserProfile } from '../services/users';

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToTeachers((data) => {
      setTeachers(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this teacher? All associated exam data will remain, but the teacher will lose access.')) {
      try {
        await deleteUserProfile(id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleSaveTeacher = async (data: Partial<UserProfile> & { password?: string }) => {
    if (editingTeacher) {
      try {
        await updateUserProfile(editingTeacher.id, data);
      } catch (err) {
        console.error("Update failed:", err);
      }
    } else {
      try {
        await createTeacherAccount(
          data.email!,
          data.password!,
          data.name!,
          data.department!
        );
      } catch (err: any) {
        console.error("Provision failed:", err);
        alert(`Failed to create teacher account: ${err.message}`);
      }
    }
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  return (
    <div className="teacher-management">
      <header className="management-header">
        <div className="search-bar glass-card">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search teachers by name, email or department..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary-glow" onClick={() => { setEditingTeacher(null); setIsModalOpen(true); }}>
          <UserPlus size={20} />
          <span>Invite Teacher</span>
        </button>
      </header>

      <div className="teacher-grid">
        <AnimatePresence mode="popLayout">
          {filteredTeachers.map((teacher, index) => (
            <motion.div 
              key={teacher.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="teacher-card premium-card"
            >
              <div className="teacher-card-header">
                <div className="teacher-avatar-wrapper">
                  <div className="teacher-avatar-ring">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/png?seed=${teacher.avatarSeed || teacher.name}`} 
                      alt={teacher.name} 
                    />
                  </div>
                  <div className={`status-dot ${teacher.isOnline ? 'active' : 'inactive'} pulse`} />
                </div>
                <div className="card-top-actions">
                  <button className="btn-icon-glass text-primary" onClick={() => { setEditingTeacher(teacher); setIsModalOpen(true); }} title="Edit Teacher"><Edit2 size={16} /></button>
                  <button className="btn-icon-glass text-error" onClick={() => handleDelete(teacher.id)} title="Remove Teacher"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="teacher-info">
                <div className="teacher-info-header">
                  <h3>{teacher.name}</h3>
                  {teacher.department && <span className="department-tag">{teacher.department}</span>}
                </div>
                <div className="teacher-meta">
                  <div className="meta-item"><Mail size={14} /> <span>{teacher.email}</span></div>
                  <div className="meta-item"><Calendar size={14} /> <span>Partner since {teacher.joinedDate}</span></div>
                </div>
              </div>

              <div className="teacher-stats-row">
                <div className="stat-pill-premium">
                  <BookOpen size={18} />
                  <div className="stat-details">
                    <small>Exams Created</small>
                    <strong>{teacher.coursesCount || 0}</strong>
                  </div>
                </div>
                <div className="stat-pill-premium">
                  <Briefcase size={18} />
                  <div className="stat-details">
                    <small>Access Level</small>
                    <strong>Standard</strong>
                  </div>
                </div>
              </div>

              <div className="teacher-card-footer">
                <div className={`status-badge-premium ${teacher.status}`}>
                  {teacher.status === 'active' ? <CheckCircle size={14} className="pulse-icon" /> : <XCircle size={14} />}
                  <span>{teacher.status}</span>
                </div>
                <button className="btn-activity">View Activity</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TeacherModal 
            teacher={editingTeacher} 
            onSave={handleSaveTeacher} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .teacher-management {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .teacher-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: var(--spacing-lg);
        }

        .teacher-card {
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .teacher-card:hover {
          transform: translateY(-8px);
        }

        .teacher-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .teacher-avatar-wrapper {
          position: relative;
        }

        .teacher-avatar-ring {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          padding: 4px;
          background: var(--primary-gradient);
          position: relative;
          z-index: 1;
        }

        .teacher-avatar-ring img {
          width: 100%;
          height: 100%;
          border-radius: 19px;
          background: var(--surface-current);
        }

        .card-top-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .teacher-info-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .department-tag {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        .teacher-info h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-current);
          letter-spacing: -0.02em;
        }

        .teacher-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 12px 0;
          border-top: 1px solid rgba(255,255,255,0.03);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .teacher-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 4px 0;
        }

        .stat-pill-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          min-width: 0;
          transition: all 0.2s;
        }

        .stat-pill-premium:hover {
          background: rgba(15, 23, 42, 0.5);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .stat-pill-premium svg {
          color: #6366f1;
          flex-shrink: 0;
        }

        .teacher-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(255,255,255,0.03);
        }

        .status-badge-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .status-badge-premium.active {
          color: #10b981;
        }

        .status-badge-premium.inactive {
          color: var(--text-tertiary);
        }

        .btn-activity {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-activity:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 12px 20px;
          border-radius: 14px;
        }

        .search-bar input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          color: var(--text-current);
          font-size: 0.95rem;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          min-width: 0;
        }

        .stat-pill svg {
          color: #6366f1;
          flex-shrink: 0;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
        }

        .stat-details small {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-details strong {
          font-size: 1rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

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
        }

        .status-badge.inactive {
          background: rgba(100, 116, 139, 0.1);
          color: var(--text-tertiary);
        }

        /* --- Teacher Modal Styles --- */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .modal-header h2 {
          font-size: 1.5rem;
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
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
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

        .input-group input,
        .input-group select {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-current);
          border-radius: var(--radius-lg);
          color: var(--text-current);
          padding: 12px 16px;
          font-size: 0.9375rem;
          width: 100%;
          box-sizing: border-box;
        }

        .modal-footer {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-current);
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-current);
          color: var(--text-current);
          padding: 10px 20px;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }

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
          z-index: 6000;
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
      `}</style>
    </div>
  );
};

interface TeacherModalProps {
  teacher: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => void;
  onClose: () => void;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ teacher, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    password: '',
    department: teacher?.department || '',
    status: (teacher?.status || 'active') as 'active' | 'inactive' | 'pending'
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher && !formData.password.trim()) {
      setError('Password is required for new accounts');
      return;
    }
    setError('');
    onSave(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="student-modal glass-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{teacher ? 'Edit Teacher' : 'Invite New Teacher'}</h2>
          <button className="close-btn" onClick={onClose} title="Close"><X size={24} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div className="input-group">
            <label>Teacher Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name with title"
            />
          </div>
          <div className="input-group">
            <label>Institution Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@prepzen.com"
              disabled={!!teacher}
            />
          </div>
          {!teacher && (
            <div className="input-group">
              <label>Initial Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
          )}
          <div className="input-group">
            <label>Department</label>
            <input 
              type="text" 
              required
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Theoretical Physics"
            />
          </div>
          <div className="input-group">
            <label>Account Status</label>
            <select 
              title="Select status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-glow">
              {teacher ? 'Update Profile' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TeacherManagement;
