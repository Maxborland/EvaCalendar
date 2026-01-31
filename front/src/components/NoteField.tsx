import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useNoteByDate } from '../hooks/useNotes';

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
      return `${trimmed.substring(0, lastSpace)}...`;
    }
    return `${trimmed}...`;
  };

  if (isLoading && !error) {
    return (
      <section className="flex flex-col gap-2 p-2 min-[480px]:p-3 min-[480px]:gap-3 max-[360px]:p-1.5 max-[360px]:gap-1.5 max-[360px]:rounded-[10px] rounded-xl bg-surface-glass border border-border-subtle shadow-glass backdrop-blur-[14px] min-h-0 h-full overflow-hidden">
        <header className="flex items-center justify-between gap-2 shrink-0">
          <span className="text-sm min-[480px]:text-base max-[360px]:text-[0.8125rem] font-semibold text-text-primary leading-tight">Заметки</span>
        </header>
        <div className="grid gap-2" aria-hidden="true">
          <span className="h-2.5 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:200%_100%] animate-[note-skeleton_1.5s_infinite_ease]" />
          <span className="h-2.5 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:200%_100%] animate-[note-skeleton_1.5s_infinite_ease]" />
        </div>
      </section>
    );
  }

  if (error && !isLoading) {
    return (
      <section
        className="flex flex-col gap-2 p-2 min-[480px]:p-3 min-[480px]:gap-3 max-[360px]:p-1.5 max-[360px]:gap-1.5 max-[360px]:rounded-[10px] rounded-xl bg-surface-glass border border-border-subtle shadow-glass backdrop-blur-[14px] min-h-0 h-full overflow-hidden"
        role="alert"
      >
        <header className="flex items-center justify-between gap-2 shrink-0">
          <span className="text-sm min-[480px]:text-base max-[360px]:text-[0.8125rem] font-semibold text-text-primary leading-tight">Заметки</span>
        </header>
        <div className="text-[0.86rem] text-[#ffb3b8] bg-[rgba(224,86,86,0.18)] border border-[rgba(224,86,86,0.32)] rounded-xl p-3">
          {(error as Error).message || 'Не удалось загрузить заметку'}
        </div>
        <button
          type="button"
          className="inline-flex items-center self-start gap-1 py-1.5 px-3 min-[480px]:py-2 min-[480px]:px-3.5 max-[360px]:py-1 max-[360px]:px-2.5 max-[360px]:text-[0.7rem] rounded-full border border-border-subtle bg-[rgba(255,255,255,0.04)] text-text-secondary text-xs font-medium tracking-[0.02em] transition-all duration-[160ms] ease-linear hover:bg-[rgba(255,255,255,0.08)] hover:border-border-strong hover:-translate-y-px active:translate-y-0"
          onClick={handleNavigate}
        >
          Открыть заметку
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 p-2 min-[480px]:p-3 min-[480px]:gap-3 max-[360px]:p-1.5 max-[360px]:gap-1.5 max-[360px]:rounded-[10px] rounded-xl bg-surface-glass border border-border-subtle shadow-glass backdrop-blur-[14px] min-h-0 h-full overflow-hidden">
      <header className="flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm min-[480px]:text-base max-[360px]:text-[0.8125rem] font-semibold text-text-primary leading-tight">Заметки недели</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 py-1.5 px-3 min-[480px]:py-2 min-[480px]:px-3.5 max-[360px]:py-1 max-[360px]:px-2.5 max-[360px]:text-[0.7rem] rounded-full border border-border-subtle bg-[rgba(255,255,255,0.04)] text-text-secondary text-xs font-medium tracking-[0.02em] transition-all duration-[160ms] ease-linear hover:bg-[rgba(255,255,255,0.08)] hover:border-border-strong hover:-translate-y-px active:translate-y-0"
          onClick={handleNavigate}
        >
          <span className="material-icons text-[16px] max-[360px]:text-[14px] bg-white">edit_note</span>
        </button>
      </header>
      <button
        type="button"
        className={clsx(
          'flex-1 flex items-start w-full min-h-0 p-3 max-[360px]:p-2 rounded-[10px]',
          'bg-[rgba(18,22,33,0.6)] border border-dashed border-border-subtle',
          'text-left transition-all duration-[160ms] ease-linear cursor-pointer overflow-hidden',
          'hover:bg-[rgba(18,22,33,0.8)] hover:border-border-accent',
          'focus-visible:bg-[rgba(18,22,33,0.8)] focus-visible:border-border-accent focus-visible:outline-none'
        )}
        onClick={handleNavigate}
        aria-label={
          noteContent
            ? `Просмотреть заметку: ${getPreviewText(noteContent)}`
            : 'Добавить заметку'
        }
      >
        <p className="text-sm max-[360px]:text-[0.8125rem] leading-normal text-text-secondary line-clamp-2 min-[480px]:line-clamp-3 overflow-hidden text-ellipsis w-full">
          {getPreviewText(noteContent)}
        </p>
      </button>
    </section>
  );
};

export default NoteField;
