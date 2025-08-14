# AI Personal Course - System Documentation

## Daftar Isi
1. [Overview Sistem](#overview-sistem)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Fitur Utama](#fitur-utama)
4. [Integrasi API](#integrasi-api)
5. [Database Schema](#database-schema)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Workflow & Business Logic](#workflow--business-logic)
8. [Technical Stack](#technical-stack)
9. [Security & Authentication](#security--authentication)
10. [Error Handling](#error-handling)

---

## Overview Sistem

AI Personal Course adalah platform pembelajaran personal berbasis AI yang memungkinkan pengguna untuk membuat, mengelola, dan mempelajari kursus secara mandiri. Sistem ini menggabungkan teknologi AI, integrasi YouTube, dan manajemen konten pembelajaran yang terstruktur.

### Tujuan Utama
- Menyediakan platform pembelajaran personal yang fleksibel
- Mengintegrasikan AI untuk membantu pembuatan dan pengelolaan kursus
- Memberikan pengalaman belajar yang terpersonalisasi
- Memudahkan pembuatan outline dan lesson yang terstruktur

---

## Arsitektur Sistem

### Frontend Architecture
- **Framework**: Next.js 14 dengan App Router
- **UI Components**: Shadcn/ui dengan Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Routing**: Next.js built-in routing dengan dynamic routes

### Backend Architecture
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime (jika diperlukan)

### AI Integration
- **AI Provider**: Google Gemini AI
- **AI Services**: 
  - Content generation
  - Lesson planning
  - Course optimization
  - Learning path recommendations

---

## Fitur Utama

### 1. User Management
#### Authentication & Authorization
- **User Registration**: 
  - Form registrasi dengan validasi email dan password
  - Verifikasi email otomatis
  - Pembuatan profil otomatis setelah registrasi
  - Redirect ke halaman login setelah registrasi berhasil

- **User Login**:
  - Login dengan email dan password
  - Session management dengan Supabase
  - Remember me functionality
  - Password reset capabilities

- **User Profile**:
  - Manajemen profil pengguna
  - Update informasi personal
  - Avatar management
  - Preference settings

#### User Roles
- **Student**: Pengguna yang belajar kursus
- **Instructor**: Pengguna yang membuat dan mengelola kursus
- **Admin**: Pengguna dengan akses penuh sistem

### 2. Course Management
#### Course Creation
- **Course Builder**:
  - Form pembuatan kursus dengan validasi
  - Upload thumbnail dan materi
  - Kategori dan tag management
  - Visibility settings (public/private)

- **Course Structure**:
  - Hierarchical organization (Course → Outline → Lesson)
  - Flexible lesson ordering
  - Prerequisite management
  - Progress tracking

#### Course Editing
- **Content Management**:
  - Rich text editor untuk deskripsi
  - File upload management
  - Media integration
  - Version control

- **Course Settings**:
  - Enrollment management
  - Completion criteria
  - Assessment settings
  - Certificate generation

### 3. Learning Management
#### Lesson System
- **Lesson Creation**:
  - Structured lesson builder
  - Content type support (text, video, quiz, assignment)
  - Learning objectives
  - Estimated completion time

- **Lesson Delivery**:
  - Progressive disclosure
  - Interactive elements
  - Progress indicators
  - Navigation controls

#### Learning Path
- **Personalized Learning**:
  - AI-driven recommendations
  - Adaptive difficulty
  - Learning style adaptation
  - Progress analytics

### 4. AI Assistant Integration
#### Content Generation
- **AI-Powered Creation**:
  - Automatic lesson outline generation
  - Content suggestions
  - Quiz generation
  - Learning path optimization

- **Smart Recommendations**:
  - Course suggestions based on user behavior
  - Content relevance scoring
  - Difficulty adjustment
  - Learning pace optimization

#### Learning Support
- **Intelligent Tutoring**:
  - Real-time question answering
  - Concept explanation
  - Example generation
  - Practice problem creation

### 5. YouTube Integration
#### Video Management
- **YouTube API Integration**:
  - Video search and discovery
  - Playlist management
  - Video embedding
  - Thumbnail generation

- **Content Curation**:
  - Educational video filtering
  - Quality assessment
  - Relevance scoring
  - Duplicate detection

---

## Integrasi API

### 1. Supabase Integration
#### Authentication API
```typescript
// User Registration
POST /auth/signup
{
  email: string,
  password: string,
  options: {
    data: {
      full_name: string
    }
  }
}

// User Login
POST /auth/signin
{
  email: string,
  password: string
}

// Password Reset
POST /auth/reset-password
{
  email: string
}
```

#### Database API
```typescript
// Course Operations
GET /rest/v1/courses
POST /rest/v1/courses
PUT /rest/v1/courses/{id}
DELETE /rest/v1/courses/{id}

// Lesson Operations
GET /rest/v1/lessons
POST /rest/v1/lessons
PUT /rest/v1/lessons/{id}
DELETE /rest/v1/lessons/{id}

// User Profile Operations
GET /rest/v1/profil
POST /rest/v1/profil
PUT /rest/v1/profil/{id}
```

### 2. Google Gemini AI API
#### Content Generation
```typescript
// Lesson Outline Generation
POST /api/ai/generate-outline
{
  topic: string,
  difficulty: string,
  duration: number,
  learningObjectives: string[]
}

// Content Enhancement
POST /api/ai/enhance-content
{
  content: string,
  targetAudience: string,
  style: string
}

// Quiz Generation
POST /api/ai/generate-quiz
{
  topic: string,
  difficulty: string,
  questionCount: number
}
```

### 3. YouTube Data API v3
#### Video Search & Management
```typescript
// Video Search
GET /api/youtube/search
{
  query: string,
  maxResults: number,
  type: string,
  relevanceLanguage: string
}

// Video Details
GET /api/youtube/video/{videoId}
{
  part: string[],
  id: string
}

// Playlist Management
GET /api/youtube/playlist/{playlistId}
{
  part: string[],
  maxResults: number
}
```

### 4. Custom API Endpoints
#### Course Management
```typescript
// Create Course
POST /api/course/create
{
  title: string,
  description: string,
  category: string,
  difficulty: string,
  thumbnail: File,
  isPublic: boolean
}

// Update Course
PUT /api/course/{id}
{
  title?: string,
  description?: string,
  category?: string,
  difficulty?: string,
  thumbnail?: File,
  isPublic?: boolean
}

// Delete Course
DELETE /api/course/{id}
```

#### Lesson Management
```typescript
// Create Lesson
POST /api/lesson/create
{
  courseId: string,
  title: string,
  content: string,
  order: number,
  type: string,
  duration: number
}

// Update Lesson
PUT /api/lesson/{id}
{
  title?: string,
  content?: string,
  order?: number,
  type?: string,
  duration?: number
}

// Delete Lesson
DELETE /api/lesson/{id}
```

---

## Database Schema

### Core Tables

#### 1. Users Table (Supabase Auth)
```sql
-- Managed by Supabase Auth
auth.users {
  id: uuid (primary key)
  email: string (unique)
  encrypted_password: string
  email_confirmed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

#### 2. Profil Table
```sql
profil {
  id: uuid (primary key, references auth.users.id)
  nama_lengkap: string
  email: string
  avatar_url: string (nullable)
  bio: text (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### 3. Courses Table
```sql
courses {
  id: uuid (primary key)
  title: string
  description: text
  category: string
  difficulty: string
  thumbnail_url: string (nullable)
  is_public: boolean
  instructor_id: uuid (references profil.id)
  created_at: timestamp
  updated_at: timestamp
  status: string (draft, published, archived)
}
```

#### 4. Outlines Table
```sql
outlines {
  id: uuid (primary key)
  course_id: uuid (references courses.id)
  title: string
  description: text
  order: integer
  created_at: timestamp
  updated_at: timestamp
}
```

#### 5. Lessons Table
```sql
lessons {
  id: uuid (primary key)
  outline_id: uuid (references outlines.id)
  title: string
  content: text
  type: string (text, video, quiz, assignment)
  order: integer
  duration: integer (minutes)
  video_url: string (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### 6. User Progress Table
```sql
user_progress {
  id: uuid (primary key)
  user_id: uuid (references profil.id)
  lesson_id: uuid (references lessons.id)
  completed: boolean
  completed_at: timestamp (nullable)
  time_spent: integer (seconds)
  score: integer (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

#### 7. Enrollments Table
```sql
enrollments {
  id: uuid (primary key)
  user_id: uuid (references profil.id)
  course_id: uuid (references courses.id)
  enrolled_at: timestamp
  completed_at: timestamp (nullable)
  status: string (active, completed, dropped)
}
```

### Relationship Diagram
```
Users (1) ←→ (1) Profil
Users (1) ←→ (many) Courses (as instructor)
Users (many) ←→ (many) Courses (through enrollments)
Courses (1) ←→ (many) Outlines
Outlines (1) ←→ (many) Lessons
Users (many) ←→ (many) Lessons (through user_progress)
```

---

## User Roles & Permissions

### 1. Student Role
#### Permissions
- View public courses
- Enroll in courses
- Access enrolled course content
- Track learning progress
- Submit assignments
- Take quizzes
- Generate certificates

#### Restrictions
- Cannot create courses
- Cannot modify course content
- Cannot access other users' progress
- Limited to enrolled courses only

### 2. Instructor Role
#### Permissions
- Create and manage courses
- Upload and edit course content
- Manage student enrollments
- View student progress
- Generate course analytics
- Moderate discussions
- Issue certificates

#### Restrictions
- Cannot modify other instructors' courses
- Cannot access system-wide analytics
- Cannot manage user accounts

### 3. Admin Role
#### Permissions
- Full system access
- User management
- Course moderation
- System analytics
- Content approval
- System configuration
- Backup and restore

---

## Workflow & Business Logic

### 1. User Registration Workflow
```
1. User fills registration form
2. System validates input data
3. System creates Supabase auth account
4. System creates profil record
5. System sends verification email
6. User verifies email
7. User can now login
```

### 2. Course Creation Workflow
```
1. Instructor logs in
2. Instructor navigates to course creation
3. Instructor fills course details
4. System validates course data
5. System creates course record
6. Instructor creates course outline
7. Instructor adds lessons
8. Instructor publishes course
9. Course becomes available for enrollment
```

### 3. Learning Workflow
```
1. Student browses available courses
2. Student enrolls in desired course
3. Student accesses course content
4. Student progresses through lessons
5. System tracks progress
6. Student completes lessons
7. System updates progress
8. Student receives completion certificate
```

### 4. AI Content Generation Workflow
```
1. User requests AI assistance
2. System validates user input
3. System calls Gemini AI API
4. AI generates content
5. System processes AI response
6. System presents generated content
7. User reviews and edits content
8. User saves final content
```

---

## Technical Stack

### Frontend Technologies
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Hooks
- **Routing**: Next.js App Router
- **Icons**: Lucide React

### Backend Technologies
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### AI & External Services
- **AI Provider**: Google Gemini AI
- **Video Platform**: YouTube Data API v3
- **Email Service**: Supabase Auth (built-in)

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git
- **Deployment**: Vercel (recommended)

---

## Security & Authentication

### 1. Authentication Security
- **Password Requirements**: Minimum 6 characters
- **Email Verification**: Required for account activation
- **Session Management**: Secure token-based sessions
- **Password Reset**: Secure email-based reset process

### 2. Data Security
- **Row Level Security (RLS)**: Implemented in Supabase
- **Data Encryption**: At rest and in transit
- **API Security**: Rate limiting and input validation
- **File Upload Security**: Type and size validation

### 3. Access Control
- **Role-Based Access Control (RBAC)**: User, Instructor, Admin
- **Resource Ownership**: Users can only access their own data
- **Course Privacy**: Public/private course settings
- **Content Protection**: Unauthorized access prevention

---

## Error Handling

### 1. Client-Side Error Handling
- **Form Validation**: Real-time input validation
- **API Error Handling**: User-friendly error messages
- **Network Error Handling**: Offline state management
- **Validation Errors**: Field-specific error display

### 2. Server-Side Error Handling
- **API Error Responses**: Standardized error format
- **Database Error Handling**: Connection and query error management
- **External API Error Handling**: Fallback mechanisms
- **Logging**: Comprehensive error logging

### 3. User Experience
- **Error Messages**: Clear and actionable error descriptions
- **Loading States**: Visual feedback during operations
- **Retry Mechanisms**: Automatic retry for transient failures
- **Fallback Content**: Alternative content when primary fails

---

## Performance & Scalability

### 1. Frontend Optimization
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component
- **Caching**: Browser and CDN caching strategies
- **Lazy Loading**: Component and route lazy loading

### 2. Backend Optimization
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis or in-memory caching
- **CDN**: Static asset delivery optimization

### 3. API Performance
- **Rate Limiting**: Prevent API abuse
- **Response Caching**: Cache frequently requested data
- **Pagination**: Efficient data retrieval
- **Compression**: Gzip compression for responses

---

## Monitoring & Analytics

### 1. System Monitoring
- **Performance Metrics**: Response times, throughput
- **Error Tracking**: Error rates and types
- **User Analytics**: Usage patterns and behavior
- **System Health**: Database, API, and service status

### 2. Learning Analytics
- **Progress Tracking**: Individual and course-level progress
- **Engagement Metrics**: Time spent, completion rates
- **Learning Path Analysis**: Optimal learning sequences
- **Content Performance**: Most effective content types

---

## Deployment & DevOps

### 1. Environment Configuration
- **Development**: Local development setup
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### 2. Deployment Process
- **Build Process**: Automated build and testing
- **Deployment Strategy**: Blue-green or rolling deployment
- **Rollback Plan**: Quick rollback capabilities
- **Monitoring**: Post-deployment monitoring

### 3. Infrastructure
- **Hosting**: Vercel (recommended) or self-hosted
- **Database**: Supabase managed PostgreSQL
- **File Storage**: Supabase Storage
- **CDN**: Global content delivery

---

## Future Enhancements

### 1. Planned Features
- **Mobile App**: React Native mobile application
- **Offline Support**: Offline content access
- **Advanced AI**: More sophisticated AI tutoring
- **Social Learning**: Peer-to-peer learning features

### 2. Technical Improvements
- **Microservices**: Service-oriented architecture
- **Real-time Collaboration**: Live collaborative features
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: Internationalization

---

## Conclusion

Dokumentasi ini memberikan gambaran lengkap tentang sistem AI Personal Course, termasuk fitur-fitur, integrasi API, arsitektur, dan aspek teknis lainnya. Informasi ini dapat digunakan untuk membuat diagram UML yang akurat dan komprehensif, termasuk:

- **Use Case Diagram**: Menunjukkan aktor dan use case utama
- **Class Diagram**: Merepresentasikan struktur data dan relasi
- **Activity Diagram**: Menggambarkan workflow dan business logic
- **Sequence Diagram**: Menunjukkan interaksi antar komponen sistem

Sistem ini dirancang dengan arsitektur modern, menggunakan teknologi terbaru, dan mengintegrasikan AI untuk memberikan pengalaman pembelajaran yang optimal bagi pengguna.
