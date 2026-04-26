import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, MessageSquare, Shield, Clock, Plus } from 'lucide-react';
import '../styles/StudentForum.css';

const StudentForum: React.FC = () => {
  const { user, forumPosts, addForumPost, addForumReply, likeForumPost, deleteForumPost } = useAuth();
  const [newPost, setNewPost] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [forumPosts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    addForumPost(newPost);
    setNewPost('');
  };

  const handleReplySubmit = (postId: string, content: string) => {
    if (!content.trim()) return;
    addForumReply(postId, content);
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'management': return '#f59e0b';
      case 'teacher': return '#10b981';
      default: return '#6366f1';
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'management': return 'Management';
      case 'teacher': return 'Teacher';
      default: return 'Student';
    }
  };

  return (
    <div className="forum-container">
      <div className="forum-header">
        <div>
          <h1 className="vibrant-text">Community Forum</h1>
          <p>Share thoughts, ask questions, and collaborate with your peers.</p>
        </div>
        <div className="forum-stats">
          <div className="stat-item">
            <span className="stat-value">{forumPosts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">{forumPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)}</span>
            <span className="stat-label">Likes</span>
          </div>
        </div>
      </div>

      <div className="forum-layout">
        <div className="forum-main">
          {/* Post Input */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="post-input-card glass-card"
            onSubmit={handleSubmit}
          >
            <div className="post-input-header">
              <div className="user-avatar-small">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Me" />
                ) : (
                  user?.displayName?.charAt(0) || user?.email.charAt(0).toUpperCase()
                )}
              </div>
              <span className="post-as-label">Posting as <strong>{user?.displayName || 'You'}</strong></span>
            </div>
            <textarea 
              placeholder="What's on your mind? Share a study tip, a question, or a success story!"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            />
            <div className="post-input-footer">
              <div className="input-hints">
                <span>Shift + Enter for new line</span>
              </div>
              <button 
                type="submit" 
                className="btn-post-vibrant"
                disabled={!newPost.trim()}
              >
                <Plus size={18} />
                <span>Post to Forum</span>
              </button>
            </div>
          </motion.form>

          {/* Posts List */}
          <div className="posts-list" ref={scrollRef}>
            <AnimatePresence mode="popLayout">
              {forumPosts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key="empty"
                  className="empty-forum glass-card"
                >
                  <MessageSquare size={48} className="empty-icon" />
                  <h3>No posts yet</h3>
                  <p>Be the first one to start a conversation!</p>
                </motion.div>
              ) : (
                forumPosts.map((post) => (
                  <motion.div 
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="forum-post-card glass-card"
                  >
                    <div className="post-header">
                      <div className="post-author-info">
                        <div className="author-avatar" style={{ border: `2px solid ${getRoleColor(post.authorRole)}` }}>
                          {post.authorPhoto ? (
                            <img src={post.authorPhoto} alt={post.authorName} />
                          ) : (
                            post.authorName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="author-name-row">
                            <span className="author-name">{post.authorName}</span>
                            <span 
                              className="role-badge" 
                              style={{ backgroundColor: `${getRoleColor(post.authorRole)}22`, color: getRoleColor(post.authorRole) }}
                            >
                              {getRoleBadge(post.authorRole)}
                            </span>
                          </div>
                          <span className="post-time">
                            <Clock size={12} />
                            {new Date(post.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {(user?.role === 'teacher' || user?.role === 'management' || user?.uid === post.authorId) && (
                        <button 
                          className="btn-delete-post" 
                          onClick={() => deleteForumPost(post.id)}
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="post-content">
                      {post.content}
                    </div>

                    <div className="post-actions">
                      <button 
                        className={`action-btn like-btn ${user && post.likes?.includes(user.uid) ? 'liked' : ''}`}
                        onClick={() => likeForumPost(post.id)}
                      >
                        <Heart size={16} fill={user && post.likes?.includes(user.uid) ? "currentColor" : "none"} />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button className="action-btn" onClick={() => {
                        const replyInput = document.getElementById(`reply-input-${post.id}`);
                        replyInput?.focus();
                      }}>
                        <MessageSquare size={16} />
                        <span>{post.replies?.length || 0} Replies</span>
                      </button>
                      {post.authorRole !== 'student' && (
                        <div className="official-mark">
                          <Shield size={14} />
                          <span>Official Response</span>
                        </div>
                      )}
                    </div>

                    {/* Replies Section */}
                    {post.replies && post.replies.length > 0 && (
                      <div className="replies-container">
                        {post.replies.map((reply: { id: string; authorName: string; authorPhoto?: string; timestamp: string; content: string }) => (
                          <div key={reply.id} className="reply-item glass-card compact">
                            <div className="reply-header">
                              <div className="user-avatar-mini">
                                {reply.authorPhoto ? <img src={reply.authorPhoto} alt={reply.authorName} /> : reply.authorName.charAt(0)}
                              </div>
                              <span className="reply-author">{reply.authorName}</span>
                              <span className="reply-time">{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="reply-content">{reply.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="reply-input-wrapper">
                      <input 
                        id={`reply-input-${post.id}`}
                        type="text" 
                        placeholder="Write a reply..."
                        className="glass-input-small"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleReplySubmit(post.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="forum-sidebar">
          <div className="forum-rules-card glass-card">
            <h3>Community Guidelines</h3>
            <ul>
              <li>Be respectful and kind to others</li>
              <li>No spam or irrelevant links</li>
              <li>Encourage and support your peers</li>
              <li>Use appropriate language at all times</li>
            </ul>
          </div>

          <div className="trending-tags glass-card">
            <h3>Trending Topics</h3>
            <div className="tags-grid">
              <span className="topic-tag">#ExamTips</span>
              <span className="topic-tag">#PhysicsStudy</span>
              <span className="topic-tag">#TimeManagement</span>
              <span className="topic-tag">#Motivation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentForum;
