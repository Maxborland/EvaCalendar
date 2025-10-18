import { useEffect, useRef, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';
import { useCreateNote, useUpdateNote } from '../hooks/useNotes';
import type { Note } from '../services/api';
import './NoteDetailsPage.css';

interface NoteDetailsLoaderData {
  note: Note | null;
  date: string;
}

const NoteDetailsPage = () => {
  const { note: initialNote, date } = useLoaderData() as NoteDetailsLoaderData;
  const navigate = useNavigate();

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();

  const [noteContent, setNoteContent] = useState<string>(initialNote?.content || '');
  const [noteUuid, setNoteUuid] = useState<string | null>(initialNote?.uuid || null);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isSaving = createNoteMutation.isPending || updateNoteMutation.isPending;

  useEffect(() => {
    setNoteContent(initialNote?.content || '');
    setNoteUuid(initialNote?.uuid || null);
    if (!initialNote) {
      setNoteContent('');
      setNoteUuid(null);
    }
  }, [initialNote]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [noteContent]);

  const handleSaveNote = async () => {
    if (!date) {
      setError('Невозможно сохранить заметку без даты.');
      return;
    }
    setError(null);
    try {
      if (noteUuid) {
        await updateNoteMutation.mutateAsync({ uuid: noteUuid, content: noteContent, date });
      } else {
        const savedNote = await createNoteMutation.mutateAsync({ date, content: noteContent });
        if (savedNote) {
          setNoteUuid(savedNote.uuid);
        }
      }
      navigate(-1);
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить заметку.');
    }
  };

  return (
    <div className="note-details">
      <TopNavigator
        title={`Заметка на ${date}`}
        showBackButton={true}
        showButtons={false}
      />

      {error && (
        <div className="note-details__error" role="alert">
          <span className="material-icons note-details__error-icon">error_outline</span>
          <div>
            <strong>Ошибка:</strong> {error}
          </div>
        </div>
      )}

      <div className="note-details__body">
        <textarea
          ref={textareaRef}
          className="note-details__textarea"
          placeholder="Введите ваши заметки здесь..."
          value={noteContent}
          onChange={(event) => setNoteContent(event.target.value)}
          disabled={isSaving}
          rows={6}
        />
      </div>

      <footer className="note-details__footer">
        <button
          type="button"
          className="note-details__save"
          onClick={handleSaveNote}
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение…' : 'Сохранить заметку'}
        </button>
      </footer>
    </div>
  );
};

export default NoteDetailsPage;