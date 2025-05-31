import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import { vi, type Mock } from 'vitest';
import NoteField from '../components/NoteField';
import * as api from '../services/api';

// Мокируем сервисы API и react-toastify
vi.mock('../services/api');
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockGetNoteByDate = api.getNoteByDate as Mock<typeof api.getNoteByDate>;
const mockCreateNote = api.createNote as Mock<typeof api.createNote>;
const mockUpdateNote = api.updateNote as Mock<typeof api.updateNote>;

const mockToastSuccess = toast.success as Mock;
const mockToastError = toast.error as Mock;

const initialWeekId = '2024-01-01';
const existingNote = {
  uuid: 'note-uuid-123',
  date: initialWeekId,
  content: 'Это существующая заметка.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const newNoteContent = 'Это новая заметка.';
const updatedNoteContent = 'Это обновленная заметка.';

describe('NoteField Component', () => {
  beforeEach(() => {
    // Сбрасываем все моки перед каждым тестом
    mockGetNoteByDate.mockReset();
    mockCreateNote.mockReset();
    mockUpdateNote.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  test('отображает компонент и состояние загрузки', () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    render(<NoteField weekId={initialWeekId} />);
    expect(screen.getByText('Заметки')).toBeInTheDocument();
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  test('загружает и отображает существующую заметку', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(existingNote);
    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toHaveValue(existingNote.content);
    });
    expect(mockGetNoteByDate).toHaveBeenCalledWith(initialWeekId);
  });

  test('отображает пустое поле, если заметки нет', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toHaveValue('');
    });
  });

  test('создает новую заметку', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    const createdNote = { ...existingNote, content: newNoteContent, uuid: 'new-uuid-456' };
    mockCreateNote.mockResolvedValueOnce(createdNote);

    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => { // Дожидаемся окончания начальной загрузки
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Введите заметки здесь...');
    fireEvent.change(textarea, { target: { value: newNoteContent } });
    expect(textarea).toHaveValue(newNoteContent);

    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith(initialWeekId, newNoteContent);
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Заметка создана!');
    });
    // Проверяем, что UUID обновился и контент тоже
    await waitFor(() => {
        expect(textarea).toHaveValue(newNoteContent); // Контент должен остаться
    });
  });

  test('обновляет существующую заметку', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(existingNote);
    const updatedApiNote = { ...existingNote, content: updatedNoteContent };
    mockUpdateNote.mockResolvedValueOnce(updatedApiNote);

    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toHaveValue(existingNote.content);
    });

    const textarea = screen.getByPlaceholderText('Введите заметки здесь...');
    fireEvent.change(textarea, { target: { value: updatedNoteContent } });
    expect(textarea).toHaveValue(updatedNoteContent);

    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(existingNote.uuid, updatedNoteContent);
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Заметка обновлена!');
    });
     await waitFor(() => {
        expect(textarea).toHaveValue(updatedNoteContent);
    });
  });

  test('обрабатывает ошибку при загрузке заметки', async () => {
    const errorMessage = 'Ошибка загрузки';
    mockGetNoteByDate.mockRejectedValueOnce(new Error(errorMessage));
    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('обрабатывает ошибку при создании заметки', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    const errorMessage = 'Ошибка создания';
    mockCreateNote.mockRejectedValueOnce(new Error(errorMessage));

    render(<NoteField weekId={initialWeekId} />);
    await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите заметки здесь...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Введите заметки здесь...'), { target: { value: newNoteContent } });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
    });
     await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Ошибка должна отобразиться в компоненте
    });
  });

  test('обрабатывает ошибку при обновлении заметки', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(existingNote);
    const errorMessage = 'Ошибка обновления';
    mockUpdateNote.mockRejectedValueOnce(new Error(errorMessage));

    render(<NoteField weekId={initialWeekId} />);
     await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toHaveValue(existingNote.content);
    });

    fireEvent.change(screen.getByPlaceholderText('Введите заметки здесь...'), { target: { value: updatedNoteContent } });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
    });
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Ошибка должна отобразиться в компоненте
    });
  });

  test('кнопка Сохранить неактивна, если нет изменений', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(existingNote);
    render(<NoteField weekId={initialWeekId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите заметки здесь...')).toHaveValue(existingNote.content);
    });
    expect(screen.queryByText('Сохранить')).not.toBeInTheDocument();
  });

  test('кнопка Сохранить становится активной после изменений', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    render(<NoteField weekId={initialWeekId} />);
    await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите заметки здесь...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Введите заметки здесь...'), { target: { value: 'Новый текст' } });
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
    expect(screen.getByText('Сохранить')).not.toBeDisabled();
  });

   test('кнопка Сохранить заблокирована во время сохранения', async () => {
    mockGetNoteByDate.mockResolvedValueOnce(null);
    // Заставляем createNote "зависнуть", чтобы проверить состояние кнопки
    mockCreateNote.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ...existingNote, uuid: 'new-uuid', content: newNoteContent }), 100)));

    render(<NoteField weekId={initialWeekId} />);
    await waitFor(() => {
        expect(screen.getByPlaceholderText('Введите заметки здесь...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Введите заметки здесь...'), { target: { value: newNoteContent } });
    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);

    expect(saveButton).toHaveTextContent('Сохранение...');
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Заметка создана!');
    }, { timeout: 500 }); // Увеличиваем таймаут, если нужно
  });
});