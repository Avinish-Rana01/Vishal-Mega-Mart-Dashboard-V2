import React from 'react';
import { APP_INFO } from '../../config/constants';

import vyaptiLogo from '../../assets/vyapti_logo.png';

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
        {/* <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 2px' }}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg> */}
        <span>by</span>
        <img 
          src={vyaptiLogo} 
          alt="TeCMi Vyapti" 
          style={{ width: '50px', marginLeft: '6px', objectFit: 'contain' }} 
        />
      </div>
    </footer>
  );
}
