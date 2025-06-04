import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('./components/LoadingAnimation', () => ({
  __esModule: true, // Эта строка важна для ES модулей
  default: () => <div data-testid="loading-animation-mock">Loading...</div>,
}));