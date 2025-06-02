import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createNote, getNoteByDate, updateNote, type Note } from '../services/api';
import './NoteField.css'; // Импортируем стили

interface NoteFieldProps {
  weekId: string; // weekId теперь это dateString 'YYYY-MM-DD'
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

  if (isLoading && !noteContent && !error) { // Показываем загрузку только при первом запросе или если нет данных/ошибок
    return (
      <div className="note-field-container note-field-loading">
        <h3 className="note-field-header">Заметки</h3>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="note-field-container">
      <h3 className='note-field-header'>Заметки</h3>
      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
      <textarea
        className="note-textarea"
        value={noteContent}
        onChange={(e) => {
          setNoteContent(e.target.value);
          setHasChanges(true);
        }}
        placeholder="Введите заметки здесь..."
        disabled={isLoading}
      />
      <button className="save-note-button" onClick={handleSaveNote} disabled={isLoading || !hasChanges}>
        {isLoading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
};

export default NoteField;