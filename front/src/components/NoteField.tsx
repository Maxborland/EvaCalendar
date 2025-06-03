import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createNote, getNoteByDate, updateNote, type Note } from '../services/api';
// import './NoteField.css'; // Стиль будет через Tailwind

interface NoteFieldProps {
  weekId: string;
  onNoteSaved?: () => void; // Опциональный колбэк
}

const NoteField: React.FC<NoteFieldProps> = ({ weekId, onNoteSaved }) => {
  const [noteContent, setNoteContent] = useState('');
  const [noteUuid, setNoteUuid] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!weekId) return; // Не делаем запрос, если weekId не предоставлен

      setIsLoading(true);
      setError(null);
      try {
        const data = await getNoteByDate(weekId);
        if (data && typeof data === 'object' && !Array.isArray(data)) { // Добавлена проверка, что data это объект, а не массив
          setNoteContent(data.content);
          setNoteUuid(data.uuid);
        } else {
          if (Array.isArray(data) && data.length > 0) {
            setNoteContent(data[0].content); // Временно используем первую заметку из массива
            setNoteUuid(data[0].uuid);
          } else {
            setNoteContent('');
            setNoteUuid(null);
          }
        }
        setHasChanges(false);
      } catch (err: any) {
        console.error('Error fetching note:', err);
        setError(err.message || 'Не удалось загрузить заметку.');
        setNoteContent('');
        setNoteUuid(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [weekId]);

  const handleSaveNote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let savedNote: Note;
      if (noteUuid) {
        savedNote = await updateNote(noteUuid, noteContent);
        toast.success('Заметка обновлена!');
      } else {
        savedNote = await createNote(weekId, noteContent);
        setNoteUuid(savedNote.uuid); // Обновляем UUID после создания
        toast.success('Заметка создана!');
      }
      setNoteContent(savedNote.content); // Обновляем контент из ответа сервера
      setHasChanges(false);
      if (onNoteSaved) {
        onNoteSaved(); // Вызываем колбэк
      }
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Не удалось сохранить заметку.');
      toast.error(err.message || 'Ошибка при сохранении заметки.');
    } finally {
      setIsLoading(false);
    }
  };

  // Логика автосохранения при изменении (debounce можно добавить позже)
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const timer = setTimeout(() => {
        handleSaveNote();
      }, 1500); // Автосохранение через 1.5 секунды после последнего изменения
      return () => clearTimeout(timer);
    }
  }, [noteContent, hasChanges, isLoading]); // Зависимость от handleSaveNote не нужна, т.к. он useCallback-нут в оригинале не был, но здесь его нет

  if (isLoading && !noteContent && !error) {
    return (
      // Используем классы из макета для обертки и заголовка
      <section className="bg-card rounded-lg p-4 col-span-1"> {/* col-span-1 или col-span-2 будет управляться из WeekView */}
        <h2 className="text-md font-semibold mb-2">Заметки</h2>
        <p className="text-sm text-gray-500">Загрузка заметок...</p>
      </section>
    );
  }

  return (
    // Классы из макета: docs/new_design_main_page.html строки 146-149
    <section className="bg-card rounded-lg p-4 col-span-1"> {/* Управлять col-span-* лучше из родителя (WeekView) */}
      <h2 className="text-md font-semibold mb-2">Заметки</h2>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <textarea
        className="w-full bg-gray-700 p-3 rounded-md text-sm text-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
        value={noteContent}
        onChange={(e) => {
          setNoteContent(e.target.value);
          setHasChanges(true);
        }}
        placeholder="Введите заметки здесь..."
        rows={3} // Как в макете
        disabled={isLoading}
      />
      {/* Кнопка "Сохранить" удалена согласно макету. Логика сохранения осталась и может быть привязана к onBlur или debounce. */}
      {/* Если нужно явно показать статус сохранения: */}
      {/* {isLoading && hasChanges && <p className="text-xs text-gray-400 mt-1">Сохранение...</p>} */}
      {/* {!isLoading && !hasChanges && noteUuid && <p className="text-xs text-green-400 mt-1">Сохранено</p>} */}
    </section>
  );
};

export default NoteField;