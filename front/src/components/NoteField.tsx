import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import { getNoteByDate } from '../services/api';
// import './NoteField.css'; // Стиль будет через Tailwind

interface NoteFieldProps {
  weekId: string;
  // onNoteSaved больше не нужен, так как сохранение убрано из этого компонента
}

const NoteField: React.FC<NoteFieldProps> = ({ weekId }) => {
  const navigate = useNavigate(); // Инициализируем useNavigate
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Состояния noteUuid, hasChanges и функция handleSaveNote удалены,
  // так как редактирование и сохранение переносятся на другую страницу.

  useEffect(() => {
    const fetchNote = async () => {
      if (!weekId) return;

      setIsLoading(true);
      setError(null);
      try {
        const notes = await getNoteByDate(weekId); // Теперь notes это Note[]
        if (notes && notes.length > 0) {
          // Используем первую заметку из массива для превью
          setNoteContent(notes[0].content);
        } else {
          setNoteContent(''); // Если массив пуст, значит заметки нет
        }
      } catch (err: any) {
        console.error('Error fetching note:', err);
        setError(err.message || 'Не удалось загрузить заметку.');
        setNoteContent('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [weekId]);

  const handleNavigateToNoteDetails = () => {
    navigate(`/notes/${weekId}`); // Используем navigate для перехода и передаем weekId
    console.log(`Переход к /notes/${weekId}`);
  };

  const getPreviewText = (text: string, maxLength: number = 60): string => {
    if (!text) return "Добавить заметку...";
    if (text.length <= maxLength) return text;
    // Попробуем обрезать по последнему пробелу, чтобы не резать слова
    const trimmedText = text.substring(0, maxLength);
    const lastSpaceIndex = trimmedText.lastIndexOf(' ');
    if (lastSpaceIndex > 0 && text.length > maxLength) { // Только если есть пробел и текст действительно длиннее
        return trimmedText.substring(0, lastSpaceIndex) + "...";
    }
    return trimmedText + "...";
  };


  if (isLoading && !error) { // Показываем состояние загрузки, если нет ошибки
    return (
      <section className="bg-card rounded-lg p-4 col-span-1">
        <h2 className="text-md font-semibold mb-2">Заметки</h2>
        <div className="w-full bg-gray-700 p-3 rounded-md text-xs text-gray-300 min-h-[60px] flex items-center justify-center">
          <p className="text-sm text-gray-500">Загрузка заметок...</p>
        </div>
      </section>
    );
  }


  return (
    <section className="bg-card rounded-lg p-4 col-span-1">
      <h3 className="text-md font-semibold mb-2">Заметки</h3>
      {error && !isLoading && ( // Показываем ошибку только если загрузка завершена и есть ошибка
        <div className="w-full bg-red-800 p-3 rounded-md text-xs text-white min-h-[60px] flex items-center justify-center">
          <p>{error}</p>
        </div>
      )}
      {!error && !isLoading && ( // Показываем кликабельный блок, если нет ошибки и загрузка завершена
        <div
          className="w-full bg-gray-700 p-3 rounded-md text-xs text-gray-300 cursor-pointer hover:bg-gray-600 min-h-[60px] flex items-center"
          onClick={handleNavigateToNoteDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigateToNoteDetails(); }}
          aria-label={noteContent ? `Просмотреть или изменить заметку: ${getPreviewText(noteContent)}` : "Добавить заметку"}
        >
          <p className="truncate whitespace-pre-wrap"> {/* whitespace-pre-wrap для сохранения переносов строк в превью */}
            {getPreviewText(noteContent)}
          </p>
        </div>
      )}
    </section>
  );
};

export default NoteField;