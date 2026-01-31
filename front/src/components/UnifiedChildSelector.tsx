import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
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

const UnifiedChildSelector = ({
  value,
  onChange,
  childrenList,
  onAddNewChildRequest,
  onGoToCreateChildPageRequest,
  label,
  placeholder = "Введите имя ребенка...",
  selectedChildDetails,
  className = '',
}: UnifiedChildSelectorProps) => {
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


  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      <div className="relative flex flex-col w-full">
        {label && <label className="mb-1.5 font-bold text-text-tertiary">{label}</label>}
        <p className="mt-1 mb-3 text-text-tertiary">Список детей пуст.</p>
        <button
          type="button"
          onClick={onGoToCreateChildPageRequest}
          className="self-start min-h-[44px] py-2.5 px-4 bg-btn-primary-bg text-btn-primary-text border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 ease-in-out hover:opacity-85"
        >
          Добавить ребенка
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full">
      {label && <label htmlFor="child-input" className="mb-1.5 font-bold text-text-tertiary">{label}</label>}
      <div className="relative">
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
          className={clsx(
            'w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm',
            'transition-all duration-200 ease-in-out',
            'focus:border-border-focus focus:ring-2 focus:ring-border-accent focus:outline-none',
            className
          )}
          autoComplete="off"
        />
        {showSuggestions && (
          <ul
            className="absolute top-full left-0 right-0 bg-surface-elevated border border-border-strong border-t-0 rounded-b-xl list-none p-0 m-0 max-h-[200px] overflow-y-auto z-[1000] shadow-elevation-1 scrollbar-thin text-text-secondary"
            ref={suggestionsRef}
          >
            {filteredChildren.length > 0 ? (
              filteredChildren.map(child => {
                const matchIndex = child.childName.toLowerCase().indexOf(inputValue.trim().toLowerCase());
                const prefix = child.childName.substring(0, matchIndex);
                const match = child.childName.substring(matchIndex, matchIndex + inputValue.trim().length);
                const suffix = child.childName.substring(matchIndex + inputValue.trim().length);
                return (
                  <li
                    key={child.uuid}
                    onClick={() => handleSuggestionClick(child)}
                    className="p-2 min-h-[44px] flex items-center cursor-pointer text-text-secondary hover:bg-surface-raised"
                  >
                    {prefix}
                    <span className="font-bold text-income-primary">{match}</span>
                    {suffix}
                  </li>
                );
              })
            ) : (
              inputValue.trim() !== '' && (
                <li className="p-2 min-h-[44px] flex items-center text-text-tertiary cursor-default italic">Дети не найдены</li>
              )
            )}
            {inputValue.trim() !== '' &&
             !childrenList.some(c => c.childName.toLowerCase() === inputValue.trim().toLowerCase()) && // Проверяем по всему childrenList
             (filteredChildren.length === 0 || !filteredChildren.some(c => c.childName.toLowerCase() === inputValue.trim().toLowerCase())) && // И по отфильтрованному
            (
              <li
                onClick={handleCreateNewChildClick}
                className="p-2 min-h-[44px] flex items-center cursor-pointer italic text-income-primary hover:bg-income-bg"
              >
                Создать нового ребенка: "{inputValue.trim()}"
              </li>
            )}
          </ul>
        )}
      </div>
      {selectedChildDetails && (
        <>
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-3 mt-2 text-sm">
            <h4 className="mt-0 mb-2 text-base font-semibold text-text-primary leading-tight">{selectedChildDetails.childName}</h4>
            <div className="flex flex-col gap-1">
              <div className="flex leading-normal">
                <span className="font-medium mr-1 text-text-primary">Родитель:</span>
                <span className="text-text-secondary break-words">{selectedChildDetails.parentName}</span>
              </div>
              <div className="flex leading-normal">
                <span className="font-medium mr-1 text-text-primary">Телефон:</span>
                <span className="text-text-secondary break-words">{selectedChildDetails.parentPhone}</span>
              </div>
              <div className="flex leading-normal">
                <span className="font-medium mr-1 text-text-primary">Адрес:</span>
                <span className="text-text-secondary break-words">{selectedChildDetails.address}</span>
              </div>
              <div className="flex leading-normal">
                <span className="font-medium mr-1 text-text-primary">Ставка:</span>
                <span className="text-text-secondary break-words">{selectedChildDetails.hourlyRate} ₽/час</span>
              </div>
              {selectedChildDetails.comment && (
                <div className="flex leading-normal">
                  <span className="font-medium mr-1 text-text-primary">Комментарий:</span>
                  <span className="text-text-secondary break-words">{selectedChildDetails.comment}</span>
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
