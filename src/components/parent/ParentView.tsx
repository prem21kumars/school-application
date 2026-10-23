import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Printer, 
  CheckCircle2, 
  TrendingUp, 
  GraduationCap
} from 'lucide-react';

export const ParentView: React.FC = () => {
  const { users, assessments, studentAttempts, currentUser } = useApp();

  const student = users.find(u => u.role === 'student' && (currentUser.enrolmentNumber ? u.enrolmentNumber === currentUser.enrolmentNumber : true)) || users.find(u => u.role === 'student');
  const attempts = studentAttempts.filter(a => a.studentId === student?.id && (a.status === 'evaluated' || a.status === 'submitted'));

  const totalMaxMarks = attempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);
  const totalObtainedMarks = attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
  const overallAvg = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length) 
    : 0;

  const principal = users.find(u => u.role === 'principal');

  const getPerformanceGrade = (pct: number) => {
    if (pct >= 90) return 'A+ Outstanding';
    if (pct >= 80) return 'A Excellent';
    if (pct >= 70) return 'B Good';
    if (pct >= 60) return 'C Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Top Banner */}
      <div className="glass-panel no-print" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)', border: '1px solid #fde68a', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-warning"><Users size={14} /> Parent & Guardian Academic Portal</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Authorized Student Report Sheet (FR-RPT-09)</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Student Academic Progress Report</h1>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            Official assessment outcomes, marks transcripts, and teacher feedback for <strong>{student?.name || 'Student'}</strong>.
          </p>
        </div>

        <button onClick={() => window.print()} className="btn-primary" style={{ background: '#d97706', borderColor: '#d97706' }}>
          <Printer size={16} /> Print / Save PDF Report
        </button>
      </div>

      {/* Official Report Card (Printable Layout) */}
      <div className="glass-panel" style={{ background: '#ffffff', color: '#0f172a', borderRadius: '1rem', padding: '2.5rem 3rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
        
        {/* Report Card Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <GraduationCap size={28} color="#4f46e5" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
              Oakridge International Academy
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Affiliated to Secondary Education Board • Term Assessment Transcript
          </p>
          <div style={{ marginTop: '0.5rem', display: 'inline-block', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.8rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.85rem' }}>
            OFFICIAL STUDENT PERFORMANCE RECORD (FR-RPT-09)
          </div>
        </div>

        {/* Student Meta Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Student Name</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{student?.name || 'Unassigned'}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Enrolment Number</span>
            <div style={{ fontWeight: 800, color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>{student?.enrolmentNumber || 'N/A'}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Status</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{student?.status === 'active' ? 'Active Enrolment' : 'Inactive'}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Examinations Recorded</span>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{attempts.length} Exam(s)</div>
          </div>
        </div>

        {/* Academic Marks Summary Table */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Assessment Score Breakdown
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject / Examination</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Max Marks</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Marks Obtained</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Percentage</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Performance Grade</th>
                </tr>
              </thead>
              <tbody>
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No assessment attempts recorded yet for this student.
                    </td>
                  </tr>
                ) : (
                  attempts.map(att => {
                    const asm = assessments.find(a => a.id === att.assessmentId);
                    return (
                      <tr key={att.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{asm?.title || att.assessmentId}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{asm?.mode === 'offline' ? 'Offline Exam' : 'Online Exam'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{att.maxScore}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#16a34a' }}>{att.totalScore}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{att.percentage}%</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                          {getPerformanceGrade(att.percentage || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {attempts.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #0f172a' }}>
                    <td colSpan={2} style={{ padding: '0.875rem 1rem' }}>CUMULATIVE AGGREGATE</td>
                    <td style={{ padding: '0.875rem 1rem' }}>{totalMaxMarks}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#16a34a' }}>{totalObtainedMarks}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#2563eb' }}>{overallAvg}%</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#16a34a' }}>
                      {overallAvg >= 85 ? 'DISTINCTION' : overallAvg >= 60 ? 'MERIT' : 'PASS'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Qualitative Strengths & Growth Areas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem' }}>
            <h4 style={{ color: '#166534', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={16} /> Academic Evaluation Overview
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#14532d', margin: 0, lineHeight: 1.4 }}>
              {attempts.length > 0 
                ? `Student has completed ${attempts.length} evaluated assessment session(s) with an overall score average of ${overallAvg}%.` 
                : 'Examination records and rubric evaluations will populate as assessments are conducted.'}
            </p>
          </div>

          <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '0.5rem', padding: '1rem' }}>
            <h4 style={{ color: '#854d0e', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <TrendingUp size={16} /> Academic Recommendation
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#713f12', margin: 0, lineHeight: 1.4 }}>
              Continue regular participation in online quizzes and scheduled unit examinations.
            </p>
          </div>
        </div>

        {/* Teacher Remarks & Signatures */}
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ maxWidth: '60%', minWidth: '240px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Academic Status:</span>
            <p style={{ color: '#475569', margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>
              {student ? `Official academic report record for student ${student.name}.` : 'No student record selected.'}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.4rem', color: '#3730a3', marginBottom: '0.25rem' }}>
              {principal?.name || 'School Principal'}
            </div>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}>
              Principal & Academic Director
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
