import { supabase } from '../lib/supabase';

export interface UserProfile {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'management' | 'admin';
  joinedDate: string;
  status: 'active' | 'inactive' | 'pending' | 'approved';
  lastExam?: string;
  avgScore?: number;
  avatarSeed: string;
  isOnline?: boolean;
  department?: string;
  coursesCount?: number;
  createdAt: string;
  gender?: 'male' | 'female' | 'other' | null;
}

export const obfuscate = (data: any) => btoa(encodeURIComponent(JSON.stringify(data)));
export const deobfuscate = (str: string | null) => {
  if (!str) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) return null;
  return {
    ...data,
    uid: data.id,
    id: data.id,
    joinedDate: data.joined_date,
    avatarSeed: data.avatar_seed,
    createdAt: data.created_at
  };
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const updates: any = { ...data };
  if (data.joinedDate) updates.joined_date = data.joinedDate;
  if (data.avatarSeed) updates.avatar_seed = data.avatarSeed;
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', uid);

  if (error) throw error;
};

export const deleteUserProfile = async (uid: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', uid);

  if (error) throw error;
};

export const getAllProfiles = async (roleFilter?: string): Promise<UserProfile[]> => {
  let query = supabase.from('profiles').select('*');
  if (roleFilter) {
    // If multiple roles are passed as a space-separated string
    const roles = roleFilter.split(' ');
    if (roles.length > 1) {
      query = query.in('role', roles);
    } else {
      query = query.eq('role', roleFilter);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(u => ({
    ...u,
    uid: u.id,
    id: u.id,
    joinedDate: u.joined_date,
    avatarSeed: u.avatar_seed,
    createdAt: u.created_at
  })) as UserProfile[];
};

export const getAllStudents = async (): Promise<UserProfile[]> => {
  const profiles = await getAllProfiles();
  return profiles.filter(u => u.role === 'student');
};

export const getAllTeachers = async (): Promise<UserProfile[]> => {
  const profiles = await getAllProfiles();
  return profiles.filter(u => u.role === 'teacher');
};

export const subscribeToProfiles = (roleFilter: string, callback: (profiles: UserProfile[]) => void) => {
  // Initial fetch
  getAllProfiles().then(profiles => {
    callback(profiles.filter(u => roleFilter.includes(u.role)));
  });

  // Realtime subscription
  const channel = supabase
    .channel('profiles-changes')
    // @ts-ignore
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      getAllProfiles().then(profiles => {
        callback(profiles.filter(u => roleFilter.includes(u.role)));
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToStudents = (callback: (students: UserProfile[]) => void) => {
  return subscribeToProfiles('student', callback);
};

export const subscribeToTeachers = (callback: (teachers: UserProfile[]) => void) => {
  return subscribeToProfiles('teacher', callback);
};

export const subscribeToStaff = (callback: (staff: UserProfile[]) => void) => {
  return subscribeToProfiles('management admin', callback);
};

// Note: Staff creation now happens via Supabase Auth + Trigger or Edge Function
export const createTeacherAccount = async (email: string, pass: string, name: string, department?: string) => {
  const response = await fetch('/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, name, role: 'teacher', department })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create teacher account');
  return data.user;
};

export const createStaffAccount = async (email: string, pass: string, name: string, role: string) => {
  const response = await fetch('/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, name, role })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create staff account');
  return data.user;
};
