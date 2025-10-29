# ExHub Deployment Guide

## Prerequisites

- Supabase project configured and running
- All database migrations applied
- Lovable AI enabled
- Edge functions deployed

## Pre-Deployment Checklist

### 1. Security Review
- [x] All RLS policies are in place
- [x] Input validation implemented
- [x] API rate limiting configured
- [ ] Enable leaked password protection in Supabase Auth settings

### 2. Performance Optimization
- [x] Lazy loading for routes
- [x] Code splitting implemented
- [x] Error boundaries added
- [x] Loading states for all async operations

### 3. Testing
- [ ] Test all user flows (signup, login, study plans, quizzes, flashcards)
- [ ] Test AI content generation
- [ ] Test on multiple devices (mobile, tablet, desktop)
- [ ] Test offline functionality
- [ ] Verify all form validations

### 4. Content & SEO
- [x] Meta tags configured in index.html
- [x] Favicon and PWA icons in place
- [x] robots.txt configured

## Deployment Steps

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Run type check
npm run type-check

# Build for production
npm run build
```

### Step 2: Verify Edge Functions

Ensure all edge functions are deployed:
- `generate-study-plan`
- `generate-quiz`
- `generate-flashcards`
- `summarize-content`

Check function logs in Supabase dashboard.

### Step 3: Database Final Check

```sql
-- Verify all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Should return no results

-- Check for missing indexes
SELECT schemaname, tablename 
FROM pg_tables t 
WHERE schemaname = 'public' 
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes i 
  WHERE i.schemaname = t.schemaname 
  AND i.tablename = t.tablename
);
```

### Step 4: Environment Configuration

Verify all environment variables are set:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

Supabase secrets:
- `LOVABLE_API_KEY` (auto-configured)
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Deploy to Lovable

1. Click "Publish" button in Lovable editor
2. Wait for deployment to complete
3. Test the production URL

### Step 6: Post-Deployment Verification

1. **Authentication Flow**
   - [ ] Sign up works
   - [ ] Email verification (if enabled)
   - [ ] Login works
   - [ ] Password reset works

2. **Core Features**
   - [ ] Create study plan
   - [ ] Generate quiz with AI
   - [ ] Create flashcard deck
   - [ ] Join study group

3. **AI Features**
   - [ ] Study plan generation
   - [ ] Quiz generation
   - [ ] Flashcard generation
   - [ ] Content summarization

4. **Gamification**
   - [ ] XP points awarded
   - [ ] Study streaks tracked
   - [ ] Achievements unlocked

5. **Performance**
   - [ ] Page load times < 3s
   - [ ] Time to Interactive < 5s
   - [ ] Lighthouse score > 90

### Step 7: Enable Auth Security Features

In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable "Leaked Password Protection"
3. Configure email templates
4. Set up password strength requirements

### Step 8: Monitor

Set up monitoring for:
- Error logs in Supabase
- Edge function logs
- User analytics
- API usage (Lovable AI)

## Custom Domain Setup

1. Go to Lovable project settings
2. Navigate to Domains section
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Rollback Procedure

If issues occur:

1. **Immediate Rollback**
   - Use Lovable History to restore previous version
   - Click on previous edit and select "Restore"

2. **Database Rollback**
   ```bash
   # In Supabase dashboard SQL editor
   -- View migration history
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC;
   
   -- Rollback specific migration (if needed)
   -- Contact Supabase support for guidance
   ```

## Performance Monitoring

### Metrics to Track

1. **Frontend**
   - Page load time
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Cumulative Layout Shift (CLS)

2. **Backend**
   - API response times
   - Database query performance
   - Edge function execution time
   - Error rates

3. **AI Usage**
   - Lovable AI request count
   - Average response time
   - Token usage
   - Rate limit hits

### Tools

- Lighthouse for performance audits
- Supabase dashboard for logs
- Browser DevTools for frontend monitoring
- Lovable AI usage dashboard

## Troubleshooting

### Common Issues

1. **"infinite recursion detected in policy"**
   - Already fixed with security definer functions
   - If recurring, check group_members policies

2. **AI rate limits exceeded**
   - Monitor usage in Lovable dashboard
   - Add credits if needed
   - Implement client-side caching

3. **Slow page loads**
   - Check network tab for large assets
   - Verify lazy loading is working
   - Enable gzip compression

4. **Authentication issues**
   - Verify Supabase Auth settings
   - Check RLS policies
   - Verify JWT token expiration

## Maintenance

### Regular Tasks

- **Weekly**
  - Review error logs
  - Check AI usage
  - Monitor database size

- **Monthly**
  - Security audit
  - Performance review
  - Update dependencies

- **Quarterly**
  - Backup database
  - Review and optimize RLS policies
  - Update documentation

## Support

For deployment issues:
- Lovable Support: support@lovable.dev
- Supabase Support: https://supabase.com/support
- Community: Discord/Forum links

---

Last Updated: 2025-10-20
