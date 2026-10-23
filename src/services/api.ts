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

const API_BASE = 'http://localhost:8080/api';

export interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  enrolmentNumber?: string;
  classId?: string;
  iat: number;
  exp: number;
}

const PAYLOAD_SECRET = 'quiz_app_aes_256_gcm_payload_secret_key_32bytes!!';

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const raw = atob(padded);
  const uint8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8[i] = raw.charCodeAt(i);
  }
  return uint8;
}

export const JwtUtil = {
  /**
   * Reads raw JWT payload (sync).
   */
  decodeRaw: (token: string): { sub?: string; enc_data?: string; exp?: number; iat?: number; [key: string]: any } | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  /**
   * Decrypts the AES-256-GCM payload in the JWT (async) using the Web Crypto API.
   * Extracts decrypted fields (userId, role, name, email, etc.) alongside standard claims (sub, exp, iat).
   */
  decryptPayload: async (token: string): Promise<JwtPayload | null> => {
    try {
      const raw = JwtUtil.decodeRaw(token);
      if (!raw) return null;

      // If token contains enc_data (AES-256-GCM encrypted payload)
      if (raw.enc_data) {
        const combined = base64UrlToUint8Array(raw.enc_data);
        if (combined.length < 12 + 16) return null;

        const iv = combined.slice(0, 12);
        const cipherWithTag = combined.slice(12);

        // Derive 256-bit key from secret using SHA-256 (matches Java MessageDigest)
        const secretBytes = new TextEncoder().encode(PAYLOAD_SECRET);
        const keyHash = await crypto.subtle.digest('SHA-256', secretBytes);
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyHash,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          cipherWithTag
        );

        const decryptedJson = new TextDecoder().decode(decryptedBuffer);
        const decryptedUser = JSON.parse(decryptedJson);

        return {
          sub: raw.sub || decryptedUser.userId,
          userId: decryptedUser.userId,
          role: decryptedUser.role,
          name: decryptedUser.name,
          email: decryptedUser.email,
          enrolmentNumber: decryptedUser.enrolmentNumber,
          classId: decryptedUser.classId,
          iat: raw.iat || 0,
          exp: raw.exp || 0
        };
      }

      // Fallback for unencrypted tokens
      return raw as unknown as JwtPayload;
    } catch (err) {
      console.error('Failed to decrypt JWT payload with Web Crypto API:', err);
      return null;
    }
  },

  /**
   * Synchronous decoder (returns raw claims or unencrypted payload)
   */
  decode: <T = JwtPayload>(token: string): T | null => {
    return JwtUtil.decodeRaw(token) as unknown as T;
  },

  isExpired: (token: string): boolean => {
    const payload = JwtUtil.decodeRaw(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }
};

