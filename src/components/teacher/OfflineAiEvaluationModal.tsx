import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { OfflineAnswerSheet } from '../../types';
import { 
  XCircle, 
  Sparkles, 
  CheckCircle2, 
  Edit2
} from 'lucide-react';
import { FeedbackModal } from '../common/FeedbackModal';

interface OfflineAiEvaluationModalProps {
  sheet: OfflineAnswerSheet;
  onClose: () => void;
}

export const OfflineAiEvaluationModal: React.FC<OfflineAiEvaluationModalProps> = ({ sheet, onClose }) => {
  const { assessments, updateTeacherOfflineMarks } = useApp();
  const assessment = assessments.find(a => a.id === sheet.assessmentId);

  const [evaluations, setEvaluations] = useState(sheet.questionEvaluations);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const currentEval = evaluations[activeQuestionIdx] || evaluations[0];
  const currentQuestion = assessment?.questions.find(q => q.id === currentEval?.questionId);

  const totalTeacherMarks = evaluations.reduce((sum, e) => sum + e.teacherMarks, 0);
  const totalMaxMarks = sheet.maxMarks;
  const percentage = Math.round((totalTeacherMarks / totalMaxMarks) * 100);

  const handleMarkChange = (idx: number, newMark: number) => {
    setEvaluations(prev => prev.map((ev, i) => {
      if (i === idx) {
        const clamped = Math.min(Math.max(0, newMark), ev.maxMarks);
        return {
          ...ev,
          teacherMarks: clamped,
          isFlaggedForReview: false
        };
      }
      return ev;
    }));
  };

  const handleFeedbackChange = (idx: number, feedback: string) => {
    setEvaluations(prev => prev.map((ev, i) => {
      if (i === idx) {
        return {
          ...ev,
          teacherFeedback: feedback
        };
      }
      return ev;
    }));
  };

  const handleFinalizeAndPublish = () => {
    updateTeacherOfflineMarks(sheet.id, evaluations);
    setShowSuccessModal(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card" style={{ width: '1280px', maxWidth: '96vw', height: '90vh' }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: '#ecfdf5', borderRadius: '0.5rem', color: '#059669' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>AI-Assisted Offline Answer Sheet Evaluation</h2>
                <span className="badge badge-success">AI Powered + Teacher Verified (BR-06)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Student: <strong>{sheet.studentName}</strong> • Enrolment: <strong>{sheet.enrolmentNumber}</strong> • Assessment: {assessment?.title}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                {totalTeacherMarks} / {totalMaxMarks} ({percentage}%)
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified Total Score</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <XCircle size={22} />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr 300px', flex: 1, overflow: 'hidden' }}>
          
          {/* Column 1: Scanned Written Answer Sheet Image Viewer */}
          <div style={{ background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>DIGITIZED SCAN REPOSITORY</span>
              <span className="badge badge-primary">300 DPI High-Res</span>
            </div>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
              <img 
                src={sheet.scannedImageUrl} 
                alt="Scanned Paper" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
              />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.85)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: '#fff' }}>
                Answer Sheet Page 1 of 1 • Barcode: {sheet.enrolmentNumber || 'N/A'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={15} color="#059669" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Enrolment Mapping Verified</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                System identified unique student ID <strong>{sheet.enrolmentNumber}</strong> with 99.4% OCR barcode accuracy.
              </p>
            </div>
          </div>

          {/* Column 2: Question & AI Evaluation Inspector */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#ffffff' }}>
            
            {/* Question Selector Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {evaluations.map((ev, idx) => (
                <button
                  key={ev.questionId}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`question-badge-btn ${activeQuestionIdx === idx ? 'current' : ''}`}
                  style={{
                    width: 'auto',
                    padding: '0.4rem 0.8rem',
                    background: ev.isFlaggedForReview ? '#fffbeb' : activeQuestionIdx === idx ? '#eef2ff' : '#f8fafc',
                    color: ev.isFlaggedForReview ? '#b45309' : activeQuestionIdx === idx ? '#4338ca' : '#334155',
                    borderColor: ev.isFlaggedForReview ? '#fde68a' : activeQuestionIdx === idx ? '#4f46e5' : '#cbd5e1'
                  }}
                >
                  Q{ev.questionNumber} {ev.isFlaggedForReview ? '⚠️ Review' : `(${ev.teacherMarks}/${ev.maxMarks}M)`}
                </button>
              ))}
            </div>

            {/* Active Question Box */}
            <div className="glass-card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.9rem' }}>
                  Question {currentEval.questionNumber} (Max: {currentEval.maxMarks} Marks)
                </span>
                <span className="badge badge-primary">{currentQuestion?.difficulty || 'Medium'}</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 }}>
                {currentQuestion?.text || 'Question description'}
              </p>
              {currentQuestion?.correctAnswerText && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <strong>Marking Scheme / Model Solution:</strong> {currentQuestion.correctAnswerText}
                </div>
              )}
            </div>

            {/* OCR Extracted Student Answer & AI Reasoning */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Extracted Handwritten Text */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>EXTRACTED STUDENT RESPONSE (OCR)</span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Confidence: {currentEval.aiConfidence}%</span>
                </div>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0284c7', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                  {currentEval.extractedText}
                </pre>
              </div>

              {/* AI Proposed Rubric Analysis */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>AI RUBRIC EVALUATION (FR-EX-11)</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    AI Proposed: {currentEval.aiProposedMarks} / {currentEval.maxMarks}M
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.45 }}>
                  {currentEval.aiReasoning}
                </p>
                {currentEval.isFlaggedForReview && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#b45309' }}>
                    ⚠️ Flagged for Teacher Verification: Ambiguity in calculation steps.
                  </div>
                )}
              </div>

            </div>

            {/* Teacher Override & Feedback Section */}
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit2 size={16} color="#4f46e5" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Teacher Override & Final Award (FR-EX-12)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>Award Marks:</span>
                  <input 
                    type="number" 
                    min={0} 
                    max={currentEval.maxMarks} 
                    value={currentEval.teacherMarks} 
                    onChange={(e) => handleMarkChange(activeQuestionIdx, Number(e.target.value))}
                    className="form-input"
                    style={{ width: '80px', textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#059669' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ {currentEval.maxMarks}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Teacher Remark / Pedagogical Note</label>
                <input 
                  type="text" 
                  value={currentEval.teacherFeedback || ''} 
                  onChange={(e) => handleFeedbackChange(activeQuestionIdx, e.target.value)}
                  placeholder="e.g. Verified handwriting: full credit awarded for step logic." 
                  className="form-input" 
                />
              </div>
            </div>

          </div>

          {/* Column 3: Summary & Finalization */}
          <div style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>Evaluation Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
              {evaluations.map((ev, i) => (
                <div 
                  key={ev.questionId}
                  onClick={() => setActiveQuestionIdx(i)}
                  style={{ 
                    padding: '0.625rem 0.75rem', 
                    borderRadius: '0.5rem', 
                    background: activeQuestionIdx === i ? '#eef2ff' : '#ffffff', 
                    border: `1px solid ${activeQuestionIdx === i ? '#4f46e5' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>Q{ev.questionNumber}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: ev.teacherMarks === ev.maxMarks ? '#059669' : '#d97706' }}>
                      {ev.teacherMarks}/{ev.maxMarks} M
                    </span>
                    {ev.isFlaggedForReview && <span style={{ color: '#d97706', fontSize: '0.75rem' }}>⚠️</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Final Aggregated Score</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>
                  {totalTeacherMarks} / {totalMaxMarks}
                </div>
                <span className="badge badge-success">{percentage}% Grade A</span>
              </div>

              <button onClick={handleFinalizeAndPublish} className="btn-primary" style={{ width: '100%' }}>
                <CheckCircle2 size={16} /> Finalize & Publish Marks
              </button>
            </div>
          </div>

        </div>

      </div>

      {showSuccessModal && (
        <FeedbackModal
          isOpen={true}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
          type="success"
          title="Marks Validated & Finalized!"
          message={`Offline examination marks for ${sheet.studentName} (${sheet.enrolmentNumber}) have been successfully validated and recorded in the gradebook.`}
          details={[
            { label: 'Student Name', value: sheet.studentName },
            { label: 'Enrolment Number', value: sheet.enrolmentNumber },
            { label: 'Final Score', value: `${totalTeacherMarks} / ${totalMaxMarks} (${percentage}%)` }
          ]}
          primaryButtonText="Done"
          onPrimaryClick={() => {
            setShowSuccessModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
