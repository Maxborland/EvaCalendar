import { type Task } from '../services/api';
import './DetailedTaskCard.css';

interface DetailedTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const DetailedTaskCard = ({ task, onEdit, onDelete }: DetailedTaskCardProps) => {
  const {
    uuid,
    title,
    type,
    time,
    childName,
    amount,
    amountEarned,
    amountSpent,
    parentName,
    parentPhone,
    childAddress,
    childHourlyRate,
    assignee,
  } = task;

  const handleEdit = () => onEdit(task);
  const handleDelete = () => onDelete(uuid);

  let incomeDisplayValue: string | undefined;
  if (type === 'income' || type === 'hourly' || type === 'fixed') {
    const displayAmount = amount ?? amountEarned;
    if (displayAmount !== undefined) {
      incomeDisplayValue = `+${displayAmount} ₽`;
    }
  }

  const showChildInfo = parentName || parentPhone || childAddress || childHourlyRate !== undefined;

  return (
    <div className="detailed-task-card">
      <div className="detailed-task-card__header">
        <h2 className="detailed-task-card__title">{title || 'Название задачи'}</h2>
        <div className="detailed-task-card__actions">
          <button
            onClick={handleEdit}
            className="detailed-task-card__btn detailed-task-card__btn--edit"
            aria-label="Редактировать"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="detailed-task-card__btn detailed-task-card__btn--delete"
            aria-label="Удалить"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>

      <div className="detailed-task-card__body">
        {time && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon">schedule</span>
            <p><span className="detailed-task-card__label">Время:</span> {time}</p>
          </div>
        )}

        {childName && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon">child_care</span>
            <p><span className="detailed-task-card__label">Ребенок:</span> {childName}</p>
          </div>
        )}

        {type === 'lesson' && task.address && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon detailed-task-card__icon--lesson">location_on</span>
            <p><span className="detailed-task-card__label">Адрес:</span> {task.address}</p>
          </div>
        )}

        {type === 'lesson' && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon detailed-task-card__icon--lesson">school</span>
            <p><span className="detailed-task-card__label">Тип:</span> Занятие</p>
          </div>
        )}

        {type === 'task' && assignee && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon">assignment_ind</span>
            <p><span className="detailed-task-card__label">Исполнитель:</span> {assignee.username}</p>
          </div>
        )}

        {(type === 'income' || type === 'hourly' || type === 'fixed') && incomeDisplayValue && (
          <div className="detailed-task-card__info-row">
            <span className="material-icons detailed-task-card__icon detailed-task-card__icon--income">trending_up</span>
            <p><span className="detailed-task-card__label">Доход:</span> <span className="detailed-task-card__amount detailed-task-card__amount--income">{incomeDisplayValue}</span></p>
          </div>
        )}

        {type === 'expense' && amountSpent !== undefined && (
            <div className="detailed-task-card__info-row">
                <span className="material-icons detailed-task-card__icon detailed-task-card__icon--expense">trending_down</span>
                <p><span className="detailed-task-card__label">Расход:</span> <span className="detailed-task-card__amount detailed-task-card__amount--expense">-{amountSpent} ₽</span></p>
            </div>
        )}

        {type === 'lesson' && task.comments && (
          <div className="detailed-task-card__section">
            <h3 className="detailed-task-card__section-title">Заметки:</h3>
            <div className="detailed-task-card__comments">
              <p>{task.comments}</p>
            </div>
          </div>
        )}

        {showChildInfo && type !== 'lesson' && (
          <div className="detailed-task-card__section">
            <h3 className="detailed-task-card__section-title">Информация о ребенке:</h3>

            {parentName && (
              <div className="detailed-task-card__info-row">
                <span className="material-icons detailed-task-card__icon">person</span>
                <p><span className="detailed-task-card__label">Имя родителя:</span> {parentName}</p>
              </div>
            )}

            {parentPhone && (
              <div className="detailed-task-card__info-row">
                <span className="material-icons detailed-task-card__icon">phone</span>
                <p><span className="detailed-task-card__label">Телефон:</span> {parentPhone}</p>
              </div>
            )}

            {childAddress && (
              <div className="detailed-task-card__info-row">
                <span className="material-icons detailed-task-card__icon">location_on</span>
                <p><span className="detailed-task-card__label">Адрес:</span> {childAddress}</p>
              </div>
            )}

            {childHourlyRate !== undefined && (
              <div className="detailed-task-card__info-row">
                <span className="material-icons detailed-task-card__icon">payments</span>
                <p><span className="detailed-task-card__label">Ставка:</span> {childHourlyRate} ₽/час</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedTaskCard;