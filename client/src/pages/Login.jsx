import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, GraduationCap, BookOpen, Users, BarChart3, User } from 'lucide-react';

// Inject global styles for login page (keyframes + placeholder can't be inline)
const LOGIN_STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-slow { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
  .erp-input::placeholder { color: rgba(255,255,255,0.2); }
  .erp-input:focus { outline: none; }
  .erp-input { color-scheme: dark; }
  .erp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(99,102,241,0.5); }
  .erp-submit:active:not(:disabled) { transform: translateY(0px); }
`;

const authSchema = zod.object({
  name: zod.string().optional(),
  email: zod.string().email({ message: 'Invalid email address' }),
  password: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const FEATURES = [
  { icon: BookOpen, label: 'Academic Management' },
  { icon: Users, label: 'Student & Staff Portal' },
  { icon: BarChart3, label: 'Analytics & Reports' },
];

export default function Login() {
  useEffect(() => {
    const el = document.getElementById('erp-login-styles');
    if (!el) {
      const style = document.createElement('style');
      style.id = 'erp-login-styles';
      style.textContent = LOGIN_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById('erp-login-styles');
      if (el) el.remove();
    };
  }, []);
  const [portal, setPortal] = useState('institutional'); // 'institutional' or 'student'
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(authSchema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isSignUp) {
        if (!data.name || data.name.trim().length < 2) {
          setErrorMessage('Full name must be at least 2 characters');
          setIsLoading(false);
          return;
        }
        const response = await api.post('/auth/signup', {
          name: data.name,
          email: data.email,
          password: data.password
        });
        const { accessToken, data: responseData } = response.data;
        loginStore(responseData.user, accessToken);
        navigate('/');
      } else {
        const response = await api.post('/auth/login', data);
        const { accessToken, data: responseData } = response.data;
        loginStore(responseData.user, accessToken);
        navigate('/');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      {/* Subtle grid overlay */}
      <div style={styles.grid} />

      <div style={styles.container}>
        {/* Left branding panel (desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={styles.brandPanel}
        >
          <div style={styles.brandInner}>
            <div style={styles.logoWrap}>
              <GraduationCap size={36} color="#fff" />
            </div>
            <h1 style={styles.brandTitle}>ERP-EDU</h1>
            <p style={styles.brandSubtitle}>
              The all-in-one education management platform for modern schools and institutions.
            </p>

            <div style={styles.featureList}>
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} style={styles.featureItem}>
                  <div style={styles.featureIcon}>
                    <Icon size={16} color="#818cf8" />
                  </div>
                  <span style={styles.featureLabel}>{label}</span>
                </div>
              ))}
            </div>

            <div style={styles.statsRow}>
              {[
                { value: '50K+', label: 'Students' },
                { value: '200+', label: 'Schools' },
                { value: '99.9%', label: 'Uptime' },
              ].map((s) => (
                <div key={s.label} style={styles.statItem}>
                  <span style={styles.statValue}>{s.value}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right login form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          style={styles.formPanel}
        >
          {/* Logo mark for mobile */}
          <div style={styles.mobileLogo}>
            <GraduationCap size={28} color="#fff" />
          </div>

          {/* Portal Selection Tabs */}
          <div style={styles.portalTabs}>
            <button
              type="button"
              onClick={() => {
                setPortal('institutional');
                setErrorMessage('');
              }}
              style={portal === 'institutional' ? styles.portalTabActive : styles.portalTab}
            >
              Institutional Login
            </button>
            <button
              type="button"
              onClick={() => {
                setPortal('student');
                setErrorMessage('');
              }}
              style={portal === 'student' ? styles.portalTabActive : styles.portalTab}
            >
              Student Login
            </button>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {portal === 'institutional' ? 'Institutional Portal' : 'Student Portal'}
            </h2>
            <p style={styles.formSubtitle}>
              {isSignUp ? 'Create a new account' : 'Sign in to your workspace'}
            </p>
          </div>

          {/* Auth Flow Toggle (Sign In / Sign Up) */}
          <div style={styles.authToggle}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage('');
              }}
              style={!isSignUp ? styles.toggleTabActive : styles.toggleTab}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage('');
              }}
              style={isSignUp ? styles.toggleTabActive : styles.toggleTab}
            >
              Create Account
            </button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.errorBox}
              >
                <span style={styles.errorDot} />
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrap}>
                  <User size={16} color="#6b7280" style={styles.inputIcon} />
                  <input
                    id="signup-name"
                    type="text"
                    {...register('name')}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="erp-input"
                    style={styles.input}
                    onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                    onBlur={(e) => Object.assign(e.target.style, styles.input)}
                  />
                </div>
                {errors.name && <span style={styles.fieldError}>{errors.name.message}</span>}
              </div>
            )}

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <Mail size={16} color="#6b7280" style={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  {...register('email')}
                  placeholder={portal === 'student' ? 'student@school.com' : 'you@school.com'}
                  autoComplete="email"
                  className="erp-input"
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
              </div>
              {errors.email && <span style={styles.fieldError}>{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <Lock size={16} color="#6b7280" style={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="erp-input"
                  style={{ ...styles.input, paddingRight: '44px' }}
                  onFocus={(e) => Object.assign(e.target.style, { ...styles.inputFocus, paddingRight: '44px' })}
                  onBlur={(e) => Object.assign(e.target.style, { ...styles.input, paddingRight: '44px' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                </button>
              </div>
              {errors.password && <span style={styles.fieldError}>{errors.password.message}</span>}
            </div>

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="erp-submit"
              style={isLoading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
            >
              {isLoading ? (
                <div style={styles.spinner} />
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>

          <p style={styles.footerText}>
            Secured with end-to-end encryption &amp; 2FA support
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #0a1628 70%, #050510 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '55%',
    height: '55%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  blob3: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30%',
    height: '30%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    filter: 'blur(50px)',
    pointerEvents: 'none',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '900px',
    margin: '24px',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    position: 'relative',
    zIndex: 1,
  },
  brandPanel: {
    flex: '1',
    background: 'linear-gradient(145deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.12) 50%, rgba(59,130,246,0.08) 100%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: '32px 36px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backdropFilter: 'blur(20px)',
    // Hide on very small screens handled via inline media simulation
  },
  brandInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  logoWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: '1.7',
    margin: '0 0 24px 0',
    maxWidth: '280px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '24px',
  },
  featureItem: {    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(129,140,248,0.12)',
    border: '1px solid rgba(129,140,248,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    paddingTop: '18px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  statItem: {    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#818cf8',
    letterSpacing: '-0.5px',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formPanel: {
    flex: '1',
    background: 'rgba(10,10,30,0.85)',
    backdropFilter: 'blur(24px)',
    padding: '32px 36px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mobileLogo: {
    display: 'none', // would show on mobile with real CSS
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
  },
  formHeader: {
    marginBottom: '16px',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
    letterSpacing: '-0.4px',
  },
  formSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    fontSize: '13px',
    fontWeight: '500',
    overflow: 'hidden',
  },
  errorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ef4444',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '42px',
    paddingRight: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputFocus: {
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.5)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '42px',
    paddingRight: '16px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    fontSize: '11px',
    color: '#f87171',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: '2px',
    width: '100%',
    padding: '11px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.2px',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
    transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
  },
  dividerText: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    whiteSpace: 'nowrap',
  },
  bootstrapBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: '12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    fontFamily: 'inherit',
  },
  bootstrapBtnHover: {
    width: '100%',
    padding: '11px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(52,211,153,0.25)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
  },
  footerText: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.2)',
  },
  portalTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    background: 'rgba(255,255,255,0.03)',
    padding: '4px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  portalTab: {
    flex: 1,
    padding: '10px 6px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  portalTabActive: {
    flex: 1,
    padding: '10px 6px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
  },
  authToggle: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '14px',
  },
  toggleTab: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '6px 2px',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  toggleTabActive: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 2px',
    borderBottom: '2px solid #6366f1',
  },
};
