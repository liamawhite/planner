import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the home page
    await page.goto('/');
  });

  test('should navigate to projects page from home', async ({ page }) => {
    // Click the Projects link in the navbar
    await page.getByRole('link', { name: 'Projects', exact: true }).click();

    // Verify we're on the projects page
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('should navigate to a project detail page', async ({ page }) => {
    // Navigate to projects
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL('/projects');

    // Click on a project (assumes at least one project exists)
    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();

    // Verify we're on the project detail page
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.getByRole('heading', { name: 'Istio Canary Deploys' })).toBeVisible();
  });

  test('back button should navigate to previous page', async ({ page }) => {
    // Navigate: Home -> Projects -> Project Detail
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL('/projects');

    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Click the back button in the navbar
    const backButton = page.getByRole('button').first();
    await backButton.click();

    // Verify we're back on the projects page
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('forward button should be disabled initially', async ({ page }) => {
    // Navigate to projects
    await page.getByRole('link', { name: 'Projects', exact: true }).click();

    // The forward button (second button) should be disabled
    const forwardButton = page.getByRole('button').nth(1);
    await expect(forwardButton).toBeDisabled();
  });

  test('forward button should be enabled after going back', async ({ page }) => {
    // Navigate: Home -> Projects -> Project Detail
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL('/projects');

    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Click the back button
    const backButton = page.getByRole('button').first();
    await backButton.click();
    await expect(page).toHaveURL('/projects');

    // The forward button should now be enabled
    const forwardButton = page.getByRole('button').nth(1);
    await expect(forwardButton).toBeEnabled();
  });

  test('forward button should navigate forward in history', async ({ page }) => {
    // Navigate: Home -> Projects -> Project Detail
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();
    const projectUrl = page.url();

    // Go back
    const backButton = page.getByRole('button').first();
    await backButton.click();
    await expect(page).toHaveURL('/projects');

    // Click forward
    const forwardButton = page.getByRole('button').nth(1);
    await forwardButton.click();

    // Should be back on the project detail page
    await expect(page).toHaveURL(projectUrl);
    await expect(page.getByRole('heading', { name: 'Istio Canary Deploys' })).toBeVisible();
  });

  test('forward button should be disabled after navigating forward', async ({ page }) => {
    // Navigate: Home -> Projects -> Project Detail
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();

    // Go back and then forward
    const backButton = page.getByRole('button').first();
    await backButton.click();

    const forwardButton = page.getByRole('button').nth(1);
    await forwardButton.click();

    // After navigating forward to the end, forward button should be disabled
    await expect(forwardButton).toBeDisabled();
  });

  test('back and forward navigation should work multiple times', async ({ page }) => {
    // Build up some navigation history: Home -> Projects -> Project Detail -> Projects
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    const projectLink = page.getByRole('link', { name: 'Istio Canary Deploys' });
    await projectLink.click();
    const projectUrl = page.url();

    // Back to projects
    const backButton = page.getByRole('button').first();
    await backButton.click();
    await expect(page).toHaveURL('/projects');

    // Back to home
    await backButton.click();
    await expect(page).toHaveURL('/');

    // Forward to projects
    const forwardButton = page.getByRole('button').nth(1);
    await forwardButton.click();
    await expect(page).toHaveURL('/projects');

    // Forward to project detail
    await forwardButton.click();
    await expect(page).toHaveURL(projectUrl);

    // Forward button should now be disabled
    await expect(forwardButton).toBeDisabled();
  });
});
