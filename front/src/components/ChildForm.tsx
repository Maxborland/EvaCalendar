import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';
import type { Child } from '../services/api';
import './ChildCardManager.css';

export interface ChildFormProps {
  initialChild?: Partial<Child>;
  onSave: (child: Child | Partial<Child>) => void;
  onCancel: () => void;
  isEmbeddedInModal?: boolean;
  formId?: string;
}

const ChildForm: React.FC<ChildFormProps> = ({ initialChild, onSave, onCancel, isEmbeddedInModal = false, formId }) => {
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
    // Обновляем formData при изменении initialChild (например, открытие формы для другого ребенка или предзаполнение имени)
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
    if (formData.hourlyRate == null || isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) < 0) {
      toast.error('Ставка в час должна быть указана корректно (неотрицательное число).');
      return;
    }
    onSave(formData);
  };

  return (
      <form onSubmit={handleSubmit} className="child-form" id={formId}>
        {!isEmbeddedInModal && (
          <h3>{initialChild?.uuid ? 'Редактировать карточку ребенка' : 'Добавить карточку ребенка'}</h3>
        )}
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
        {!isEmbeddedInModal && (
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{initialChild?.uuid ? 'Сохранить изменения' : 'Добавить карточку'}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Отмена</button>
          </div>
        )}
      </form>
  );
};

export default ChildForm;