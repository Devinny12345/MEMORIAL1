"use client";
import { Heart, MessageCircleHeart, Camera, X, MessageSquare, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { ScrollFrameSequence } from "./ScrollFrameSequence";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const reveal = { initial: { opacity: 0, y: 25 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .18 }, transition: { duration: .7 } };

// ── Session ID helper for anonymous hearts ───────────────────────────────
function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("memorial_session_id");
  if (!id) {
    id = "sess-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
    localStorage.setItem("memorial_session_id", id);
  }
  return id;
}

// ── Default starter photos for the photo wall ─────────────────────────────
const defaultPhotos = [
  { url: "/moments-1.jpg", caption: "Forever loved", author: "Family", tribute: null },
  { url: "/Main.jpg", caption: "Beautiful memories", author: "Family", tribute: null }
];

// ── Shared Horizontal Mini-Timeline ──────────────────────────────────────
function MiniTimeline() {
  return (
    <div className="hero-timeline">
      <div className="hero-tl-node">
        <div className="hero-tl-dot">
          <svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4" fill="#111111"/></svg>
        </div>
        <div className="hero-tl-label">
          <span className="hero-tl-date">May 29, 1985</span>
          <span className="hero-tl-caption">Born</span>
        </div>
      </div>
      <div className="hero-tl-line">
        <div className="hero-tl-line-fill" />
      </div>
      <div className="hero-tl-node">
        <div className="hero-tl-dot hero-tl-dot--heart">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 17s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 4.65-7 9-7 9z" fill="#c0392b"/></svg>
        </div>
        <div className="hero-tl-label hero-tl-label--center">
          <span className="hero-tl-caption hero-tl-caption--life">A life of love</span>
        </div>
      </div>
      <div className="hero-tl-line">
        <div className="hero-tl-line-fill hero-tl-line-fill--delayed" />
      </div>
      <div className="hero-tl-node">
        <div className="hero-tl-dot">
          <svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4" fill="#111111"/></svg>
        </div>
        <div className="hero-tl-label hero-tl-label--right">
          <span className="hero-tl-date">July 17, 2015</span>
          <span className="hero-tl-caption">Forever cherished</span>
        </div>
      </div>
    </div>
  );
}

// ── Individual Tribute Card ──────────────────────────────────────────────
interface TributeCardProps {
  tribute: {
    id: any;
    name: string;
    message: string;
    photoUrl?: string;
    createdAt: string;
    comments: Array<{
      id: any;
      author: string;
      text: string;
      createdAt: string;
    }>;
    hearts: string[];
  };
  sessionId: string;
  onPhotoClick?: () => void;
}

