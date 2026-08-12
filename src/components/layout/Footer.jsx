import React from 'react';
import { APP_INFO } from '../../config/constants';

export default function Footer() {
  return (
    <footer className="vmm-footer">
      <div>
        Copyright &copy; {APP_INFO.DEFAULT_YEAR}. {APP_INFO.COMPANY} | All Rights Reserved | V {APP_INFO.VERSION}
      </div>
      <div className="vmm-footer-right">
        <span>Designed & Developed by</span>
        <span className="vmm-vyapti-tag">{APP_INFO.DEVELOPER}</span>
      </div>
    </footer>
  );
}
