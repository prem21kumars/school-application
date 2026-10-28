import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/api';
import type { 
  Assessment, 
  Question, 
  QuestionType, 
  QuestionDifficulty, 
  QuestionPaperSet 
} from '../../types';
import { 
  Sparkles, 
  BookOpen, 
  PenTool, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  Shuffle,
  X,
  Layers,
  UploadCloud,
  FileText,
  Copy,
  AlertCircle,
  Eye,
  Loader2,
  Zap,
  Key
} from 'lucide-react';

import { 
  processUploadedDocument, 
  processPastedBookCopy, 
  type ExtractedDocument 
} from '../../utils/documentExtractor';

import { GroqStorage, generateQuestionsWithGroq, testGroqApiKey } from '../../services/groqService';

import { FeedbackModal } from '../common/FeedbackModal';

interface QuestionPaperModalProps {
  onClose: () => void;
  onSaved: (assessment: Assessment) => void;
}

export const QuestionPaperModal: React.FC<QuestionPaperModalProps> = ({ onClose, onSaved }) => {
  const [warningModal, setWarningModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const { 
    currentUser, 
    classes, 
    subjects, 
    books, 
    createAssessment, 
    generateAIQuestions, 
    generateBookQuestions,
    addSubject,
    addClass,
    addChapterToSubject,
    addBook
  } = useApp();

  // Mode Selection: 'manual' | 'book_upload' | 'ai_generate'
  const [creationMethod, setCreationMethod] = useState<'manual' | 'book_upload' | 'ai_generate'>('ai_generate');

  // Form Basic Info
  const [title, setTitle] = useState('Comprehensive Assessment 2026');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'sub-phy');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classes[0]?.id || 'cls-10a']);
  const [examMode, setExamMode] = useState<'online' | 'offline'>('online');
  const [examType] = useState<Assessment['type']>('exam');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks] = useState(15);
  const [randomizeOrder, setRandomizeOrder] = useState(true);
  const [showAnswersAfterSubmission, setShowAnswersAfterSubmission] = useState(true);
  const [setsCount, setSetsCount] = useState(3);

  // Dynamic Add Field State across all dropdowns
  const [showInlineAddSubject, setShowInlineAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  const [showInlineAddClass, setShowInlineAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState('');

  const [showInlineAddChapter, setShowInlineAddChapter] = useState(false);
  const [newChapterNumber, setNewChapterNumber] = useState<number>(5);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTopics, setNewChapterTopics] = useState('');
  const [newChapterSummary, setNewChapterSummary] = useState('');

  const [showInlineAddBook, setShowInlineAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookGrade, setNewBookGrade] = useState('Grade 10');
  const [newBookInitialChapterTitle, setNewBookInitialChapterTitle] = useState('');

  // Questions List
  const [questions, setQuestions] = useState<Question[]>([]);

  // Manual Question Entry Form State
  const [manualText, setManualText] = useState('');
  const [manualType, setManualType] = useState<QuestionType>('mcq');
  const [manualChapterId, setManualChapterId] = useState('');
  const [manualMarks, setManualMarks] = useState(2);
  const [manualDifficulty, setManualDifficulty] = useState<QuestionDifficulty>('medium');
  const [manualOptions, setManualOptions] = useState([
    { id: '1', text: 'Option A', isCorrect: true },
    { id: '2', text: 'Option B', isCorrect: false },
    { id: '3', text: 'Option C', isCorrect: false },
    { id: '4', text: 'Option D', isCorrect: false }
  ]);
  const [manualCorrectText, setManualCorrectText] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualRubric, setManualRubric] = useState('');

  // AI Question Generation Form State
  const [aiChapterId, setAiChapterId] = useState('');
  const [aiQuestionTypes] = useState<QuestionType[]>(['mcq', 'short_answer', 'key_in']);
  const [aiMarks, setAiMarks] = useState(2);
  const [aiDifficulty, setAiDifficulty] = useState<QuestionDifficulty>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiMarkMode, setAiMarkMode] = useState<'distribution' | 'single'>('distribution');
  const [aiDist1m, setAiDist1m] = useState(2);
  const [aiDist2m, setAiDist2m] = useState(3);
  const [aiDist3m, setAiDist3m] = useState(2);
  const [aiDist4m, setAiDist4m] = useState(2);
  const [aiDist5m, setAiDist5m] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('Focus on real-world practical applications, numerical problem solving, and standard curriculum guidelines.');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [candidateAiQuestions, setCandidateAiQuestions] = useState<Question[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Book / Content Upload Form State
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || 'bk-phy-10');
  const [selectedChapterNumbers, setSelectedChapterNumbers] = useState<number[]>([1]);
  const [dist1m, setDist1m] = useState(3);
  const [dist2m, setDist2m] = useState(2);
  const [dist3m, setDist3m] = useState(2);
  const [dist4m, setDist4m] = useState(1);
  const [dist5m, setDist5m] = useState(1);
  const [dist10m, setDist10m] = useState(0);
  const [isBookGenerating, setIsBookGenerating] = useState(false);
  const [candidateBookQuestions, setCandidateBookQuestions] = useState<Question[]>([]);
  const [bookGenSuccess, setBookGenSuccess] = useState<string | null>(null);
  const [bookGenError, setBookGenError] = useState<string | null>(null);

  // Groq AI Integration State
  const [useGroqAi, setUseGroqAi] = useState(true);
  const [groqApiKeyInput, setGroqApiKeyInput] = useState(GroqStorage.getApiKey());
  const [groqModel, setGroqModel] = useState(GroqStorage.getModel());
  const [showGroqConfigModal, setShowGroqConfigModal] = useState(false);
  const [isTestingGroqKey, setIsTestingGroqKey] = useState(false);
  const [groqKeyFeedback, setGroqKeyFeedback] = useState<{ status: 'valid' | 'invalid'; message: string } | null>(null);

  // Document Upload (PDF, Word, Text) & Book Copy State
  const [docUploadMode, setDocUploadMode] = useState<'upload' | 'paste' | 'library'>('upload');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [uploadedDocMeta, setUploadedDocMeta] = useState<ExtractedDocument | null>(null);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedAuthor, setPastedAuthor] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sets & Print Preview State
  const [previewSets, setPreviewSets] = useState<QuestionPaperSet[] | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [showAnswerKeyInPrint, setShowAnswerKeyInPrint] = useState(false);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const currentBook = uploadedDocMeta 
    ? {
        id: selectedBookId || 'bk-uploaded',
        title: uploadedDocMeta.title,
        subjectId: selectedSubjectId,
        grade: uploadedDocMeta.grade || 'Grade 10',
        author: uploadedDocMeta.author || 'Uploaded Document',
        chapters: uploadedDocMeta.chapters
      }
    : (books.find(b => b.id === selectedBookId) || books[0]);

  const totalCalculatedMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  // Sync Groq AI config status from backend on mount
  useEffect(() => {
    ApiService.getGroqConfig()
      .then(cfg => {
        if (cfg && cfg.configured && cfg.model) {
          setGroqModel(cfg.model);
        }
      })
      .catch(() => {});
  }, []);

  // Handlers for Add Field across Dropdowns
  const handleSaveNewChapter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const num = newChapterNumber || ((currentSubject?.chapters.length || 0) + 1);
    const topics = newChapterTopics.split(',').map(t => t.trim()).filter(Boolean);
    const created = addChapterToSubject(selectedSubjectId, {
      number: num,
      title: newChapterTitle.trim(),
      topics: topics.length > 0 ? topics : ['Core Concept', 'Practical Applications', 'Numerical Analysis'],
      summary: newChapterSummary.trim() || `Curriculum topics for chapter ${num}.`,
      contentExcerpt: `Definitions and syllabus modules for ${newChapterTitle.trim()}.`
    });
    setAiChapterId(created.id);
    setManualChapterId(created.id);
    setShowInlineAddChapter(false);
    setNewChapterTitle('');
    setNewChapterTopics('');
    setNewChapterSummary('');
  };

  const handleSaveNewSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubName.trim()) return;
    const code = newSubCode.trim() || newSubName.slice(0, 3).toUpperCase() + '-101';
    const created = addSubject({ name: newSubName.trim(), code: code.toUpperCase() });
    setSelectedSubjectId(created.id);
    setShowInlineAddSubject(false);
    setNewSubName('');
    setNewSubCode('');
  };

  const handleSaveNewClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClassName.trim() || !newClassSection.trim()) return;
    addClass({
      name: newClassName.trim(),
      section: newClassSection.trim(),
      academicYear: '2026-2027',
      studentCount: 30,
      subjectIds: [selectedSubjectId]
    });
    setShowInlineAddClass(false);
    setNewClassName('');
    setNewClassSection('');
  };

  const handleSaveNewBook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBookTitle.trim()) return;
    const created = addBook({
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || 'Oakridge Academic Board',
      grade: newBookGrade.trim() || 'Grade 10',
      subjectId: selectedSubjectId,
      chapters: [
        {
          chapterNumber: 1,
          title: newBookInitialChapterTitle.trim() || 'Unit 1: Fundamentals & Theory',
          pageRange: 'pp. 1-45',
          summary: 'Core syllabus chapter introduction and formulas.',
          sampleText: `Text excerpt and standard exercises from ${newBookTitle.trim()}.`
        }
      ]
    });
    setSelectedBookId(created.id);
    setSelectedChapterNumbers([1]);
    setShowInlineAddBook(false);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookInitialChapterTitle('');
  };

  // Document File Upload Handler (PDF, Word, Text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileUploadError(null);

    try {
      const extracted = await processUploadedDocument(file);
      setUploadedDocMeta(extracted);

      const created = addBook({
        title: extracted.title,
        author: extracted.author || 'Uploaded Document',
        grade: extracted.grade || 'Grade 10',
        subjectId: selectedSubjectId,
        chapters: extracted.chapters
      });

      setSelectedBookId(created.id);
      setSelectedChapterNumbers(extracted.chapters.length > 0 ? [extracted.chapters[0].chapterNumber] : []);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setFileUploadError(err?.message || 'Failed to extract text from document. Please ensure it is a valid PDF, Word (.docx), or text file.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Pasted Book Copy / Text Handler
  const handleProcessPastedCopy = () => {
    if (!pastedText.trim()) return;
    setIsProcessingFile(true);
    setFileUploadError(null);

    try {
      const extracted = processPastedBookCopy(
        pastedTitle || 'Custom Syllabus Material',
        pastedText,
        pastedAuthor || 'Pasted Book Copy',
        'Grade 10'
      );
      setUploadedDocMeta(extracted);

      const created = addBook({
        title: extracted.title,
        author: extracted.author,
        grade: extracted.grade,
        subjectId: selectedSubjectId,
        chapters: extracted.chapters
      });

      setSelectedBookId(created.id);
      setSelectedChapterNumbers(extracted.chapters.length > 0 ? [extracted.chapters[0].chapterNumber] : []);
      setPastedText('');
      setPastedTitle('');
      setPastedAuthor('');
    } catch (err: any) {
      console.error('Pasted text extraction error:', err);
      setFileUploadError('Failed to process pasted text.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // AI Generation Counts & Totals
  const aiTotalCount = aiMarkMode === 'distribution'
    ? (aiDist1m + aiDist2m + aiDist3m + aiDist4m + aiDist5m)
    : aiCount;

  const aiTotalMarks = aiMarkMode === 'distribution'
    ? (aiDist1m * 1 + aiDist2m * 2 + aiDist3m * 3 + aiDist4m * 4 + aiDist5m * 5)
    : (aiMarks * aiCount);

  // AI Generation Handler
  const handleTriggerAIGeneration = async () => {
    if (aiTotalCount === 0) return;
    setIsAiGenerating(true);
    try {
      const markDistribution = [
        { marks: 1, count: aiDist1m },
        { marks: 2, count: aiDist2m },
        { marks: 3, count: aiDist3m },
        { marks: 4, count: aiDist4m },
        { marks: 5, count: aiDist5m }
      ].filter(d => d.count > 0);

      const generated = await generateAIQuestions({
        subjectId: selectedSubjectId,
        chapterId: aiChapterId || currentSubject.chapters[0]?.id || 'ch-phy-1',
        questionTypes: aiQuestionTypes,
        marks: aiMarks,
        difficulty: aiDifficulty,
        count: aiTotalCount,
        customPrompt: aiPrompt,
        markDistribution: aiMarkMode === 'distribution' ? markDistribution : [{ marks: aiMarks, count: aiCount }]
      });
      setCandidateAiQuestions(generated);
      // Pre-select all generated candidates so "Select All" / "Add All" is immediately ready
      setSelectedCandidateIds(generated.map(q => q.id));
    } finally {
      setIsAiGenerating(false);
    }
  };

  const isAllCandidatesSelected = candidateAiQuestions.length > 0 && selectedCandidateIds.length === candidateAiQuestions.length;

  const handleToggleSelectAllCandidates = () => {
    if (isAllCandidatesSelected) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidateAiQuestions.map(q => q.id));
    }
  };

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(candId => candId !== id) : [...prev, id]
    );
  };

  const handleApproveSelectedCandidates = () => {
    const toAdd = candidateAiQuestions.filter(q => selectedCandidateIds.includes(q.id));
    if (toAdd.length === 0) return;
    setQuestions(prev => [...prev, ...toAdd.map(q => ({ ...q, approved: true }))]);
    setCandidateAiQuestions(prev => prev.filter(q => !selectedCandidateIds.includes(q.id)));
    setSelectedCandidateIds([]);
  };

  const handleApproveAiQuestion = (q: Question) => {
    setQuestions(prev => [...prev, { ...q, approved: true }]);
    setCandidateAiQuestions(prev => prev.filter(cand => cand.id !== q.id));
    setSelectedCandidateIds(prev => prev.filter(id => id !== q.id));
  };

  const handleApproveAllAi = () => {
    setQuestions(prev => [...prev, ...candidateAiQuestions.map(q => ({ ...q, approved: true }))]);
    setCandidateAiQuestions([]);
    setSelectedCandidateIds([]);
  };

  const handleTestGroqKey = async () => {
    const trimmed = groqApiKeyInput.trim();
    if (!trimmed) {
      setGroqKeyFeedback({ status: 'invalid', message: 'Please enter a Groq API key (starts with gsk_).' });
      return;
    }
    setIsTestingGroqKey(true);
    setGroqKeyFeedback(null);
    try {
      const result = await testGroqApiKey(trimmed);
      if (result.valid) {
        setGroqKeyFeedback({ status: 'valid', message: '✓ Key is active and verified by Groq Cloud!' });
      } else {
        setGroqKeyFeedback({ status: 'invalid', message: `❌ Invalid Key: ${result.error || 'Rejected by Groq API'}` });
      }
    } catch (e: any) {
      setGroqKeyFeedback({ status: 'invalid', message: `❌ Connection error: ${e?.message || 'Failed to reach api.groq.com'}` });
    } finally {
      setIsTestingGroqKey(false);
    }
  };

  const handleSaveGroqConfig = async () => {
    const trimmed = groqApiKeyInput.trim();
    if (!trimmed) {
      setBookGenError('Please enter a valid Groq API key.');
      return;
    }

    setIsTestingGroqKey(true);
    const testResult = await testGroqApiKey(trimmed);
    setIsTestingGroqKey(false);

    if (!testResult.valid) {
      setGroqKeyFeedback({ status: 'invalid', message: `❌ Invalid Key: ${testResult.error || 'Please provide an active Groq API key.'}` });
      setBookGenError(`Groq API Key rejected: ${testResult.error || 'Invalid API Key'}`);
      return;
    }

    GroqStorage.setApiKey(trimmed);
    GroqStorage.setModel(groqModel);
    setGroqKeyFeedback({ status: 'valid', message: '✓ Key verified and saved!' });
    setBookGenError(null);
    setBookGenSuccess('⚡ Groq API Key verified & saved! Syncing with backend...');

    try {
      const res = await ApiService.saveGroqConfig({ apiKey: trimmed, model: groqModel });
      if (res && res.success) {
        setBookGenSuccess(`⚡ Groq AI Key synced to backend successfully! Model: ${res.model || groqModel}`);
      }
    } catch (e) {
      console.warn('Backend Groq sync notice:', e);
    }
    setShowGroqConfigModal(false);
  };

  // Book Generation Handler - Send directly to Groq AI in backend or local engine
  const handleTriggerBookGeneration = async () => {
    if (!uploadedDocMeta) {
      setBookGenError('Please upload a PDF or Word document first. Questions can only be generated from an uploaded document.');
      return;
    }

    const hasSpecificChapters = selectedChapterNumbers.length > 0;
    const chaptersToUse = hasSpecificChapters ? selectedChapterNumbers : uploadedDocMeta.chapters.map(c => c.chapterNumber);

    const markDistribution = [
      { marks: 1, count: dist1m },
      { marks: 2, count: dist2m },
      { marks: 3, count: dist3m },
      { marks: 4, count: dist4m },
      { marks: 5, count: dist5m },
      { marks: 10, count: dist10m }
    ].filter(d => d.count > 0);

    const totalCount = dist1m + dist2m + dist3m + dist4m + dist5m + dist10m;
    if (totalCount === 0) {
      setBookGenError('Please set at least 1 question count in the marks distribution.');
      return;
    }

    const effectiveGroqKey = groqApiKeyInput.trim() || GroqStorage.getApiKey();

    // If teacher selected Groq AI but has no key configured yet
    if (useGroqAi && !effectiveGroqKey) {
      setShowGroqConfigModal(true);
      setBookGenError('Please enter your Groq API Key below to generate questions with Groq AI.');
      return;
    }

    if (useGroqAi && effectiveGroqKey) {
      GroqStorage.setApiKey(effectiveGroqKey);
      GroqStorage.setModel(groqModel);
      // Sync key to backend database
      ApiService.saveGroqConfig({ apiKey: effectiveGroqKey, model: groqModel }).catch(() => {});
    }

    setIsBookGenerating(true);
    setBookGenError(null);
    setBookGenSuccess(null);

    try {
      // STRICT FILTER: ONLY chapters explicitly selected by the teacher
      const filteredChapters = uploadedDocMeta.chapters.filter(c => chaptersToUse.includes(c.chapterNumber));

      if (filteredChapters.length === 0) {
        throw new Error('Please select at least one valid chapter from the uploaded document.');
      }

      let generated: Question[] = [];

      if (useGroqAi) {
        if (!effectiveGroqKey || effectiveGroqKey.trim().length === 0) {
          throw new Error('Groq API Key is required for AI question generation. Please configure your Groq API key in the panel above, or uncheck "Use Groq AI" to generate offline questions.');
        }

        const targetChapter = filteredChapters[0];
        const chapterExcerpt = filteredChapters
          .map(c => `=== CHAPTER ${c.chapterNumber}: ${c.title} ===\n${(c as any).fullText || c.sampleText || c.summary}`)
          .join('\n\n\n') || uploadedDocMeta.rawText.slice(0, 18000);

        const chapterHeading = filteredChapters.length === 1 
          ? targetChapter.title 
          : filteredChapters.map(c => `Ch ${c.chapterNumber}: ${c.title}`).join(' | ');

        try {
          generated = await generateQuestionsWithGroq({
            apiKey: effectiveGroqKey,
            model: groqModel,
            documentTitle: uploadedDocMeta.title,
            chapterNumber: targetChapter.chapterNumber,
            chapterTitle: chapterHeading,
            documentExcerpt: chapterExcerpt,
            markDistribution,
            subjectId: selectedSubjectId,
            difficulty: 'medium'
          });
        } catch (directErr: any) {
          console.error('Direct Groq AI generation error:', directErr);
          throw new Error(`Groq AI Question Generation Failed: ${directErr?.message || 'Check your Groq API key and network connection.'}`);
        }
      } else {
        generated = await generateBookQuestions({
          bookId: selectedBookId,
          chapterNumbers: chaptersToUse,
          markDistribution,
          totalQuestions: totalCount,
          chapters: filteredChapters,
          subjectId: selectedSubjectId,
          bookTitle: uploadedDocMeta.title
        });
      }

      if (!generated || generated.length === 0) {
        throw new Error('No questions could be generated. Please verify mark distribution.');
      }

      // Clean replacement of manifest questions: prevents accumulating duplicates across generations
      setQuestions(generated.map(q => ({ ...q, approved: true })));
      setCandidateBookQuestions(generated);

      const totalMarks = generated.reduce((s, q) => s + q.marks, 0);
      const chLabel = selectedChapterNumbers.length === 1 
        ? `Ch ${selectedChapterNumbers[0]}` 
        : `Chapters ${selectedChapterNumbers.join(', ')}`;
      const aiProvider = useGroqAi ? `Groq AI (${groqModel})` : 'Local Engine';
      setBookGenSuccess(`⚡ Successfully generated ${generated.length} distinct questions (${totalMarks} Marks) via ${aiProvider} strictly from ${chLabel} of "${uploadedDocMeta.title}" and loaded into Paper Manifest!`);
    } catch (err: any) {
      console.error('Book question generation error:', err);
      const isApiKeyErr = /api key|401|unauthorized/i.test(err?.message || '');
      if (isApiKeyErr) {
        setShowGroqConfigModal(true);
        setGroqKeyFeedback({ 
          status: 'invalid', 
          message: '❌ Groq rejected your API key ("Invalid API Key"). Please update it with a valid key starting with gsk_ from console.groq.com.' 
        });
        setBookGenError('Invalid Groq API Key: Please update your Groq key below or uncheck "Use Groq AI" to generate offline.');
      } else {
        setBookGenError(err?.message || 'Failed to generate questions with Groq AI. Please check your API key.');
      }
    } finally {
      setIsBookGenerating(false);
    }
  };

  // Manual Add Question Handler
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText) return;

    const newQ: Question = {
      id: `man-q-${Date.now()}`,
      text: manualText,
      type: manualType,
      subjectId: selectedSubjectId,
      chapterId: manualChapterId || currentSubject.chapters[0]?.id || 'ch-phy-1',
      marks: manualMarks,
      difficulty: manualDifficulty,
      source: 'manual',
      approved: true,
      options: (manualType === 'mcq' || manualType === 'true_false') ? manualOptions : undefined,
      correctAnswerText: (manualType !== 'mcq' && manualType !== 'true_false') ? manualCorrectText : undefined,
      explanation: manualExplanation,
      markingRubric: manualRubric
    };

    setQuestions(prev => [...prev, newQ]);
    setManualText('');
    setManualCorrectText('');
    setManualExplanation('');
    setManualRubric('');
  };

  // Generate Multi-Set Preview (Offline)
  const handlePreviewSets = () => {
    if (questions.length < 2) {
      setWarningModal({
        title: 'Minimum Questions Required',
        message: 'Please add at least 2 questions to generate randomized multi-set examination papers.'
      });
      return;
    }

    const tempAssessment: Assessment = {
      id: `temp-${Date.now()}`,
      title,
      type: examType,
      subjectId: selectedSubjectId,
      classIds: selectedClassIds,
      mode: examMode,
      durationMinutes,
      totalMarks: totalCalculatedMarks || 25,
      passingMarks,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      questions,
      targetStudentIds: [],
      randomizeOrder,
      showAnswersAfterSubmission,
      instructions: [
        'Write Enrolment Number and Set Code on top of the answer booklet.',
        'All questions are compulsory.',
        'Calculators and digital devices are strictly prohibited.'
      ],
      setsCount,
      status: 'published',
      createdByTeacherId: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const setNames = ['Set A', 'Set B', 'Set C', 'Set D', 'Set E'];
    const generatedSets: QuestionPaperSet[] = [];

    for (let i = 0; i < setsCount; i++) {
      let qList = [...questions];
      if (randomizeOrder) {
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

      generatedSets.push({
        setId: `set-${i + 1}`,
        setName: setNames[i % setNames.length],
        assessmentId: tempAssessment.id,
        assessmentTitle: title,
        subjectName: currentSubject.name,
        className: 'Grade 10',
        durationMinutes,
        totalMarks: totalCalculatedMarks || 25,
        instructions: tempAssessment.instructions,
        questions: qList,
        answerKey
      });
    }

    setPreviewSets(generatedSets);
  };

  // Final Save Assessment
  const handleFinalPublish = () => {
    if (questions.length === 0) {
      setWarningModal({
        title: 'Questions Required',
        message: 'Please generate or author at least one question before publishing the assessment.'
      });
      return;
    }

    const createdAssessment = createAssessment({
      title,
      type: examType,
      subjectId: selectedSubjectId,
      classIds: selectedClassIds,
      mode: examMode,
      durationMinutes,
      totalMarks: totalCalculatedMarks || 25,
      passingMarks,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      questions,
      targetStudentIds: [],
      randomizeOrder,
      showAnswersAfterSubmission,
      instructions: [
        'Read all instructions carefully before starting.',
        'Malpractice monitoring is enabled: Tab switches, copy-paste, and key presses are recorded.',
        'Exam auto-terminates upon 3rd malpractice strike.',
        'Ensure uninterrupted internet connection.'
      ],
      setsCount: examMode === 'offline' ? setsCount : undefined,
      status: 'published',
      createdByTeacherId: currentUser.id
    });

    onSaved(createdAssessment);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content-card modal-animate" 
        style={{ 
          width: '1360px', 
          maxWidth: '98vw', 
          height: '92vh', 
          maxHeight: '940px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '1.25rem',
          boxShadow: '0 30px 70px -15px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden'
        }}
      >
        
        {/* Modal Header */}
        <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ padding: '0.55rem', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', borderRadius: '0.75rem', color: '#4f46e5', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Question Paper Generator & Assessment Hub
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}>
                  Curriculum Engine (7.4)
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Manual Authoring • Digital Textbook Extraction • AI Generation with Bloom's Taxonomy • Offline Multi-Sets
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748b', 
              cursor: 'pointer',
              transition: 'all 0.15s ease' 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: 3-Column Responsive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(460px, 1fr) 350px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* Column 1: Config & Method Selector */}
          <div style={{ background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Method Picker */}
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, letterSpacing: '0.06em', color: '#4f46e5', textTransform: 'uppercase' }}>
                1. Creation Method
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                
                <button 
                  type="button"
                  onClick={() => setCreationMethod('ai_generate')}
                  style={{ 
                    padding: '0.75rem 0.875rem', 
                    borderRadius: '0.625rem', 
                    background: creationMethod === 'ai_generate' ? '#eef2ff' : '#ffffff', 
                    border: `1.5px solid ${creationMethod === 'ai_generate' ? '#4f46e5' : '#e2e8f0'}`,
                    color: creationMethod === 'ai_generate' ? '#4f46e5' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    boxShadow: creationMethod === 'ai_generate' ? '0 2px 8px rgba(79, 70, 229, 0.12)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: creationMethod === 'ai_generate' ? '#4f46e5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: creationMethod === 'ai_generate' ? '#ffffff' : '#64748b' }}>
                    <Sparkles size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>AI Question Generator</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Curriculum & Bloom's taxonomy</div>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setCreationMethod('book_upload')}
                  style={{ 
                    padding: '0.75rem 0.875rem', 
                    borderRadius: '0.625rem', 
                    background: creationMethod === 'book_upload' ? '#faf5ff' : '#ffffff', 
                    border: `1.5px solid ${creationMethod === 'book_upload' ? '#7c3aed' : '#e2e8f0'}`,
                    color: creationMethod === 'book_upload' ? '#7c3aed' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    boxShadow: creationMethod === 'book_upload' ? '0 2px 8px rgba(124, 58, 237, 0.12)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: creationMethod === 'book_upload' ? '#7c3aed' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: creationMethod === 'book_upload' ? '#ffffff' : '#64748b' }}>
                    <BookOpen size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Upload PDF / Word / Book</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Extract & generate from document</div>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setCreationMethod('manual')}
                  style={{ 
                    padding: '0.75rem 0.875rem', 
                    borderRadius: '0.625rem', 
                    background: creationMethod === 'manual' ? '#ecfdf5' : '#ffffff', 
                    border: `1.5px solid ${creationMethod === 'manual' ? '#059669' : '#e2e8f0'}`,
                    color: creationMethod === 'manual' ? '#059669' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    boxShadow: creationMethod === 'manual' ? '0 2px 8px rgba(5, 150, 105, 0.12)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: creationMethod === 'manual' ? '#059669' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: creationMethod === 'manual' ? '#ffffff' : '#64748b' }}>
                    <PenTool size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Manual Authoring</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Custom questions & rubrics</div>
                  </div>
                </button>

              </div>
            </div>

            {/* Assessment Meta Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, letterSpacing: '0.06em', color: '#4f46e5', textTransform: 'uppercase' }}>
                2. Assessment Details
              </span>
              
              <div>
                <label className="form-label" style={{ marginBottom: '0.35rem' }}>Paper Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="form-input" 
                  placeholder="e.g. Comprehensive Assessment 2026"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '22px', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Subject</label>
                  <button 
                    type="button" 
                    onClick={() => setShowInlineAddSubject(!showInlineAddSubject)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Plus size={12} /> {showInlineAddSubject ? 'Cancel' : 'Add Subject'}
                  </button>
                </div>
                <select 
                  value={selectedSubjectId} 
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowInlineAddSubject(true);
                    } else {
                      setSelectedSubjectId(e.target.value);
                      setShowInlineAddSubject(false);
                    }
                  }}
                  className="form-select"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 700, color: '#4f46e5' }}>➕ Add New Subject...</option>
                </select>

                {showInlineAddSubject && (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}>Register New Subject</div>
                    <input type="text" placeholder="Subject Name (e.g. Economics)" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <input type="text" placeholder="Code (e.g. ECO-105)" value={newSubCode} onChange={e => setNewSubCode(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowInlineAddSubject(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>Cancel</button>
                      <button type="button" onClick={() => handleSaveNewSubject()} className="btn-primary btn-sm" style={{ fontSize: '0.7rem' }}>Save Subject</button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '22px', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Target Class</label>
                  <button 
                    type="button" 
                    onClick={() => setShowInlineAddClass(!showInlineAddClass)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Plus size={12} /> {showInlineAddClass ? 'Cancel' : 'Add Class'}
                  </button>
                </div>
                <select 
                  value={selectedClassIds[0]} 
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowInlineAddClass(true);
                    } else {
                      setSelectedClassIds([e.target.value]);
                      setShowInlineAddClass(false);
                    }
                  }}
                  className="form-select"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 700, color: '#4f46e5' }}>➕ Add New Class Division...</option>
                </select>

                {showInlineAddClass && (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}>Add New Class Division</div>
                    <input type="text" placeholder="Class Name (e.g. Grade 12)" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <input type="text" placeholder="Section (e.g. Science-C)" value={newClassSection} onChange={e => setNewClassSection(e.target.value)} className="form-input" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowInlineAddClass(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>Cancel</button>
                      <button type="button" onClick={() => handleSaveNewClass()} className="btn-primary btn-sm" style={{ fontSize: '0.7rem' }}>Save Class</button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '0.625rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>Exam Mode</label>
                  <select 
                    value={examMode} 
                    onChange={(e) => setExamMode(e.target.value as 'online' | 'offline')}
                    className="form-select"
                  >
                    <option value="online">Online CBT</option>
                    <option value="offline">Offline Print</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>Duration (Min)</label>
                  <input 
                    type="number" 
                    value={durationMinutes} 
                    onChange={(e) => setDurationMinutes(Number(e.target.value))} 
                    className="form-input" 
                  />
                </div>
              </div>

              {examMode === 'offline' && (
                <div>
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>Randomized Multi-Sets Count</label>
                  <select 
                    value={setsCount} 
                    onChange={(e) => setSetsCount(Number(e.target.value))}
                    className="form-select"
                  >
                    <option value={2}>2 Sets (Set A, Set B)</option>
                    <option value={3}>3 Sets (Set A, Set B, Set C)</option>
                    <option value={4}>4 Sets (Set A, Set B, Set C, Set D)</option>
                  </select>
                </div>
              )}

              {/* Assessment Feature Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '0.5rem', 
                    background: randomizeOrder ? '#eef2ff' : '#ffffff', 
                    border: `1px solid ${randomizeOrder ? '#c7d2fe' : '#e2e8f0'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={randomizeOrder} 
                    onChange={(e) => setRandomizeOrder(e.target.checked)} 
                    style={{ accentColor: '#4f46e5', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Randomize Question Order</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Shuffle order for anti-cheating (7.7)</span>
                  </div>
                </label>

                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.625rem', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '0.5rem', 
                    background: showAnswersAfterSubmission ? '#ecfdf5' : '#ffffff', 
                    border: `1px solid ${showAnswersAfterSubmission ? '#a7f3d0' : '#e2e8f0'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={showAnswersAfterSubmission} 
                    onChange={(e) => setShowAnswersAfterSubmission(e.target.checked)} 
                    style={{ accentColor: '#059669', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Show Answer Key on Submit</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Instant solutions for students</span>
                  </div>
                </label>
              </div>

            </div>

          </div>

          {/* Column 2: Generator Workbench */}
          <div style={{ padding: '1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff' }}>
            
            {/* WORKBENCH A: AI GENERATION */}
            {creationMethod === 'ai_generate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ padding: '0.4rem', background: '#eef2ff', borderRadius: '0.5rem', color: '#4f46e5' }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        AI-Assisted Question Generator
                      </h3>
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        Curriculum Aligned with Bloom's Taxonomy Guidelines (7.4.3)
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    Gemini AI Model
                  </span>
                </div>

                {/* Row 1: Chapter and Difficulty with Pixel-Perfect Height Alignment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Syllabus Chapter</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewChapterNumber((currentSubject?.chapters.length || 0) + 1);
                          setShowInlineAddChapter(!showInlineAddChapter);
                        }}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Plus size={12} /> {showInlineAddChapter ? 'Cancel' : 'Add Chapter'}
                      </button>
                    </div>
                    <select 
                      value={aiChapterId} 
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setNewChapterNumber((currentSubject?.chapters.length || 0) + 1);
                          setShowInlineAddChapter(true);
                        } else {
                          setAiChapterId(e.target.value);
                          setShowInlineAddChapter(false);
                        }
                      }}
                      className="form-select"
                    >
                      {currentSubject.chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.title}</option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: 700, color: '#4f46e5' }}>
                        ➕ Add New Chapter...
                      </option>
                    </select>

                    {showInlineAddChapter && (
                      <div style={{ background: '#f5f3ff', border: '1.5px dashed #a855f7', borderRadius: '0.625rem', padding: '1rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#6b21a8' }}>
                            ✨ Register Chapter for {currentSubject.name}
                          </span>
                          <span className="badge badge-purple">Chapter #{newChapterNumber || ((currentSubject?.chapters.length || 0) + 1)}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Ch #</label>
                            <input 
                              type="number" 
                              value={newChapterNumber} 
                              onChange={e => setNewChapterNumber(Number(e.target.value))}
                              className="form-input"
                              style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Chapter Title *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Sources of Energy & Environmental Physics" 
                              value={newChapterTitle} 
                              onChange={e => setNewChapterTitle(e.target.value)}
                              className="form-input"
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Key Topics (Comma separated)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Solar Energy, Biogas, Hydroelectric Power, Nuclear Fission" 
                            value={newChapterTopics} 
                            onChange={e => setNewChapterTopics(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button type="button" onClick={() => setShowInlineAddChapter(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
                            Cancel
                          </button>
                          <button type="button" onClick={() => handleSaveNewChapter()} className="btn-primary btn-sm" style={{ background: '#7c3aed', borderColor: '#7c3aed', fontSize: '0.7rem' }}>
                            <CheckCircle2 size={13} /> Save & Select Chapter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Cognitive Difficulty</label>
                    </div>
                    <select 
                      value={aiDifficulty} 
                      onChange={(e) => setAiDifficulty(e.target.value as QuestionDifficulty)}
                      className="form-select"
                    >
                      <option value="easy">Easy (Recall & Definition)</option>
                      <option value="medium">Medium (Application & Numericals)</option>
                      <option value="hard">Hard (Synthesis & HOTs)</option>
                      <option value="olympiad">Olympiad / Advanced Reasoning</option>
                    </select>
                  </div>
                </div>

                {/* Mark Selection & Distribution Controls */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                  {/* Mode Toggle Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Configure Question Marks & Count</span>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        {aiTotalCount} Questions ({aiTotalMarks} Marks)
                      </span>
                    </div>

                    {/* Mode Tabs */}
                    <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '0.5rem', padding: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setAiMarkMode('distribution')}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: aiMarkMode === 'distribution' ? '#ffffff' : 'transparent',
                          color: aiMarkMode === 'distribution' ? '#4f46e5' : '#64748b',
                          boxShadow: aiMarkMode === 'distribution' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🎛️ Multi-Mark Distribution (2M, 3M, 4M, 5M)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiMarkMode('single')}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: aiMarkMode === 'single' ? '#ffffff' : 'transparent',
                          color: aiMarkMode === 'single' ? '#4f46e5' : '#64748b',
                          boxShadow: aiMarkMode === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🎯 Single Mark Per Question
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Multi-Mark Distribution */}
                  {aiMarkMode === 'distribution' && (
                    <div>
                      {/* Quick Presets */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                        <button
                          type="button"
                          onClick={() => { setAiDist1m(2); setAiDist2m(3); setAiDist3m(2); setAiDist4m(1); setAiDist5m(1); }}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', color: '#334155' }}
                        >
                          Standard 25M Paper
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiDist1m(0); setAiDist2m(4); setAiDist3m(3); setAiDist4m(0); setAiDist5m(0); }}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', color: '#334155' }}
                        >
                          2M & 3M Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiDist1m(0); setAiDist2m(0); setAiDist3m(2); setAiDist4m(2); setAiDist5m(2); }}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', color: '#334155' }}
                        >
                          3M, 4M & 5M Higher Marks
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiDist1m(0); setAiDist2m(0); setAiDist3m(0); setAiDist4m(0); setAiDist5m(0); }}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', color: '#ef4444' }}
                        >
                          Clear All
                        </button>
                      </div>

                      {/* 5 Mark Breakdown Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        {/* 1 Mark */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${aiDist1m > 0 ? '#818cf8' : '#e2e8f0'}`, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>1 Mark</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>MCQ / Obj</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setAiDist1m(prev => Math.max(0, prev - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={aiDist1m}
                              onChange={(e) => setAiDist1m(Math.max(0, Number(e.target.value)))}
                              className="form-input"
                              style={{ textAlign: 'center', padding: '0.25rem 0.35rem', fontSize: '0.875rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => setAiDist1m(prev => Math.min(20, prev + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                            {aiDist1m * 1} marks
                          </div>
                        </div>

                        {/* 2 Marks */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${aiDist2m > 0 ? '#818cf8' : '#e2e8f0'}`, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>2 Marks</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Short Concept</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setAiDist2m(prev => Math.max(0, prev - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={aiDist2m}
                              onChange={(e) => setAiDist2m(Math.max(0, Number(e.target.value)))}
                              className="form-input"
                              style={{ textAlign: 'center', padding: '0.25rem 0.35rem', fontSize: '0.875rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => setAiDist2m(prev => Math.min(20, prev + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                            {aiDist2m * 2} marks
                          </div>
                        </div>

                        {/* 3 Marks */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${aiDist3m > 0 ? '#818cf8' : '#e2e8f0'}`, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>3 Marks</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Numerical</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setAiDist3m(prev => Math.max(0, prev - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={aiDist3m}
                              onChange={(e) => setAiDist3m(Math.max(0, Number(e.target.value)))}
                              className="form-input"
                              style={{ textAlign: 'center', padding: '0.25rem 0.35rem', fontSize: '0.875rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => setAiDist3m(prev => Math.min(20, prev + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                            {aiDist3m * 3} marks
                          </div>
                        </div>

                        {/* 4 Marks */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${aiDist4m > 0 ? '#818cf8' : '#e2e8f0'}`, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>4 Marks</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Applied Prob</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setAiDist4m(prev => Math.max(0, prev - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={aiDist4m}
                              onChange={(e) => setAiDist4m(Math.max(0, Number(e.target.value)))}
                              className="form-input"
                              style={{ textAlign: 'center', padding: '0.25rem 0.35rem', fontSize: '0.875rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => setAiDist4m(prev => Math.min(20, prev + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                            {aiDist4m * 4} marks
                          </div>
                        </div>

                        {/* 5 Marks */}
                        <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${aiDist5m > 0 ? '#818cf8' : '#e2e8f0'}`, textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>5 Marks</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Long Deriv</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setAiDist5m(prev => Math.max(0, prev - 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={aiDist5m}
                              onChange={(e) => setAiDist5m(Math.max(0, Number(e.target.value)))}
                              className="form-input"
                              style={{ textAlign: 'center', padding: '0.25rem 0.35rem', fontSize: '0.875rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => setAiDist5m(prev => Math.min(20, prev + 1))}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>
                            {aiDist5m * 5} marks
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Single Mark */}
                  {aiMarkMode === 'single' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', height: '24px', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Marks Per Question</label>
                        </div>
                        <select 
                          value={aiMarks} 
                          onChange={(e) => setAiMarks(Number(e.target.value))}
                          className="form-select"
                        >
                          <option value={1}>1 Mark (Objective / MCQ)</option>
                          <option value={2}>2 Marks (Short Concept)</option>
                          <option value={3}>3 Marks (Numerical Calculation / Reasoning)</option>
                          <option value={4}>4 Marks (Applied Problem / Analysis)</option>
                          <option value={5}>5 Marks (Long Derivation / Essay)</option>
                          <option value={10}>10 Marks (Comprehensive Section)</option>
                        </select>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', height: '24px', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Candidate Count to Generate</label>
                        </div>
                        <input 
                          type="number" 
                          min={1} 
                          max={20} 
                          value={aiCount} 
                          onChange={(e) => setAiCount(Number(e.target.value))}
                          className="form-input" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt Guidance with Quick Keyword Chips */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>AI Prompt Guidance / Specific Topics</label>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Custom Context Guidance</span>
                  </div>
                  <textarea 
                    rows={2} 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="form-textarea"
                    placeholder="Provide specific instructions, e.g. include real-world practical applications, numerical problem solving..."
                    style={{ lineHeight: 1.45 }}
                  />
                  
                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {[
                      'Real-world practical applications',
                      'Numerical problem solving',
                      'Derivation & core principles',
                      'Case-study reasoning'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (!aiPrompt.includes(chip)) {
                            setAiPrompt(prev => prev ? `${prev}, ${chip}` : chip);
                          }
                        }}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          borderRadius: '9999px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.72rem',
                          color: '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.color = '#4338ca'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button Container */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                  <button 
                    type="button"
                    onClick={handleTriggerAIGeneration} 
                    disabled={isAiGenerating || aiTotalCount === 0} 
                    className="btn-primary"
                    style={{ 
                      padding: '0.75rem 1.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700,
                      background: isAiGenerating || aiTotalCount === 0 ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      boxShadow: isAiGenerating || aiTotalCount === 0 ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)',
                      cursor: isAiGenerating || aiTotalCount === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Sparkles size={16} />
                    {isAiGenerating 
                      ? 'Generating Candidate Questions...' 
                      : `Generate ${aiTotalCount} Candidate Questions (${aiTotalMarks} Marks)`}
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {aiTotalCount === 0 ? 'Set at least 1 question to generate' : 'Review and cherry-pick candidate questions below'}
                  </span>
                </div>

                {/* Candidate Questions Review Shelf */}
                {candidateAiQuestions.length > 0 && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                    
                    {/* Header with Title and Overall Count */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                          Candidate Questions Generated ({candidateAiQuestions.length})
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          Approval Required (BR-05)
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Select questions you need or approve all
                      </span>
                    </div>

                    {/* Multi-Select Toolbar */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '0.875rem', 
                      padding: '0.625rem 0.875rem', 
                      background: '#f8fafc', 
                      borderRadius: '0.625rem', 
                      border: '1.5px solid #e2e8f0', 
                      flexWrap: 'wrap', 
                      gap: '0.75rem' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
                          <input 
                            type="checkbox"
                            checked={isAllCandidatesSelected}
                            onChange={handleToggleSelectAllCandidates}
                            style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                          />
                          <span>Select All Questions ({candidateAiQuestions.length})</span>
                        </label>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', borderLeft: '1px solid #cbd5e1', paddingLeft: '0.75rem' }}>
                          <strong style={{ color: selectedCandidateIds.length > 0 ? '#4f46e5' : '#64748b' }}>{selectedCandidateIds.length}</strong> of {candidateAiQuestions.length} selected
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                          type="button"
                          onClick={handleApproveSelectedCandidates}
                          disabled={selectedCandidateIds.length === 0}
                          className="btn-success btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            fontWeight: 700,
                            fontSize: '0.775rem',
                            background: selectedCandidateIds.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            color: '#ffffff',
                            cursor: selectedCandidateIds.length === 0 ? 'not-allowed' : 'pointer',
                            boxShadow: selectedCandidateIds.length === 0 ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <CheckCircle2 size={14} /> Add Selected ({selectedCandidateIds.length}) to Paper
                        </button>

                        <button 
                          type="button"
                          onClick={handleApproveAllAi} 
                          className="btn-secondary btn-sm"
                          style={{
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            padding: '0.45rem 0.75rem'
                          }}
                        >
                          Approve All ({candidateAiQuestions.length})
                        </button>
                      </div>
                    </div>

                    {/* Candidate List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {candidateAiQuestions.map((cand) => {
                        const isSelected = selectedCandidateIds.includes(cand.id);
                        return (
                          <div 
                            key={cand.id} 
                            style={{ 
                              background: isSelected ? '#ffffff' : '#f8fafc', 
                              border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`, 
                              borderRadius: '0.625rem', 
                              padding: '1rem',
                              boxShadow: isSelected ? '0 3px 12px rgba(79, 70, 229, 0.12)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleCandidate(cand.id)}
                                    style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#4f46e5' : '#64748b' }}>
                                    {isSelected ? 'Selected' : 'Select'}
                                  </span>
                                </label>
                                <span className="badge badge-primary">{cand.type.toUpperCase()}</span>
                                <span className="badge badge-purple">{cand.marks} Marks</span>
                                <span className="badge badge-cyan">{cand.difficulty}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleApproveAiQuestion(cand)}
                                className="btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.65rem'
                                }}
                              >
                                <Plus size={13} /> Add Single
                              </button>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, margin: '0.5rem 0', lineHeight: 1.4 }}>
                              {cand.text}
                            </p>
                            {cand.explanation && (
                              <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                                Rationale: {cand.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WORKBENCH B: DIGITAL TEXTBOOK / PDF / WORD / BOOK COPY EXTRACTION */}
            {creationMethod === 'book_upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header & Source Mode Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} color="#7c3aed" />
                    <div>
                      <h3 style={{ fontSize: '1.125rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                        PDF, Word & Book Document Question Generator (7.4.2)
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Upload curriculum documents (PDF, DOCX) or paste book copy to automatically extract chapters & generate questions
                      </div>
                    </div>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div style={{ display: 'inline-flex', background: '#f3e8ff', borderRadius: '0.5rem', padding: '3px' }}>
                    <button
                      type="button"
                      onClick={() => setDocUploadMode('upload')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: docUploadMode === 'upload' ? '#7c3aed' : 'transparent',
                        color: docUploadMode === 'upload' ? '#ffffff' : '#7c3aed',
                        boxShadow: docUploadMode === 'upload' ? '0 1px 4px rgba(124, 58, 237, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <UploadCloud size={14} /> Upload PDF / Word
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocUploadMode('paste')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: docUploadMode === 'paste' ? '#7c3aed' : 'transparent',
                        color: docUploadMode === 'paste' ? '#ffffff' : '#7c3aed',
                        boxShadow: docUploadMode === 'paste' ? '0 1px 4px rgba(124, 58, 237, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Copy size={14} /> Paste Book Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocUploadMode('library')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: docUploadMode === 'library' ? '#7c3aed' : 'transparent',
                        color: docUploadMode === 'library' ? '#ffffff' : '#7c3aed',
                        boxShadow: docUploadMode === 'library' ? '0 1px 4px rgba(124, 58, 237, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <BookOpen size={14} /> Library Books
                    </button>
                  </div>
                </div>

                {/* MODE 1: FILE UPLOAD (PDF, Word, Text) */}
                {docUploadMode === 'upload' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".pdf,.docx,.doc,.txt,.rtf" 
                      style={{ display: 'none' }} 
                    />

                    {/* Drag and Drop Zone */}
                    <div 
                      onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                      style={{ 
                        border: '2px dashed #c084fc', 
                        borderRadius: '0.75rem', 
                        padding: '1.75rem 1.5rem', 
                        textAlign: 'center', 
                        background: '#faf5ff',
                        cursor: isProcessingFile ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isProcessingFile ? (
                        <>
                          <Loader2 size={36} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#6b21a8' }}>
                            Extracting text and detecting chapters from document...
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
                            Parsing PDF / Word structure, reading syllabus modules and exercises
                          </span>
                        </>
                      ) : (
                        <>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                            <UploadCloud size={24} color="#7c3aed" />
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                            Click to upload or drag & drop your PDF or Word document
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c' }}>📄 PDF</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8' }}>📝 Word (.docx)</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>📋 Plain Text (.txt)</span>
                          </div>
                          <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                            AI automatically extracts book chapters, syllabus topics, and sample excerpts for instant question generation
                          </span>
                        </>
                      )}
                    </div>

                    {fileUploadError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.8rem' }}>
                        <AlertCircle size={16} />
                        <span>{fileUploadError}</span>
                      </div>
                    )}

                    {/* Active Uploaded Document Banner */}
                    {uploadedDocMeta && (
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '0.625rem', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534' }}>
                              ✅ Loaded: {uploadedDocMeta.title}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: '#15803d', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span>Format: {uploadedDocMeta.fileType.toUpperCase()}</span>
                              <span>•</span>
                              <span>{uploadedDocMeta.fileSize || `${uploadedDocMeta.totalWords} words`}</span>
                              <span>•</span>
                              <span style={{ fontWeight: 700 }}>{uploadedDocMeta.chapters.length} Chapters Extracted</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                            className="btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff' }}
                          >
                            <Eye size={13} /> {showExtractedPreview ? 'Hide Preview' : 'Preview Extracted Text'}
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary btn-sm"
                            style={{ fontSize: '0.725rem', background: '#ffffff' }}
                          >
                            Upload Another
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: PASTE BOOK COPY / SYLLABUS TEXT */}
                {docUploadMode === 'paste' && (
                  <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Copy size={16} /> Paste Textbook Excerpt, Chapter Notes, or Syllabus Copy
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>Book / Syllabus Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Modern Physics - Motion & Gravitation"
                          value={pastedTitle}
                          onChange={e => setPastedTitle(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>Author / Board (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Cambridge Curriculum Board"
                          value={pastedAuthor}
                          onChange={e => setPastedAuthor(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>Pasted Text Content</label>
                      <textarea
                        rows={5}
                        placeholder="Paste your syllabus text, textbook copy, chapter paragraphs, or study material here... Our engine will automatically segment headings, definitions, and formulas into chapters."
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                        className="form-textarea"
                        style={{ fontSize: '0.8125rem', lineHeight: 1.45 }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={handleProcessPastedCopy}
                        disabled={!pastedText.trim() || isProcessingFile}
                        className="btn-primary btn-sm"
                        style={{
                          background: '#7c3aed',
                          borderColor: '#7c3aed',
                          padding: '0.5rem 1rem',
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Sparkles size={14} /> Process & Segment Into Chapters
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 3: PRELOADED LIBRARY BOOKS */}
                {docUploadMode === 'library' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Select Digital Textbook / Syllabus Source</label>
                      <button 
                        type="button" 
                        onClick={() => setShowInlineAddBook(!showInlineAddBook)}
                        style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={12} /> {showInlineAddBook ? 'Cancel' : '+ Add / Upload Book'}
                      </button>
                    </div>
                    <select 
                      value={selectedBookId} 
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowInlineAddBook(true);
                        } else {
                          setSelectedBookId(e.target.value);
                          setShowInlineAddBook(false);
                        }
                      }}
                      className="form-select"
                    >
                      {books.map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: 700, color: '#7c3aed' }}>➕ + Add / Upload New Book Resource (New Field)...</option>
                    </select>

                    {/* Inline Add Book Panel */}
                    {showInlineAddBook && (
                      <div style={{ background: '#faf5ff', border: '1.5px dashed #c084fc', borderRadius: '0.625rem', padding: '1rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b21a8' }}>
                          📖 Add Digital Textbook / Reference Source
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            placeholder="Book Title (e.g. Modern Physics Concepts)" 
                            value={newBookTitle} 
                            onChange={e => setNewBookTitle(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.8125rem' }}
                          />
                          <input 
                            type="text" 
                            placeholder="Author (e.g. Cambridge Board)" 
                            value={newBookAuthor} 
                            onChange={e => setNewBookAuthor(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.8125rem' }}
                          />
                          <input 
                            type="text" 
                            placeholder="Grade (e.g. Grade 10)" 
                            value={newBookGrade} 
                            onChange={e => setNewBookGrade(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.8125rem' }}
                          />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Initial Chapter Title (e.g. Ch 1: Motion & Gravitation)" 
                          value={newBookInitialChapterTitle} 
                          onChange={e => setNewBookInitialChapterTitle(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button type="button" onClick={() => setShowInlineAddBook(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
                            Cancel
                          </button>
                          <button type="button" onClick={() => handleSaveNewBook()} className="btn-primary btn-sm" style={{ background: '#7c3aed', borderColor: '#7c3aed', fontSize: '0.7rem' }}>
                            <CheckCircle2 size={13} /> Save & Select Book
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Text Preview Drawer */}
                {showExtractedPreview && uploadedDocMeta && (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.625rem', padding: '1rem', maxHeight: '240px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                        Document Excerpt Preview ({uploadedDocMeta.rawText.length.toLocaleString()} characters)
                      </span>
                      <button type="button" onClick={() => setShowExtractedPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={14} />
                      </button>
                    </div>
                    <pre style={{ fontSize: '0.75rem', color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                      {uploadedDocMeta.rawText.slice(0, 1500)}...
                    </pre>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Select Chapters to Include <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 400 }}>(Optional)</span></label>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: selectedChapterNumbers.length > 0 ? '#166534' : '#4338ca', 
                        background: selectedChapterNumbers.length > 0 ? '#dcfce7' : '#e0e7ff', 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '1rem', 
                        fontWeight: 600 
                      }}>
                        {selectedChapterNumbers.length > 0 
                          ? `✓ ${selectedChapterNumbers.length} Chapter${selectedChapterNumbers.length > 1 ? 's' : ''} Selected` 
                          : '📄 Entire Document (All Chapters)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedChapterNumbers.length === currentBook.chapters.length) {
                          setSelectedChapterNumbers([]);
                        } else {
                          setSelectedChapterNumbers(currentBook.chapters.map(ch => ch.chapterNumber));
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {selectedChapterNumbers.length === currentBook.chapters.length ? 'Deselect All' : `Select All Chapters (${currentBook.chapters.length})`}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {currentBook.chapters.map(ch => {
                      const isSelected = selectedChapterNumbers.includes(ch.chapterNumber);
                      return (
                        <div 
                          key={ch.chapterNumber}
                          onClick={() => {
                            setSelectedChapterNumbers(prev => 
                              prev.includes(ch.chapterNumber) 
                                ? prev.filter(num => num !== ch.chapterNumber) 
                                : [...prev, ch.chapterNumber]
                            );
                          }}
                          style={{ 
                            padding: '0.625rem', 
                            borderRadius: '0.5rem', 
                            background: isSelected ? '#faf5ff' : '#ffffff', 
                            border: `1.5px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`,
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: isSelected ? '#6d28d9' : '#0f172a' }}>
                              Ch {ch.chapterNumber}: {ch.title}
                            </div>
                            {isSelected && (
                              <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700 }}>✓ Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>{ch.pageRange}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Groq AI Cloud Generator Bar */}
                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '0.625rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: '#7c3aed', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={16} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        Groq AI Cloud Generator
                        <span style={{ fontSize: '0.65rem', background: '#e9d5ff', color: '#6d28d9', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                          {groqModel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6d28d9' }}>
                        Sends extracted PDF/Word text directly to Groq LLM for real questions
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#4c1d95' }}>
                      <input 
                        type="checkbox" 
                        checked={useGroqAi} 
                        onChange={e => setUseGroqAi(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: '#7c3aed' }} 
                      />
                      Use Groq AI
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowGroqConfigModal(!showGroqConfigModal)}
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff' }}
                    >
                      <Key size={12} color="#7c3aed" />
                      {GroqStorage.hasApiKey() || groqApiKeyInput.trim() ? 'Groq Key ✓' : 'Set Groq Key 🔑'}
                    </button>
                  </div>
                </div>

                {/* Groq Key Drawer */}
                {showGroqConfigModal && (
                  <div style={{ background: '#ffffff', border: '1.5px solid #c4b5fd', borderRadius: '0.625rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Zap size={14} color="#7c3aed" /> Groq AI API Configuration
                      </span>
                      <button type="button" onClick={() => setShowGroqConfigModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>
                          Groq API Key (starts with gsk_...)
                        </label>
                        <input
                          type="password"
                          placeholder="gsk_..."
                          value={groqApiKeyInput}
                          onChange={e => setGroqApiKeyInput(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, marginBottom: '0.25rem' }}>
                          LLM Model
                        </label>
                        <select
                          value={groqModel}
                          onChange={e => setGroqModel(e.target.value)}
                          className="form-select"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Recommended - Flagship 120B)</option>
                          <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Ultra-Fast 20B)</option>
                          <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (Qwen Multimodal 27B)</option>
                        </select>
                      </div>
                    </div>

                    {groqKeyFeedback && (
                      <div style={{
                        background: groqKeyFeedback.status === 'valid' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${groqKeyFeedback.status === 'valid' ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        color: groqKeyFeedback.status === 'valid' ? '#166534' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        {groqKeyFeedback.status === 'valid' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        <span>{groqKeyFeedback.message}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <a 
                        href="https://console.groq.com/keys" 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '0.75rem', color: '#7c3aed', textDecoration: 'underline' }}
                      >
                        Get a free Groq API key at console.groq.com ↗
                      </a>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={handleTestGroqKey}
                          disabled={isTestingGroqKey}
                          className="btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          {isTestingGroqKey ? 'Testing...' : 'Test Key'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGroqConfig}
                          disabled={isTestingGroqKey}
                          className="btn-primary btn-sm"
                          style={{ background: '#7c3aed', borderColor: '#7c3aed', fontSize: '0.75rem' }}
                        >
                          <CheckCircle2 size={13} /> {isTestingGroqKey ? 'Verifying...' : 'Save & Verify Key'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Configure Question Distribution by Marks (7.4.2)</label>
                    <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                      {dist1m + dist2m + dist3m + dist4m + dist5m + dist10m} Questions ({dist1m * 1 + dist2m * 2 + dist3m * 3 + dist4m * 4 + dist5m * 5 + dist10m * 10} Marks)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>1-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist1m} 
                        onChange={(e) => setDist1m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>2-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist2m} 
                        onChange={(e) => setDist2m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>3-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist3m} 
                        onChange={(e) => setDist3m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>4-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist4m} 
                        onChange={(e) => setDist4m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>5-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist5m} 
                        onChange={(e) => setDist5m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>10-Mark Qs</span>
                      <input 
                        type="number" 
                        min={0} 
                        value={dist10m} 
                        onChange={(e) => setDist10m(Number(e.target.value))} 
                        className="form-input" 
                        style={{ marginTop: '0.35rem' }} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    type="button"
                    onClick={handleTriggerBookGeneration} 
                    disabled={isBookGenerating || !uploadedDocMeta || (dist1m + dist2m + dist3m + dist4m + dist5m + dist10m) === 0} 
                    className="btn-primary"
                    style={{ 
                      alignSelf: 'flex-start', 
                      background: '#7c3aed', 
                      borderColor: '#7c3aed',
                      opacity: (isBookGenerating || !uploadedDocMeta || (dist1m + dist2m + dist3m + dist4m + dist5m + dist10m) === 0) ? 0.5 : 1,
                      cursor: (isBookGenerating || !uploadedDocMeta || (dist1m + dist2m + dist3m + dist4m + dist5m + dist10m) === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isBookGenerating ? <Loader2 size={16} className="animate-spin" /> : useGroqAi ? <Zap size={16} /> : <BookOpen size={16} />}
                    {isBookGenerating 
                      ? (useGroqAi ? 'Groq AI Generating Questions...' : 'Extracting & Generating...') 
                      : !uploadedDocMeta
                        ? 'Upload Document to Generate'
                        : `Generate ${dist1m + dist2m + dist3m + dist4m + dist5m + dist10m} Questions ${useGroqAi ? 'with Groq AI ⚡' : 'from Document'} (${selectedChapterNumbers.length === 0 ? 'Entire Document' : selectedChapterNumbers.length === 1 ? `Chapter ${selectedChapterNumbers[0]}` : `${selectedChapterNumbers.length} Selected Chapters`})`}
                  </button>

                  {candidateBookQuestions.length > 0 && (
                    <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>
                      ✓ {candidateBookQuestions.length} Questions from {uploadedDocMeta?.title || 'Document'} in Manifest
                    </span>
                  )}
                </div>

                {/* Error Banner */}
                {bookGenError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontSize: '0.8125rem' }}>
                    <AlertCircle size={16} />
                    <span>{bookGenError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {bookGenSuccess && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#166534', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} />
                      <span style={{ fontWeight: 600 }}>{bookGenSuccess}</span>
                    </div>
                    <span style={{ background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.75rem' }}>
                      Manifest Total: {questions.length} Qs ({totalCalculatedMarks} Marks)
                    </span>
                  </div>
                )}

                {/* Live Candidate Preview Shelf */}
                {candidateBookQuestions.length > 0 && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.625rem', padding: '1rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                        Preview of Questions Generated & Added to Manifest ({candidateBookQuestions.length})
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        All Active in Right Manifest Panel
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '320px', overflowY: 'auto' }}>
                      {candidateBookQuestions.map((q, idx) => (
                        <div key={q.id || idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{q.marks} Marks</span>
                              <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{q.type.replace('_', ' ').toUpperCase()}</span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ch {q.chapterNumber || 1}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>✓ In Manifest</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#0f172a', lineHeight: 1.4 }}>{q.text}</p>
                          {q.explanation && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WORKBENCH C: MANUAL CREATION */}
            {creationMethod === 'manual' && (
              <form onSubmit={handleAddManualQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PenTool size={18} color="#059669" />
                  <h3 style={{ fontSize: '1.125rem', color: '#0f172a' }}>Manual Question Authoring (7.4.1)</h3>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Chapter Tag</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setNewChapterNumber((currentSubject?.chapters.length || 0) + 1);
                        setShowInlineAddChapter(!showInlineAddChapter);
                      }}
                      style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> {showInlineAddChapter ? 'Cancel' : '+ Add Chapter Field'}
                    </button>
                  </div>
                  <select 
                    value={manualChapterId} 
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setNewChapterNumber((currentSubject?.chapters.length || 0) + 1);
                        setShowInlineAddChapter(true);
                      } else {
                        setManualChapterId(e.target.value);
                        setShowInlineAddChapter(false);
                      }
                    }}
                    className="form-select"
                  >
                    {currentSubject.chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.title}</option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: 700, color: '#059669' }}>
                      ➕ + Add New Chapter (New Field after Ch {currentSubject.chapters.length})...
                    </option>
                  </select>

                  {showInlineAddChapter && (
                    <div style={{ background: '#ecfdf5', border: '1.5px dashed #10b981', borderRadius: '0.625rem', padding: '1rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46' }}>
                          ✨ Add Chapter Field to {currentSubject.name}
                        </span>
                        <span className="badge badge-success">Chapter #{newChapterNumber || ((currentSubject?.chapters.length || 0) + 1)}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Ch #</label>
                          <input 
                            type="number" 
                            value={newChapterNumber} 
                            onChange={e => setNewChapterNumber(Number(e.target.value))}
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Chapter Title *</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Sources of Energy & Environmental Physics" 
                            value={newChapterTitle} 
                            onChange={e => setNewChapterTitle(e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Key Topics</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Solar Energy, Biogas, Hydroelectric Power, Nuclear Fission" 
                          value={newChapterTopics} 
                          onChange={e => setNewChapterTopics(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setShowInlineAddChapter(false)} className="btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={() => handleSaveNewChapter()} className="btn-primary btn-sm" style={{ background: '#059669', borderColor: '#059669', fontSize: '0.7rem' }}>
                          <CheckCircle2 size={13} /> Save & Select Chapter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Question Text</label>
                  <textarea 
                    rows={3} 
                    value={manualText} 
                    onChange={(e) => setManualText(e.target.value)} 
                    placeholder="Enter question statement, formula, or problem scenario..." 
                    required 
                    className="form-textarea" 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Question Type</label>
                    <select 
                      value={manualType} 
                      onChange={(e) => setManualType(e.target.value as QuestionType)}
                      className="form-select"
                    >
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="true_false">True / False</option>
                      <option value="key_in">Key-in Numerical</option>
                      <option value="short_answer">Short Answer (2-3M)</option>
                      <option value="long_answer">Long Answer (5-10M)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Marks</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={20} 
                      value={manualMarks} 
                      onChange={(e) => setManualMarks(Number(e.target.value))} 
                      className="form-input" 
                    />
                  </div>

                  <div>
                    <label className="form-label">Difficulty</label>
                    <select 
                      value={manualDifficulty} 
                      onChange={(e) => setManualDifficulty(e.target.value as QuestionDifficulty)}
                      className="form-select"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="olympiad">Olympiad</option>
                    </select>
                  </div>
                </div>

                {/* MCQ Options */}
                {manualType === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="form-label">Options (Mark radio button for correct answer)</label>
                    {manualOptions.map((opt, i) => (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="radio" 
                          name="mcq-correct" 
                          checked={opt.isCorrect} 
                          onChange={() => {
                            setManualOptions(prev => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
                          }} 
                        />
                        <input 
                          type="text" 
                          value={opt.text} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setManualOptions(prev => prev.map((o, idx) => idx === i ? { ...o, text: val } : o));
                          }}
                          className="form-input" 
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Key-in / Subjective */}
                {manualType !== 'mcq' && manualType !== 'true_false' && (
                  <div>
                    <label className="form-label">Expected Answer / Model Solution</label>
                    <input 
                      type="text" 
                      value={manualCorrectText} 
                      onChange={(e) => setManualCorrectText(e.target.value)} 
                      placeholder="e.g. 80 Ω or core formula statement" 
                      className="form-input" 
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">Marking Rubric / Evaluation Criteria</label>
                  <input 
                    type="text" 
                    value={manualRubric} 
                    onChange={(e) => setManualRubric(e.target.value)} 
                    placeholder="e.g. 1 mark for formula, 1 mark for substitution, 1 mark for correct unit" 
                    className="form-input" 
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} /> Add Question to Paper
                </button>
              </form>
            )}

          </div>

          {/* Column 3: Active Question Paper Live Manifest */}
          <div style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            {/* Manifest Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Paper Manifest</h3>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    background: questions.length > 0 ? '#e0e7ff' : '#e2e8f0', 
                    color: questions.length > 0 ? '#4338ca' : '#64748b', 
                    padding: '0.1rem 0.5rem', 
                    borderRadius: '9999px' 
                  }}>
                    {questions.length} Qs
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Live question pool</span>
                  {questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Clear all staged questions and start with a fresh clean slate?')) {
                          setQuestions([]);
                          setCandidateBookQuestions([]);
                          setCandidateAiQuestions([]);
                        }
                      }}
                      title="Remove all questions and start fresh"
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '0.35rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <Trash2 size={11} /> Clear All (Clean Slate)
                    </button>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontSize: '0.78rem', 
                  fontWeight: 800, 
                  background: totalCalculatedMarks > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0', 
                  color: totalCalculatedMarks > 0 ? '#ffffff' : '#64748b', 
                  padding: '0.25rem 0.65rem', 
                  borderRadius: '9999px',
                  boxShadow: totalCalculatedMarks > 0 ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none',
                  display: 'inline-block'
                }}>
                  {totalCalculatedMarks} Total Marks
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {questions.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '0.875rem',
                  margin: 'auto 0'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '0.875rem',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <Layers size={22} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                    Paper Manifest is Empty
                  </div>
                  <p style={{ fontSize: '0.735rem', color: '#64748b', lineHeight: 1.45, maxWidth: '240px', margin: 0 }}>
                    Use AI Generator, Book Upload, or Manual Authoring on the left to populate questions.
                  </p>
                  
                  <div style={{ 
                    marginTop: '1.15rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.4rem', 
                    width: '100%', 
                    maxWidth: '230px', 
                    textAlign: 'left' 
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                      <span>Pick method & syllabus chapter</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                      <span>Generate candidate questions</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                      <span>Review & approve to manifest</span>
                    </div>
                  </div>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    style={{ 
                      padding: '0.85rem', 
                      background: '#ffffff', 
                      borderRadius: '0.625rem', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: `4px solid ${
                        q.type === 'mcq' ? '#4f46e5' : 
                        q.type === 'true_false' ? '#0ea5e9' : 
                        q.type === 'key_in' ? '#d97706' : '#10b981'
                      }`,
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          fontWeight: 800, 
                          fontSize: '0.725rem', 
                          background: '#eef2ff', 
                          color: '#4338ca', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '0.375rem' 
                        }}>
                          Q{idx + 1}
                        </span>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.725rem', 
                          background: '#f1f5f9', 
                          color: '#334155', 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '0.375rem' 
                        }}>
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setQuestions(prev => prev.filter(item => item.id !== q.id))}
                        title="Remove question"
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#94a3b8', 
                          cursor: 'pointer', 
                          padding: '0.25rem',
                          borderRadius: '0.375rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#1e293b', margin: '0.35rem 0 0.5rem 0', lineHeight: 1.4, fontWeight: 500 }}>
                      {q.text.length > 90 ? q.text.slice(0, 90) + '...' : q.text}
                    </p>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>{q.type.toUpperCase()}</span>
                      <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>{q.difficulty}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Action Buttons */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {questions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', padding: '0 0.25rem' }}>
                  <span>{questions.length} Questions staged</span>
                  <span>Pass Marks: {passingMarks}</span>
                </div>
              )}

              {examMode === 'offline' && (
                <button 
                  type="button"
                  onClick={handlePreviewSets} 
                  disabled={questions.length === 0}
                  className="btn-secondary" 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    fontWeight: 700,
                    padding: '0.65rem 1rem'
                  }}
                >
                  <Shuffle size={15} /> Preview {setsCount} Sets & Print
                </button>
              )}

              <button 
                type="button"
                onClick={handleFinalPublish} 
                disabled={questions.length === 0} 
                className="btn-primary" 
                style={{ 
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  padding: '0.75rem 1rem',
                  background: questions.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  boxShadow: questions.length === 0 ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
                  cursor: questions.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: questions.length === 0 ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={16} /> Publish Assessment
              </button>
            </div>

          </div>

        </div>

        {/* RANDOMIZED SETS & PRINT PREVIEW MODAL OVERLAY */}
        {previewSets && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 23, 42, 0.75)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            flexDirection: 'column', 
            zIndex: 150,
            padding: '1.5rem'
          }}>
            {/* Action Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#ffffff', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Offline Question Paper Sets — {title || uploadedDocMeta?.title || 'Examination Sets'}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {previewSets.map((set, idx) => (
                    <button 
                      key={set.setId}
                      onClick={() => setActiveSetIndex(idx)}
                      className={`btn-sm ${activeSetIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
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
                <button onClick={() => window.print()} className="btn-primary">
                  <Printer size={16} /> Print / Export PDF
                </button>
                <button onClick={() => setPreviewSets(null)} className="btn-secondary">
                  Close Preview
                </button>
              </div>
            </div>

            {/* Print View Page */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', color: '#000000', borderRadius: '0.5rem', padding: '2.5rem 3rem', position: 'relative' }}>
              
              {/* Paper Watermark */}
              <div className="paper-watermark">
                OAKRIDGE ACADEMY • {previewSets[activeSetIndex].setName}
              </div>

              {/* School Exam Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', margin: 0 }}>
                  Oakridge International Academy
                </h1>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0', color: '#000' }}>
                  {previewSets[activeSetIndex].assessmentTitle} — Academic Session 2026-27
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>Subject: {previewSets[activeSetIndex].subjectName}</span>
                  <span style={{ border: '2px solid #000', padding: '0.1rem 0.6rem', borderRadius: '4px', fontSize: '1rem' }}>
                    {previewSets[activeSetIndex].setName}
                  </span>
                  <span>Time Allowed: {previewSets[activeSetIndex].durationMinutes} Minutes</span>
                  <span>Maximum Marks: {previewSets[activeSetIndex].totalMarks}</span>
                </div>
              </div>

              {/* Student Identification Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: '0.5rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div><strong>Student Name:</strong> ____________________________________</div>
                <div><strong>Enrolment Number:</strong> ______________________</div>
                <div><strong>Room No:</strong> ________</div>
              </div>

              {/* Instructions */}
              <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                <strong>General Instructions:</strong>
                <ol style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                  {previewSets[activeSetIndex].instructions.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ol>
              </div>

              {/* Questions Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {previewSets[activeSetIndex].questions.map((q, qIndex) => (
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

              {/* Answer Key & Marking Rubrics (if enabled) */}
              {showAnswerKeyInPrint && (
                <div style={{ marginTop: '3rem', borderTop: '2px dashed #000', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000', textAlign: 'center', marginBottom: '1rem' }}>
                    OFFICIAL TEACHER ANSWER KEY & MARKING SCHEME ({previewSets[activeSetIndex].setName})
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000' }}>
                        <th style={{ border: '1px solid #000', padding: '0.5rem', width: '50px' }}>Q#</th>
                        <th style={{ border: '1px solid #000', padding: '0.5rem', width: '80px' }}>Marks</th>
                        <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Correct Answer / Expected Value</th>
                        <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Marking Rubric / Step Guidelines</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSets[activeSetIndex].answerKey.map((ak) => (
                        <tr key={ak.questionId}>
                          <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{ak.questionNumber}</td>
                          <td style={{ border: '1px solid #000', padding: '0.5rem', textAlign: 'center' }}>{ak.marks}M</td>
                          <td style={{ border: '1px solid #000', padding: '0.5rem', fontWeight: 600 }}>{ak.correctAnswer}</td>
                          <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{ak.rubric || ak.explanation || 'Award full marks for exact step.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {warningModal && (
        <FeedbackModal
          isOpen={true}
          onClose={() => setWarningModal(null)}
          type="warning"
          title={warningModal.title}
          message={warningModal.message}
          primaryButtonText="Got It"
          onPrimaryClick={() => setWarningModal(null)}
        />
      )}
    </div>
  );
};
