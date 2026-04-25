import { supabase } from '../lib/supabase';
import type { Question } from '../components/QuestionForm';

export interface ExamMetadata {
  id: string; // The year string, e.g., '2025'
  title: string;
  subject: string;
  grade: string;
  questionCount: number;
  updatedAt: string;
}

export const saveExam = async (year: string, questions: Question[], subject: string, grade: string, title?: string): Promise<void> => {
  const examData = {
    id: year,
    title: title || `${year} Mock Examination`,
    subject,
    grade,
    question_count: questions.length,
    updated_at: new Date().toISOString(),
    questions
  };

  const { error } = await supabase
    .from('exams')
    .upsert(examData);

  if (error) throw error;
};

export const getAllExams = async (): Promise<ExamMetadata[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select('id, title, subject, grade, question_count, updated_at');

  if (error) throw error;
  
  // Map snake_case from DB back to camelCase for the UI
  return (data || []).map(exam => ({
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    questionCount: exam.question_count,
    updatedAt: exam.updated_at
  }));
};

export const getQuestionsByYear = async (year: string): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('exams')
    .select('questions')
    .eq('id', year)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Exam not found');
  return data.questions as Question[];
};

export const deleteExam = async (year: string): Promise<void> => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', year);

  if (error) throw error;
};
