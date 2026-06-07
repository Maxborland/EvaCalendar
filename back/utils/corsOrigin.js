const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
};

const isLoopbackHostname = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  hostname === '[::1]';

const isDevelopmentLoopbackOrigin = (origin, nodeEnv) => {
  if (nodeEnv === 'production') return false;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && isLoopbackHostname(parsed.hostname);
  } catch {
    return false;
  }
};

const createCorsOriginChecker = ({ defaultOrigins = [], origins = [], nodeEnv = 'development' }) => {
  const allowedOrigins = [...defaultOrigins, ...origins]
    .map(normalizeOrigin)
    .filter(Boolean);
  const allowedSet = new Set(allowedOrigins);

  return (origin) => {
    if (!origin) return true;

    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return false;

    return allowedSet.has(normalizedOrigin) ||
      isDevelopmentLoopbackOrigin(normalizedOrigin, nodeEnv);
  };
};

module.exports = {
  createCorsOriginChecker,
  isDevelopmentLoopbackOrigin,
};
