import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Child } from '../services/api';

interface UnifiedChildSelectorProps {
  value: string | null;
  onChange: (childId: string | null, newChildName?: string) => void;
  childrenList: Child[];
  onAddNewChildRequest: (childName: string) => void;
  onGoToCreateChildPageRequest: () => void;
  label?: string;
  placeholder?: string;
  selectedChildDetails?: Child | null;
  className?: string;
}

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
  selectedChildDetails,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedChildNameState, setSelectedChildNameState] = useState<string | null>(null);

  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value && childrenList.length > 0) {
      const selectedChild = childrenList.find(child => child.uuid === value);
      if (selectedChild) {
        setInputValue(selectedChild.childName);
        setSelectedChildNameState(selectedChild.childName);
      } else {
        setInputValue('');
        setSelectedChildNameState(null);
      }
    } else if (!value) {
        setInputValue('');
        setSelectedChildNameState(null);
    }
  }, [value, childrenList]);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = event.target.value;
    setInputValue(newInputValue);
    setSelectedChildNameState(null);

    if (newInputValue.trim() === '') {
      if (childrenList.length > 0) {
        setFilteredChildren(sortChildrenByName(childrenList));
      } else {
        setFilteredChildren([]);
      }
      setShowSuggestions(childrenList.length > 0);
      onChange(null);
      return;
    }

    const lowercasedInput = newInputValue.trim().toLowerCase();
    const filtered = childrenList.filter(child =>
      child.childName.toLowerCase().includes(lowercasedInput)
    );
    setFilteredChildren(sortChildrenByName(filtered));
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
      setShowSuggestions(false);
      setFilteredChildren([]);
    }
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
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

  const handleBlur = () => {
    setTimeout(() => {
        if (selectedChildNameState && inputValue !== selectedChildNameState && !showSuggestions) {
            // User changed input but didn't select or create, potential revert needed or clear state
        }
    }, 150);
  };


  if (childrenList.length === 0 && !inputValue) {
    return (
      <div className="unified-child-selector">
        {label && <label className="selector-label">{label}</label>}
        <p>Список детей пуст.</p>
        <button type="button" onClick={onGoToCreateChildPageRequest} className="btn btn-primary add-child-button">
          Добавить ребенка
        </button>
      </div>
    );
  }

  return (
    <div className="unified-child-selector form-group">
      {label && <label htmlFor="child-input" className="selector-label label">{label}</label>}
      <div style={{ position: 'relative' }}>
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
              setFilteredChildren([]);
              setShowSuggestions(true);
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`selector-input ${className}`}
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
              inputValue.trim() !== '' && (
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
      {selectedChildDetails && (
        <>
          <div className="card mt-4">
            <h4 className="card-heading">{selectedChildDetails.childName}</h4>
            <div className="card-text-detail">
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
        </div>
        </>
      )}
    </div>
  );
};

export default UnifiedChildSelector;