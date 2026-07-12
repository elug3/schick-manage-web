#!/usr/bin/env node
/**
 * Browser test: login form submit should redirect to dashboard.
 */
import { chromium } from "playwright";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:5173";
const EMAIL = process.env.MOCK_ADMIN_EMAIL ?? "admin@dupli1.com";
const PASSWORD = process.env.MOCK_ADMIN_PASSWORD ?? "Dupli1Admin2026!";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Browser login test at ${BASE}\n`);

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
  const url = page.url();
  if (!url.endsWith("/") && !url.match(/:\d+\/$/)) {
    throw new Error(`Expected dashboard URL, got ${url}`);
  }

  await page.waitForSelector("text=Dashboard", { timeout: 10000 });

  const token = await page.evaluate(() => localStorage.getItem("dupli1_at"));
  if (token) throw new Error("Access token should not be cached in localStorage");

  const cookies = await page.context().cookies();
  if (!cookies.some((c) => c.name === "dupli1_sid" && c.httpOnly)) {
    throw new Error("Expected httpOnly dupli1_sid session cookie after login");
  }

  console.log("PASS: Browser redirected to dashboard after login");
  console.log(`PASS: URL is ${url}`);
  console.log("PASS: Dashboard content visible");
  console.log("PASS: No access token cached client-side; session cookie only");

  await browser.close();
  console.log("\nBrowser login test passed.");
}

main().catch((err) => {
  console.error("FAIL:", err.message ?? err);
  process.exit(1);
});
