const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Admin password
const ADMIN_PASSWORD = 'aerthadmin123';

// Blog HTML template
const getBlogTemplate = (blog) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  
  <title>${escapeHtml(blog.title)} | Aerth Mobility Blog</title>
  <meta name="description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta name="keywords" content="Aerth Mobility, EV blog, ${escapeHtml(blog.category || '')}">
  <meta name="author" content="${escapeHtml(blog.author || 'Aerth Mobility')}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#f2f2f5">
  
  <link rel="canonical" href="https://aerthmobility.com/blogs/${blog.slug}.html">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(blog.title)}">
  <meta property="og:description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta property="og:image" content="${escapeHtml(blog.featuredImage || 'evx-s.png')}">
  <meta property="og:url" content="https://aerthmobility.com/blogs/${blog.slug}.html">
  <meta property="og:site_name" content="Aerth Mobility">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(blog.title)}">
  <meta name="twitter:description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta name="twitter:image" content="${escapeHtml(blog.featuredImage || 'evx-s.png')}">
  
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="../evx.css">    
  <link rel="icon" href="../evx.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="../evx.ico">
  
  <style>
  /* ── Blog Article Layout ── */
  .bp { max-width: 780px; margin: 0 auto; padding: 5.5rem 1.5rem 4rem; }

  /* ── Breadcrumb ── */
  .bp-crumbs {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    font-size: 0.82rem; color: var(--text-dim); margin-bottom: 2rem;
  }
  .bp-crumbs a { color: var(--neon-blue); text-decoration: none; font-weight: 600; }
  .bp-crumbs a:hover { text-decoration: underline; }

  /* ── Hero ── */
  .bp-hero { margin-bottom: 2.5rem; text-align: center; }
  .bp-category {
    display: inline-block; padding: 4px 14px; border-radius: 999px;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: #fff; margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-green));
  }
  .bp-title {
    font-size: clamp(1.6rem, 4.5vw, 2.5rem); font-weight: 800;
    line-height: 1.15; letter-spacing: -0.02em; color: var(--text);
    margin: 0 0 0.5rem;
  }
  .bp-subtitle {
    font-size: 1.05rem; color: var(--text-muted); margin: 0 0 1.5rem; line-height: 1.55;
  }
  .bp-meta-bar {
    display: flex; align-items: center; justify-content: center;
    gap: 1.5rem; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-dim);
  }
  .bp-meta-item { display: flex; align-items: center; gap: 5px; }

  /* Featured image */
  .bp-featured {
    position: relative; border-radius: var(--radius); overflow: hidden;
    margin-bottom: 2.5rem; box-shadow: var(--shadow);
  }
  .bp-featured img {
    width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover;
  }

  /* ── Article content ── */
  .bp-content { min-width: 0; }
  .bp-content h2 {
    font-size: 1.4rem; font-weight: 800; color: var(--text);
    margin: 2rem 0 0.75rem; line-height: 1.25; letter-spacing: -0.01em;
  }
  .bp-content h2::before {
    content: ''; display: inline-block; width: 4px; height: 1.1em;
    background: linear-gradient(180deg, var(--neon-blue), var(--neon-green));
    border-radius: 4px; margin-right: 10px; vertical-align: text-bottom;
  }
  .bp-content p {
    font-size: 1rem; line-height: 1.8; color: var(--text-muted); margin: 0 0 1.25rem;
  }
  .bp-content ul { margin: 0 0 1.25rem; padding-left: 0; list-style: none; }
  .bp-content li {
    position: relative; padding-left: 1.5rem; margin-bottom: 0.5rem;
    font-size: 0.95rem; line-height: 1.7; color: var(--text-muted);
  }
  .bp-content li::before {
    content: ''; position: absolute; left: 0; top: 0.55em;
    width: 7px; height: 7px; border-radius: 50%;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-green));
  }

  /* ── Author card ── */
  .bp-author {
    display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
    border-radius: var(--radius); background: var(--bg-glass);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    margin: 2.5rem 0;
  }
  .bp-author-img {
    width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
    border: 2px solid var(--neon-blue); box-shadow: 0 0 12px var(--neon-blue-glow);
  }
  .bp-author-name { font-size: 0.95rem; font-weight: 700; color: var(--text); margin: 0; }
  .bp-author-role { font-size: 0.78rem; color: var(--text-dim); margin: 0 0 0.25rem; }

  /* ── Share bar ── */
  .bp-share {
    display: flex; align-items: center; gap: 0.75rem; margin: 2rem 0;
    padding: 1rem; border-radius: var(--radius); background: var(--bg-glass);
    border: 1px solid var(--border);
  }
  .bp-share-label { font-size: 0.82rem; font-weight: 700; color: var(--text-dim); white-space: nowrap; }
  .bp-share a {
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; background: var(--bg-card); border: 1px solid var(--border);
    color: var(--text-dim); transition: all 0.25s;
  }
  .bp-share a:hover { border-color: var(--neon-blue); color: var(--neon-blue); transform: translateY(-2px); }

  /* ── Back to blog link ── */
  .bp-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.88rem; font-weight: 700; color: var(--neon-blue); text-decoration: none;
    margin-top: 2rem; transition: gap 0.3s;
  }
  .bp-back:hover { gap: 10px; }
  </style>
