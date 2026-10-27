import type { Question, QuestionDifficulty, QuestionOption } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export interface GroqConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export const GroqStorage = {
  getApiKey: (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('quiz_groq_api_key') || (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  },
  setApiKey: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('quiz_groq_api_key', key.trim());
  },
  getModel: (): string => {
    if (typeof window === 'undefined') return DEFAULT_MODEL;
    return localStorage.getItem('quiz_groq_model') || DEFAULT_MODEL;
  },
  setModel: (model: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('quiz_groq_model', model.trim());
  },
  hasApiKey: (): boolean => {
    const key = GroqStorage.getApiKey();
    return Boolean(key && key.trim().length > 5 && !key.includes('YOUR_KEY'));
  }
};

export interface GenerateWithGroqParams {
  documentTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  documentExcerpt: string;
  markDistribution: { marks: number; count: number }[];
  subjectId: string;
  difficulty?: QuestionDifficulty;
  customPrompt?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Sends document text and question configuration to Groq AI (Llama 3.3 / Llama 3.1)
 * and returns curriculum-grounded questions formatted for the application.
 */
export async function generateQuestionsWithGroq(params: GenerateWithGroqParams): Promise<Question[]> {
  const apiKey = params.apiKey || GroqStorage.getApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Groq API Key is missing. Please provide your Groq API key (starts with gsk_) to generate questions with Groq AI.');
  }

  const model = params.model || GroqStorage.getModel();
  const totalCount = params.markDistribution.reduce((sum, d) => sum + d.count, 0);

  // Build requirement breakdown
  const distBreakdown = params.markDistribution
    .filter(d => d.count > 0)
    .map(d => `- ${d.count} question(s) worth ${d.marks} mark(s) each`)
    .join('\n');

  const systemPrompt = `You are an elite academic curriculum examiner and professor. 
Your task is to generate rigorous, high-quality, syllabus-aligned exam questions based STRICTLY and EXCLUSIVELY on the provided textbook / syllabus document excerpt.
Do NOT fabricate external topics outside the document.
CRITICAL UNIQUENESS MANDATE:
- Every single question generated MUST be 100% unique and distinct.
- NEVER repeat or duplicate questions, prompts, concepts, or options.
- If multiple questions have the same marks, each question MUST test a DIFFERENT concept, definition, reaction, or equation from the text.
You MUST output strictly valid JSON matching the exact requested schema, with NO markdown backticks, NO commentary, and NO explanations outside the JSON object.`;

  const userPrompt = `Generate exactly ${totalCount} exam questions based on the following uploaded textbook document material:

=== DOCUMENT EXCERPT START ===
Document Title: ${params.documentTitle}
Chapter ${params.chapterNumber}: ${params.chapterTitle}

Content:
${params.documentExcerpt.slice(0, 4500)}
=== DOCUMENT EXCERPT END ===

REQUIRED QUESTION DISTRIBUTION BY MARKS:
${distBreakdown}

Difficulty Level: ${params.difficulty || 'medium'}
${params.customPrompt ? `Special Teacher Instructions: ${params.customPrompt}\n` : ''}

REQUIRED JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "text": "Detailed question prompt directly derived from the document excerpt",
      "type": "mcq" | "short_answer" | "key_in" | "long_answer",
      "marks": 1,
      "difficulty": "easy" | "medium" | "hard",
      "options": [
        {"text": "Option A (Correct)", "isCorrect": true},
        {"text": "Option B (Plausible distractor)", "isCorrect": false},
        {"text": "Option C (Plausible distractor)", "isCorrect": false},
        {"text": "Option D (Plausible distractor)", "isCorrect": false}
      ],
      "correctAnswerText": "Model solution or precise answer",
      "markingRubric": "Rubric breakdown for awarding full/partial marks",
      "explanation": "Specific conceptual explanation citing the chapter excerpt"
    }
  ]
}

CRITICAL RULES:
1. Every question MUST be unique! Absolutely zero duplicated questions or identical text.
2. For 1-mark questions, use type 'mcq' with exactly 4 distinct options and exactly one having isCorrect: true.
3. For 2-mark questions, use type 'short_answer' with definitions or 2-part answers. Set 'options': [].
4. For 3-mark questions, use type 'key_in' or 'short_answer' with reasoning or calculations.
5. For 4-mark and 5-mark questions, use 'short_answer' or 'long_answer' with structured sub-questions (e.g. (a) and (b)).
6. For 10-mark questions, use 'long_answer' formatted as a multi-part Section E Case Study question.
7. The array must contain exactly ${totalCount} questions matching the mark distribution specified above.
8. Return raw JSON only with key "questions".`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    let errorDetail = `Groq API HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || errorDetail;
    } catch {
      // ignore parse error
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq AI returned an empty response. Please verify your prompt and model.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    throw new Error(`Failed to parse Groq AI JSON response: ${err?.message || 'Invalid format'}`);
  }

  const rawQuestions: any[] = Array.isArray(parsed.questions) 
    ? parsed.questions 
    : (Array.isArray(parsed) ? parsed : []);

  if (rawQuestions.length === 0) {
    throw new Error('Groq AI did not return any questions in the response array.');
  }

  const timestamp = Date.now();
  return rawQuestions.map((q, idx) => {
    const qId = `groq-${params.chapterNumber}-${timestamp}-${idx + 1}`;
    const qMarks = Number(q.marks) || 1;
    const qType = (q.type as any) || (qMarks === 1 ? 'mcq' : 'short_answer');

    let options: QuestionOption[] | undefined;
    if (qType === 'mcq' || (Array.isArray(q.options) && q.options.length > 0)) {
      options = (q.options || []).map((opt: any, optIdx: number) => ({
        id: `opt-${qId}-${optIdx + 1}`,
        text: typeof opt === 'string' ? opt : (opt.text || `Option ${optIdx + 1}`),
        isCorrect: typeof opt === 'object' ? Boolean(opt.isCorrect) : optIdx === 0
      }));
    }

    return {
      id: qId,
      text: q.text || `[Ch ${params.chapterNumber}: ${params.chapterTitle}] Concept question`,
      type: qType,
      subjectId: params.subjectId,
      chapterId: `ch-${params.subjectId}-${params.chapterNumber}`,
      chapterNumber: params.chapterNumber,
      marks: qMarks,
      difficulty: q.difficulty || params.difficulty || 'medium',
      options,
      correctAnswerText: q.correctAnswerText || (options ? options.find(o => o.isCorrect)?.text : undefined),
      markingRubric: q.markingRubric || `${qMarks} mark(s) awarded for accurate explanation and complete steps.`,
      explanation: q.explanation || `Derived from ${params.documentTitle} - Chapter ${params.chapterNumber}.`,
      source: 'book_upload',
      approved: true
    };
  });
}
