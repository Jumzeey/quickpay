import { Page } from '@playwright/test';

/**
 * Helper function to authenticate a user for testing
 * This sets the accessToken cookie directly
 */
export async function authenticateUser(page: Page, accessToken: string) {
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Helper function to login via UI (handles OTP flow)
 * Flow: Sign in -> OTP page -> Dashboard
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
) {
  try {
    // Step 1: Go to sign-in page
    await page.goto('/onboarding/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Step 2: Wait for form and fill credentials
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    
    await page.fill('#email', email);
    await page.fill('#password', password);
    
    // Step 3: Submit sign-in form
    await page.click('button[type="submit"]');
    
    // Step 4: Wait for OTP page (8-digit OTP required)
    await page.waitForURL(/\/onboarding\/otp/, { timeout: 15000 });
    
    // Wait for OTP input fields (PinInput component)
    // Try multiple selectors as react-pin-input may render differently
    await page.waitForSelector('input[type="text"], input[inputmode="numeric"]', { timeout: 10000 });
    
    // Step 5: Enter 8 random digits (any digits work in dev/test)
    // The PinInput component auto-submits when all 8 digits are entered
    const otpCode = '12345678';
    
    // Try to find all OTP input fields
    const otpInputs = await page.locator('input[type="text"], input[inputmode="numeric"]').all();
    
    if (otpInputs.length >= 8) {
      // Fill each input field one by one
      for (let i = 0; i < 8; i++) {
        await otpInputs[i].click();
        await otpInputs[i].fill(otpCode[i]);
        await page.waitForTimeout(50); // Small delay between inputs
      }
    } else {
      // Alternative: Focus first input and type all digits
      // PinInput should handle auto-advancing
      const firstInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
      await firstInput.click();
      await firstInput.focus();
      await page.keyboard.type(otpCode, { delay: 50 });
    }
    
    // Wait a bit for auto-submit (PinInput auto-submits when complete)
    await page.waitForTimeout(2000);
    
    // If still on OTP page, try clicking verify button
    const currentUrl = page.url();
    if (currentUrl.includes('/otp')) {
      const verifyButton = page.locator('button:has-text("Verify OTP"), button:has-text("Verify")').first();
      const isVisible = await verifyButton.isVisible().catch(() => false);
      if (isVisible) {
        await verifyButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 6: Wait for navigation to dashboard
    await page.waitForURL(/dashboard|balance-history/, { timeout: 15000 });
    
    console.log('✅ Successfully logged in via UI');
  } catch (error) {
    console.error('Login via UI failed:', error);
    throw new Error(`Failed to login via UI: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure dev server is running.`);
  }
}

