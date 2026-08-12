import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DevelopmentInProgressPage.css';

export default function DevelopmentInProgressPage({ title = "Development in Progress" }) {
  const navigate = useNavigate();

  return (
    <div className="dev-in-progress-container">
      {/* Background massive text */}
      <div className="dev-in-progress-bg-text">
        In Progress
      </div>

      {/* Main content */}
      <div className="dev-in-progress-content">
        <div className="dev-in-progress-eyebrow">Work in Progress</div>
        <h1 className="dev-in-progress-title">{title}</h1>
        <p className="dev-in-progress-desc">
          This section is currently under development. <br />
          Please check back later for updates.
        </p>
        <button 
          className="dev-in-progress-btn"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
