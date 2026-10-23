import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export type FeedbackType = 'success' | 'warning' | 'info' | 'error';

export interface FeedbackDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: FeedbackType;
  badgeText?: string;
  title: string;
  message?: React.ReactNode;
  details?: FeedbackDetailItem[];
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  triggerConfetti?: boolean;
  children?: React.ReactNode;
  maxWidth?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  type = 'info',
  badgeText,
  title,
  message,
  details,
  primaryButtonText = 'Okay',
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick,
  triggerConfetti = false,
  children,
  maxWidth = '520px'
}) => {
  useEffect(() => {
    if (isOpen && (triggerConfetti || type === 'success')) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback if canvas is unavailable
      }
    }
  }, [isOpen, triggerConfetti, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: <CheckCircle2 size={32} color="#059669" />,
      bgIcon: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      borderColor: '#a7f3d0',
      badgeBg: '#ecfdf5',
      badgeColor: '#059669',
      defaultBadge: 'Success'
    },
    warning: {
      icon: <AlertTriangle size={32} color="#d97706" />,
      bgIcon: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#fde68a',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309',
      defaultBadge: 'Attention Needed'
    },
    error: {
      icon: <AlertCircle size={32} color="#e11d48" />,
      bgIcon: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      borderColor: '#fecdd3',
      badgeBg: '#fff1f2',
      badgeColor: '#be123c',
      defaultBadge: 'Action Error'
    },
    info: {
      icon: <Info size={32} color="#4f46e5" />,
      bgIcon: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      borderColor: '#c7d2fe',
      badgeBg: '#eef2ff',
      badgeColor: '#4338ca',
      defaultBadge: 'Notification'
    }
  };

  const currentConfig = typeConfig[type];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 1200 }}
    >
      <div 
        className="modal-content-card modal-animate"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth,
          width: '92vw',
          padding: '2rem',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top subtle decorative gradient bar */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: type === 'success' 
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : type === 'warning'
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : type === 'error'
              ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
              : 'linear-gradient(90deg, #6366f1, #4f46e5)'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={16} />
        </button>

        {/* Header with Icon & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '0.5rem' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '1.25rem',
              background: currentConfig.bgIcon,
              border: `2px solid ${currentConfig.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.06)'
            }}
          >
            {currentConfig.icon}
          </div>

          <span 
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: currentConfig.badgeBg,
              color: currentConfig.badgeColor,
              marginBottom: '0.5rem'
            }}
          >
            {badgeText || currentConfig.defaultBadge}
          </span>

          <h3 
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.3,
              marginBottom: '0.5rem'
            }}
          >
            {title}
          </h3>

          {message && (
            <div 
              style={{
                fontSize: '0.925rem',
                color: '#64748b',
                lineHeight: 1.5,
                maxWidth: '420px',
                marginBottom: details || children ? '1.25rem' : '1.75rem'
              }}
            >
              {message}
            </div>
          )}
        </div>

        {/* Custom Details / Key-Value Card */}
        {details && details.length > 0 && (
          <div 
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.875rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}
          >
            {details.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: idx < details.length - 1 ? '1px dashed #e2e8f0' : 'none',
                  paddingBottom: idx < details.length - 1 ? '0.5rem' : '0'
                }}
              >
                <span style={{ color: '#64748b', fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Content Slot */}
        {children && (
          <div style={{ marginBottom: '1.5rem' }}>
            {children}
          </div>
        )}

        {/* Action Buttons */}
        <div 
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '0.5rem'
          }}
        >
          {secondaryButtonText && (
            <button
              type="button"
              onClick={onSecondaryClick || onClose}
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                justifyContent: 'center',
                fontWeight: 600
              }}
            >
              {secondaryButtonText}
            </button>
          )}

          <button
            type="button"
            onClick={onPrimaryClick || onClose}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              fontSize: '0.9rem',
              justifyContent: 'center',
              fontWeight: 600,
              background: type === 'success' 
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                : type === 'error'
                ? '#e11d48'
                : undefined
            }}
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
