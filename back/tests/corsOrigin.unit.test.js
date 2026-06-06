const {
  createCorsOriginChecker,
  isDevelopmentLoopbackOrigin,
} = require('../utils/corsOrigin');

describe('cors origin checks', () => {
  test('allows configured origins exactly', () => {
    const isAllowed = createCorsOriginChecker({
      defaultOrigins: ['https://calendar.home.local'],
      origins: ['https://calendar.maxborland.space'],
      nodeEnv: 'production',
    });

    expect(isAllowed('https://calendar.home.local')).toBe(true);
    expect(isAllowed('https://calendar.maxborland.space')).toBe(true);
  });

  test('allows arbitrary localhost and 127.0.0.1 ports outside production', () => {
    const isAllowed = createCorsOriginChecker({
      defaultOrigins: [],
      origins: [],
      nodeEnv: 'development',
    });

    expect(isAllowed('http://localhost:61800')).toBe(true);
    expect(isAllowed('http://127.0.0.1:61800')).toBe(true);
    expect(isAllowed('http://localhost:5173')).toBe(true);
  });

  test('keeps loopback wildcard disabled in production', () => {
    expect(isDevelopmentLoopbackOrigin('http://localhost:61800', 'production')).toBe(false);

    const isAllowed = createCorsOriginChecker({
      defaultOrigins: ['https://calendar.home.local'],
      origins: [],
      nodeEnv: 'production',
    });

    expect(isAllowed('http://localhost:61800')).toBe(false);
    expect(isAllowed('http://127.0.0.1:61800')).toBe(false);
  });

  test('rejects lookalike origins', () => {
    const isAllowed = createCorsOriginChecker({
      defaultOrigins: ['https://calendar.home.local'],
      origins: [],
      nodeEnv: 'development',
    });

    expect(isAllowed('https://calendar.home.local.evil.test')).toBe(false);
    expect(isAllowed('http://localhost.evil.test:61800')).toBe(false);
  });
});
