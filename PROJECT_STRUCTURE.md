# AI Personal Course - Struktur Proyek

## Overview
AI Personal Course adalah aplikasi pembelajaran berbasis AI yang memungkinkan user membuat dan mengikuti kursus yang dipersonalisasi. Aplikasi ini dibangun menggunakan Next.js 15, TypeScript, Tailwind CSS, dan Supabase.

## Struktur Direktori

### 📁 Root Directory
```
ai-personal-course_2/
├── app/                    # Next.js App Router
├── components/             # React Components
├── lib/                    # Utility functions dan konfigurasi
├── hooks/                  # Custom React hooks
├── supabase/              # Database migrations
├── public/                # Static assets
├── styles/                # Global styles
└── [config files]         # Konfigurasi proyek
```

### 📁 `/app` - Next.js App Router
```
app/
├── layout.tsx             # Root layout dengan providers
├── page.tsx               # Landing page
├── globals.css            # Global CSS styles
├── auth/                  # Authentication routes
│   └── callback/          # Supabase auth callback
├── api/                   # API routes
│   ├── youtube/           # YouTube API integration
│   ├── lesson/            # Lesson management
│   └── gemini/            # Gemini AI integration
├── login/                 # Login page
├── register/              # Registration page
└── dashboard/             # Protected dashboard area
    ├── layout.tsx         # Dashboard layout
    ├── page.tsx           # Dashboard home
    ├── settings/          # User settings
    ├── outline/           # Course outline management
    └── course/            # Course content
```

### 📁 `/components` - React Components
```
components/
├── ui/                    # Reusable UI components (shadcn/ui)
│   ├── button.tsx         # Button component
│   ├── input.tsx          # Input component
│   ├── card.tsx           # Card components
│   ├── dialog.tsx         # Dialog/modal components
│   └── [other UI components]
├── lesson/                # Lesson-specific components
│   ├── LessonMainContent.tsx  # Main lesson content
│   ├── LessonAssistant.tsx    # AI chat assistant
│   └── LessonSidebar.tsx      # Lesson navigation
├── navbar.tsx             # Navigation bar
├── sidebar.tsx            # Sidebar navigation
├── theme-provider.tsx     # Theme management
├── theme-toggle.tsx       # Theme toggle component
├── OverlayContext.tsx     # Modal/overlay context
├── SparklesCanvas.tsx     # Background animation
└── FloatingIconsBackground.tsx # Floating icons effect
```

### 📁 `/lib` - Utilities dan Konfigurasi
```
lib/
├── supabase.ts            # Supabase client configuration
├── utils.ts               # General utility functions
├── youtube.ts             # YouTube API utilities
└── utils/                 # Specific utilities
    ├── gemini.ts          # Gemini AI integration
    ├── prompts.ts         # AI prompt templates
    ├── lessonParser.ts    # Markdown to JSON parser
    ├── lessonTypes.ts     # TypeScript type definitions
    ├── jsonUtils.ts       # JSON manipulation utilities
    └── lessonTypes.d.ts   # Type declarations
```

### 📁 `/supabase` - Database
```
supabase/
└── migrations/            # Database migration files
    ├── 20240610_create_learning_platform_schema.sql
    └── 20250609025908_create_learning_platform_tables.sql
```

## Teknologi yang Digunakan

### Frontend
- **Next.js 15** - React framework dengan App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Markdown** - Markdown rendering

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
- **Google Gemini AI** - AI content generation
- **YouTube Data API** - Video integration

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Fitur Utama

### 🔐 Authentication
- Email/password registration dan login
- Supabase Auth integration
- Protected routes dengan middleware

### 📚 Course Management
- AI-powered course outline generation
- Dynamic lesson content creation
- Markdown-based content rendering
- Video integration dengan YouTube

### 🤖 AI Assistant
- Chat interface untuk pertanyaan seputar pelajaran
- Gemini AI integration
- Real-time responses

### 🎨 User Interface
- Responsive design
- Dark/light theme toggle
- Modern UI dengan animations
- Accessible components

### 📱 Mobile Support
- Mobile-first design
- Touch-friendly interface
- Responsive navigation

## Arsitektur Aplikasi

### State Management
- React hooks untuk local state
- Supabase untuk server state
- Context API untuk global state (theme, overlay)

### Data Flow
1. **Authentication** → Supabase Auth
2. **Course Creation** → Gemini AI → Supabase Database
3. **Content Display** → Supabase → React Components
4. **AI Assistant** → User Input → Gemini AI → Response

### API Structure
- `/api/youtube/search` - YouTube video search
- `/api/lesson/insert` - Save lesson content
- `/api/gemini/stream` - AI content generation

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Setup environment variables
4. Run Supabase migrations
5. Start development server: `npm run dev`

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
YOUTUBE_API_KEY=your_youtube_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### Database Schema
- `users` - User profiles
- `settings` - User preferences
- `courses` - Course metadata
- `course_chapters` - Lesson content
- `course_outlines` - Course structure

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Vercel/Netlify untuk frontend
- Supabase untuk backend
- Environment variables configuration

## Contributing

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

### Testing
- Unit tests untuk utilities
- Integration tests untuk API
- E2E tests untuk user flows

## Performance Optimization

### Frontend
- Code splitting dengan Next.js
- Image optimization
- Lazy loading components
- Memoization untuk expensive operations

### Backend
- Database indexing
- API response caching
- CDN for static assets
- Supabase connection pooling

## Security

### Authentication
- JWT tokens dengan Supabase
- Session management
- Route protection

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## Monitoring & Analytics

### Error Tracking
- Console logging
- Error boundaries
- Performance monitoring

### User Analytics
- Page views tracking
- User interaction metrics
- Course completion rates

---

*Dokumentasi ini akan terus diperbarui seiring dengan perkembangan aplikasi.* 