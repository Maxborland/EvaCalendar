import axios from 'axios';
import clsx from 'clsx';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';
import type { Child } from '../services/api';

const hasContactPicker = typeof navigator !== 'undefined'
  && 'contacts' in navigator
  && 'ContactsManager' in window;

export interface ChildFormProps {
  initialChild?: Partial<Child>;
  onSave: (child: Child | Partial<Child>) => void;
  onCancel: () => void;
  isEmbeddedInModal?: boolean;
  formId?: string;
}

const formInputClass =
  'w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm mt-1 transition-[border-color,box-shadow] duration-[160ms] focus:border-border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(72,187,120,0.16)]';

const ChildForm = ({ initialChild, onSave, onCancel, isEmbeddedInModal = false, formId }: ChildFormProps) => {
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
      // Error fetching suggestions
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
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


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handlePickContact = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: false },
      );
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        setFormData(prev => ({
          ...prev,
          parentName: contact.name?.[0] || prev.parentName,
          parentPhone: contact.tel?.[0] || prev.parentPhone,
        }));
      }
    } catch {
      // Пользователь отменил выбор контакта
    }
  };

  const handleSubmit = (e: FormEvent) => {
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
      <form onSubmit={handleSubmit} className="bg-transparent p-0 rounded-none mb-0" id={formId}>
        {!isEmbeddedInModal && (
          <h3 className='mb-4 text-center text-md font-bold text-slate-100'>{initialChild?.uuid ? 'Редактировать карточку ребенка' : 'Добавить карточку ребенка'}</h3>
        )}
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          Имя ребенка:
          <input type="text" name="childName" value={formData.childName || ''} onChange={handleChange} required maxLength={50} className={formInputClass} />
        </label>
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          Имя родителя:
          <input type="text" name="parentName" value={formData.parentName || ''} onChange={handleChange} required className={formInputClass} />
        </label>
        {hasContactPicker && (
          <button
            type="button"
            onClick={handlePickContact}
            className="flex items-center gap-1.5 mb-2 py-1.5 px-3 rounded-lg border border-border-subtle bg-surface-elevated text-text-secondary text-xs font-medium transition-all duration-[160ms] cursor-pointer hover:bg-surface-raised hover:text-text-primary active:scale-[0.97]"
          >
            <span className="material-icons text-[16px]">contacts</span>
            Из контактов
          </button>
        )}
        <label className="block mb-2 text-sm font-medium text-text-secondary">
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
            className={formInputClass}
          />
        </label>
        <label className="relative block mb-2 text-sm font-medium text-text-secondary">
          Адрес:
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            autoComplete="off"
            onFocus={() => formData.address && formData.address.length >= 3 && fetchSuggestions(formData.address)}
            className={formInputClass}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={suggestionListRef}
              className={clsx(
                'list-none p-0 mt-1 absolute top-full left-0 right-0 z-[1000]',
                'border border-border-accent rounded-xl max-h-[200px] overflow-y-auto',
                'bg-[rgba(17,21,32,0.98)] shadow-elevation-2 backdrop-blur-[12px]',
              )}
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="py-2.5 px-3.5 cursor-pointer text-text-secondary transition-colors duration-[160ms] hover:bg-[rgba(72,187,120,0.12)] hover:text-text-primary"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          Ставка в час:
          <input type="number" required name="hourlyRate" value={formData.hourlyRate ?? ''} onChange={handleChange} step="0.01" inputMode="decimal" min="0" className={formInputClass} />
        </label>
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          Комментарий:
          <textarea name="comment" value={formData.comment || ''} onChange={handleChange} rows={3} className={clsx(formInputClass, 'resize-y min-h-[80px]')}></textarea>
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
