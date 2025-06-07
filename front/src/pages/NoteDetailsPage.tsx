import { useEffect, useState } from 'react'; // useCallback удален
import { useLoaderData, useNavigate } from 'react-router-dom'; // useParams удален, useLoaderData добавлен
// getNoteByDate удален из импортов
import { createNote, type Note, updateNote } from '../services/api';

interface NoteDetailsLoaderData {
  note: Note | null;
  date: string;
}

const NoteDetailsPage = () => {
  const { note: initialNote, date } = useLoaderData() as NoteDetailsLoaderData;
  const navigate = useNavigate();

  const [noteContent, setNoteContent] = useState<string>(initialNote?.content || '');
  const [noteUuid, setNoteUuid] = useState<string | null>(initialNote?.uuid || null);
  // isLoading удален
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNoteContent(initialNote?.content || '');
    setNoteUuid(initialNote?.uuid || null);
    if (!initialNote) {
        setNoteContent('');
        setNoteUuid(null);
    }
  }, [initialNote]);

  const handleSaveNote = async () => {
    if (!date) { // date теперь из useLoaderData
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
      navigate('.', { replace: true });
    } catch (err: any) {
      // Error saving note
      setError(err.message || 'Не удалось сохранить заметку.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-screen bg-background text-text-primary">
      <header className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-accent hover:text-accent-hover transition-colors bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md"
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
        disabled={isSaving} // isLoading удален из условия disabled
        className="mt-4 w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-md bg-green-500 disabled:opacity-50"
      >
        {isSaving ? 'Сохранение...' : 'Сохранить заметку'}
      </button>
    </div>
  );
};

export default NoteDetailsPage;