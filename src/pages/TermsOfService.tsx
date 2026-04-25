import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService: React.FC = () => {
  return (
    <div className="legal-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card legal-content"
      >
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: April 25, 2026</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using PrepZen, you agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h2>2. Use of Services</h2>
          <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.</p>
        </section>

        <section>
          <h2>3. Intellectual Property</h2>
          <p>The content, features, and functionality of PrepZen are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
        </section>

        <section>
          <h2>4. Limitation of Liability</h2>
          <p>In no event shall PrepZen be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the services.</p>
        </section>

        <section>
          <h2>5. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page.</p>
        </section>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
