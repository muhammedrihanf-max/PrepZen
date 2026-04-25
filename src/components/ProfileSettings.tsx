import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Check, User, Mail, Lock, Venus, Mars } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/storage';

interface ProfileSettingsProps {
  onClose: () => void;
}

const DEFAULT_AVATARS = {
  male: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Arlo',
  ],
  female: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Sasha',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Willow',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Lily',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Zoe',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Maya',
  ],
  other: [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Shadow',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Zen',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Nova',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Spark',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Cosmo',
    'https://api.dicebear.com/7.x/avataaars/png?seed=River',
  ]
};

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    gender: user?.gender || 'other' as const,
    photoURL: user?.photoURL || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarSelect = (url: string) => {
    setFormData(prev => ({ ...prev, photoURL: url }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        setUploading(true);
        const path = `user_avatars/${user.uid}_${Date.now()}`;
        const downloadURL = await uploadFile(path, file);
        setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      } catch (error) {
        alert("Failed to upload image. Please check your connection.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      updateProfile({
        displayName: formData.displayName,
        gender: formData.gender,
        photoURL: formData.photoURL
      });
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="profile-modal-card glass-card"
      >
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button onClick={onClose} className="btn-icon-glass" title="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-top-section">
            <div className="avatar-preview-container">
              <div className="main-avatar-view">
                {uploading ? (
                  <div className="avatar-placeholder"><div className="spinner-mini" /></div>
                ) : formData.photoURL ? (
                  <img src={formData.photoURL} alt="Profile" className="current-avatar" />
                ) : (
                  <div className="avatar-placeholder"><User size={48} /></div>
                )}
                <button 
                  type="button" 
                  className="upload-trigger" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Photo"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  hidden 
                  accept="image/*" 
                  title="Upload avatar photo"
                />
              </div>
              <p className="avatar-hint">Click camera to upload or choose below</p>
            </div>

            <div className="form-fields-grid">
              <div className="input-group">
                <label htmlFor="user-display-name"><User size={16} /> Display Name</label>
                <input 
                  id="user-display-name"
                  name="user-display-name"
                  type="text" 
                  value={formData.displayName}
                  onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your Name"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="input-group">
                <label><Mail size={16} /> Email Address</label>
                <input type="email" value={user?.email || ''} disabled className="disabled-input" title="Email address (cannot be changed)" autoComplete="username" />
              </div>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="avatar-selector-section">
            <label>Gender & Quick Avatars</label>
            <div className="gender-toggle">
              <button 
                type="button" 
                className={formData.gender === 'male' ? 'active' : ''}
                onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                title="Male"
              >
                <Mars size={18} /> Male
              </button>
              <button 
                type="button" 
                className={formData.gender === 'female' ? 'active' : ''}
                onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                title="Female"
              >
                <Venus size={18} /> Female
              </button>
              <button 
                type="button" 
                className={formData.gender === 'other' ? 'active' : ''}
                onClick={() => setFormData(p => ({ ...p, gender: 'other' }))}
                title="Other"
              >
                Other
              </button>
            </div>

            <motion.div 
              className="avatar-gallery" 
              title="Select a default avatar"
              initial="hidden"
              animate="visible"
              key={formData.gender}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {DEFAULT_AVATARS[formData.gender as keyof typeof DEFAULT_AVATARS].map(url => (
                <motion.div 
                  key={url} 
                  className={`avatar-option ${formData.photoURL === url ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(url)}
                  title="Choose this avatar"
                  variants={{
                    hidden: { scale: 0.8, opacity: 0 },
                    visible: { scale: 1, opacity: 1 }
                  }}
                >
                  <img src={url} alt="Avatar Option" />
                  {formData.photoURL === url && <div className="selected-check"><Check size={12} /></div>}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="section-divider"></div>

          <div className="password-section">
            <label><Lock size={16} /> Change Password</label>
            <div className="form-fields-grid">
              <input 
                type="password" 
                name="new-prof-pass"
                placeholder="New Password" 
                value={formData.newPassword}
                onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                title="Enter new password"
                autoComplete="new-password"
              />
              <input 
                type="password" 
                name="conf-prof-pass"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                title="Confirm new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-glass" disabled={saving || uploading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
            padding: var(--spacing-md);
          }

          .profile-modal-card {
            width: 100%;
            max-width: 600px;
            padding: var(--spacing-xl);
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            z-index: 5001;
            margin: auto;
            background: rgba(15, 12, 41, 0.98);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-xl);
          }

          .modal-header h2 { margin: 0; font-size: 1.5rem; }

          .profile-top-section {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: var(--spacing-xl);
            margin-bottom: var(--spacing-lg);
          }

          .avatar-preview-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-sm);
          }

          .main-avatar-view {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: var(--surface-current);
            border: 4px solid var(--border-current);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
          }

          .current-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }

          .avatar-placeholder { color: var(--text-tertiary); }
          .spinner-mini {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top: 2px solid #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .upload-trigger {
            position: absolute;
            bottom: 0;
            right: 0;
            background: var(--primary-gradient);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
            transition: transform 0.2s;
          }

          .upload-trigger:hover { transform: scale(1.1); }

          .avatar-hint {
            font-size: 0.75rem;
            color: var(--text-tertiary);
            text-align: center;
            line-height: 1.4;
          }

          .form-fields-grid {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .input-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8125rem;
            font-weight: 700;
            color: var(--text-tertiary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .input-group input, .password-section input {
            width: 100%;
            background: var(--surface-current);
            border: 1px solid var(--border-current);
            padding: 12px 16px;
            border-radius: var(--radius-md);
            color: var(--text-current);
            transition: border-color 0.2s;
          }

          .input-group input:focus {
            border-color: #6366f1;
            outline: none;
          }

          .disabled-input { opacity: 0.6; cursor: not-allowed; }

          .section-divider {
            height: 1px;
            background: var(--border-current);
            margin: var(--spacing-xl) 0;
          }

          .avatar-selector-section label, .password-section label {
            display: block;
            font-weight: 700;
            margin-bottom: var(--spacing-md);
          }

          .gender-toggle {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-lg);
          }

          .gender-toggle button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: var(--surface-current);
            border: 1px solid var(--border-current);
            padding: 10px;
            border-radius: var(--radius-md);
            color: var(--text-tertiary);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .gender-toggle button:hover {
            border-color: var(--text-tertiary);
            background: rgba(255, 255, 255, 0.02);
          }

          .gender-toggle button.active {
            background: rgba(99, 102, 241, 0.1);
            border-color: #6366f1;
            color: #6366f1;
            transform: scale(1.05);
          }

          .avatar-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: var(--spacing-md);
          }

          .avatar-option {
            position: relative;
            aspect-ratio: 1;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid transparent;
            cursor: pointer;
            padding: 4px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .avatar-option:hover { 
            border-color: rgba(99, 102, 241, 0.5); 
            transform: translateY(-4px) scale(1.1);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            z-index: 10;
            background: rgba(255, 255, 255, 0.15);
          }
          .avatar-option.selected { 
            border-color: #6366f1; 
            background: rgba(99, 102, 241, 0.15); 
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
          }

          .avatar-option img {
            width: 100%;
            height: 100%;
            border-radius: 8px;
          }

          .selected-check {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #6366f1;
            color: white;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--bg-current);
          }

          .modal-footer {
            margin-top: var(--spacing-xl);
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
            padding-top: var(--spacing-lg);
            border-top: 1px solid var(--border-current);
          }

          @media (max-width: 480px) {
            .profile-top-section {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSettings;
