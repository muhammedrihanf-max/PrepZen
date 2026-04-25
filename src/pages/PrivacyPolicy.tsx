import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card legal-content"
      >
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: April 25, 2026</p>
        
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, participate in exams, or contact support. This includes your name and email address.</p>
        </section>

        <section>
          <h2>2. How We Use Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including personalize your experience and provide exam results analytics.</p>
        </section>

        <section>
          <h2>3. Cookies and Advertising</h2>
          <p>We use cookies to enhance your experience. We also use third-party services like Google AdSense to serve advertisements. These services may use cookies to serve ads based on your previous visits to our website or other websites on the Internet.</p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
        </section>

        <section>
          <h2>5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@prepzen.com.</p>
        </section>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
