import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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
      id: 0,
      childName: '',
      parentName: '',
      parentPhone: '',
      address: '',
      hourlyRate: null,
      comment: '',
    } as Child // Ensure it's treated as Child type
  );

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
  };

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
      <h3>{initialChild ? 'Редактировать карточку ребенка' : 'Добавить новую карточку ребенка'}</h3>
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
        <input type="text" name="parentPhone" value={formData.parentPhone || ''} onChange={handleChange} />
      </label>
      <label>
        Адрес:
        <input type="text" name="address" value={formData.address || ''} onChange={handleChange} />
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
      if (childData.id && childData.id !== 0) { // Check if ID exists and is not 0 for existing child
        await updateChild(childData.id, childData);
        toast.success('Карточка ребенка успешно обновлена!');
      } else {
        // For new child, remove the 'id' property before sending
        const { id, ...newChildData } = childData;
        await addChild(newChildData);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowForm(false);
      setEditingChild(undefined);
      fetchChildren(); // Обновляем список
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
    }
  };

  const handleDeleteChild = async (id: number) => {
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
          Добавить новую карточку ребенка
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
          <div key={child.id} className="child-card">
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