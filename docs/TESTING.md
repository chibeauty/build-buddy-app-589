# Testing Documentation

## Overview

ExHub follows a comprehensive testing strategy covering unit tests, integration tests, and end-to-end tests to ensure reliability and quality across all features.

## Testing Structure

```
tests/
├── unit/              # Component and utility tests
├── integration/       # API and service integration tests
├── e2e/              # End-to-end user journey tests
└── fixtures/         # Test data and mocks
```

## Testing Framework

### Recommended Stack

- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Vitest + Supertest (for API)
- **E2E Tests**: Playwright or Cypress
- **Mocking**: MSW (Mock Service Worker)

### Installation

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event msw
npm install -D @playwright/test  # or cypress
```

## Unit Testing

### Component Tests

Test individual React components in isolation.

**Example: Button Component**
```typescript
// tests/unit/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### Utility Function Tests

**Example: Validation Functions**
```typescript
// tests/unit/lib/validation.test.ts
import { validateEmail, validatePassword } from '@/lib/validation';
import { describe, it, expect } from 'vitest';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      expect(validatePassword('SecurePass123!')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
    });
  });
});
```

### Hook Tests

**Example: Custom Hook**
```typescript
// tests/unit/hooks/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { describe, it, expect } from 'vitest';

describe('useAuth Hook', () => {
  it('provides authentication state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signOut');
  });

  it('updates user state on sign in', async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => {
      result.current.signIn('user@example.com', 'password');
    });
    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

## Integration Testing

### API Endpoint Tests

Test edge functions and database interactions.

**Example: Quiz Generation**
```typescript
// tests/integration/ai/generate-quiz.test.ts
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Generate Quiz Integration', () => {
  let supabase;
  let testUserId;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    // Set up test user with credits
  });

  it('generates quiz from content', async () => {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content: 'Test content about React hooks',
        subject: 'React',
        difficulty: 'medium',
        questionCount: 5,
        questionTypes: ['multiple_choice']
      }
    });

    expect(error).toBeNull();
    expect(data.questions).toHaveLength(5);
    expect(data.questions[0]).toHaveProperty('question');
    expect(data.questions[0]).toHaveProperty('correct_answer');
  });

  it('handles insufficient credits', async () => {
    // Remove credits from test user
    const { error } = await supabase.functions.invoke('generate-quiz', {
      body: { content: 'Test', subject: 'Test', difficulty: 'easy', questionCount: 5 }
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('insufficient credits');
  });
});
```

### Database Operations

**Example: Study Plan CRUD**
```typescript
// tests/integration/database/study-plans.test.ts
import { supabase } from '@/integrations/supabase/client';
import { describe, it, expect } from 'vitest';

describe('Study Plans Database', () => {
  it('creates study plan with user reference', async () => {
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        title: 'Test Plan',
        subject: 'Mathematics',
        goal_type: 'exam',
        duration_weeks: 4
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.title).toBe('Test Plan');
    expect(data.user_id).toBeDefined();
  });

  it('enforces RLS policies', async () => {
    // Attempt to access another user's plan
    const { data, error } = await supabase
      .from('study_plans')
      .select()
      .eq('user_id', 'different-user-id');

    expect(data).toHaveLength(0);
  });
});
```

## End-to-End Testing

### User Journey Tests

**Example: Quiz Taking Flow**
```typescript
// tests/e2e/quiz-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quiz Taking Journey', () => {
  test('user can create and take a quiz', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to quiz generation
    await page.click('text=Quizzes');
    await page.click('text=Generate New Quiz');

    // Fill quiz form
    await page.fill('textarea[name="content"]', 'React is a JavaScript library...');
    await page.selectOption('select[name="difficulty"]', 'medium');
    await page.fill('input[name="questionCount"]', '5');
    await page.click('button:has-text("Generate Quiz")');

    // Wait for generation
    await page.waitForSelector('text=Quiz Preview', { timeout: 30000 });
    
    // Start quiz
    await page.click('button:has-text("Start Quiz")');

    // Answer questions
    for (let i = 0; i < 5; i++) {
      await page.click('input[type="radio"]');
      await page.click('button:has-text("Next")');
    }

    // Check results
    await expect(page.locator('text=Your Score')).toBeVisible();
    await expect(page.locator('text=%')).toBeVisible();
  });
});
```

**Example: Study Plan Creation**
```typescript
// tests/e2e/study-plan.spec.ts
import { test, expect } from '@playwright/test';

