import { render, screen } from '@testing-library/react';
import moment from 'moment';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WeekDaysScroller from '../components/WeekDaysScroller';

// Mock the scrollWidth and scrollLeft for the div element
Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  value: 1000, // A dummy value for scrollWidth
});

Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
  configurable: true,
  writable: true,
});

// Mock the style object for the div element to check transform property
// This will simulate the style object and its properties
const mockStyle = {
  transform: '',
};

Object.defineProperty(HTMLElement.prototype, 'style', {
  configurable: true,
  get() {
    return mockStyle;
  },
});

describe('WeekDaysScroller', () => {
  const commonProps = {
    weekInfo: { id: 'some-id', startDate: '2025-05-26', endDate: '2025-06-01' },
    firstHalfDays: [
      moment('2025-05-26'), // Monday
      moment('2025-05-27'), // Tuesday
      moment('2025-05-28'), // Wednesday
    ],
    secondHalfDays: [
      moment('2025-05-29'), // Thursday
      moment('2025-05-30'), // Friday
      moment('2025-05-31'), // Saturday
      moment('2025-06-01'), // Sunday
    ],
    onTaskMove: () => {},
    today: moment('2025-05-30'), // Устанавливаем today для соответствия prop-типу
  };

  it('скроллит влево, когда отображается первая половина недели', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <WeekDaysScroller {...commonProps} isFirstHalfVisible={true} />
      </DndProvider>
    );
    const scrollContainer = screen.getByTestId('week-days-container');
    expect(scrollContainer.style.transform).toBe('translateX(0)');
  });

  it('скроллит вправо, когда отображается вторая половина недели', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <WeekDaysScroller {...commonProps} isFirstHalfVisible={false} />
      </DndProvider>
    );
    const scrollContainer = screen.getByTestId('week-days-container');
    expect(scrollContainer.style.transform).toBe('translateX(-50%)');
  });
});