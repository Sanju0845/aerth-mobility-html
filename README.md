# Aerth Mobility Blog System

Free blog management system with Railway deployment - creates actual HTML files!

## Features
- Admin panel with password protection (`aerthadmin123`)
- Create blogs that generate real HTML files
- Blogs are publicly visible to everyone
- SEO optimized with meta tags
- Social sharing buttons

## Railway Deployment (FREE)

### Step 1: Push to GitHub
Already done! Code is at: `https://github.com/Sanju0845/aerth-mobility-html`

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `aerth-mobility-html`
5. Click **"Add Variables"** and add:
   - `ADMIN_PASSWORD` = `aerthadmin123` (or your own)
6. Click **"Deploy"**

### Step 3: Access Your Site
- **Homepage:** `https://your-project.railway.app`
- **Admin Panel:** `https://your-project.railway.app/admin`
- **Published Blogs:** `https://your-project.railway.app/blogs/[slug].html`

## Admin Usage
1. Visit `/admin`
2. Password: `aerthadmin123`
3. Fill blog form → Click **"Publish Blog"**
4. Blog HTML file is created instantly!
5. Everyone can see it at `/blogs/[your-blog-slug].html`

## Local Development
```bash
npm install
npm start
# Open http://localhost:3000/admin
```

## File Structure
```
aerth_with_evxpertz_design/
├── server.js          # Node.js server (creates HTML files)
├── admin-panel.html   # Admin dashboard
├── blogs/             # Generated blog HTML files
│   ├── blogs.json     # Blog metadata
│   └── [slug].html    # Individual blog posts
├── railway.json       # Railway config
└── ...                # Other site files
```

## Why Railway?
- **FREE** tier available
- Can write files (unlike Vercel)
- Real HTML files for SEO
- No build step needed
- Easy GitHub integration
