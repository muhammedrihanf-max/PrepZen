import { supabase } from '../lib/supabase';

export interface ScoreHistory {
  date: string;
  score: number;
}

export interface TopicPerformance {
  subject: string;
  score: number;
  fullMark: number;
}

export const getStudentPerformance = async (studentId: string) => {
  const { data: results, error } = await supabase
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  
  const history: ScoreHistory[] = (results || []).map(r => ({
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: r.score
  })).reverse();

  const topicMap: Record<string, { total: number; count: number }> = {};
  (results || []).forEach(r => {
    const topic = r.exam_name || 'General';
    if (!topicMap[topic]) topicMap[topic] = { total: 0, count: 0 };
    topicMap[topic].total += r.score;
    topicMap[topic].count += 1;
  });

  const topics: TopicPerformance[] = Object.entries(topicMap).map(([subject, stats]) => ({
    subject,
    score: Math.round(stats.total / stats.count),
    fullMark: 100
  }));

  if (topics.length === 0) topics.push({ subject: 'No Exams Yet', score: 0, fullMark: 100 });

  return { history, topics };
};

export const getGlobalStats = async () => {
  const { count: studentCount, error: userError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: examCount, error: examError } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true });

  const { data: results, error: resError } = await supabase
    .from('results')
    .select('score, exam_name');

  if (userError || examError || resError) throw (userError || examError || resError);

  const totalResults = results?.length || 0;
  let avgScore = 0;
  if (totalResults > 0) {
    const sum = results!.reduce((acc, r) => acc + (r.score || 0), 0);
    avgScore = Math.round(sum / totalResults);
  }

  const examParticipationMap: Record<string, number> = {};
  (results || []).forEach(r => {
    const name = r.exam_name || 'General';
    examParticipationMap[name] = (examParticipationMap[name] || 0) + 1;
  });

  return {
    studentCount: studentCount || 0,
    examCount: examCount || 0,
    avgScore: `${avgScore}%`,
    activeAttempts: totalResults,
    examParticipation: examParticipationMap
  };
};

export const subscribeToGlobalLeaderboard = (callback: (data: {
  id: string;
  name: string;
  score: number;
  rank: number;
  seed: string;
  trend: 'up';
}[]) => void) => {
  const fetchLeaderboard = async () => {
    const { data: results, error } = await supabase
      .from('results')
      .select('student_id, student_name, score')
      .order('score', { ascending: false });

    if (error) return;

    const studentBest: Record<string, any> = {};
    (results || []).forEach(r => {
      if (!studentBest[r.student_id] || studentBest[r.student_id].score < r.score) {
        studentBest[r.student_id] = r;
      }
    });

    const leaderboard = Object.values(studentBest)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => ({
        id: entry.student_id,
        name: entry.student_name || 'Student',
        score: entry.score,
        rank: index + 1,
        seed: entry.student_id,
        trend: 'up' as const
      }));

    callback(leaderboard);
  };

  fetchLeaderboard();

  // Simple subscription to result changes re-triggers leaderboard
  const channel = supabase
    .channel('leaderboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
      fetchLeaderboard();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToRecentResults = (callback: (data: {
  id?: string;
  studentId: string;
  studentName?: string;
  examName: string;
  score: number;
  timestamp: string;
}[]) => void) => {
  const fetchRecent = async () => {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return;

    callback((data || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      examName: r.exam_name,
      score: r.score,
      timestamp: r.created_at
    })));
  };

  fetchRecent();

  const channel = supabase
    .channel('recent-results')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
      fetchRecent();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const saveExamResult = async (studentId: string, examName: string, score: number, studentName?: string) => {
  const { error } = await supabase
    .from('results')
    .insert({
      student_id: studentId,
      student_name: studentName,
      exam_name: examName,
      score
    });

  if (error) throw error;
};

export const getLatestResultForStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
};
