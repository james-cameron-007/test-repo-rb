import { test } from '@playwright/test';

test('simulate user interaction', async ({ page }) => {
  const baseUrl = 'https://freehqpornxxx.com/';
  await page.goto(baseUrl);

  const randomWait = () => Math.floor(Math.random() * 30) * 1000;

  async function scenario1() {
    console.log('Running scenario 1');
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.2) {
      try {
        console.log('Clicking next-btn');
        await page.locator('[data-test-id="next-btn"]').click();
      } catch (e) {
        console.error('Failed to click next-btn:', e);
      }
    }
    await page.waitForTimeout(randomWait());
  }

  async function scenario2() {
    console.log('Running scenario 2');
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.3) {
      try {
        console.log('Clicking next-btn');
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
        console.log(`Clicking vertical-ad: ${randomAd}`);
        await page.locator(`[data-test-id="${randomAd}"]`).click();
      } catch (e) {
        console.error(`Failed to click ${randomAd}:`, e);
      }
    }
    await page.waitForTimeout(randomWait());
  }

  async function scenario3() {
    console.log('Running scenario 3');
    await page.waitForTimeout(randomWait());
    if (Math.random() < 0.3) {
      try {
        console.log('Clicking next-btn');
        await page.locator('[data-test-id="next-btn"]').click();
      } catch (e) {
        console.error('Failed to click next-btn:', e);
      }
      await page.waitForTimeout(randomWait());
    }

    const videos = ['video-card-2', 'video-card-6', 'video-card-8', 'video-card-10'];
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    try {
      console.log(`Clicking video-card: ${randomVideo}`);
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
        console.log(`Clicking video-ad: ${randomVideoAd}`);
        await page.locator(`[data-test-id="${randomVideoAd}"]`).click();
      } catch (e) {
        console.error(`Failed to click ${randomVideoAd}:`, e);
      }
      await page.waitForTimeout(randomWait());
    }
  }

  const scenarios = [scenario1, scenario2, scenario3];
  const randomIndex = Math.floor(Math.random() * scenarios.length);
  console.log('Running scenario:', randomIndex);
  await scenarios[randomIndex]();
});

test('capture browser detection screenshots', async ({ page }) => {
  await page.goto('https://www.whatismybrowser.com/');
  await page.screenshot({ path: 'browser-home.png', fullPage: true });

  await page.goto('https://www.whatismybrowser.com/detect/how-big-is-my-computer-screen/');
  await page.screenshot({ path: 'screen-size.png', fullPage: true });

  await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/');
  await page.screenshot({ path: 'user-agent.png', fullPage: true });

  await page.goto('https://www.whatismybrowser.com/detect/client-hints/');
  await page.screenshot({ path: 'client-hints.png', fullPage: true });

  await page.goto('https://www.whatismybrowser.com/detect/navigator-platform/');
  await page.screenshot({ path: 'navigator-platform.png', fullPage: true });
});
