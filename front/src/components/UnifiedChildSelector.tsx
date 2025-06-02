import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Child } from '../services/api'; // Предполагаем, что тип Child экспортируется из api.ts
import './UnifiedChildSelector.css';

interface UnifiedChildSelectorProps {
  value: string | null;
  onChange: (childId: string | null, newChildName?: string) => void;
  childrenList: Child[];
  onAddNewChildRequest: (childName: string) => void;
  onGoToCreateChildPageRequest: () => void;
  label?: string;
  placeholder?: string;
  selectedChildDetails?: Child | null; // Добавляем новый проп для данных ребенка
}

// Helper function to sort children by name
const sortChildrenByName = (children: Child[]): Child[] => {
  // Создаем копию массива перед сортировкой, чтобы не мутировать оригинальный prop childrenList
  return [...children].sort((a, b) =>
    a.childName.toLowerCase().localeCompare(b.childName.toLowerCase())
  );
};

const UnifiedChildSelector: React.FC<UnifiedChildSelectorProps> = ({
  value,
  onChange,
  childrenList,
  onAddNewChildRequest,
  onGoToCreateChildPageRequest,
  label,
  placeholder = "Введите имя ребенка...",
  selectedChildDetails, // Добавляем в деструктуризацию
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedChildNameState, setSelectedChildNameState] = useState<string | null>(null); // Локальное состояние для имени

  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Эффект для установки начального inputValue и selectedChildNameState, если value (childId) передан
  useEffect(() => {
    if (value && childrenList.length > 0) {
      const selectedChild = childrenList.find(child => child.uuid === value);
      if (selectedChild) {
        setInputValue(selectedChild.childName);
        setSelectedChildNameState(selectedChild.childName); // Устанавливаем имя для отображения
      } else {
        // Если childId есть, но ребенка нет в списке (маловероятно, но возможно)
        setInputValue('');
        setSelectedChildNameState(null);
        // Возможно, стоит вызвать onChange(null), если такой ребенок не найден
      }
    } else if (!value) {
        setInputValue(''); // Очищаем, если value сброшен извне
        setSelectedChildNameState(null);
    }
  }, [value, childrenList]);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = event.target.value;
    setInputValue(newInputValue);
    setSelectedChildNameState(null); // Сбрасываем имя, так как пользователь редактирует

    if (newInputValue.trim() === '') {
      if (childrenList.length > 0) {
        setFilteredChildren(sortChildrenByName(childrenList)); // Показываем всех отсортированных
      } else {
        setFilteredChildren([]);
      }
      setShowSuggestions(childrenList.length > 0);
      onChange(null); // Сбрасываем выбор
      return;
    }

    const lowercasedInput = newInputValue.trim().toLowerCase(); // Используем trim() здесь тоже
    const filtered = childrenList.filter(child =>
      child.childName.toLowerCase().includes(lowercasedInput)
    );
    setFilteredChildren(sortChildrenByName(filtered)); // Фильтруем и сортируем
    setShowSuggestions(true); // Всегда показываем, если есть ввод, даже если filtered пуст (для "не найдено")
  };

  const handleSuggestionClick = (child: Child) => {
    setInputValue(child.childName);
    setSelectedChildNameState(child.childName);
    onChange(child.uuid);
    setShowSuggestions(false);
    setFilteredChildren([]);
  };

  const handleCreateNewChildClick = () => {
    if (inputValue.trim()) {
      onAddNewChildRequest(inputValue.trim());
      // Не очищаем inputValue здесь, чтобы пользователь видел, какое имя он предложил
      // Очистка или дальнейшие действия должны быть обработаны в родительском компоненте
      // после фактического создания ребенка.
      setShowSuggestions(false);
      setFilteredChildren([]);
    }
  };

  // Закрытие выпадающего списка при клике вне его
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
      // Дополнительная проверка, чтобы не закрывать, если клик был по инпуту
      if ((event.target as HTMLElement).tagName.toLowerCase() !== 'input') {
          setShowSuggestions(false);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Обработка потери фокуса
  const handleBlur = () => {
    // Небольшая задержка перед скрытием, чтобы успел сработать клик по предложению
    setTimeout(() => {
        // Если инпут не пуст, но ребенок не выбран (selectedChildNameState is null)
        // и нет активных предложений (filteredChildren пуст или showSuggestions false)
        // Это может означать, что пользователь ввел что-то и ушел, не выбрав.
        // В этом случае, если inputValue не соответствует selectedChildNameState (если он был),
        // то это новое имя, которое не было выбрано для создания.
        // Если selectedChildNameState есть, и inputValue не равен ему, значит пользователь изменил имя уже выбранного ребенка.
        // Это сложный кейс, пока оставим так: если ушли с поля и ничего не выбрали из списка,
        // и inputValue не соответствует ранее выбранному, то это может быть попытка ввести новое имя,
        // но без явного клика на "создать".
        // Пока что, если есть selectedChildNameState (т.е. был выбран ребенок), и inputValue изменился,
        // но не был выбран новый ребенок или опция "создать", вернем inputValue к selectedChildNameState.
        // Это предотвратит ситуацию, когда в поле одно имя, а выбран другой childId.
        if (selectedChildNameState && inputValue !== selectedChildNameState && !showSuggestions) {
            // setInputValue(selectedChildNameState); // Пока закомментируем, чтобы дать пользователю возможность исправить
        }
        // Если просто ушли с поля, не скрываем предложения, если они должны быть видны
        // setShowSuggestions(false); // Это скрывается по клику снаружи
    }, 150);
  };


  if (childrenList.length === 0 && !inputValue) { // Показываем кнопку, только если список реально пуст и нет попытки ввода
    return (
      <div className="unified-child-selector">
        {label && <label className="selector-label">{label}</label>}
        <p>Список детей пуст.</p>
        <button type="button" onClick={onGoToCreateChildPageRequest} className="add-child-button">
          Добавить ребенка
        </button>
      </div>
    );
  }

  return (
    <div className="unified-child-selector form-group"> {/* Добавляем form-group для консистентности */}
      {label && <label htmlFor="child-input" className="selector-label label">{label}</label>} {/* Добавляем label для консистентности */}
      <div style={{ position: 'relative' }}> {/* Обертка для инпута и списка подсказок */}
        <input
          type="text"
          id="child-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (childrenList.length > 0) {
              const currentInput = inputValue.trim().toLowerCase();
              let listToShow = childrenList;
              if (currentInput !== '') {
                listToShow = childrenList.filter(child =>
                  child.childName.toLowerCase().includes(currentInput)
                );
              }
              setFilteredChildren(sortChildrenByName(listToShow));
              setShowSuggestions(true);
            } else {
              // Если childrenList пуст, но мы все равно фокусируемся
              setFilteredChildren([]); // Убедимся, что filteredChildren пуст
              setShowSuggestions(true); // Показываем, чтобы отобразить "Дети не найдены" или кнопку "Создать"
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="selector-input input" /* Добавляем input для консистентности */
          autoComplete="off"
        />
        {showSuggestions && (
          <ul className="suggestions-list" ref={suggestionsRef}>
            {filteredChildren.length > 0 ? (
              filteredChildren.map(child => {
                const matchIndex = child.childName.toLowerCase().indexOf(inputValue.trim().toLowerCase());
                const prefix = child.childName.substring(0, matchIndex);
                const match = child.childName.substring(matchIndex, matchIndex + inputValue.trim().length);
                const suffix = child.childName.substring(matchIndex + inputValue.trim().length);
                return (
                  <li key={child.uuid} onClick={() => handleSuggestionClick(child)} className="suggestion-item">
                    {prefix}
                    <span className="suggestion-match">{match}</span>
                    {suffix}
                  </li>
                );
              })
            ) : (
              inputValue.trim() !== '' && ( // Показываем "не найдено" только если есть ввод
                <li className="suggestion-item no-results">Дети не найдены</li>
              )
            )}
            {inputValue.trim() !== '' &&
             !childrenList.some(c => c.childName.toLowerCase() === inputValue.trim().toLowerCase()) && // Проверяем по всему childrenList
             (filteredChildren.length === 0 || !filteredChildren.some(c => c.childName.toLowerCase() === inputValue.trim().toLowerCase())) && // И по отфильтрованному
            (
              <li onClick={handleCreateNewChildClick} className="suggestion-item create-new-item">
                Создать нового ребенка: "{inputValue.trim()}"
              </li>
            )}
          </ul>
        )}
      </div>
      {/* Код для мини-карточки */}
      {selectedChildDetails && (
        <>
          <div className="child-info-card">
            <h4>{selectedChildDetails.childName}</h4>
            <div className="info-item">
            <span className="info-label">Родитель:</span>
            <span className="info-value">{selectedChildDetails.parentName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Телефон:</span>
            <span className="info-value">{selectedChildDetails.parentPhone}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Адрес:</span>
            <span className="info-value">{selectedChildDetails.address}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ставка:</span>
            <span className="info-value">{selectedChildDetails.hourlyRate} ₽/час</span>
          </div>
          {selectedChildDetails.comment && (
            <div className="info-item">
              <span className="info-label">Комментарий:</span>
              <span className="info-value">{selectedChildDetails.comment}</span>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};

export default UnifiedChildSelector;