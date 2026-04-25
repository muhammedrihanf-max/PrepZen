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

export const saveExam = async (year: string, questions: Question[], subject: string, grade: string): Promise<void> => {
  const examData = {
    id: year,
    title: `${year} Mock Examination`,
    subject,
    grade,
    questionCount: questions.length,
    updatedAt: new Date().toISOString(),
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
    .select('id, title, subject, grade, questionCount, updatedAt');

  if (error) throw error;
  return data || [];
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
