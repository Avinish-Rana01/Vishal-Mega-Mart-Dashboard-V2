import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  LogOut, 
  ArrowRight
} from 'lucide-react';
import { changePassword } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './MandatoryPasswordChange.css';

export default function MandatoryPasswordChange({ userName }) {
  const { logout, markPasswordChanged } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Live validation rules
  const hasMinLength = newPassword.length >= 3;
  const isDifferent = Boolean(newPassword && currentPassword && newPassword !== currentPassword);
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  // Strength score: 0 to 3
  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    if (newPassword.length < 3) return 1;
    if (newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[a-zA-Z]/.test(newPassword)) return 3;
    if (newPassword.length >= 6) return 2;
    return 1;
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return 'Create a strong password';
    if (strengthScore === 1) return 'Weak password';
    if (strengthScore === 2) return 'Good password';
    return 'Strong password';
  }, [newPassword, strengthScore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your initial temporary password.');
      return;
    }
    if (!hasMinLength) {
      setErrorMsg('New password must be at least 3 characters long.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('New password cannot be identical to the temporary password.');
      return;
    }
    if (!isMatching) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await changePassword(userName, currentPassword, newPassword);

      if (res && res.success) {
        setSuccessMsg(res.message || 'Password changed successfully! Redirecting...');
        setTimeout(() => {
          markPasswordChanged();
        }, 1200);
      } else {
        setErrorMsg(res?.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Error occurred while updating password.';
      setErrorMsg(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable security requirements checklist
  const renderRequirementsPanel = (extraClass = '') => (
    <div className={`vmm-pw-requirements-panel ${extraClass}`}>
      <div className="vmm-pw-req-header">
        <ShieldCheck size={14} className="vmm-req-header-icon" />
        <span>SECURITY REQUIREMENTS</span>
      </div>

      <div className="vmm-pw-req-list">
        <div className={`vmm-pw-req-item ${hasMinLength ? 'met' : ''}`}>
          <CheckCircle2 size={14} className="vmm-req-check-icon" />
          <span>At least 3 characters</span>
        </div>

        <div className={`vmm-pw-req-item ${isDifferent ? 'met' : ''}`}>
          <FileText size={14} className="vmm-req-check-icon" />
          <span>Different from temporary password</span>
        </div>

        <div className={`vmm-pw-req-item ${isMatching ? 'met' : ''}`}>
          <ShieldCheck size={14} className="vmm-req-check-icon" />
          <span>Confirm password matches</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vmm-pw-viewport">
      <div className="vmm-pw-card-box">
        {/* ================= LEFT COLUMN: HERO STORE & SECURITY ================= */}
        <div className="vmm-pw-hero-column">
          {/* Background image overlay */}
          <div className="vmm-pw-hero-bg-image" />
          <div className="vmm-pw-hero-bg-overlay" />

          <div className="vmm-pw-hero-content">
            {/* Top Row: Logo & Security Gateway Badge */}
            <div className="vmm-pw-hero-top">
              <div className="vmm-pw-logo-plate">
                <img 
                  src="/assets/images/vishal_mega_mart.png" 
                  alt="Vishal Mega Mart" 
                  className="vmm-pw-hero-logo" 
                />
              </div>

              <div className="vmm-pw-gateway-badge">
                <ShieldCheck size={14} className="vmm-gw-icon" />
                <span>SECURITY GATEWAY</span>
              </div>
            </div>

            {/* Center Body Pod */}
            <div className="vmm-pw-hero-center-body">
              {/* Glowing Center Shield Icon */}
              <div className="vmm-pw-shield-display">
                <div className="vmm-pw-shield-ring">
                  <div className="vmm-pw-shield-core">
                    <Shield size={38} className="vmm-shield-svg" strokeWidth={2.2} />
                    <Lock size={18} className="vmm-lock-inset" strokeWidth={2.4} />
                  </div>
                </div>
              </div>

              {/* Main Title & User Welcome */}
              <div className="vmm-pw-hero-heading-block">
                <h2 className="vmm-pw-hero-title">
                  Mandatory<br />
                  <span className="vmm-pw-highlight-text">Password Setup</span>
                </h2>
                <p className="vmm-pw-hero-text">
                  Welcome, <strong>{userName}</strong>. For account protection, you must replace your temporary credentials before accessing the system.
                </p>
              </div>

              {/* Security Requirements Checklist Card (Desktop) */}
              {renderRequirementsPanel('vmm-pw-req-desktop')}
            </div>

            {/* Footer Encryption Badge */}
            <div className="vmm-pw-hero-footer">
              <span className="vmm-pw-lock-emoji">🔒</span>
              <span>256-bit Encrypted Session</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CRISP WHITE FORM ================= */}
        <div className="vmm-pw-form-column">
          <div className="vmm-pw-form-inner">
            {/* Step Breadcrumb Header */}
            <div className="vmm-pw-form-meta">
              <span className="vmm-pw-step-tag">ACCOUNT SECURITY</span>
              <span className="vmm-pw-step-sep">/</span>
              <span className="vmm-pw-step-num">STEP 01</span>
            </div>

            <h1 className="vmm-pw-form-title">Set new credentials</h1>
            <p className="vmm-pw-form-subtitle">
              Replace your temporary password to securely access the system.
            </p>

            {/* Error / Success Banners */}
            {errorMsg && (
              <div className="vmm-pw-toast error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="vmm-pw-toast success">
                <Check size={15} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Security Requirements Checklist Card (Mobile) */}
            {renderRequirementsPanel('vmm-pw-req-mobile')}

            <form onSubmit={handleSubmit} className="vmm-pw-input-form" autoComplete="off">
              {/* Field 1: Temporary / Current Password */}
              <div className="vmm-pw-input-group">
                <label className="vmm-pw-input-label">Temporary / current password</label>
                <div className="vmm-pw-box">
                  <Lock size={16} className="vmm-pw-box-icon" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="vmm-pw-text-field"
                    placeholder="Enter temporary password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="vmm-pw-box-eye"
                    onClick={() => setShowCurrent(!showCurrent)}
                    tabIndex={-1}
                    title={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="vmm-pw-field-hint">Use the password provided to you.</div>
              </div>

              {/* Field 2: New Secure Password */}
              <div className="vmm-pw-input-group">
                <label className="vmm-pw-input-label">New secure password</label>
                <div className="vmm-pw-box">
                  <Lock size={16} className="vmm-pw-box-icon" />
                  <input
                    type={showNew ? "text" : "password"}
                    className="vmm-pw-text-field"
                    placeholder="Create new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="vmm-pw-box-eye"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                    title={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="vmm-pw-strength-row">
                  <div className="vmm-pw-strength-bars">
                    <div className={`vmm-pw-bar-segment ${strengthScore >= 1 ? 'active' : ''}`} />
                    <div className={`vmm-pw-bar-segment ${strengthScore >= 2 ? 'active' : ''}`} />
                    <div className={`vmm-pw-bar-segment ${strengthScore >= 3 ? 'active' : ''}`} />
                  </div>
                  <span className="vmm-pw-strength-text">{strengthLabel}</span>
                </div>

                <div className="vmm-pw-field-hint">
                  Use at least 3 characters and avoid using your temporary password.
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div className="vmm-pw-input-group">
                <label className="vmm-pw-input-label">Confirm new password</label>
                <div className="vmm-pw-box">
                  <Lock size={16} className="vmm-pw-box-icon" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="vmm-pw-text-field"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="vmm-pw-box-eye"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    title={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="vmm-pw-field-hint">Both passwords must match.</div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                className="vmm-pw-action-btn"
                disabled={isLoading || !currentPassword || !hasMinLength || !isDifferent || !isMatching}
              >
                <span>{isLoading ? 'Updating credentials...' : 'Save password & enter system'}</span>
                <ArrowRight size={16} className="vmm-pw-arrow-glyph" />
              </button>
            </form>

            {/* Sign Out Cancel Link */}
            <div className="vmm-pw-cancel-wrapper">
              <button
                type="button"
                className="vmm-pw-cancel-link"
                onClick={logout}
                disabled={isLoading}
              >
                <LogOut size={14} />
                <span>Sign out & cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
