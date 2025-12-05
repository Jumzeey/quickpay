import { Page, Locator } from '@playwright/test';

/**
 * Wait for wallet cards to load
 */
export async function waitForWalletCards(page: Page) {
  // Wait for either wallet cards or empty state
  await page.waitForSelector(
    '[data-testid="wallet-card"], .wallet-scroll-container, [class*="EmptyState"]',
    { timeout: 10000 }
  );
}

/**
 * Get all wallet cards
 */
export async function getWalletCards(page: Page): Promise<Locator[]> {
  const cards = page.locator('[class*="border-2"][class*="cursor-pointer"]').filter({
    hasText: /Wallet|Account/i,
  });
  return await cards.all();
}

/**
 * Click on a wallet card by index
 */
export async function clickWalletCard(page: Page, index: number = 0) {
  const cards = await getWalletCards(page);
  if (cards.length > index) {
    await cards[index].click();
    // Wait for transactions to load
    await page.waitForTimeout(1000);
  }
}

/**
 * Get selected wallet card
 */
export async function getSelectedWalletCard(page: Page): Promise<Locator | null> {
  const selectedCard = page.locator('[class*="border-primary"][class*="bg-primary"]').first();
  if (await selectedCard.count() > 0) {
    return selectedCard;
  }
  return null;
}

/**
 * Wait for transactions to load
 */
export async function waitForTransactions(page: Page) {
  await page.waitForSelector(
    'table, [class*="Table"], [class*="EmptyState"]',
    { timeout: 10000 }
  );
}

/**
 * Get transaction table rows
 */
export async function getTransactionRows(page: Page): Promise<Locator[]> {
  const rows = page.locator('table tbody tr, [class*="Table"] tbody tr');
  return await rows.all();
}


