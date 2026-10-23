import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { OfflineAnswerSheet, Assessment } from '../../types';
import { QuestionPaperModal } from './QuestionPaperModal';
import { OfflineAiEvaluationModal } from './OfflineAiEvaluationModal';
import { AssessmentSuccessModal } from './AssessmentSuccessModal';
import { OfflineQuestionPaperModal } from './OfflineQuestionPaperModal';
import { FeedbackModal } from '../common/FeedbackModal';
import { ExamRoom } from '../student/ExamRoom';
import { 
  BookOpen, 
  Plus, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Search, 
  Printer, 
  Eye, 
  ShieldAlert, 
  Clock, 
  Award,
  UploadCloud,
  UserCheck,
  Home,
  School,
  Bell,
  LogOut
} from 'lucide-react';

export const TeacherView: React.FC = () => {
  const { 
    currentUser, 
    classes, 
    subjects, 
    assessments, 
    studentAttempts, 
    offlineSheets, 
    reattemptRequests, 
    users, 
    createStudent, 
    uploadOfflineSheet, 
    runAIEvaluation, 
    resolveReattemptRequest,
    deleteAssessment,
    updateAssessment,
    addClass,
    logout
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessments' | 'students' | 'offline_eval' | 'malpractice' | 'reports'>('dashboard');
  const [showCreatePaperModal, setShowCreatePaperModal] = useState(false);
  const [inspectingOfflineSheet, setInspectingOfflineSheet] = useState<OfflineAnswerSheet | null>(null);

  // Student creation modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentEnrolment, setStudentEnrolment] = useState(`ENR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [studentPassword, setStudentPassword] = useState('pass');
  const [studentClassId, setStudentClassId] = useState(classes[0]?.id || 'cls-10a');
  const [studentSection, setStudentSection] = useState('A');
  const [showInlineStudentClassAdd, setShowInlineStudentClassAdd] = useState(false);
  const [newStudentClassName, setNewStudentClassName] = useState('');
  const [newStudentClassSection, setNewStudentClassSection] = useState('');

  // Assessment Assignment Modal state
  const [assigningAssessment, setAssigningAssessment] = useState<Assessment | null>(null);
  const [publishedAssessment, setPublishedAssessment] = useState<Assessment | null>(null);
  const [viewingOfflinePdfAssessment, setViewingOfflinePdfAssessment] = useState<Assessment | null>(null);
  const [previewOnlineAssessment, setPreviewOnlineAssessment] = useState<Assessment | null>(null);
  const [parentReportModal, setParentReportModal] = useState<{
    studentName: string;
    enrolmentNumber: string;
  } | null>(null);
  const [assignMode, setAssignMode] = useState<'all' | 'individual'>('all');
  const [selectedAssignStudentIds, setSelectedAssignStudentIds] = useState<string[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignClassFilter, setAssignClassFilter] = useState('all');

  // Offline sheet upload state
  const [showUploadSheetModal, setShowUploadSheetModal] = useState(false);
  const [uploadAssessmentId, setUploadAssessmentId] = useState(assessments[0]?.id || '');
  const [uploadStudentId, setUploadStudentId] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState<string | null>(null);

  // Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const myAssignedClasses = classes.filter(c => currentUser.assignedClassIds?.includes(c.id));
  const myAssignedSubjects = subjects.filter(s => currentUser.assignedSubjectIds?.includes(s.id));
  const myStudents = users.filter(u => u.role === 'student' && (selectedClassFilter === 'all' || u.classId === selectedClassFilter));

  const filteredStudents = myStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    (s.enrolmentNumber && s.enrolmentNumber.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const pendingReattempts = reattemptRequests.filter(r => r.status === 'pending');
  const pendingOfflineReviews = offlineSheets.filter(s => s.evaluationStatus === 'ai_evaluated');
  const malpracticeTerminatedAttempts = studentAttempts.filter(a => a.status === 'malpractice_terminated');

  // Handle Create Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEnrolment) return;
    createStudent({
      name: studentName,
      email: studentEmail || `${studentName.toLowerCase().replace(/\s+/g, '.')}@student.oakridge.edu`,
      enrolmentNumber: studentEnrolment,
      classId: studentClassId,
      section: studentSection,
      password: studentPassword.trim() || 'pass'
    });
    setShowStudentModal(false);
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('pass');
    setStudentEnrolment(`ENR-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Handle Mock Upload Offline Sheet
  const handleUploadSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const student = users.find(u => u.id === uploadStudentId) || myStudents[0];
    if (!student) return;

    const newSheetId = uploadOfflineSheet({
      assessmentId: uploadAssessmentId || assessments[0].id,
      studentId: student.id,
      studentName: student.name,
      enrolmentNumber: student.enrolmentNumber || 'ENR-2026-999',
      classId: student.classId || 'cls-10a',
      scannedImageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80',
      questionEvaluations: []
    });

    setShowUploadSheetModal(false);
    setIsProcessingAi(newSheetId);
    runAIEvaluation(newSheetId).finally(() => setIsProcessingAi(null));
  };

  const handleRunAiEvaluationClick = async (sheetId: string) => {
    setIsProcessingAi(sheetId);
    await runAIEvaluation(sheetId);
    setIsProcessingAi(null);
  };

  // Handle Open Assignment Modal
  const handleOpenAssignModal = (asm: Assessment) => {
    setAssigningAssessment(asm);
    const targets = asm.targetStudentIds || ['all'];
    if (targets.includes('all') || targets.length === 0) {
      setAssignMode('all');
      setSelectedAssignStudentIds(users.filter(u => u.role === 'student').map(s => s.id));
    } else {
      setAssignMode('individual');
      setSelectedAssignStudentIds(targets);
    }
    setAssignSearchQuery('');
    setAssignClassFilter('all');
  };

  // Toggle individual student selection
  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedAssignStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  // Handle Save Assignment
  const handleSaveAssignment = () => {
    if (!assigningAssessment) return;
    const finalTargets = assignMode === 'all' 
      ? ['all'] 
      : (selectedAssignStudentIds.length === 0 ? ['all'] : selectedAssignStudentIds);

    updateAssessment(assigningAssessment.id, {
      targetStudentIds: finalTargets
    });
    setAssigningAssessment(null);
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Matching Executive School OS Design)          */}
      {/* ========================================================================= */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        maxWidth: '240px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
        zIndex: 40,
        padding: '1.25rem 0.85rem'
      }}>
        {/* Brand & Menu */}
        <div>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.25rem 0.5rem 1.6rem 0.5rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px -4px rgba(15, 23, 42, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <School size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Academi<span style={{ color: '#2563eb' }}>Q</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '0.15rem' }}>
                Faculty Workbench
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'dashboard' ? '#eff6ff' : 'transparent',
                color: activeTab === 'dashboard' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Home size={18} color={activeTab === 'dashboard' ? '#2563eb' : '#64748b'} />
              <span>Dashboard</span>
            </button>

            {/* 2. Assessments & Question Papers */}
            <button
              type="button"
              onClick={() => setActiveTab('assessments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'assessments' ? '#eff6ff' : 'transparent',
                color: activeTab === 'assessments' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'assessments' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FileText size={18} color={activeTab === 'assessments' ? '#2563eb' : '#64748b'} />
                <span>Assessments</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                color: activeTab === 'assessments' ? '#2563eb' : '#64748b',
                fontWeight: 600,
                background: activeTab === 'assessments' ? '#dbeafe' : '#f1f5f9',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px'
              }}>
                {assessments.length}
              </span>
            </button>

            {/* 3. AI Offline Evaluation */}
            <button
              type="button"
              onClick={() => setActiveTab('offline_eval')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'offline_eval' ? '#eff6ff' : 'transparent',
                color: activeTab === 'offline_eval' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'offline_eval' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Sparkles size={18} color={activeTab === 'offline_eval' ? '#2563eb' : '#64748b'} />
                <span>AI Offline Eval</span>
              </div>
              {pendingOfflineReviews.length > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  color: '#b45309',
                  fontWeight: 700,
                  background: '#fef3c7',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '999px'
                }}>
                  {pendingOfflineReviews.length}
                </span>
              )}
            </button>

            {/* 4. Malpractice & Integrity */}
            <button
              type="button"
              onClick={() => setActiveTab('malpractice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'malpractice' ? '#eff6ff' : 'transparent',
                color: activeTab === 'malpractice' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'malpractice' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <ShieldAlert size={18} color={activeTab === 'malpractice' ? '#2563eb' : '#64748b'} />
                <span>Malpractice</span>
              </div>
              {pendingReattempts.length > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  color: '#be123c',
                  fontWeight: 700,
                  background: '#ffe4e6',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '999px'
                }}>
                  {pendingReattempts.length}
                </span>
              )}
            </button>

            {/* 5. Student Roster */}
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'students' ? '#eff6ff' : 'transparent',
                color: activeTab === 'students' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'students' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Users size={18} color={activeTab === 'students' ? '#2563eb' : '#64748b'} />
                <span>Student Roster</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                color: activeTab === 'students' ? '#2563eb' : '#64748b',
                fontWeight: 600,
                background: activeTab === 'students' ? '#dbeafe' : '#f1f5f9',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px'
              }}>
                {filteredStudents.length}
              </span>
            </button>

            {/* 6. Reports & Parent Sheets */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'reports' ? '#eff6ff' : 'transparent',
                color: activeTab === 'reports' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'reports' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={18} color={activeTab === 'reports' ? '#2563eb' : '#64748b'} />
              <span>Academic Reports</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile & System Status Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          marginTop: '1.25rem'
        }}>
          {/* User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.875rem',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
            }}>
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                {myAssignedSubjects.map(s => s.name).join(', ') || 'Physics Faculty'}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
              <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>MySQL Live</span>
            </div>
            <button
              type="button"
              onClick={logout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                border: 'none',
                background: 'none',
                color: '#ef4444',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                borderRadius: '6px'
              }}
              title="Sign Out of Faculty Portal"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKBENCH CONTENT                                                 */}
      {/* ========================================================================= */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        minWidth: 0
      }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: '70px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          {/* Breadcrumb / Page Title */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Faculty Workbench <span style={{ margin: '0 0.35rem' }}>/</span> 
              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                {activeTab === 'dashboard' ? 'Overview & Analytics' :
                 activeTab === 'assessments' ? 'Question Papers & Quizzes' :
                 activeTab === 'offline_eval' ? 'AI Offline Evaluation' :
                 activeTab === 'malpractice' ? 'Malpractice & Exam Integrity' :
                 activeTab === 'students' ? 'Student Roster' : 'Academic Reports'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {activeTab === 'dashboard' ? 'Faculty Academic Overview' :
               activeTab === 'assessments' ? 'Assessments & Question Papers' :
               activeTab === 'offline_eval' ? 'AI Scanned Answer Sheet Evaluation' :
               activeTab === 'malpractice' ? 'Malpractice Policy & Incident Audits' :
               activeTab === 'students' ? 'Student Roster & Profiles' : 'Student Reports & Parent Sheets'}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setShowCreatePaperModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.58rem 1.15rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} /> Create Paper / Quiz
            </button>

            <button
              type="button"
              onClick={() => setShowUploadSheetModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.58rem 1.05rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <UploadCloud size={16} /> Upload Scanned Sheet
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setActiveTab('malpractice')}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {(pendingReattempts.length > 0 || malpracticeTerminatedAttempts.length > 0) && (
                  <span style={{
                    position: 'absolute',
                    top: '7px',
                    right: '7px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid #ffffff'
                  }} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ padding: '2rem 2.25rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ===================================================================== */}
          {/* TAB 1: EXECUTIVE TEACHER DASHBOARD                                    */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Urgent Action Alerts */}
              {(pendingReattempts.length > 0 || malpracticeTerminatedAttempts.length > 0) && (
                <div style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  border: '1px solid #fecdd3',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 4px 16px -2px rgba(244, 63, 94, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#e11d48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 800, color: '#9f1239', margin: 0, fontSize: '1rem' }}>
                        Urgent Malpractice & Exam Appeals Requiring Authorization
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: '#be123c', margin: '0.2rem 0 0 0' }}>
                        {malpracticeTerminatedAttempts.length} student exam sessions auto-terminated. {pendingReattempts.length} student appeal re-attempt requests pending your authorization.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('malpractice')} 
                    style={{
                      background: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.6rem 1.1rem',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Review Incidents &rarr;
                  </button>
                </div>
              )}

              {/* 1. EXECUTIVE KPI SUMMARY CARDS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '1.25rem'
              }}>
                {/* KPI 1: Active Assessments */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Assessments
                      </span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <FileText size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                        {assessments.length}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                        +2 this week
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      Online CBT & 3-Set Offline Papers
                    </span>
                  </div>

                  {/* Sparkline Visual */}
                  <div style={{ marginTop: '1rem', height: '28px', width: '100%' }}>
                    <svg viewBox="0 0 100 25" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <path d="M0,18 Q15,10 30,16 T60,8 T85,12 T100,5" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* KPI 2: Enrolled Students */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Students Enrolled
                      </span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <Users size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                        {myStudents.length || 214}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                        {myAssignedClasses.length || classes.length} Classes
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      Grade 10-A, 10-B, 11-Sci
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', height: '28px', width: '100%' }}>
                    <svg viewBox="0 0 100 25" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <path d="M0,20 Q20,12 40,15 T70,7 T100,3" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* KPI 3: AI Offline Scans */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        AI Offline Scans
                      </span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                        <Sparkles size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                        {offlineSheets.length}
                      </span>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        color: pendingOfflineReviews.length > 0 ? '#b45309' : '#059669', 
                        fontWeight: 700, 
                        background: pendingOfflineReviews.length > 0 ? '#fef3c7' : '#dcfce7', 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '999px' 
                      }}>
                        {pendingOfflineReviews.length} Need Review
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      OCR Grading Engine: 99.4%
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', height: '28px', width: '100%' }}>
                    <svg viewBox="0 0 100 25" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <path d="M0,15 Q25,22 50,11 T75,9 T100,4" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* KPI 4: Class Average Index */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Subject Mastery
                      </span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <Award size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.03em' }}>
                        92.4%
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                        +4.8% term gain
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      Physics Academic Health Index
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', height: '28px', width: '100%' }}>
                    <svg viewBox="0 0 100 25" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <path d="M0,19 Q30,14 60,10 T85,6 T100,2" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 2. MIDDLE TWO-COLUMN WORKBENCH GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
                gap: '1.5rem',
                alignItems: 'start'
              }}>
                {/* LEFT: Recent Question Papers Table */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Active Question Papers & Quizzes
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Latest published assessments assigned to classes
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('assessments')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        border: 'none',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      View All ({assessments.length}) &rarr;
                    </button>
                  </div>

                  {/* Assessments List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {assessments.slice(0, 4).map(asm => {
                      const isAllAssigned = !asm.targetStudentIds || asm.targetStudentIds.length === 0 || asm.targetStudentIds.includes('all');
                      const classNames = asm.classIds.map(id => classes.find(c => c.id === id)?.name).join(', ') || 'Grade 10';

                      return (
                        <div
                          key={asm.id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1rem 1.15rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: asm.mode === 'online' ? '#eff6ff' : '#faf5ff',
                              color: asm.mode === 'online' ? '#2563eb' : '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                                  {asm.title}
                                </span>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  background: asm.mode === 'online' ? '#dbeafe' : '#f3e8ff',
                                  color: asm.mode === 'online' ? '#1d4ed8' : '#7e22ce',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '6px'
                                }}>
                                  {asm.mode.toUpperCase()} {asm.setsCount ? '(' + asm.setsCount + ' Sets)' : ''}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>
                                Class: <strong style={{ color: '#334155' }}>{classNames}</strong> • {isAllAssigned ? 'All Students' : asm.targetStudentIds.length + ' Individual'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {asm.mode === 'offline' && (
                              <button
                                type="button"
                                onClick={() => setViewingOfflinePdfAssessment(asm)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  background: '#ffffff',
                                  border: '1px solid #d8b4fe',
                                  color: '#7c3aed',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Print PDF Multi-Sets"
                              >
                                <Printer size={12} /> Print Sets
                              </button>
                            )}
                            {asm.mode === 'online' && (
                              <button
                                type="button"
                                onClick={() => setPreviewOnlineAssessment(asm)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  background: '#ffffff',
                                  border: '1px solid #a7f3d0',
                                  color: '#059669',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Simulate CBT Exam Room"
                              >
                                <Eye size={12} /> Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(asm)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#ffffff',
                                border: '1px solid #c7d2fe',
                                color: '#4338ca',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <UserCheck size={12} /> Assign
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: Fast Creation Engine & AI Grading Shortcut */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* AI & Book Generation Hub */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px -4px rgba(49, 46, 129, 0.35)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Sparkles size={16} color="#38bdf8" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 800, color: '#ffffff' }}>
                        AI Question Paper Generator
                      </h4>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.15rem' }}>
                      Build complete question papers in seconds with automatic Bloom's taxonomy alignment, 3-set randomization, or textbook chapter extraction.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                        <span>AI Cognitive Bloom's Taxonomy Distribution</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                        <span>Multi-Set Offline Randomized Sets (Set A, B, C)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                        <span>Book Chapter PDF / Manual Marking Rubrics</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreatePaperModal(true)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                      }}
                    >
                      <Plus size={16} /> Open Paper Creator Engine &rarr;
                    </button>
                  </div>

                  {/* AI Scanned Grading Preview */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.4rem',
                    boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles size={16} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 800, color: '#0f172a' }}>
                          Offline Scanned OCR Grading
                        </h4>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                        FR-EX-10
                      </span>
                    </div>

                    <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
                      Digitize student handwritten answer sheets with automatic AI handwriting recognition and confidence scoring.
                    </p>

                    {offlineSheets.length > 0 ? (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 0.85rem', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                            {offlineSheets[0].studentName} ({offlineSheets[0].enrolmentNumber})
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: offlineSheets[0].evaluationStatus === 'teacher_verified' ? '#15803d' : '#b45309',
                            background: offlineSheets[0].evaluationStatus === 'teacher_verified' ? '#dcfce7' : '#fef3c7',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px'
                          }}>
                            {offlineSheets[0].evaluationStatus === 'teacher_verified' ? 'Verified' : 'AI Evaluated'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Score: <strong style={{ color: '#059669' }}>{offlineSheets[0].totalMarksAwarded}/{offlineSheets[0].maxMarks}</strong> ({offlineSheets[0].percentage}%)
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.85rem' }}>
                        No offline sheets uploaded yet.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('offline_eval')}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.55rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Eye size={14} /> Review All Scanned Sheets &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. BOTTOM PERFORMANCE METRICS & CHAPTER MASTERY */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Class Curriculum Mastery & Chapter Benchmarks
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Diagnostic Bloom's mastery across Physics chapters for AY 2026-27
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                    Term 1 Cohort Average
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {[
                    { chapter: 'Mechanics & Dynamics', score: 94, status: 'Mastered', color: '#16a34a' },
                    { chapter: 'Electromagnetism', score: 88, status: 'Proficient', color: '#2563eb' },
                    { chapter: 'Thermodynamics & Heat', score: 91, status: 'Mastered', color: '#16a34a' },
                    { chapter: 'Wave Optics & Light', score: 86, status: 'Good Progress', color: '#7c3aed' }
                  ].map(ch => (
                    <div key={ch.chapter} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{ch.chapter}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: ch.color }}>{ch.score}%</span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.45rem' }}>
                        <div style={{ width: ch.score + '%', height: '100%', background: ch.color, borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Status: <strong style={{ color: ch.color }}>{ch.status}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: ASSESSMENTS & QUESTION PAPERS                                  */}
          {/* ===================================================================== */}
      {/* TAB 2: ASSESSMENTS & QUESTION PAPERS */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Published & Draft Assessments</h3>
            <button onClick={() => setShowCreatePaperModal(true)} className="btn-primary">
              <Plus size={16} /> Create New Assessment / Quiz
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {assessments.map(asm => {
              const sub = subjects.find(s => s.id === asm.subjectId);
              const classNames = asm.classIds.map(id => classes.find(c => c.id === id)?.name).join(', ');

              const isAllAssigned = !asm.targetStudentIds || asm.targetStudentIds.length === 0 || asm.targetStudentIds.includes('all');
              const assignedCount = isAllAssigned ? null : asm.targetStudentIds.length;

              return (
                <div key={asm.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge ${asm.mode === 'online' ? 'badge-primary' : 'badge-purple'}`}>
                          {asm.mode.toUpperCase()} {asm.setsCount ? `(${asm.setsCount} Sets)` : ''}
                        </span>
                        <span className="badge badge-cyan">{asm.type}</span>
                      </div>
                      <span className="badge badge-success">{asm.status}</span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>{asm.title}</h3>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Subject: <strong style={{ color: '#0f172a' }}>{sub?.name || 'Science'}</strong> • Class: {classNames}
                    </div>

                    {/* Assignment Target Badge */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: isAllAssigned ? '#ecfdf5' : '#eef2ff', 
                      border: `1px solid ${isAllAssigned ? '#a7f3d0' : '#c7d2fe'}`,
                      borderRadius: '0.5rem', 
                      padding: '0.4rem 0.65rem', 
                      marginBottom: '0.85rem' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: isAllAssigned ? '#065f46' : '#3730a3' }}>
                        {isAllAssigned ? <Users size={13} /> : <UserCheck size={13} />}
                        <span>{isAllAssigned ? 'Assigned to All Students' : `Assigned to ${assignedCount} Student${assignedCount !== 1 ? 's' : ''}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(asm)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isAllAssigned ? '#059669' : '#4f46e5',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        Change
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Marks</span>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>{asm.totalMarks}M</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Questions</span>
                        <div style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.95rem' }}>{asm.questions.length}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Duration</span>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{asm.durationMinutes}m</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Created: {new Date(asm.createdAt).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {asm.mode === 'offline' && (
                        <button 
                          type="button"
                          onClick={() => setViewingOfflinePdfAssessment(asm)}
                          className="btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#7c3aed', color: '#7c3aed', background: '#faf5ff', fontWeight: 700 }}
                          title="View and print multi-set offline PDF question papers"
                        >
                          <Printer size={13} /> Print PDF Sets
                        </button>
                      )}
                      {asm.mode === 'online' && (
                        <button 
                          type="button"
                          onClick={() => setPreviewOnlineAssessment(asm)}
                          className="btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#059669', color: '#059669', background: '#ecfdf5', fontWeight: 700 }}
                          title="Simulate student online CBT exam portal"
                        >
                          <Eye size={13} /> Online Preview
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenAssignModal(asm)}
                        className="btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#4f46e5', color: '#4f46e5', background: '#eef2ff', fontWeight: 700 }}
                      >
                        <UserCheck size={14} /> Assign
                      </button>
                      <button 
                        onClick={() => deleteAssessment(asm.id)}
                        className="btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE AI EVALUATION */}
      {activeTab === 'offline_eval' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>AI Scanned Answer Sheet Evaluation (FR-EX-10 - 12)</h3>
              <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                Upload written offline answer papers, let AI extract OCR handwriting, verify against marking rubrics, and approve final student marks.
              </p>
            </div>
            <button onClick={() => setShowUploadSheetModal(true)} className="btn-primary">
              <UploadCloud size={16} /> Upload New Scanned Answer Sheet
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Student / Enrolment (FR-STD-02)</th>
                  <th>Assessment</th>
                  <th>Upload Timestamp</th>
                  <th>Evaluation Status</th>
                  <th>Awarded Marks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offlineSheets.map(sheet => {
                  const asm = assessments.find(a => a.id === sheet.assessmentId);
                  const isEvaluatingThis = isProcessingAi === sheet.id;

                  return (
                    <tr key={sheet.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{sheet.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontFamily: 'var(--font-mono)' }}>
                            {sheet.enrolmentNumber}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{asm?.title || 'Offline Exam'}</div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {new Date(sheet.uploadDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        {sheet.evaluationStatus === 'teacher_verified' && (
                          <span className="badge badge-success"><CheckCircle2 size={12} /> Teacher Verified</span>
                        )}
                        {sheet.evaluationStatus === 'ai_evaluated' && (
                          <span className="badge badge-warning"><Sparkles size={12} /> AI Evaluated (Needs Review)</span>
                        )}
                        {sheet.evaluationStatus === 'pending' && (
                          <span className="badge badge-purple">Pending OCR</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                          {sheet.totalMarksAwarded} / {sheet.maxMarks} ({sheet.percentage}%)
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          {sheet.evaluationStatus === 'pending' ? (
                            <button 
                              onClick={() => handleRunAiEvaluationClick(sheet.id)}
                              disabled={isEvaluatingThis}
                              className="btn-primary btn-sm"
                            >
                              <Sparkles size={14} /> {isEvaluatingThis ? 'AI Evaluating...' : 'Run AI Grading'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => setInspectingOfflineSheet(sheet)}
                              className="btn-primary btn-sm"
                            >
                              <Eye size={14} /> Inspect & Validate Marks
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MALPRACTICE & RE-ATTEMPTS */}
      {activeTab === 'malpractice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Malpractice Rules Summary */}
          <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #e11d48' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <ShieldAlert size={20} color="#e11d48" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Malpractice Policy & 3-Strike Auto-Termination Engine (7.8.2)</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.8125rem' }}>
              Prohibited actions (tab switching, clipboard copy-paste, Alt+Tab, devtools) are automatically logged. On the 3rd violation, the exam is immediately closed, status set to "Malpractice", and an automatic alert sent to the teacher. Re-attempts require explicit teacher authorization (7.8.3).
            </p>
          </div>

          {/* Pending Reattempt Requests */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <Clock size={18} color="#d97706" /> Student Re-attempt Authorization Requests ({reattemptRequests.length})
            </h3>

            {reattemptRequests.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No pending re-attempt requests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reattemptRequests.map(req => (
                  <div key={req.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{req.studentName}</span>
                          <span className="badge badge-primary">{req.enrolmentNumber}</span>
                          <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Exam: <strong>{req.assessmentTitle}</strong> • Requested at: {new Date(req.requestedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Student Explanation / Appeal:</span>
                      <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>
                        "{req.reason}"
                      </p>
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => resolveReattemptRequest(req.id, 'rejected')}
                          className="btn-danger btn-sm"
                        >
                          <XCircle size={14} /> Reject Request
                        </button>
                        <button 
                          onClick={() => resolveReattemptRequest(req.id, 'approved', 'same')}
                          className="btn-secondary btn-sm"
                          title="Grant re-attempt with original question paper"
                        >
                          <CheckCircle2 size={14} /> Approve (Same Paper)
                        </button>
                        <button 
                          onClick={() => resolveReattemptRequest(req.id, 'approved', 'new_random')}
                          className="btn-success btn-sm"
                          title="Grant re-attempt with newly randomized question set (7.8.3)"
                        >
                          <CheckCircle2 size={14} /> Approve (Newly Randomized Paper)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Malpractice Audit Logs List */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <ShieldAlert size={18} color="#e11d48" /> Malpractice Incident Audit Trail
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {malpracticeTerminatedAttempts.map(attempt => (
                <div key={attempt.id} style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.625rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#9f1239' }}>{attempt.studentName}</span>
                      <span className="badge badge-danger">3 Strikes Terminated</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Enrolment: {attempt.enrolmentNumber}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Terminated at: {new Date(attempt.submitTime || attempt.startTime).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {attempt.malpracticeLogs.map(log => (
                      <div key={log.id} style={{ fontSize: '0.75rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#e11d48', fontWeight: 700 }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span>{log.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Search student or Enrolment ID..." 
                  value={studentSearch} 
                  onChange={(e) => setStudentSearch(e.target.value)} 
                  className="form-input" 
                  style={{ paddingLeft: '2rem' }}
                />
              </div>

              <select 
                value={selectedClassFilter} 
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="form-select"
                style={{ width: '200px' }}
              >
                <option value="all">All Assigned Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                ))}
              </select>
            </div>

            <button onClick={() => setShowStudentModal(true)} className="btn-primary">
              <Plus size={16} /> Add Student Record (FR-STD-01)
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Enrolment Number (BR-01)</th>
                  <th>Class & Section</th>
                  <th>Assessments Taken</th>
                  <th>Academic Health</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(std => {
                  const stdClass = classes.find(c => c.id === std.classId);
                  const attempts = studentAttempts.filter(a => a.studentId === std.id);
                  const avgScore = attempts.length > 0 
                    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
                    : 90;

                  return (
                    <tr key={std.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={std.avatar} alt={std.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{std.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{std.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                          {std.enrolmentNumber}
                        </span>
                      </td>
                      <td style={{ color: '#0f172a' }}>
                        {stdClass ? `${stdClass.name} (${stdClass.section})` : 'Grade 10-A'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{attempts.length} attempts</span>
                      </td>
                      <td>
                        <span className={`badge ${avgScore >= 75 ? 'badge-success' : avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {avgScore}% Score Index
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & PARENT SHEETS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
              Student Academic Performance & Parent Report Sheets (FR-RPT-01 - 09)
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              Generate comprehensive report sheets with marks breakdown, Bloom's mastery, and teacher remarks.
            </p>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrolment ID</th>
                    <th>Physics Score</th>
                    <th>Math Score</th>
                    <th>Overall Grade</th>
                    <th style={{ textAlign: 'right' }}>Parent Report Card</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudents.map(std => (
                    <tr key={std.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{std.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#4f46e5' }}>{std.enrolmentNumber}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>23 / 25 (92%)</td>
                      <td style={{ color: '#0284c7', fontWeight: 700 }}>46 / 50 (92%)</td>
                      <td>
                        <span className="badge badge-success">A+ Distinction</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => setParentReportModal({
                            studentName: std.name,
                            enrolmentNumber: std.enrolmentNumber || 'ENR-2026-001'
                          })}
                          className="btn-secondary btn-sm"
                        >
                          <Printer size={13} /> View / Print Sheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '480px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Create New Student Record (FR-STD-01)</h2>
              <button onClick={() => setShowStudentModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Student Full Name</label>
                <input 
                  type="text" 
                  value={studentName} 
                  onChange={(e) => setStudentName(e.target.value)} 
                  placeholder="e.g. Maya Patel" 
                  required 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label">Unique Enrolment Number (Student / Parent Username)</label>
                <input 
                  type="text" 
                  value={studentEnrolment} 
                  onChange={(e) => setStudentEnrolment(e.target.value)} 
                  placeholder="e.g. ENR-2026-102" 
                  required 
                  className="form-input" 
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  Students and parents use this Enrolment ID as their login username.
                </span>
              </div>

              <div>
                <label className="form-label">Student & Parent Access Password / Passcode</label>
                <input 
                  type="text" 
                  value={studentPassword} 
                  onChange={(e) => setStudentPassword(e.target.value)} 
                  placeholder="Set passcode (e.g. pass or 1234)" 
                  required 
                  className="form-input" 
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  Passcode to log into Student Assessment Room and Parent Report Desk. Default: <code>pass</code>
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Class Assignment</label>
                  <button 
                    type="button" 
                    onClick={() => setShowInlineStudentClassAdd(!showInlineStudentClassAdd)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={12} /> {showInlineStudentClassAdd ? 'Cancel' : '+ Add Class'}
                  </button>
                </div>
                <select 
                  value={studentClassId} 
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowInlineStudentClassAdd(true);
                    } else {
                      setStudentClassId(e.target.value);
                      setShowInlineStudentClassAdd(false);
                    }
                  }}
                  className="form-select"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 700, color: '#4f46e5' }}>➕ + Add New Class / Section (New Field)...</option>
                </select>

                {showInlineStudentClassAdd && (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}>Add New Class Division</div>
                    <input type="text" placeholder="Grade/Class (e.g. Grade 12)" value={newStudentClassName} onChange={e => setNewStudentClassName(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <input type="text" placeholder="Section (e.g. Section B)" value={newStudentClassSection} onChange={e => setNewStudentClassSection(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" onClick={() => setShowInlineStudentClassAdd(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>Cancel</button>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!newStudentClassName.trim()) return;
                          const clsId = `cls-${Date.now()}`;
                          addClass({
                            name: newStudentClassName.trim(),
                            section: newStudentClassSection.trim() || 'A',
                            academicYear: '2026-2027',
                            studentCount: 30
                          });
                          setStudentClassId(clsId);
                          setShowInlineStudentClassAdd(false);
                          setNewStudentClassName('');
                          setNewStudentClassSection('');
                        }} 
                        className="btn-primary btn-sm" 
                        style={{ fontSize: '0.7rem' }}
                      >
                        Save & Select Class
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Section Tag</label>
                <input 
                  type="text" 
                  value={studentSection} 
                  onChange={(e) => setStudentSection(e.target.value)} 
                  placeholder="e.g. A"
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowStudentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD OFFLINE SHEET MODAL */}
      {showUploadSheetModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '520px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Upload Offline Written Answer Sheet</h2>
              <button onClick={() => setShowUploadSheetModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleUploadSheet} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Assessment</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowUploadSheetModal(false);
                      setShowCreatePaperModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={12} /> + Create New Paper
                  </button>
                </div>
                <select 
                  value={uploadAssessmentId} 
                  onChange={(e) => {
                    if (e.target.value === '__create_new__') {
                      setShowUploadSheetModal(false);
                      setShowCreatePaperModal(true);
                    } else {
                      setUploadAssessmentId(e.target.value);
                    }
                  }}
                  className="form-select"
                >
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.mode})</option>
                  ))}
                  <option value="__create_new__" style={{ fontWeight: 700, color: '#4f46e5' }}>➕ + Create New Question Paper...</option>
                </select>
              </div>

              <div>
                <label className="form-label">Select Student (Auto-mapped via barcode / enrolment number)</label>
                <select 
                  value={uploadStudentId} 
                  onChange={(e) => setUploadStudentId(e.target.value)}
                  className="form-select"
                >
                  {myStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.enrolmentNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', background: '#f8fafc' }}>
                <UploadCloud size={32} color="#4f46e5" style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Sample Handwritten Sheet Attached</div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>300 DPI OCR ready for automated rubric analysis</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUploadSheetModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Sparkles size={16} /> Upload & Trigger AI Grading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAPER GENERATOR MODAL */}
      {showCreatePaperModal && (
        <QuestionPaperModal 
          onClose={() => setShowCreatePaperModal(false)}
          onSaved={(createdAssessment) => {
            setPublishedAssessment(createdAssessment);
            setActiveTab('assessments');
          }}
        />
      )}

      {/* ASSESSMENT PUBLISHED SUCCESS MODAL */}
      {publishedAssessment && (
        <AssessmentSuccessModal
          assessment={publishedAssessment}
          onClose={() => setPublishedAssessment(null)}
          onViewAssessments={() => {
            setPublishedAssessment(null);
            setActiveTab('assessments');
          }}
          onAssign={(asm) => {
            setPublishedAssessment(null);
            setAssigningAssessment(asm);
          }}
          onPrintOffline={(asm) => {
            setPublishedAssessment(null);
            setViewingOfflinePdfAssessment(asm);
          }}
          onPreviewOnline={(asm) => {
            setPublishedAssessment(null);
            setPreviewOnlineAssessment(asm);
          }}
        />
      )}

      {/* OFFLINE QUESTION PAPER SETS MODAL */}
      {viewingOfflinePdfAssessment && (
        <OfflineQuestionPaperModal
          assessment={viewingOfflinePdfAssessment}
          onClose={() => setViewingOfflinePdfAssessment(null)}
        />
      )}

      {/* ONLINE CBT EXAM PREVIEW (TEACHER SIMULATION) */}
      {previewOnlineAssessment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, background: '#f8fafc', overflowY: 'auto' }}>
          <div style={{ background: '#0f172a', color: '#ffffff', padding: '0.65rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
              <span className="badge badge-warning" style={{ background: '#f59e0b', color: '#000', fontWeight: 800 }}>Teacher CBT Portal Preview</span>
              <span style={{ color: '#cbd5e1' }}>Simulating real-time student exam environment with anti-malpractice monitoring</span>
            </div>
            <button 
              onClick={() => setPreviewOnlineAssessment(null)} 
              className="btn-secondary btn-sm" 
              style={{ color: '#ffffff', borderColor: '#475569', background: 'rgba(255,255,255,0.1)' }}
            >
              Exit Online Preview
            </button>
          </div>
          <ExamRoom 
            assessment={previewOnlineAssessment} 
            attempt={{
              id: `preview-${previewOnlineAssessment.id}`,
              assessmentId: previewOnlineAssessment.id,
              studentId: currentUser.id,
              studentName: `${currentUser.name} (Teacher Preview)`,
              enrolmentNumber: 'CBT-PREVIEW',
              classId: previewOnlineAssessment.classIds[0] || 'cls-10a',
              startTime: new Date().toISOString(),
              status: 'in_progress',
              answers: [],
              maxScore: previewOnlineAssessment.totalMarks,
              malpracticeCount: 0,
              malpracticeLogs: []
            }} 
            onExit={() => setPreviewOnlineAssessment(null)} 
          />
        </div>
      )}

      {/* PARENT REPORT MODAL */}
      {parentReportModal && (
        <FeedbackModal
          isOpen={true}
          onClose={() => setParentReportModal(null)}
          type="info"
          title="Parent Report Card Generated"
          message={`Academic summary and performance card for ${parentReportModal.studentName} has been compiled.`}
          details={[
            { label: 'Student Name', value: parentReportModal.studentName },
            { label: 'Enrolment ID', value: parentReportModal.enrolmentNumber },
            { label: 'Report Status', value: <span className="badge badge-success">Ready for Parent Review</span> },
            { label: 'Recommended Action', value: 'Switch to Parent View using the top role switcher to review or print.' }
          ]}
          primaryButtonText="Understood"
          onPrimaryClick={() => setParentReportModal(null)}
        />
      )}

      {/* OFFLINE AI INSPECTION MODAL */}
      {inspectingOfflineSheet && (
        <OfflineAiEvaluationModal 
          sheet={inspectingOfflineSheet}
          onClose={() => setInspectingOfflineSheet(null)}
        />
      )}

      {/* ASSIGN ASSESSMENT MODAL */}
      {assigningAssessment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Assign Assessment
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                    <strong>{assigningAssessment.title}</strong> • {subjects.find(s => s.id === assigningAssessment.subjectId)?.name || 'Subject'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAssigningAssessment(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Assignment Mode Selection */}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>
                  Who should be assigned this assessment?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Option 1: All Students */}
                  <div 
                    onClick={() => setAssignMode('all')}
                    style={{
                      border: `2px solid ${assignMode === 'all' ? '#4f46e5' : '#e2e8f0'}`,
                      background: assignMode === 'all' ? '#f5f3ff' : '#f8fafc',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: assignMode === 'all' ? '#4338ca' : '#1e293b', fontSize: '0.95rem' }}>
                        👥 All Students
                      </span>
                      <input 
                        type="radio" 
                        name="assignMode" 
                        checked={assignMode === 'all'} 
                        onChange={() => setAssignMode('all')}
                        style={{ accentColor: '#4f46e5', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Assign to all students enrolled in the designated class(es).
                    </span>
                  </div>

                  {/* Option 2: Individual Students */}
                  <div 
                    onClick={() => {
                      setAssignMode('individual');
                      if (selectedAssignStudentIds.length === 0) {
                        setSelectedAssignStudentIds(users.filter(u => u.role === 'student').map(s => s.id));
                      }
                    }}
                    style={{
                      border: `2px solid ${assignMode === 'individual' ? '#4f46e5' : '#e2e8f0'}`,
                      background: assignMode === 'individual' ? '#f5f3ff' : '#f8fafc',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: assignMode === 'individual' ? '#4338ca' : '#1e293b', fontSize: '0.95rem' }}>
                        👤 Individual Students
                      </span>
                      <input 
                        type="radio" 
                        name="assignMode" 
                        checked={assignMode === 'individual'} 
                        onChange={() => setAssignMode('individual')}
                        style={{ accentColor: '#4f46e5', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Select specific students who are eligible to take this exam.
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual Student Selection Panel */}
              {assignMode === 'individual' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1rem'
                }}>
                  {/* Filter and Search Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text"
                        placeholder="Search by student name, roll number..."
                        value={assignSearchQuery}
                        onChange={(e) => setAssignSearchQuery(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem' }}
                      />
                    </div>
                    <select 
                      value={assignClassFilter}
                      onChange={(e) => setAssignClassFilter(e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', fontSize: '0.8125rem', paddingRight: '2rem' }}
                    >
                      <option value="all">All Classes</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - Sec {c.section}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selection Controls Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
                      Selected: <strong style={{ color: '#4f46e5' }}>{selectedAssignStudentIds.length}</strong> / {users.filter(u => u.role === 'student').length} Students
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const candidateIds = users
                            .filter(u => u.role === 'student' && (assignClassFilter === 'all' || u.classId === assignClassFilter))
                            .map(u => u.id);
                          setSelectedAssignStudentIds(prev => Array.from(new Set([...prev, ...candidateIds])));
                        }}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Select All Filtered
                      </button>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const candidateIds = new Set(
                            users
                              .filter(u => u.role === 'student' && (assignClassFilter === 'all' || u.classId === assignClassFilter))
                              .map(u => u.id)
                          );
                          setSelectedAssignStudentIds(prev => prev.filter(id => !candidateIds.has(id)));
                        }}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    paddingRight: '0.25rem'
                  }}>
                    {users
                      .filter(u => {
                        if (u.role !== 'student') return false;
                        if (assignClassFilter !== 'all' && u.classId !== assignClassFilter) return false;
                        if (assignSearchQuery) {
                          const q = assignSearchQuery.toLowerCase();
                          return u.name.toLowerCase().includes(q) || 
                                 (u.enrolmentNumber && u.enrolmentNumber.toLowerCase().includes(q)) ||
                                 u.email.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map(student => {
                        const isSelected = selectedAssignStudentIds.includes(student.id);
                        const stClass = classes.find(c => c.id === student.classId);

                        return (
                          <div
                            key={student.id}
                            onClick={() => handleToggleStudentSelection(student.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.6rem 0.75rem',
                              borderRadius: '0.5rem',
                              background: isSelected ? '#ffffff' : '#f1f5f9',
                              border: `1px solid ${isSelected ? '#c7d2fe' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleStudentSelection(student.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ accentColor: '#4f46e5', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isSelected ? '#4f46e5' : '#cbd5e1',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}>
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                                  {student.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {student.enrolmentNumber || student.email}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                {stClass?.name || 'Grade 10'} - {student.section || 'A'}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {users.filter(u => {
                      if (u.role !== 'student') return false;
                      if (assignClassFilter !== 'all' && u.classId !== assignClassFilter) return false;
                      if (assignSearchQuery) {
                        const q = assignSearchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || 
                               (u.enrolmentNumber && u.enrolmentNumber.toLowerCase().includes(q)) ||
                               u.email.toLowerCase().includes(q);
                      }
                      return true;
                    }).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No students found matching your search or filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notice Info */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.78rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BookOpen size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  {assignMode === 'all' 
                    ? 'All students in the designated class(es) will see this assessment in their portal.' 
                    : `Only the ${selectedAssignStudentIds.length} selected student(s) will have access to this assessment.`}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: '#f8fafc'
            }}>
              <button 
                type="button" 
                onClick={() => setAssigningAssessment(null)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveAssignment} 
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <CheckCircle2 size={16} /> Save & Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  );
};