import React, { useCallback, useEffect, useState } from 'react'; // axios, IMaskInput, useRef больше не нужны здесь напрямую
import { toast } from 'react-toastify';
// import { v4 as uuidv4 } from 'uuid'; // Больше не генерируем uuid на фронте для новых детей
import { addChild, type Child, deleteChild, getAllChildren, updateChild } from '../services/api';
import './ChildCardManager.css';
import ChildForm from './ChildForm'; // Импортируем ChildForm и его props

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

  const handleAddOrUpdateChild = async (childData: Child | Partial<Child>) => {
    try {
      if (childData.uuid) { // Если UUID существует, это обновление
        await updateChild(childData.uuid, childData as Child); // childData здесь точно Child
        toast.success('Карточка ребенка успешно обновлена!');
      } else { // Иначе, это новый ребенок
        // Убедимся, что не передаем uuid, если он случайно есть и undefined
        const { uuid, ...dataToSend } = childData;
        await addChild(dataToSend as Omit<Child, 'uuid'>);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowForm(false);
      setEditingChild(undefined);
      fetchChildren(); // Обновляем список
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
    }
  };

  const handleDeleteChild = async (uuid: string) => { // параметр теперь uuid
    if (window.confirm('Вы уверены, что хотите удалить эту карточку ребенка?')) {
      try {
        await deleteChild(uuid); // используем uuid
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
          <div key={child.uuid} className="child-card"> {/* key теперь child.uuid */}
            <h3>{child.childName}</h3>
            <p><strong>Родитель:</strong> {child.parentName}</p>
            {child.parentPhone && <p><strong>Телефон:</strong> {child.parentPhone}</p>}
            {child.address && <p><strong>Адрес:</strong> {child.address}</p>}
            {child.hourlyRate && <p><strong>Ставка в час:</strong> {child.hourlyRate}</p>}
            {child.comment && <p><strong>Комментарий:</strong> {child.comment}</p>}
            <div className="card-actions">
              <button onClick={() => { setEditingChild(child); setShowForm(true); }}>Редактировать</button>
              <button onClick={() => handleDeleteChild(child.uuid)}>Удалить</button> {/* используем child.uuid */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildCardManager;