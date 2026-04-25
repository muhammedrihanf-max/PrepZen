import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/AccessDenied.css';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="access-denied-container">
      {/* Background blobs for visual depth */}
      <motion.div 
        className="blob blob-1"
        style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(80px)', borderRadius: '50%', top: '20%', left: '10%' }}
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div 
        className="access-denied-content glass-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
      >
        <motion.div 
          className="access-denied-icon"
          initial={{ rotate: -15, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <ShieldAlert size={48} />
        </motion.div>
        
        <div className="access-denied-text">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Access Denied
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            It looks like you don't have the permissions required to enter this sector. 
            If you believe this is a mistake, please reach out to your administrator.
          </motion.p>
        </div>

        <div className="access-denied-actions">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)} 
            className="btn-glass-primary"
            style={{ width: '100%', marginBottom: '12px' }}
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </motion.button>
          
          <motion.div
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             style={{ width: '100%' }}
          >
            <Link to="/" className="btn-glass" style={{ display: 'flex', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
              <Home size={18} />
              <span>Return to Safety</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
