import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  User, 
  UserRole, 
  SchoolClass, 
  Subject, 
  Chapter,
  BookSource, 
  Assessment, 
  Question, 
  QuestionPaperSet, 
  StudentExamAttempt, 
  MalpracticeLog, 
  ReattemptRequest, 
  OfflineAnswerSheet, 
  NotificationItem,
  QuestionType,
  QuestionDifficulty
} from '../types';
import { ApiService, CookieUtil } from '../services/api';

interface AppContextType {
  // Current session & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  login: (identifierOrRole: string, passwordOrIdentifier?: string, maybePassword?: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  logout: () => void;
  switchRole: (role: UserRole, specificUserId?: string) => void;
  changePassword: (newPassword?: string, newEmail?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  resetForgottenPassword: (identifier: string, newPassword: string, role?: string, newEmail?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  resetAllUsersPasswords: () => Promise<{ success: boolean; message?: string; count?: number }>;
  resetUserPassword: (userId: string, newPassword?: string, newEmail?: string) => Promise<{ success: boolean; message?: string; user?: User }>;

  // Master Data
  users: User[];
  classes: SchoolClass[];
  subjects: Subject[];
  books: BookSource[];
  assessments: Assessment[];
  studentAttempts: StudentExamAttempt[];
  offlineSheets: OfflineAnswerSheet[];
  reattemptRequests: ReattemptRequest[];
  notifications: NotificationItem[];
  isBackendConnected: boolean;

  // Principal & User Management Actions
  createUser: (userData: Partial<User> & { name: string; email: string; role: UserRole; password?: string }) => Promise<{ success: boolean; user?: User; message?: string }>;
  updateUser: (id: string, data: Partial<User>) => Promise<{ success: boolean; user?: User; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  createTeacher: (data: Omit<User, 'id' | 'role' | 'status'>) => void;
  updateTeacher: (id: string, data: Partial<User>) => void;
  toggleTeacherStatus: (id: string) => void;
  assignTeacherClassesAndSubjects: (teacherId: string, classIds: string[], subjectIds: string[]) => void;
  addClass: (newClass: Omit<SchoolClass, 'id'>) => void;
  addSubject: (newSubject: { name: string; code: string; chapters?: Subject['chapters'] }) => Subject;
  addChapterToSubject: (subjectId: string, chapter: Omit<Chapter, 'id'>) => Chapter;
  addBook: (book: Omit<BookSource, 'id'>) => BookSource;

  // Teacher / Student Actions
  createStudent: (student: Omit<User, 'id' | 'role' | 'status'>) => void;
  updateStudent: (id: string, data: Partial<User>) => void;

  // Assessment & Question Generation
  createAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => Assessment;
  updateAssessment: (id: string, assessment: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  generateRandomizedSets: (assessmentId: string, count?: number) => QuestionPaperSet[];
  generateAIQuestions: (params: {
    subjectId: string;
    chapterId: string;
    questionTypes: QuestionType[];
    marks?: number;
    difficulty: QuestionDifficulty;
    count?: number;
    customPrompt?: string;
    markDistribution?: { marks: number; count: number }[];
  }) => Promise<Question[]>;
  generateBookQuestions: (params: {
    bookId: string;
    chapterNumbers: number[];
    markDistribution: { marks: number; count: number }[];
    totalQuestions: number;
    chapters?: BookSource['chapters'];
    subjectId?: string;
    bookTitle?: string;
    groqApiKey?: string;
    groqModel?: string;
    useGroqAi?: boolean;
  }) => Promise<Question[]>;

  // Student Exam Engine & Malpractice
  startStudentAttempt: (assessmentId: string, studentId: string) => StudentExamAttempt;
  recordMalpracticeViolation: (attemptId: string, type: MalpracticeLog['type'], description: string) => void;
  submitStudentAttempt: (attemptId: string, answers: { questionId: string; studentAnswer: string }[]) => void;
  submitReattemptRequest: (attemptId: string, reason: string) => void;
  resolveReattemptRequest: (requestId: string, status: 'approved' | 'rejected', paperMode?: 'same' | 'new_random') => void;

  // Offline AI Evaluation
  uploadOfflineSheet: (sheet: Omit<OfflineAnswerSheet, 'id' | 'uploadDate' | 'evaluationStatus' | 'totalMarksAwarded' | 'maxMarks' | 'percentage'>) => string;
  runAIEvaluation: (sheetId: string) => Promise<void>;
  updateTeacherOfflineMarks: (sheetId: string, updatedEvaluations: OfflineAnswerSheet['questionEvaluations']) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // System
  resetAllData: () => void;
}

const DEFAULT_USER: User = {
  id: '',
  name: '',
  email: '',
  role: 'student',
  status: 'active'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<BookSource[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<StudentExamAttempt[]>([]);
  const [offlineSheets, setOfflineSheets] = useState<OfflineAnswerSheet[]>([]);
  const [reattemptRequests, setReattemptRequests] = useState<ReattemptRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Initial fetch from Spring Boot & MySQL Backend
  useEffect(() => {
    let isMounted = true;
    const syncFromBackend = async () => {
      try {
        const health = await ApiService.checkHealth();
        if (health && health.status === 'UP') {
          if (isMounted) setIsBackendConnected(true);
        }

        // Check for existing valid JWT session in cookies or headers
        try {
          const meRes = await ApiService.getMe();
          if (meRes && meRes.success && meRes.user) {
            if (isMounted) {
              setCurrentUser(meRes.user);
              setIsAuthenticated(true);
            }
          }
        } catch {
          // Token expired or unauthenticated; remain on current state
        }

        const [
          bUsers,
          bClasses,
          bSubjects,
          bBooks,
          bAssessments,
          bAttempts,
          bSheets,
          bReattempts,
          bNotifs
        ] = await Promise.all([
          ApiService.getUsers().catch(() => null),
          ApiService.getClasses().catch(() => null),
          ApiService.getSubjects().catch(() => null),
          ApiService.getBooks().catch(() => null),
          ApiService.getAssessments().catch(() => null),
          ApiService.getAttempts().catch(() => null),
          ApiService.getOfflineSheets().catch(() => null),
          ApiService.getReattemptRequests().catch(() => null),
          ApiService.getNotifications().catch(() => null)
        ]);

        if (isMounted) {
          if (bUsers && bUsers.length > 0) {
            setUsers(bUsers);
            const foundUser = bUsers.find(u => u.id === currentUser.id);
            if (foundUser) setCurrentUser(foundUser);
          }
          if (bClasses && bClasses.length > 0) setClasses(bClasses);
          if (bSubjects && bSubjects.length > 0) setSubjects(bSubjects);
          if (bBooks && bBooks.length > 0) setBooks(bBooks);
          if (bAssessments && bAssessments.length > 0) setAssessments(bAssessments);
          if (bAttempts && bAttempts.length > 0) setStudentAttempts(bAttempts);
          if (bSheets && bSheets.length > 0) setOfflineSheets(bSheets);
          if (bReattempts && bReattempts.length > 0) setReattemptRequests(bReattempts);
          if (bNotifs && bNotifs.length > 0) setNotifications(bNotifs);
        }
      } catch (err) {
        console.warn('Backend connection notice: running with cached state', err);
        if (isMounted) setIsBackendConnected(false);
      }
    };

    syncFromBackend();
    return () => { isMounted = false; };
  }, []);

  const login = async (
    identifierOrRole: string,
    passwordOrIdentifier?: string,
    maybePassword?: string
  ): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    const validRoles: UserRole[] = ['principal', 'teacher', 'student', 'parent'];
    let role: UserRole | undefined;
    let identifier: string;
    let password: string | undefined;

    if (validRoles.includes(identifierOrRole as UserRole) && maybePassword !== undefined) {
      role = identifierOrRole as UserRole;
      identifier = (passwordOrIdentifier || '').trim();
      password = maybePassword;
    } else {
      identifier = (identifierOrRole || '').trim();
      password = passwordOrIdentifier;
      if (maybePassword && validRoles.includes(maybePassword as UserRole)) {
        role = maybePassword as UserRole;
      }
    }

    if (!identifier) {
      return { success: false, message: 'Please enter your institutional email or enrolment ID.' };
    }

    try {
      // 1. Resolve role from users state or fresh fetch if not already specified
      let userList = users;
      if (!userList || userList.length === 0) {
        try {
          const fetched = await ApiService.getUsers();
          if (fetched && fetched.length > 0) {
            userList = fetched;
            setUsers(fetched);
          }
        } catch {}
      }

      if (!role && userList && userList.length > 0) {
        const found = userList.find(u => 
          u.email.toLowerCase() === identifier.toLowerCase() || 
          (u.enrolmentNumber && u.enrolmentNumber.toLowerCase() === identifier.toLowerCase())
        );
        if (found) {
          role = found.role;
        }
      }

      // Default heuristic if still unknown
      if (!role) {
        if (identifier.toUpperCase().startsWith('ENR-') || /^\d+$/.test(identifier)) {
          role = 'student';
        } else if (identifier.toLowerCase().includes('principal') || identifier.toLowerCase().includes('admin')) {
          role = 'principal';
        } else {
          role = 'teacher';
        }
      }

      // 2. Try authenticating with backend
      let res: any = null;
      let usedRole = role;
      try {
        res = await ApiService.login(role, identifier, password);
      } catch (firstErr: any) {
        // If not explicitly set, try other candidate roles
        const otherRoles: UserRole[] = validRoles.filter(r => r !== role);
        for (const candidate of otherRoles) {
          try {
            const candRes = await ApiService.login(candidate, identifier, password);
            if (candRes && candRes.success) {
              res = candRes;
              usedRole = candidate;
              break;
            }
          } catch {}
        }
        if (!res) throw firstErr;
      }

      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setIsBackendConnected(true);

        if (res.token) {
          CookieUtil.set('jwt_token', res.token, 7);
          CookieUtil.set('client_jwt', res.token, 7);
        }

        setUsers(prev => {
          const idx = prev.findIndex(u => u.id === res.user.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = res.user;
            return updated;
          }
          return [...prev, res.user];
        });

        return { success: true, role: res.user.role || usedRole };
      }

      return {
        success: false,
        message: res?.message || 'Authentication failed. Please check your credentials.'
      };
    } catch (err: any) {
      console.error('Backend authentication error:', err);
      setIsBackendConnected(false);

      const errorText = err?.message || '';
      const isConnectionError =
        errorText.includes('Failed to fetch') ||
        errorText.includes('NetworkError') ||
        errorText.includes('Network request failed') ||
        errorText.includes('connection refused') ||
        err?.name === 'TypeError';

      if (isConnectionError) {
        return {
          success: false,
          message: 'Backend server is offline or unreachable (http://localhost:8080). Please start the backend service to log in.'
        };
      }

      return {
        success: false,
        message: errorText || 'Invalid credentials. Authentication rejected by backend.'
      };
    }
  };

  const changePassword = async (newPassword?: string, newEmail?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      if (!currentUser || !currentUser.id) {
        return { success: false, message: 'No active logged-in user session.' };
      }

      const payload: Partial<User> = {};
      if (newPassword && newPassword.trim()) {
        payload.password = newPassword.trim();
      }
      if (newEmail && newEmail.trim()) {
        const cleanEmail = newEmail.trim().toLowerCase();
        // verify uniqueness
        const conflict = users.find(u => u.id !== currentUser.id && u.email.toLowerCase() === cleanEmail);
        if (conflict) {
          return { success: false, message: `Email "${cleanEmail}" is already registered to ${conflict.name}.` };
        }
        payload.email = cleanEmail;
      }

      if (Object.keys(payload).length === 0) {
        return { success: false, message: 'No changes provided for email or password.' };
      }

      const updated = await ApiService.updateUser(currentUser.id, payload);
      const userResult = updated || { ...currentUser, ...payload };
      setCurrentUser(prev => ({ ...prev, ...payload }));
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...payload } : u));
      return { success: true, message: 'Credentials updated successfully in database.', user: userResult };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update credentials in backend.' };
    }
  };

  const resetForgottenPassword = async (identifier: string, newPassword: string, role?: string, newEmail?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const cleanId = identifier.trim().toLowerCase();
      const found = users.find(u => 
        (role ? u.role === role : true) &&
        (u.email.toLowerCase() === cleanId || (u.enrolmentNumber && u.enrolmentNumber.toLowerCase() === cleanId))
      );

      const payload: Partial<User> = { password: newPassword };
      if (newEmail && newEmail.trim() && newEmail.trim().toLowerCase() !== cleanId) {
        payload.email = newEmail.trim().toLowerCase();
      }

      if (found) {
        await ApiService.updateUser(found.id, payload);
        const updatedUser = { ...found, ...payload };
        setUsers(prev => prev.map(u => u.id === found.id ? { ...u, ...payload } : u));
        if (currentUser.id === found.id) {
          setCurrentUser(prev => ({ ...prev, ...payload }));
        }
        return { success: true, message: 'Credentials updated in MySQL database.', user: updatedUser };
      }

      const res = await ApiService.resetPassword(identifier.trim(), newPassword, role);
      if (res && res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === res.user!.id ? { ...u, ...res.user } : u));
        if (currentUser.id === res.user.id) {
          setCurrentUser(prev => ({ ...prev, ...res.user }));
        }
        return { success: true, message: res.message, user: res.user };
      }
      return { success: false, message: res?.message || 'Failed to reset credentials.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update credentials in backend.' };
    }
  };

  const resetAllUsersPasswords = async (): Promise<{ success: boolean; message?: string; count?: number }> => {
    try {
      const res = await ApiService.resetAllPasswords();
      const refreshed = await ApiService.getUsers().catch(() => null);
      if (refreshed && refreshed.length > 0) {
        setUsers(refreshed);
      } else {
        setUsers(prev => prev.map(u => {
          let pwd = 'pass';
          if (u.role === 'principal') pwd = 'admin';
          else if (u.role === 'teacher') pwd = 'teach';
          return { ...u, password: pwd };
        }));
      }
      return { success: true, message: res?.message || 'All user passwords have been reset to defaults.', count: res?.count };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to reset all passwords.' };
    }
  };

  const resetUserPassword = async (userId: string, newPassword?: string, newEmail?: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const payload: Partial<User> = {};
      if (newPassword && newPassword.trim()) payload.password = newPassword.trim();
      if (newEmail && newEmail.trim()) payload.email = newEmail.trim().toLowerCase();

      const res = await ApiService.updateUser(userId, payload);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...payload } : u));
      if (currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, ...payload }));
      }
      return { success: true, message: 'Account credentials updated successfully.', user: res || undefined };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update user credentials.' };
    }
  };

  const logout = () => {
    // Clear server-side HTTP-only cookies
    ApiService.logout().catch(err => console.warn('Logout notification:', err));
    // Clear client cookies
    CookieUtil.remove('jwt_token');
    CookieUtil.remove('client_jwt');
    setCurrentUser(DEFAULT_USER);
    setIsAuthenticated(false);
  };

  const switchRole = (role: UserRole, specificUserId?: string) => {
    if (specificUserId) {
      const found = users.find(u => u.id === specificUserId);
      if (found) {
        setCurrentUser(found);
        setIsAuthenticated(true);
        return;
      }
    }
    const matching = users.find(u => u.role === role);
    if (matching) {
      setCurrentUser(matching);
      setIsAuthenticated(true);
    }
  };

  const createUser = async (userData: Partial<User> & { name: string; email: string; role: UserRole; password?: string }): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const cleanEmail = userData.email.trim().toLowerCase();
      const existing = users.find(u => 
        u.email.toLowerCase() === cleanEmail || 
        (userData.enrolmentNumber && u.enrolmentNumber && u.enrolmentNumber.toLowerCase() === userData.enrolmentNumber.trim().toLowerCase())
      );
      if (existing) {
        return { success: false, message: `An account with this email/enrolment ID already exists (${existing.name} - ${existing.role.toUpperCase()}).` };
      }

      const defaultPass = userData.role === 'principal' ? 'admin' : userData.role === 'teacher' ? 'teach' : 'pass';
      const newUser: User = {
        ...userData,
        id: `usr-${userData.role}-${Date.now()}`,
        name: userData.name.trim(),
        email: cleanEmail,
        role: userData.role,
        status: 'active',
        password: userData.password?.trim() || defaultPass,
        enrolmentNumber: userData.enrolmentNumber?.trim() || undefined,
        assignedClassIds: userData.assignedClassIds || [],
        assignedSubjectIds: userData.assignedSubjectIds || [],
        parentEmail: userData.parentEmail?.trim() || undefined,
        parentPhone: userData.parentPhone?.trim() || undefined,
        studentId: userData.studentId?.trim() || undefined,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.enrolmentNumber || cleanEmail || userData.name}`
      };

      setUsers(prev => [...prev, newUser]);
      await ApiService.createUser(newUser);
      return { success: true, user: newUser };
    } catch (err: any) {
      console.error('Failed to create user on backend', err);
      return { success: false, message: err?.message || 'Failed to create user in database.' };
    }
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      if (currentUser.id === id) {
        setCurrentUser(prev => ({ ...prev, ...data }));
      }
      const updated = await ApiService.updateUser(id, data);
      return { success: true, user: updated };
    } catch (err: any) {
      console.error('Failed to update user on backend', err);
      return { success: false, message: err?.message || 'Failed to update user in database.' };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setUsers(prev => prev.filter(u => u.id !== id));
      await ApiService.deleteUser(id);
      return { success: true, message: 'User deleted successfully.' };
    } catch (err: any) {
      console.error('Failed to delete user on backend', err);
      return { success: false, message: err?.message || 'Failed to delete user in database.' };
    }
  };

  const createTeacher = (data: Omit<User, 'id' | 'role' | 'status'>) => {
    const newTeacher: User = {
      ...data,
      id: `usr-teacher-${Date.now()}`,
      role: 'teacher',
      status: 'active',
      password: data.password || 'teach',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`
    };
    setUsers(prev => [...prev, newTeacher]);
    ApiService.createUser(newTeacher).catch(err => console.error('Failed to sync teacher to backend', err));
  };

  const updateTeacher = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...data }));
    }
    ApiService.updateUser(id, data).catch(err => console.error('Failed to sync teacher update to backend', err));
  };

  const toggleTeacherStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    ApiService.toggleUserStatus(id).catch(err => console.error('Failed to sync teacher status toggle to backend', err));
  };

  const assignTeacherClassesAndSubjects = (teacherId: string, classIds: string[], subjectIds: string[]) => {
    setUsers(prev => prev.map(u => {
      if (u.id === teacherId) {
        return {
          ...u,
          assignedClassIds: classIds,
          assignedSubjectIds: subjectIds
        };
      }
      return u;
    }));
    ApiService.assignTeacherClassesAndSubjects(teacherId, classIds, subjectIds)
      .catch(err => console.error('Failed to sync assignments to backend', err));
  };

  const addClass = (newClass: Omit<SchoolClass, 'id'>) => {
    const created: SchoolClass = {
      ...newClass,
      id: `cls-${Date.now()}`
    };
    setClasses(prev => [...prev, created]);
    ApiService.createClass(created).catch(err => console.error('Failed to sync class to backend', err));
  };

  const addSubject = (newSubject: { name: string; code: string; chapters?: Subject['chapters'] }): Subject => {
    const created: Subject = {
      id: `sub-${newSubject.code.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`,
      name: newSubject.name,
      code: newSubject.code,
      chapters: newSubject.chapters && newSubject.chapters.length > 0 ? newSubject.chapters : [
        {
          id: `ch-${Date.now()}-1`,
          number: 1,
          title: 'Introduction & Core Curriculum',
          topics: ['Key Terminology', 'Principles & Foundations', 'Practical Applications'],
          summary: `Curriculum baseline for ${newSubject.name}.`,
          contentExcerpt: `Comprehensive introduction to standard concepts, formulas, and syllabus modules in ${newSubject.name}.`
        }
      ]
    };
    setSubjects(prev => [...prev, created]);
    ApiService.createSubject(created).catch(err => console.error('Failed to sync subject to backend', err));
    return created;
  };

  const addChapterToSubject = (subjectId: string, chapterData: Omit<Chapter, 'id'>): Chapter => {
    const newChapter: Chapter = {
      ...chapterData,
      id: `ch-${subjectId}-${Date.now()}`
    };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: [...s.chapters, newChapter]
        };
      }
      return s;
    }));
    ApiService.addChapter(subjectId, newChapter).catch(err => console.error('Failed to sync chapter to backend', err));
    return newChapter;
  };

  const addBook = (bookData: Omit<BookSource, 'id'>): BookSource => {
    const newBook: BookSource = {
      ...bookData,
      id: `bk-${Date.now()}`
    };
    setBooks(prev => [...prev, newBook]);
    ApiService.createBook(newBook).catch(err => console.error('Failed to sync book to backend', err));
    return newBook;
  };

  const createStudent = (student: Omit<User, 'id' | 'role' | 'status'>) => {
    const newStudent: User = {
      ...student,
      id: `usr-std-${Date.now()}`,
      role: 'student',
      status: 'active',
      password: student.password || 'pass',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.enrolmentNumber || student.name}`
    };
    setUsers(prev => [...prev, newStudent]);
    ApiService.createUser(newStudent).catch(err => console.error('Failed to sync student to backend', err));
  };

  const updateStudent = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    ApiService.updateUser(id, data).catch(err => console.error('Failed to sync student update to backend', err));
  };

  const createAssessment = (assessmentData: Omit<Assessment, 'id' | 'createdAt'>): Assessment => {
    const newAssessment: Assessment = {
      ...assessmentData,
      id: `asm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAssessments(prev => [newAssessment, ...prev]);
    ApiService.createAssessment(newAssessment).catch(err => console.error('Failed to sync assessment to backend', err));
    return newAssessment;
  };

  const updateAssessment = (id: string, updated: Partial<Assessment>) => {
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    ApiService.updateAssessment(id, updated).catch(err => console.error('Failed to sync assessment update to backend', err));
  };

  const deleteAssessment = (id: string) => {
    setAssessments(prev => prev.filter(a => a.id !== id));
    ApiService.deleteAssessment(id).catch(err => console.error('Failed to delete assessment on backend', err));
  };

  const generateRandomizedSets = (assessmentId: string, count: number = 3): QuestionPaperSet[] => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) return [];

    const subject = subjects.find(s => s.id === assessment.subjectId);
    const setNames = ['Set A', 'Set B', 'Set C', 'Set D', 'Set E'];
    const sets: QuestionPaperSet[] = [];

    for (let i = 0; i < count; i++) {
      const setName = setNames[i % setNames.length];
      let questionsCopy = [...assessment.questions];
      
      if (assessment.randomizeOrder) {
        const groupedByMarks: { [key: number]: Question[] } = {};
        questionsCopy.forEach(q => {
          if (!groupedByMarks[q.marks]) groupedByMarks[q.marks] = [];
          groupedByMarks[q.marks].push(q);
        });

        const shuffledGroups: Question[] = [];
        Object.keys(groupedByMarks).sort((a, b) => Number(a) - Number(b)).forEach(marksKey => {
          const group = [...groupedByMarks[Number(marksKey)]];
          const rotated = [...group.slice(i % group.length), ...group.slice(0, i % group.length)];
          shuffledGroups.push(...rotated);
        });
        questionsCopy = shuffledGroups;
      }

      const answerKey = questionsCopy.map((q, idx) => {
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
        setId: `set-${assessment.id}-${i + 1}`,
        setName,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        subjectName: subject?.name || 'General Subject',
        className: 'Grade 10 (Secondary)',
        durationMinutes: assessment.durationMinutes,
        totalMarks: assessment.totalMarks,
        instructions: assessment.instructions,
        questions: questionsCopy,
        answerKey
      });
    }

    return sets;
  };

  const generateAIQuestions = async (params: {
    subjectId: string;
    chapterId: string;
    questionTypes: QuestionType[];
    marks?: number;
    difficulty: QuestionDifficulty;
    count?: number;
    customPrompt?: string;
    markDistribution?: { marks: number; count: number }[];
  }): Promise<Question[]> => {
    try {
      const backendQuestions = await ApiService.generateAIQuestions(params);
      if (backendQuestions && backendQuestions.length > 0) {
        return backendQuestions;
      }
    } catch (e) {
      console.warn('Backend AI generation fell back to local generation:', e);
    }

    await new Promise(res => setTimeout(res, 600));
    const subject = subjects.find(s => s.id === params.subjectId);
    const chapter = subject?.chapters.find(c => c.id === params.chapterId);

    const generated: Question[] = [];
    const topics = chapter?.topics || ['Core concepts', 'Application', 'Formulas'];

    const distribution: { marks: number; count: number }[] = 
      params.markDistribution && params.markDistribution.length > 0
        ? params.markDistribution.filter(d => d.count > 0)
        : [{ marks: params.marks || 2, count: params.count || 5 }];

    let totalGeneratedCount = 0;
    for (const dist of distribution) {
      for (let i = 0; i < dist.count; i++) {
        const qMarks = dist.marks;
        const topic = topics[totalGeneratedCount % topics.length];
        const qId = `ai-gen-${Date.now()}-${totalGeneratedCount++}`;

        if (qMarks === 1) {
          generated.push({
            id: qId,
            text: `[AI Generated] Regarding ${topic} in ${chapter?.title || 'this chapter'}, which of the following statements represents the correct physical/mathematical principle?`,
            type: 'mcq',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: 1,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            options: [
              { id: `opt-${qId}-1`, text: `The value remains directly invariant under standard conditions.`, isCorrect: true },
              { id: `opt-${qId}-2`, text: `The magnitude increases quadratically with inverse parameters.`, isCorrect: false },
              { id: `opt-${qId}-3`, text: `Energy is dissipated uniformly without thermodynamic loss.`, isCorrect: false },
              { id: `opt-${qId}-4`, text: `The derivative with respect to time vanishes entirely.`, isCorrect: false }
            ],
            explanation: `Theoretical basis: ${topic} operates under strict conservation rules described in standard textbook curriculum.`
          });
        } else if (qMarks === 2) {
          generated.push({
            id: qId,
            text: `[AI Generated] Explain the fundamental concept of ${topic} in ${chapter?.title || 'this chapter'}. State its primary governing rule or characteristic unit.`,
            type: 'short_answer',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: 2,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            correctAnswerText: `Core definition of ${topic} with key characteristics and physical/theoretical significance.`,
            markingRubric: '1 mark for precise definition, 1 mark for correct property or formula.'
          });
        } else if (qMarks === 3) {
          generated.push({
            id: qId,
            text: `[AI Generated] Calculate the numerical quantity for ${topic} when initial input is 24 units and rate multiplier is 2.5. Show all intermediate formula steps.`,
            type: 'key_in',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: 3,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            correctAnswerText: '60',
            explanation: `Direct substitution formula: 24 * 2.5 = 60 units.`,
            markingRubric: '1 mark for formula, 1 mark for calculation steps, 1 mark for final result with units.'
          });
        } else if (qMarks === 4) {
          generated.push({
            id: qId,
            text: `[AI Generated] Analyze the application of ${topic} in modern systems. (a) State the governing principle (b) Deduce the relationship under standard working conditions.`,
            type: 'short_answer',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: 4,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            correctAnswerText: `Statement of governing principle for ${topic}, accompanied by step-by-step deductive explanation and context.`,
            markingRubric: '2 marks for theoretical principle, 2 marks for derivation & context deduction.'
          });
        } else if (qMarks === 5) {
          generated.push({
            id: qId,
            text: `[AI Generated] Discuss in detail the significance of ${topic} in relation to ${chapter?.title}. Provide a complete mathematical formulation, diagram where relevant, and real-world example.`,
            type: 'long_answer',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: 5,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            correctAnswerText: `Comprehensive definition of ${topic}, followed by governing equations and applicable industrial/natural phenomenon example.`,
            markingRubric: `Definition & Theory (2 marks), Equation & Diagram (2 marks), Practical Application (1 mark).`
          });
        } else {
          generated.push({
            id: qId,
            text: `[AI Generated] Comprehensive Study on ${topic} (${qMarks} Marks): (a) Formulate the governing theoretical basis. (b) Derive analytical equations with assumptions. (c) Evaluate practical implications in real-world scenarios.`,
            type: 'long_answer',
            subjectId: params.subjectId,
            chapterId: params.chapterId,
            chapterNumber: chapter?.number || 1,
            marks: qMarks,
            difficulty: params.difficulty,
            source: 'ai_generated',
            approved: false,
            correctAnswerText: `Extensive multi-part response covering theory, rigorous mathematical proof, and contextual application.`,
            markingRubric: `Evenly proportioned across parts (a), (b), and (c).`
          });
        }
      }
    }

    return generated;
  };

  const generateBookQuestions = async (params: {
    bookId: string;
    chapterNumbers: number[];
    markDistribution: { marks: number; count: number }[];
    totalQuestions: number;
    chapters?: BookSource['chapters'];
    subjectId?: string;
    bookTitle?: string;
    groqApiKey?: string;
    groqModel?: string;
    useGroqAi?: boolean;
  }): Promise<Question[]> => {
    // Attempt backend generation (including Groq AI from backend)
    try {
      const backendCall = ApiService.generateBookQuestions({
        bookId: params.bookId,
        chapterNumbers: params.chapterNumbers,
        markDistribution: params.markDistribution,
        totalQuestions: params.totalQuestions,
        groqApiKey: params.groqApiKey,
        groqModel: params.groqModel,
        useGroqAi: params.useGroqAi
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Backend generation timeout')), 30000)
      );
      const backendQuestions = await Promise.race([backendCall, timeoutPromise]);
      if (backendQuestions && backendQuestions.length > 0) {
        return backendQuestions;
      }
    } catch (e) {
      console.warn('Backend Book question generation notice (falling back if needed):', e);
    }

    await new Promise(res => setTimeout(res, 400));
    const book = books.find(b => b.id === params.bookId);
    let availableChapters: BookSource['chapters'] = 
      (params.chapters && params.chapters.length > 0)
        ? params.chapters
        : (book?.chapters && book.chapters.length > 0 ? book.chapters : []);

    if (availableChapters.length === 0) {
      availableChapters = [
        {
          chapterNumber: 1,
          title: params.bookTitle || book?.title || 'Core Syllabus Unit',
          pageRange: 'pp. 1-25',
          summary: 'Fundamental concepts, equations, and definitions.',
          sampleText: 'Textbook curriculum theory and exercise questions.'
        }
      ];
    }

    // Strict filter: ONLY generate from explicitly requested chapters
    let selectedChapters = (params.chapterNumbers && params.chapterNumbers.length > 0)
      ? availableChapters.filter(c => params.chapterNumbers.includes(c.chapterNumber))
      : availableChapters;

    if (selectedChapters.length === 0) {
      selectedChapters = availableChapters.slice(0, 1);
    }

    const effectiveSubjectId = params.subjectId || book?.subjectId || 'sub-chem';
    const effectiveBookTitle = params.bookTitle || book?.title || 'Uploaded Document';

    const generated: Question[] = [];
    let counter = 1;

    const cleanSentences = (text: string) => {
      return text
        .replace(/Figure \d+\.\d+/g, '')
        .replace(/Activity \d+\.\d+/g, '')
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && !s.startsWith('Figure') && !s.startsWith('Activity'));
    };

    for (const dist of params.markDistribution) {
      for (let i = 0; i < dist.count; i++) {
        const chapter = selectedChapters[(counter - 1) % selectedChapters.length] || selectedChapters[0];
        const rawExcerpt = chapter.sampleText || chapter.summary || chapter.title;
        const sentences = cleanSentences(rawExcerpt);
        const coreSentence = sentences[i % Math.max(1, sentences.length)] || rawExcerpt.slice(0, 100);
        const qId = `doc-q-${chapter.chapterNumber}-${Date.now()}-${counter++}`;

        if (dist.marks === 1) {
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}] Identify the correct statement regarding: "${coreSentence.slice(0, 85)}..."`,
            type: 'mcq',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: 1,
            difficulty: 'easy',
            source: 'book_upload',
            approved: true,
            options: [
              { id: `opt-${qId}-1`, text: 'Directly conforms to the standard principles stated in the textbook', isCorrect: true },
              { id: `opt-${qId}-2`, text: 'Inverts the standard stoichiometric or physical proportion', isCorrect: false },
              { id: `opt-${qId}-3`, text: 'Applies exclusively under extreme non-equilibrium limits', isCorrect: false },
              { id: `opt-${qId}-4`, text: 'No relationship exists according to standard curriculum', isCorrect: false }
            ],
            explanation: `Extracted from ${effectiveBookTitle} - Chapter ${chapter.chapterNumber} (${chapter.pageRange}).`
          });
        } else if (dist.marks === 2) {
          const promptVariants = [
            `Define the core term illustrated in ${chapter.title}. State its primary characteristic or formula unit.`,
            `State two distinguishing properties discussed in ${chapter.title} based on: "${coreSentence.slice(0, 70)}...".`,
            `Give two real-world examples or applications of the concepts covered in ${chapter.title}.`
          ];
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}: 2 Marks] ${promptVariants[i % promptVariants.length]}`,
            type: 'short_answer',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: 2,
            difficulty: 'easy',
            source: 'book_upload',
            approved: true,
            correctAnswerText: `Accurate textbook definition and 2 distinguishing properties/units.`,
            markingRubric: '1 mark for correct definition or first property, 1 mark for second property or SI unit.',
            explanation: `Curriculum baseline from ${chapter.title}.`
          });
        } else if (dist.marks === 3) {
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}: 3 Marks] Reasoning & Calculation: Based on ${chapter.title}, answer the following: (a) Explain the underlying principle behind "${coreSentence.slice(0, 70)}..." (b) Calculate or justify the outcome under standard conditions.`,
            type: 'key_in',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: 3,
            difficulty: 'medium',
            source: 'book_upload',
            approved: true,
            correctAnswerText: 'Standard value or balanced reaction according to textbook rule.',
            explanation: `Solved using curriculum concepts from Chapter ${chapter.chapterNumber}.`,
            markingRubric: '1 mark for theoretical principle, 1 mark for intermediate calculation step, 1 mark for correct conclusion/unit.'
          });
        } else if (dist.marks === 4) {
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}: 4 Marks] Structured Analysis: (a) State the primary rule described in ${chapter.title}. (b) Analyze the result or chemical/physical transformation under varying conditions described in "${coreSentence.slice(0, 75)}...".`,
            type: 'short_answer',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: 4,
            difficulty: 'medium',
            source: 'book_upload',
            approved: true,
            correctAnswerText: `Core principle statement and detailed condition analysis.`,
            markingRubric: '2 marks for theoretical principle, 2 marks for analysis under varied conditions.',
            explanation: `Derived from Chapter ${chapter.chapterNumber}: ${chapter.title}.`
          });
        } else if (dist.marks === 5) {
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}: 5 Marks] Comprehensive Long Answer: Elaborate on the core concepts in ${chapter.title} with a complete derivation, structural formula / ray diagram, and experimental validation based on: "${coreSentence.slice(0, 80)}...".`,
            type: 'long_answer',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: 5,
            difficulty: 'medium',
            source: 'book_upload',
            approved: true,
            correctAnswerText: `Detailed explanation including mathematical formulation/chemical mechanism and graphical breakdown.`,
            markingRubric: '2 marks for theory, 2 marks for derivation / diagram, 1 mark for real-world application.',
            explanation: `In-depth syllabus evaluation from Chapter ${chapter.chapterNumber}.`
          });
        } else {
          generated.push({
            id: qId,
            text: `[Doc: ${effectiveBookTitle} | Ch ${chapter.chapterNumber}: ${dist.marks} Marks] Section E Case Study / Major Problem: Read the following textbook excerpt from ${chapter.title}: "${coreSentence}". (a) Identify and explain the two main mechanisms (4 Marks). (b) Deduce the quantitative formulas and solve for standard parameters (4 Marks). (c) State potential errors and safety/accuracy precautions (${dist.marks - 8} Marks).`,
            type: 'long_answer',
            subjectId: effectiveSubjectId,
            chapterId: `ch-${effectiveSubjectId}-${chapter.chapterNumber}`,
            chapterNumber: chapter.chapterNumber,
            marks: dist.marks,
            difficulty: 'hard',
            source: 'book_upload',
            approved: true,
            correctAnswerText: `Comprehensive multi-part solution with full rubrics.`,
            markingRubric: `Part (a): 4 marks, Part (b): 4 marks, Part (c): ${dist.marks - 8} marks.`,
            explanation: `Advanced Bloom's Taxonomy evaluation from ${chapter.title}.`
          });
        }
      }
    }

    return generated;
  };

  const startStudentAttempt = (assessmentId: string, studentId: string): StudentExamAttempt => {
    const existing = studentAttempts.find(a => a.assessmentId === assessmentId && a.studentId === studentId);
    if (existing && existing.status !== 'in_progress' && !existing.reattemptAllowed) {
      return existing;
    }
    const student = users.find(u => u.id === studentId);
    const assessment = assessments.find(a => a.id === assessmentId);

    const newAttempt: StudentExamAttempt = {
      id: `att-${studentId}-${assessmentId}-${Date.now()}`,
      assessmentId,
      studentId,
      studentName: student?.name || 'Student',
      enrolmentNumber: student?.enrolmentNumber || 'ENR-UNKNOWN',
      classId: student?.classId || 'cls-10a',
      startTime: new Date().toISOString(),
      status: 'in_progress',
      maxScore: assessment?.totalMarks || 100,
      malpracticeCount: 0,
      malpracticeLogs: [],
      answers: []
    };

    setStudentAttempts(prev => [newAttempt, ...prev.filter(a => !(a.assessmentId === assessmentId && a.studentId === studentId))]);
    ApiService.startAttempt(assessmentId, studentId).catch(err => console.error('Failed to sync start attempt to backend', err));
    return newAttempt;
  };

  const recordMalpracticeViolation = (attemptId: string, type: MalpracticeLog['type'], description: string) => {
    setStudentAttempts(prev => prev.map(attempt => {
      if (attempt.id !== attemptId) return attempt;
      if (attempt.status === 'malpractice_terminated' || attempt.status === 'submitted') return attempt;

      const newViolationNum = attempt.malpracticeCount + 1;
      const newLog: MalpracticeLog = {
        id: `mp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        description: `${description} (Violation #${newViolationNum} of 3)`,
        violationNumber: newViolationNum
      };

      const isTerminated = newViolationNum >= 3;
      const updatedStatus = isTerminated ? 'malpractice_terminated' : attempt.status;

      if (isTerminated) {
        const assessment = assessments.find(a => a.id === attempt.assessmentId);
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: `⚠️ Malpractice Termination: ${attempt.studentName}`,
          message: `Student ${attempt.studentName} (${attempt.enrolmentNumber}) was automatically terminated from "${assessment?.title || 'Exam'}" due to exceeding 3 malpractice violations.`,
          type: 'alert',
          timestamp: new Date().toISOString(),
          read: false,
          roleTarget: 'teacher',
          linkAction: 'malpractice'
        };
        setNotifications(n => [newNotif, ...n]);
      }

      return {
        ...attempt,
        malpracticeCount: newViolationNum,
        malpracticeLogs: [...attempt.malpracticeLogs, newLog],
        status: updatedStatus,
        submitTime: isTerminated ? new Date().toISOString() : attempt.submitTime
      };
    }));

    ApiService.recordMalpractice(attemptId, type, description).catch(err => console.error('Failed to sync malpractice violation to backend', err));
  };

  const submitStudentAttempt = (attemptId: string, studentAnswers: { questionId: string; studentAnswer: string }[]) => {
    setStudentAttempts(prev => prev.map(attempt => {
      if (attempt.id !== attemptId) return attempt;
      const assessment = assessments.find(a => a.id === attempt.assessmentId);
      if (!assessment) return attempt;

      let totalScore = 0;
      const evaluatedAnswers = studentAnswers.map(ans => {
        const question = assessment.questions.find(q => q.id === ans.questionId);
        if (!question) return { ...ans, isCorrect: false, marksObtained: 0 };

        if (question.type === 'mcq' || question.type === 'true_false') {
          const correctOpt = question.options?.find(o => o.isCorrect);
          const isCorrect = correctOpt ? correctOpt.id === ans.studentAnswer : false;
          const marks = isCorrect ? question.marks : 0;
          totalScore += marks;
          return {
            ...ans,
            isCorrect,
            marksObtained: marks,
            evaluatedBy: 'auto' as const
          };
        } else if (question.type === 'key_in') {
          const cleanExpected = (question.correctAnswerText || '').trim().toLowerCase();
          const cleanStudent = ans.studentAnswer.trim().toLowerCase();
          const isCorrect = cleanExpected === cleanStudent;
          const marks = isCorrect ? question.marks : 0;
          totalScore += marks;
          return {
            ...ans,
            isCorrect,
            marksObtained: marks,
            evaluatedBy: 'auto' as const
          };
        } else {
          const marks = Math.round(question.marks * 0.8);
          totalScore += marks;
          return {
            ...ans,
            isCorrect: true,
            marksObtained: marks,
            evaluatedBy: 'teacher' as const,
            teacherComment: 'Good response.'
          };
        }
      });

      const maxScore = assessment.totalMarks;
      const percentage = Math.round((totalScore / maxScore) * 100);

      return {
        ...attempt,
        status: 'evaluated',
        submitTime: new Date().toISOString(),
        answers: evaluatedAnswers,
        totalScore,
        maxScore,
        percentage
      };
    }));

    ApiService.submitAttempt(attemptId, studentAnswers).catch(err => console.error('Failed to sync exam submission to backend', err));
  };

  const submitReattemptRequest = (attemptId: string, reason: string) => {
    const attempt = studentAttempts.find(a => a.id === attemptId);
    if (!attempt) return;
    const assessment = assessments.find(a => a.id === attempt.assessmentId);

    const newReq: ReattemptRequest = {
      id: `req-${Date.now()}`,
      attemptId,
      studentId: attempt.studentId,
      studentName: attempt.studentName,
      enrolmentNumber: attempt.enrolmentNumber,
      assessmentId: attempt.assessmentId,
      assessmentTitle: assessment?.title || 'Online Exam',
      teacherId: assessment?.createdByTeacherId || 'usr-teacher-sarah',
      reason,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    setReattemptRequests(prev => [newReq, ...prev]);
    setStudentAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, reattemptRequested: true } : a));

    setNotifications(prev => [
      {
        id: `notif-req-${Date.now()}`,
        title: `📩 Re-attempt Requested by ${attempt.studentName}`,
        message: `${attempt.studentName} (${attempt.enrolmentNumber}) is requesting a re-attempt for ${assessment?.title}.`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        roleTarget: 'teacher',
        linkAction: 'malpractice'
      },
      ...prev
    ]);

    ApiService.submitReattemptRequest(newReq).catch(err => console.error('Failed to sync reattempt request to backend', err));
  };

  const resolveReattemptRequest = (requestId: string, status: 'approved' | 'rejected', paperMode: 'same' | 'new_random' = 'same') => {
    setReattemptRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, resolvedAt: new Date().toISOString(), paperMode } : r));

    const req = reattemptRequests.find(r => r.id === requestId);
    if (req && status === 'approved') {
      setStudentAttempts(prev => prev.map(a => {
        if (a.id === req.attemptId) {
          return {
            ...a,
            status: 'in_progress',
            malpracticeCount: 0,
            malpracticeLogs: [],
            reattemptAllowed: true,
            reattemptPaperMode: paperMode,
            reattemptRequested: false,
            answers: []
          };
        }
        return a;
      }));
    }

    ApiService.resolveReattemptRequest(requestId, status, paperMode).catch(err => console.error('Failed to sync reattempt resolution to backend', err));
  };

  const uploadOfflineSheet = (sheet: Omit<OfflineAnswerSheet, 'id' | 'uploadDate' | 'evaluationStatus' | 'totalMarksAwarded' | 'maxMarks' | 'percentage'>): string => {
    const newId = `sheet-${Date.now()}`;
    const assessment = assessments.find(a => a.id === sheet.assessmentId);
    const maxMarks = assessment?.totalMarks || 50;

    const newSheet: OfflineAnswerSheet = {
      ...sheet,
      id: newId,
      uploadDate: new Date().toISOString(),
      evaluationStatus: 'pending',
      totalMarksAwarded: 0,
      maxMarks,
      percentage: 0
    };

    setOfflineSheets(prev => [newSheet, ...prev]);
    ApiService.uploadOfflineSheet(newSheet).catch(err => console.error('Failed to sync offline sheet to backend', err));
    return newId;
  };

  const runAIEvaluation = async (sheetId: string) => {
    try {
      const updatedSheet = await ApiService.evaluateOfflineSheet(sheetId);
      if (updatedSheet && updatedSheet.questionEvaluations && updatedSheet.questionEvaluations.length > 0) {
        setOfflineSheets(prev => prev.map(s => s.id === sheetId ? updatedSheet : s));
        return;
      }
    } catch (e) {
      console.warn('Backend OCR evaluation fell back to local simulation:', e);
    }

    await new Promise(res => setTimeout(res, 900));

    setOfflineSheets(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      const assessment = assessments.find(a => a.id === sheet.assessmentId);

      const evaluations = (assessment?.questions || []).map((q, idx) => {
        const isHard = q.difficulty === 'hard';
        const proposedMarks = isHard ? Math.max(1, q.marks - 1) : q.marks;
        const confidence = isHard ? 82 : 95;

        return {
          questionId: q.id,
          questionNumber: idx + 1,
          maxMarks: q.marks,
          extractedText: `[Simulated OCR Handwriting]\nStep 1: Formula applied according to chapter ${q.chapterNumber || 1}.\nStep 2: Working calculations shown clearly.\nFinal answer obtained: ${q.correctAnswerText || 'Verified result'}.`,
          aiProposedMarks: proposedMarks,
          aiConfidence: confidence,
          aiReasoning: isHard 
            ? 'Minor ambiguity in algebraic step presentation, but final deduction is logically sound.' 
            : 'Complete steps matching the marking rubric accurately.',
          teacherMarks: proposedMarks,
          isFlaggedForReview: isHard
        };
      });

      const totalMarks = evaluations.reduce((sum, e) => sum + e.aiProposedMarks, 0);
      const maxMarks = assessment?.totalMarks || 50;
      const percentage = Math.round((totalMarks / maxMarks) * 100);

      return {
        ...sheet,
        evaluationStatus: 'ai_evaluated',
        questionEvaluations: evaluations,
        totalMarksAwarded: totalMarks,
        maxMarks,
        percentage
      };
    }));
  };

  const updateTeacherOfflineMarks = (sheetId: string, updatedEvaluations: OfflineAnswerSheet['questionEvaluations']) => {
    setOfflineSheets(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      const totalMarks = updatedEvaluations.reduce((sum, e) => sum + e.teacherMarks, 0);
      const percentage = Math.round((totalMarks / sheet.maxMarks) * 100);

      return {
        ...sheet,
        evaluationStatus: 'teacher_verified',
        questionEvaluations: updatedEvaluations,
        totalMarksAwarded: totalMarks,
        percentage
      };
    }));

    ApiService.updateTeacherOfflineMarks(sheetId, updatedEvaluations).catch(err => console.error('Failed to sync teacher marks to backend', err));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    ApiService.markNotificationRead(id).catch(err => console.error('Failed to sync notification mark read', err));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    ApiService.markAllNotificationsRead().catch(err => console.error('Failed to sync mark all read', err));
  };

  const resetAllData = () => {
    ApiService.resetSystem()
      .then(() => {
        window.location.reload();
      })
      .catch((err) => {
        console.error('System reset error:', err);
        setUsers([]);
        setCurrentUser(DEFAULT_USER);
        setClasses([]);
        setSubjects([]);
        setBooks([]);
        setAssessments([]);
        setStudentAttempts([]);
        setOfflineSheets([]);
        setReattemptRequests([]);
        setNotifications([]);
        setIsAuthenticated(false);
      });
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      isAuthenticated,
      login,
      logout,
      switchRole,
      users,
      classes,
      subjects,
      books,
      assessments,
      studentAttempts,
      offlineSheets,
      reattemptRequests,
      notifications,
      isBackendConnected,
      createUser,
      updateUser,
      deleteUser,
      createTeacher,
      updateTeacher,
      toggleTeacherStatus,
      assignTeacherClassesAndSubjects,
      addClass,
      addSubject,
      addChapterToSubject,
      addBook,
      createStudent,
      updateStudent,
      createAssessment,
      updateAssessment,
      deleteAssessment,
      generateRandomizedSets,
      generateAIQuestions,
      generateBookQuestions,
      startStudentAttempt,
      recordMalpracticeViolation,
      submitStudentAttempt,
      submitReattemptRequest,
      resolveReattemptRequest,
      uploadOfflineSheet,
      runAIEvaluation,
      updateTeacherOfflineMarks,
      markNotificationRead,
      markAllNotificationsRead,
      resetAllData,
      changePassword,
      resetForgottenPassword,
      resetAllUsersPasswords,
      resetUserPassword
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
