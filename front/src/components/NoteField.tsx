import React, { useEffect, useState } from 'react';

interface NoteFieldProps {
  weekId: number; // weekId должен быть числом, соответствующим id недели в БД
}

const NoteField: React.FC<NoteFieldProps> = ({ weekId }) => {
  const [noteContent, setNoteContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // weekId должен быть числом
        const apiUrl = `${import.meta.env.VITE_API_URL}/notes/${weekId}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setNoteContent(data && data.content ? data.content : '');
          setHasChanges(false);
        } else {
          setNoteContent('');
          setHasChanges(false);
          console.error('Failed to fetch note:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        setNoteContent('');
        setHasChanges(false);
      }
    };

    fetchNote();
  }, [weekId]);

  const handleSave = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/notes`;
      console.log('Posting note to:', apiUrl); // Добавляем логирование
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weekId, content: noteContent }), // weekId должен быть числом
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Заметка сохранена!');
      } else {
        alert('Ошибка при сохранении заметки.');
        console.error('Failed to save note:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Ошибка при сохранении заметки.');
    }
  };

  return (
    <div className="day-column"> {/* Применяем стиль day-column */}
      <h3>Заметки</h3> {/* Заголовок как у дня недели */}
      <div className="day-cells"> {/* Обертка для textarea и кнопки */}
        <textarea
          className="note-textarea"
          value={noteContent}
          onChange={(e) => {
            setNoteContent(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Введите заметки здесь..."
          rows={10}
          cols={30}
        />
        {hasChanges && (
          <button onClick={handleSave}>Сохранить</button>
        )}
      </div>
    </div>
  );
};

export default NoteField;