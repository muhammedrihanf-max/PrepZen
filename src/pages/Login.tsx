import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, GraduationCap, School, ShieldCheck, Mail } from 'lucide-react';
import '../styles/Login.css';
import ContactModal from '../components/ContactModal';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'management'>('student');
  const [staffCode, setStaffCode] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (isLogin) {
        await login(email, role, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name');
          return;
        }
        if (role !== 'student' && !staffCode.trim()) {
          setError('Staff access code is required for this role');
          return;
        }
        await register(email, password, name, role, staffCode);
        setShowSuccess(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Authentication failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="blob blob-1"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="blob blob-2"
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="login-card glass-card"
      >
        <button 
          onClick={() => setIsContactModalOpen(true)} 
          className="header-contact-btn" 
          title="Contact Us"
        >
          <Mail size={10} />
          <span>Contact Us</span>
        </button>
        <motion.div variants={itemVariants} className="login-header">
          <div className="logo-icon">
            <GraduationCap size={40} color="#6366f1" />
          </div>
          <h1>PrepZen</h1>
          <motion.p
            key={isLogin ? 'welcome' : 'signup'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {isLogin ? 'Welcome back' : 'Join the elite community'}
          </motion.p>
        </motion.div>

        <form onSubmit={handleSubmit} className="login-form">
          <motion.div variants={itemVariants} className="role-selector">
            <button 
              type="button"
              className={role === 'student' ? 'active' : ''} 
              onClick={() => { setRole('student'); setError(''); }}
            >
              <GraduationCap size={20} />
              Student
            </button>
            <button 
              type="button"
              className={role === 'teacher' ? 'active' : ''} 
              onClick={() => { setRole('teacher'); setError(''); }}
            >
              <School size={20} />
              Teacher
            </button>
            <button 
              type="button"
              className={role === 'management' ? 'active' : ''} 
              onClick={() => { setRole('management'); setError(''); }}
            >
              <ShieldCheck size={20} />
              Management
            </button>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="error-message-bg"
              style={{ 
                color: '#ef4444', 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                textAlign: 'center', 
                marginBottom: '1rem', 
                border: '1px solid rgba(239, 68, 68, 0.2)' 
              }}
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="input-group"
              >
                <label>Full Name</label>
                <div className="input-wrapper">
                  <UserPlus size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <LogIn size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                autoComplete="off"
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div 
              key="password-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="input-group"
            >
              <label>Password</label>
              <div className="input-wrapper">
                <LogIn size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  autoComplete="off"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="confirm-password-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="input-group"
              >
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </motion.div>
            )}

            {!isLogin && role !== 'student' && (
              <motion.div 
                key="staff-code-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="input-group"
              >
                <label>Staff Access Code</label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="Enter security code" 
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    required 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary login-btn"
          >
            {isLogin ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Sign Up</>}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="login-footer">
          <button onClick={() => {
            setIsLogin(!isLogin);
            setEmail('');
            setPassword('');
            setName('');
            setConfirmPassword('');
            setError('');
          }}>
            {isLogin ? "New here? Create account" : 'Already have an account? Login'}
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="copyright-attribution">
          © 2026 Muhammad Rihan. All rights reserved.
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="success-modal glass-card"
            >
              <div className="success-icon-wrapper">
                <ShieldCheck size={48} color="#22c55e" />
              </div>
              <h2>Registration Successful!</h2>
              <p>Your account has been created successfully. You can now log in with your credentials.</p>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setShowSuccess(false);
                  setIsLogin(true);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setConfirmPassword('');
                  setStaffCode('');
                }}
              >
                Okay, Let's Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .copyright-attribution {
          margin-top: 30px;
          text-align: center;
          font-size: 0.725rem;
          font-weight: 600;
          color: var(--text-tertiary);
          letter-spacing: 0.025em;
          opacity: 0.8;
        }

        .success-modal {
          max-width: 400px;
          width: 100%;
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .success-modal h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #f8fafc;
        }

        .success-modal p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .success-modal .btn-primary {
          width: 100%;
          padding: 14px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Login;
