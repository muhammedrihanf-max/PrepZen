import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, X, Send, ExternalLink, Globe } from 'lucide-react';
import '../styles/ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for reaching out! Muhammed Rihan will get back to you soon.');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="contact-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="contact-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="contact-modal-header">
              <div className="contact-modal-title">
                <div className="contact-modal-title-icon">
                  <Mail size={20} />
                </div>
                <div>
                  <h2>Contact Us</h2>
                  <p>Have questions or feedback? We'd love to hear from you.</p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={onClose} title="Close Modal">
                <X size={20} />
              </button>
            </div>

            <div className="contact-modal-body">
              <div className="contact-info-section">
                <h3>Get in touch</h3>
                <p>Our team is here to help. Reach out with any questions about our free PDF tools.</p>

                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-card-icon">
                      <Mail size={20} />
                    </div>
                    <div className="info-card-details">
                      <span>Email Us</span>
                      <strong>muhammedrihanf@gmail.com</strong>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-card-icon">
                      <MapPin size={20} />
                    </div>
                    <div className="info-card-details">
                      <span>Location</span>
                      <strong>Worldwide / Open Source</strong>
                    </div>
                  </div>
                </div>

                <div className="social-links">
                  <a 
                    href="https://github.com/muhammedrihanf-max" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-btn"
                    title="Visit GitHub Portfolio"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/muhammed-rihanf/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-btn"
                    title="Connect on LinkedIn"
                  >
                    <Globe size={20} />
                  </a>
                </div>
              </div>

              <div className="contact-form-section">
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="contact-name">Name</label>
                    <input id="contact-name" type="text" placeholder="John Doe" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Email</label>
                    <input id="contact-email" type="email" placeholder="john@example.com" required />
                  </div>

                  <div className="form-group full">
                    <label htmlFor="contact-topic">Topic</label>
                    <select id="contact-topic" title="Select Inquiry Topic" required>
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="business">Business Proposal</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label htmlFor="contact-message">Message</label>
                    <textarea 
                      id="contact-message"
                      rows={4} 
                      placeholder="How can we help you?" 
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-btn">
                    <span>Send Message</span>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
