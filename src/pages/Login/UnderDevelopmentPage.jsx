import React from 'react';
import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import './UnderDevelopmentPage.css';

export default function UnderDevelopmentPage() {
  // Generate random particles for background effect
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="dev-page-container">
      {/* Background Gradient */}
      <div className="dev-background-gradient"></div>

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="dev-particle"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear"
          }}
        />
      ))}

      {/* Main Content Card */}
      <motion.div
        className="dev-content-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="dev-icon-container"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <div className="dev-icon-wrapper">
            <Code2 size={48} strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.h1 
          className="dev-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Site Under Development
        </motion.h1>

        <motion.p 
          className="dev-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          We are currently building something amazing! <br />
          The backend API is not deployed yet, but you will soon be able to access the full application here. Stay tuned for updates.
        </motion.p>

        {/* Animated Progress Bar */}
        <motion.div 
          className="dev-progress-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className="dev-progress-bar"
            initial={{ width: "0%" }}
            animate={{ width: "65%" }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Footer / Author signature */}
      <motion.div 
        className="dev-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path>
        </svg>
        <p>Github - <span>Avinish Rana</span></p>
      </motion.div>
    </div>
  );
}