test('user creates personalized study plan', async ({ page }) => {
  await page.goto('/study-plans');
  await page.click('button:has-text("Create New Plan")');

  // Step 1: Subject and goal
  await page.fill('input[name="subject"]', 'Web Development');
  await page.selectOption('select[name="goalType"]', 'skill');
  await page.click('button:has-text("Continue")');

  // Step 2: Time commitment
  await page.fill('input[type="range"]', '60'); // 60 minutes per day
  await page.click('button:has-text("Continue")');

  // Step 3: Generate plan
  await page.click('button:has-text("Generate Plan")');
  await page.waitForSelector('.study-plan-preview', { timeout: 30000 });

  // Verify plan structure
  await expect(page.locator('text=Week 1')).toBeVisible();
  await expect(page.locator('text=Week 2')).toBeVisible();
  
  // Save plan
  await page.click('button:has-text("Save Plan")');
  await expect(page.locator('text=Plan saved successfully')).toBeVisible();
});
```

## Test Coverage Goals

### Current Coverage (Target)

| Area | Target | Current |
|------|--------|---------|
| Components | 80% | TBD |
| Utilities | 90% | TBD |
| API Routes | 75% | TBD |
| Edge Functions | 70% | TBD |
| E2E Critical Paths | 100% | TBD |

### Critical Paths (Must Have 100% E2E Coverage)

1. User Registration & Onboarding
2. Quiz Generation → Taking → Results
3. Study Plan Creation → Execution
4. Flashcard Creation → Study Session
5. Payment & Subscription Flow
6. Community Group Joining → Messaging

## Test Data Management

### Fixtures

Create reusable test data:

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  standard: {
    email: 'user@test.com',
    password: 'TestPass123!',
    full_name: 'Test User'
  },
  premium: {
    email: 'premium@test.com',
    password: 'PremiumPass123!',
    full_name: 'Premium User',
    subscription: 'premium'
  }
};

// tests/fixtures/quizzes.ts
export const sampleQuiz = {
  title: 'React Basics',
  subject: 'React',
  difficulty: 'medium',
  questions: [
    {
      question: 'What is JSX?',
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A'
    }
  ]
};
```

## Mocking

### API Mocks with MSW

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/functions/v1/generate-quiz', () => {
    return HttpResponse.json({
      questions: [
        { question: 'Test?', options: ['A', 'B'], correct_answer: 'A' }
      ]
    });
  }),
  
  http.get('/rest/v1/profiles', () => {
    return HttpResponse.json([
      { id: '1', full_name: 'Test User', xp_points: 100 }
    ]);
  })
];
```

## Performance Testing

### Load Testing Edge Functions

```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  vus: 10,        // 10 virtual users
  duration: '30s' // Test duration
};

export default function() {
  let response = http.post(
    'https://[project-id].supabase.co/functions/v1/generate-quiz',
    JSON.stringify({
      content: 'Test content',
      difficulty: 'medium',
      questionCount: 5
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000
  });
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Reports

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

### Coverage Reports

Generate HTML coverage reports:

```bash
npm run test:coverage -- --reporter=html
open coverage/index.html
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert structure
4. **Mock External Services**: Don't hit real APIs in tests
5. **Test User Flows**: Focus on critical user journeys
6. **Keep Tests Fast**: Unit tests < 1s, Integration < 5s
7. **Clean Up**: Remove test data after each test
8. **CI/CD Integration**: Run tests on every commit

## Debugging Tests

### Visual Debugging (Playwright)

```bash
npx playwright test --debug
npx playwright test --ui
```

### Test Snapshots

```bash
npx playwright test --update-snapshots
```

### Console Logs

```typescript
test('debugging example', async ({ page }) => {
  page.on('console', msg => console.log('Browser:', msg.text()));
  // ... test code
});
```

## Future Testing Improvements

1. **Visual Regression Testing**: Implement screenshot comparison
2. **Accessibility Testing**: Add axe-core integration
3. **Performance Budgets**: Set and enforce performance limits
4. **Mutation Testing**: Ensure test quality with mutation testing
5. **Contract Testing**: Validate API contracts between frontend/backend
