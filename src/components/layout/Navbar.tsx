import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Bell, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  LogOut,
  School,
  KeyRound,
  XCircle,
  Mail,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    resetAllData,
    logout,
    changePassword,
    isBackendConnected
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'principal': return 'badge-purple';
      case 'teacher': return 'badge-primary';
      case 'student': return 'badge-success';
      case 'parent': return 'badge-warning';
    }
  };

  return (
    <header className="no-print" style={{ 
      background: 'rgba(255, 255, 255, 0.96)', 
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem',
      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1600px', margin: '0 auto', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Logo & School Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}>
            <School size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                Academi<span style={{ color: '#4f46e5' }}>Q</span>
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>School OS</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Oakridge International Academy</p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: isBackendConnected ? '#ecfdf5' : '#fef2f2',
            color: isBackendConnected ? '#047857' : '#b91c1c',
            border: `1px solid ${isBackendConnected ? '#a7f3d0' : '#fecaca'}`,
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 600
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isBackendConnected ? '#10b981' : '#ef4444',
              boxShadow: isBackendConnected ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
            }}></span>
            {isBackendConnected ? 'MySQL Connected' : 'Offline / Standalone'}
          </div>
        </div>

        {/* Center / Dedicated Active Workspace Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          {currentUser.role === 'principal' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#7c3aed" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Principal & School Administration</span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>AY 2025-26</span>
            </div>
          )}

          {currentUser.role === 'teacher' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} color="#4f46e5" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Faculty & Assessment Workbench</span>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Assigned Classes</span>
            </div>
          )}

          {currentUser.role === 'student' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={16} color="#059669" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Student Examination Desk</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Live Session</span>
            </div>
          )}

          {currentUser.role === 'parent' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#d97706" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Parent & Guardian Report Card</span>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Ward Record</span>
            </div>
          )}
        </div>

        {/* Right Actions: Notifications, User Profile & Sign Out on every page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          
          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{ 
                background: '#f8fafc', 
                border: '1px solid #cbd5e1', 
                borderRadius: '0.5rem', 
                padding: '0.5rem', 
                color: '#334155', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              title="Notifications & Alerts"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-4px', 
                  background: '#e11d48', 
                  color: '#fff', 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(225, 29, 72, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                top: '48px', 
                width: '360px', 
                background: '#ffffff', 
                border: '1px solid #cbd5e1', 
                borderRadius: '0.75rem', 
                boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.15)', 
                zIndex: 100,
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={16} color="#4f46e5" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>System Notifications</span>
                  </div>
                  <button 
                    onClick={markAllNotificationsRead}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        style={{ 
                          padding: '0.625rem', 
                          borderRadius: '0.5rem', 
                          background: n.read ? '#f8fafc' : '#eef2ff', 
                          border: `1px solid ${n.read ? '#e2e8f0' : '#c7d2fe'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          {n.type === 'alert' && <AlertTriangle size={14} color="#e11d48" />}
                          {n.type === 'warning' && <AlertTriangle size={14} color="#d97706" />}
                          {n.type === 'info' && <Info size={14} color="#0284c7" />}
                          {n.type === 'success' && <CheckCircle2 size={14} color="#059669" />}
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{n.title}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.35 }}>{n.message}</p>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset System Data Button */}
          <button 
            onClick={() => {
              if (window.confirm('Reset platform data? This will clear sessions and refresh database state.')) {
                resetAllData();
              }
            }}
            className="btn-secondary btn-sm"
            title="Reset platform data"
            style={{ padding: '0.45rem', borderRadius: '0.5rem' }}
          >
            <RotateCcw size={15} />
          </button>

          {/* Profile Capsule with Integrated Profile Info & Sign Out on every page */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            background: '#ffffff', 
            padding: '0.35rem 0.625rem 0.35rem 0.75rem', 
            borderRadius: '0.75rem',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
          }}>
            <img 
              src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
              alt={currentUser.name} 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #4f46e5' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{currentUser.name}</span>
              <span className={`badge ${getRoleBadgeStyle(currentUser.role)}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', alignSelf: 'flex-start', marginTop: '2px' }}>
                {currentUser.role.toUpperCase()} {currentUser.enrolmentNumber ? `• ${currentUser.enrolmentNumber}` : ''}
              </span>
            </div>

            {/* Edit Credentials (Email & Password) Button */}
            <button 
              onClick={() => {
                setEditEmail(currentUser.email || '');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordText(false);
                setPasswordError('');
                setPasswordSuccess('');
                setShowChangePasswordModal(true);
              }}
              className="btn-secondary btn-sm"
              title="Change Account Email & Password"
              style={{ 
                padding: '0.35rem 0.6rem', 
                borderRadius: '0.5rem', 
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              <KeyRound size={13} /> Email & Password
            </button>

            {/* Prominent Sign Out Button directly inside profile */}
            <button 
              onClick={() => logout()}
              className="btn-danger btn-sm"
              title="Sign Out to Login Portal"
              style={{ 
                padding: '0.35rem 0.65rem', 
                borderRadius: '0.5rem', 
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700,
                fontSize: '0.75rem',
                marginLeft: '0.1rem'
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>

        </div>

      </div>

      {/* CHANGE EMAIL & PASSWORD MODAL RENDERED VIA PORTAL TO AVOID HEADER BACKDROP CLIPPING */}
      {showChangePasswordModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChangePasswordModal(false);
          }}
        >
          <div 
            className="modal-content-card" 
            style={{ 
              width: '480px', 
              maxWidth: '95vw', 
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              margin: 'auto'
            }}
          >
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="#4f46e5" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Account Security & Credentials
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setShowChangePasswordModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Update login email and/or password for <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}). Changes are synced directly to MySQL.
            </p>

            {passwordError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', padding: '0.625rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontSize: '0.8rem', marginBottom: '1rem' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem', padding: '0.625rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError('');
              setPasswordSuccess('');

              const cleanEmail = editEmail.trim().toLowerCase();
              const isEmailChanged = cleanEmail && cleanEmail !== (currentUser.email || '').toLowerCase();
              const isPasswordProvided = Boolean(newPassword && newPassword.trim());

              if (!isEmailChanged && !isPasswordProvided) {
                setPasswordError('Please specify a new email address or enter a new password to update.');
                return;
              }

              if (cleanEmail && !cleanEmail.includes('@')) {
                setPasswordError('Please provide a valid email address.');
                return;
              }

              if (isPasswordProvided) {
                if (newPassword.length < 3) {
                  setPasswordError('Password must be at least 3 characters.');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError('New password and confirmation do not match.');
                  return;
                }
              }

              setIsUpdatingPassword(true);
              const res = await changePassword(
                isPasswordProvided ? newPassword : undefined, 
                isEmailChanged ? cleanEmail : undefined
              );
              setIsUpdatingPassword(false);

              if (res.success) {
                setPasswordSuccess('Credentials successfully updated in MySQL database!');
                setTimeout(() => {
                  setShowChangePasswordModal(false);
                }, 1500);
              } else {
                setPasswordError(res.message || 'Failed to update credentials.');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Email Address */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Institutional Email (Login Username)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      setPasswordError('');
                    }} 
                    placeholder="e.g. principal@oakridge.edu" 
                    required 
                    className="form-input" 
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  This email is your login username and the address where OTP reset codes are sent.
                </span>
              </div>

              {/* Password Section */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a' }}>
                    New Password (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = currentUser.role === 'principal' ? 'Admin' : currentUser.role === 'teacher' ? 'Teach' : 'User';
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      const generated = `${prefix}#${rand}`;
                      setNewPassword(generated);
                      setConfirmPassword(generated);
                      setShowPasswordText(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.725rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Sparkles size={12} /> Auto-Generate
                  </button>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPasswordText ? 'text' : 'password'} 
                      value={newPassword} 
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                      }} 
                      placeholder="Leave blank to keep current password" 
                      className="form-input" 
                      style={{ paddingRight: '2.4rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      {showPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm New Password</label>
                  <input 
                    type={showPasswordText ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }} 
                    placeholder="Confirm new password if changing" 
                    className="form-input" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowChangePasswordModal(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="btn-primary btn-sm"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  {isUpdatingPassword ? 'Saving to Database...' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
