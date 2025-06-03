import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNote, getNoteByDate, type Note, updateNote } from '../services/api';
// import './NoteDetailsPage.css'; // Стили будут через Tailwind или позже

const NoteDetailsPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const [noteContent, setNoteContent] = useState<string>('');
  const [noteUuid, setNoteUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNoteDetails = useCallback(async () => {
    if (!date) {
      setError('Дата не указана в URL.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const notes = await getNoteByDate(date); // API теперь возвращает Note[]
      if (notes && notes.length > 0) {
        // Используем первую заметку из массива
        const currentNote = notes[0];
        setNoteContent(currentNote.content);
        setNoteUuid(currentNote.uuid);
      } else {
        setNoteContent(''); // Нет существующей заметки для этой даты
        setNoteUuid(null);
      }
    } catch (err: any) {
      console.error('Error fetching note details:', err);
      setError(err.message || 'Не удалось загрузить детали заметки.');
      setNoteContent('');
      setNoteUuid(null);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchNoteDetails();
  }, [fetchNoteDetails]);

  const handleSaveNote = async () => {
    if (!date) {
      setError('Невозможно сохранить заметку без даты.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      let savedNote: Note | undefined;
      if (noteUuid) {
        // Обновляем существующую заметку
        savedNote = await updateNote(noteUuid, noteContent);
      } else {
        // Создаем новую заметку
        savedNote = await createNote(date, noteContent);
        if (savedNote) {
          setNoteUuid(savedNote.uuid); // Сохраняем uuid новой заметки
        }
      }
      // Опционально: показать сообщение об успехе или перенаправить
      console.log('Заметка сохранена:', savedNote);
      // navigate(-1); // Вернуться на предыдущую страницу после сохранения
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Не удалось сохранить заметку.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Загрузка данных заметки...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-screen bg-background text-text-primary">
      <header className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-accent hover:text-accent-hover transition-colors"
          aria-label="Назад"
        >
          &larr; Назад
        </button>
        <h2 className="text-xl font-bold mt-2">Заметка на {date}</h2>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <textarea
        className="flex-grow w-full p-3 border border-gray-600 rounded-md bg-input-bg text-text-input text-sm focus:ring-accent focus:border-accent resize-none"
        placeholder="Введите ваши заметки здесь..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        rows={15}
        disabled={isSaving}
      />
      <button
        onClick={handleSaveNote}
        disabled={isSaving || isLoading}
        className="mt-4 w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {isSaving ? 'Сохранение...' : 'Сохранить заметку'}
      </button>
    </div>
  );
};

export default NoteDetailsPage;