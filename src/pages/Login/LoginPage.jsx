import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO } from '../../config/constants';
import { loginUser, requestPasswordReset, changePassword } from '../../services/authService';
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Key } from 'lucide-react';
import './LoginPage.css';


export default function LoginPage() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'change'
  
  // Login State
  const [username, setUsername] = useState('Admin');
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

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleFocus = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSuccessMsg('');
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
    
    try {
      const response = await loginUser(username, password);
      login(response);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      setErrors({ form: 'Invalid username or password. Please try again.' });
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
      setSuccessMsg('Password changed successfully.');
      setTimeout(() => setView('login'), 3000);
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
                <p className="login-subtitle" style={{ marginBottom: '24px', color: '#666' }}>Welcome back! Please enter your details.</p>
                
                <form onSubmit={handleLoginSubmit}>
                  <div className="login-form-group">
                    <div className="login-input-wrapper">
                      <span className="login-input-wrapper-label">User Name</span>
                      <input
                        type="text"
                        className="login-input"
                        placeholder="Enter your email address"
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
                  
                  <div className="login-action-row">
                    <button type="button" className="login-link" onClick={() => setView('forgot')}>
                      Forgot your password?
                    </button>
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
                  {successMsg && <div style={{ color: '#16a34a', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}
                  
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
                  {successMsg && <div style={{ color: '#16a34a', fontSize: '13px', marginBottom: '16px' }}>{successMsg}</div>}
                  
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
    </div>
  );
}
