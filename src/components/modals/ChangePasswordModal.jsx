import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Eye, EyeOff, Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { changePassword } from '../../services/authService';
import './ChangePasswordModal.css';

export default function ChangePasswordModal({ isOpen = false, onClose, userName }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('New password must be at least 3 characters long.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('New password cannot be identical to the current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await changePassword(userName, currentPassword, newPassword);

      if (res && res.success) {
        setSuccessMsg(res.message || 'Password changed successfully!');
        setTimeout(() => {
          onClose();
        }, 1400);
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

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;

  const modalNode = (
    <div 
      className="vmm-pw-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="vmm-pw-modal">
        {/* Header */}
        <div className="vmm-pw-header">
          <div className="vmm-pw-header-title">
            <div className="vmm-pw-icon-pod">
              <KeyRound size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3>Change Password</h3>
              <p>Update credentials for <strong>{userName || 'User'}</strong></p>
            </div>
          </div>
          <button 
            type="button" 
            className="vmm-pw-close-btn" 
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="vmm-pw-form">
          {/* Status Messages */}
          {errorMsg && (
            <div className="vmm-pw-alert error">
              <AlertCircle size={16} className="vmm-alert-icon" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="vmm-pw-alert success">
              <ShieldCheck size={16} className="vmm-alert-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="vmm-pw-field">
            <label htmlFor="currentPassword">
              Current Password <span className="req-star">*</span>
            </label>
            <div className="vmm-pw-input-wrapper">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading || Boolean(successMsg)}
                required
              />
              <button
                type="button"
                className="vmm-pw-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex="-1"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="vmm-pw-field">
            <label htmlFor="newPassword">
              New Password <span className="req-star">*</span>
            </label>
            <div className="vmm-pw-input-wrapper">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Enter at least 3 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || Boolean(successMsg)}
                required
              />
              <button
                type="button"
                className="vmm-pw-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex="-1"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="vmm-pw-field">
            <label htmlFor="confirmPassword">
              Confirm New Password <span className="req-star">*</span>
              {isMatching && (
                <span className="vmm-pw-match-badge">
                  <Check size={12} strokeWidth={3} /> Matches
                </span>
              )}
            </label>
            <div className="vmm-pw-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading || Boolean(successMsg)}
                required
              />
              <button
                type="button"
                className="vmm-pw-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="vmm-pw-actions">
            <button
              type="button"
              className="vmm-pw-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vmm-pw-submit-btn"
              disabled={isLoading || Boolean(successMsg)}
            >
              {isLoading ? (
                <>
                  <span className="vmm-pw-spinner" /> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
