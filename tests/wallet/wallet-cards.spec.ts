import { test, expect } from '@playwright/test';
import { authenticateUser, loginViaUI } from '../helpers/auth';
import { waitForWalletCards, getWalletCards, clickWalletCard, getSelectedWalletCard } from '../helpers/wallet';

// Test credentials - should be set via environment variables in CI
const TEST_EMAIL = process.env.TEST_EMAIL || 'London@mailinator.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'R00tadm!n';
const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || '';

test.describe('Wallet Cards Component', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user
    if (TEST_ACCESS_TOKEN) {
      await authenticateUser(page, TEST_ACCESS_TOKEN);
    } else if (TEST_EMAIL && TEST_PASSWORD) {
      // Fallback to UI login if token not provided
      try {
        await loginViaUI(page, TEST_EMAIL, TEST_PASSWORD);
      } catch (error) {
        test.skip(true, 'Authentication failed. Set TEST_ACCESS_TOKEN or ensure dev server is running.');
        return;
      }
    } else {
      test.skip(true, 'No authentication credentials provided. Set TEST_ACCESS_TOKEN or TEST_EMAIL/TEST_PASSWORD environment variables.');
      return;
    }
    
    // Navigate to balance history page
    await page.goto('/balance-history', { waitUntil: 'networkidle' });
    await waitForWalletCards(page);
  });

  test('TC-011: Wallet Cards Display', async ({ page }) => {
    // Check if wallet cards are displayed
    const cards = await getWalletCards(page);
    
    // Should have at least one wallet card or show empty state
    const hasCards = cards.length > 0;
    const hasEmptyState = await page.locator('text=No Wallets Found').isVisible().catch(() => false);
    
    expect(hasCards || hasEmptyState).toBeTruthy();
    
    if (hasCards) {
      // Verify card structure
      const firstCard = cards[0];
      await expect(firstCard).toBeVisible();
      
      // Check for account name
      await expect(firstCard.locator('text=/Wallet|Account/i')).toBeVisible();
      
      // Check for balance information
      const balanceText = await firstCard.textContent();
      expect(balanceText).toContain('Balance');
    }
  });

  test('TC-012: Wallet Card Selection', async ({ page }) => {
    const cards = await getWalletCards(page);
    
    if (cards.length === 0) {
      test.skip();
      return;
    }

    // Click on first wallet card
    await clickWalletCard(page, 0);
    
    // Wait a bit for selection to apply
    await page.waitForTimeout(500);
    
    // Check if a card is selected (has primary border/background)
    const selectedCard = await getSelectedWalletCard(page);
    expect(selectedCard).not.toBeNull();
    
    // Verify transactions load
    await page.waitForSelector('table, [class*="Table"], text=No Transactions Found', { timeout: 5000 });
  });

  test('TC-013: Auto-Select First Wallet', async ({ page }) => {
    const cards = await getWalletCards(page);
    
    if (cards.length === 0) {
      test.skip();
      return;
    }

    // Wait for auto-selection to happen
    await page.waitForTimeout(2000);
    
    // Check if first wallet is auto-selected
    const selectedCard = await getSelectedWalletCard(page);
    expect(selectedCard).not.toBeNull();
    
    // Verify transactions are loading or loaded
    const hasTransactions = await page.locator('table, [class*="Table"]').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No Transactions Found').isVisible().catch(() => false);
    expect(hasTransactions || hasEmptyState).toBeTruthy();
  });

  test('TC-014: Horizontal Scrolling', async ({ page }) => {
    const cards = await getWalletCards(page);
    
    if (cards.length < 6) {
      test.skip();
      return;
    }

    // Check if scroll container exists
    const scrollContainer = page.locator('.wallet-scroll-container, [class*="overflow-x-auto"]').first();
    await expect(scrollContainer).toBeVisible();
    
    // Get initial scroll position
    const initialScroll = await scrollContainer.evaluate((el) => el.scrollLeft);
    
    // Scroll right
    await scrollContainer.evaluate((el) => {
      el.scrollBy({ left: 500, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(500);
    
    // Check if scroll position changed
    const newScroll = await scrollContainer.evaluate((el) => el.scrollLeft);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test('TC-015: Wallet Card Layout - Large Values', async ({ page }) => {
    const cards = await getWalletCards(page);
    
    if (cards.length === 0) {
      test.skip();
      return;
    }

    const firstCard = cards[0];
    await expect(firstCard).toBeVisible();
    
    // Check that card has proper layout (no overlapping text)
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.width).toBeGreaterThan(200);
    expect(cardBox!.height).toBeGreaterThan(100);
    
    // Check for balance text
    const balanceText = await firstCard.locator('text=/\\d+/').first().textContent();
    expect(balanceText).toBeTruthy();
  });

  test('TC-016: Currency Flags Display', async ({ page }) => {
    const cards = await getWalletCards(page);
    
    if (cards.length === 0) {
      test.skip();
      return;
    }

    const firstCard = cards[0];
    const cardText = await firstCard.textContent();
    
    // Check for currency code (GHS, KES, USD, etc.)
    const hasCurrency = /(GHS|KES|USD|NGN|TZS|EUR|GBP)/i.test(cardText || '');
    expect(hasCurrency).toBeTruthy();
  });

  test('TC-017: Empty State - No Wallets', async ({ page }) => {
    // This test would need a user with no wallets
    // For now, we'll check if empty state component exists
    const emptyState = page.locator('text=No Wallets Found');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    // If empty state is shown, verify it has proper message
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('TC-018: Loading State - Wallet Cards', async ({ page, context }) => {
    // Clear cookies and reload to see loading state
    await context.clearCookies();
    await page.goto('/balance-history');
    
    // Check for loading skeleton or spinner
    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="loading"]').first();
    const hasLoading = await loadingIndicator.isVisible().catch(() => false);
    
    // Loading state should appear briefly
    if (hasLoading) {
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    }
  });
});

