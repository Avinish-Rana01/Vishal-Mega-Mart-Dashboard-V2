import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      {/* Background massive text */}
      <div className="not-found-bg-text">
        404 404 404
      </div>

      {/* Main content */}
      <div className="not-found-content">
        <div className="not-found-eyebrow">404 Not Found</div>
        <h1 className="not-found-title">Oops! Page Not Found</h1>
        <p className="not-found-desc">
          The page you are looking for doesn't exist. Click<br />
          button below to go to the homepage.
        </p>
        <button 
          className="not-found-btn"
          onClick={() => navigate('/dashboard')}
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
}