</head>
<body>
  <header class="header" id="header">
    <div class="header-inner">
      <a href="../index.html" class="logo" aria-label="Aerth Mobility Home">
        <span class="logo-ring" aria-hidden="true"></span>
        <img src="../evx-s.png" alt="Aerth Mobility" class="logo-img" />
        <span class="logo-text">
          <img src="../evx-h-d.png" alt="Aerth Mobility" class="inline-logo">
          <span class="logo-tagline">Your Trusted EV Partner</span>
        </span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <a href="../services.html">Services</a>
        <a href="../spare-parts.html">Spare Parts</a>
        <a href="../franchise.html">Franchise</a>
        <a href="../locations.html">Locations</a>
        <a href="../about.html">About</a>
        <a href="../contact.html">Contact</a>
        <a href="../blogs.html" class="active">Blog</a>
      </nav>
      <a href="https://wa.me/918279773212" class="header-phone">+91 82797 73212</a>
      <button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false">
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
      </button>
    </div>
  </header>

  <main>
    <article class="bp">
      <nav class="bp-crumbs" aria-label="Breadcrumb">
        <a href="../blogs.html">Blog</a>
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span>${escapeHtml(blog.title)}</span>
      </nav>

      <div class="bp-hero">
        <span class="bp-category">${escapeHtml(blog.category || 'General')}</span>
        <h1 class="bp-title">${escapeHtml(blog.title)}</h1>
        ${blog.subtitle ? `<p class="bp-subtitle">${escapeHtml(blog.subtitle)}</p>` : ''}
        <div class="bp-meta-bar">
          <span class="bp-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4" stroke-width="2"/></svg>
            ${escapeHtml(blog.author || 'Aerth Mobility')}
          </span>
          <span class="bp-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke-width="2"/><path stroke-width="2" d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${formatDate(blog.publishedDate)}
          </span>
          <span class="bp-meta-item">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" d="M12 6v6l4 2"/></svg>
            ${blog.readingTimeMinutes || 5} min read
          </span>
        </div>
      </div>

      ${blog.featuredImage ? `
      <div class="bp-featured">
        <img src="${escapeHtml(blog.featuredImage)}" alt="${escapeHtml(blog.title)}" onerror="this.style.display='none'">
      </div>` : ''}

      <div class="bp-content">
        ${formatContent(blog.content)}
      </div>

      <div class="bp-author">
        <img class="bp-author-img" src="../evx-s.png" alt="${escapeHtml(blog.author || '')}">
        <div class="bp-author-info">
          <p class="bp-author-name">${escapeHtml(blog.author || 'Aerth Mobility')}</p>
          <p class="bp-author-role">Author at Aerth Mobility</p>
        </div>
      </div>

      <div class="bp-share">
        <span class="bp-share-label">Share</span>
        <a href="https://wa.me/?text=${encodeURIComponent(blog.title)}%20https://aerthmobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.158-.156.298-.347.446-.52.174-.204.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.284-.68-.572-.588-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.19-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.67-.347z"/></svg>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=https://aerthmobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="X/Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aerthmobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
        </a>
        <a href="mailto:?subject=${encodeURIComponent(blog.title)}&body=https://aerthmobility.com/blogs/${blog.slug}.html" aria-label="Email">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline stroke-width="2" points="22,6 12,13 2,6"/></svg>
        </a>
      </div>

      <a href="../blogs.html" class="bp-back">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to all articles
      </a>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="../evx-h.png" alt="Aerth Mobility" class="footer-logo" />
        <p class="editable footer-tagline">Your Trusted EV Partner</p>
        <p class="editable footer-address">India : Rudrapur | New Delhi (Functional Centers)<br>India : Ghaziabad | Pune | Bangalore (Upcoming Centers)</p>
      </div>
      <nav class="footer-nav" aria-label="Footer navigation">
        <a href="../services.html">Services</a>
        <a href="../spare-parts.html">Spare Parts</a>
        <a href="../franchise.html">Franchise</a>
        <a href="../locations.html">Locations</a>
        <a href="../about.html">About</a>
        <a href="../contact.html">Contact</a>
        <a href="../blogs.html">Blog</a>
      </nav>
      <div class="footer-right">
        <a href="https://wa.me/918279773212" class="footer-phone">+91 82797 73212</a>
        <a href="mailto:support@aerthmobility.com" class="footer-email">support@aerthmobility.com</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="editable footer-copy">&copy; 2026 Aerth Mobility. All rights reserved.</p>
    </div>
  </footer>

  <script src="../evx.js"></script>