function TributeCard({ tribute, sessionId, onPhotoClick }: TributeCardProps) {
  const toggleHeart = useMutation(api.tributes.toggleHeart);
  const addComment = useMutation(api.tributes.addComment);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasHearted = tribute.hearts.includes(sessionId);
  const heartsCount = tribute.hearts.length;

  const handleHeartClick = async () => {
    try {
      await toggleHeart({
        tributeId: tribute.id,
        sessionId,
      });
    } catch (e) {
      console.error("Failed to toggle heart:", e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentText.trim()) return;
    setIsSubmitting(true);

    try {
      await addComment({
        tributeId: tribute.id,
        author: commentAuthor.trim(),
        text: commentText.trim(),
      });
      setCommentText("");
    } catch (e) {
      console.error("Failed to submit comment:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className={`tribute-card ${tribute.photoUrl ? "has-image" : "text-only"}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {tribute.photoUrl && (
        <div className="tribute-card-img" onClick={(e) => { e.stopPropagation(); onPhotoClick?.(); }} style={{ cursor: 'zoom-in', position: 'relative' }}>
          <img src={tribute.photoUrl} alt={`Shared by ${tribute.name}`} />
          <div className="tribute-photo-expand-hint">
            <Maximize2 size={16} />
            <span>Click to expand</span>
          </div>
        </div>
      )}
      <div className="tribute-card-body">
        <p className="tribute-card-text">"{tribute.message}"</p>
        <div className="tribute-card-meta">
          <span className="tribute-card-author">— {tribute.name}</span>
          <span className="tribute-card-date">
            {new Date(tribute.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Action Bar (Hearts and Comments count) */}
        <div className="tribute-card-actions">
          <button
            onClick={handleHeartClick}
            className={`action-btn heart-btn ${hasHearted ? "active" : ""}`}
            aria-label="Heart this tribute"
          >
            <Heart size={15} fill={hasHearted ? "currentColor" : "none"} />
            <span>{heartsCount}</span>
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`action-btn comment-btn ${isCommentsOpen ? "active" : ""}`}
            aria-label="Toggle comments"
          >
            <MessageSquare size={15} />
            <span>{tribute.comments.length}</span>
          </button>
        </div>

        {/* Expandable Comments Dropdown */}
        <AnimatePresence initial={false}>
          {isCommentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="comments-dropdown"
            >
              {/* Existing Comments List */}
              {tribute.comments.length > 0 && (
                <div className="comments-list">
                  {tribute.comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <strong className="comment-author">{comment.author}</strong>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="add-comment-form">
                <input
                  type="text"
                  placeholder="Your name"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  required
                  className="comment-input author-input"
                />
                <div className="comment-submit-row">
                  <textarea
                    placeholder="Write a message..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    rows={1}
                    className="comment-input text-input"
                  />
                  <button type="submit" disabled={isSubmitting} className="comment-submit-btn">
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Full Content rendering when Convex is running ────────────────────────
function MemorialPageWithConvex() {
  const tributes = useQuery(api.tributes.getTributes) ?? [];
  const generateUploadUrl = useMutation(api.tributes.generateUploadUrl);
  const addTribute = useMutation(api.tributes.addTribute);
  const toggleHeart = useMutation(api.tributes.toggleHeart);
  const addComment = useMutation(api.tributes.addComment);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [activePhoto, setActivePhoto] = useState<{ url: string; caption: string; author: string; tribute: any } | null>(null);
  const [lightboxAuthor, setLightboxAuthor] = useState("");
  const [lightboxText, setLightboxText] = useState("");
  const [isSubmittingLightboxComment, setIsSubmittingLightboxComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const seedDefaults = useMutation(api.tributes.seedDefaults);

  useEffect(() => {
    setSessionId(getSessionId());
    seedDefaults().catch((e) => console.error("Failed to seed default tributes:", e));
  }, [seedDefaults]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setIsSubmitting(true);

    try {
      let storageId: string | undefined;

      if (photo) {
        // 1. Get a short-lived upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // 2. PUT the file directly to Convex Storage
        const result = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": photo.type },
          body: photo,
        });
        const { storageId: sid } = await result.json();
        storageId = sid;
      }

      // 3. Save the tribute record
      await addTribute({
        name: name.trim(),
        message: message.trim(),
        storageId: storageId as any,
      });

      setName("");
      setMessage("");
      removePhoto();
    } catch (err) {
      console.error("Error submitting tribute:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLightboxHeartClick = async (liveTribute: any) => {
    if (!liveTribute) return;
    try {
      await toggleHeart({
        tributeId: liveTribute.id,
        sessionId,
      });
    } catch (e) {
      console.error("Failed to toggle heart from lightbox:", e);
    }
  };

  const handleLightboxCommentSubmit = async (e: React.FormEvent, liveTribute: any) => {
    e.preventDefault();
    if (!lightboxAuthor.trim() || !lightboxText.trim() || !liveTribute) return;
    setIsSubmittingLightboxComment(true);

    try {
      await addComment({
        tributeId: liveTribute.id,
        author: lightboxAuthor.trim(),
        text: lightboxText.trim(),
      });
      lightboxText === "" ? null : setLightboxText("");
    } catch (e) {
      console.error("Failed to submit comment from lightbox:", e);
    } finally {
      setIsSubmittingLightboxComment(false);
    }
  };

  // Compile photos for the photo wall (database images prepended to default starter ones)
  const dbPhotos = tributes
    .filter((t) => t.photoUrl)
    .map((t) => ({
      url: t.photoUrl!,
      caption: t.message,
      author: t.name,
      tribute: t,
    }));

  const defaultPhotos = [
    { url: "/moments-1.jpg", caption: "A moment we will always cherish.", author: "Family", tribute: null },
    { url: "/Main.jpg", caption: "In loving memory.", author: "Family", tribute: null },
  ];

  const allPhotos = [...dbPhotos, ...defaultPhotos.filter((dp) => !dbPhotos.some((db) => db.url === dp.url))];

  // Resolve the live tribute from tributes array so heart/comments update in real-time inside lightbox
  const liveTribute = activePhoto?.tribute
    ? tributes.find((t) => t.id === activePhoto.tribute.id)
    : null;

  return (
    <>
      <header className="memorial-nav">
        <a className="mark" href="#top">In loving memory</a>
        <nav>
          <a href="#life">Her life</a>
          <a href="#memories">Memories</a>
        </nav>
        <a className="nav-memory" href="#tribute">Share a memory</a>
      </header>

      <main>
        <ScrollFrameSequence>
          <section className="hero-memorial" id="top">
            <motion.div
              className="portrait-area"
              initial={{ opacity: 0, scale: .96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .9, delay: .15 }}
            >
              <div className="frame-wrapper">
                <div className="portrait-frame">
                  <img src="/Main.jpg" alt="Portrait of Michellie Starr Waight" className="portrait-img" />
                </div>
                <img src="/frame.png" alt="" className="portrait-frame-overlay" aria-hidden="true" />
              </div>
              <div className="portrait-identity">
                <h1 className="portrait-name"><em>Michellie Starr Waight</em></h1>
                <div className="name-divider-container" aria-hidden="true">
                  <svg viewBox="0 0 200 20" className="name-divider-svg">
                    <path d="M 0 10 L 80 10 C 90 10, 94 4, 98 4 C 100 4, 100 10, 100 10 C 100 10, 100 16, 102 16 C 106 16, 110 10, 120 10 L 200 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M 100 4 L 103 10 L 100 16 L 97 10 Z" fill="currentColor" />
                  </svg>
                </div>
                
                {/* Hero Timeline */}
                <MiniTimeline />
                
                <p className="portrait-tagline">Forever in our hearts</p>
              </div>
            </motion.div>

            <a className="scroll-note" href="#life">Scroll to remember</a>
          </section>
        </ScrollFrameSequence>

        <section className="life-intro" id="life">
          <div className="section">
            <motion.div className="intro-grid" {...reveal}>
              <div>
                <p className="section-kicker">A life remembered</p>
                <h2>Her story was told in <em>love.</em></h2>
              </div>
              <p>Michellie Starr Waight brought warmth, kindness, and a bright spirit to everyone fortunate enough to know her. This space is a small gathering place for the stories that made her so unforgettable.</p>
            </motion.div>
            <div className="vert-timeline">
              <div className="vert-timeline-track" aria-hidden="true" />
              {[
                { year: "1985", title: "A beautiful beginning", text: "Born May 29th into a family who adored her. From the very first moment, she filled every room with warmth.", icon: "✦" },
                { year: "Growing up", title: "A life of purpose", text: "A season of growing, giving, and finding her way — a chapter written with grace, curiosity, and kindness.", icon: "❀" },
                { year: "Always", title: "So much joy", text: "A life full of the people and moments she loved most. Every day she chose love, and everyone around her felt it.", icon: "♡" },
                { year: "Forever", title: "Forever cherished", text: "Her love continues in every heart she touched. She lives on in laughter, in memory, and in the love she left behind.", icon: "✦" },
              ].map(({ year, title, text, icon }, i) => (
                <motion.div
                  className="vert-timeline-entry"
                  key={`vtl-${i}`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.75, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="vert-timeline-node">
                    <motion.div
                      className="vert-timeline-dot"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 + 0.3 }}
                    >
                      <span className="vert-timeline-icon">{icon}</span>
                    </motion.div>
                    <div className="vert-timeline-connector" />
                  </div>
                  <div className={`vert-timeline-card ${i % 2 === 0 ? 'vert-timeline-card--left' : 'vert-timeline-card--right'}`}>
                    <span className="vert-timeline-year">{year}</span>
                    <h3 className="vert-timeline-title">{title}</h3>
                    <p className="vert-timeline-text">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Photo Wall Section */}
        <section className="section" id="memories">
          <motion.div className="gallery-head" {...reveal}>
            <div>
              <p className="section-kicker">A collection of moments</p>
              <h2>Remembering her <em>beautifully.</em></h2>
            </div>
            <p>Every photograph holds a little piece of her laughter, her light, and the life she shared with us.</p>
          </motion.div>
          
          <motion.div className="photo-wall-grid" {...reveal}>
            {allPhotos.map((photoItem, index) => (
              <motion.div 
                key={index} 
                className="photo-wall-item"
                whileHover={{ scale: 1.03 }}
                onClick={() => setActivePhoto(photoItem)}
              >
                <img src={photoItem.url} alt={photoItem.caption} className="photo-wall-img" />
                <div className="photo-wall-overlay">
                  <span className="overlay-author">{photoItem.author}</span>
                  <span className="overlay-caption">"{photoItem.caption.length > 60 ? photoItem.caption.substring(0, 57) + "..." : photoItem.caption}"</span>
                  <Maximize2 size={16} className="overlay-zoom-icon" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="tribute-section" id="tribute">
          <div className="section">
            <motion.div className="tribute-head" {...reveal}>
              <p className="section-kicker">Share a tribute</p>
              <h2>Keep her memory <em>close.</em></h2>
              <p>If you have a favourite story, a treasured photo, or a few words to share, we would love to carry them here with us.</p>
            </motion.div>

            {/* Interactive Upload Form */}
            <motion.div className="tribute-form-container" {...reveal}>
              <form onSubmit={handleSubmit} className="tribute-form">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Your Memory or Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message, share a memory..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Add a Photograph (Optional)</label>
                  <div className="file-upload-zone">
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      ref={fileInputRef}
                      className="hidden-file-input"
                    />
                    
                    {!photoPreview ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="upload-trigger-btn"
                      >
                        <Camera size={20} />
                        <span>Choose Photo</span>
                      </button>
                    ) : (
                      <div className="upload-preview-container">
                        <img src={photoPreview} alt="Preview" className="upload-preview-img" />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="remove-preview-btn"
                          title="Remove photo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="button tribute-submit-btn" disabled={isSubmitting}>
                  <MessageCircleHeart size={18} />
                  <span>{isSubmitting ? "Adding to Memorial..." : "Share Memory"}</span>
                </button>
              </form>
            </motion.div>

            {/* Memory Board Grid */}
            {tributes.length > 0 && (
              <div className="memory-board">
                <p className="section-kicker centered">Shared Memories</p>
                <div className="memory-board-grid">
                  {tributes.map((tribute) => (
                    <TributeCard
                      key={tribute.id as string}
                      tribute={tribute as any}
                      sessionId={sessionId}
                      onPhotoClick={tribute.photoUrl ? () => setActivePhoto({ url: tribute.photoUrl!, caption: tribute.message, author: tribute.name, tribute }) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section about-person">
          <motion.div {...reveal} className="about-content">
            <p className="section-kicker">With gratitude</p>
            <h2>Thank you for holding her in your <em>hearts.</em></h2>
            <p>Your presence, your messages, and the memories you share mean more than words can say. May we continue to find comfort in one another and in the beautiful imprint she left on our lives.</p>
            <p className="signoff"><Heart size={16} fill="currentColor" /> With love, her family</p>
          </motion.div>
        </section>

        {/* Bottom Timeline Section (mirrors the Hero) */}
        <section className="section bottom-timeline-section">
          <div className="bottom-timeline-wrapper">
            <p className="section-kicker">Her Legacy</p>
            <MiniTimeline />
          </div>
        </section>

        <footer className="footer-memorial">
          <a href="#top" className="mark footer-mark-two-lines">
            In loving memory of<br />
            Michellie Starr Waight
          </a>
          <small>Forever loved. Forever remembered.</small>
        </footer>
      </main>

      {/* Lightbox — full-bleed photo with overlay heart + comment */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="lb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setActivePhoto(null); setShowComments(false); }}
          >
            <button className="lb-close" onClick={() => { setActivePhoto(null); setShowComments(false); }} aria-label="Close">
              <X size={24} />
            </button>

            <motion.div
              className="lb-photo-wrap"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={activePhoto.url} alt={activePhoto.caption} className="lb-photo" />

              {/* Bottom toolbar */}
              <div className="lb-toolbar">
                {liveTribute ? (
                  <>
                    <button
                      className={`lb-tool-btn ${liveTribute.hearts.includes(sessionId) ? "hearted" : ""}`}
                      onClick={() => handleLightboxHeartClick(liveTribute)}
                    >
                      <Heart size={18} fill={liveTribute.hearts.includes(sessionId) ? "currentColor" : "none"} />
                      <span>{liveTribute.hearts.length}</span>
                    </button>
                    <button
                      className={`lb-tool-btn ${showComments ? "active" : ""}`}
                      onClick={() => setShowComments(v => !v)}
                    >
                      <MessageCircleHeart size={18} />
                      <span>{liveTribute.comments.length}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="lb-tool-btn" onClick={() => setShowComments(v => !v)}>
                      <Heart size={18} />
                      <span>0</span>
                    </button>
                    <button className="lb-tool-btn" onClick={() => setShowComments(v => !v)}>
                      <MessageCircleHeart size={18} />
                      <span>0</span>
                    </button>
                  </>
                )}
                <div className="lb-caption-tag">
                  <span className="lb-author">{activePhoto.author}</span>
                  <span className="lb-caption-text">{activePhoto.caption}</span>
                </div>
              </div>
            </motion.div>

            {/* Comment slide-up panel */}
            <AnimatePresence>
              {showComments && liveTribute && (
                <motion.div
                  className="lb-comments-panel"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lb-comments-header">
                    <h4>Comments ({liveTribute.comments.length})</h4>
                    <button className="lb-comments-close" onClick={() => setShowComments(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="lb-comments-list">
                    {liveTribute.comments.length === 0 ? (
                      <p className="lb-comments-empty">Be the first to share a warm word.</p>
                    ) : (
                      liveTribute.comments.map((comment: any) => (
                        <div key={comment.id} className="lb-comment-item">
                          <div className="lb-comment-meta">
                            <strong>{comment.author}</strong>
                            <span>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={(e) => handleLightboxCommentSubmit(e, liveTribute)} className="lb-comment-form">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={lightboxAuthor}
                      onChange={(e) => setLightboxAuthor(e.target.value)}
                      required
                      className="lb-input"
                    />
                    <div className="lb-comment-row">
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={lightboxText}
                        onChange={(e) => setLightboxText(e.target.value)}
                        required
                        className="lb-input lb-input-text"
                      />
                      <button type="submit" disabled={isSubmittingLightboxComment} className="lb-send-btn">
                        Send
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* ── Full-bleed lightbox ──────────────────────────────────────── */
        .lb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(16,10,12,.94);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
        }
        .lb-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,.12);
          border: none;
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1020;
          transition: background .2s;
        }
        .lb-close:hover { background: rgba(255,255,255,.25); }
        .lb-photo-wrap {
          position: relative;
          max-width: 92vw;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: default;
        }
        .lb-photo {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 20px 60px rgba(0,0,0,.5);
          display: block;
        }
        .lb-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          padding: 10px 18px;
          background: rgba(255,255,255,.1);
          border-radius: 30px;
          backdrop-filter: blur(6px);
        }
        .lb-tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255,255,255,.7);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 20px;
          transition: color .2s, background .2s;
        }
        .lb-tool-btn:hover { color: #fff; background: rgba(255,255,255,.12); }
        .lb-tool-btn.hearted { color: #e74c3c; }
        .lb-tool-btn.active { color: #fff; background: rgba(255,255,255,.18); }
        .lb-caption-tag {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: 8px;
          padding-left: 12px;
          border-left: 1px solid rgba(255,255,255,.2);
        }
        .lb-author {
          font-size: 11px;
          color: rgba(255,255,255,.5);
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .lb-caption-text {
          font-size: 12px;
          color: rgba(255,255,255,.75);
          max-width: 260px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* ── Comments slide-up panel ──────────────────────────────────── */
        .lb-comments-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 55vh;
          background: #fff;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -8px 30px rgba(0,0,0,.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1010;
        }
        .lb-comments-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px 14px;
          border-bottom: 1px solid #f0e0e3;
        }
        .lb-comments-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--wine);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .lb-comments-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color .2s;
        }
        .lb-comments-close:hover { color: var(--wine); }
        .lb-comments-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lb-comments-empty {
          color: var(--muted);
          font-size: 14px;
          font-style: italic;
          text-align: center;
          padding: 20px 0;
        }
        .lb-comment-item {
          background: rgba(125,63,77,.02);
          border: 1px solid rgba(125,63,77,.06);
          border-radius: 8px;
          padding: 12px 16px;
        }
        .lb-comment-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
        }
        .lb-comment-meta strong { color: var(--plum); }
        .lb-comment-meta span { color: var(--muted); }
        .lb-comment-item p {
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          color: var(--ink);
        }
        .lb-comment-form {
          padding: 16px 24px 20px;
          border-top: 1px solid #f0e0e3;
          background: var(--paper);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lb-input {
          width: 100%;
          border: 1px solid #ebcbd0;
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 13px;
          outline: none;
          background: #fff;
        }
        .lb-input:focus {
          border-color: var(--petal);
          box-shadow: 0 0 0 2px rgba(231,174,184,.15);
        }
        .lb-comment-row {
          display: flex;
          gap: 8px;
        }
        .lb-input-text { flex: 1; }
        .lb-send-btn {
          background: var(--wine);
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s;
        }
        .lb-send-btn:hover { background: var(--plum); }
        .lb-send-btn:disabled { background: var(--petal); cursor: not-allowed; }

        @media (max-width: 640px) {
          .lb-photo { max-height: 60vh; border-radius: 4px; }
          .lb-toolbar { flex-wrap: wrap; justify-content: center; }
          .lb-caption-tag { display: none; }
          .lb-comments-panel { max-height: 65vh; }
        }

        /* ── Tribute Card Photo Expand Hint ─────────────────────────── */
        .tribute-card-img {
          position: relative;
          overflow: hidden;
        }
        .tribute-photo-expand-hint {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(16, 10, 12, 0.55);
          backdrop-filter: blur(2px);
          color: white;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 2;
        }
        .tribute-card-img:hover .tribute-photo-expand-hint {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

// ── Main Page Export ─────────────────────────────────────────────────────
export function MemorialPage() {
  const convexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  if (convexConfigured) {
    return <MemorialPageWithConvex />;
  }

  return <MemorialPageStatic />;
}

function MemorialPageStatic() {
  const defaultPhotos = [
    { url: "/moments-1.jpg", caption: "A moment we will always cherish.", author: "Family" },
    { url: "/Main.jpg", caption: "In loving memory.", author: "Family" },
  ];
  const [activePhoto, setActivePhoto] = useState<{ url: string; caption: string; author: string } | null>(null);

  return (
    <>
      <header className="memorial-nav">
        <a className="mark" href="#top">In loving memory</a>
        <nav>
          <a href="#life">Her life</a>
          <a href="#memories">Memories</a>
        </nav>
        <a className="nav-memory" href="#tribute">Share a memory</a>
      </header>

      <main>
        <ScrollFrameSequence>
          <section className="hero-memorial" id="top">
            <motion.div
              className="portrait-area"
              initial={{ opacity: 0, scale: .96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: .9, delay: .15 }}
            >
              <div className="frame-wrapper">
                <div className="portrait-frame">
                  <img src="/Main.jpg" alt="Portrait of Michellie Starr Waight" className="portrait-img" />
                </div>
                <img src="/frame.png" alt="" className="portrait-frame-overlay" aria-hidden="true" />
              </div>
              <div className="portrait-identity">
                <h1 className="portrait-name"><em>Michellie Starr Waight</em></h1>
                <div className="name-divider-container" aria-hidden="true">
                  <svg viewBox="0 0 200 20" className="name-divider-svg">
                    <path d="M 0 10 L 80 10 C 90 10, 94 4, 98 4 C 100 4, 100 10, 100 10 C 100 10, 100 16, 102 16 C 106 16, 110 10, 120 10 L 200 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M 100 4 L 103 10 L 100 16 L 97 10 Z" fill="currentColor" />
                  </svg>
                </div>
                <MiniTimeline />
                <p className="portrait-tagline">Forever in our hearts</p>
              </div>
            </motion.div>
            <a className="scroll-note" href="#life">Scroll to remember</a>
          </section>
        </ScrollFrameSequence>

        <section className="life-intro" id="life">
          <div className="section">
            <motion.div className="intro-grid" {...reveal}>
              <div>
                <p className="section-kicker">A life remembered</p>
                <h2>Her story was told in <em>love.</em></h2>
              </div>
              <p>Michellie Starr Waight brought warmth, kindness, and a bright spirit to everyone fortunate enough to know her. This space is a small gathering place for the stories that made her so unforgettable.</p>
            </motion.div>
            <div className="vert-timeline">
              <div className="vert-timeline-track" aria-hidden="true" />
              {[
                { year: "1985", title: "A beautiful beginning", text: "Born May 29th into a family who adored her. From the very first moment, she filled every room with warmth.", icon: "✦" },
                { year: "Growing up", title: "A life of purpose", text: "A season of growing, giving, and finding her way — a chapter written with grace, curiosity, and kindness.", icon: "❀" },
                { year: "Always", title: "So much joy", text: "A life full of the people and moments she loved most. Every day she chose love, and everyone around her felt it.", icon: "♡" },
                { year: "Forever", title: "Forever cherished", text: "Her love continues in every heart she touched. She lives on in laughter, in memory, and in the love she left behind.", icon: "✦" },
              ].map(({ year, title, text, icon }, i) => (
                <motion.div
                  className="vert-timeline-entry"
                  key={`vtl-${i}`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.75, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="vert-timeline-node">
                    <motion.div
                      className="vert-timeline-dot"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 + 0.3 }}
                    >
                      <span className="vert-timeline-icon">{icon}</span>
                    </motion.div>
                    <div className="vert-timeline-connector" />
                  </div>
                  <div className={`vert-timeline-card ${i % 2 === 0 ? 'vert-timeline-card--left' : 'vert-timeline-card--right'}`}>
                    <span className="vert-timeline-year">{year}</span>
                    <h3 className="vert-timeline-title">{title}</h3>
                    <p className="vert-timeline-text">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="memories">
          <motion.div className="gallery-head" {...reveal}>
            <div>
              <p className="section-kicker">A collection of moments</p>
              <h2>Remembering her <em>beautifully.</em></h2>
            </div>
            <p>Every photograph holds a little piece of her laughter, her light, and the life she shared with us.</p>
          </motion.div>
          <motion.div className="photo-wall-grid" {...reveal}>
            {defaultPhotos.map((photoItem, index) => (
              <motion.div
                key={index}
                className="photo-wall-item"
                whileHover={{ scale: 1.03 }}
                onClick={() => setActivePhoto(photoItem)}
              >
                <img src={photoItem.url} alt={photoItem.caption} className="photo-wall-img" />
                <div className="photo-wall-overlay">
                  <span className="overlay-author">{photoItem.author}</span>
                  <span className="overlay-caption">"{photoItem.caption}"</span>
                  <Maximize2 size={16} className="overlay-zoom-icon" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="tribute-section" id="tribute">
          <div className="section">
            <motion.div className="tribute-head" {...reveal}>
              <p className="section-kicker">Share a tribute</p>
              <h2>Keep her memory <em>close.</em></h2>
              <p>If you have a favourite story, a treasured photo, or a few words to share, we would love to carry them here with us.</p>
            </motion.div>
          </div>
        </section>

        <section className="section about-person">
          <motion.div {...reveal} className="about-content">
            <p className="section-kicker">With gratitude</p>
            <h2>Thank you for holding her in your <em>hearts.</em></h2>
            <p>Your presence, your messages, and the memories you share mean more than words can say. May we continue to find comfort in one another and in the beautiful imprint she left on our lives.</p>
            <p className="signoff"><Heart size={16} fill="currentColor" /> With love, her family</p>
          </motion.div>
        </section>

        <section className="section bottom-timeline-section">
          <div className="bottom-timeline-wrapper">
            <p className="section-kicker">Her Legacy</p>
            <MiniTimeline />
          </div>
        </section>

        <footer className="footer-memorial">
          <a href="#top" className="mark footer-mark-two-lines">
            In loving memory of<br />
            Michellie Starr Waight
          </a>
          <small>Forever loved. Forever remembered.</small>
        </footer>
      </main>

      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="lb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
          >
            <button className="lb-close" onClick={() => setActivePhoto(null)} aria-label="Close">
              <X size={24} />
            </button>
            <motion.div
              className="lb-photo-wrap"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={activePhoto.url} alt={activePhoto.caption} className="lb-photo" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