export const CookieUtil = {
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  },
  set: (name: string, value: string, days = 7): void => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  remove: (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const token = CookieUtil.get('jwt_token') || CookieUtil.get('client_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (null as T);
}

function parseAttempt(a: any): StudentExamAttempt {
  return {
    ...a,
    answers: a.answers || (a.answersJson ? (typeof a.answersJson === 'string' ? JSON.parse(a.answersJson) : a.answersJson) : [])
  };
}

function parseSheet(s: any): OfflineAnswerSheet {
  return {
    ...s,
    questionEvaluations: s.questionEvaluations || (s.questionEvaluationsJson ? (typeof s.questionEvaluationsJson === 'string' ? JSON.parse(s.questionEvaluationsJson) : s.questionEvaluationsJson) : [])
  };
}

function parseBook(b: any): BookSource {
  return {
    ...b,
    chapters: b.chapters || (b.chaptersJson ? (typeof b.chaptersJson === 'string' ? JSON.parse(b.chaptersJson) : b.chaptersJson) : [])
  };
}

export const ApiService = {
  // System Health & Diagnostics
  checkHealth: () => request<{ status: string; database: string; usersCount: number }>('/system/health'),
  resetSystem: () => request<{ status: string; message: string }>('/system/reset', { method: 'POST' }),
  getEmailConfig: () =>
    request<{
      host: string;
      port: number;
      username: string;
      hasPassword: boolean;
      configured: boolean;
    }>('/system/email-config'),
  saveEmailConfig: (config: {
    host: string;
    port: number;
    username: string;
    password?: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      configured: boolean;
      host: string;
      port: number;
      username: string;
    }>('/system/email-config', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  testEmailConnection: (toEmail: string) =>
    request<{ success: boolean; message: string }>('/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ toEmail })
    }),

  // Auth
  login: (role: UserRole, identifier: string, password?: string) =>
    request<{ success: boolean; message: string; user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, identifier, password })
    }),
  getMe: () => request<{ success: boolean; user: User; token?: string }>('/auth/me'),
  logout: () => request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),
  resetPassword: (identifier: string, newPassword: string, role?: string) =>
    request<{ success: boolean; message: string; user?: User }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, newPassword, role })
    }),
  resetAllPasswords: () =>
    request<{ success: boolean; message: string; count: number }>('/auth/reset-all-passwords', {
      method: 'POST'
    }),
  sendOtp: (identifier: string) =>
    request<{
      success: boolean;
      message: string;
      email?: string;
      maskedEmail?: string;
      name?: string;
      role?: string;
      userId?: string;
      sentViaSmtp?: boolean;
      devPreviewCode?: string;
    }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    }),
  verifyOtp: (identifier: string, otp: string) =>
    request<{ success: boolean; message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp })
    }),
  resetUserPassword: (userId: string, newPassword: string) =>
    request<{ success: boolean; message: string; user?: User }>(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  // Users
  getUsers: (role?: string) => request<User[]>(`/users${role ? `?role=${role}` : ''}`),
  getUserById: (id: string) => request<User>(`/users/${id}`),
  createUser: (user: Partial<User>) => request<User>('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: string, user: Partial<User>) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (id: string) => request<{ success: boolean; message: string }>(`/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id: string) => request<User>(`/users/${id}/status`, { method: 'PATCH' }),
  assignTeacherClassesAndSubjects: (teacherId: string, classIds: string[], subjectIds: string[]) =>
    request<User>(`/users/${teacherId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ classIds, subjectIds })
    }),

  // Classes
  getClasses: () => request<SchoolClass[]>('/classes'),
  createClass: (cls: Partial<SchoolClass>) => request<SchoolClass>('/classes', { method: 'POST', body: JSON.stringify(cls) }),
  updateClass: (id: string, cls: Partial<SchoolClass>) => request<SchoolClass>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(cls) }),
  deleteClass: (id: string) => request<void>(`/classes/${id}`, { method: 'DELETE' }),

  // Subjects & Chapters
  getSubjects: () => request<Subject[]>('/subjects'),
  createSubject: (subj: Partial<Subject>) => request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(subj) }),
  addChapter: (subjectId: string, chapter: Partial<Chapter>) =>
    request<Chapter>(`/subjects/${subjectId}/chapters`, { method: 'POST', body: JSON.stringify(chapter) }),

  // Books
  getBooks: async (subjectId?: string): Promise<BookSource[]> => {
    const list = await request<any[]>(`/books${subjectId ? `?subjectId=${subjectId}` : ''}`);
    return list.map(parseBook);
  },
  createBook: async (book: Partial<BookSource>): Promise<BookSource> => {
    const payload = {
      ...book,
      chaptersJson: book.chapters ? JSON.stringify(book.chapters) : '[]'
    };
    const saved = await request<any>('/books', { method: 'POST', body: JSON.stringify(payload) });
    return parseBook(saved);
  },

  // Assessments & Question Generation
  getAssessments: () => request<Assessment[]>('/assessments'),
  getAssessmentById: (id: string) => request<Assessment>(`/assessments/${id}`),
  createAssessment: (asm: Partial<Assessment>) => request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(asm) }),
  updateAssessment: (id: string, asm: Partial<Assessment>) => request<Assessment>(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(asm) }),
  deleteAssessment: (id: string) => request<void>(`/assessments/${id}`, { method: 'DELETE' }),
  generateSets: (assessmentId: string, count = 3) => request<QuestionPaperSet[]>(`/assessments/${assessmentId}/sets?count=${count}`),
  generateAIQuestions: (params: {
    subjectId: string;
    chapterId: string;
    questionTypes: QuestionType[];
    marks: number;
    difficulty: QuestionDifficulty;
    count: number;
    customPrompt?: string;
  }) => request<Question[]>('/assessments/generate-ai-questions', { method: 'POST', body: JSON.stringify(params) }),
  generateBookQuestions: (params: {
    bookId: string;
    chapterNumbers: number[];
    markDistribution: { marks: number; count: number }[];
    totalQuestions: number;
  }) => request<Question[]>('/assessments/generate-book-questions', { method: 'POST', body: JSON.stringify(params) }),

  // Exam Attempts & Malpractice
  getAttempts: async (params?: { studentId?: string; assessmentId?: string; classId?: string }): Promise<StudentExamAttempt[]> => {
    const q = new URLSearchParams(params as any).toString();
    const list = await request<any[]>(`/attempts${q ? `?${q}` : ''}`);
    return list.map(parseAttempt);
  },
  getAttemptById: async (id: string): Promise<StudentExamAttempt> => {
    const att = await request<any>(`/attempts/${id}`);
    return parseAttempt(att);
  },
  startAttempt: async (assessmentId: string, studentId: string): Promise<StudentExamAttempt> => {
    const att = await request<any>(`/attempts/start?assessmentId=${assessmentId}&studentId=${studentId}`, { method: 'POST' });
    return parseAttempt(att);
  },
  recordMalpractice: async (attemptId: string, type: MalpracticeLog['type'], description: string): Promise<StudentExamAttempt> => {
    const att = await request<any>(`/attempts/${attemptId}/malpractice`, {
      method: 'POST',
      body: JSON.stringify({ type, description })
    });
    return parseAttempt(att);
  },
  submitAttempt: async (attemptId: string, answers: { questionId: string; studentAnswer: string }[]): Promise<StudentExamAttempt> => {
    const att = await request<any>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
    return parseAttempt(att);
  },

  // Reattempt Requests
  getReattemptRequests: (params?: { studentId?: string; teacherId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<ReattemptRequest[]>(`/reattempts${q ? `?${q}` : ''}`);
  },
  submitReattemptRequest: (req: Partial<ReattemptRequest>) => request<ReattemptRequest>('/reattempts', { method: 'POST', body: JSON.stringify(req) }),
  resolveReattemptRequest: (requestId: string, status: 'approved' | 'rejected', paperMode?: 'same' | 'new_random') =>
    request<ReattemptRequest>(`/reattempts/${requestId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paperMode })
    }),

  // Offline Answer Sheets
  getOfflineSheets: async (assessmentId?: string): Promise<OfflineAnswerSheet[]> => {
    const list = await request<any[]>(`/offline-sheets${assessmentId ? `?assessmentId=${assessmentId}` : ''}`);
    return list.map(parseSheet);
  },
  uploadOfflineSheet: async (sheet: Partial<OfflineAnswerSheet>): Promise<OfflineAnswerSheet> => {
    const saved = await request<any>('/offline-sheets', { method: 'POST', body: JSON.stringify(sheet) });
    return parseSheet(saved);
  },
  evaluateOfflineSheet: async (sheetId: string): Promise<OfflineAnswerSheet> => {
    const updated = await request<any>(`/offline-sheets/${sheetId}/evaluate`, { method: 'POST' });
    return parseSheet(updated);
  },
  updateTeacherOfflineMarks: async (sheetId: string, questionEvaluations: OfflineAnswerSheet['questionEvaluations']): Promise<OfflineAnswerSheet> => {
    const updated = await request<any>(`/offline-sheets/${sheetId}/marks`, {
      method: 'PUT',
      body: JSON.stringify({ questionEvaluations })
    });
    return parseSheet(updated);
  },

  // Notifications
  getNotifications: (roleTarget?: string) => request<NotificationItem[]>(`/notifications${roleTarget ? `?roleTarget=${roleTarget}` : ''}`),
  markNotificationRead: (id: string) => request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<void>('/notifications/mark-all-read', { method: 'POST' })
};
