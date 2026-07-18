"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trash2, Lock, ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const convexEnabled = !!process.env.NEXT_PUBLIC_CONVEX_URL;

export default function AdminPage() {
  if (!convexEnabled) {
    return (
      <div style={{ textAlign: "center", color: "#846b72", padding: "160px 20px" }}>
        <h2>Admin requires a database connection.</h2>
        <p style={{ marginTop: 12, opacity: 0.7 }}>Configure Convex to enable the admin panel.</p>
      </div>
    );
  }
  return <AdminPageInner />;
}

function AdminPageInner() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const tributes = useQuery(api.tributes.getTributes) ?? [];
  const deleteTribute = useMutation(api.tributes.adminDeleteTribute);
  const deleteComment = useMutation(api.tributes.adminDeleteComment);

  // Check if session password is saved
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth_pw");
    if (saved === "Mich777") {
      setPassword(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Mich777") {
      sessionStorage.setItem("admin_auth_pw", password);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect administrator password.");
    }
  };

  const handleDeleteTribute = async (tributeId: any, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the tribute from "${name}"? This will delete all its comments and hearts as well.`)) {
      return;
    }
    try {
      await deleteTribute({ tributeId, password });
    } catch (err: any) {
      alert("Error deleting tribute: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId: any, author: string) => {
    if (!window.confirm(`Are you sure you want to delete ${author}'s comment?`)) {
      return;
    }
    try {
      await deleteComment({ commentId, password });
    } catch (err: any) {
      alert("Error deleting comment: " + err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth_pw");
    setPassword("");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <motion.div 
          className="admin-login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="lock-icon-circle">
            <Lock size={24} />
          </div>
          <h1>Admin Authorization</h1>
          <p>Please enter the administrator password to manage the memorial database.</p>
          
          <form onSubmit={handleLoginSubmit}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-pw-input"
              autoFocus
            />
            {error && <p className="admin-error-text">{error}</p>}
            <button type="submit" className="button admin-submit-btn">
              Unlock Dashboard
            </button>
          </form>

          <a href="/" className="admin-back-link">
            <ArrowLeft size={14} /> Back to Memorial
          </a>
        </motion.div>

        <style jsx global>{`
          .admin-login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9e8ea;
            padding: 20px;
            font-family: 'DM Sans', sans-serif;
          }
          .admin-login-card {
            background: white;
            border-radius: 8px;
            padding: 40px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(125,63,77,.08);
            border: 1px solid rgba(125,63,77,.08);
          }
          .lock-icon-circle {
            width: 56px;
            height: 56px;
            background: #fdf2f4;
            color: #7d3f4d;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .admin-login-card h1 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px;
            color: #4e2b36;
            margin-bottom: 10px;
          }
          .admin-login-card p {
            font-size: 14px;
            color: #846b72;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .admin-pw-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ebcbd0;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 14px;
            outline: none;
            text-align: center;
          }
          .admin-pw-input:focus {
            border-color: #e7aeb8;
            box-shadow: 0 0 0 3px rgba(231,174,184,.18);
          }
          .admin-error-text {
            color: #c0392b;
            font-size: 13px;
            margin: -4px 0 12px;
          }
          .admin-submit-btn {
            width: 100%;
            justify-content: center;
            border-radius: 4px;
          }
          .admin-back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #7d3f4d;
            margin-top: 24px;
            text-decoration: none;
          }
          .admin-back-link:hover {
            color: #4e2b36;
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="header-left">
          <h1>Memorial Database Admin</h1>
          <p>Logged in: Administrator</p>
        </div>
        <div className="header-right">
          <a href="/" className="dashboard-nav-btn back">
            <ArrowLeft size={16} /> View Memorial
          </a>
          <button onClick={handleLogout} className="dashboard-nav-btn logout">
            Lock Panel
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{tributes.length}</h3>
            <p>Total Tributes</p>
          </div>
          <div className="stat-card">
            <h3>{tributes.reduce((acc, t) => acc + t.comments.length, 0)}</h3>
            <p>Total Comments</p>
          </div>
          <div className="stat-card">
            <h3>{tributes.reduce((acc, t) => acc + t.hearts.length, 0)}</h3>
            <p>Total Hearts</p>
          </div>
        </div>

        <div className="tributes-list-panel">
          <h2>Tribute Submissions</h2>
          
          {tributes.length === 0 ? (
            <div className="empty-state">No tributes exist in the database.</div>
          ) : (
            <div className="admin-tribute-grid">
              {tributes.map((tribute) => (
                <div key={tribute.id} className="admin-tribute-row">
                  <div className="row-content-main">
                    <div className="row-tribute-info">
                      <div className="tribute-header-info">
                        <strong>{tribute.name}</strong>
                        <span className="date-badge">
                          {new Date(tribute.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="message-content">"{tribute.message}"</p>
                      
                      {tribute.photoUrl && (
                        <div className="photo-preview-box">
                          <img src={tribute.photoUrl} alt="Thumbnail" />
                          <span>Photo Attached</span>
                        </div>
                      )}

                      <div className="stats-indicator">
                        <span><Heart size={12} fill="#c0392b" stroke="#c0392b" /> {tribute.hearts.length}</span>
                        <span><MessageSquare size={12} /> {tribute.comments.length} comments</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTribute(tribute.id, tribute.name)}
                      className="delete-row-btn"
                      title="Delete Tribute"
                    >
                      <Trash2 size={16} /> Delete Tribute
                    </button>
                  </div>

                  {tribute.comments.length > 0 && (
                    <div className="row-comments-section">
                      <h4>Comments ({tribute.comments.length})</h4>
                      <div className="admin-comments-list">
                        {tribute.comments.map((comment) => (
                          <div key={comment.id} className="admin-comment-row">
                            <div className="comment-info">
                              <strong>{comment.author}</strong>: {comment.text}
                              <span className="comment-time">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id, comment.author)}
                              className="delete-comment-btn"
                              title="Delete Comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .admin-dashboard-container {
          min-height: 100vh;
          background: #faf5f6;
          font-family: 'DM Sans', sans-serif;
          color: #4e2b36;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px 40px;
          border-bottom: 1px solid #ebcbd0;
          box-shadow: 0 2px 10px rgba(125,63,77,.03);
        }
        .admin-header h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          margin: 0;
          font-weight: 700;
        }
        .admin-header p {
          font-size: 12px;
          color: #846b72;
          margin: 3px 0 0;
        }
        .header-right {
          display: flex;
          gap: 12px;
        }
        .dashboard-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dashboard-nav-btn.back {
          background: transparent;
          border: 1px solid #7d3f4d;
          color: #7d3f4d;
        }
        .dashboard-nav-btn.back:hover {
          background: #fdf2f4;
        }
        .dashboard-nav-btn.logout {
          background: #7d3f4d;
          color: white;
        }
        .dashboard-nav-btn.logout:hover {
          background: #4e2b36;
        }
        .admin-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: white;
          border: 1px solid rgba(125,63,77,.06);
          border-radius: 6px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(125,63,77,.02);
        }
        .stat-card h3 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #7d3f4d;
        }
        .stat-card p {
          font-size: 12px;
          color: #846b72;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .tributes-list-panel {
          background: white;
          border: 1px solid rgba(125,63,77,.06);
          border-radius: 6px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(125,63,77,.02);
        }
        .tributes-list-panel h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          margin: 0 0 24px;
        }
        .admin-tribute-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .admin-tribute-row {
          border: 1px solid #f6e6e8;
          border-radius: 6px;
          background: #fafafa;
          overflow: hidden;
        }
        .row-content-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          gap: 30px;
        }
        .row-tribute-info {
          flex: 1;
        }
        .tribute-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .tribute-header-info strong {
          font-size: 16px;
          color: #4e2b36;
        }
        .date-badge {
          font-size: 11px;
          color: #846b72;
          background: #eaeaea;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .message-content {
          font-size: 14px;
          line-height: 1.6;
          color: #533c42;
          margin: 0 0 12px;
          font-style: italic;
        }
        .photo-preview-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #ebcbd0;
          border-radius: 4px;
          padding: 4px 10px;
          margin-bottom: 12px;
        }
        .photo-preview-box img {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 2px;
        }
        .photo-preview-box span {
          font-size: 11px;
          font-weight: 500;
          color: #7d3f4d;
        }
        .stats-indicator {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #846b72;
        }
        .stats-indicator span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .delete-row-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          background: #fdf2f4;
          color: #c0392b;
          border: 1px solid rgba(192,57,43,0.15);
          border-radius: 4px;
          cursor: pointer;
          align-self: center;
          transition: all 0.2s ease;
        }
        .delete-row-btn:hover {
          background: #c0392b;
          color: white;
        }
        .row-comments-section {
          background: #fcfcfc;
          border-top: 1px solid #f6e6e8;
          padding: 16px 20px;
        }
        .row-comments-section h4 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 10px;
          color: #7d3f4d;
        }
        .admin-comments-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .admin-comment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #f0e0e2;
          padding: 8px 14px;
          border-radius: 4px;
        }
        .comment-info {
          font-size: 13px;
          color: #533c42;
        }
        .comment-time {
          font-size: 10px;
          color: #846b72;
          margin-left: 10px;
        }
        .delete-comment-btn {
          background: transparent;
          border: none;
          color: #846b72;
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        .delete-comment-btn:hover {
          background: #fdf2f4;
          color: #c0392b;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #846b72;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 15px;
            padding: 20px;
            text-align: center;
          }
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
          .row-content-main {
            flex-direction: column;
            gap: 15px;
          }
          .delete-row-btn {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
