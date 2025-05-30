import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { addChild, type Child, deleteChild, getAllChildren, updateChild } from '../services/api';
import './ChildCardManager.css';

interface ChildFormProps {
  initialChild?: Child;
  onSave: (child: Child) => void;
  onCancel: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ initialChild, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Child>(
    initialChild || {
      id: uuidv4(),
      childName: '',
      parentName: '',
      parentPhone: '',
      address: '',
      hourlyRate: null,
      comment: '',
    } as Child // Ensure it's treated as Child type
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
      setShowSuggestions(false); // Скрываем предложения, если запрос слишком короткий
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
    if (initialChild) {
      setFormData(initialChild);
    }
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

  // Hook to handle clicks outside the suggestions list
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
    if (!formData.childName || !formData.parentName) {
      toast.error('Имя ребенка и имя родителя обязательны.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="child-form">
      <h3>{initialChild ? 'Редактировать карточку ребенка' : 'Добавить карточку ребенка'}</h3>
      <label>
        Имя ребенка:
        <input type="text" name="childName" value={formData.childName} onChange={handleChange} required />
      </label>
      <label>
        Имя родителя:
        <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required />
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
        <input type="number" name="hourlyRate" value={formData.hourlyRate || ''} onChange={handleChange} step="0.01" />
      </label>
      <label>
        Комментарий:
        <textarea name="comment" value={formData.comment || ''} onChange={handleChange} rows={3}></textarea>
      </label>
      <div className="form-actions">
        <button type="submit">{initialChild ? 'Сохранить изменения' : 'Добавить карточку'}</button>
        <button type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
};

const ChildCardManager: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [editingChild, setEditingChild] = useState<Child | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      const data = await getAllChildren();
      setChildren(data);
    } catch (error) {
      toast.error('Ошибка при загрузке карточек детей.');
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleAddOrUpdateChild = async (childData: Child) => {
    try {
      if (childData.id) { // If ID exists, it's an update operation
        await updateChild(childData.id, childData);
        toast.success('Карточка ребенка успешно обновлена!');
      } else { // Otherwise, it's a new child (ID will be generated by uuid)
        await addChild(childData); // ID is generated by UUID on frontend
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowForm(false);
      setEditingChild(undefined);
      fetchChildren(); // Обновляем список
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
    }
  };

  const handleDeleteChild = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту карточку ребенка?')) {
      try {
        await deleteChild(id);
        toast.success('Карточка ребенка успешно удалена!');
        fetchChildren(); // Обновляем список
      } catch (error) {
        toast.error('Ошибка при удалении карточки ребенка.');
      }
    }
  };

  return (
    <div className="child-card-manager">
      <h2>Карточки детей</h2>

      {!showForm && (
        <button className="add-button" onClick={() => { setShowForm(true); setEditingChild(undefined); }}>
          Добавить карточку ребенка
        </button>
      )}

      {showForm && (
        <ChildForm
          initialChild={editingChild}
          onSave={handleAddOrUpdateChild}
          onCancel={() => { setShowForm(false); setEditingChild(undefined); }}
        />
      )}

      <div className="child-list">
        {children.length === 0 && <p>Пока нет добавленных карточек детей.</p>}
        {children.map(child => (
          <div key={child.id as string} className="child-card">
            <h3>{child.childName}</h3>
            <p><strong>Родитель:</strong> {child.parentName}</p>
            {child.parentPhone && <p><strong>Телефон:</strong> {child.parentPhone}</p>}
            {child.address && <p><strong>Адрес:</strong> {child.address}</p>}
            {child.hourlyRate && <p><strong>Ставка в час:</strong> {child.hourlyRate}</p>}
            {child.comment && <p><strong>Комментарий:</strong> {child.comment}</p>}
            <div className="card-actions">
              <button onClick={() => { setEditingChild(child); setShowForm(true); }}>Редактировать</button>
              <button onClick={() => handleDeleteChild(child.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildCardManager;