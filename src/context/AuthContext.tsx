import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Role = 'teacher' | 'student' | 'management' | null;

interface Notification {
  id: string;
  type: 'question' | 'system';
  from: string;
  message: string;
  timestamp: string;
  read: boolean;
  read_by_student?: boolean;
  attachment?: string;
  reply?: {
    message: string;
    timestamp: string;
    author: string;
    attachment?: string;
  };
  isBroadcast?: boolean;
  to?: string; // Optional target UID
}

interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorPhoto?: string;
  content: string;
  timestamp: string;
  likes: string[];
  replies?: ForumPost[];
}

interface User {
  uid: string;
  email: string;
  role: Role;
  displayName?: string;
  photoURL?: string;
  gender?: 'male' | 'female' | 'other' | null;
  status?: 'active' | 'pending' | 'approved';
  name?: string;
  password?: string;
  id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: Role, password?: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: Role, accessCode?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'reply'>) => void;
  clearNotifications: () => void;
  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  markInquiryAsReadByStudent: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addReply: (notificationId: string, message: string, attachment?: string) => void;
  forumPosts: ForumPost[];
  addForumPost: (content: string) => void;
  addForumReply: (postId: string, content: string) => void;
  likeForumPost: (postId: string) => void;
  deleteForumPost: (postId: string) => void;
  sendBroadcast: (message: string) => void;
  activateStudent: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = 'prepzen_notifications';
const FORUM_KEY = 'prepzen_forum_posts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          uid: data.id,
          id: data.id,
          email: email,
          role: data.role,
          name: data.name,
          displayName: data.name,
          status: data.status,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.avatar_seed}`,
          gender: data.gender
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize session and listen for auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem(FORUM_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const saveNotis = (notis: Notification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notis));
    setNotifications(notis);
  };
  const getNotis = (): Notification[] => JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');

  const saveForum = (posts: ForumPost[]) => {
    localStorage.setItem(FORUM_KEY, JSON.stringify(posts));
    setForumPosts(posts);
  };
  const getForum = (): ForumPost[] => JSON.parse(localStorage.getItem(FORUM_KEY) || '[]');
  
  const login = async (email: string, _role: Role, password = '') => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email!);
    }
  };

  const register = async (email: string, passwordInput: string, name: string, role: Role, accessCode?: string) => {
    if ((role === 'teacher' || role === 'management') && accessCode !== 'J3lly22fish@') {
      throw new Error('Invalid staff access code.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: passwordInput,
      options: {
        data: { name, role }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name,
          email,
          role,
          status: role === 'student' ? 'pending' : 'active',
          avatar_seed: name || email.split('@')[0],
          joined_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }]);

      if (profileError) throw profileError;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    // Convert User updates to Profile updates
    const profileUpdates: any = {};
    if (updates.name) profileUpdates.name = updates.name;
    if (updates.gender) profileUpdates.gender = updates.gender;
    if (updates.role) profileUpdates.role = updates.role;

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.uid);

    if (error) throw error;
    
    // Update local state
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'reply'>) => {
    const notis = getNotis();
    const newNoti: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    saveNotis([newNoti, ...notis]);
  };

  const clearNotifications = () => saveNotis([]);
  
  const markNotificationsAsRead = () => {
    const updated = getNotis().map(n => ({ ...n, read: true }));
    saveNotis(updated);
  };

  const markNotificationAsRead = (id: string) => {
    const updated = getNotis().map(n => n.id === id ? { ...n, read: true } : n);
    saveNotis(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = getNotis().filter(n => n.id !== id);
    saveNotis(updated);
  };

  const clearAllNotifications = () => saveNotis([]);

  const markInquiryAsReadByStudent = (id: string) => {
    const updated = getNotis().map(n => n.id === id ? { ...n, read_by_student: true } : n);
    saveNotis(updated);
  };

  const addReply = (notificationId: string, message: string, attachment?: string) => {
    const updated = getNotis().map(n => n.id === notificationId ? {
      ...n,
      read_by_student: false,
      reply: { message, attachment, timestamp: new Date().toISOString(), author: user?.role === 'management' ? 'Management' : 'Teacher' }
    } : n);
    saveNotis(updated);
  };

  const addForumPost = (content: string) => {
    if (!user) return;
    const posts = getForum();
    const newPost: ForumPost = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorRole: user.role,
      content,
      timestamp: new Date().toISOString(),
      likes: [],
      replies: []
    };
    saveForum([newPost, ...posts]);
  };

  const addForumReply = (postId: string, content: string) => {
    if (!user) return;
    const updated = getForum().map(post => {
      if (post.id === postId) {
        const replies = post.replies || [];
        return {
          ...post,
          replies: [...replies, {
            id: Math.random().toString(36).substr(2, 9),
            authorId: user.uid,
            authorName: user.displayName || user.email,
            authorRole: user.role,
            content,
            timestamp: new Date().toISOString(),
            likes: []
          }]
        };
      }
      return post;
    });
    saveForum(updated);
  };

  const likeForumPost = (postId: string) => {
    if (!user) return;
    const updated = getForum().map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const hasLiked = likes.includes(user.uid);
        return {
          ...post,
          likes: hasLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
        };
      }
      return post;
    });
    saveForum(updated);
  };

  const sendBroadcast = (message: string) => {
    const notis = getNotis();
    const newNoti: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'system',
      from: user?.role === 'management' ? 'Management' : 'Teacher',
      message,
      timestamp: new Date().toISOString(),
      read: false,
      isBroadcast: true
    };
    saveNotis([newNoti, ...notis]);
  };

  const deleteForumPost = (postId: string) => {
    const updated = getForum().filter(p => p.id !== postId);
    saveForum(updated);
  };

  const activateStudent = async (uid: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', uid);

    if (error) throw error;
    
    // Add activation notification locally for now
    addNotification({
      type: 'system',
      from: 'Management',
      message: 'Your account has been activated! Welcome to PrepZen.'
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, updateProfile, 
      notifications, addNotification, clearNotifications, markNotificationsAsRead,
      markNotificationAsRead, markInquiryAsReadByStudent,
      deleteNotification, clearAllNotifications, addReply,
      forumPosts, addForumPost, addForumReply, likeForumPost, deleteForumPost, sendBroadcast,
      activateStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
