import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserPlus, Mail, Calendar, 
  CheckCircle, XCircle, Edit2, 
  Trash2, Shield, ShieldAlert, X
} from 'lucide-react';
import { subscribeToStaff, updateUserProfile, deleteUserProfile, createStaffAccount, type UserProfile } from '../services/users';

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToStaff((data) => {
      setStaff(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member? They will lose all administrative access immediately.')) {
      try {
        await deleteUserProfile(id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleSaveStaff = async (data: Partial<UserProfile> & { password?: string }) => {
    if (editingStaff) {
      try {
        await updateUserProfile(editingStaff.id, data);
      } catch (err) {
        console.error('Update failed:', err);
      }
    } else {
      try {
        await createStaffAccount(
          data.email!,
          data.password!,
          data.name!,
          data.role as string
        );
      } catch (err: any) {
        console.error('Provision failed:', err);
        alert(`Failed to create account: ${err.message}`);
      }
    }
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  return (
    <div className="staff-management">
      <header className="management-header">
        <div className="search-bar glass-card">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search staff by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary-glow" onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}>
          <UserPlus size={20} />
          <span>Provision Staff</span>
        </button>
      </header>

      <div className="staff-grid">
        <AnimatePresence mode="popLayout">
          {filteredStaff.map((member, index) => (
            <motion.div 
              key={member.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="staff-card premium-card"
            >
              <div className="staff-card-header">
                <div className="staff-avatar-wrapper">
                  <div className="staff-avatar-ring">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/png?seed=${member.avatarSeed || member.name}`} 
                      alt={member.name} 
                    />
                  </div>
                  <div className={`status-dot ${member.isOnline ? 'active' : 'inactive'} pulse`} />
                </div>
                <div className="card-top-actions">
                  <button className="btn-icon-glass text-primary" onClick={() => { setEditingStaff(member); setIsModalOpen(true); }} title="Edit Role"><Edit2 size={16} /></button>
                  <button className="btn-icon-glass text-error" onClick={() => handleDelete(member.id)} title="Revoke Access"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="staff-info">
                <div className="staff-info-header">
                  <h3>{member.name}</h3>
                  <div className={`role-badge ${member.role}`}>
                    {member.role === 'management' ? <ShieldAlert size={14} /> : <Shield size={14} />}
                    <span>{member.role}</span>
                  </div>
                </div>
                <div className="staff-meta">
                  <div className="meta-item"><Mail size={14} /> <span>{member.email}</span></div>
                  <div className="meta-item"><Calendar size={14} /> <span>Joined {member.joinedDate}</span></div>
                </div>
              </div>

              <div className="staff-card-footer">
                <div className={`status-badge-premium ${member.status}`}>
                  {member.status === 'active' ? <CheckCircle size={14} className="pulse-icon" /> : <XCircle size={14} />}
                  <span>{member.status}</span>
                </div>
                <button className="btn-permissions">Permissions</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <StaffModal 
            staff={editingStaff} 
            onSave={handleSaveStaff} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .staff-management {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .management-header {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
          gap: var(--spacing-xl);
          padding: var(--spacing-lg) 0;
          border-bottom: 1px solid var(--border-current);
          margin-bottom: var(--spacing-xl);
        }

        .search-bar {
          flex: 1;
          max-width: 650px;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 14px var(--spacing-lg);
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-current);
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text-current);
          font-size: 0.9375rem;
          width: 100%;
        }

        .search-bar input:focus { outline: none; }

        .staff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: var(--spacing-xl);
        }

        .staff-card {
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .staff-card:hover {
          transform: translateY(-8px);
        }

        .staff-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .staff-avatar-wrapper {
          position: relative;
        }

        .staff-avatar-ring {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          padding: 4px;
          background: var(--primary-gradient);
          position: relative;
          z-index: 1;
        }

        .staff-avatar-ring img {
          width: 100%;
          height: 100%;
          border-radius: 17px;
          background: var(--surface-current);
        }

        .card-top-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .staff-info-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        .role-badge.management {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .role-badge.admin {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .staff-info h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-current);
          letter-spacing: -0.02em;
        }

        .staff-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 12px 0;
          border-top: 1px solid rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          transition: color 0.2s;
        }

        .meta-item:hover {
          color: var(--text-current);
        }

        .staff-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-lg);
          margin-top: 4px;
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

        .btn-permissions {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-permissions:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        /* --- Staff Modal Styles --- */
        .student-modal {
          width: 100%;
          max-width: 480px;
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .modal-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
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
          flex-shrink: 0;
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
          transition: border-color 0.2s;
        }

        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .modal-footer {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
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
          transition: all 0.2s;
        }

        .btn-cancel:hover {
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

        .status-badge.active { color: var(--success); }
        .status-badge.inactive { color: var(--text-tertiary); }

      `}</style>
    </div>
  );
};

interface StaffModalProps {
  staff: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => void;
  onClose: () => void;
}

const StaffModal: React.FC<StaffModalProps> = ({ staff, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    role: (staff?.role || 'admin') as 'admin' | 'management',
    status: (staff?.status || 'active') as 'active' | 'inactive'
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff && !formData.password.trim()) {
      setError('Password is required for new accounts');
      return;
    }
    if (!staff && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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
          <h2>{staff ? 'Edit Staff Profile' : 'Provision New Staff'}</h2>
          <button className="close-btn" onClick={onClose} title="Close"><X size={24} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Admin User"
            />
          </div>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@prepzen.com"
              disabled={!!staff}
            />
          </div>
          {!staff && (
            <div className="input-group">
              <label>Password</label>
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
            <label>Administrative Role</label>
            <select 
              title="Select Role"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'management' })}
            >
              <option value="admin">Platform Administrator</option>
              <option value="management">Management Executive</option>
            </select>
          </div>
          <div className="input-group">
            <label>Account Status</label>
            <select 
              title="Select Status"
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
              {staff ? 'Update Staff Member' : 'Provision Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default StaffManagement;
