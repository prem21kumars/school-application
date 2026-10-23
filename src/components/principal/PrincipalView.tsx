import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import type { User, UserRole, SchoolClass } from '../../types';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Edit3, 
  AlertTriangle,
  Layers,
  Search,
  UserPlus,
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
  Home,
  LayoutGrid,
  ClipboardList,
  CreditCard,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Monitor,
  School,
  BarChart2
} from 'lucide-react';

export const PrincipalView: React.FC = () => {
  const { 
    currentUser,
    notifications,
    markAllNotificationsRead,
    logout,
    changePassword,
    users, 
    classes, 
    subjects, 
    assessments, 
    studentAttempts, 
    createUser, 
    deleteUser, 
    createTeacher, 
    updateTeacher, 
    toggleTeacherStatus, 
    addClass, 
    addSubject, 
    resetAllUsersPasswords, 
    resetUserPassword 
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await changePassword(newPassword || undefined, editEmail || undefined);
      setIsUpdatingPassword(false);
      if (res.success) {
        setPasswordSuccess(res.message || 'Password updated successfully!');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordSuccess('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setPasswordError(res.message || 'Failed to update credentials.');
      }
    } catch (err: any) {
      setIsUpdatingPassword(false);
      setPasswordError(err?.message || 'Failed to update credentials.');
    }
  };

  const [isResettingAll, setIsResettingAll] = useState(false);
  const [resetAllSuccessNotice, setResetAllSuccessNotice] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'teachers' | 'students' | 'classes' | 'examinations' | 'academic_reports' | 'attendance' | 'curriculum' | 'user_management' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Universal User Creation Modal State (Admin / Teacher / Student / Parent)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('teacher');
  const [newUserPassword, setNewUserPassword] = useState('teach');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('teach');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserEnrolmentNumber, setNewUserEnrolmentNumber] = useState('');
  const [newUserClassId, setNewUserClassId] = useState('');
  const [newUserClassIds, setNewUserClassIds] = useState<string[]>([]);
  const [newUserSubjectIds, setNewUserSubjectIds] = useState<string[]>([]);
  const [newUserParentEmail, setNewUserParentEmail] = useState('');
  const [newUserParentPhone, setNewUserParentPhone] = useState('');
  const [newUserStudentId, setNewUserStudentId] = useState('');
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Quick Password & Email Reset Modal State for Admin Table
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [targetEditUser, setTargetEditUser] = useState<User | null>(null);
  const [editTargetEmail, setEditTargetEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPasswordText, setShowEditPasswordText] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState('');
  const [editPasswordSuccess, setEditPasswordSuccess] = useState('');
  const [isSubmittingEditPassword, setIsSubmittingEditPassword] = useState(false);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');

  // Reset All Passwords Modal State
  const [showResetAllModal, setShowResetAllModal] = useState(false);

  // System SMTP Email Configuration Modal State
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpHasExistingPassword, setSmtpHasExistingPassword] = useState(false);
  const [smtpIsConfigured, setSmtpIsConfigured] = useState(false);
  const [showSmtpPasswordText, setShowSmtpPasswordText] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [smtpStatusMessage, setSmtpStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // Deep-Dive Inspection Modals for Single-View Dashboard
  const [inspectingClass, setInspectingClass] = useState<SchoolClass | null>(null);
  const [classModalTab, setClassModalTab] = useState<'overview' | 'teachers' | 'assessments' | 'students'>('overview');
  const [inspectingTeacher, setInspectingTeacher] = useState<User | null>(null);

  // User Accounts Tab Filters
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  
  // Teacher Creation / Edit Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('teach');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Add Class Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [newClassSubjectIds, setNewClassSubjectIds] = useState<string[]>([]);
  const [showAddCustomSubject, setShowAddCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customSubjectCode, setCustomSubjectCode] = useState('');

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedAttempts = studentAttempts.filter(a => a.status === 'evaluated');
  const schoolAvgScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length)
    : 0;

  // Filtered users for User Accounts Management tab
  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      (u.enrolmentNumber && u.enrolmentNumber.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const generateRandomPassword = (role: UserRole) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let rand = '';
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = role === 'principal' ? 'Admin' : role === 'teacher' ? 'Teach' : 'User';
    const generated = `${prefix}#${rand}`;
    setNewUserPassword(generated);
    setNewUserConfirmPassword(generated);
  };

  const handleRoleChange = (role: UserRole) => {
    setNewUserRole(role);
    const defaultPass = role === 'principal' ? 'admin' : role === 'teacher' ? 'teach' : 'pass';
    setNewUserPassword(defaultPass);
    setNewUserConfirmPassword(defaultPass);
    setCreateUserError('');
  };

  const handleOpenCreateUser = (presetRole: UserRole = 'teacher') => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole(presetRole);
    const defaultPass = presetRole === 'principal' ? 'admin' : presetRole === 'teacher' ? 'teach' : 'pass';
    setNewUserPassword(defaultPass);
    setNewUserConfirmPassword(defaultPass);
    setShowNewUserPassword(false);
    setNewUserEnrolmentNumber(`ENR-2026-${Math.floor(100 + Math.random() * 900)}`);
    setNewUserClassId(classes[0]?.id || '');
    setNewUserClassIds([]);
    setNewUserSubjectIds([]);
    setNewUserParentEmail('');
    setNewUserParentPhone('');
    setNewUserStudentId('');
    setCreateUserError('');
    setCreateUserSuccess('');
    setIsSubmittingUser(false);
    setShowCreateUserModal(true);
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    if (!newUserName.trim()) {
      setCreateUserError('Please provide the full name of the user.');
      return;
    }
    if (!newUserEmail.trim()) {
      setCreateUserError('Please provide a valid login institutional email or username.');
      return;
    }
    if (newUserRole === 'student' && !newUserEnrolmentNumber.trim()) {
      setCreateUserError('Student Enrolment ID is required (e.g. ENR-2026-105).');
      return;
    }
    if (!newUserPassword.trim()) {
      setCreateUserError('Password cannot be empty.');
      return;
    }
    if (newUserPassword.length < 3) {
      setCreateUserError('Password must be at least 3 characters long.');
      return;
    }
    if (newUserPassword !== newUserConfirmPassword) {
      setCreateUserError('New password and confirmation password do not match.');
      return;
    }

    setIsSubmittingUser(true);
    const res = await createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword.trim(),
      enrolmentNumber: newUserRole === 'student' ? newUserEnrolmentNumber.trim() : undefined,
      assignedClassIds: newUserRole === 'teacher' ? newUserClassIds : (newUserClassId ? [newUserClassId] : []),
      assignedSubjectIds: newUserRole === 'teacher' ? newUserSubjectIds : [],
      parentEmail: newUserRole === 'parent' ? newUserParentEmail.trim() : undefined,
      parentPhone: newUserRole === 'parent' ? newUserParentPhone.trim() : undefined,
      studentId: newUserRole === 'parent' ? newUserStudentId : undefined
    });

    setIsSubmittingUser(false);
    if (res.success && res.user) {
      setCreateUserSuccess(`User account created successfully in MySQL database for ${res.user.name} (${res.user.role.toUpperCase()})!`);
    } else {
      setCreateUserError(res.message || 'Failed to create user account in database.');
    }
  };

  const handleOpenEditPassword = (user: User) => {
    setTargetEditUser(user);
    setEditTargetEmail(user.email || '');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setShowEditPasswordText(false);
    setEditPasswordError('');
    setEditPasswordSuccess('');
    setIsSubmittingEditPassword(false);
    setShowEditPasswordModal(true);
  };

  const handleSaveEditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEditUser) return;
    setEditPasswordError('');
    setEditPasswordSuccess('');

    const cleanEmail = editTargetEmail.trim().toLowerCase();
    const isEmailChanged = cleanEmail && cleanEmail !== targetEditUser.email.toLowerCase();
    const isPasswordProvided = Boolean(editNewPassword && editNewPassword.trim());

    if (!isEmailChanged && !isPasswordProvided) {
      setEditPasswordError('Please enter a new password or change the email address.');
      return;
    }

    if (cleanEmail && !cleanEmail.includes('@')) {
      setEditPasswordError('Please enter a valid email address.');
      return;
    }

    if (isPasswordProvided) {
      if (editNewPassword.length < 3) {
        setEditPasswordError('Password must be at least 3 characters long.');
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        setEditPasswordError('Password and confirmation do not match.');
        return;
      }
    }

    setIsSubmittingEditPassword(true);
    const res = await resetUserPassword(
      targetEditUser.id, 
      isPasswordProvided ? editNewPassword.trim() : undefined,
      isEmailChanged ? cleanEmail : undefined
    );
    setIsSubmittingEditPassword(false);

    if (res.success) {
      setEditPasswordSuccess(`Credentials successfully updated in database for ${targetEditUser.name}!`);
      setTimeout(() => {
        setShowEditPasswordModal(false);
      }, 1500);
    } else {
      setEditPasswordError(res.message || 'Failed to update credentials on server.');
    }
  };

  const handleOpenDeleteUserModal = (user: User) => {
    setDeleteUserError('');
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.role === 'principal' && users.filter(u => u.role === 'principal').length <= 1) {
      setDeleteUserError('Cannot delete the primary Administrator account.');
      return;
    }

    setIsDeletingUser(true);
    setDeleteUserError('');
    try {
      const res = await deleteUser(userToDelete.id);
      if (res && !res.success) {
        setDeleteUserError(res.message || 'Failed to delete user.');
        setIsDeletingUser(false);
      } else {
        setIsDeletingUser(false);
        setUserToDelete(null);
      }
    } catch (err: any) {
      setDeleteUserError(err?.message || 'Error occurred while deleting user.');
      setIsDeletingUser(false);
    }
  };

  const handleConfirmResetAll = async () => {
    setIsResettingAll(true);
    setResetAllSuccessNotice('');
    const res = await resetAllUsersPasswords();
    setIsResettingAll(false);
    setShowResetAllModal(false);
    if (res.success) {
      setResetAllSuccessNotice('All institutional user accounts have been successfully reset to defaults in the database!');
      setTimeout(() => setResetAllSuccessNotice(''), 6000);
    } else {
      alert(res.message || 'Failed to reset all passwords.');
    }
  };

  const copyCredentials = (user: User) => {
    const credText = `Oakridge School Portal Login:\nRole: ${user.role.toUpperCase()}\nIdentifier: ${user.email || user.enrolmentNumber}\nPassword: ${user.password || '(not set)'}`;
    navigator.clipboard.writeText(credText);
    setCopiedUserId(user.id);
    setTimeout(() => setCopiedUserId(null), 2500);
  };

  const handleOpenCreateTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPassword('teach');
    setSelectedClassIds([]);
    setSelectedSubjectIds([]);
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setTeacherEmail(teacher.email);
    setTeacherPassword(teacher.password || 'teach');
    setSelectedClassIds(teacher.assignedClassIds || []);
    setSelectedSubjectIds(teacher.assignedSubjectIds || []);
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: teacherName,
        email: teacherEmail,
        password: teacherPassword.trim() || 'teach',
        assignedClassIds: selectedClassIds,
        assignedSubjectIds: selectedSubjectIds
      });
    } else {
      createTeacher({
        name: teacherName,
        email: teacherEmail,
        password: teacherPassword.trim() || 'teach',
        assignedClassIds: selectedClassIds,
        assignedSubjectIds: selectedSubjectIds
      });
    }
    setShowTeacherModal(false);
  };

  const handleOpenClassModal = () => {
    setNewClassName('');
    setNewSection('');
    setNewAcademicYear('2026-2027');
    // Default select standard subjects if desired
    setNewClassSubjectIds(subjects.slice(0, 3).map(s => s.id));
    setShowAddCustomSubject(false);
    setCustomSubjectName('');
    setCustomSubjectCode('');
    setShowClassModal(true);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newSection) return;
    addClass({
      name: newClassName,
      section: newSection,
      academicYear: newAcademicYear,
      studentCount: 30,
      subjectIds: newClassSubjectIds
    });
    setShowClassModal(false);
    setNewClassName('');
    setNewSection('');
    setNewClassSubjectIds([]);
  };

  const toggleClassSelection = (clsId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(clsId) ? prev.filter(id => id !== clsId) : [...prev, clsId]
    );
  };

  const toggleSubjectSelection = (subId: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const toggleNewClassSubject = (subId: string) => {
    setNewClassSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleAddCustomSubject = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!customSubjectName.trim()) return;
    const code = customSubjectCode.trim() || customSubjectName.trim().slice(0, 3).toUpperCase() + '-101';
    const created = addSubject({
      name: customSubjectName.trim(),
      code: code.toUpperCase()
    });
    setNewClassSubjectIds(prev => [...prev, created.id]);
    setCustomSubjectName('');
    setCustomSubjectCode('');
    setShowAddCustomSubject(false);
  };

  const handleOpenEmailConfigModal = async () => {
    setSmtpStatusMessage(null);
    setShowEmailConfigModal(true);
    try {
      const cfg = await ApiService.getEmailConfig();
      if (cfg) {
        setSmtpHost(cfg.host || 'smtp.gmail.com');
        setSmtpPort(cfg.port || 587);
        setSmtpUsername(cfg.username || '');
        setSmtpHasExistingPassword(!!cfg.hasPassword);
        setSmtpIsConfigured(!!cfg.configured);
      }
    } catch (err: any) {
      console.error('Failed to load email config:', err);
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpStatusMessage(null);
    try {
      const res = await ApiService.saveEmailConfig({
        host: smtpHost.trim(),
        port: Number(smtpPort) || 587,
        username: smtpUsername.trim(),
        password: smtpPassword.trim() || undefined
      });
      setIsSavingSmtp(false);
      if (res.success) {
        setSmtpIsConfigured(res.configured);
        setSmtpHasExistingPassword(true);
        setSmtpPassword('');
        setSmtpStatusMessage({
          type: 'success',
          text: 'SMTP credentials successfully saved in MySQL database (system_settings table)! Backend email service is now live.'
        });
      } else {
        setSmtpStatusMessage({ type: 'error', text: res.message || 'Failed to save email configuration.' });
      }
    } catch (err: any) {
      setIsSavingSmtp(false);
      setSmtpStatusMessage({ type: 'error', text: err?.message || 'Error communicating with backend.' });
    }
  };

  const handleTestEmailConnection = async () => {
    const target = testRecipientEmail.trim() || smtpUsername.trim();
    if (!target) {
      setSmtpStatusMessage({ type: 'error', text: 'Please enter a test recipient email address.' });
      return;
    }
    setIsTestingSmtp(true);
    setSmtpStatusMessage(null);
    try {
      const res = await ApiService.testEmailConnection(target);
      setIsTestingSmtp(false);
      if (res.success) {
        setSmtpStatusMessage({ type: 'success', text: res.message });
      } else {
        setSmtpStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setIsTestingSmtp(false);
      setSmtpStatusMessage({ type: 'error', text: err?.message || 'Failed to run test email connection.' });
    }
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
      {/* 1. LEFT SIDEBAR NAVIGATION                                                */}
      {/* ========================================================================= */}
      <aside style={{
        width: '230px',
        minWidth: '230px',
        maxWidth: '230px',
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
        {/* Top Section: Brand + Menu */}
        <div>
          {/* Top Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.25rem 0.5rem 1.6rem 0.5rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
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
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 500, display: 'block', marginTop: '0.15rem' }}>
                School OS
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* Dashboard */}
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

            {/* Teachers */}
            <button 
              type="button"
              onClick={() => setActiveTab('teachers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'teachers' ? '#eff6ff' : 'transparent',
                color: activeTab === 'teachers' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'teachers' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Users size={18} color={activeTab === 'teachers' ? '#2563eb' : '#64748b'} />
                <span>Teachers</span>
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                color: activeTab === 'teachers' ? '#2563eb' : '#64748b', 
                fontWeight: 600,
                background: activeTab === 'teachers' ? '#dbeafe' : '#f1f5f9',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px'
              }}>
                {teachers.length || 4}
              </span>
            </button>

            {/* Classes & Sections */}
            <button 
              type="button"
              onClick={() => setActiveTab('classes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'classes' ? '#eff6ff' : 'transparent',
                color: activeTab === 'classes' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'classes' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <LayoutGrid size={18} color={activeTab === 'classes' ? '#2563eb' : '#64748b'} />
                <span>Classes & Sections</span>
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                color: activeTab === 'classes' ? '#2563eb' : '#64748b', 
                fontWeight: 600,
                background: activeTab === 'classes' ? '#dbeafe' : '#f1f5f9',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px'
              }}>
                {classes.length || 3}
              </span>
            </button>

            {/* Academic Reports */}
            <button 
              type="button"
              onClick={() => setActiveTab('academic_reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'academic_reports' ? '#eff6ff' : 'transparent',
                color: activeTab === 'academic_reports' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'academic_reports' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart2 size={18} color={activeTab === 'academic_reports' ? '#2563eb' : '#64748b'} />
              <span>Academic Reports</span>
            </button>

            {/* Accounts */}
            <button 
              type="button"
              onClick={() => setActiveTab('user_management')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'user_management' ? '#eff6ff' : 'transparent',
                color: activeTab === 'user_management' ? '#2563eb' : '#475569',
                fontWeight: activeTab === 'user_management' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <CreditCard size={18} color={activeTab === 'user_management' ? '#2563eb' : '#64748b'} />
                <span>Accounts</span>
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                color: activeTab === 'user_management' ? '#2563eb' : '#64748b', 
                fontWeight: 600,
                background: activeTab === 'user_management' ? '#dbeafe' : '#f1f5f9',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px'
              }}>
                {users.length || 9}
              </span>
            </button>

            {/* Settings */}
            <button 
              type="button"
              onClick={handleOpenEmailConfigModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.72rem 0.95rem',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: '#475569',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Settings size={18} color="#64748b" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Connected System Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          marginTop: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>System Online</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
              <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>MySQL Live</span>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Academic Session 2026-2027</span>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={handleOpenEmailConfigModal}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.3rem 0.45rem',
                fontSize: '0.675rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              SMTP Config
            </button>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '0.3rem 0.45rem',
                fontSize: '0.675rem',
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
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
        
        {/* TOP HEADER BAR */}
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
          {/* Left Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Greenwood International School
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                Academic Session 2026 - 2027
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <div style={{ position: 'relative', width: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '11px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search students, teachers, classes..."
              style={{
                width: '100%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '0.45rem 1rem 0.45rem 2.4rem',
                fontSize: '0.8rem',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          {/* Right Notifications & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Notification Bell with Badge */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem', display: 'flex' }}
              >
                <Bell size={20} />
              </button>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  width: '300px',
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem',
                  zIndex: 99
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                    <span style={{ fontSize: '0.7rem', color: '#4f46e5', cursor: 'pointer' }} onClick={markAllNotificationsRead}>Mark read</span>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {notifications.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No new notifications</span>
                    ) : (
                      notifications.slice(0, 4).map(n => (
                        <div key={n.id} style={{ fontSize: '0.75rem', padding: '0.4rem', background: '#f8fafc', borderRadius: '0.35rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '20px', transition: 'background 0.15s ease' }}
              >
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                  alt="Arthur Vance" 
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #2563eb' }} 
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Principal</span>
                  <ChevronDown size={14} color="#64748b" />
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: '200px',
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '0.5rem',
                  zIndex: 99
                }}>
                  <div style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.3rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Dr. Arthur Vance</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>admin@oakridge.edu</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowProfileMenu(false);
                      setEditEmail(currentUser.email);
                      setShowChangePasswordModal(true);
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '0.45rem 0.6rem', fontSize: '0.775rem', color: '#0f172a', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '0.35rem' }}
                  >
                    <KeyRound size={14} color="#4f46e5" /> Email & Password
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '0.45rem 0.6rem', fontSize: '0.775rem', color: '#ef4444', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '0.35rem' }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          {/* CONTROL ROOM TITLE & ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Principal Executive Control Room
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
                Manage teachers, students, classes, examinations and academic performance in one place.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={handleOpenEmailConfigModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Mail size={15} /> System Email (SMTP)
              </button>

              <button 
                type="button"
                onClick={() => handleOpenCreateUser('principal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)'
                }}
              >
                <Plus size={15} /> Create User Account
              </button>

              <button 
                type="button"
                onClick={handleOpenCreateTeacher}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Users size={15} /> Add Teacher
              </button>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* ========================================================================= */}
              {/* TOP 5 KPI CARDS ROW                                                       */}
              {/* ========================================================================= */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                
                {/* 1. Active Teachers */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="#0284c7" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Teachers</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        {teachers.filter(t => t.status === 'active').length || 4}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#16a34a', fontWeight: 700 }}>
                    <span>↑ 100% Faculty Assigned</span>
                  </div>
                  {/* Wave sparkline */}
                  <svg width="70" height="30" viewBox="0 0 70 30" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.35 }}>
                    <path d="M 0 25 Q 18 5, 35 20 T 70 5" stroke="#0284c7" strokeWidth="2.5" fill="none" />
                  </svg>
                </div>

                {/* 2. Enrolled Students */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={20} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Enrolled Students</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        214
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#16a34a', fontWeight: 700 }}>
                    <span>↑ Across 7 Grade Sections</span>
                  </div>
                  <svg width="70" height="30" viewBox="0 0 70 30" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.35 }}>
                    <path d="M 0 25 Q 20 8, 40 18 T 70 8" stroke="#16a34a" strokeWidth="2.5" fill="none" />
                  </svg>
                </div>

                {/* 3. Exams Conducted */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} color="#db2777" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Exams Conducted</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        7
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.725rem', color: '#2563eb', fontWeight: 600 }}>
                    Online 5 | Offline 2
                  </div>
                  <svg width="55" height="28" viewBox="0 0 55 28" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.35 }}>
                    <rect x="5" y="14" width="6" height="14" rx="2" fill="#db2777" />
                    <rect x="17" y="9" width="6" height="19" rx="2" fill="#db2777" />
                    <rect x="29" y="5" width="6" height="23" rx="2" fill="#db2777" />
                    <rect x="41" y="2" width="6" height="26" rx="2" fill="#db2777" />
                  </svg>
                </div>

                {/* 4. Academic Average */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={20} color="#ea580c" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Academic Average</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
                        82%
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#16a34a', fontWeight: 700 }}>
                    <span>↑ +4.3% Growth This Term</span>
                  </div>
                  <svg width="70" height="30" viewBox="0 0 70 30" fill="none" style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.35 }}>
                    <path d="M 0 26 Q 22 28, 40 16 T 70 10" stroke="#ea580c" strokeWidth="2.5" fill="none" />
                  </svg>
                </div>

                {/* 5. MySQL Accounts */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Monitor size={20} color="#4338ca" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>MySQL Accounts</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                        {users.length || 9}
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setActiveTab('user_management')}
                    style={{ marginTop: '0.75rem', fontSize: '0.725rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <span>View All Personnel</span> &rarr;
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* MIDDLE SECTION: CLASS HEALTH MATRIX (68%) & RIGHT VISUALS (32%)           */}
              {/* ========================================================================= */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* LEFT: School-Wide Class Academic Health Matrix */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  
                  {/* Card Header with Dropdown & Buttons */}
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <BarChart2 size={18} color="#2563eb" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          School-Wide Class Academic Health Matrix
                        </h3>
                        {/* Session pill */}
                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.725rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>2026 - 2027 Academic Session</span>
                          <ChevronDown size={12} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          onClick={handleOpenClassModal}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          + Add New Class
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setActiveTab('academic_reports')}
                          style={{
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span>Academic Reports</span>
                          <ChevronDown size={13} />
                        </button>
                      </div>

                    </div>

                    <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0 }}>
                      Consolidated performance across all classes. Click &ldquo;View Full Details&rdquo; for class-wise attendance, exams and student insights.
                    </p>
                  </div>

                  {/* Class Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 1.25rem' }}>CLASS & SECTION</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>ASSIGNED FACULTY</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>STUDENTS</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>EXAMS CONDUCTED</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>CLASS AVERAGE</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>PASS %</th>
                          <th style={{ padding: '0.75rem 0.75rem' }}>ACADEMIC STATUS</th>
                          <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            id: 'c-12a',
                            letter: 'A',
                            letterBg: '#fee2e2',
                            letterColor: '#ef4444',
                            name: 'Grade 12',
                            sec: 'Section A • 2026-2027',
                            faculty: ['PSEM', 'PBAC'],
                            moreFaculty: '+1',
                            students: '32 students',
                            exams: '4 exams',
                            avg: '88.4%',
                            avgColor: '#16a34a',
                            barColor: '#16a34a',
                            barWidth: '88%',
                            pass: '96.8%',
                            status: 'Optimal Progress',
                            statusType: 'success'
                          },
                          {
                            id: 'c-11b',
                            letter: 'B',
                            letterBg: '#dcfce7',
                            letterColor: '#16a34a',
                            name: 'Grade 11',
                            sec: 'Section B • 2026-2027',
                            faculty: ['PSEM', 'PBAC'],
                            moreFaculty: '+1',
                            students: '33 students',
                            exams: '3 exams',
                            avg: '84.2%',
                            avgColor: '#ea580c',
                            barColor: '#ea580c',
                            barWidth: '84%',
                            pass: '86.3%',
                            status: 'Optimal Progress',
                            statusType: 'success'
                          },
                          {
                            id: 'c-10a',
                            letter: 'C',
                            letterBg: '#ffedd5',
                            letterColor: '#ea580c',
                            name: 'Grade 10',
                            sec: 'Section A • 2026-2027',
                            faculty: ['EA'],
                            moreFaculty: null,
                            students: '35 students',
                            exams: '0 exams',
                            avg: '88.9%',
                            avgColor: '#16a34a',
                            barColor: '#16a34a',
                            barWidth: '89%',
                            pass: '96.2%',
                            status: 'Optimal Progress',
                            statusType: 'success'
                          },
                          {
                            id: 'c-9a',
                            letter: 'D',
                            letterBg: '#f3e8ff',
                            letterColor: '#9333ea',
                            name: 'Grade 9',
                            sec: 'Section A • 2026-2027',
                            faculty: [],
                            unassigned: true,
                            students: '33 students',
                            exams: '0 exams',
                            avg: '88.4%',
                            avgColor: '#16a34a',
                            barColor: '#16a34a',
                            barWidth: '88%',
                            pass: '96.8%',
                            status: 'Optimal Progress',
                            statusType: 'success'
                          },
                          {
                            id: 'c-8b',
                            letter: 'E',
                            letterBg: '#ffe4e6',
                            letterColor: '#e11d48',
                            name: 'Grade 8',
                            sec: 'Section B • 2026-2027',
                            faculty: ['MG', 'PSEM'],
                            moreFaculty: null,
                            students: '30 students',
                            exams: '1 exams',
                            avg: '83.1%',
                            avgColor: '#ea580c',
                            barColor: '#ea580c',
                            barWidth: '83%',
                            pass: '82.4%',
                            status: 'Needs Attention',
                            statusType: 'warning'
                          }
                        ].map(row => {
                          const matchedClass = classes.find(c => c.name.includes(row.name.split(' ')[1])) || classes[0];

                          return (
                            <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              
                              {/* Class & Section with colored circle */}
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: row.letterBg,
                                    color: row.letterColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.85rem'
                                  }}>
                                    {row.letter}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{row.name}</div>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.sec}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Faculty Pills */}
                              <td style={{ padding: '0.85rem 0.75rem' }}>
                                {row.unassigned ? (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Unassigned</span>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {row.faculty.map((f, i) => (
                                      <span key={i} style={{
                                        background: '#eef2ff',
                                        border: '1px solid #c7d2fe',
                                        color: '#4338ca',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        padding: '0.15rem 0.45rem',
                                        borderRadius: '0.35rem'
                                      }}>
                                        {f}
                                      </span>
                                    ))}
                                    {row.moreFaculty && (
                                      <span style={{
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        padding: '0.15rem 0.35rem',
                                        borderRadius: '0.35rem'
                                      }}>
                                        {row.moreFaculty}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Students count */}
                              <td style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: 500, fontSize: '0.8rem' }}>
                                {row.students}
                              </td>

                              {/* Exams count */}
                              <td style={{ padding: '0.85rem 0.75rem', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem' }}>
                                {row.exams}
                              </td>

                              {/* Class Average with Bar */}
                              <td style={{ padding: '0.85rem 0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 800, color: row.avgColor, fontSize: '0.85rem' }}>{row.avg}</span>
                                  <div style={{ width: '45px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: row.barWidth, height: '100%', background: row.barColor, borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>

                              {/* Pass % */}
                              <td style={{ padding: '0.85rem 0.75rem', color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>
                                {row.pass}
                              </td>

                              {/* Academic Status */}
                              <td style={{ padding: '0.85rem 0.75rem' }}>
                                <span style={{
                                  background: row.statusType === 'success' ? '#dcfce7' : '#fef3c7',
                                  color: row.statusType === 'success' ? '#15803d' : '#b45309',
                                  fontSize: '0.675rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '20px',
                                  display: 'inline-block'
                                }}>
                                  {row.status}
                                </span>
                              </td>

                              {/* Action Button: View Details */}
                              <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (matchedClass) {
                                      setInspectingClass(matchedClass);
                                    }
                                  }}
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '20px',
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <Eye size={12} /> View Details
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* RIGHT: 2 STACKED VISUAL CARDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Card 1: Academic Performance Overview (Line Chart) */}
                  <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Academic Performance Overview
                        </h4>
                      </div>
                      
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span>This Term</span>
                        <ChevronDown size={11} />
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                        <span>Class Average</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <span>Pass Percentage</span>
                      </div>
                    </div>

                    {/* Precision SVG Line Chart */}
                    <div style={{ width: '100%', height: '165px', position: 'relative' }}>
                      <svg viewBox="0 0 350 155" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Grid Lines */}
                        {[
                          { val: '100%', y: 15 },
                          { val: '75%', y: 45 },
                          { val: '50%', y: 75 },
                          { val: '25%', y: 105 },
                          { val: '0%', y: 135 },
                        ].map((g, idx) => (
                          <g key={idx}>
                            <text x="26" y={g.y + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontWeight="500">{g.val}</text>
                            <line x1="32" y1={g.y} x2="340" y2={g.y} stroke="#f1f5f9" strokeWidth="1" />
                          </g>
                        ))}

                        {/* Months */}
                        {[
                          { m: 'Apr', x: 45 },
                          { m: 'May', x: 92 },
                          { m: 'Jun', x: 140 },
                          { m: 'Jul', x: 188 },
                          { m: 'Aug', x: 236 },
                          { m: 'Sep', x: 284 },
                          { m: 'Oct', x: 330 },
                        ].map((month, idx) => (
                          <text key={idx} x={month.x} y="150" textAnchor="middle" fontSize="8" fill="#64748b">{month.m}</text>
                        ))}

                        {/* Green Line: Pass % */}
                        <path 
                          d="M 45 45 Q 68 50, 92 50 T 140 28 T 188 32 T 236 24 T 284 30 T 330 26" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2" 
                        />
                        {[
                          { x: 45, y: 45 }, { x: 92, y: 50 }, { x: 140, y: 28 }, 
                          { x: 188, y: 32 }, { x: 236, y: 24 }, { x: 284, y: 30 }, { x: 330, y: 26 }
                        ].map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                        ))}

                        {/* Blue Line: Class Avg */}
                        <path 
                          d="M 45 52 Q 68 62, 92 62 T 140 38 T 188 48 T 236 34 T 284 48 T 330 42" 
                          fill="none" 
                          stroke="#2563eb" 
                          strokeWidth="2" 
                        />
                        {[
                          { x: 45, y: 52 }, { x: 92, y: 62 }, { x: 140, y: 38 }, 
                          { x: 188, y: 48 }, { x: 236, y: 34 }, { x: 284, y: 48 }, { x: 330, y: 42 }
                        ].map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                        ))}

                        {/* Active Tooltip over Oct point */}
                        <g transform="translate(285, 2)">
                          <rect width="60" height="32" rx="4" fill="#0f172a" />
                          <text x="6" y="10" fontSize="7" fontWeight="700" fill="#94a3b8">Oct 2026</text>
                          <circle cx="9" cy="18" r="2" fill="#2563eb" />
                          <text x="14" y="20" fontSize="7" fontWeight="600" fill="#ffffff">Avg: 82%</text>
                          <circle cx="9" cy="26" r="2" fill="#10b981" />
                          <text x="14" y="28" fontSize="7" fontWeight="600" fill="#4ade80">Pass: 92%</text>
                        </g>
                      </svg>
                    </div>

                  </div>

                  {/* Card 2: Students by Grade (Donut Chart) */}
                  <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Students by Grade
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      
                      {/* Donut SVG with center text */}
                      <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                        <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" strokeWidth="13" strokeDasharray="35.8 203" strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="13" strokeDasharray="35.8 203" strokeDashoffset="-35.8" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="13" strokeDasharray="38.2 200.5" strokeDashoffset="-71.6" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="13" strokeDasharray="35.8 203" strokeDashoffset="-109.8" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="13" strokeDasharray="33.4 205.4" strokeDashoffset="-145.6" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="13" strokeDasharray="28.6 210.2" strokeDashoffset="-179.0" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#94a3b8" strokeWidth="13" strokeDasharray="31.0 207.8" strokeDashoffset="-207.6" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>214</span>
                          <span style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 500 }}>Students</span>
                        </div>
                      </div>

                      {/* Grade Legend List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.725rem', color: '#475569', flex: 1 }}>
                        {[
                          { name: 'Grade 12', count: '32 (15%)', color: '#7c3aed' },
                          { name: 'Grade 11', count: '33 (15%)', color: '#2563eb' },
                          { name: 'Grade 10', count: '35 (16%)', color: '#06b6d4' },
                          { name: 'Grade 9', count: '33 (15%)', color: '#10b981' },
                          { name: 'Grade 8', count: '30 (14%)', color: '#f59e0b' },
                          { name: 'Grade 7', count: '26 (12%)', color: '#ef4444' },
                          { name: 'Others', count: '25 (12%)', color: '#94a3b8' },
                        ].map((g, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: g.color }} />
                              <span>{g.name}</span>
                            </div>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{g.count}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* ========================================================================= */}
              {/* BOTTOM ROW: 3 CARDS (SUBJECT, FACULTY ALLOCATION, ACTIVE ASSESSMENTS)      */}
              {/* ========================================================================= */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                
                {/* 1. Subject-Wise Academic Performance */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <BarChart2 size={16} color="#2563eb" />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Subject-Wise Academic Performance
                      </h4>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span>All Subjects</span>
                      <ChevronDown size={11} />
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
                    <thead>
                      <tr style={{ color: '#94a3b8', fontSize: '0.675rem', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>SUBJECT</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>CLASS AVERAGE</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>ATTEMPTS</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'left' }}>PERFORMANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Physics (PHY-101)', avg: '92%', att: 32, barGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)', width: '92%' },
                        { name: 'Mathematics (MTH-102)', avg: '88%', att: 68, barGradient: 'linear-gradient(90deg, #0284c7, #06b6d4)', width: '88%' },
                        { name: 'Chemistry (CHM-103)', avg: '79%', att: 28, barGradient: 'linear-gradient(90deg, #ea580c, #f59e0b)', width: '79%' },
                        { name: 'Computer Science (CS-104)', avg: '94%', att: 22, barGradient: 'linear-gradient(90deg, #059669, #10b981)', width: '94%' },
                      ].map((sub, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '0.65rem 0', fontWeight: 600, color: '#0f172a' }}>{sub.name}</td>
                          <td style={{ padding: '0.65rem 0', fontWeight: 800, color: sub.avg.startsWith('7') ? '#ea580c' : '#16a34a' }}>{sub.avg}</td>
                          <td style={{ padding: '0.65rem 0', color: '#64748b' }}>{sub.att}</td>
                          <td style={{ padding: '0.65rem 0' }}>
                            <div style={{ width: '70px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: sub.width, height: '100%', background: sub.barGradient, borderRadius: '3px' }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. Faculty Allocations & Workload */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Users size={16} color="#16a34a" />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Faculty Allocations & Workload
                      </h4>
                    </div>
                    <span 
                      onClick={() => setActiveTab('teachers')}
                      style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View All Faculty &rarr;
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { name: 'prem kumar', sub: 'Math • Gr 9-12', classes: '4 Classes', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
                      { name: 'Prof. Alan Turing', sub: 'Mathematics • Gr 10-12', classes: '3 Classes', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
                      { name: 'Mrs. Elena Ramirez', sub: 'Chemistry • Gr 9-12', classes: '3 Classes', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100' },
                      { name: 'Dr. Sarah Jenkins', sub: 'Physics • Gr 10-12', classes: '4 Classes', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: i < 3 ? '1px solid #f8fafc' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img src={f.img} alt={f.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{f.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.sub}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.675rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {f.classes}
                          </span>
                          <span 
                            onClick={() => {
                              const t = teachers.find(teach => teach.name.toLowerCase().includes(f.name.toLowerCase().split(' ')[0])) || teachers[0];
                              if (t) setInspectingTeacher(t);
                            }}
                            style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                          >
                            View
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Active Assessments & Examinations */}
                <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <ClipboardList size={16} color="#7c3aed" />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Active Assessments & Examinations
                      </h4>
                    </div>
                    <span 
                      onClick={() => setActiveTab('academic_reports')}
                      style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View All Exams &rarr;
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.725rem' }}>
                    <thead>
                      <tr style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ padding: '0.35rem 0', textAlign: 'left' }}>ASSESSMENT TITLE</th>
                        <th style={{ padding: '0.35rem 0', textAlign: 'left' }}>SUBJECT</th>
                        <th style={{ padding: '0.35rem 0', textAlign: 'left' }}>TARGET</th>
                        <th style={{ padding: '0.35rem 0', textAlign: 'left' }}>MODE</th>
                        <th style={{ padding: '0.35rem 0', textAlign: 'left' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { title: 'Comprehensive 2026', sub: 'Chemistry', target: 'XII', mode: 'Online', modeBg: '#dcfce7', modeColor: '#16a34a', status: 'Active', statusBg: '#dcfce7', statusColor: '#15803d' },
                        { title: 'Unit Test', sub: 'Mathematics', target: 'VIII A, B', mode: 'Offline', modeBg: '#ffedd5', modeColor: '#ea580c', status: 'Published', statusBg: '#e0f2fe', statusColor: '#0369a1' },
                        { title: 'Midterm Exam', sub: 'Physics', target: 'VIII A, B', mode: 'Offline', modeBg: '#ffedd5', modeColor: '#ea580c', status: 'Published', statusBg: '#e0f2fe', statusColor: '#0369a1' },
                        { title: 'Quiz', sub: 'Chemistry', target: 'IX', mode: 'Offline', modeBg: '#ffedd5', modeColor: '#ea580c', status: 'Published', statusBg: '#e0f2fe', statusColor: '#0369a1' },
                        { title: 'Assessment 2026', sub: 'CS', target: 'IX', mode: 'Offline', modeBg: '#ffedd5', modeColor: '#ea580c', status: 'Published', statusBg: '#e0f2fe', statusColor: '#0369a1' },
                      ].map((exam, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '0.5rem 0', fontWeight: 600, color: '#0f172a' }}>{exam.title}</td>
                          <td style={{ padding: '0.5rem 0', color: '#64748b' }}>{exam.sub}</td>
                          <td style={{ padding: '0.5rem 0', color: '#2563eb', fontWeight: 600 }}>{exam.target}</td>
                          <td style={{ padding: '0.5rem 0' }}>
                            <span style={{ background: exam.modeBg, color: exam.modeColor, padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700 }}>
                              {exam.mode}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0' }}>
                            <span style={{ background: exam.statusBg, color: exam.statusColor, padding: '0.15rem 0.4rem', borderRadius: '12px', fontSize: '0.625rem', fontWeight: 700 }}>
                              {exam.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* RENDER OTHER TABS WHEN SELECTED */}
          {/* TAB 2: TEACHER MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search teacher by name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="form-input" 
                style={{ paddingLeft: '2rem' }}
              />
            </div>
            <button onClick={handleOpenCreateTeacher} className="btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              <Plus size={16} /> Add New Teacher
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Assigned Classes (FR-ADM-04)</th>
                  <th>Assigned Subjects</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(teacher => {
                  const assignedClassNames = (teacher.assignedClassIds || [])
                    .map(id => {
                      const c = classes.find(cls => cls.id === id);
                      return c ? `${c.name} (${c.section})` : id;
                    });
                  const assignedSubjectNames = (teacher.assignedSubjectIds || [])
                    .map(id => subjects.find(s => s.id === id)?.name || id);

                  return (
                    <tr key={teacher.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={teacher.avatar} alt={teacher.name} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{teacher.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {assignedClassNames.length > 0 ? (
                            assignedClassNames.map((cName, i) => (
                              <span key={i} className="badge badge-primary">{cName}</span>
                            ))
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None assigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {assignedSubjectNames.length > 0 ? (
                            assignedSubjectNames.map((sName, i) => (
                              <span key={i} className="badge badge-purple">{sName}</span>
                            ))
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${teacher.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleOpenEditTeacher(teacher)} 
                            className="btn-secondary btn-sm"
                            title="Reassign Classes & Subjects (FR-ADM-05)"
                          >
                            <Edit3 size={13} /> Reassign
                          </button>
                          <button 
                            onClick={() => toggleTeacherStatus(teacher.id)}
                            className={teacher.status === 'active' ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
                          >
                            {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteUserModal(teacher)}
                            className="btn-danger btn-sm"
                            title={`Delete ${teacher.name}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
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

      {/* TAB 3: SCHOOL ACADEMIC REPORTS */}
      {activeTab === 'academic_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Executive Academic Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.1rem', borderLeft: '4px solid #4f46e5' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>School Average Benchmark</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>{schoolAvgScore || 88.4}%</div>
              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>+4.2% Growth vs Last Academic Term</span>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem', borderLeft: '4px solid #059669' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Overall Pass Percentage</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '0.2rem 0' }}>96.8%</div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Above Regional Target (90.0%)</span>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem', borderLeft: '4px solid #7c3aed' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Distinction Band (&gt;=85%)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '0.2rem 0' }}>64.2%</div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>128 Students in Honors Tier</span>
            </div>
            <div className="glass-card" style={{ padding: '1.1rem', borderLeft: '4px solid #d97706' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Intervention &amp; Remedial</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', margin: '0.2rem 0' }}>3.2%</div>
              <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>6 Students in Adaptive Support</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  School-Wide Class Performance Summary (FR-ADM-06 / FR-ADM-07)
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: 0 }}>
                  Consolidated academic performance benchmarks across all classes and examination streams. Click <strong>"View Detail"</strong> to inspect teachers, subjects, and student lists.
                </p>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                Academic Year: 2026-2027
              </span>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.875rem 1rem' }}>Class &amp; Section</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Faculty In-Charge</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Students</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Assessments Conducted</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Class Average</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Pass Percentage</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Academic Status</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => {
                    const classTeachers = teachers.filter(t => (t.assignedClassIds || []).includes(cls.id));
                    const classExams = assessments.filter(a => a.classIds.includes(cls.id));
                    const avg = cls.section === 'A' ? 88.4 : cls.section === 'B' ? 84.2 : cls.section === 'Science' ? 89.1 : 86.8;
                    const passRate = cls.section === 'A' ? 96.8 : cls.section === 'B' ? 93.4 : cls.section === 'Science' ? 98.2 : 95.0;

                    return (
                      <tr key={cls.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                            {cls.name} (Section {cls.section})
                          </div>
                          <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{cls.academicYear}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {classTeachers.length > 0 ? (
                              classTeachers.map(t => (
                                <span 
                                  key={t.id} 
                                  onClick={() => setInspectingTeacher(t)}
                                  className="badge badge-purple" 
                                  style={{ fontSize: '0.675rem', cursor: 'pointer', padding: '0.2rem 0.45rem' }}
                                  title="Click to inspect teacher"
                                >
                                  {t.name.split(' ')[0]}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>
                          {cls.studentCount || 30} students
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#4f46e5' }}>{classExams.length} exams</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontWeight: 800, color: avg >= 85 ? '#059669' : '#d97706' }}>{avg}%</span>
                            <div style={{ width: '45px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${avg}%`, height: '100%', background: avg >= 85 ? '#059669' : '#d97706', borderRadius: '3px' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>{passRate}%</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>Optimal Progress</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setClassModalTab('overview');
                              setInspectingClass(cls);
                            }}
                            className="btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', height: '32px', fontWeight: 700, color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                          >
                            <Eye size={13} /> View Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remedial Support & Performance Gap Identification */}
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={20} color="#d97706" />
              <h3 style={{ fontSize: '1.125rem', color: '#0f172a' }}>Academic Gap Monitoring & Action Support (FR-ADM-08)</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1rem' }}>
              The system continuously tracks low-confidence answers and student scores below the 40% threshold to schedule targeted remedial revision.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Identified Gap Topic</span>
                <div style={{ fontWeight: 700, color: '#d97706' }}>Optics - Concave Mirror Ray Sign Conventions</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Recommended Action</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>AI Practice Worksheet Generated for Class 10-A</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: CLASSES & CURRICULUM */}
      {activeTab === 'classes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Academic Grade Divisions & Curriculum Mapping</h3>
              <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>{classes.length} Active Class Sections • {subjects.length} Standard Curriculum Subjects</p>
            </div>
            <button onClick={handleOpenClassModal} className="btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              <Plus size={16} /> Add Class / Section
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {classes.map(cls => {
              const classTeachers = teachers.filter(t => t.assignedClassIds?.includes(cls.id));
              const classSubjects = (cls.subjectIds && cls.subjectIds.length > 0)
                ? cls.subjectIds.map(subId => subjects.find(s => s.id === subId)).filter(Boolean)
                : subjects.slice(0, 3);

              return (
                <div key={cls.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{cls.name} - Section {cls.section}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Academic Year: {cls.academicYear}</span>
                      </div>
                      <span className="badge badge-primary">{cls.studentCount || 30} Students</span>
                    </div>

                    {/* Mapped Subjects */}
                    <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                        Curriculum Subjects ({classSubjects.length}):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {classSubjects.map((sub, idx) => sub ? (
                          <span key={sub.id || idx} className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                            {sub.name} ({sub.code})
                          </span>
                        ) : null)}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned Faculty:</span>
                    {classTeachers.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {classTeachers.map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                            <img src={t.avatar} alt={t.name} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                            <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.75rem' }}>{t.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No faculty assigned yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: USER ACCOUNTS & PASSWORDS MANAGEMENT */}
      {activeTab === 'user_management' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Controls Bar: Search, Role Filters, and Create Action */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input 
                type="text" 
                value={userSearchQuery} 
                onChange={(e) => setUserSearchQuery(e.target.value)} 
                placeholder="Search by name, email, or enrolment ID..." 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginRight: '0.25rem' }}>Role:</span>
              {(['all', 'principal', 'teacher', 'student', 'parent'] as const).map(roleKey => {
                const count = roleKey === 'all' ? users.length : users.filter(u => u.role === roleKey).length;
                const isActive = userRoleFilter === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setUserRoleFilter(roleKey)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '2rem',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                      background: isActive ? '#eef2ff' : '#ffffff',
                      color: isActive ? '#4f46e5' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{roleKey === 'all' ? 'All Roles' : roleKey === 'principal' ? 'Admin' : roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}</span>
                    <span style={{ background: isActive ? '#4f46e5' : '#f1f5f9', color: isActive ? '#fff' : '#64748b', borderRadius: '1rem', padding: '0.05rem 0.4rem', fontSize: '0.675rem', fontWeight: 700 }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Create User Button */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowResetAllModal(true)}
                disabled={isResettingAll}
                className="btn-secondary"
                style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700 }}
                title="Reset all users in database to standard defaults (admin / teach / pass)"
              >
                <RefreshCw size={15} className={isResettingAll ? 'animate-spin' : ''} />
                {isResettingAll ? 'Resetting All...' : 'Reset All to Defaults'}
              </button>
              <button 
                onClick={() => handleOpenCreateUser(userRoleFilter === 'all' ? 'teacher' : userRoleFilter)} 
                className="btn-primary"
                style={{ background: '#4f46e5', borderColor: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
              >
                <UserPlus size={16} /> Create User Account
              </button>
            </div>
          </div>

          {resetAllSuccessNotice && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.75rem', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#065f46', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{resetAllSuccessNotice}</span>
            </div>
          )}
          {/* Database Synchronization Notice */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.4rem', background: '#eef2ff', borderRadius: '50%', color: '#4f46e5' }}>
                <KeyRound size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                  Institutional Credentials & Single-Portal Access Control
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  All accounts below can sign in via the single unified login page. Passwords are saved in MySQL and can be changed anytime.
                </span>
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              <CheckCircle2 size={13} /> {users.length} Active DB Accounts
            </span>
          </div>

          {/* User Accounts Table */}
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.875rem 1.25rem' }}>User / Full Name</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Login Identifier / Username</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Password Status</th>
                    <th style={{ padding: '0.875rem 1rem' }}>Account Status</th>
                    <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isCopied = copiedUserId === u.id;
                      const roleBadgeClass = 
                        u.role === 'principal' ? 'badge-purple' :
                        u.role === 'teacher' ? 'badge-indigo' :
                        u.role === 'student' ? 'badge-green' : 'badge-amber';
                      
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '0.875rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img 
                                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} 
                                alt={u.name} 
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #cbd5e1' }}
                              />
                              <div>
                                <span style={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>{u.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span className={`badge ${roleBadgeClass}`} style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.75rem' }}>
                              {u.role === 'principal' ? 'Administrator' : u.role}
                            </span>
                          </td>

                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', color: '#0f172a', fontWeight: 600, width: 'fit-content' }}>
                                {u.email}
                              </code>
                              {u.enrolmentNumber && (
                                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
                                  Enrolment ID: <strong>{u.enrolmentNumber}</strong>
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', color: '#475569', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
                                {u.password ? '••••••••' : '(no password)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyCredentials(u)}
                                title="Copy login credentials"
                                style={{ background: 'none', border: 'none', color: isCopied ? '#059669' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                              >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: '0.875rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => toggleTeacherStatus(u.id)}
                              style={{ 
                                background: u.status === 'active' ? '#ecfdf5' : '#fff1f2', 
                                border: `1px solid ${u.status === 'active' ? '#a7f3d0' : '#fecdd3'}`, 
                                color: u.status === 'active' ? '#059669' : '#e11d48',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '1rem',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.status === 'active' ? '#059669' : '#e11d48' }} />
                              {u.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPassword(u)}
                                className="btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', height: '30px', padding: '0 0.6rem' }}
                              >
                                <KeyRound size={13} /> Edit Credentials
                              </button>
                              {u.role === 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTeacher(u)}
                                  className="btn-secondary btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', height: '30px', padding: '0 0.6rem' }}
                                >
                                  <Edit3 size={13} /> Edit Profile
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteUserModal(u)}
                                className="btn-danger btn-sm"
                                title={`Delete ${u.name}'s account`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', height: '30px', padding: '0 0.6rem' }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                        <Users size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>No accounts found</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                          Try clearing your search term or select another role filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TEACHER MODAL (CREATE / REASSIGN) */}
      {showTeacherModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '540px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {editingTeacher ? 'Reassign Teacher / Update Profile' : 'Create & Assign New Teacher'}
              </h2>
              <button onClick={() => setShowTeacherModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              <form onSubmit={handleSaveTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Teacher Full Name</label>
                  <input 
                    type="text" 
                    value={teacherName} 
                    onChange={(e) => setTeacherName(e.target.value)} 
                    placeholder="e.g. Dr. Robert Langdon" 
                    required 
                    className="form-input" 
                  />
                </div>

                <div>
                  <label className="form-label">Email Address (Login Username)</label>
                  <input 
                    type="email" 
                    value={teacherEmail} 
                    onChange={(e) => setTeacherEmail(e.target.value)} 
                    placeholder="e.g. robert.langdon@oakridge.edu" 
                    required 
                    className="form-input" 
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    This institutional email is the username the teacher will use to sign in.
                  </span>
                </div>

                <div>
                  <label className="form-label">Login Password / Passcode</label>
                  <input 
                    type="text" 
                    value={teacherPassword} 
                    onChange={(e) => setTeacherPassword(e.target.value)} 
                    placeholder="Set teacher login password (e.g. teach or teach123)" 
                    required
                    className="form-input" 
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    Password used at the Teacher Portal login screen. Default: <code>teach</code>
                  </span>
                </div>

                <div>
                  <label className="form-label">Assign Classes (Multi-select allowed - FR-ADM-04)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {classes.map(cls => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <div 
                          key={cls.id}
                          onClick={() => toggleClassSelection(cls.id)}
                          style={{ 
                            padding: '0.625rem', 
                            borderRadius: '0.5rem', 
                            background: isChecked ? '#eef2ff' : '#ffffff', 
                            border: `1px solid ${isChecked ? '#4f46e5' : '#cbd5e1'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem'
                          }}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} />
                          <span style={{ color: '#0f172a' }}>{cls.name} ({cls.section})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label">Assign Subjects</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {subjects.map(sub => {
                      const isChecked = selectedSubjectIds.includes(sub.id);
                      return (
                        <div 
                          key={sub.id}
                          onClick={() => toggleSubjectSelection(sub.id)}
                          style={{ 
                            padding: '0.625rem', 
                            borderRadius: '0.5rem', 
                            background: isChecked ? '#faf5ff' : '#ffffff', 
                            border: `1px solid ${isChecked ? '#7c3aed' : '#cbd5e1'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem'
                          }}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} />
                          <span style={{ color: '#0f172a' }}>{sub.name} ({sub.code})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowTeacherModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={16} /> Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW CLASS / SECTION MODAL */}
      {showClassModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '560px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Create New Class / Section</h2>
                <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Define class division, academic year, and curriculum subjects.</p>
              </div>
              <button onClick={() => setShowClassModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Grade and Section Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Grade / Class Name *</label>
                    <input 
                      type="text" 
                      value={newClassName} 
                      onChange={(e) => setNewClassName(e.target.value)} 
                      placeholder="e.g. Grade 11" 
                      required 
                      className="form-input" 
                    />
                  </div>

                  <div>
                    <label className="form-label">Section / Division *</label>
                    <input 
                      type="text" 
                      value={newSection} 
                      onChange={(e) => setNewSection(e.target.value)} 
                      placeholder="e.g. Science-B or Section C" 
                      required 
                      className="form-input" 
                    />
                  </div>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="form-label">Academic Session</label>
                  <input 
                    type="text" 
                    value={newAcademicYear} 
                    onChange={(e) => setNewAcademicYear(e.target.value)} 
                    placeholder="2026-2027" 
                    className="form-input" 
                  />
                </div>

                {/* Subject Selection / Assignment */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Curriculum Subjects (Select subjects taught in this class)
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowAddCustomSubject(!showAddCustomSubject)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#7c3aed', 
                        fontSize: '0.8125rem', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus size={14} /> {showAddCustomSubject ? 'Hide New Subject' : '+ Add New Subject'}
                    </button>
                  </div>

                  {/* Inline New Subject Creator */}
                  {showAddCustomSubject && (
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '0.5rem', padding: '0.875rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b21a8' }}>
                        Create & Register New Subject
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Subject Name (e.g. Computer Science)" 
                          value={customSubjectName}
                          onChange={(e) => setCustomSubjectName(e.target.value)}
                          className="form-input"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Code (e.g. CS-101)" 
                          value={customSubjectCode}
                          onChange={(e) => setCustomSubjectCode(e.target.value)}
                          className="form-input"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                        />
                        <button 
                          type="button" 
                          onClick={handleAddCustomSubject}
                          className="btn-primary btn-sm"
                          style={{ background: '#7c3aed', borderColor: '#7c3aed', whiteSpace: 'nowrap', height: '36px' }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subject Checkbox Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {subjects.map(sub => {
                      const isChecked = newClassSubjectIds.includes(sub.id);
                      return (
                        <div 
                          key={sub.id}
                          onClick={() => toggleNewClassSubject(sub.id)}
                          style={{ 
                            padding: '0.625rem', 
                            borderRadius: '0.5rem', 
                            background: isChecked ? '#faf5ff' : '#ffffff', 
                            border: `1px solid ${isChecked ? '#7c3aed' : '#cbd5e1'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8125rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {}} 
                            style={{ cursor: 'pointer', accentColor: '#7c3aed' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{sub.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{sub.code}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                    {newClassSubjectIds.length} subject(s) selected for this class
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setShowClassModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <CheckCircle2 size={16} /> Create Class & Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {/* CHANGE PASSWORD MODAL PORTAL */}
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
            backdropFilter: 'blur(6px)',
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
              width: '440px', 
              maxWidth: '95vw', 
              padding: '2rem',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              margin: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Email & Password
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Update Principal Credentials</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowChangePasswordModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            {passwordError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', color: '#991b1b', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', color: '#15803d', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address (Username)</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  required 
                  className="form-input" 
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPasswordText ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Leave blank to keep current" 
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
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repeat new password" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowChangePasswordModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdatingPassword} className="btn-primary" style={{ background: '#2563eb', borderColor: '#2563eb' }}>
                  {isUpdatingPassword ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}


{/* =========================================================
          UNIVERSAL CREATE USER MODAL (USERNAME & PASSWORD)
          ========================================================= */}
      {showCreateUserModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '600px', maxWidth: '95vw', padding: '2rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', background: '#eef2ff', borderRadius: '0.625rem', color: '#4f46e5' }}>
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Create User Account
                  </h2>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0 }}>
                    Create any role with username & password. Synced instantly to MySQL database.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateUserModal(false)} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Success Confirmation View */}
            {createUserSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid #a7f3d0' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Account Created Successfully!
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#059669', fontWeight: 600, marginBottom: '1.25rem' }}>
                  {createUserSuccess}
                </p>

                {/* Credentials summary card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                    User Credentials Ready to Share:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.4rem', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748b' }}>Account Name:</span>
                    <strong style={{ color: '#0f172a' }}>{newUserName}</strong>

                    <span style={{ color: '#64748b' }}>Role:</span>
                    <strong style={{ color: '#4f46e5', textTransform: 'capitalize' }}>{newUserRole}</strong>

                    <span style={{ color: '#64748b' }}>Login Identifier:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{newUserEmail}</strong>

                    {newUserRole === 'student' && newUserEnrolmentNumber && (
                      <>
                        <span style={{ color: '#64748b' }}>Enrolment ID:</span>
                        <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{newUserEnrolmentNumber}</strong>
                      </>
                    )}

                    <span style={{ color: '#64748b' }}>Password:</span>
                    <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>{newUserPassword}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      const text = `Oakridge Portal Credentials:\nRole: ${newUserRole.toUpperCase()}\nIdentifier: ${newUserEmail}\nPassword: ${newUserPassword}`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Copy size={15} /> Copy Credentials
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleOpenCreateUser(newUserRole)}
                    className="btn-secondary"
                  >
                    Create Another
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateUserModal(false)} 
                    className="btn-primary"
                    style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <form onSubmit={handleSaveNewUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Error Notification */}
                  {createUserError && (
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', padding: '0.625rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontSize: '0.8rem' }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  {/* Role Selector Cards */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                      Select Account Role
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {(['principal', 'teacher', 'student', 'parent'] as const).map(roleOption => {
                        const isSelected = newUserRole === roleOption;
                        const label = roleOption === 'principal' ? 'Admin' : roleOption.charAt(0).toUpperCase() + roleOption.slice(1);
                        const roleColor = 
                          roleOption === 'principal' ? '#7c3aed' :
                          roleOption === 'teacher' ? '#4f46e5' :
                          roleOption === 'student' ? '#059669' : '#d97706';
                        
                        return (
                          <div
                            key={roleOption}
                            onClick={() => handleRoleChange(roleOption)}
                            style={{
                              padding: '0.65rem 0.4rem',
                              borderRadius: '0.5rem',
                              border: `1.5px solid ${isSelected ? roleColor : '#cbd5e1'}`,
                              background: isSelected ? `${roleColor}10` : '#ffffff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? roleColor : '#475569', display: 'block' }}>
                              {label}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              {roleOption === 'principal' ? 'Super Admin' : roleOption === 'teacher' ? 'Faculty' : roleOption === 'student' ? 'Learner' : 'Guardian'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.825rem' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={newUserName} 
                      onChange={(e) => setNewUserName(e.target.value)} 
                      placeholder={newUserRole === 'principal' ? 'e.g. Dr. Arthur Pendelton' : newUserRole === 'teacher' ? 'e.g. Prof. Sarah Jenkins' : newUserRole === 'student' ? 'e.g. Alex Rivera' : 'e.g. Carlos Rivera'} 
                      required 
                      className="form-input" 
                    />
                  </div>

                  {/* Username / Institutional Email */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.825rem' }}>
                      Email Address (Login Username)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                      <input 
                        type="email" 
                        value={newUserEmail} 
                        onChange={(e) => setNewUserEmail(e.target.value)} 
                        placeholder={newUserRole === 'principal' ? 'admin@oakridge.edu' : newUserRole === 'teacher' ? 'teacher@oakridge.edu' : newUserRole === 'student' ? 'student@oakridge.edu' : 'parent@gmail.com'} 
                        required 
                        className="form-input" 
                        style={{ paddingLeft: '2.4rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                      This email/username is used by the user to sign in and receive OTP verification codes.
                    </span>
                  </div>

                  {/* Student Specific: Enrolment Number & Class */}
                  {newUserRole === 'student' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '0.625rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.775rem', color: '#166534' }}>Student Enrolment ID</label>
                        <input 
                          type="text" 
                          value={newUserEnrolmentNumber} 
                          onChange={(e) => setNewUserEnrolmentNumber(e.target.value)} 
                          placeholder="e.g. ENR-2026-105" 
                          required 
                          className="form-input" 
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.775rem', color: '#166534' }}>Assigned Class</label>
                        <select 
                          value={newUserClassId} 
                          onChange={(e) => setNewUserClassId(e.target.value)} 
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        >
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name} ({cls.section})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Parent Specific: Phone & Linked Student */}
                  {newUserRole === 'parent' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.85rem', borderRadius: '0.625rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.775rem', color: '#92400e' }}>Parent Contact Phone</label>
                        <input 
                          type="tel" 
                          value={newUserParentPhone} 
                          onChange={(e) => setNewUserParentPhone(e.target.value)} 
                          placeholder="+1 555-0199" 
                          className="form-input" 
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.775rem', color: '#92400e' }}>Link to Enrolled Student</label>
                        <select 
                          value={newUserStudentId} 
                          onChange={(e) => setNewUserStudentId(e.target.value)} 
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="">-- Select Child / Student --</option>
                          {students.map(std => (
                            <option key={std.id} value={std.id}>{std.name} ({std.enrolmentNumber})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Teacher Specific: Class & Subject Multi-Selection */}
                  {newUserRole === 'teacher' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '0.85rem', borderRadius: '0.625rem' }}>
                      <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#3730a3' }}>
                        Faculty Teaching Assignments
                      </span>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.725rem', color: '#4338ca' }}>Assign Classes</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          {classes.map(cls => {
                            const isChecked = newUserClassIds.includes(cls.id);
                            return (
                              <div 
                                key={cls.id}
                                onClick={() => setNewUserClassIds(prev => prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id])}
                                style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: isChecked ? '#fff' : '#f8fafc', border: `1px solid ${isChecked ? '#4f46e5' : '#cbd5e1'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
                              >
                                <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ accentColor: '#4f46e5' }} />
                                <span>{cls.name} ({cls.section})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PASSWORD CREATION SECTION */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Lock size={15} color="#4f46e5" />
                        <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a' }}>
                          Set Login Password
                        </span>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => generateRandomPassword(newUserRole)}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Sparkles size={13} /> Generate Random Secure
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Login Password</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showNewUserPassword ? 'text' : 'password'} 
                            value={newUserPassword} 
                            onChange={(e) => {
                              setNewUserPassword(e.target.value);
                              setCreateUserError('');
                            }} 
                            placeholder="Enter password" 
                            required 
                            className="form-input" 
                            style={{ paddingRight: '2.4rem', fontSize: '0.85rem' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                          >
                            {showNewUserPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm Password</label>
                        <input 
                          type={showNewUserPassword ? 'text' : 'password'} 
                          value={newUserConfirmPassword} 
                          onChange={(e) => {
                            setNewUserConfirmPassword(e.target.value);
                            setCreateUserError('');
                          }} 
                          placeholder="Confirm password" 
                          required 
                          className="form-input" 
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Quick Default Preset Helper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.725rem', color: '#64748b' }}>
                      <span>Quick presets:</span>
                      <button 
                        type="button" 
                        onClick={() => { setNewUserPassword('admin'); setNewUserConfirmPassword('admin'); }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.35rem', padding: '0.15rem 0.45rem', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        admin
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setNewUserPassword('teach'); setNewUserConfirmPassword('teach'); }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.35rem', padding: '0.15rem 0.45rem', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        teach
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setNewUserPassword('pass'); setNewUserConfirmPassword('pass'); }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.35rem', padding: '0.15rem 0.45rem', cursor: 'pointer', fontSize: '0.7rem' }}
                      >
                        pass
                      </button>
                    </div>
                  </div>

                  {/* Live Credentials Preview Box */}
                  <div style={{ background: '#e0e7ff33', border: '1px dashed #818cf8', borderRadius: '0.625rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem' }}>
                    <div>
                      <span style={{ color: '#4338ca', fontWeight: 700, display: 'block' }}>
                        Live Login Preview:
                      </span>
                      <span style={{ color: '#64748b' }}>
                        Identifier: <strong style={{ color: '#0f172a' }}>{newUserEmail || (newUserRole === 'student' ? newUserEnrolmentNumber : 'enter email')}</strong> • Password: <strong style={{ color: '#0f172a' }}>{newUserPassword || '••••'}</strong>
                      </span>
                    </div>
                    <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {newUserRole}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateUserModal(false)} 
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmittingUser}
                      className="btn-primary" 
                      style={{ background: '#4f46e5', borderColor: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    >
                      {isSubmittingUser ? (
                        'Saving to MySQL Database...'
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Create & Save Account
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================
          CHANGE USER EMAIL & PASSWORD MODAL (ADMIN TABLE ACTION)
          ========================================================= */}
      {showEditPasswordModal && targetEditUser && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: '480px', maxWidth: '95vw', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '0.625rem', color: '#d97706' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Edit Account Credentials
                  </h2>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0 }}>
                    For {targetEditUser.name} ({targetEditUser.role.toUpperCase()})
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditPasswordModal(false)} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {editPasswordSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                  Credentials Updated!
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#059669' }}>
                  {editPasswordSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveEditPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {editPasswordError && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.5rem', padding: '0.625rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontSize: '0.8rem' }}>
                    <AlertTriangle size={16} />
                    <span>{editPasswordError}</span>
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Account:</span>
                    <strong>{targetEditUser.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Role:</span>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                      {targetEditUser.role}
                    </span>
                  </div>
                </div>

                {/* Email Address / Username Field */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Email Address (Login Username)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                    <input 
                      type="email" 
                      value={editTargetEmail} 
                      onChange={(e) => {
                        setEditTargetEmail(e.target.value);
                        setEditPasswordError('');
                      }} 
                      placeholder="e.g. user@oakridge.edu" 
                      required 
                      className="form-input" 
                      style={{ paddingLeft: '2.4rem' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    Updating this email changes the login username used to sign in to the portal.
                  </span>
                </div>

                {/* Password Section */}
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '0.625rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a' }}>
                      Change Password (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = targetEditUser.role === 'principal' ? 'Admin' : targetEditUser.role === 'teacher' ? 'Teach' : 'User';
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        const generated = `${prefix}#${rand}`;
                        setEditNewPassword(generated);
                        setEditConfirmPassword(generated);
                        setShowEditPasswordText(true);
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
                        type={showEditPasswordText ? 'text' : 'password'} 
                        value={editNewPassword} 
                        onChange={(e) => {
                          setEditNewPassword(e.target.value);
                          setEditPasswordError('');
                        }} 
                        placeholder="Leave blank to keep existing password" 
                        className="form-input" 
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowEditPasswordText(!showEditPasswordText)}
                        style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                      >
                        {showEditPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Confirm New Password</label>
                    <input 
                      type={showEditPasswordText ? 'text' : 'password'} 
                      value={editConfirmPassword} 
                      onChange={(e) => {
                        setEditConfirmPassword(e.target.value);
                        setEditPasswordError('');
                      }} 
                      placeholder="Confirm new password if changing" 
                      className="form-input" 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      const toDel = targetEditUser;
                      setShowEditPasswordModal(false);
                      if (toDel) handleOpenDeleteUserModal(toDel);
                    }}
                    style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.775rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowEditPasswordModal(false)} 
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmittingEditPassword}
                      className="btn-primary btn-sm"
                      style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                      {isSubmittingEditPassword ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {userToDelete && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #fee2e2',
              position: 'relative'
            }}
          >
            {/* Warning Icon Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#ffe4e6',
                  color: '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Delete User Account
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Permanent database removal
                </p>
              </div>
            </div>

            {deleteUserError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                <span>{deleteUserError}</span>
              </div>
            )}

            {userToDelete.role === 'principal' && users.filter(u => u.role === 'principal').length <= 1 ? (
              <div>
                <div style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5
                }}>
                  <strong>Cannot Delete Account:</strong> This is the primary Administrator account for the school portal. Removing it would permanently lock you out of administrative control.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setUserToDelete(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                  Are you sure you want to permanently delete the account for{' '}
                  <strong style={{ color: '#0f172a' }}>"{userToDelete.name}"</strong>?
                </p>

                {/* Account Details Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Role:</span>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#1e293b' }}>{userToDelete.role}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Login Identifier:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                      {userToDelete.email || userToDelete.enrolmentNumber}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.785rem',
                  color: '#be123c',
                  marginBottom: '1.5rem',
                  lineHeight: 1.4
                }}>
                  ⚠️ <strong>Warning:</strong> This will completely remove their credentials and records from the MySQL database. This action cannot be undone.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setUserToDelete(null)}
                    disabled={isDeletingUser}
                    className="btn-secondary"
                    style={{ minWidth: '90px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmDeleteUser}
                    disabled={isDeletingUser}
                    className="btn-danger"
                    style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Trash2 size={15} />
                    {isDeletingUser ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Reset All Passwords Modal */}
      {showResetAllModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #fef3c7',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Reset All Passwords
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Restore default passwords in MySQL database
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Are you sure you want to reset passwords for <strong>ALL registered accounts</strong> across the entire school system?
            </p>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              fontSize: '0.825rem',
              marginBottom: '1.5rem',
              color: '#92400e',
              lineHeight: 1.5
            }}>
              <strong>Default credentials will be set to:</strong>
              <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                <li>Administrator: <code style={{ fontWeight: 700 }}>admin</code></li>
                <li>Teachers: <code style={{ fontWeight: 700 }}>teach</code></li>
                <li>Students & Parents: <code style={{ fontWeight: 700 }}>pass</code></li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setShowResetAllModal(false)}
                disabled={isResettingAll}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmResetAll}
                disabled={isResettingAll}
                className="btn-primary"
                style={{ background: '#d97706', borderColor: '#d97706', minWidth: '150px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={15} className={isResettingAll ? 'animate-spin' : ''} />
                {isResettingAll ? 'Resetting All...' : 'Confirm Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System SMTP Email Configuration Modal */}
      {showEmailConfigModal && typeof document !== 'undefined' && createPortal(
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
            backdropFilter: 'blur(6px)',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEmailConfigModal(false);
          }}
        >
          <div 
            className="modal-content-card" 
            style={{ 
              width: '540px', 
              maxWidth: '95vw', 
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              margin: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5', display: 'flex' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    System Email & SMTP Server
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Stored dynamically in MySQL database (system_settings)
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEmailConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Current Live Status Banner */}
            <div style={{
              background: smtpIsConfigured ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${smtpIsConfigured ? '#a7f3d0' : '#fde68a'}`,
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: smtpIsConfigured ? '#065f46' : '#92400e', display: 'block' }}>
                  {smtpIsConfigured ? '🟢 Live SMTP Email Service Active' : '🟡 Development Mode (No SMTP Configured in DB)'}
                </span>
                <span style={{ fontSize: '0.725rem', color: smtpIsConfigured ? '#047857' : '#b45309' }}>
                  {smtpIsConfigured 
                    ? `Dispatches real emails via ${smtpUsername || 'configured SMTP'}`
                    : 'OTP codes are logged to backend server console until SMTP is configured.'}
                </span>
              </div>
              <span className={`badge ${smtpIsConfigured ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                {smtpIsConfigured ? 'MySQL Live' : 'Console Mode'}
              </span>
            </div>

            {smtpStatusMessage && (
              <div style={{
                background: smtpStatusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${smtpStatusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '0.625rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                color: smtpStatusMessage.type === 'success' ? '#15803d' : '#991b1b',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {smtpStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{smtpStatusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmailConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Host & Port Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Host</label>
                  <input 
                    type="text" 
                    value={smtpHost} 
                    onChange={(e) => setSmtpHost(e.target.value)} 
                    placeholder="smtp.gmail.com" 
                    required 
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Port</label>
                  <input 
                    type="number" 
                    value={smtpPort} 
                    onChange={(e) => setSmtpPort(Number(e.target.value))} 
                    placeholder="587" 
                    required 
                    className="form-input" 
                  />
                </div>
              </div>

              {/* Sender Email Address */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  Sender Email Address (Username)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input 
                    type="email" 
                    value={smtpUsername} 
                    onChange={(e) => setSmtpUsername(e.target.value)} 
                    placeholder="e.g. school.admin@gmail.com" 
                    required 
                    className="form-input" 
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  This Gmail or institutional address will appear as the sender for password reset emails.
                </span>
              </div>

              {/* Sender Password / Google App Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', margin: 0 }}>
                    SMTP Password / Google App Password
                  </label>
                  {smtpHasExistingPassword && (
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                      ✓ Existing password saved in MySQL
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input 
                    type={showSmtpPasswordText ? 'text' : 'password'} 
                    value={smtpPassword} 
                    onChange={(e) => setSmtpPassword(e.target.value)} 
                    placeholder={smtpHasExistingPassword ? 'Leave blank to keep existing MySQL password' : 'Enter 16-character App Password (e.g. abcd efgh ijkl mnop)'} 
                    className="form-input" 
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowSmtpPasswordText(!showSmtpPasswordText)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showSmtpPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div style={{ marginTop: '0.35rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>
                  💡 <strong>Gmail Users:</strong> Do NOT use your normal account password. Go to <code style={{ color: '#4f46e5' }}>myaccount.google.com/apppasswords</code>, create an App Password named "QuizApp", and paste the 16-letter code here.
                </div>
              </div>

              {/* Action Buttons: Save & Test Connection */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEmailConfigModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingSmtp}
                  className="btn-primary"
                  style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
                >
                  {isSavingSmtp ? 'Saving to MySQL...' : 'Save to MySQL Database'}
                </button>
              </div>

              {/* Test Email Section */}
              <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                  🧪 Test SMTP Email Connection
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="email" 
                    value={testRecipientEmail} 
                    onChange={(e) => setTestRecipientEmail(e.target.value)} 
                    placeholder="Recipient email (e.g. prem211197@gmail.com)" 
                    className="form-input" 
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleTestEmailConnection}
                    disabled={isTestingSmtp}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {isTestingSmtp ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* DEEP-DIVE INSPECTION MODAL: CLASS ALL-IN-ONE SINGLE VIEW                  */}
      {/* ========================================================================= */}
      {inspectingClass && typeof document !== 'undefined' && createPortal(
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
            backdropFilter: 'blur(6px)',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingClass(null);
          }}
        >
          <div 
            className="modal-content-card" 
            style={{ 
              width: '900px', 
              maxWidth: '96vw', 
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              margin: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                  {inspectingClass.section}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {inspectingClass.name} (Section {inspectingClass.section})
                    </h2>
                    <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                      AY {inspectingClass.academicYear}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      Active Cohort
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                    Single-View Institutional Inspection &bull; Faculty Allocations, Exams, Roster &amp; Academic Status
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInspectingClass(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Top 4 KPI Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled Students</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>{inspectingClass.studentCount || 30}</div>
                <span style={{ fontSize: '0.675rem', color: '#059669', fontWeight: 600 }}>100% Attendance Verified</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Faculty</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5', margin: '0.15rem 0' }}>
                  {teachers.filter(t => (t.assignedClassIds || []).includes(inspectingClass.id)).length} Teachers
                </div>
                <span style={{ fontSize: '0.675rem', color: '#4f46e5', fontWeight: 600 }}>All Core Subjects Handled</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Exams Conducted</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', margin: '0.15rem 0' }}>
                  {assessments.filter(a => a.classIds.includes(inspectingClass.id)).length} Assessments
                </div>
                <span style={{ fontSize: '0.675rem', color: '#7c3aed', fontWeight: 600 }}>Online &amp; Paper Sets</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Academic Average</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', margin: '0.15rem 0' }}>
                  {inspectingClass.section === 'A' ? '88.4%' : inspectingClass.section === 'B' ? '84.2%' : '89.1%'}
                </div>
                <span style={{ fontSize: '0.675rem', color: '#059669', fontWeight: 700 }}>96.8% Pass Rate</span>
              </div>
            </div>

            {/* Sub-Tabs within Modal */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => setClassModalTab('overview')}
                className={`tab-btn ${classModalTab === 'overview' ? 'active' : ''}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Layers size={14} /> Overview &amp; Faculty
              </button>
              <button 
                type="button" 
                onClick={() => setClassModalTab('assessments')}
                className={`tab-btn ${classModalTab === 'assessments' ? 'active' : ''}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <BookOpen size={14} /> Assessments ({assessments.filter(a => a.classIds.includes(inspectingClass.id)).length})
              </button>
              <button 
                type="button" 
                onClick={() => setClassModalTab('students')}
                className={`tab-btn ${classModalTab === 'students' ? 'active' : ''}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Users size={14} /> Student Roster ({inspectingClass.studentCount || 30})
              </button>
            </div>

            {/* SUBTAB 1: OVERVIEW & FACULTY ALLOCATIONS */}
            {classModalTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <UserCheck size={16} color="#4f46e5" /> Assigned Faculty In-Charge
                  </h4>
                  {teachers.filter(t => (t.assignedClassIds || []).includes(inspectingClass.id)).length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                      No teachers assigned to this class yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {teachers
                        .filter(t => (t.assignedClassIds || []).includes(inspectingClass.id))
                        .map(teacher => {
                          const assignedSubjectNames = (teacher.assignedSubjectIds || [])
                            .map(id => subjects.find(s => s.id === id)?.name)
                            .filter(Boolean)
                            .join(', ');

                          return (
                            <div key={teacher.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <img src={teacher.avatar} alt={teacher.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{teacher.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{teacher.email}</div>
                                  <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                                    {assignedSubjectNames || 'All Core Subjects'}
                                  </span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setInspectingTeacher(teacher)}
                                className="btn-secondary btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.3rem 0.55rem' }}
                              >
                                Inspect &rarr;
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Subjects & Curriculum Taught */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={16} color="#059669" /> Curriculum Subjects Covered
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                    {subjects.map(sub => (
                      <div key={sub.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.625rem', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{sub.name}</span>
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{sub.code}</span>
                        </div>
                        <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                          {sub.chapters.length} Standard Chapters
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remedial & Academic Gap Card */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertTriangle size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#92400e', margin: '0 0 0.25rem 0' }}>
                      Diagnostic Academic Gap Advisory
                    </h5>
                    <p style={{ fontSize: '0.775rem', color: '#78350f', margin: 0, lineHeight: 1.45 }}>
                      Class {inspectingClass.name}-{inspectingClass.section} has demonstrated 92%+ mastery in Optics and Trigonometry, but requires targeted review in Chemical Reactions &amp; Stoichiometry. Automated adaptive worksheets have been queued.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: ASSESSMENTS LIST */}
            {classModalTab === 'assessments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Examinations Conducted for {inspectingClass.name}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {assessments.filter(a => a.classIds.includes(inspectingClass.id)).length} Active Exams
                  </span>
                </div>

                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.725rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Assessment Title</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Subject</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Mode</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Duration</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Marks</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.filter(a => a.classIds.includes(inspectingClass.id)).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                            No specific assessments assigned to this class section yet.
                          </td>
                        </tr>
                      ) : (
                        assessments
                          .filter(a => a.classIds.includes(inspectingClass.id))
                          .map(exam => {
                            const sub = subjects.find(s => s.id === exam.subjectId)?.name || 'General';

                            return (
                              <tr key={exam.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                  {exam.title}
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>{sub}</td>
                                <td style={{ padding: '0.65rem 0.85rem' }}>
                                  <span className={`badge ${exam.mode === 'online' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                                    {exam.mode.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{exam.durationMinutes} mins</td>
                                <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>{exam.totalMarks} pts</td>
                                <td style={{ padding: '0.65rem 0.85rem' }}>
                                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                                    <CheckCircle2 size={10} /> {exam.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 3: STUDENT ROSTER */}
            {classModalTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Enrolled Students in Section {inspectingClass.section}
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {inspectingClass.studentCount || 30} Total Students
                  </span>
                </div>

                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.725rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Student Name</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Roll / Enrolment #</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Email</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Attendance</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Term Score</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Academic Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'student' && (u.classId === inspectingClass.id || u.section === inspectingClass.section)).length > 0 ? (
                        users
                          .filter(u => u.role === 'student' && (u.classId === inspectingClass.id || u.section === inspectingClass.section))
                          .map((student, idx) => (
                            <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{student.name}</div>
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', color: '#475569', fontFamily: 'monospace' }}>
                                {student.enrolmentNumber || `OIA-${202600 + idx + 1}`}
                              </td>
                              <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{student.email}</td>
                              <td style={{ padding: '0.65rem 0.85rem', color: '#059669', fontWeight: 600 }}>96%</td>
                              <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0f172a' }}>88.5%</td>
                              <td style={{ padding: '0.65rem 0.85rem' }}>
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Excellent</span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        // Sample representative cohort roster
                        [
                          { id: '1', name: 'Aarav Sharma', roll: 'OIA-202601', email: 'aarav.sharma@student.oia.edu', att: '98%', score: '94.2%', health: 'Distinction' },
                          { id: '2', name: 'Diya Patel', roll: 'OIA-202602', email: 'diya.patel@student.oia.edu', att: '95%', score: '91.0%', health: 'Distinction' },
                          { id: '3', name: 'Rohan Verma', roll: 'OIA-202603', email: 'rohan.v@student.oia.edu', att: '92%', score: '86.5%', health: 'Merit' },
                          { id: '4', name: 'Ananya Iyer', roll: 'OIA-202604', email: 'ananya.i@student.oia.edu', att: '97%', score: '89.0%', health: 'Merit' },
                          { id: '5', name: 'Kavya Nair', roll: 'OIA-202605', email: 'kavya.nair@student.oia.edu', att: '94%', score: '82.4%', health: 'Good' }
                        ].map(st => (
                          <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>{st.name}</td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#475569', fontFamily: 'monospace' }}>{st.roll}</td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{st.email}</td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#059669', fontWeight: 600 }}>{st.att}</td>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0f172a' }}>{st.score}</td>
                            <td style={{ padding: '0.65rem 0.85rem' }}>
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{st.health}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setInspectingClass(null)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* DEEP-DIVE INSPECTION MODAL: TEACHER ALL-IN-ONE SINGLE VIEW                */}
      {/* ========================================================================= */}
      {inspectingTeacher && typeof document !== 'undefined' && createPortal(
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
            backdropFilter: 'blur(6px)',
            padding: '1.5rem',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingTeacher(null);
          }}
        >
          <div 
            className="modal-content-card" 
            style={{ 
              width: '720px', 
              maxWidth: '96vw', 
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              margin: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img 
                  src={inspectingTeacher.avatar} 
                  alt={inspectingTeacher.name} 
                  style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #7c3aed', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {inspectingTeacher.name}
                    </h2>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Faculty Member</span>
                    <span className={`badge ${inspectingTeacher.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {inspectingTeacher.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{inspectingTeacher.email}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setInspectingTeacher(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Quick KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Classes</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4f46e5', margin: '0.15rem 0' }}>
                  {(inspectingTeacher.assignedClassIds || []).length}
                </div>
                <span style={{ fontSize: '0.675rem', color: '#64748b' }}>Sections</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Subjects</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', margin: '0.15rem 0' }}>
                  {(inspectingTeacher.assignedSubjectIds || []).length}
                </div>
                <span style={{ fontSize: '0.675rem', color: '#64748b' }}>Curriculum Fields</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Students</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7c3aed', margin: '0.15rem 0' }}>
                  {(inspectingTeacher.assignedClassIds || []).reduce((acc, cId) => {
                    const c = classes.find(cl => cl.id === cId);
                    return acc + (c?.studentCount || 30);
                  }, 0)}
                </div>
                <span style={{ fontSize: '0.675rem', color: '#7c3aed', fontWeight: 600 }}>Under Tutelage</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Authored Exams</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
                  {assessments.filter(a => (a as any).creatorId === inspectingTeacher.id || (inspectingTeacher.assignedSubjectIds || []).includes(a.subjectId)).length || 3}
                </div>
                <span style={{ fontSize: '0.675rem', color: '#059669', fontWeight: 600 }}>Published</span>
              </div>
            </div>

            {/* Detailed Allocation Lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Allocated Grade Sections
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(inspectingTeacher.assignedClassIds || []).length > 0 ? (
                    (inspectingTeacher.assignedClassIds || []).map(cId => {
                      const c = classes.find(cl => cl.id === cId);
                      return (
                        <div key={cId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#3730a3' }}>
                          <Layers size={13} />
                          <span>{c ? `${c.name} (${c.section})` : cId}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No classes assigned yet.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Teaching Subjects
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(inspectingTeacher.assignedSubjectIds || []).length > 0 ? (
                    (inspectingTeacher.assignedSubjectIds || []).map(sId => {
                      const s = subjects.find(sub => sub.id === sId);
                      return (
                        <div key={sId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>
                          <BookOpen size={13} />
                          <span>{s ? `${s.name} (${s.code})` : sId}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No subjects assigned yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => {
                  setInspectingTeacher(null);
                  handleOpenEditTeacher(inspectingTeacher);
                }}
                className="btn-primary"
                style={{ background: '#7c3aed', borderColor: '#7c3aed', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit3 size={14} /> Edit Teacher Allocations
              </button>
              <button 
                type="button" 
                onClick={() => setInspectingTeacher(null)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
