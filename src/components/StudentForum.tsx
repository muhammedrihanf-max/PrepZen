import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, MessageSquare, Shield, Clock, Plus } from 'lucide-react';

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
                        {post.replies.map((reply: any) => (
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

      <style>{`
        .forum-container {
          padding: 3rem 2rem;
          max-width: 1300px;
          margin: 0 auto;
        }

        .forum-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          gap: 4rem;
        }

        .vibrant-text {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .forum-stats {
          display: flex;
          padding: 10px;
          gap: 10px;
          align-items: center;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 28px;
          min-width: 120px;
          background: rgba(15, 23, 42, 0.3);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          margin: 0 4px;
        }

        .forum-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 3rem;
          align-items: start;
        }

        .post-input-card {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .post-input-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .user-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-as-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .post-as-label strong {
          color: #f8fafc;
        }

        .post-input-card textarea {
          width: 100%;
          min-height: 120px;
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.25rem;
          color: white;
          font-family: inherit;
          font-size: 1rem;
          resize: none;
          transition: all 0.3s;
          margin-bottom: 1.25rem;
        }

        .post-input-card textarea:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(15, 23, 42, 0.5);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }

        .post-input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .input-hints span {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .btn-post-vibrant {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--primary-gradient);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .btn-post-vibrant:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          filter: brightness(1.1);
        }

        .btn-post-vibrant:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .forum-post-card {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          transition: transform 0.2s;
        }

        .forum-post-card:hover {
          transform: scale(1.01);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .post-author-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          background: rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .author-name-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-name {
          font-weight: 700;
          color: white;
        }

        .role-badge {
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .post-time {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .btn-delete-post {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-delete-post:hover {
          background: #ef4444;
          color: white;
        }

        .post-content {
          font-size: 1rem;
          line-height: 1.6;
          color: #e2e8f0;
          margin-bottom: 1.5rem;
          white-space: pre-wrap;
        }

        .post-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 6px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .like-btn.liked {
          color: #ec4899;
          background: rgba(236, 72, 153, 0.1);
          border-color: rgba(236, 72, 153, 0.2);
        }

        .official-mark {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .forum-sidebar > div {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .forum-sidebar h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #f8fafc;
        }

        .forum-rules-card ul {
          list-style: none;
          padding: 0;
        }

        .forum-rules-card li {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          display: flex;
          gap: 0.5rem;
        }

        .forum-rules-card li::before {
          content: '•';
          color: #6366f1;
        }

        .tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .topic-tag {
          padding: 6px 12px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          font-size: 0.8rem;
          color: #818cf8;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .topic-tag:hover {
          background: rgba(99, 102, 241, 0.15);
          color: white;
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }

        .empty-forum {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        .empty-forum h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .empty-forum p {
          color: var(--text-secondary);
        }

        /* Replies */
        .replies-container {
          margin-top: 1rem;
          padding-left: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-left: 2px solid rgba(255,255,255,0.05);
        }

        .reply-item {
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }

        .reply-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .user-avatar-mini {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 800;
          overflow: hidden;
        }

        .user-avatar-mini img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reply-author {
          font-size: 0.75rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .reply-time {
          font-size: 0.65rem;
          color: var(--text-tertiary);
        }

        .reply-content {
          font-size: 0.875rem;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .reply-input-wrapper {
          margin-top: 1rem;
        }

        .glass-input-small {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }

        .glass-input-small:focus {
          outline: none;
          background: rgba(0,0,0,0.3);
          border-color: #6366f1;
        }

        @media (max-width: 900px) {
          .forum-layout {
            grid-template-columns: 1fr;
          }
          
          .forum-sidebar {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentForum;
