const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const waitForCondition = async (predicate, message, timeoutMs = 5000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
};

const expectVisibleText = async (page, text) => {
  await page.waitForFunction((expectedText) => {
    return Array.from(document.querySelectorAll('body *')).some((element) => {
      const hasText = element.textContent?.includes(expectedText);
      const isVisible = element.getClientRects().length > 0;
      return hasText && isVisible;
    });
  }, text, { timeout: 5000 });
};

const assertMobileSurface = async (page, label, minTapSize = 44) => {
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert(!hasHorizontalOverflow, `${label} has horizontal overflow`);

  const roleButtonSelector = '[' + 'role="button"' + ']' + ':visible';
  const smallTargets = await page.locator(`button:visible, ${roleButtonSelector}`).evaluateAll((targets, minSize) => {
    const seen = new Set();

    return targets
      .filter((target) => {
        const element = target;
        if (seen.has(element)) return false;
        seen.add(element);
        const rect = element.getBoundingClientRect();
        return rect.width < minSize || rect.height < minSize;
      })
      .map((target) => {
        const rect = target.getBoundingClientRect();
        return {
          text: target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) || '',
          aria: target.getAttribute('aria-label') || '',
          role: target.getAttribute('role') || target.tagName.toLowerCase(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
  }, minTapSize);

  assert(smallTargets.length === 0, `${label} has tap targets below ${minTapSize}px: ${JSON.stringify(smallTargets, null, 2)}`);
};

module.exports = {
  assert,
  assertMobileSurface,
  expectVisibleText,
  waitForCondition,
};
