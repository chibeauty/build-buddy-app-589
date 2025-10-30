import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('user can sign up with email and password', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to sign up
    await page.click('text=Sign Up');
    
    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="fullName"]', 'Test User');
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('user completes onboarding flow', async ({ page }) => {
    // Assuming user is signed in from previous test
    await page.goto('/onboarding/welcome');
    
    // Welcome screen
    await expect(page.locator('text=Welcome to ExHub')).toBeVisible();
    await page.click('button:has-text("Continue")');
    
    // Learning style assessment
    await expect(page).toHaveURL(/\/onboarding\/learning-style/);
    await page.click('input[type="radio"]'); // Select first option
    await page.click('button:has-text("Next")');
    
    // Goals screen
    await expect(page).toHaveURL(/\/onboarding\/goals/);
    await page.fill('input[name="goal"]', 'Learn web development');
    await page.click('button:has-text("Continue")');
    
    // Notification preferences
    await expect(page).toHaveURL(/\/onboarding\/notifications/);
    await page.click('button:has-text("Get Started")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('user can log in with credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('user can log out', async ({ page }) => {
    // Assuming user is logged in
    await page.goto('/dashboard');
    
    // Open user menu
    await page.click('[data-testid="user-avatar"]');
    
    // Click logout
    await page.click('text=Logout');
    
    // Should redirect to home/login
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('shows validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('shows error for incorrect credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
