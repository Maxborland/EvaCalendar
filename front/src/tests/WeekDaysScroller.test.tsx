import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WeekDaysScroller from '../components/WeekDaysScroller';
import { NavProvider } from '../context/NavContext';
import type { Task } from '../services/api'; // Импортируем Task для tasksForWeek
import { createDate } from '../utils/dateUtils';

// Mock the scrollWidth and scrollLeft for the div element
Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  value: 1000, // A dummy value for scrollWidth
});

Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
  configurable: true,
  writable: true,
  value: 0, // Начальное значение
});

// Mock the style object for the div element to check transform property
let mockTransformValue = '';
const mockStyle = {
  // Используем getter и setter для transform, чтобы отслеживать изменения
  get transform() {
    return mockTransformValue;
  },
  set transform(value: string) {
    mockTransformValue = value;
  },
  // Добавим другие свойства, если они используются и их нужно мокать
};

Object.defineProperty(HTMLElement.prototype, 'style', {
  configurable: true,
  get() {
    return mockStyle;
  },
});

describe('WeekDaysScroller', () => {
  beforeEach(() => {
    // Сбрасываем mockTransformValue перед каждым тестом
    mockTransformValue = '';
    // Сбрасываем scrollLeft
    (HTMLElement.prototype as any).scrollLeft = 0;
  });

  const commonProps = {
    tasksForWeek: [] as Task[], // Заменяем weekInfo на tasksForWeek
    notesForWeek: [], // Добавляем недостающий проп
    firstHalfDays: [
      createDate('2025-05-26'), // Monday
      createDate('2025-05-27'), // Tuesday
      createDate('2025-05-28'), // Wednesday
    ],
    secondHalfDays: [
      createDate('2025-05-29'), // Thursday
      createDate('2025-05-30'), // Friday
      createDate('2025-05-31'), // Saturday
      createDate('2025-06-01'), // Sunday
    ],
    onTaskMove: () => {},
    today: createDate('2025-05-30'),
    onOpenTaskModal: () => {}, // Добавляем недостающий mock проп
  };

  it('скроллит влево (transform: translateX(0)), когда отображается первая половина недели', () => {
    render(
      <NavProvider>
        <DndProvider backend={HTML5Backend}>
          <WeekDaysScroller {...commonProps} isFirstHalfVisible={true} />
        </DndProvider>
      </NavProvider>
    );
    const scrollContainer = screen.getByTestId('week-days-container');
    // Проверяем значение, установленное через mockStyle
    expect(scrollContainer.style.transform).toBe('translateX(0)');
  });

  it('скроллит вправо (transform: translateX(-50%)), когда отображается вторая половина недели', () => {
    render(
      <NavProvider>
        <DndProvider backend={HTML5Backend}>
          <WeekDaysScroller {...commonProps} isFirstHalfVisible={false} />
        </DndProvider>
      </NavProvider>
    );
    const scrollContainer = screen.getByTestId('week-days-container');
    // Проверяем значение, установленное через mockStyle
    expect(scrollContainer.style.transform).toBe('translateX(-50%)');
  });
});