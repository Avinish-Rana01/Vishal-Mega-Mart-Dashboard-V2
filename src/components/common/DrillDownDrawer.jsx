import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './DrillDownDrawer.css';

export default function DrillDownDrawer({ isOpen, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="vmm-drawer-overlay" onClick={onClose}></div>
      <div className={`vmm-drawer-panel ${isOpen ? 'open' : ''}`}>
        <div className="vmm-drawer-header">
          <div className="vmm-drawer-header-text">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="vmm-drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="vmm-drawer-content">
          {children}
        </div>
      </div>
    </>
  );
}
