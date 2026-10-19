import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, computeDefaultRoute } from '../../context/AuthContext';
import { APP_INFO } from '../../config/constants';
import { loginUser, requestPasswordReset, changePassword } from '../../services/authService';
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Key, AlertTriangle, Store, Sparkles, X, ShieldAlert } from 'lucide-react';
import './LoginPage.css';
import UnderDevelopmentPage from './UnderDevelopmentPage';

export default function LoginPage() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'change'
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password State
  const [forgotUsername, setForgotUsername] = useState('');
  
  // Change Password State
  const [changeUsername, setChangeUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Shared State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Status Notification Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning', // 'warning' | 'welcome'
    title: '',
    badge: '',
    message: '',
    tipText: '',
    buttonText: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn, getDefaultRoute } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [isLoggedIn, getDefaultRoute, navigate]);

  useEffect(() => {
    if (location.state?.prefillUsername) {
      setUsername(location.state.prefillUsername);
    }
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFocus = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrors({ username: 'Please enter your email or username' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMsg('');
    try {
      const response = await loginUser(username, password);
      login(response);
      const targetRoute = computeDefaultRoute(response);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      const errData = err.response?.data;
      const errorCode = errData?.errorCode || errData?.ErrorCode;
      const serverMsg = errData?.message || errData?.Message || '';
      const userType = (errData?.userType || errData?.UserType || '').trim();

      const isManagerialRole = ['store admin', 'zfm', 'area manager', 'lp', 'warehouse admin', 'wh admin'].includes(userType.toLowerCase());
      const isWarehouseRole = ['warehouse', 'warehouse user'].includes(userType.toLowerCase());
      const contactTarget = isManagerialRole 
        ? 'the Super Admin' 
        : (isWarehouseRole ? 'your Warehouse Admin' : 'your Store Admin');
      const locationType = isWarehouseRole ? 'warehouse' : 'store';

      if (errorCode === 'ACCOUNT_DEACTIVATED' || serverMsg.toLowerCase().includes('deactivated')) {
        setModalConfig({
          isOpen: true,
          type: 'warning',
          title: 'Account Deactivated',
          badge: 'Access Restricted',
          message: `You are deactivated. Contact ${contactTarget} for your access.`,
          tipText: `Contact ${contactTarget} for your access.`,
          buttonText: 'Understood'
        });
      } else if (errorCode === 'NO_STORE_ASSIGNED' || serverMsg.toLowerCase().includes('no store or warehouse') || serverMsg.toLowerCase().includes('not assigned')) {
        setModalConfig({
          isOpen: true,
          type: 'welcome',
          title: 'Welcome to Vishal Mega Mart!',
          badge: isWarehouseRole ? 'Warehouse Assignment Pending' : 'Store Assignment Pending',
          message: `Welcome to the Vishal Mega Mart, You haven't assigned any ${locationType} yet. Try contacting ${contactTarget} for ${locationType} assignment.`,
          tipText: `Try contacting ${contactTarget} for ${locationType} assignment.`,
          buttonText: 'Got It, Thanks'
        });
      } else {
        setErrors({ form: serverMsg || 'Invalid username or password. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setErrors({ forgotUsername: 'Please Enter User Name or Email' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await requestPasswordReset(forgotUsername);
      setSuccessMsg('A password reset link has been sent.');
      setTimeout(() => setView('login'), 3000);
    } catch (err) {
      setErrors({ form: 'Failed to request password reset.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassSubmit = async (e) => {
    e.preventDefault();
    if (!changeUsername.trim() || !oldPassword || !newPassword) {
      setErrors({ form: 'All fields are required.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await changePassword(changeUsername, oldPassword, newPassword);
      setSuccessMsg('Password changed successfully! Please log in with your new credentials.');
      setUsername(changeUsername);
      setPassword('');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setView('login'), 1200);
    } catch (err) {
      setErrors({ form: 'Failed to change password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.3, ease: "easeIn" } }
  };

  // ==========================================
  // DEPLOYMENT TOGGLE
  // Uncomment the line below to show the "Under Development" page in production
  // return <UnderDevelopmentPage />;
  // ==========================================

    return (
      <div className="login-page-container">
        {/* Left Panel */}
        <div className="login-left-panel">
          <div className="login-vertical-text-container">
            <div className="login-vertical-text">SIGN IN</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right-panel">
          <div className="login-form-container">
            
            {/* Static Logo Above Animated Forms */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <img 
                src="/assets/images/vishal_mega_mart.png" 
                alt="Vishal Mega Mart Logo" 
                style={{ maxWidth: '360px', height: 'auto' }} 
              />
            </div>

            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.div key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="login-title-header">Sign <span>in</span></div>
                  <p className="login-subtitle" style={{ marginBottom: successMsg ? '16px' : '24px', color: '#666' }}>Welcome back! Please enter your details.</p>
                  
                  {successMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid #10B981',
                        borderRadius: '8px',
                        color: '#10B981',
                        fontSize: '13px',
                        fontWeight: '500',
                        marginBottom: '20px'
                      }}
                    >
                      <ShieldCheck size={18} style={{ flexShrink: 0, color: '#10B981' }} />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleLoginSubmit}>
                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">User Name</span>
                        <input
                          type="text"
                          className="login-input"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => handleFocus('username')}
                        />
                      </div>
                      {errors.username && <span className="login-error-text">{errors.username}</span>}
                    </div>

                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">Password</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="login-input"
                          placeholder="***************"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => handleFocus('password')}
                        />
                        {showPassword ? (
                          <EyeOff size={16} className="input-icon" onClick={() => setShowPassword(false)} />
                        ) : (
                          <Eye size={16} className="input-icon" onClick={() => setShowPassword(true)} />
                        )}
                      </div>
                      {errors.password && <span className="login-error-text">{errors.password}</span>}
                    </div>

                    {errors.form && <div className="login-error-text" style={{ marginBottom: '16px' }}>{errors.form}</div>}
                    
                    <div className="login-action-row" style={{ justifyContent: 'flex-end' }}>
                      {/* <button type="button" className="login-link" onClick={() => setView('forgot')}>
                        Forgot your password?
                      </button> */}
                      <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                      </button>
                    </div>
                    
                    {/* <div className="login-footer-text" style={{ marginTop: '24px', fontSize: '11px' }}>
                      <button type="button" className="login-link" style={{ fontSize: '11px' }} onClick={() => setView('change')}>
                        Need to change your password?
                      </button>
                    </div> */}
                  </form>
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div key="forgot" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="login-title-header">Reset <span>Password</span></div>
                  
                  <form onSubmit={handleForgotSubmit}>
                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">Email / User Name</span>
                        <input
                          type="text"
                          className="login-input"
                          placeholder="Enter your email address"
                          value={forgotUsername}
                          onChange={(e) => setForgotUsername(e.target.value)}
                          onFocus={() => handleFocus('forgotUsername')}
                        />
                        <ShieldCheck size={16} className="input-icon" />
                      </div>
                      {errors.forgotUsername && <span className="login-error-text">{errors.forgotUsername}</span>}
                    </div>

                    {errors.form && <div className="login-error-text" style={{ marginBottom: '16px' }}>{errors.form}</div>}
                    {successMsg && <div style={{ color: '#10B981', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}
                    
                    <div className="login-action-row" style={{ justifyContent: 'flex-end' }}>
                      <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <button type="button" className="login-link" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setView('login')}>
                        <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Sign In
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {view === 'change' && (
                <motion.div key="change" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="login-title-header">Change <span>Password</span></div>
                  
                  <form onSubmit={handleChangePassSubmit}>
                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">Email / User Name</span>
                        <input
                          type="text"
                          className="login-input"
                          placeholder="Enter your username"
                          value={changeUsername}
                          onChange={(e) => setChangeUsername(e.target.value)}
                          onFocus={() => handleFocus('changeUsername')}
                        />
                      </div>
                    </div>

                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">Old Password</span>
                        <input
                          type="password"
                          className="login-input"
                          placeholder="Enter old password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          onFocus={() => handleFocus('oldPassword')}
                        />
                      </div>
                    </div>

                    <div className="login-form-group">
                      <div className="login-input-wrapper">
                        <span className="login-input-wrapper-label">New Password</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="login-input"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onFocus={() => handleFocus('newPassword')}
                        />
                        <Key size={16} className="input-icon" style={{ right: '36px' }} />
                        {showPassword ? (
                          <EyeOff size={16} className="input-icon" onClick={() => setShowPassword(false)} />
                        ) : (
                          <Eye size={16} className="input-icon" onClick={() => setShowPassword(true)} />
                        )}
                      </div>
                    </div>

                    {errors.form && <div className="login-error-text" style={{ marginBottom: '16px' }}>{errors.form}</div>}
                    {successMsg && <div style={{ color: '#10B981', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}
                    
                    <div className="login-action-row" style={{ justifyContent: 'flex-end' }}>
                      <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <button type="button" className="login-link" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setView('login')}>
                        <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Sign In
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Footer */}
          <div className="login-footer-container">
            <span>Copyright &copy; {APP_INFO.DEFAULT_YEAR} | V {APP_INFO.VERSION} | {APP_INFO.COMPANY} | Designed & Developed by</span>
            <img 
              src="/assets/images/vyapti_logo.png" 
              alt="Vyapti Logo" 
              className="login-footer-logo"
            />
          </div>

        </div>

        {/* Animated Auth Status Modal (Warning for Deactivated, Welcome for Unassigned) */}
        <AnimatePresence>
          {modalConfig.isOpen && (
            <motion.div 
              className="auth-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            >
              <motion.div 
                className={`auth-modal-card ${modalConfig.type}`}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative Top Accent */}
                <div className={`auth-modal-accent-bar ${modalConfig.type}`} />

                {/* Close Button */}
                <button 
                  type="button"
                  className="auth-modal-close-btn"
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                {/* Icon Badge */}
                <div className={`auth-modal-icon-badge ${modalConfig.type}`}>
                  {modalConfig.type === 'warning' ? (
                    <ShieldAlert size={36} color="#EF5350" strokeWidth={2.2} />
                  ) : (
                    <Store size={36} color="#3B82F6" strokeWidth={2.2} />
                  )}
                </div>

                {/* Badge Chip */}
                <div className={`auth-modal-chip ${modalConfig.type}`}>
                  {modalConfig.type === 'warning' ? (
                    <AlertTriangle size={13} style={{ marginRight: '6px' }} />
                  ) : (
                    <Sparkles size={13} style={{ marginRight: '6px' }} />
                  )}
                  {modalConfig.badge}
                </div>

                {/* Title */}
                <h3 className="auth-modal-title">{modalConfig.title}</h3>

                {/* Message Body */}
                <p className="auth-modal-message">{modalConfig.message}</p>

                {/* Help Tip */}
                <div className="auth-modal-tip-box">
                  {modalConfig.type === 'warning' ? (
                    <span><strong>Need assistance?</strong> {modalConfig.tipText || 'Contact your Store Admin for your access.'}</span>
                  ) : (
                    <span><strong>Next step:</strong> {modalConfig.tipText || 'Try contacting your Store Admin for store assignment.'}</span>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  type="button"
                  className={`auth-modal-action-btn ${modalConfig.type}`}
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                >
                  {modalConfig.buttonText || 'Understood'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
}
