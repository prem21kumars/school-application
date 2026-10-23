import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  X, 
  Clock, 
  Award, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  UserCheck, 
  BookOpen, 
  GraduationCap,
  Layers,
  Printer,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Assessment } from '../../types';
import { useApp } from '../../context/AppContext';

export interface AssessmentSuccessModalProps {
  assessment: Assessment;
  onClose: () => void;
  onViewAssessments: () => void;
  onAssign?: (assessment: Assessment) => void;
  onPrintOffline?: (assessment: Assessment) => void;
  onPreviewOnline?: (assessment: Assessment) => void;
}

export const AssessmentSuccessModal: React.FC<AssessmentSuccessModalProps> = ({
  assessment,
  onClose,
  onViewAssessments,
  onAssign,
  onPrintOffline,
  onPreviewOnline
}) => {
  const { subjects, classes } = useApp();

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#10b981', '#6366f1', '#06b6d4', '#f59e0b']
      });
    } catch {
      // safe fallback
    }
  }, []);

  const subject = subjects.find(s => s.id === assessment.subjectId);
  const targetClasses = classes.filter(c => assessment.classIds.includes(c.id));
  const classNames = targetClasses.length > 0 
    ? targetClasses.map(c => `${c.name} (${c.section})`).join(', ') 
    : 'All Enrolled Classes';

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
          maxWidth: '620px',
          width: '94vw',
          padding: '2.25rem',
          borderRadius: '1.5rem',
          boxShadow: '0 30px 70px -15px rgba(15, 23, 42, 0.4)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top vibrant decorative gradient banner */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 35%, #4f46e5 100%)'
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
            width: '34px',
            height: '34px',
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
          <X size={18} />
        </button>

        {/* Celebratory Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div 
            style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: '1.5rem',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 12px 24px -6px rgba(5, 150, 105, 0.25)'
            }}
          >
            <CheckCircle2 size={38} color="#059669" />
            <div 
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#fef08a',
                border: '2px solid #fde047',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              <Sparkles size={14} color="#d97706" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span 
              style={{
                fontSize: '0.725rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}
            >
              Assessment Published & Active
            </span>
          </div>

          <h2 
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '0.35rem'
            }}
          >
            Assessment Successfully Published!
          </h2>
          <p style={{ fontSize: '0.925rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.4 }}>
            The assessment paper is now compiled, scheduled, and ready for candidates in your academic portal.
          </p>
        </div>

        {/* Assessment Card Details */}
        <div 
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '1.125rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
          }}
        >
          {/* Title & Subject */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {assessment.title}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <BookOpen size={13} /> {subject?.name || 'General Subject'}
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <GraduationCap size={13} /> {classNames}
                </span>
              </div>
            </div>

            <span 
              className="badge" 
              style={{
                background: assessment.mode === 'online' ? '#e0f2fe' : '#fef3c7',
                color: assessment.mode === 'online' ? '#0284c7' : '#d97706',
                border: `1px solid ${assessment.mode === 'online' ? '#bae6fd' : '#fde68a'}`,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase'
              }}
            >
              {assessment.mode === 'online' ? 'Online CBT' : 'Offline Printable'}
            </span>
          </div>

          {/* 4 Stats Grid */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              padding: '0.875rem',
              background: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #f1f5f9'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.2rem', color: '#4f46e5' }}>
                <HelpCircle size={16} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {assessment.questions.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Questions</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.2rem', color: '#059669' }}>
                <Award size={16} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                {assessment.totalMarks}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Total Marks</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.2rem', color: '#0284c7' }}>
                <Clock size={16} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {assessment.durationMinutes}m
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Duration</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.2rem', color: '#7c3aed' }}>
                <Layers size={16} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {assessment.passingMarks || Math.round(assessment.totalMarks * 0.4)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Pass Marks</div>
            </div>
          </div>

          {/* Anti-cheat / Security highlights */}
          <div style={{ marginTop: '0.875rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span 
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                background: '#f1f5f9',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 500
              }}
            >
              <ShieldCheck size={13} color="#059669" /> Malpractice Guard (Tab & Copy detection)
            </span>
            {assessment.randomizeOrder && (
              <span 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 500
                }}
              >
                ✓ Shuffled Question Order
              </span>
            )}
            {assessment.showAnswersAfterSubmission && (
              <span 
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 500
                }}
              >
                ✓ Instant Solution Review
              </span>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Close
          </button>

          {assessment.mode === 'offline' && onPrintOffline && (
            <button
              type="button"
              onClick={() => onPrintOffline(assessment)}
              className="btn-primary"
              style={{ 
                padding: '0.75rem 1.25rem', 
                fontSize: '0.9rem', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              }}
            >
              <Printer size={16} /> Print / Export PDF Sets
            </button>
          )}

          {assessment.mode === 'online' && onPreviewOnline && (
            <button
              type="button"
              onClick={() => onPreviewOnline(assessment)}
              className="btn-primary"
              style={{ 
                padding: '0.75rem 1.25rem', 
                fontSize: '0.9rem', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }}
            >
              <Eye size={16} /> Preview Online Portal Exam
            </button>
          )}

          {onAssign && (
            <button
              type="button"
              onClick={() => onAssign(assessment)}
              className="btn-secondary"
              style={{ 
                padding: '0.75rem 1.25rem', 
                fontSize: '0.9rem', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <UserCheck size={16} /> Assign to Students
            </button>
          )}

          <button
            type="button"
            onClick={onViewAssessments}
            className="btn-primary"
            style={{ 
              padding: '0.75rem 1.5rem', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
            }}
          >
            Go to Assessments Tab <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
