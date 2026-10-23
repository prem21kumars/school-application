import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/api';
import type { User, UserRole } from '../../types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  School,
  XCircle,
  Shield,
  Sparkles,
  Send,
  RefreshCw,
  Clock,
  ArrowLeft
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login, isBackendConnected, users, resetForgottenPassword, resetAllUsersPasswords } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isParentLogin, setIsParentLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password OTP flow state: 'request' -> 'verify' -> 'new_password' -> 'success'
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [targetAccount, setTargetAccount] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotNewEmail, setForgotNewEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotModalError, setForgotModalError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);
  const [otpSentViaSmtp, setOtpSentViaSmtp] = useState(false);
  const [maskedEmailNotice, setMaskedEmailNotice] = useState('');

  // Timer for resend verification code cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Mask email for privacy display
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart[0]}*@${domain}`;
    return `${userPart.slice(0, 2)}${'*'.repeat(Math.max(3, userPart.length - 2))}@${domain}`;
  };

  // Auto-detect role hint based on current input
  const getDetectedRoleHint = (): { role: UserRole | 'unknown'; title: string; color: string; badgeClass: string; icon: React.ReactNode } => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return { role: 'unknown', title: 'Single Sign-On', color: '#4f46e5', badgeClass: 'badge-primary', icon: <School size={16} /> };

    if (isParentLogin) {
      return { role: 'parent', title: 'Parent & Guardian Portal', color: '#d97706', badgeClass: 'badge-warning', icon: <Users size={16} /> };
    }

    const matched = users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.enrolmentNumber && u.enrolmentNumber.toLowerCase() === clean)
    );

    if (matched) {
      switch (matched.role) {
        case 'principal':
          return { role: 'principal', title: 'School Administration Dashboard', color: '#7c3aed', badgeClass: 'badge-purple', icon: <ShieldCheck size={16} /> };
        case 'teacher':
          return { role: 'teacher', title: 'Faculty & Teacher Workbench', color: '#4f46e5', badgeClass: 'badge-primary', icon: <BookOpen size={16} /> };
        case 'student':
          return { role: 'student', title: 'Student Examination Desk', color: '#059669', badgeClass: 'badge-success', icon: <GraduationCap size={16} /> };
        case 'parent':
          return { role: 'parent', title: 'Parent Academic Progress Portal', color: '#d97706', badgeClass: 'badge-warning', icon: <Users size={16} /> };
      }
    }

    if (clean.startsWith('enr-') || /^\d+$/.test(clean)) {
      return { role: 'student', title: 'Student Examination Desk', color: '#059669', badgeClass: 'badge-success', icon: <GraduationCap size={16} /> };
    }

    if (clean.includes('principal') || clean.includes('admin')) {
      return { role: 'principal', title: 'School Administration Dashboard', color: '#7c3aed', badgeClass: 'badge-purple', icon: <ShieldCheck size={16} /> };
    }

    return { role: 'teacher', title: 'Faculty / Staff Account', color: '#4f46e5', badgeClass: 'badge-primary', icon: <BookOpen size={16} /> };
  };

  const detected = getDetectedRoleHint();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email address or student enrolment ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const explicitRole: UserRole | undefined = isParentLogin ? 'parent' : undefined;
      const res = await login(identifier.trim(), password, explicitRole);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Server connection failed. Backend is offline.');
    }
  };

  
  const handleResetAllToDefaults = async () => {
    setResetAllLoading(true);
    setForgotModalError('');
    try {
      const res = await resetAllUsersPasswords();
      setResetAllLoading(false);
      if (res.success) {
        setSuccessMessage('All institutional user accounts have been reset to defaults (Principal: admin, Teachers: teach, Students & Parents: pass).');
        setShowForgotPasswordModal(false);
      } else {
        setForgotModalError(res.message || 'Failed to reset all passwords.');
      }
    } catch (err: any) {
      setResetAllLoading(false);
      setForgotModalError(err?.message || 'Error occurred resetting all passwords.');
    }
  };

  const handleOpenForgotPassword = () => {
    setForgotStep('request');
    setForgotIdentifier(identifier.trim());
    setTargetAccount(null);
    setVerificationCode('');
    setEnteredCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotModalError('');
    setShowForgotPasswordModal(true);
  };

  // Step 1: Send Verification Code to Email via Backend
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = forgotIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setForgotModalError('Please enter your registered institutional email or student enrolment ID.');
      return;
    }

    setForgotLoading(true);
    setForgotModalError('');

    try {
      // Connect to Spring Boot backend API to generate and dispatch OTP email
      const res = await ApiService.sendOtp(cleanId);
      setForgotLoading(false);

      if (!res.success) {
        setForgotModalError(res.message || 'Failed to dispatch verification code from backend.');
        return;
      }

      setOtpSentViaSmtp(!!res.sentViaSmtp);
      setMaskedEmailNotice(res.maskedEmail || res.email || cleanId);

      // Locate user account in store or use details returned by backend
      let found = users.find(u => 
        u.email.toLowerCase() === (res.email || cleanId).toLowerCase() || 
        (u.enrolmentNumber && u.enrolmentNumber.toLowerCase() === cleanId)
      );

      if (!found && res.userId) {
        found = {
          id: res.userId,
          name: res.name || 'User',
          email: res.email || cleanId,
          role: (res.role as any) || 'student',
          status: 'active'
        };
      }

      setTargetAccount(found || null);
      setVerificationCode(res.devPreviewCode || '');
      setForgotStep('verify');
      setResendCooldown(60);
      setEnteredCode('');
    } catch (err: any) {
      setForgotLoading(false);
      setForgotModalError(err?.message || 'Failed to connect to backend email server. Please ensure Spring Boot is running.');
    }
  };

  // Step 2: Verify the Code with Backend API
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = enteredCode.trim();
    if (!cleanCode) {
      setForgotModalError('Please enter the 6-digit verification code.');
      return;
    }

    setForgotLoading(true);
    setForgotModalError('');

    try {
      const cleanId = (targetAccount?.email || forgotIdentifier).trim().toLowerCase();
      const res = await ApiService.verifyOtp(cleanId, cleanCode);
      setForgotLoading(false);

      if (!res.success) {
        setForgotModalError(res.message || 'Invalid verification code. Please check your email.');
        return;
      }

      setForgotModalError('');
      setForgotNewEmail(targetAccount?.email || '');
      setForgotStep('new_password');
    } catch (err: any) {
      setForgotLoading(false);
      setForgotModalError(err?.message || 'Failed to verify code with backend server.');
    }
  };

  // Step 3: Save the New Password and/or Updated Email
  const handleSaveNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;

    if (!forgotNewPassword) {
      setForgotModalError('Please enter a new password.');
      return;
    }
    if (forgotNewPassword.length < 3) {
      setForgotModalError('Password must be at least 3 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotModalError('New password and confirmation do not match.');
      return;
    }

    const cleanEmail = forgotNewEmail.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes('@')) {
      setForgotModalError('Please provide a valid email address.');
      return;
    }

    setForgotLoading(true);
    setForgotModalError('');

    try {
      const isEmailChanged = cleanEmail && cleanEmail !== targetAccount.email.toLowerCase();
      const res = await resetForgottenPassword(
        targetAccount.email || targetAccount.enrolmentNumber || '', 
        forgotNewPassword, 
        targetAccount.role,
        isEmailChanged ? cleanEmail : undefined
      );
      setForgotLoading(false);
      if (res.success) {
        setForgotStep('success');
        const finalLoginId = isEmailChanged ? cleanEmail : (targetAccount.email || targetAccount.enrolmentNumber || '');
        setIdentifier(finalLoginId);
        setPassword(forgotNewPassword);
        setSuccessMessage(`Credentials updated for ${targetAccount.name}! You may now sign in with your new password.`);
      } else {
        setForgotModalError(res.message || 'Failed to update credentials in database.');
      }
    } catch (err: any) {
      setForgotLoading(false);
      setForgotModalError(err?.message || 'Server error occurred during update.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #faf5ff 100%)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      
      {/* Main Single Sign-On Container */}
      <div style={{ width: '920px', maxWidth: '100%', margin: 'auto 0' }}>
        
        {/* Offline Warning Banner */}
        {!isBackendConnected && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '0.875rem',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#9f1239',
            fontSize: '0.875rem',
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)'
          }}>
            <AlertCircle size={20} color="#e11d48" style={{ flexShrink: 0 }} />
            <div>
              <strong>Backend Service Notice:</strong> Spring Boot backend at <code>http://localhost:8080</code> is unreachable. Authentication requires active backend service.
            </div>
          </div>
        )}

        {/* Unified Login Card with 2-Column Split Layout */}
        <div 
          className="glass-panel" 
          style={{ 
            background: '#ffffff',
            borderRadius: '1.5rem', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.1)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
          }}
        >
          {/* Left Column: Academic Branding & Role Auto-Detection Info */}
          <div style={{ 
            padding: '3rem 2.5rem', 
            background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '2rem'
          }}>
            <div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.12)', 
                padding: '0.35rem 0.85rem', 
                borderRadius: '9999px',
                marginBottom: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Sparkles size={14} color="#a5b4fc" />
                <span>Single Sign-On Workspace</span>
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '0.75rem', color: '#ffffff' }}>
                One Login for All Roles & Workspaces
              </h2>
              <p style={{ color: '#c7d2fe', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Simply enter your registered email or student enrolment number. AcademiQ automatically determines whether you are a Principal, Teacher, Student, or Parent and launches your dashboard.
              </p>

              {/* Supported User Roles Directory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '0.625rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ padding: '0.4rem', background: 'rgba(124, 58, 237, 0.4)', borderRadius: '6px' }}>
                    <ShieldCheck size={16} color="#e9d5ff" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>Principal & Admin</span>
                    <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>Executive governance & teacher management</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '0.625rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ padding: '0.4rem', background: 'rgba(79, 70, 229, 0.4)', borderRadius: '6px' }}>
                    <BookOpen size={16} color="#c7d2fe" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>Teacher & Faculty</span>
                    <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>Paper generator, offline OCR evaluation & students</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '0.625rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ padding: '0.4rem', background: 'rgba(5, 150, 105, 0.4)', borderRadius: '6px' }}>
                    <GraduationCap size={16} color="#a7f3d0" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>Student Assessment Desk</span>
                    <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>Timed examinations, live quizzes & scorecards</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '0.625rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ padding: '0.4rem', background: 'rgba(217, 119, 6, 0.4)', borderRadius: '6px' }}>
                    <Users size={16} color="#fde68a" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block' }}>Parent & Guardian</span>
                    <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>Official printable progress reports & academic marks</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#c7d2fe' }}>
              <Shield size={14} color="#a5b4fc" />
              <span>JWT Cookie Authentication & Role-Based Access Control</span>
            </div>
          </div>

          {/* Right Column: The Unified Login Form */}
          <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className={`badge ${detected.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
                  {detected.icon} {detected.title}
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Sign In to Your Workspace
              </h1>
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.35rem' }}>
                Enter your institutional credentials below to enter your portal.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.625rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.625rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Username / Email / Enrolment ID */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.825rem' }}>
                  Institutional Email or Student Enrolment ID
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }}>
                    <Mail size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={identifier} 
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage('');
                    }} 
                    placeholder="e.g. name@oakridge.edu or ENR-2026-101" 
                    required 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                  Faculty/Admin use institutional email; Students & Parents use Enrolment ID.
                </span>
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.825rem' }}>
                    Password / Passcode
                  </label>
                  <button 
                    type="button" 
                    onClick={handleOpenForgotPassword}
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }} 
                    placeholder="Enter account password" 
                    required 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options: Remember Me & Parent Gateway Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <span>Keep session active</span>
                </label>

                {identifier.toUpperCase().startsWith('ENR-') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#d97706', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={isParentLogin} 
                      onChange={(e) => setIsParentLogin(e.target.checked)} 
                    />
                    <span>Sign in as Parent/Guardian</span>
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-primary btn-lg" 
                style={{ 
                  width: '100%', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.925rem'
                }}
              >
                {isLoading ? (
                  'Verifying Credentials...'
                ) : (
                  <>
                    <Lock size={16} /> Sign In & Enter Dashboard <ArrowRight size={16} />
                  </>
                )}
              </button>

            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Need help accessing your account? Contact your School Administrator or ICT Desk.
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          SECURE 3-STEP EMAIL VERIFICATION CODE (OTP) RESET MODAL
          ======================================================== */}
      {showForgotPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '480px', maxWidth: '95vw', padding: '2rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={22} color="#4f46e5" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Reset Account Password
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForgotPasswordModal(false)} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            {forgotStep !== 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: forgotStep === 'request' ? 800 : 500, color: forgotStep === 'request' ? '#4f46e5' : '#64748b' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: forgotStep === 'request' ? '#4f46e5' : '#e2e8f0', color: forgotStep === 'request' ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>1</span>
                  <span>Identify</span>
                </div>
                <span style={{ color: '#cbd5e1' }}>&rarr;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: forgotStep === 'verify' ? 800 : 500, color: forgotStep === 'verify' ? '#4f46e5' : '#64748b' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: forgotStep === 'verify' ? '#4f46e5' : '#e2e8f0', color: forgotStep === 'verify' ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>2</span>
                  <span>Verify Code</span>
                </div>
                <span style={{ color: '#cbd5e1' }}>&rarr;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: forgotStep === 'new_password' ? 800 : 500, color: forgotStep === 'new_password' ? '#4f46e5' : '#64748b' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: forgotStep === 'new_password' ? '#4f46e5' : '#e2e8f0', color: forgotStep === 'new_password' ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>3</span>
                  <span>New Password</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {forgotModalError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', padding: '0.625rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{forgotModalError}</span>
              </div>
            )}

            {/* ==========================================
                STEP 1: REQUEST VERIFICATION CODE
                ========================================== */}
            {forgotStep === 'request' && (
              <form onSubmit={handleSendVerificationCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Enter your registered institutional email address or student enrolment ID. Supports all roles (Principal, Teacher, Student, Parent).
                </p>

                {/* Quick Role Fill Presets for All Users */}
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quick Select Any User Account:
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => { setForgotIdentifier('principal@oakridge.edu'); setForgotModalError(''); }}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', borderRadius: '1rem', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', cursor: 'pointer', fontWeight: 600 }}
                    >
                      👑 Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotIdentifier('sarah.jenkins@oakridge.edu'); setForgotModalError(''); }}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', borderRadius: '1rem', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', cursor: 'pointer', fontWeight: 600 }}
                    >
                      👩‍🏫 Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotIdentifier('ENR-2026-101'); setForgotModalError(''); }}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', borderRadius: '1rem', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotIdentifier('carlos.rivera@gmail.com'); setForgotModalError(''); }}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', borderRadius: '1rem', border: '1px solid #fef08a', background: '#fefce8', color: '#854d0e', cursor: 'pointer', fontWeight: 600 }}
                    >
                      👨‍👩‍👧 Parent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem' }}>
                    Registered Email or Student Enrolment ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
                    <input 
                      type="text" 
                      value={forgotIdentifier} 
                      onChange={(e) => {
                        setForgotIdentifier(e.target.value);
                        setForgotModalError('');
                      }} 
                      placeholder="e.g. sarah.jenkins@oakridge.edu or ENR-2026-101" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPasswordModal(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {forgotLoading ? (
                      'Locating Account...'
                    ) : (
                      <>
                        <Send size={15} /> Send Verification Code
                      </>
                    )}
                  </button>
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResetAllToDefaults}
                    disabled={resetAllLoading}
                    style={{ background: 'none', border: 'none', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={13} className={resetAllLoading ? 'animate-spin' : ''} />
                    {resetAllLoading ? 'Resetting All Accounts in Database...' : '⚡ Reset All User Accounts to Default Passwords'}
                  </button>
                </div>
              </form>
            )}

            {/* ==========================================
                STEP 2: ENTER & VERIFY 6-DIGIT OTP CODE
                ========================================== */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Real Backend Email Dispatch Alert */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)', 
                  border: '1px solid #c7d2fe', 
                  borderRadius: '0.75rem', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} color="#4f46e5" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e1b4b' }}>
                        Verification Code Dispatched via Backend!
                      </span>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      {otpSentViaSmtp ? 'SMTP Live' : 'Backend Connected'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.775rem', color: '#4338ca', margin: 0, lineHeight: 1.4 }}>
                    A 6-digit security code was generated and dispatched by the Spring Boot server to{' '}
                    <strong>{maskedEmailNotice || (targetAccount ? maskEmail(targetAccount.email) : forgotIdentifier)}</strong> for account{' '}
                    <strong>{targetAccount?.name}</strong>.
                  </p>

                  {otpSentViaSmtp ? (
                    <div style={{
                      marginTop: '0.25rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#065f46'
                    }}>
                      📬 <strong>Real email sent:</strong> Please check your email inbox (and Spam/Junk folder) for the verification code.
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '0.25rem',
                      background: '#ffffff', 
                      border: '1px dashed #818cf8', 
                      borderRadius: '0.5rem', 
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block' }}>
                          Backend Server Generated Code:
                        </span>
                        <span style={{ fontSize: '0.675rem', color: '#64748b' }}>
                          (Logged on Spring Boot console / SMTP ready)
                        </span>
                      </div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                        {verificationCode}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem', textAlign: 'center', display: 'block' }}>
                    Enter 6-Digit Verification Code
                  </label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={enteredCode} 
                    onChange={(e) => {
                      setEnteredCode(e.target.value.replace(/\D/g, ''));
                      setForgotModalError('');
                    }} 
                    placeholder="• • • • • •" 
                    required 
                    autoFocus
                    className="form-input" 
                    style={{ 
                      fontSize: '1.75rem', 
                      letterSpacing: '0.6rem', 
                      textAlign: 'center', 
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '0.6rem 1rem',
                      color: '#0f172a'
                    }}
                  />
                </div>

                {/* Resend Cooldown & Helper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setForgotStep('request')} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <ArrowLeft size={13} /> Change Email
                  </button>

                  {resendCooldown > 0 ? (
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} /> Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleSendVerificationCode()} 
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <RefreshCw size={13} /> Resend Code
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPasswordModal(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle2 size={16} /> Verify Code & Proceed
                  </button>
                </div>
              </form>
            )}

            {/* ==========================================
                STEP 3: ENTER NEW PASSWORD
                ========================================== */}
            {forgotStep === 'new_password' && (
              <form onSubmit={handleSaveNewPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Identity Verified Badge */}
                <div style={{ 
                  background: '#ecfdf5', 
                  border: '1px solid #a7f3d0', 
                  borderRadius: '0.75rem', 
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{ padding: '0.35rem', background: '#d1fae5', borderRadius: '50%' }}>
                    <CheckCircle2 size={18} color="#059669" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', display: 'block' }}>
                      Identity Confirmed: {targetAccount?.name}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#047857' }}>
                      Role: {targetAccount?.role.toUpperCase()} • {targetAccount?.email}
                    </span>
                  </div>
                </div>

                {/* Optional Email Update */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem' }}>
                    Login Email Address (Username)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
                    <input 
                      type="email" 
                      value={forgotNewEmail} 
                      onChange={(e) => {
                        setForgotNewEmail(e.target.value);
                        setForgotModalError('');
                      }} 
                      placeholder="user@oakridge.edu" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    Keep your registered email or change it to a new address.
                  </span>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem' }}>New Account Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
                    <input 
                      type={showForgotNewPassword ? 'text' : 'password'} 
                      value={forgotNewPassword} 
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        setForgotModalError('');
                      }} 
                      placeholder="Enter new password" 
                      required 
                      autoFocus
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#64748b' }} />
                    <input 
                      type={showForgotNewPassword ? 'text' : 'password'} 
                      value={forgotConfirmPassword} 
                      onChange={(e) => {
                        setForgotConfirmPassword(e.target.value);
                        setForgotModalError('');
                      }} 
                      placeholder="Re-enter new password to confirm" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPasswordModal(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {forgotLoading ? (
                      'Updating Database...'
                    ) : (
                      <>
                        <Lock size={15} /> Save & Set Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ==========================================
                STEP 4: SUCCESS CONFIRMATION
                ========================================== */}
            {forgotStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: '#ecfdf5', 
                  color: '#059669',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  border: '2px solid #a7f3d0'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Password Successfully Reset!
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                  Your new credentials have been updated in the MySQL database for <strong>{targetAccount?.name}</strong>. Your login form has been pre-filled.
                </p>
                <button 
                  type="button" 
                  onClick={() => setShowForgotPasswordModal(false)} 
                  className="btn-primary btn-lg"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800 }}
                >
                  Return to Sign In & Enter Dashboard <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
