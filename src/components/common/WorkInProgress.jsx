import React from 'react';
import { motion } from 'framer-motion';

export default function WorkInProgress({
  title = "Work in Progress",
  message = "We're engineering a more powerful, insightful, and dynamic analytics experience for this section. Hang tight!",
  version = "V2.0"
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '24px',
      // border: '1px dashed #cbd5e1',
      margin: '0',
      padding: '40px',
      // boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
      border: 'solid 1px #e2e8f0'
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        style={{
          width: '72px',
          height: '72px',
          background: '#eff6ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
          marginBottom: '24px',
          boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.2)'
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </motion.div>

      <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em', textAlign: 'center' }}>
        {title}
      </h3>
      <p style={{ fontSize: '15px', color: '#64748b', textAlign: 'center', maxWidth: '420px', lineHeight: '1.6', marginBottom: '28px' }}>
        {message}
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
          />
          Work in Progress
        </span>
        {version && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
            {version}
          </span>
        )}
      </div>
    </div>
  );
}
