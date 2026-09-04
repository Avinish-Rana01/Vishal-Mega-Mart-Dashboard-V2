import React from 'react';
import { APP_INFO } from '../../config/constants';

export default function Footer() {
  return (
    <footer className="vmm-footer">
      <div className="vmm-footer-left">
        <span className="copyright">&copy; {APP_INFO.DEFAULT_YEAR} {APP_INFO.COMPANY}</span>
        <span className="dot">•</span>
        <span>All Rights Reserved</span>
        <span className="dot">•</span>
        <span className="version">v{APP_INFO.VERSION}</span>
      </div>
      <div className="vmm-footer-right">
        <span>Designed & Developed </span>
        <span>by</span>
        <img 
          src="/assets/images/vyapti_logo.png" 
          alt="TeCMi Vyapti" 
          style={{ width: '50px', marginLeft: '6px', objectFit: 'contain' }} 
        />
      </div>
    </footer>
  );
}
