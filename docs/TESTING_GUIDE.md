# Testing Guide

## Overview

This guide explains how to set up, write, and execute tests for the ExHub application. For test results and coverage reports, see [TESTING.md](./TESTING.md).

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Setup Instructions](#setup-instructions)
3. [Writing Tests](#writing-tests)
4. [Running Tests](#running-tests)
5. [Best Practices](#best-practices)
6. [Debugging Tests](#debugging-tests)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \
      / E2E \          ← Few, slow, comprehensive
     /______\
    /        \
   /Integration\      ← Moderate, medium speed
  /____________\
 /              \
/   Unit Tests   \    ← Many, fast, focused
/_________________\
```

### Coverage Goals

- **Unit Tests**: 80% coverage of utilities, hooks, and pure components
- **Integration Tests**: 75% coverage of API endpoints and database operations
- **E2E Tests**: 100% coverage of critical user paths
- **Overall**: Minimum 75% total coverage

### Test Types

1. **Unit Tests** - Test individual components, functions, and hooks in isolation
2. **Integration Tests** - Test interactions between modules, APIs, and database
3. **E2E Tests** - Test complete user workflows from start to finish
4. **Performance Tests** - Measure response times and resource usage

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Core testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event @vitest/ui

# E2E testing
npm install -D @playwright/test

# Mocking
npm install -D msw

# Coverage reporting
npm install -D @vitest/coverage-v8
```

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 3. Configure Playwright

```bash
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4. Create Test Setup File

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));
```

### 5. Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

## Writing Tests

### Unit Tests

#### Component Testing Pattern

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Utility Function Testing

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '@/lib/utils';

describe('myUtilFunction', () => {
  it('returns expected output for valid input', () => {
    expect(myUtilFunction('input')).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myUtilFunction('')).toBe('default');
    expect(myUtilFunction(null)).toThrow();
  });
});
```

#### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(defaultValue);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### Integration Tests

#### Edge Function Testing

```typescript
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Edge Function Integration', () => {
  let supabase;

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  });

  it('calls function successfully', async () => {
    const { data, error } = await supabase.functions.invoke('my-function', {
      body: { param: 'value' }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

#### Database Testing

```typescript
describe('Database Operations', () => {
  it('creates record with proper constraints', async () => {
    const { data, error } = await supabase
      .from('my_table')
      .insert({ field: 'value' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.field).toBe('value');
  });

  it('enforces RLS policies', async () => {
    // Attempt unauthorized access
    const { data, error } = await supabase
      .from('protected_table')
      .select()
      .eq('user_id', 'other-user-id');

    expect(data).toHaveLength(0);
  });
});
```

### E2E Tests

#### Page Object Pattern

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('.error-message');
  }
}

// test file
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
  
  await expect(page).toHaveURL(/\/dashboard/);
});
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npm test tests/unit/components/Button.test.tsx

# Run tests matching pattern
npm test -- --grep "authentication"
```

### Playwright Commands

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run on specific browser
npx playwright test --project=firefox

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# Open HTML report
open coverage/index.html

# View console summary
npm run test:coverage -- --reporter=text
```

---

## Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or private methods
   - Test public API and user interactions

2. **Follow AAA Pattern**
   ```typescript
   it('does something', () => {
     // Arrange - Set up test data and conditions
     const input = 'test';
     
     // Act - Execute the code being tested
     const result = myFunction(input);
     
     // Assert - Verify the outcome
     expect(result).toBe('expected');
   });
   ```

3. **One Assertion Per Test (when practical)**
   - Keep tests focused and easy to debug
   - Use descriptive test names
   - Group related assertions when testing complex behavior

4. **Use Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => { });
   
   // ✅ Good
   it('validates email format and shows error for invalid input', () => { });
   ```

5. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't rely on test execution order
   - Clean up after each test

6. **Mock External Dependencies**
   - Mock API calls, database queries
   - Use test doubles for complex dependencies
   - Keep tests fast and reliable

### Testing Async Code

```typescript
// Async/await
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// waitFor from testing-library
it('shows loading then data', async () => {
  render(<MyComponent />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Error Testing

```typescript
it('handles errors gracefully', async () => {
  // Test error throwing
  expect(() => riskyFunction()).toThrow('Error message');
  
  // Test async errors
  await expect(asyncRiskyFunction()).rejects.toThrow();
  
  // Test error UI
  render(<ComponentWithError />);
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});
```

---

## Debugging Tests

### Vitest Debugging

```typescript
// Use console.log
it('debugs values', () => {
  console.log('Debug:', someValue);
  expect(someValue).toBe(expected);
});

// Use debug from testing-library
import { render, screen } from '@testing-library/react';

it('shows DOM structure', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Prints DOM to console
});

// Run single test
npm test -- --grep "specific test name"

// UI mode for interactive debugging
npx vitest --ui
```

### Playwright Debugging

```bash
# Debug mode (pauses at each action)
npx playwright test --debug

# Debug specific test
npx playwright test auth-flow.spec.ts --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Browser DevTools

```typescript
// Pause execution
await page.pause();

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Console logs
page.on('console', msg => console.log(msg.text()));

// Network requests
page.on('request', request => console.log(request.url()));
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```

### Pre-commit Hooks

Install Husky:

```bash
npm install -D husky lint-staged
npx husky install
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Test Fixtures](../tests/fixtures/) - Reusable test data
- [Test Reports](./TESTING.md) - View current test results

---

**Last Updated**: December 2024  
**Maintained By**: Development Team