</body>
</html>`;

// Helper functions
function escapeHtml(text) {
  const div = { toString: () => '' };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatContent(content) {
  if (!content) return '<p>No content available.</p>';
  
  // Simple formatting: convert newlines to paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map(p => {
    if (p.startsWith('# ')) {
      return `<h2>${escapeHtml(p.substring(2))}</h2>`;
    } else if (p.startsWith('## ')) {
      return `<h3>${escapeHtml(p.substring(3))}</h3>`;
    } else if (p.startsWith('- ') || p.startsWith('* ')) {
      const items = p.split('\n').filter(l => l.trim());
      return `<ul>${items.map(item => `<li>${escapeHtml(item.replace(/^[-*]\s*/, ''))}</li>`).join('')}</ul>`;
    } else if (p.startsWith('> ')) {
      return `<blockquote>${escapeHtml(p.substring(2))}</blockquote>`;
    } else {
      return `<p>${escapeHtml(p)}</p>`;
    }
  }).join('');
}

// API: Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// ═══════════════════════════════════════════════════════════════
// Voice of Trust API Endpoints
// ═══════════════════════════════════════════════════════════════

const VOT_DATA_FILE = path.join(__dirname, 'data', 'voice-of-trust.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load Voice of Trust entries
function loadVOTEntries() {
  ensureDataDir();
  if (fs.existsSync(VOT_DATA_FILE)) {
    return JSON.parse(fs.readFileSync(VOT_DATA_FILE, 'utf8'));
  }
  return { entries: [] };
}

// Save Voice of Trust entries
function saveVOTEntries(data) {
  ensureDataDir();
  fs.writeFileSync(VOT_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// API: Get all Voice of Trust entries
app.get('/api/voice-of-trust', (req, res) => {
  try {
    const data = loadVOTEntries();
    res.json(data.entries || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add new Voice of Trust entry
app.post('/api/voice-of-trust', (req, res) => {
  const { password, entry } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!entry || !entry.videoUrl || !entry.personName) {
    return res.status(400).json({ success: false, error: 'Video URL and person name required' });
  }
  
  try {
    const data = loadVOTEntries();
    
    const newEntry = {
      id: entry.id || 'vot-' + Date.now(),
      videoUrl: entry.videoUrl,
      personName: entry.personName,
      title: entry.title || '',
      business: entry.business || '',
      location: entry.location || '',
      quote: entry.quote || '',
      publishedDate: entry.publishedDate || new Date().toISOString().split('T')[0]
    };
    
    // Add to beginning
    data.entries.unshift(newEntry);
    saveVOTEntries(data);
    
    res.json({ 
      success: true, 
      message: 'Voice of Trust entry added successfully!',
      entry: newEntry
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Update Voice of Trust entry
app.put('/api/voice-of-trust/:id', (req, res) => {
  const { password, entry } = req.body;
  const { id } = req.params;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const data = loadVOTEntries();
    const index = data.entries.findIndex(e => e.id === id);
    
    if (index === -1) {
      // Entry not found - create it as new (upsert behavior)
      const newEntry = {
        id: id,
        videoUrl: entry.videoUrl,
        personName: entry.personName,
        title: entry.title || '',
        business: entry.business || '',
        location: entry.location || '',
        quote: entry.quote || '',
        publishedDate: entry.publishedDate || new Date().toISOString().split('T')[0]
      };
      data.entries.unshift(newEntry);
      saveVOTEntries(data);
      
      return res.json({ 
        success: true, 
        message: 'Voice of Trust entry created successfully!',
        entry: newEntry
      });
    }
    
    data.entries[index] = { ...data.entries[index], ...entry, id };
    saveVOTEntries(data);
    
    res.json({ 
      success: true, 
      message: 'Voice of Trust entry updated successfully!',
      entry: data.entries[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete Voice of Trust entry
app.delete('/api/voice-of-trust/:id', (req, res) => {
  const { password } = req.body;
  const { id } = req.params;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const data = loadVOTEntries();
    data.entries = data.entries.filter(e => e.id !== id);
    saveVOTEntries(data);
    
    res.json({ success: true, message: 'Voice of Trust entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Blog Management API Endpoints
// ═══════════════════════════════════════════════════════════════

console.log('Loading blog API endpoints...');

const BLOGS_FILE = path.join(__dirname, 'data', 'blogs.json');
console.log('BLOGS_FILE:', BLOGS_FILE);

// Ensure blogs data file exists
function ensureBlogsFile() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(BLOGS_FILE)) {
    fs.writeFileSync(BLOGS_FILE, JSON.stringify({ blogs: [] }, null, 2));
  }
}

ensureBlogsFile();

// Load blogs from file
function loadBlogs() {
  try {
    console.log('Loading blogs from:', BLOGS_FILE);
    const data = fs.readFileSync(BLOGS_FILE, 'utf8');
    console.log('File content length:', data.length);
    const parsed = JSON.parse(data);
    console.log('Loaded blogs:', parsed.blogs.length);
    return parsed;
  } catch (error) {
    console.error('Error loading blogs:', error.message);
    return { blogs: [] };
  }
}

// Save blogs to file
function saveBlogs(data) {
  fs.writeFileSync(BLOGS_FILE, JSON.stringify(data, null, 2));
}

// API: Get all blogs (public)
app.get('/api/blogs', (req, res) => {
  console.log('GET /api/blogs called');
  console.log('BLOGS_FILE path:', BLOGS_FILE);
  try {
    const data = loadBlogs();
    console.log('Returning blogs:', data.blogs.length);
    res.json(data.blogs);
  } catch (error) {
    console.error('Error in GET /api/blogs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Get single blog by slug (public)
app.get('/api/blogs/:slug', (req, res) => {
  try {
    const data = loadBlogs();
    const blog = data.blogs.find(b => b.slug === req.params.slug);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add new blog
app.post('/api/blogs', (req, res) => {
  const { password, blog } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  if (!blog || !blog.title || !blog.slug) {
    return res.status(400).json({ success: false, error: 'Title and slug required' });
  }
  
  try {
    const data = loadBlogs();
    
    // Check for duplicate slug
    if (data.blogs.find(b => b.slug === blog.slug)) {
      return res.status(400).json({ success: false, error: 'Blog with this slug already exists' });
    }
    
    const newBlog = {
      id: blog.id || 'blog-' + Date.now(),
      slug: blog.slug,
      title: blog.title,
      subtitle: blog.subtitle || '',
      category: blog.category || 'General',
      author: blog.author || '',
      featuredImage: blog.featuredImage || '',
      content: blog.content || '',
      tags: blog.tags || [],
      readingTimeMinutes: blog.readingTimeMinutes || 5,
      publishedDate: blog.publishedDate || new Date().toISOString().split('T')[0],
      status: blog.status || 'published'
    };
    
    data.blogs.unshift(newBlog);
    saveBlogs(data);
    
    res.json({ 
      success: true, 
      message: 'Blog created successfully!',
      blog: newBlog
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Update blog
app.put('/api/blogs/:slug', (req, res) => {
  const { password, blog } = req.body;
  const { slug } = req.params;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const data = loadBlogs();
    const index = data.blogs.findIndex(b => b.slug === slug);
    
    if (index === -1) {
      // Blog not found - create it as new (upsert behavior)
      const newBlog = {
        id: blog.id || 'blog-' + Date.now(),
        slug: slug,
        title: blog.title || '',
        subtitle: blog.subtitle || '',
        category: blog.category || 'General',
        author: blog.author || '',
        featuredImage: blog.featuredImage || '',
        content: blog.content || '',
        tags: blog.tags || [],
        readingTimeMinutes: blog.readingTimeMinutes || 5,
        publishedDate: blog.publishedDate || new Date().toISOString().split('T')[0],
        status: blog.status || 'published'
      };
      data.blogs.unshift(newBlog);
      saveBlogs(data);
      
      return res.json({ 
        success: true, 
        message: 'Blog created successfully!',
        blog: newBlog
      });
    }
    
    data.blogs[index] = { ...data.blogs[index], ...blog, slug, id: data.blogs[index].id };
    saveBlogs(data);
    
    res.json({ 
      success: true, 
      message: 'Blog updated successfully!',
      blog: data.blogs[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete blog
app.delete('/api/blogs/:slug', (req, res) => {
  const { password } = req.body;
  const { slug } = req.params;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const data = loadBlogs();
    data.blogs = data.blogs.filter(b => b.slug !== slug);
    saveBlogs(data);
    
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Aerth Blog Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});

module.exports = app;
