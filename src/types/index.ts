// User Roles
export type UserRole = 'principal' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  enrolmentNumber?: string; // For students
  assignedClassIds?: string[]; // For teachers
  assignedSubjectIds?: string[]; // For teachers
  classId?: string; // For students
  section?: string; // For students
  status: 'active' | 'inactive';
  password?: string;
  parentEmail?: string;
  parentPhone?: string;
  studentId?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  academicYear: string;
  studentCount?: number;
  subjectIds?: string[];
}

export interface Subject {
  id: string;
  name: string; // e.g. "Physics", "Mathematics"
  code: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  topics: string[];
  summary?: string;
  contentExcerpt?: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'key_in' | 'short_answer' | 'long_answer';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'olympiad';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  subjectId: string;
  chapterId: string;
  chapterNumber?: number;
  marks: number;
  difficulty: QuestionDifficulty;
  options?: QuestionOption[]; // For MCQ & True/False
  correctAnswerText?: string; // For Key-in, Short/Long answer
  explanation?: string;
  markingRubric?: string;
  source: 'manual' | 'book_upload' | 'ai_generated';
  approved?: boolean;
}

export type AssessmentMode = 'online' | 'offline';
export type AssessmentType = 'quiz' | 'exam' | 'unit_test' | 'term_exam';

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  subjectId: string;
  classIds: string[];
  mode: AssessmentMode;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  endDate: string;
  questions: Question[];
  targetStudentIds: string[]; // empty or 'all' = all students in class
  randomizeOrder: boolean;
  showAnswersAfterSubmission: boolean;
  instructions: string[];
  setsCount?: number; // for offline exams (e.g., 3 sets)
  status: 'draft' | 'published' | 'completed' | 'archived';
  createdByTeacherId: string;
  createdAt: string;
}

export interface QuestionPaperSet {
  setId: string;
  setName: string; // e.g. "Set A", "Set B", "Set C"
  assessmentId: string;
  assessmentTitle: string;
  subjectName: string;
  className: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  questions: Question[];
  answerKey: {
    questionNumber: number;
    questionId: string;
    correctAnswer: string;
    marks: number;
    explanation?: string;
    rubric?: string;
  }[];
}

export interface StudentExamAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  enrolmentNumber: string;
  classId: string;
  startTime: string;
  submitTime?: string;
  status: 'in_progress' | 'submitted' | 'malpractice_terminated' | 'evaluated';
  answers: {
    questionId: string;
    studentAnswer: string;
    isCorrect?: boolean;
    marksObtained?: number;
    evaluatedBy?: 'auto' | 'ai' | 'teacher';
    teacherComment?: string;
  }[];
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  malpracticeCount: number;
  malpracticeLogs: MalpracticeLog[];
  reattemptAllowed?: boolean;
  reattemptPaperMode?: 'same' | 'new_random';
  reattemptRequested?: boolean;
}

export interface MalpracticeLog {
  id: string;
  timestamp: string;
  type: 'tab_switch' | 'key_press' | 'mouse_leave' | 'fullscreen_exit' | 'copy_paste' | 'devtools';
  description: string;
  violationNumber: number;
}

export interface ReattemptRequest {
  id: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  enrolmentNumber: string;
  assessmentId: string;
  assessmentTitle: string;
  teacherId: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  paperMode?: 'same' | 'new_random';
}

export interface OfflineAnswerSheet {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  enrolmentNumber: string;
  classId: string;
  scannedImageUrl: string;
  uploadDate: string;
  evaluationStatus: 'pending' | 'ai_evaluated' | 'teacher_verified';
  questionEvaluations: {
    questionId: string;
    questionNumber: number;
    maxMarks: number;
    extractedText: string;
    aiProposedMarks: number;
    aiConfidence: number; // 0 - 100
    aiReasoning: string;
    teacherMarks: number;
    teacherFeedback?: string;
    isFlaggedForReview: boolean;
  }[];
  totalMarksAwarded: number;
  maxMarks: number;
  percentage: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  roleTarget?: UserRole;
  linkAction?: string;
}

export interface BookSource {
  id: string;
  title: string;
  subjectId: string;
  grade: string;
  author: string;
  coverImage?: string;
  chapters: {
    chapterNumber: number;
    title: string;
    pageRange: string;
    summary: string;
    sampleText: string;
  }[];
}
