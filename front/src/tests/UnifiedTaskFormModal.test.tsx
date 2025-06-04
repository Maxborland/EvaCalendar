import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import * as api from '../services/api';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  ...vi.importActual('../services/api'),
  getAllChildren: vi.fn(),
  getExpenseCategories: vi.fn(),
  addChild: vi.fn(),
  updateChildAPI: vi.fn(),
}));

interface MockUnifiedChildSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  childrenList: api.Child[];
  label: string;
  placeholder: string;
  onAddNewChildRequest: () => void;
}

vi.mock('../components/UnifiedChildSelector', () => ({
  __esModule: true,
  default: vi.fn(({ value, onChange, childrenList, label, placeholder, onAddNewChildRequest }: MockUnifiedChildSelectorProps) => (
    <div data-testid="unified-child-selector">
      <label htmlFor="child-selector">{label}</label>
      <select
        id="child-selector"
        data-testid="child-selector-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {childrenList.map((child: api.Child) => (
          <option key={child.uuid} value={child.uuid}>
            {child.childName}
          </option>
        ))}
      </select>
      <button onClick={onAddNewChildRequest}>Добавить ребенка</button>
    </div>
  )),
}));

const mockChildren: api.Child[] = [
  { uuid: 'child-1', childName: 'Ребенок 1', hourlyRate: 100, address: 'Адрес 1', parentName: 'Родитель 1', parentPhone: '123', comment: null },
  { uuid: 'child-2', childName: 'Ребенок 2', hourlyRate: 150, address: 'Адрес 2', parentName: 'Родитель 2', parentPhone: '456', comment: null },
];

const mockCategories: api.ExpenseCategory[] = [
  { uuid: 'cat-1', categoryName: 'Продукты' },
  { uuid: 'cat-2', categoryName: 'Транспорт' },
];

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();
const mockOnDelete = vi.fn();

interface TestSpecificProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (taskData: api.Task | Omit<api.Task, 'uuid'>) => void;
  mode?: 'create' | 'edit';
  initialTaskData?: api.Task;
  initialTaskType?: 'income' | 'expense';
  onDelete?: (uuid: string) => void;
  onDuplicate?: (uuid: string) => void;
}

const baseDefaultProps: Required<Omit<TestSpecificProps, 'initialTaskData' | 'onDelete' | 'onDuplicate'>> & Pick<TestSpecificProps, 'initialTaskData' | 'onDelete' | 'onDuplicate'> = {
  isOpen: true,
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
  mode: 'create',
  initialTaskData: undefined,
  initialTaskType: 'income',
  onDelete: undefined,
  onDuplicate: undefined,
};

const renderModal = async (testSpecificProps: TestSpecificProps = {}) => {
  const currentProps = { ...baseDefaultProps, ...testSpecificProps };
  (api.getAllChildren as import('vitest').Mock).mockResolvedValue([...mockChildren]);
  (api.getExpenseCategories as import('vitest').Mock).mockResolvedValue([...mockCategories]);

  let utils;
  await act(async () => {
    utils = render(<UnifiedTaskFormModal {...currentProps} />);
  });

  let finalInitialType: 'income' | 'expense';
  const { mode, initialTaskData, initialTaskType } = currentProps;

  if (mode === 'edit' && initialTaskData) {
    if (initialTaskType) {
      finalInitialType = initialTaskType;
    } else {
      finalInitialType = initialTaskData.taskType === 'expense' ? 'expense' : (initialTaskData.type === 'expense' ? 'expense' : 'income');
    }
  } else {
    finalInitialType = initialTaskType || 'income';
  }

  await waitFor(() => expect(api.getAllChildren).toHaveBeenCalled(), { timeout: 2000 });
  await waitFor(() => expect(api.getExpenseCategories).toHaveBeenCalled(), { timeout: 2000 });

  if (finalInitialType === 'income') {
    // Check if child selector is present before trying to find options
    if (screen.queryByTestId('child-selector-select')) {
      await screen.findByRole('option', { name: mockChildren[0].childName }, { timeout: 3000 });
    }
  } else { // 'expense'
    // Check if category selector is present
    if (screen.queryByLabelText(/Категория:/i)) {
      await screen.findByRole('option', { name: mockCategories[0].categoryName }, { timeout: 3000 });
    }
  }
  return utils!;
};

