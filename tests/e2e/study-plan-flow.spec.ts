import { test, expect } from '@playwright/test';

test.describe('Study Plan Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('user creates a personalized study plan', async ({ page }) => {
    // Navigate to study plans
    await page.click('text=Study Plans');
    await expect(page).toHaveURL(/\/study-plans/);
    
    // Click create new plan
    await page.click('button:has-text("Create Plan")');
    await expect(page).toHaveURL(/\/study-plans\/create/);
    
    // Step 1: Subject and goal
    await page.fill('input[name="subject"]', 'Web Development');
    await page.selectOption('select[name="goalType"]', 'skill');
    await page.fill('input[name="duration"]', '8'); // weeks
    await page.click('button:has-text("Continue")');
    
    // Step 2: Time commitment
    await page.fill('input[name="weeklyHours"]', '10');
    await page.fill('input[name="sessionsPerWeek"]', '5');
    await page.click('button:has-text("Continue")');
    
    // Step 3: Learning preferences
    await page.check('input[value="videos"]');
    await page.check('input[value="reading"]');
    await page.click('button:has-text("Generate Plan")');
    
    // Wait for AI generation
    await expect(page.locator('text=Generating your plan')).toBeVisible();
    await expect(page.locator('[data-testid="plan-preview"]')).toBeVisible({ timeout: 30000 });
    
    // Verify plan structure
    await expect(page.locator('text=Week 1')).toBeVisible();
    await expect(page.locator('[data-testid="study-session"]')).toHaveCount(5); // 5 sessions per week
    
    // Save plan
    await page.click('button:has-text("Save Plan")');
    await expect(page.locator('text=Plan saved')).toBeVisible();
  });

  test('user views study plan details', async ({ page }) => {
    await page.goto('/study-plans');
    
    // Click on first plan
    await page.click('[data-testid="plan-card"]:first-child');
    
    // Verify plan details page
    await expect(page.locator('[data-testid="plan-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('text=Week')).toBeVisible();
  });

  test('user marks study session as complete', async ({ page }) => {
    await page.goto('/study-plans');
    await page.click('[data-testid="plan-card"]:first-child');
    
    // Find first incomplete session
    const sessionCheckbox = page.locator('[data-testid="session-checkbox"]:not(:checked)').first();
    await sessionCheckbox.check();
    
    // Verify session marked as complete
    await expect(sessionCheckbox).toBeChecked();
    
    // Check that XP notification appears
    await expect(page.locator('text=+15 XP')).toBeVisible();
  });

  test('user tracks overall plan progress', async ({ page }) => {
    await page.goto('/study-plans');
    await page.click('[data-testid="plan-card"]:first-child');
    
    // Check progress indicators
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    const progressText = await page.locator('[data-testid="progress-percentage"]').textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('user edits study plan', async ({ page }) => {
    await page.goto('/study-plans');
    await page.click('[data-testid="plan-card"]:first-child');
    
    // Click edit button
    await page.click('button:has-text("Edit Plan")');
    
    // Modify plan details
    await page.fill('input[name="title"]', 'Updated Plan Title');
    await page.click('button:has-text("Save Changes")');
    
    // Verify update
    await expect(page.locator('text=Updated Plan Title')).toBeVisible();
  });

  test('user deletes study plan', async ({ page }) => {
    await page.goto('/study-plans');
    
    const planCount = await page.locator('[data-testid="plan-card"]').count();
    
    // Open first plan
    await page.click('[data-testid="plan-card"]:first-child');
    
    // Delete plan
    await page.click('[data-testid="plan-menu"]');
    await page.click('text=Delete');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify plan is removed
    await expect(page).toHaveURL(/\/study-plans$/);
    const newPlanCount = await page.locator('[data-testid="plan-card"]').count();
    expect(newPlanCount).toBe(planCount - 1);
  });
});
