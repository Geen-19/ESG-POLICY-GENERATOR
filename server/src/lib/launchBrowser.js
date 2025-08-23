// server/lib/launchBrowser.js
export async function launchBrowser() {
  const onVercel = !!process.env.VERCEL || process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV;

  if (onVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const pCore = (await import("puppeteer-core")).default;
    return pCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    const p = (await import("puppeteer")).default; // downloads a local Chromium on dev
    return p.launch({ headless: true }); // no executablePath needed
  }
}
