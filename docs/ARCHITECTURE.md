# ExHub - Architecture Documentation

## Project Structure

```
exhub/
├── src/                        # Frontend application
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── calendar/         # Calendar integration
│   │   ├── community/        # Community features
│   │   ├── focus/            # Focus timer components
│   │   ├── layout/           # Layout components (Nav, etc.)
│   │   └── ui/               # Shadcn UI components
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── ThemeProvider.tsx # Theme management
│   ├── hooks/                # Custom React hooks
│   ├── integrations/         # Third-party integrations
│   │   └── supabase/         # Supabase client & types
│   ├── lib/                  # Utility functions
│   │   ├── errorHandling.ts
│   │   ├── validation.ts
│   │   └── utils.ts
│   ├── pages/                # Route pages
│   │   ├── onboarding/       # Onboarding flow
│   │   ├── quizzes/          # Quiz management
│   │   ├── flashcards/       # Flashcard features
│   │   ├── study-plans/      # Study plan management
│   │   └── community/        # Community pages
│   └── main.tsx              # Application entry point
├── supabase/                  # Backend configuration
│   ├── functions/            # Edge functions (serverless)
│   │   ├── generate-quiz/
│   │   ├── generate-flashcards/
│   │   ├── generate-study-plan/
│   │   ├── summarize-content/
│   │   ├── parse-document/
│   │   ├── transcribe-audio/
│   │   ├── translate-message/
│   │   ├── google-calendar-sync/
│   │   ├── initialize-payment/
│   │   ├── verify-payment/
│   │   └── manage-subscription/
│   ├── migrations/           # Database migrations
│   └── config.toml           # Supabase configuration
├── docs/                      # Documentation
├── tests/                     # Test files
└── public/                    # Static assets

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Storage (avatars, attachments)
  - Real-time subscriptions
  - Edge Functions (Deno runtime)

### AI Integration
- **OpenAI GPT-4** - Content generation, summarization, quiz creation

### Payment Processing
- **Paystack** - Payment gateway for subscriptions

### Additional Services
- **Google Calendar API** - Calendar synchronization
- **PDF Parse** - Document parsing

## Database Schema

### Core Tables

**profiles**
- User profile information
- XP points and study streaks
- AI credits balance

**study_plans**
- User-created study plans
- Goals and schedules
- Progress tracking

**quizzes**
- Quiz metadata and questions
- Difficulty levels
- Creator information

**quiz_attempts**
- User quiz results
- Score and completion data
- Time tracking

**flashcard_decks**
- Flashcard collections
- Spaced repetition settings

**flashcards**
- Individual flashcard data
- Front/back content

**study_groups**
- Community groups
- Member management

**group_messages**
- Group chat messages
- Media attachments
- Mentions

**achievements**
- Achievement definitions
- Requirements and rewards

**user_achievements**
- Unlocked achievements
- Progress tracking

**user_ai_usage**
- AI feature usage logs
- Credit consumption

**referral_codes**
- User referral codes
- Referral tracking

### Key Database Functions

- `award_xp()` - Award XP to users
- `update_study_streak()` - Update user study streaks
- `check_quiz_achievements()` - Check and award quiz achievements
- `deduct_ai_credits()` - Deduct credits for AI usage
- `has_ai_credits()` - Check if user has sufficient credits
- `create_notification()` - Create user notifications

## Authentication Flow

1. User signs up with email/password or social provider
2. Supabase Auth creates user in `auth.users` table
3. Trigger creates profile in `profiles` table
4. User role assigned in `user_roles` table
5. Default preferences created
6. Referral code generated

## AI Features Architecture

### Content Generation Flow

1. User uploads document or provides text
2. Frontend calls edge function with content
3. Edge function:
   - Validates user has sufficient AI credits
   - Processes content (parse PDF, extract text)
   - Calls OpenAI API with structured prompt
   - Deducts credits from user account
   - Returns generated content
4. Frontend displays results and updates UI

### Edge Functions

All AI operations run through Supabase Edge Functions for:
- API key security
- Credit management
- Rate limiting
- Error handling
- Logging

## Security

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only access their own data
- Group members can access group content
- Public content is properly filtered

### Authentication

- JWT-based authentication
- Secure token refresh
- Role-based access control
- Protected routes on frontend

### Data Protection

- File upload validation
- Input sanitization
- XSS prevention
- CSRF protection

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Service worker for offline support
- Database query optimization with indexes
- Edge function caching where appropriate

## Deployment Architecture

- **Frontend**: Hosted on Lovable/Vercel
- **Backend**: Supabase (managed PostgreSQL + Edge Functions)
- **Assets**: Supabase Storage
- **CDN**: Automatic via hosting platform