describe('UnifiedTaskFormModal', () => {
  let modalRoot: HTMLElement;

  beforeEach(async () => {
    modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
    vi.clearAllMocks();
    (api.getAllChildren as import('vitest').Mock).mockReset().mockResolvedValue([...mockChildren]);
    (api.getExpenseCategories as import('vitest').Mock).mockReset().mockResolvedValue([...mockCategories]);
  });

  afterEach(() => {
    if (document.body.contains(modalRoot)) {
        document.body.removeChild(modalRoot);
    }
    // @ts-ignore
    modalRoot = null;
  });

  test('должен отображаться, когда isOpen === true', async () => {
    await renderModal({initialTaskType: 'income'});
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
  });

  test('не должен отображаться, когда isOpen === false', async () => {
    (api.getAllChildren as import('vitest').Mock).mockResolvedValue([...mockChildren]);
    (api.getExpenseCategories as import('vitest').Mock).mockResolvedValue([...mockCategories]);
    await act(async () => {
        render(<UnifiedTaskFormModal {...baseDefaultProps} isOpen={false} />);
    });
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  describe('Переключение типа задачи (Доход/Расход)', () => {
    test('должен инициализироваться с типом "Доход" по умолчанию в режиме create', async () => {
      await renderModal({ mode: 'create', initialTaskType: undefined });
      expect(screen.getByLabelText(/Доход/i)).toBeChecked();
      expect(screen.getByTestId('unified-child-selector')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Категория:/i)).not.toBeInTheDocument();
    });

    test('должен инициализироваться с типом "Расход", если initialTaskType="expense" в режиме create', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'expense' });
      expect(screen.getByLabelText(/Расход/i)).toBeChecked();
      expect(screen.getByLabelText(/Категория:/i)).toBeInTheDocument();
      expect(screen.queryByTestId('unified-child-selector')).not.toBeInTheDocument();
    });
  });

  describe('Предзаполнение формы в режиме edit', () => {
    const incomeTask: api.Task = {
      uuid: 'task-income-1', title: 'Доход от занятия', type: 'hourly', taskType: 'income',
      dueDate: '2024-07-15', time: '14:00', childId: 'child-1', childName: 'Ребенок 1',
      hourlyRate: 100, hoursWorked: 2, amount: 200, comments: 'Комментарий к доходу',
    };
    const expenseTask: api.Task = {
      uuid: 'task-expense-1', title: 'Покупка продуктов', type: 'expense', taskType: 'expense',
      dueDate: '2024-07-16', expenseTypeId: 'cat-1', expenseCategoryName: 'Продукты',
      amount: 1500, comments: 'Комментарий к расходу',
    };

    test('должен корректно предзаполнять поля для задачи типа "Доход"', async () => {
      await renderModal({ mode: 'edit', initialTaskData: incomeTask, initialTaskType: 'income' });
      await waitFor(() => expect(screen.getByLabelText(/Доход/i)).toBeChecked());
      // incomeTask.title ('Доход от занятия') не соответствует mockChildren[0].childName ('Ребенок 1')
      // Поэтому, если isNameManuallyEdited=true при загрузке (т.к. title не пуст), то сохранится incomeTask.title
      expect(screen.getByLabelText(/Название:/i)).toHaveValue(incomeTask.title);
      expect(screen.getByTestId('child-selector-select')).toHaveValue(incomeTask.childId);
      const amountInput = screen.getByLabelText(/Заработано:/i);
      expect(amountInput).toHaveValue(incomeTask.amount);
    });

    test('должен предзаполнять "имя ребенка" и "заработано" для задачи "Доход" с childId, и генерировать имя если оно было пустым', async () => {
      const taskWithChildNoTitle: api.Task = {
        uuid: 'task-child-income-2',
        title: '', // Пустое название
        type: 'fixed',
        taskType: 'income',
        dueDate: '2024-08-02',
        childId: mockChildren[1].uuid,
        childName: mockChildren[1].childName,
        amount: 600,
        comments: 'Тестовый доход с ребенком без названия',
      };
      await renderModal({ mode: 'edit', initialTaskData: taskWithChildNoTitle, initialTaskType: 'income' });

      await waitFor(() => expect(screen.getByLabelText(/Доход/i)).toBeChecked());
      expect(screen.getByLabelText(/Название:/i)).toHaveValue(`Доход от ${mockChildren[1].childName}`);

      const childSelector = screen.getByTestId('child-selector-select');
      expect(childSelector).toHaveValue(taskWithChildNoTitle.childId);
      const earnedAmountInput = screen.getByLabelText(/Заработано:/i);
      expect(earnedAmountInput).toHaveValue(taskWithChildNoTitle.amount);
    });

    test('должен предзаполнять "имя ребенка" и "заработано" для задачи "Доход" с childId, сохраняя введенное имя', async () => {
      const taskWithChild: api.Task = {
        uuid: 'task-child-income-1',
        title: 'Доход с ребенком (вручную)', // Непустое название, не соответствующее child_name
        type: 'fixed',
        taskType: 'income',
        dueDate: '2024-08-01',
        childId: mockChildren[0].uuid, // Ребенок 1
        childName: mockChildren[0].childName,
        amount: 500,
        comments: 'Тестовый доход с ребенком',
      };
      await renderModal({ mode: 'edit', initialTaskData: taskWithChild, initialTaskType: 'income' });

      await waitFor(() => expect(screen.getByLabelText(/Доход/i)).toBeChecked());
      // Ожидаем сохраненное имя, так как оно было не пустым и isNameManuallyEdited=true
      expect(screen.getByLabelText(/Название:/i)).toHaveValue(taskWithChild.title);

      const childSelector = screen.getByTestId('child-selector-select');
      expect(childSelector).toHaveValue(taskWithChild.childId);

      // Проверка предзаполнения "Заработано"
      const earnedAmountInput = screen.getByLabelText(/Заработано:/i);
      expect(earnedAmountInput).toHaveValue(taskWithChild.amount);
    });

    test('должен корректно предзаполнять поля для задачи типа "Расход"', async () => {
      await renderModal({ mode: 'edit', initialTaskData: expenseTask, initialTaskType: 'expense' });
      await waitFor(() => expect(screen.getByLabelText(/Расход/i)).toBeChecked());
      expect(screen.getByLabelText(/Название:/i)).toHaveValue(expenseTask.title);
      expect(screen.getByLabelText(/Категория:/i)).toHaveValue(expenseTask.expenseCategoryName);
      // Проверяем поле "Потрачено"
      const amountInput = screen.getByLabelText(/Потрачено:/i);
      expect(amountInput).toHaveValue(expenseTask.amount);
    });
  });

  describe('Отправка данных (onSubmit)', () => {
    test('должен отправлять корректные данные для новой задачи "Доход" (тип fixed)', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: 'Новый доход' } });
        const childSelector = screen.getByTestId('child-selector-select');
        fireEvent.change(childSelector, { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => expect(screen.getByTestId('child-selector-select')).toHaveValue(mockChildren[0].uuid), {timeout: 2000});

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Время:/i), { target: { value: '10:00' } });
        fireEvent.change(screen.getByLabelText(/Заработано:/i), { target: { value: '500' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 });
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[0].childName}`, taskType: 'income', type: 'fixed', childId: mockChildren[0].uuid,
        childName: mockChildren[0].childName, amount: 500,
      }));
    });

    test('должен отправлять корректные данные для новой задачи "Доход" (тип hourly)', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: 'Почасовой доход' } });
        const childSelector = screen.getByTestId('child-selector-select');
        fireEvent.change(childSelector, { target: { value: mockChildren[1].uuid } });
      });
      await waitFor(() => expect(screen.getByTestId('child-selector-select')).toHaveValue(mockChildren[1].uuid), {timeout: 2000});

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Часов отработано:/i), { target: { value: '3' } });
      });
      await waitFor(() => {
         expect(screen.getByLabelText(/Заработано:/i)).toBeDisabled();
         expect(screen.getByLabelText(/Заработано:/i)).toHaveValue(mockChildren[1].hourlyRate! * 3);
      }, {timeout: 2000});
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 });
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[1].childName}`, taskType: 'income', type: 'hourly', childId: mockChildren[1].uuid,
        childName: mockChildren[1].childName, hoursWorked: 3, hourlyRate: mockChildren[1].hourlyRate,
        amount: mockChildren[1].hourlyRate! * 3,
      }));
    });

    test('должен отправлять корректные данные для новой задачи "Расход"', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'expense' });
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: 'Новый расход' } });
        const categorySelect = screen.getByLabelText(/Категория:/i);
        fireEvent.change(categorySelect, { target: { value: mockCategories[0].categoryName } });
        fireEvent.change(screen.getByLabelText(/Потрачено:/i), { target: { value: '300' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 });
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: mockCategories[0].categoryName, taskType: 'expense', type: 'expense', expenseTypeId: mockCategories[0].uuid,
        expenseCategoryName: mockCategories[0].categoryName, amount: 300,
      }));
    });

    test('должен генерировать название для дохода, если оно не введено', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        const childSelector = screen.getByTestId('child-selector-select');
        fireEvent.change(childSelector, { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => expect(screen.getByTestId('child-selector-select')).toHaveValue(mockChildren[0].uuid), {timeout: 2000});

      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Заработано:/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 });
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[0].childName}`,
        childName: mockChildren[0].childName,
      }));
    });

    test('не должен вызывать onSubmit, если категория для расхода не выбрана (из-за HTML5 validation)', async () => {
        const customOnSubmit = vi.fn();
        await renderModal({ mode: 'create', initialTaskType: 'expense', onSubmit: customOnSubmit });

        await act(async () => {
          // Не выбираем категорию
          fireEvent.change(screen.getByLabelText(/Потрачено:/i), { target: { value: '200' } });
        });

        const submitButton = screen.getByRole('button', { name: /Создать/i });
        // HTML5 валидация должна предотвратить submit
        // Мы не можем легко проверить это напрямую без отправки реального события submit,
        // которое может быть заблокировано браузером/jsdom.
        // Вместо этого, мы кликаем и проверяем, что onSubmit НЕ был вызван.
        await act(async () => {
            fireEvent.click(submitButton);
        });

        // Даем немного времени, чтобы убедиться, что submit не произошел
        await new Promise(r => setTimeout(r, 200));
        expect(customOnSubmit).not.toHaveBeenCalled();
      });
  });

  describe('Динамическое обновление названия задачи', () => {
    test('при выборе ребенка (когда title пуст) -> title обновляется', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      expect(screen.getByLabelText(/Название:/i)).toHaveValue('');
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue(`Доход от ${mockChildren[0].childName}`);
      });
    });

    test('при выборе ребенка (когда title введен вручную) -> title НЕ обновляется', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      const titleInput = screen.getByLabelText(/Название:/i);
      await act(async () => {
        fireEvent.change(titleInput, { target: { value: 'Мое название' } });
      });
      expect(titleInput).toHaveValue('Мое название');
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => { // Небольшая задержка, чтобы убедиться, что useEffect не перезаписал
         expect(titleInput).toHaveValue('Мое название');
      });
    });

    test('при очистке выбора ребенка (когда title был автосгенерирован) -> title очищается', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue(`Доход от ${mockChildren[0].childName}`);
      });
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: '' } }); // Очищаем выбор
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue('');
      });
    });

    test('при очистке выбора ребенка (когда title введен вручную) -> title НЕ обновляется', async () => {
        await renderModal({ mode: 'create', initialTaskType: 'income' });
        const titleInput = screen.getByLabelText(/Название:/i);
        await act(async () => {
          fireEvent.change(titleInput, { target: { value: 'Ручной ввод' } });
          fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
        });
        await waitFor(() => expect(titleInput).toHaveValue('Ручной ввод')); // Убедимся, что ручной ввод сохранился

        await act(async () => {
          fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: '' } }); // Очищаем выбор ребенка
        });

        await waitFor(() => { // Небольшая задержка для уверенности
          expect(titleInput).toHaveValue('Ручной ввод'); // Название не должно измениться
        });
    });

    test('при смене типа задачи с "Доход" (с автосгенерированным именем) на "Расход" -> title очищается', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue(`Доход от ${mockChildren[0].childName}`);
      });
      await act(async () => {
        fireEvent.click(screen.getByLabelText(/Расход/i)); // Переключаем на Расход
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue('');
      });
    });

    test('если пользователь стирает вручную введенное имя -> автогенерация снова работает при выборе ребенка', async () => {
        await renderModal({ mode: 'create', initialTaskType: 'income' });
        const titleInput = screen.getByLabelText(/Название:/i);
        await act(async () => {
          fireEvent.change(titleInput, { target: { value: 'Мое супер название' } });
        });
        expect(titleInput).toHaveValue('Мое супер название');

        // Выбираем ребенка, название не должно измениться
        await act(async () => {
          fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
        });
        await waitFor(() => expect(titleInput).toHaveValue('Мое супер название'));

        // Стираем название
        await act(async () => {
          fireEvent.change(titleInput, { target: { value: '' } });
        });
        // После очистки поля, если ребенок УЖЕ БЫЛ ВЫБРАН (mockChildren[0]),
        // useEffect для title должен был сработать и заполнить его.
        // Поэтому проверяем, что оно заполнилось автоматически.
        await waitFor(() => {
            expect(titleInput).toHaveValue(`Доход от ${mockChildren[0].childName}`);
        });

        // Теперь, при выборе другого ребенка, название должно автосгенерироваться для нового ребенка
        await act(async () => {
          fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[1].uuid } });
        });
        await waitFor(() => {
          expect(titleInput).toHaveValue(`Доход от ${mockChildren[1].childName}`);
        });
      });
  });

  describe('Кнопки "Удалить" и "Дублировать"', () => {
    const taskForActions: api.Task = {
      uuid: 'task-actions-uuid', title: 'Задача для действий', type: 'fixed',
      taskType: 'income', dueDate: '2024-01-01',
    };

    test('кнопка "Удалить" должна отображаться и работать корректно', async () => {
      await renderModal({ mode: 'edit', initialTaskData: taskForActions, onDelete: mockOnDelete, initialTaskType: 'income' });
      const deleteButton = screen.getByRole('button', { name: /Удалить/i });
      expect(deleteButton).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(taskForActions.uuid);
    });
  });

  describe('Взаимодействие с ChildForm (через UnifiedChildSelector)', () => {
    test('должен открывать ChildForm при запросе от UnifiedChildSelector (onAddNewChildRequest)', async () => {
        await renderModal({ mode: 'create', initialTaskType: 'income' });
        const addChildButton = screen.getByTestId('unified-child-selector').querySelector('button');
        expect(addChildButton).toBeInTheDocument();
        await act(async () => {
          if (addChildButton) fireEvent.click(addChildButton);
        });
        await waitFor(() => {
            expect(screen.getByTestId('child-form-modal-overlay')).toBeInTheDocument();
        });
    });
  });
describe('Принудительное обновление названия при сохранении (handleSubmit)', () => {
    test('Режим CREATE: если название пустое, оно генерируется для Дохода', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
        fireEvent.change(screen.getByLabelText(/Заработано:/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[0].childName}`,
      }));
    });

    test('Режим CREATE: если название пустое, оно генерируется для Расхода', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'expense' });
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Категория:/i), { target: { value: mockCategories[0].categoryName } });
        fireEvent.change(screen.getByLabelText(/Потрачено:/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: mockCategories[0].categoryName,
      }));
    });

    test('Режим CREATE: пользователь ввел название, соответствующее ребенку/типу -> название СОХРАНЯЕТСЯ', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      const expectedTitle = `Доход от ${mockChildren[0].childName}`;
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: expectedTitle } });
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
        fireEvent.change(screen.getByLabelText(/Заработано:/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: expectedTitle,
      }));
    });

    test('Режим CREATE: пользователь ввел название, НЕ соответствующее ребенку/типу -> название ПЕРЕЗАПИСЫВАЕТСЯ', async () => {
      await renderModal({ mode: 'create', initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: 'Неправильное название' } });
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[0].uuid } });
        fireEvent.change(screen.getByLabelText(/Заработано:/i), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: /Создать/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[0].childName}`, // Ожидаем автосгенерированное
      }));
    });

    const initialTaskForEdit: api.Task = {
      uuid: 'edit-task-1', title: 'Старое название', type: 'fixed', taskType: 'income',
      dueDate: '2024-01-01', childId: mockChildren[0].uuid, childName: mockChildren[0].childName, amount: 100,
    };

    test('Режим EDIT: ребенок изменен, старое название НЕ соответствует -> название ПЕРЕЗАПИСЫВАЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      await act(async () => {
        // Меняем ребенка на второго
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[1].uuid } });
      });
      // Убедимся, что formData.title не изменился динамически (он и не должен из-за isNameManuallyEdited)
      await waitFor(() => {
        expect(screen.getByLabelText(/Название:/i)).toHaveValue(initialTaskForEdit.title); // "Старое название"
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[1].childName}`, // Ожидаем новое автосгенерированное
        childId: mockChildren[1].uuid,
        childName: mockChildren[1].childName,
      }));
    });

    test('Режим EDIT: тип изменен (Доход->Расход), старое название НЕ соответствует -> название ПЕРЕЗАПИСЫВАЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      await act(async () => {
        fireEvent.click(screen.getByLabelText(/Расход/i)); // Меняем тип на Расход
        fireEvent.change(screen.getByLabelText(/Категория:/i), { target: { value: mockCategories[1].categoryName } });
        fireEvent.change(screen.getByLabelText(/Потрачено:/i), { target: { value: '200' } });
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: mockCategories[1].categoryName, // Ожидаем новое автосгенерированное для расхода
        taskType: 'expense',
        expenseTypeId: mockCategories[1].uuid,
      }));
    });

    test('Режим EDIT: ребенок изменен, пользователь ввел НОВОЕ название, СООТВЕТСТВУЮЩЕЕ новому ребенку -> название СОХРАНЯЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      const manuallyEnteredTitle = `Доход от ${mockChildren[1].childName}`; // Пользователь сам ввел правильное
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[1].uuid } });
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: manuallyEnteredTitle } });
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: manuallyEnteredTitle,
        childId: mockChildren[1].uuid,
      }));
    });

    test('Режим EDIT: ребенок изменен, пользователь ввел НОВОЕ название, НЕ соответствующее новому ребенку -> название ПЕРЕЗАПИСЫВАЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      await act(async () => {
        fireEvent.change(screen.getByTestId('child-selector-select'), { target: { value: mockChildren[1].uuid } });
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: 'Совсем другое название' } });
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: `Доход от ${mockChildren[1].childName}`, // Ожидаем автосгенерированное для нового ребенка
        childId: mockChildren[1].uuid,
      }));
    });

    test('Режим EDIT: ребенок/тип НЕ изменены, пользователь изменил название -> название СОХРАНЯЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      const newManualTitle = "Новое ручное название";
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/Название:/i), { target: { value: newManualTitle } });
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: newManualTitle,
        childId: initialTaskForEdit.childId, // Ребенок не менялся
      }));
    });

    test('Режим EDIT: ребенок/тип НЕ изменены, название НЕ изменено -> старое название СОХРАНЯЕТСЯ', async () => {
      await renderModal({ mode: 'edit', initialTaskData: initialTaskForEdit, initialTaskType: 'income' });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
      });
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: initialTaskForEdit.title, // Старое название
        childId: initialTaskForEdit.childId,
      }));
    });

    test('Режим EDIT: задача загружена с ПУСТЫМ названием, выбран ребенок -> название ГЕНЕРИРУЕТСЯ', async () => {
        const taskWithEmptyTitle: api.Task = {
            ...initialTaskForEdit,
            title: '', // Пустое название при загрузке
        };
        await renderModal({ mode: 'edit', initialTaskData: taskWithEmptyTitle, initialTaskType: 'income' });
        // Ребенок уже выбран из initialTaskData (mockChildren[0])
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
        });
        await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
            title: `Доход от ${mockChildren[0].childName}`,
            childId: mockChildren[0].uuid,
        }));
    });
  });
});