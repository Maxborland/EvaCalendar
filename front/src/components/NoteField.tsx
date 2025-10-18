import { useNavigate } from 'react-router-dom';
import { useNoteByDate } from '../hooks/useNotes';
import './NoteField.css';

interface NoteFieldProps {
  weekId: string;
}

const NoteField = ({ weekId }: NoteFieldProps) => {
  const navigate = useNavigate();
  const { data: notes, isLoading, error } = useNoteByDate(weekId);

  const noteContent = notes && notes.length > 0 ? notes[0].content : '';

  const handleNavigate = () => {
    navigate(`/notes/${weekId}`);
  };

  const getPreviewText = (text: string, maxLength: number = 72): string => {
    if (!text) return 'Добавить заметку';
    if (text.length <= maxLength) return text;
    const trimmed = text.substring(0, maxLength);
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 0 && text.length > maxLength) {
      return `${trimmed.substring(0, lastSpace)}…`;
    }
    return `${trimmed}…`;
  };

  if (isLoading && !error) {
    return (
      <section className="note-preview note-preview--loading">
        <header className="note-preview__header">
          <span className="note-preview__title">Заметки</span>
        </header>
        <div className="note-preview__skeleton" aria-hidden="true">
          <span className="note-preview__skeleton-line" />
          <span className="note-preview__skeleton-line" />
        </div>
      </section>
    );
  }

  if (error && !isLoading) {
    return (
      <section className="note-preview note-preview--error" role="alert">
        <header className="note-preview__header">
          <span className="note-preview__title">Заметки</span>
        </header>
        <div className="note-preview__error">
          {(error as Error).message || 'Не удалось загрузить заметку'}
        </div>
        <button
          type="button"
          className="note-preview__cta-secondary"
          onClick={handleNavigate}
        >
          Открыть заметку
        </button>
      </section>
    );
  }

  return (
    <section className="note-preview">
      <header className="note-preview__header">
        <span className="note-preview__title">Заметки недели</span>
        <button
          type="button"
          className="note-preview__cta"
          onClick={handleNavigate}
        >
          <span className="material-icons bg-white">edit_note</span>
        </button>
      </header>
      <button
        type="button"
        className="note-preview__body"
        onClick={handleNavigate}
        aria-label={
          noteContent
            ? `Просмотреть заметку: ${getPreviewText(noteContent)}`
            : 'Добавить заметку'
        }
      >
        <p className="note-preview__text">
          {getPreviewText(noteContent)}
        </p>
      </button>
    </section>
  );
};

export default NoteField;