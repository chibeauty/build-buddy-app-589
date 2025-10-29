# ExHub - Setup Guide

## Prerequisites

- Node.js 18+ or Bun
- Supabase account
- OpenAI API key (for AI features)
- Paystack account (for payments)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Configuration**

   Create a `.env` file in the project root:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Supabase Setup**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the migrations from `supabase/migrations/`
   - Configure authentication providers in Supabase Dashboard
   - Set up storage buckets: `avatars`, `group-attachments`

5. **Edge Function Secrets**

   Configure the following secrets in your Supabase project:
   
   ```bash
   # Required for AI features
   OPENAI_API_KEY=your_openai_api_key
   
   # Required for payments
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   
   # Required for Google Calendar integration
   GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
   GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
   ```

   Set secrets via Supabase Dashboard: Project Settings → Edge Functions → Secrets

6. **Deploy Edge Functions**

   ```bash
   npx supabase functions deploy
   ```

7. **Start Development Server**

   ```bash
   npm run dev
   # or
   bun dev
   ```

   The app will be available at `http://localhost:5173`

## First-Time Setup

1. **Create Admin Account**
   - Sign up through the app
   - Manually assign admin role in Supabase Dashboard

2. **Initialize Achievement System**
   - Run the achievement seed script (if available)
   - Or manually create achievements in the database

3. **Test AI Features**
   - Upload a document on `/summarize`
   - Generate a quiz on `/quizzes/generate`
   - Verify credits are being deducted

## Troubleshooting

### Build Issues
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify all environment variables are set

### Supabase Connection Issues
- Verify URL and anon key in `.env`
- Check RLS policies are enabled
- Ensure user has proper permissions

### Edge Function Errors
- Check function logs in Supabase Dashboard
- Verify all secrets are configured
- Ensure JWT verification is properly set

### Payment Issues
- Verify Paystack keys are correct
- Check webhook configuration
- Review payment logs in Supabase

## Next Steps

- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure
- Check [API.md](./API.md) for API documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
