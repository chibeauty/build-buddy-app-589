import { test, expect } from '@playwright/test';

test.describe('Quiz Generation and Taking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('user can generate a quiz from text content', async ({ page }) => {
    // Navigate to quizzes
    await page.click('text=Quizzes');
    await expect(page).toHaveURL(/\/quizzes/);
    
    // Click generate new quiz
    await page.click('button:has-text("Generate Quiz")');
    await expect(page).toHaveURL(/\/quizzes\/generate/);
    
    // Fill quiz generation form
    await page.fill('textarea[name="content"]', 
      'React is a JavaScript library for building user interfaces. ' +
      'It was created by Facebook and is maintained by Facebook and a community of developers.'
    );
    await page.fill('input[name="subject"]', 'React');
    await page.selectOption('select[name="difficulty"]', 'medium');
    await page.fill('input[name="questionCount"]', '5');
    
    // Generate quiz
    await page.click('button:has-text("Generate Quiz")');
    
    // Wait for generation (with loading state)
    await expect(page.locator('text=Generating')).toBeVisible();
    await expect(page.locator('text=Quiz Preview')).toBeVisible({ timeout: 30000 });
    
    // Verify quiz questions are displayed
    await expect(page.locator('[data-testid="quiz-question"]')).toHaveCount(5);
  });

  test('user can take a quiz and see results', async ({ page }) => {
    await page.goto('/quizzes');
    
    // Select first available quiz
    await page.click('[data-testid="quiz-card"]:first-child');
    
    // Start quiz
    await page.click('button:has-text("Start Quiz")');
    await expect(page).toHaveURL(/\/quizzes\/.*\/take/);
    
    // Answer all questions
    const questionCount = await page.locator('[data-testid="question"]').count();
    
    for (let i = 0; i < questionCount; i++) {
      // Select first option for each question
      await page.click('input[type="radio"]:visible');
      
      if (i < questionCount - 1) {
        await page.click('button:has-text("Next")');
      } else {
        await page.click('button:has-text("Submit")');
      }
    }
    
    // Verify results page
    await expect(page).toHaveURL(/\/quizzes\/.*\/results/);
    await expect(page.locator('text=Your Score')).toBeVisible();
    await expect(page.locator('text=%')).toBeVisible();
    
    // Check for score value
    const scoreText = await page.locator('[data-testid="score-percentage"]').textContent();
    expect(scoreText).toMatch(/\d+%/);
  });

  test('user can review quiz answers', async ({ page }) => {
    // Assuming user has completed a quiz
    await page.goto('/quizzes');
    await page.click('[data-testid="quiz-card"]:first-child');
    await page.click('text=View Results');
    
    // Check review interface
    await expect(page.locator('text=Review Answers')).toBeVisible();
    await expect(page.locator('[data-testid="correct-answer"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-answer"]')).toBeVisible();
  });

  test('shows validation error for empty content', async ({ page }) => {
    await page.goto('/quizzes/generate');
    
    await page.fill('input[name="subject"]', 'Test');
    await page.click('button:has-text("Generate Quiz")');
    
    await expect(page.locator('text=Content is required')).toBeVisible();
  });

  test('user can save quiz for later', async ({ page }) => {
    await page.goto('/quizzes');
    
    // Click on quiz card
    await page.click('[data-testid="quiz-card"]:first-child');
    
    // Save/bookmark quiz
    await page.click('[data-testid="save-quiz-button"]');
    
    // Verify saved state
    await expect(page.locator('text=Saved')).toBeVisible();
  });
});
