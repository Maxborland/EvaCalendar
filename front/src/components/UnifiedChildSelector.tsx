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
    setSelectedChildNameState(null); // Сбрасываем имя выбранного ребенка, так как пользователь редактирует

    if (newInputValue.trim() === '') {
      setFilteredChildren([]);
      setShowSuggestions(false);
      onChange(null); // Если поле очищено, сбрасываем выбор
      return;
    }

    const lowercasedInput = newInputValue.toLowerCase();
    const filtered = childrenList.filter(child =>
      child.childName.toLowerCase().includes(lowercasedInput)
    );
    setFilteredChildren(filtered);
    setShowSuggestions(true);
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
          onFocus={() => { // Показываем предложения при фокусе, если есть что фильтровать
              if (inputValue.trim() !== '' && childrenList.length > 0) {
                   const lowercasedInput = inputValue.toLowerCase();
                   const filtered = childrenList.filter(child =>
                      child.childName.toLowerCase().includes(lowercasedInput)
                   );
                   setFilteredChildren(filtered);
                   setShowSuggestions(true);
              } else if (childrenList.length > 0 && inputValue.trim() === '') {
                  // Если поле пустое, но есть дети, можно показать всех при фокусе (опционально)
                  // setFilteredChildren(childrenList);
                  // setShowSuggestions(true);
              }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="selector-input input" /* Добавляем input для консистентности */
          autoComplete="off"
        />
        {showSuggestions && (filteredChildren.length > 0 || inputValue.trim() !== '') && (
          <ul className="suggestions-list" ref={suggestionsRef}>
            {filteredChildren.map(child => (
              <li key={child.uuid} onClick={() => handleSuggestionClick(child)} className="suggestion-item">
                {child.childName}
              </li>
            ))}
            {inputValue.trim() !== '' && !filteredChildren.some(c => c.childName.toLowerCase() === inputValue.trim().toLowerCase()) && (
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