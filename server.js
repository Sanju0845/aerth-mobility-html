const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'aerthadmin123';
const BLOGS_DIR = path.join(__dirname, 'blogs');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Ensure blogs directory exists
if (!fs.existsSync(BLOGS_DIR)) {
  fs.mkdirSync(BLOGS_DIR, { recursive: true });
}

// Admin authentication middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Generate blog HTML template
function generateBlogHTML(blog) {
  const date = new Date(blog.publishedDate || new Date());
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Convert content to HTML
  const contentHTML = blog.content
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      if (p.startsWith('# ')) return `<h2>${escapeHtml(p.substring(2))}</h2>`;
      if (p.startsWith('## ')) return `<h3>${escapeHtml(p.substring(3))}</h3>`;
      if (p.startsWith('- ') || p.startsWith('* ')) {
        const items = p.split('\n').filter(l => l.trim());
        return `<ul>${items.map(item => `<li>${escapeHtml(item.replace(/^[-*]\s*/, ''))}</li>`).join('')}</ul>`;
      }
      if (p.startsWith('> ')) return `<blockquote>${escapeHtml(p.substring(2))}</blockquote>`;
      return `<p>${escapeHtml(p)}</p>`;
    })
    .join('');

  const tagsHTML = (blog.tags || []).map(tag => 
    `<span class="bp-tag">${escapeHtml(tag)}</span>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  
  <title>${escapeHtml(blog.title)} | Aerth Mobility Blog</title>
  <meta name="description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta name="keywords" content="${(blog.tags || []).join(', ')}, Aerth Mobility, EV blog">
  <meta name="author" content="${escapeHtml(blog.author || 'Aerth Mobility')}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#f2f2f5">
  
  <link rel="canonical" href="https://aerth-mobility.com/blogs/${blog.slug}.html">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(blog.title)}">
  <meta property="og:description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta property="og:image" content="${blog.featuredImage || 'evx-s.png'}">
  <meta property="og:url" content="https://aerth-mobility.com/blogs/${blog.slug}.html">
  <meta property="og:site_name" content="Aerth Mobility">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(blog.title)}">
  <meta name="twitter:description" content="${escapeHtml(blog.subtitle || blog.excerpt || '')}">
  <meta name="twitter:image" content="${blog.featuredImage || 'evx-s.png'}">
  
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../evx.css">    
  <link rel="icon" href="../evx.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="../evx.ico">
  
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-10969700287');
  </script>
  
  <style>
    /* ── Blog Article Layout ── */
    .bp { max-width: 780px; margin: 0 auto; padding: 6rem 1.5rem 4rem; }
    
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
      font-size: clamp(1.8rem, 4.5vw, 2.8rem); font-weight: 800;
      line-height: 1.15; letter-spacing: -0.02em; color: var(--text);
      margin: 0 0 0.5rem;
    }
    .bp-subtitle {
      font-size: 1.1rem; color: var(--text-muted); margin: 0 0 1.5rem; line-height: 1.6;
    }
    .bp-meta-bar {
      display: flex; align-items: center; justify-content: center;
      gap: 1.5rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-dim);
    }
    .bp-meta-item { display: flex; align-items: center; gap: 5px; }
    
    /* Featured image */
    .bp-featured {
      position: relative; border-radius: var(--radius-lg); overflow: hidden;
      margin-bottom: 2.5rem; box-shadow: var(--shadow);
    }
    .bp-featured img {
      width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover;
    }
    
    /* ── Article content ── */
    .bp-content { min-width: 0; }
    .bp-content h2 {
      font-size: 1.5rem; font-weight: 800; color: var(--text);
      margin: 2.5rem 0 1rem; line-height: 1.3; letter-spacing: -0.01em;
    }
    .bp-content h2::before {
      content: ''; display: inline-block; width: 4px; height: 1.1em;
      background: linear-gradient(180deg, var(--neon-blue), var(--neon-green));
      border-radius: 4px; margin-right: 12px; vertical-align: text-bottom;
    }
    .bp-content h3 {
      font-size: 1.2rem; font-weight: 700; color: var(--text);
      margin: 2rem 0 0.75rem;
    }
    .bp-content p {
      font-size: 1.05rem; line-height: 1.9; color: var(--text-muted); margin: 0 0 1.5rem;
    }
    .bp-content ul {
      margin: 0 0 1.5rem; padding-left: 0; list-style: none;
    }
    .bp-content li {
      position: relative; padding-left: 1.75rem; margin-bottom: 0.75rem;
      font-size: 1rem; line-height: 1.8; color: var(--text-muted);
    }
    .bp-content li::before {
      content: ''; position: absolute; left: 0; top: 0.6em;
      width: 8px; height: 8px; border-radius: 50%;
      background: linear-gradient(135deg, var(--neon-blue), var(--neon-green));
    }
    
    /* Tags */
    .bp-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 2rem 0; }
    .bp-tag {
      padding: 6px 14px; border-radius: 999px; font-size: 0.8rem;
      font-weight: 600; background: rgba(0,148,255,0.08); color: var(--neon-blue);
      border: 1px solid rgba(0,148,255,0.15);
    }
    
    /* Blockquote */
    .bp-content blockquote {
      margin: 2rem 0; padding: 1.25rem 1.5rem; border-radius: var(--radius);
      background: rgba(0,148,255,0.05); border-left: 4px solid var(--neon-blue);
      font-style: italic; color: var(--text-muted); font-size: 1.05rem;
    }
    
    /* ── Author card ── */
    .bp-author {
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
      border-radius: var(--radius-lg); background: var(--bg-glass);
      backdrop-filter: blur(14px); border: 1px solid var(--border);
      box-shadow: var(--shadow); margin: 3rem 0;
    }
    .bp-author-img {
      width: 60px; height: 60px; border-radius: 50%; object-fit: cover;
      border: 2px solid var(--neon-blue); box-shadow: 0 0 12px var(--neon-blue-glow);
    }
    .bp-author-name { font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; }
    .bp-author-role { font-size: 0.85rem; color: var(--text-dim); margin: 0; }
    
    /* ── Share bar ── */
    .bp-share {
      display: flex; align-items: center; gap: 1rem; margin: 2rem 0;
      padding: 1rem; border-radius: var(--radius); background: var(--bg-glass);
      border: 1px solid var(--border);
    }
    .bp-share-label { font-size: 0.9rem; font-weight: 700; color: var(--text-dim); }
    .bp-share a {
      width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-dim); transition: all 0.25s;
    }
    .bp-share a:hover { border-color: var(--neon-blue); color: var(--neon-blue); transform: translateY(-2px); }
    
    /* ── Back to blog link ── */
    .bp-back {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.95rem; font-weight: 700; color: var(--neon-blue); text-decoration: none;
      margin-top: 2rem; transition: gap 0.3s; padding: 0.75rem 1.25rem;
      background: var(--bg-glass); border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .bp-back:hover { gap: 12px; background: var(--bg-elevated); }
    
    /* Responsive */
    @media (max-width: 640px) {
      .bp { padding: 5rem 1rem 3rem; }
      .bp-title { font-size: 1.6rem; }
    }
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
        <span class="bp-category">${escapeHtml(blog.category || 'Blog')}</span>
        <h1 class="bp-title">${escapeHtml(blog.title)}</h1>
        ${blog.subtitle ? `<p class="bp-subtitle">${escapeHtml(blog.subtitle)}</p>` : ''}
        <div class="bp-meta-bar">
          <span class="bp-meta-item">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4" stroke-width="2"/></svg>
            ${escapeHtml(blog.author || 'Aerth Mobility')}
          </span>
          <span class="bp-meta-item">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke-width="2"/><path stroke-width="2" d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${dateStr}
          </span>
          <span class="bp-meta-item">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" d="M12 6v6l4 2"/></svg>
            ${blog.readingTimeMinutes || '5'} min read
          </span>
        </div>
      </div>

      ${blog.featuredImage ? `
      <div class="bp-featured">
        <img src="${blog.featuredImage}" alt="${escapeHtml(blog.title)}" loading="lazy">
      </div>
      ` : ''}

      <div class="bp-content">
        ${contentHTML}
      </div>

      ${tagsHTML ? `<div class="bp-tags">${tagsHTML}</div>` : ''}

      <div class="bp-author">
        <img class="bp-author-img" src="../evx-s.png" alt="${escapeHtml(blog.author || '')}">
        <div class="bp-author-info">
          <p class="bp-author-name">${escapeHtml(blog.author || 'Aerth Mobility')}</p>
          <p class="bp-author-role">Author at Aerth Mobility</p>
        </div>
      </div>

      <div class="bp-share">
        <span class="bp-share-label">Share this article:</span>
        <a href="https://wa.me/?text=${encodeURIComponent(blog.title)}%20https://aerth-mobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="WhatsApp">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.156.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.19-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.107-1.132l-.29-.174-3.01.79.804-2.938-.191-.303A8 8 0 1112 20z"/></svg>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=https://aerth-mobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="X/Twitter">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://aerth-mobility.com/blogs/${blog.slug}.html" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
        </a>
        <a href="mailto:?subject=${encodeURIComponent(blog.title)}&body=https://aerth-mobility.com/blogs/${blog.slug}.html" aria-label="Email">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline stroke-width="2" points="22,6 12,13 2,6"/></svg>
        </a>
      </div>

      <a href="../blogs.html" class="bp-back">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to all articles
      </a>
    </article>
  </main>

  <script src="../evx.js"></script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Blog API is running' });
});

// Get all blogs
app.get('/api/blogs', (req, res) => {
  const blogsFile = path.join(__dirname, 'blogs', 'blogs.json');
  if (fs.existsSync(blogsFile)) {
    const data = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
    res.json(data);
  } else {
    res.json({ blogs: [] });
  }
});

// Create new blog (admin only)
app.post('/api/blogs', requireAdmin, (req, res) => {
  const blog = req.body;
  
  if (!blog.title || !blog.slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }
  
  // Generate HTML file
  const htmlContent = generateBlogHTML(blog);
  const filePath = path.join(BLOGS_DIR, `${blog.slug}.html`);
  
  try {
    fs.writeFileSync(filePath, htmlContent);
    
    // Update blogs.json
    const blogsFile = path.join(__dirname, 'blogs', 'blogs.json');
    let data = { blogs: [] };
    if (fs.existsSync(blogsFile)) {
      data = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
    }
    
    // Check if blog already exists
    const existingIndex = data.blogs.findIndex(b => b.slug === blog.slug);
    if (existingIndex >= 0) {
      data.blogs[existingIndex] = blog;
    } else {
      data.blogs.unshift(blog);
    }
    
    fs.writeFileSync(blogsFile, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Blog created successfully',
      url: `/blogs/${blog.slug}.html`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog (admin only)
app.delete('/api/blogs/:slug', requireAdmin, (req, res) => {
  const { slug } = req.params;
  const filePath = path.join(BLOGS_DIR, `${slug}.html`);
  
  try {
    // Delete HTML file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update blogs.json
    const blogsFile = path.join(__dirname, 'blogs', 'blogs.json');
    if (fs.existsSync(blogsFile)) {
      const data = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
      data.blogs = data.blogs.filter(b => b.slug !== slug);
      fs.writeFileSync(blogsFile, JSON.stringify(data, null, 2));
    }
    
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Blog API server running on port ${PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});

module.exports = app;
