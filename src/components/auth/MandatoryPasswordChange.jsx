import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Check, AlertCircle, LogOut } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your initial temporary password.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('New password must be at least 3 characters long.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('New password cannot be identical to the temporary password.');
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

  return (
    <div className="vmm-mandatory-pw-page">
      <div className="vmm-mandatory-pw-card">
        {/* Header */}
        <div className="vmm-mandatory-pw-header">
          <img 
            src="/assets/images/vishal_mega_mart.png" 
            alt="Vishal Mega Mart" 
            className="vmm-mandatory-logo" 
          />
          <div className="vmm-mandatory-icon-pod">
            <ShieldAlert size={28} strokeWidth={2.2} />
          </div>
          <h2>Mandatory Password Change</h2>
          <p>
            Welcome, <strong>{userName}</strong>! For account security, you must replace your initial default password before accessing the system.
          </p>
        </div>

        {/* Form Body */}
        <div className="vmm-mandatory-pw-body">
          {errorMsg && (
            <div className="vmm-mandatory-alert error">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="vmm-mandatory-alert success">
              <Check size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="vmm-mandatory-form-group">
              <label className="vmm-mandatory-label">Current / Temporary Password</label>
              <div className="vmm-mandatory-input-box">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="vmm-mandatory-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  className="vmm-mandatory-toggle-icon"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="vmm-mandatory-form-group">
              <label className="vmm-mandatory-label">New Password</label>
              <div className="vmm-mandatory-input-box">
                <input
                  type={showNew ? "text" : "password"}
                  className="vmm-mandatory-input"
                  placeholder="Create new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="vmm-mandatory-toggle-icon"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="vmm-mandatory-hint">Must be at least 3 characters long.</div>
            </div>

            <div className="vmm-mandatory-form-group">
              <label className="vmm-mandatory-label">Confirm New Password</label>
              <div className="vmm-mandatory-input-box">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="vmm-mandatory-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="vmm-mandatory-toggle-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="vmm-mandatory-submit-btn"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              <KeyRound size={18} />
              <span>{isLoading ? 'Updating Credentials...' : 'Save Password & Enter System'}</span>
            </button>
          </form>

          <div className="vmm-mandatory-logout-row">
            <button
              type="button"
              className="vmm-mandatory-logout-btn"
              onClick={logout}
              disabled={isLoading}
            >
              <LogOut size={14} />
              <span>Sign Out and Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
