import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';
import { useCreateNote, useUpdateNote } from '../hooks/useNotes';
import type { Note } from '../services/api';

interface NoteDetailsLoaderData {
  note: Note | null;
  date: string;
}

const AUTOSAVE_DELAY = 1500;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const NoteDetailsPage = () => {
  const { note: initialNote, date } = useLoaderData() as NoteDetailsLoaderData;

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();

  const [noteContent, setNoteContent] = useState<string>(initialNote?.content || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedContentRef = useRef<string>(initialNote?.content || '');
  const noteUuidRef = useRef<string | null>(initialNote?.uuid || null);
  const noteContentRef = useRef<string>(initialNote?.content || '');

  useEffect(() => {
    const content = initialNote?.content || '';
    setNoteContent(content);
    noteContentRef.current = content;
    lastSavedContentRef.current = content;
    noteUuidRef.current = initialNote?.uuid || null;
    setSaveStatus('idle');
  }, [initialNote]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [noteContent]);

  const saveNote = useCallback(async (content: string) => {
    if (content === lastSavedContentRef.current) return;
    if (!date) return;

    setSaveStatus('saving');
    try {
      if (noteUuidRef.current) {
        await updateNoteMutation.mutateAsync({
          uuid: noteUuidRef.current,
          content,
          date,
        });
      } else if (content.trim()) {
        const saved = await createNoteMutation.mutateAsync({ date, content });
        if (saved) {
          noteUuidRef.current = saved.uuid;
        }
      }
      lastSavedContentRef.current = content;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [date, updateNoteMutation, createNoteMutation]);

  const handleContentChange = (value: string) => {
    setNoteContent(value);
    noteContentRef.current = value;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNote(value), AUTOSAVE_DELAY);
  };

  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      if (noteContentRef.current !== lastSavedContentRef.current) {
        const content = noteContentRef.current;
        const uuid = noteUuidRef.current;
        if (uuid) {
          updateNoteMutation.mutate({ uuid, content, date });
        } else if (content.trim()) {
          createNoteMutation.mutate({ date, content });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator
        title={`Заметка на ${date}`}
        showBackButton={true}
        showButtons={false}
      />

      <div className="flex-1 flex flex-col p-4 gap-3 min-[480px]:p-6 max-[360px]:p-3">
        <textarea
          ref={textareaRef}
          className={clsx(
            'w-full min-h-[300px] flex-1 rounded-2xl border border-border-subtle bg-surface-raised',
            'text-text-primary p-4 text-base leading-normal resize-y',
            'transition-all duration-[180ms]',
            'placeholder:text-[var(--color-placeholder)]',
            'focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(72,187,120,0.16)] focus-visible:outline-none focus-visible:bg-surface-elevated',
          )}
          placeholder="Введите ваши заметки здесь..."
          value={noteContent}
          onChange={(event) => handleContentChange(event.target.value)}
          rows={6}
        />

        <div className="h-6 flex items-center justify-center text-sm">
          {saveStatus === 'saving' && (
            <span className="text-text-secondary">Сохранение...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-text-tertiary">
              <span className="material-icons text-[16px]">check</span>
              Сохранено
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-expense-primary">
              <span className="material-icons text-[16px]">error_outline</span>
              Ошибка сохранения
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetailsPage;
