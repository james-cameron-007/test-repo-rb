import { test } from '@playwright/test';

test('simulate user interaction', async ({ page }) => {
  const baseUrl = 'http://localhost:8788/';
  await page.goto(baseUrl);

  const randomWait = () => Math.floor(Math.random() * 30) * 1000;

  async function scenario1() {
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.2) {
      try {
        await page.locator('[data-test-id="next-btn"]').click();
      } catch (e) {
        console.error('Failed to click next-btn:', e);
      }
    }
    await page.waitForTimeout(randomWait());
  }

  async function scenario2() {
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.3) {
      try {
        await page.locator('[data-test-id="next-btn"]').click();
      } catch (e) {
        console.error('Failed to click next-btn:', e);
      }
      await page.waitForTimeout(randomWait());
    }
    if (Math.random() < 0.2) {
      const ads = ['vertical-ad-1', 'vertical-ad-2', 'vertical-ad-3', 'vertical-ad-4'];
      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      try {
        await page.locator(`[data-test-id="${randomAd}"]`).click();
      } catch (e) {
        console.error(`Failed to click ${randomAd}:`, e);
      }
    }
    await page.waitForTimeout(randomWait());
  }

  async function scenario3() {
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.3) {
      try {
        await page.locator('[data-test-id="next-btn"]').click();
      } catch (e) {
        console.error('Failed to click next-btn:', e);
      }
      await page.waitForTimeout(randomWait());
    }

    const videos = ['video-card-2', 'video-card-6', 'video-card-8', 'video-card-10'];
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    try {
      await page.locator(`[data-test-id="${randomVideo}"]`).first().click();
    } catch (e) {
      console.error(`Failed to click ${randomVideo}:`, e);
      throw e;
    }

    await page.waitForTimeout(randomWait());

    if (Math.random() < 0.2) {
      const videoAds = ['video-ad-1', 'video-ad-2', 'video-ad-3'];
      const randomVideoAd = videoAds[Math.floor(Math.random() * videoAds.length)];
      try {
        await page.locator(`[data-test-id="${randomVideoAd}"]`).click();
      } catch (e) {
        console.error(`Failed to click ${randomVideoAd}:`, e);
      }
      await page.waitForTimeout(randomWait());
    }
  }

  const scenarios = [scenario1, scenario2, scenario3];
  const randomIndex = Math.floor(Math.random() * scenarios.length);
  await scenarios[randomIndex]();
});
