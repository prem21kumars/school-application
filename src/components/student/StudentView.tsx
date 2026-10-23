import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Assessment, StudentExamAttempt } from '../../types';
import { ExamRoom } from './ExamRoom';
import { 
  GraduationCap, 
  BookOpen, 
  Play, 
  Eye, 
  ShieldAlert, 
  XCircle,
  Printer
} from 'lucide-react';
import { OfflineQuestionPaperModal } from '../teacher/OfflineQuestionPaperModal';

export const StudentView: React.FC = () => {
  const { 
    currentUser, 
    assessments, 
    studentAttempts, 
    startStudentAttempt,
    subjects 
  } = useApp();

  const [activeExamAssessment, setActiveExamAssessment] = useState<Assessment | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentExamAttempt | null>(null);
  const [selectedInstructionAssessment, setSelectedInstructionAssessment] = useState<Assessment | null>(null);
  const [selectedOfflineAssessment, setSelectedOfflineAssessment] = useState<Assessment | null>(null);

  const myClassId = currentUser.classId || 'cls-10a';
  const myAssessments = assessments.filter(a => {
    const isClassMatch = a.classIds.includes(myClassId);
    const isTargetMatch = !a.targetStudentIds || 
      a.targetStudentIds.length === 0 || 
      a.targetStudentIds.includes('all') || 
      a.targetStudentIds.includes(currentUser.id);
    return isClassMatch && isTargetMatch && a.status === 'published';
  });

  const myAttempts = studentAttempts.filter(att => att.studentId === currentUser.id);

  const completedAttempts = myAttempts.filter(a => a.status === 'evaluated');
  const avgPercentage = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  const handleStartExamFlow = (assessment: Assessment) => {
    const attempt = startStudentAttempt(assessment.id, currentUser.id);
    setActiveAttempt(attempt);
    setActiveExamAssessment(assessment);
    setSelectedInstructionAssessment(null);
  };

  if (activeExamAssessment && activeAttempt) {
    return (
      <ExamRoom 
        assessment={activeExamAssessment} 
        attempt={activeAttempt} 
        onExit={() => {
          setActiveExamAssessment(null);
          setActiveAttempt(null);
        }} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Student Profile Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)', border: '1px solid #a7f3d0', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #059669' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-success"><GraduationCap size={14} /> Student Examination Portal</span>
              {currentUser.enrolmentNumber && (
                <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                  {currentUser.enrolmentNumber}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Welcome, {currentUser.name}</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Grade 10 • Section {currentUser.section || 'A'} • Academic Session 2026-27</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Cumulative Score</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>{avgPercentage}%</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Completed Exams</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4f46e5' }}>{completedAttempts.length}</div>
          </div>
        </div>
      </div>

      {/* Available Assessments Section (7.8.1) */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
          <BookOpen size={20} color="#059669" /> Assigned Examinations & Online Quizzes
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {myAssessments.map(asm => {
            const subject = subjects.find(s => s.id === asm.subjectId);
            const myAttempt = myAttempts.find(a => a.assessmentId === asm.id);

            const isDone = myAttempt?.status === 'evaluated' || myAttempt?.status === 'submitted';
            const isTerminated = myAttempt?.status === 'malpractice_terminated';

            return (
              <div key={asm.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className={`badge ${asm.mode === 'online' ? 'badge-primary' : 'badge-purple'}`}>
                        {asm.mode.toUpperCase()}
                      </span>
                      <span className="badge badge-cyan">{asm.type}</span>
                    </div>

                    {isDone && <span className="badge badge-success">Completed ({myAttempt.percentage}%)</span>}
                    {isTerminated && <span className="badge badge-danger">Malpractice Closed</span>}
                    {!myAttempt && <span className="badge badge-warning">Ready to Start</span>}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>{asm.title}</h3>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                    Subject: <strong style={{ color: '#0f172a' }}>{subject?.name || 'Science'}</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Duration</span>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0284c7' }}>{asm.durationMinutes} Minutes</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Marks</span>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#059669' }}>{asm.totalMarks} Marks</div>
                    </div>
                  </div>
                </div>

                <div>
                  {isDone ? (
                    <button 
                      onClick={() => {
                        setActiveAttempt(myAttempt);
                        setActiveExamAssessment(asm);
                      }} 
                      className="btn-secondary" 
                      style={{ width: '100%' }}
                    >
                      <Eye size={16} /> View Scorecard & Solutions (FR-EX-04)
                    </button>
                  ) : isTerminated ? (
                    <button 
                      onClick={() => {
                        setActiveAttempt(myAttempt);
                        setActiveExamAssessment(asm);
                      }} 
                      className="btn-danger" 
                      style={{ width: '100%' }}
                    >
                      <ShieldAlert size={16} /> View Termination / Appeal (7.8.3)
                    </button>
                  ) : asm.mode === 'offline' ? (
                    <button 
                      onClick={() => setSelectedOfflineAssessment(asm)} 
                      className="btn-secondary" 
                      style={{ width: '100%', borderColor: '#7c3aed', color: '#7c3aed', background: '#faf5ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}
                    >
                      <Printer size={16} /> View & Print Offline Exam Paper
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedInstructionAssessment(asm)} 
                      className="btn-primary" 
                      style={{ width: '100%', background: '#059669', borderColor: '#059669' }}
                    >
                      <Play size={16} /> View Instructions & Start Exam (7.8.1)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRE-EXAM INSTRUCTIONS MODAL (7.8.1) */}
      {selectedInstructionAssessment && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '600px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedInstructionAssessment.title} — Instructions
              </h2>
              <button onClick={() => setSelectedInstructionAssessment(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', maxHeight: '55vh', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.5rem' }}>
                Candidate Instructions & Malpractice Rules (7.8.1 & 7.8.2):
              </h4>
              <ul style={{ color: '#334155', fontSize: '0.8125rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedInstructionAssessment.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
                <li style={{ color: '#e11d48' }}>
                  <strong>Malpractice Detection Active:</strong> Any browser tab switching, devtools inspection, or prohibited shortcuts (Ctrl+C, Ctrl+V, Alt+Tab) will trigger a strike. 3 strikes result in immediate automatic exam closure and teacher reporting.
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setSelectedInstructionAssessment(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleStartExamFlow(selectedInstructionAssessment)} className="btn-success btn-lg">
                <Play size={18} /> Acknowledge & Start Exam Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE QUESTION PAPER MODAL FOR STUDENT */}
      {selectedOfflineAssessment && (
        <OfflineQuestionPaperModal
          assessment={selectedOfflineAssessment}
          onClose={() => setSelectedOfflineAssessment(null)}
        />
      )}
    </div>
  );
};
