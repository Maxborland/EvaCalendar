import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';
import type { Child } from '../services/api'; // Используем существующий тип Child
import './ChildCardManager.css'; // Стили пока оставим от ChildCardManager, позже можно переименовать или создать ChildForm.css

export interface ChildFormProps { // Экспортируем интерфейс props
  initialChild?: Partial<Child>; // Разрешаем Partial<Child> и делаем uuid необязательным для новых
  onSave: (child: Child | Partial<Child>) => void;
  onCancel: () => void;
  // Возможно, понадобится пропс для указания, создается ли ребенок или редактируется,
  // чтобы менять заголовок, но initialChild?.uuid может служить этой цели.
}

const ChildForm: React.FC<ChildFormProps> = ({ initialChild, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Child>>(
    initialChild || {
      childName: '',
      parentName: '',
      parentPhone: '',
      address: '',
      hourlyRate: null,
      comment: '',
    }
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionListRef = useRef<HTMLUListElement>(null);

  const DADATA_API_KEY = import.meta.env.VITE_DADATA_API_KEY;
  const DADATA_SECRET_KEY = import.meta.env.VITE_DADATA_SECRET_KEY;
  const DADATA_SUGGESTION_URL = import.meta.env.VITE_DADATA_SUGGESTION_URL;

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await axios.post(DADATA_SUGGESTION_URL, { query }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${DADATA_API_KEY}`,
          "X-Secret": DADATA_SECRET_KEY,
        }
      });
      setSuggestions(response.data.suggestions.map((s: any) => s.value));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    // Обновляем formData, если initialChild изменился (например, при открытии формы для редактирования другого ребенка)
    // или при передаче предзаполненного имени для нового ребенка
    setFormData(
      initialChild || {
        childName: '',
        parentName: '',
        parentPhone: '',
        address: '',
        hourlyRate: null,
        comment: '',
      }
    );
  }, [initialChild]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? (value === '' ? null : parseFloat(value)) : value,
    }));
    if (name === 'address') {
      fetchSuggestions(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, address: suggestion }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionListRef.current && !suggestionListRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childName?.trim()) {
      toast.error('Имя ребенка не может быть пустым.');
      return;
    }
    if (!formData.parentName?.trim()) {
      toast.error('Имя родителя не может быть пустым.');
      return;
    }
    const MAX_CHILD_NAME_LENGTH = 50;
    if (formData.childName.trim().length > MAX_CHILD_NAME_LENGTH) {
      toast.error(`Имя ребенка не должно превышать ${MAX_CHILD_NAME_LENGTH} символов.`);
      return;
    }
    onSave(formData);
  };

  return (
    // Обертка для формы, если она будет использоваться как модальное окно в TaskForm
    // Для ChildCardManager она уже встроена. Здесь можно добавить класс для стилизации модального окна.
    // <div className="child-form-modal-wrapper"> {/* Пример обертки */}
      <form onSubmit={handleSubmit} className="child-form"> {/* Используем существующий класс child-form */}
        <h3>{initialChild?.uuid ? 'Редактировать карточку ребенка' : 'Добавить карточку ребенка'}</h3>
        <label>
          Имя ребенка:
          <input type="text" name="childName" value={formData.childName || ''} onChange={handleChange} required maxLength={50} />
        </label>
        <label>
          Имя родителя:
          <input type="text" name="parentName" value={formData.parentName || ''} onChange={handleChange} required />
        </label>
        <label>
          Телефон родителя:
          <IMaskInput
            mask={'+{7} (000) 000-00-00'}
            value={formData.parentPhone || ''}
            onAccept={(value: string) => {
              setFormData(prev => ({
                ...prev,
                parentPhone: value,
              }));
            }}
            type="tel"
            name="parentPhone"
          />
        </label>
        <label>
          Адрес:
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            autoComplete="off"
            onFocus={() => formData.address && formData.address.length >= 3 && fetchSuggestions(formData.address)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list" ref={suggestionListRef}>
              {suggestions.map((suggestion, index) => (
                <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </label>
        <label>
          Ставка в час:
          <input type="number" required name="hourlyRate" value={formData.hourlyRate ?? ''} onChange={handleChange} step="0.01" />
        </label>
        <label>
          Комментарий:
          <textarea name="comment" value={formData.comment || ''} onChange={handleChange} rows={3}></textarea>
        </label>
        <div className="form-actions">
          <button type="submit">{initialChild?.uuid ? 'Сохранить изменения' : 'Добавить карточку'}</button>
          <button type="button" onClick={onCancel}>Отмена</button>
        </div>
      </form>
    // </div>
  );
};

export default ChildForm;