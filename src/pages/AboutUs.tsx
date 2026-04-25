import React from 'react';
import { motion } from 'framer-motion';

const AboutUs: React.FC = () => {
  return (
    <div className="legal-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card legal-content"
      >
        <h1>About PrepZen</h1>
        <p className="tagline">Empowering Minds, One Exam at a Time.</p>
        
        <section>
          <h2>Our Mission</h2>
          <p>PrepZen is dedicated to providing high-quality mock exams and study resources to help students achieve their academic and professional goals. Our platform is built on the principles of accessibility, excellence, and technology.</p>
        </section>

        <section>
          <h2>Why Choose PrepZen?</h2>
          <ul>
            <li>Comprehensive question banks created by experts.</li>
            <li>Real-time performance analytics and feedback.</li>
            <li>Premium, focused interface optimized for learning.</li>
            <li>Secure and reliable platform for all user roles.</li>
          </ul>
        </section>

        <section>
          <h2>Our Story</h2>
          <p>Founded in 2026, PrepZen started as a small project to help students prepare for competitive exams. Today, it has grown into a premium platform used by thousands of students and teachers worldwide.</p>
        </section>
      </motion.div>
    </div>
  );
};

export default AboutUs;
