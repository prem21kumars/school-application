import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Assessment, StudentExamAttempt, MalpracticeLog } from '../../types';
import { 
  Clock, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Flag
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamRoomProps {
  assessment: Assessment;
  attempt: StudentExamAttempt;
  onExit: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({ assessment, attempt, onExit }) => {
  const { 
    recordMalpracticeViolation, 
    submitStudentAttempt, 
    submitReattemptRequest,
    studentAttempts 
  } = useApp();

  const currentAttempt = studentAttempts.find(a => a.id === attempt.id) || attempt;

  const [answers, setAnswers] = useState<{ [qId: string]: string }>(() => {
    const map: { [qId: string]: string } = {};
    currentAttempt.answers?.forEach(a => {
      map[a.questionId] = a.studentAnswer;
    });
    return map;
  });

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(assessment.durationMinutes * 60);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [latestViolationText, setLatestViolationText] = useState('');
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  const [appealReason, setAppealReason] = useState('');
  const [isAppealSubmitted, setIsAppealSubmitted] = useState(currentAttempt.reattemptRequested || false);

  const questions = assessment.questions;
  const currentQ = questions[currentQuestionIdx] || questions[0];

  const isTerminated = currentAttempt.status === 'malpractice_terminated';
  const isSubmitted = currentAttempt.status === 'submitted' || currentAttempt.status === 'evaluated';

  // Live Timer
  useEffect(() => {
    if (isTerminated || isSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTerminated, isSubmitted]);

  // Malpractice Detection Engine (7.8.2)
  useEffect(() => {
    if (isTerminated || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tab_switch', 'Switched browser tab away from active examination session.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('tab_switch', 'Exam window lost focus (potential multi-tasking / external app switch).');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
        triggerViolation('copy_paste', `Prohibited clipboard keyboard shortcut (Ctrl+${e.key.toUpperCase()}) triggered.`);
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        triggerViolation('devtools', 'Developer tools inspection attempt detected.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('key_press', 'Right-click context menu access attempted during exam.');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isTerminated, isSubmitted, currentAttempt.malpracticeCount]);

  const triggerViolation = (type: MalpracticeLog['type'], description: string) => {
    const nextCount = currentAttempt.malpracticeCount + 1;
    setLatestViolationText(`${description} (Strike ${nextCount} of 3)`);
    setShowViolationWarning(true);
    recordMalpracticeViolation(currentAttempt.id, type, description);
  };

  const handleSelectAnswer = (qId: string, val: string) => {
    if (isTerminated || isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleManualSubmit = () => {
    const formatted = Object.entries(answers).map(([questionId, studentAnswer]) => ({
      questionId,
      studentAnswer
    }));

    submitStudentAttempt(currentAttempt.id, formatted);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    setShowSubmitConfirmModal(false);
  };

  const handleAutoSubmit = () => {
    const formatted = Object.entries(answers).map(([questionId, studentAnswer]) => ({
      questionId,
      studentAnswer
    }));
    submitStudentAttempt(currentAttempt.id, formatted);
  };

  const handleSendAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason) return;
    submitReattemptRequest(currentAttempt.id, appealReason);
    setIsAppealSubmitted(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // IF EXAM IS TERMINATED DUE TO MALPRACTICE (7.8.2)
  if (isTerminated) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', border: '2px solid #fecdd3', background: '#ffffff', boxShadow: '0 10px 30px rgba(225, 29, 72, 0.08)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <ShieldAlert size={36} color="#e11d48" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9f1239', marginBottom: '0.5rem' }}>
            Examination Terminated — Malpractice
          </h2>
          <span className="badge badge-danger" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Status: MALPRACTICE (3/3 Violations Exceeded)
          </span>

          <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            In accordance with school examination policy (7.8.2), your test session has been automatically closed because 3 prohibited actions were recorded. An automatic incident report has been dispatched to your teacher.
          </p>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Incident Audit Log:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {currentAttempt.malpracticeLogs.map(log => (
                <div key={log.id} style={{ fontSize: '0.8125rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#e11d48', fontWeight: 700 }}>Violation #{log.violationNumber}:</span>
                  <span>{log.description}</span>
                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>({new Date(log.timestamp).toLocaleTimeString()})</span>
                </div>
              ))}
            </div>
          </div>

          {isAppealSubmitted ? (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 700, marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#059669" /> Re-attempt Request Submitted
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#047857', margin: 0 }}>
                Your appeal is currently pending review by your subject teacher. You will receive permission to retake once authorized.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendAppeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label className="form-label">Submit Appeal / Reason for Re-attempt Permission (7.8.3)</label>
                <textarea 
                  rows={3} 
                  value={appealReason} 
                  onChange={(e) => setAppealReason(e.target.value)} 
                  placeholder="Explain why the violation occurred (e.g. accidental browser notification popup, system glitch)..."
                  required 
                  className="form-textarea" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button type="button" onClick={onExit} className="btn-secondary">
                  Back to Dashboard
                </button>
                <button type="submit" className="btn-primary">
                  <Send size={15} /> Request Re-attempt from Teacher
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  // IF EXAM IS COMPLETED / SUBMITTED (7.8.1)
  if (isSubmitted) {
    return (
      <div style={{ maxWidth: '850px', margin: '2rem auto', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', background: '#ffffff' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={36} color="#059669" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>Assessment Completed & Submitted!</h2>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Stored Against Enrolment: {currentAttempt.enrolmentNumber} (FR-EX-03)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Score</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669' }}>
                {currentAttempt.totalScore} / {currentAttempt.maxScore}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Percentage</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4f46e5' }}>
                {currentAttempt.percentage}%
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Result Status</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (currentAttempt.percentage || 0) >= 40 ? '#059669' : '#e11d48', marginTop: '0.35rem' }}>
                {(currentAttempt.percentage || 0) >= 40 ? 'PASSED' : 'REMEDIAL NEEDED'}
              </div>
            </div>
          </div>

          {/* Post-Exam Solutions & Explanations (FR-EX-04) */}
          {assessment.showAnswersAfterSubmission && (
            <div style={{ textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Detailed Question Review & Explanations (FR-EX-04)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, idx) => {
                  const studentAnswer = answers[q.id];
                  const evalItem = currentAttempt.answers?.find(a => a.questionId === q.id);

                  return (
                    <div key={q.id} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.85rem' }}>Q{idx + 1} ({q.marks} Marks)</span>
                        <span className={`badge ${evalItem?.isCorrect ? 'badge-success' : 'badge-warning'}`}>
                          {evalItem?.marksObtained || 0} / {q.marks} Marks
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, margin: '0.25rem 0 0.5rem 0' }}>{q.text}</p>
                      
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        Your Answer: <strong style={{ color: '#0f172a' }}>{studentAnswer || 'Not Answered'}</strong>
                      </div>

                      {q.explanation && (
                        <div style={{ background: '#eef2ff', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={onExit} className="btn-primary" style={{ marginTop: '2rem' }}>
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM LIVE ROOM
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', gap: '1rem', width: '100%' }}>
      
      {/* Live Exam Top Bar */}
      <div className="glass-panel" style={{ padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{assessment.title}</h2>
            <span className="badge badge-primary">Question {currentQuestionIdx + 1} of {questions.length}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Student: <strong>{currentAttempt.studentName}</strong> • Enrolment: {currentAttempt.enrolmentNumber}
          </span>
        </div>

        {/* Live Timer & Malpractice Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* Malpractice Strikes Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff1f2', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #fecdd3' }}>
            <ShieldAlert size={16} color="#e11d48" />
            <span style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: 700 }}>
              Strikes: {currentAttempt.malpracticeCount} / 3
            </span>
          </div>

          {/* Countdown Clock */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: timeLeftSeconds < 300 ? '#fff1f2' : '#f8fafc', 
            padding: '0.4rem 0.875rem', 
            borderRadius: '0.5rem', 
            border: `1px solid ${timeLeftSeconds < 300 ? '#fecdd3' : '#cbd5e1'}` 
          }}>
            <Clock size={16} color={timeLeftSeconds < 300 ? '#e11d48' : '#0284c7'} />
            <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: timeLeftSeconds < 300 ? '#e11d48' : '#0284c7' }}>
              {formatTimer(timeLeftSeconds)}
            </span>
          </div>

          <button onClick={() => setShowSubmitConfirmModal(true)} className="btn-success">
            <Send size={15} /> Finish & Submit Exam
          </button>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', flex: 1, gap: '1rem', alignItems: 'start' }}>
        
        {/* Left: Active Question Screen */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff', minHeight: '480px' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-primary">{currentQ.type.toUpperCase()}</span>
                <span className="badge badge-purple">{currentQ.marks} Marks</span>
                <span className="badge badge-cyan">{currentQ.difficulty}</span>
              </div>
              <button 
                onClick={() => toggleFlagQuestion(currentQ.id)}
                className={`btn-sm ${flaggedQuestions.includes(currentQ.id) ? 'btn-danger' : 'btn-secondary'}`}
              >
                <Flag size={13} /> {flaggedQuestions.includes(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              {currentQuestionIdx + 1}. {currentQ.text}
            </h3>

            {/* Answer Input Controls */}
            {/* 1. MCQ */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <div 
                      key={opt.id}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                      style={{ 
                        padding: '1rem 1.25rem', 
                        borderRadius: '0.625rem', 
                        background: isSelected ? '#eef2ff' : '#ffffff', 
                        border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        border: `2px solid ${isSelected ? '#4f46e5' : '#94a3b8'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? '#4f46e5' : 'transparent',
                        color: isSelected ? '#fff' : '#64748b',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span style={{ fontSize: '0.95rem', color: isSelected ? '#0f172a' : '#334155', fontWeight: isSelected ? 600 : 400 }}>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. True / False */}
            {currentQ.type === 'true_false' && currentQ.options && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: '0.625rem', 
                        background: isSelected ? '#eef2ff' : '#ffffff', 
                        border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                        color: isSelected ? '#4f46e5' : '#334155',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Key-In / Subjective */}
            {(currentQ.type === 'key_in' || currentQ.type === 'short_answer' || currentQ.type === 'long_answer') && (
              <div>
                <label className="form-label">Your Response / Calculation:</label>
                <textarea 
                  rows={currentQ.type === 'long_answer' ? 6 : 3}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your final numerical answer or detailed step-by-step solution..."
                  className="form-textarea"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>
            )}
          </div>

          {/* Question Navigation Prev / Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <button 
              onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIdx === 0}
              className="btn-secondary"
            >
              <ChevronLeft size={16} /> Previous Question
            </button>

            <button 
              onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIdx === questions.length - 1}
              className="btn-primary"
            >
              Next Question <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Right: Question Navigation Palette */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff', minHeight: '480px' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>Question Palette</h3>
            
            {/* Palette Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', marginBottom: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }}></span> Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e11d48' }}></span> Flagged
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}></span> Unvisited
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1px solid #4f46e5', background: '#eef2ff' }}></span> Current
              </div>
            </div>

            {/* Grid of numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flaggedQuestions.includes(q.id);
                const isCurrent = currentQuestionIdx === idx;

                let bgStyle = {
                  background: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #cbd5e1'
                };

                if (isAnswered) {
                  bgStyle = {
                    background: '#059669',
                    color: '#ffffff',
                    border: '1px solid #047857'
                  };
                }
                if (isFlagged) {
                  bgStyle = {
                    background: '#e11d48',
                    color: '#ffffff',
                    border: '1px solid #be123c'
                  };
                }
                if (isCurrent) {
                  bgStyle = {
                    background: '#eef2ff',
                    color: '#4338ca',
                    border: '2px solid #4f46e5'
                  };
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className="question-badge-btn"
                    style={bgStyle}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setShowSubmitConfirmModal(true)} className="btn-success" style={{ width: '100%' }}>
              Submit Exam
            </button>
          </div>

        </div>

      </div>

      {/* MALPRACTICE VIOLATION WARNING TOAST (7.8.2) */}
      {showViolationWarning && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          background: '#fff1f2', 
          border: '2px solid #fecdd3', 
          borderRadius: '0.75rem', 
          padding: '1.25rem', 
          boxShadow: '0 10px 30px rgba(225, 29, 72, 0.2)', 
          zIndex: 200, 
          maxWidth: '420px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ShieldAlert size={20} color="#e11d48" />
            <h4 style={{ fontWeight: 800, color: '#9f1239', fontSize: '0.95rem' }}>
              MALPRACTICE WARNING (Strike {currentAttempt.malpracticeCount} of 3)
            </h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#9f1239', margin: '0 0 0.75rem 0' }}>
            {latestViolationText}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setShowViolationWarning(false)}
              className="btn-danger btn-sm"
            >
              I Understand & Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '450px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>Ready to Submit Assessment?</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              You have answered <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions. Once submitted, your answers will be finalized against enrolment number <strong>{currentAttempt.enrolmentNumber}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button onClick={() => setShowSubmitConfirmModal(false)} className="btn-secondary">
                Continue Test
              </button>
              <button onClick={handleManualSubmit} className="btn-success">
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
