# ExHub - AI-Powered Learning Platform

**ExHub** is an AI-powered Progressive Web App that revolutionizes learning through personalized study plans, intelligent quizzes, flashcards, and community-driven education.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app running.

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Setup Guide](docs/SETUP.md)** - Detailed installation and configuration
- **[Architecture](docs/ARCHITECTURE.md)** - Project structure and technical decisions  
- **[API Reference](docs/API.md)** - Edge function endpoints and usage
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Testing](tests/README.md)** - Testing strategy and guidelines

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Approach](#-approach)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Setup Instructions](#-setup-instructions)
- [Environment Configuration](#-environment-configuration)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [License](#-license)

## 🎯 Problem Statement

Modern learners face several critical challenges:

- **Fragmented Resources**: Study materials are scattered across multiple platforms, making it difficult to maintain organized learning paths
- **Lack of Personalization**: Traditional study methods don't adapt to individual learning styles, preferences, or pace
- **Inefficient Time Management**: Students struggle to create effective study schedules that align with their goals and available time
- **Limited Engagement**: Conventional learning lacks gamification and motivation systems to maintain consistency
- **Isolation in Learning**: Self-directed learners miss out on collaborative learning and peer support
- **Content Overload**: Lengthy documents and materials are time-consuming to digest without proper summarization tools

## 💡 Approach

ExHub addresses these challenges through an integrated AI-powered solution:

### Personalization Engine
- Assesses individual learning styles (visual, auditory, kinesthetic)
- Adapts content difficulty based on user performance
- Creates customized study schedules aligned with personal goals

### AI-Powered Content Generation
- **Study Plans**: Generates personalized learning schedules using Lovable AI Gateway
- **Quiz Generation**: Automatically creates practice questions from uploaded materials
- **Smart Summarization**: Condenses lengthy documents into digestible summaries
- **Flashcard Creation**: Produces spaced-repetition optimized flashcards from content

### Gamification & Motivation
- XP points and achievement system for consistent engagement
- Study streak tracking to build sustainable habits
- Leaderboards for friendly competition

### Community Learning
- Study groups for collaborative learning
- Content sharing and peer support
- Expert Q&A for guidance

## ✨ Features

- **AI Study Plans**: Personalized schedules with Lovable AI
- **Smart Quizzes**: AI-generated questions from your materials
- **Flashcards**: Spaced repetition with AI generation
- **Document Summarization**: Convert lengthy PDFs and documents into concise summaries
- **Gamification**: XP, achievements, and study streaks
- **Community**: Study groups and content sharing
- **Progress Analytics**: Detailed insights into learning patterns
- **PWA Support**: Install as mobile app with offline capabilities

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn/ui components
- React Router for navigation
- TanStack Query for data fetching

**Backend:**
- Supabase (PostgreSQL database, authentication, storage)
- Supabase Edge Functions (serverless API endpoints)
- Lovable AI Gateway (Gemini + GPT-5 integration)

**AI Integration:**
- OpenAI Whisper for audio transcription
- Lovable AI for content generation, summarization, and quiz creation

**DevOps:**
- Vite PWA for Progressive Web App features
- Service Workers for offline functionality

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Lovable account (for AI features)

### Step 1: Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd exhub
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Apply database migrations:
   ```bash
   npx supabase db push
   ```
3. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy
   ```

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory (see [Environment Configuration](#-environment-configuration))

### Step 5: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Only needed if deploying edge functions locally
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### How to Get These Values

1. **Supabase URL & Anon Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon/public" key

2. **Lovable AI Gateway**:
   - The AI features use Lovable Cloud's built-in AI gateway
   - No additional API keys needed for basic AI functionality
   - Lovable AI is automatically configured when using Lovable Cloud

### Edge Function Environment Variables

Edge functions require additional secrets set in Supabase:

```bash
# Set Lovable AI API key (if using custom key)
npx supabase secrets set LOVABLE_API_KEY=your_lovable_api_key

# Set OpenAI API key (for Whisper transcription)
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

## 📖 Usage Guide

### 1. Getting Started

**Create an Account:**
1. Open ExHub and click "Sign Up"
2. Enter your email and password or use social login
3. Complete the onboarding flow:
   - Learning style assessment
   - Set your goals
   - Configure notification preferences

### 2. Creating a Study Plan

1. Navigate to "Study Plans" from the bottom navigation
2. Click "Create New Plan"
3. Enter:
   - Subject/topic
   - Goal type (exam prep, skill development, etc.)
   - Available study time per day
   - Target completion date
4. Review the AI-generated plan
5. Start your first study session

### 3. Generating Quizzes

1. Go to "Quizzes" section
2. Click "Generate Quiz"
3. Choose input method:
   - Upload a document (PDF, DOCX)
   - Paste text content
   - Select a topic
4. Set difficulty level and question count
5. Review and take the quiz

### 4. Creating Flashcards

1. Navigate to "Flashcards"
2. Click "Create Deck"
3. Options:
   - Manual entry (front/back)
   - AI generation from content
   - Bulk import from CSV
4. Study using spaced repetition

### 5. Summarizing Documents

1. Go to "Summarize" section
2. Upload a PDF or text document
3. Click "Summarize"
4. Review the AI-generated summary
5. Save or share the summary

### 6. Joining the Community

1. Visit "Community" tab
2. Browse study groups by subject
3. Join relevant groups
4. Share resources and participate in discussions

## 🧪 Testing

### Basic Functionality Tests

**1. Authentication Test:**
```bash
# Test user registration and login
1. Open the app
2. Click "Sign Up"
3. Create a test account
4. Verify email confirmation
5. Log in with credentials
```

**2. Study Plan Generation Test:**
```bash
1. Navigate to Study Plans
2. Click "Create New Plan"
3. Fill in: Subject="JavaScript", Goal="Exam Prep", Time="2 hours/day"
4. Verify AI generates a structured plan
5. Check that sessions are properly scheduled
```

**3. Quiz Generation Test:**
```bash
1. Go to Quizzes → Generate Quiz
2. Paste sample text: "React is a JavaScript library for building user interfaces"
3. Set difficulty to "Medium" and 5 questions
4. Click "Generate"
5. Verify questions are relevant to the content
```

**4. Document Summarization Test:**
```bash
1. Navigate to Summarize page
2. Upload a sample PDF document
3. Click "Summarize"
4. Verify summary is generated successfully
5. Check that summary captures key points
```

**5. Flashcard Creation Test:**
```bash
1. Go to Flashcards → Create Deck
2. Add 3 manual cards with front/back content
3. Save the deck
4. Enter study mode
5. Verify card flip animation and rating system work
```

**6. PWA Installation Test:**
```bash
1. Open app in Chrome/Edge
2. Look for "Install App" prompt
3. Click install
4. Verify app opens as standalone application
5. Test offline functionality by disabling network
```

### Edge Function Tests

Test individual edge functions using curl or Supabase dashboard:

```bash
# Test summarize-content function
curl -X POST 'https://your-project.supabase.co/functions/v1/summarize-content' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Sample content to summarize"}'
```

## 🔗 Additional Resources

- [Lovable Docs](https://docs.lovable.dev) - Lovable platform documentation
- [Supabase Docs](https://supabase.com/docs) - Supabase backend documentation

## 🚀 Deployment

### Deploy to Lovable Cloud

1. Click "Publish" in [Lovable](https://lovable.dev/projects/791efb3c-3dd8-4600-b77f-561f4949be23)
2. Verify environment variables are set
3. Test the deployed application
4. Optionally configure a custom domain

### Manual Deployment

For detailed deployment instructions including custom domains, rollback procedures, and monitoring, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Support

For support and questions:
- Check the [Help section](https://docs.lovable.dev)
- Join our [Discord community](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

Built with ❤️ using [Lovable](https://lovable.dev)
