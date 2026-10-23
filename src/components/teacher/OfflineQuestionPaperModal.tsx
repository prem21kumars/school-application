import React, { useState } from 'react';
import type { Assessment, QuestionPaperSet } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X } from 'lucide-react';

export interface OfflineQuestionPaperModalProps {
  assessment: Assessment;
  onClose: () => void;
}

export const OfflineQuestionPaperModal: React.FC<OfflineQuestionPaperModalProps> = ({
  assessment,
  onClose
}) => {
  const { subjects, classes } = useApp();
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [showAnswerKeyInPrint, setShowAnswerKeyInPrint] = useState(false);

  const subject = subjects.find(s => s.id === assessment.subjectId);
  const targetClasses = classes.filter(c => assessment.classIds.includes(c.id));
  const classNames = targetClasses.length > 0 
    ? targetClasses.map(c => c.name).join(', ') 
    : 'Grade 10';

  const setsCount = assessment.setsCount || 3;
  const setNames = ['Set A', 'Set B', 'Set C', 'Set D', 'Set E'];

  // Generate sets with randomized question order
  const sets: QuestionPaperSet[] = [];
  for (let i = 0; i < setsCount; i++) {
    let qList = [...assessment.questions];
    if (assessment.randomizeOrder) {
      qList = [...qList.slice(i % qList.length), ...qList.slice(0, i % qList.length)];
    }

    const answerKey = qList.map((q, idx) => {
      let correct = q.correctAnswerText || '';
      if (q.type === 'mcq' || q.type === 'true_false') {
        const correctOpt = q.options?.find(o => o.isCorrect);
        correct = correctOpt ? correctOpt.text : 'N/A';
      }
      return {
        questionNumber: idx + 1,
        questionId: q.id,
        correctAnswer: correct,
        marks: q.marks,
        explanation: q.explanation,
        rubric: q.markingRubric
      };
    });

    sets.push({
      setId: `set-${i + 1}`,
      setName: setNames[i % setNames.length],
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      subjectName: subject?.name || 'General Subject',
      className: classNames,
      durationMinutes: assessment.durationMinutes,
      totalMarks: assessment.totalMarks,
      instructions: assessment.instructions || [
        'Write Enrolment Number and Set Code on top of the answer booklet.',
        'All questions are compulsory.',
        'Calculators and digital devices are strictly prohibited.'
      ],
      questions: qList,
      answerKey
    });
  }

  const currentSet = sets[activeSetIndex] || sets[0];

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1300, background: 'rgba(15, 23, 42, 0.8)' }}
    >
      <div 
        className="modal-content-card modal-animate" 
        style={{ 
          width: '1200px', 
          maxWidth: '96vw', 
          height: '92vh', 
          padding: '1.5rem', 
          background: '#f8fafc', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        {/* Top Control Bar (Hidden during Print) */}
        <div 
          className="no-print" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem', 
            background: '#ffffff', 
            padding: '1rem 1.5rem', 
            borderRadius: '0.75rem', 
            border: '1px solid #cbd5e1', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
            flexWrap: 'wrap', 
            gap: '1rem' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
              Offline Question Paper Sets (FR-EX-06 / FR-EX-07)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {sets.map((set, idx) => (
                <button 
                  key={set.setId}
                  onClick={() => setActiveSetIndex(idx)}
                  className={`btn-sm ${activeSetIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '65px', justifyContent: 'center' }}
                >
                  {set.setName}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showAnswerKeyInPrint} 
                onChange={(e) => setShowAnswerKeyInPrint(e.target.checked)} 
              />
              <span>Show Answer Key & Marking Rubrics (7.4.1)</span>
            </label>
            <button 
              onClick={() => window.print()} 
              className="btn-primary"
              style={{ background: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={16} /> Print / Export PDF
            </button>
            <button 
              onClick={onClose} 
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <X size={16} /> Close Preview
            </button>
          </div>
        </div>

        {/* Printable Examination Page */}
        <div 
          className="print-page"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: '#ffffff', 
            color: '#000000', 
            borderRadius: '0.5rem', 
            padding: '2.5rem 3rem', 
            position: 'relative',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          {/* Paper Watermark */}
          <div className="paper-watermark">
            OAKRIDGE ACADEMY • {currentSet.setName}
          </div>

          {/* School Exam Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', margin: 0, letterSpacing: '0.04em' }}>
              Oakridge International Academy
            </h1>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0', color: '#000' }}>
              {currentSet.assessmentTitle} — Academic Session 2026-27
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>Subject: {currentSet.subjectName}</span>
              <span style={{ border: '2px solid #000', padding: '0.1rem 0.6rem', borderRadius: '4px', fontSize: '1rem', fontWeight: 900 }}>
                {currentSet.setName}
              </span>
              <span>Time Allowed: {currentSet.durationMinutes} Minutes</span>
              <span>Maximum Marks: {currentSet.totalMarks}</span>
            </div>
          </div>

          {/* Student Identification Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: '0.6rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div><strong>Student Name:</strong> ____________________________________</div>
            <div><strong>Enrolment Number:</strong> ______________________</div>
            <div><strong>Room No:</strong> ________</div>
          </div>

          {/* General Instructions */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.45 }}>
            <strong>General Instructions:</strong>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
              {currentSet.instructions.map((ins, i) => (
                <li key={i} style={{ marginBottom: '0.2rem' }}>{ins}</li>
              ))}
            </ol>
          </div>

          {/* Questions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {currentSet.questions.map((q, qIndex) => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.95rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700 }}>Q{qIndex + 1}. </span>
                  <span>{q.text}</span>

                  {/* Render MCQ Choices */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                      {q.options.map((opt, optIndex) => (
                        <div key={opt.id} style={{ fontSize: '0.9rem' }}>
                          ({String.fromCharCode(97 + optIndex)}) {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                </div>
              </div>
            ))}
          </div>

          {/* Official Teacher Answer Key & Marking Scheme */}
          {showAnswerKeyInPrint && (
            <div style={{ marginTop: '3rem', borderTop: '2px dashed #000', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000', textAlign: 'center', marginBottom: '1rem' }}>
                OFFICIAL TEACHER ANSWER KEY & MARKING SCHEME ({currentSet.setName})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000' }}>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', width: '50px', textAlign: 'center' }}>Q#</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem', width: '80px', textAlign: 'center' }}>Marks</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Correct Answer / Expected Value</th>
                    <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Marking Rubric / Step Guidelines</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSet.answerKey.map((ak) => (
                    <tr key={ak.questionId}>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>
                        {ak.questionNumber}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>
                        {ak.marks}M
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem', fontWeight: 600 }}>
                        {ak.correctAnswer}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.5rem' }}>
                        {ak.rubric || ak.explanation || 'Award full marks for exact step.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
