# ExHub - Testing Guide

## Overview

This directory contains all test files for the ExHub application. Tests are organized by type: unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/                 # Unit tests for individual functions/components
├── integration/          # Integration tests for feature workflows
├── e2e/                  # End-to-end tests for complete user journeys
└── fixtures/             # Test data and fixtures
```

## Running Tests

### Setup

```bash
# Install test dependencies (if not already installed)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Types

```bash
# Unit tests only
npm test -- unit/

# Integration tests only
npm test -- integration/

# E2E tests only
npm test -- e2e/
```

### Watch Mode

```bash
npm test -- --watch
```

## Unit Tests

Test individual functions, components, and utilities in isolation.

### Example: Testing a Utility Function

```typescript
// tests/unit/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/validation';

describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
});
```

### Example: Testing a Component

```typescript
// tests/unit/components/PasswordStrength.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

describe('PasswordStrength', () => {
  it('should show weak for short passwords', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('should show strong for complex passwords', () => {
    render(<PasswordStrength password="MyP@ssw0rd123!" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });
});
```

## Integration Tests

Test how multiple components/features work together.

### Example: Testing Quiz Generation Flow

```typescript
// tests/integration/quizGeneration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Quiz Generation Flow', () => {
  beforeEach(async () => {
    // Setup test user and credits
  });

  it('should generate quiz and deduct credits', async () => {
    const content = 'Test content for quiz generation';
    
    // Call generate-quiz edge function
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content,
        difficulty: 'medium',
        questionCount: 5
      }
    });

    expect(error).toBeNull();
    expect(data.quiz).toBeDefined();
    expect(data.quiz.questions).toHaveLength(5);
    
    // Verify credits were deducted
    // Check user's credit balance
  });
});
```

## E2E Tests

Test complete user journeys from start to finish.

### Example: User Registration to First Quiz

```typescript
// tests/e2e/onboarding.test.ts
import { describe, it, expect } from 'vitest';

describe('New User Onboarding', () => {
  it('should complete full onboarding and create first quiz', async () => {
    // 1. Register new user
    // 2. Complete onboarding steps
    // 3. Navigate to quiz generation
    // 4. Generate first quiz
    // 5. Take quiz and view results
    // 6. Verify XP was awarded
  });
});
```

## Edge Function Tests

Test edge functions with mock data.

### Example: Testing Document Parser

```typescript
// tests/unit/edge-functions/parse-document.test.ts
import { describe, it, expect } from 'vitest';

describe('parse-document-content', () => {
  it('should extract text from PDF', async () => {
    const mockPdfData = 'base64_encoded_pdf_data';
    
    // Call edge function with mock data
    const result = await callEdgeFunction('parse-document-content', {
      fileData: mockPdfData,
      fileType: 'application/pdf',
      fileName: 'test.pdf'
    });

    expect(result.content).toBeDefined();
    expect(result.content).toContain('expected text');
  });

  it('should handle unsupported formats', async () => {
    const mockImageData = 'base64_encoded_image';
    
    const result = await callEdgeFunction('parse-document-content', {
      fileData: mockImageData,
      fileType: 'image/jpeg',
      fileName: 'test.jpg'
    });

    expect(result.error).toContain('not currently supported');
  });
});
```

## Best Practices

1. **Write Tests First**: Follow TDD when possible
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Keep Tests Isolated**: Each test should run independently
4. **Use Descriptive Names**: Test names should clearly describe what they test
5. **Mock External Dependencies**: Mock API calls, database queries, etc.
6. **Test Edge Cases**: Include tests for error conditions and boundary values

## Coverage Goals

- **Unit Tests**: Aim for >80% coverage on utilities and business logic
- **Integration Tests**: Cover all major user workflows
- **E2E Tests**: Test critical user journeys (registration, quiz creation, payment)

## Continuous Integration

Tests should run automatically on:
- Every pull request
- Before deployment
- Scheduled daily runs

## Troubleshooting

### Tests Failing Locally

1. Ensure all dependencies are installed
2. Check environment variables are set
3. Verify Supabase connection is working
4. Clear test cache: `npm test -- --clearCache`

### Flaky Tests

- Add proper wait conditions
- Use test-specific data isolation
- Avoid depending on external services
- Increase timeout for slow operations

## Contributing

When adding new features:
1. Write tests for new functionality
2. Ensure all existing tests pass
3. Update this README if adding new test patterns
4. Aim to maintain or improve overall coverage
