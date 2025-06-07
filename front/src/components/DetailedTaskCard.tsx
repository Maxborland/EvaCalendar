import { type Task } from '../services/api';

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
  } = task;

  const handleEdit = () => onEdit(task);
  const handleDelete = () => onDelete(uuid);

  let incomeDisplayValue: string | undefined;
  if (type === 'income' || type === 'hourly') {
    if (amountEarned !== undefined) {
      incomeDisplayValue = `+${amountEarned} ₽`;
    }
  } else if (type === 'fixed') {
    if (amount !== undefined) {
      incomeDisplayValue = `+${amount} ₽`;
    }
  }

  const showChildInfo = parentName || parentPhone || childAddress || childHourlyRate !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-2xl my-4 p-6 w-full max-w-md">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-semibold !text-gray-800">{title || 'Название задачи'}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg btn btn-primary text-white transition duration-150"
            aria-label="Редактировать"
          >
            <span className="material-icons">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-700 hover:bg-red-500 text-white transition duration-150"
            aria-label="Удалить"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 text-gray-700">
        {time && (
          <div className="flex items-center">
            <span className="material-icons text-gray-500 mr-2">schedule</span>
            <p><span className="font-medium">Время:</span> {time}</p>
          </div>
        )}

        {childName && (
          <div className="flex items-center">
            <span className="material-icons text-gray-500 mr-2">child_care</span>
            <p><span className="font-medium">Ребенок:</span> {childName}</p>
          </div>
        )}

        {(type === 'income' || type === 'hourly' || type === 'fixed') && incomeDisplayValue && (
          <div className="flex items-center">
            <span className="material-icons text-green-500 mr-2">trending_up</span>
            <p><span className="font-medium">Доход:</span> <span className="text-green-600 font-semibold">{incomeDisplayValue}</span></p>
          </div>
        )}

        {type === 'expense' && amountSpent !== undefined && (
            <div className="flex items-center">
                <span className="material-icons text-red-500 mr-2">trending_down</span>
                <p><span className="font-medium">Расход:</span> <span className="text-red-600 font-semibold">-{amountSpent} ₽</span></p>
            </div>
        )}

        {showChildInfo && (
          <>
            <hr className="my-4 border-gray-200" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Информация о ребенке:</h3>

            {parentName && (
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-2">person</span>
                <p><span className="font-medium">Имя родителя:</span> {parentName}</p>
              </div>
            )}

            {parentPhone && (
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-2">phone</span>
                <p><span className="font-medium">Телефон:</span> {parentPhone}</p>
              </div>
            )}

            {childAddress && (
              <div className="flex items-start">
                <span className="material-icons text-gray-500 mr-2 mt-1">location_on</span>
                <p><span className="font-medium">Адрес:</span> {childAddress}</p>
              </div>
            )}

            {childHourlyRate !== undefined && (
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-2">payments</span>
                <p><span className="font-medium">Ставка:</span> {childHourlyRate} ₽/час</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailedTaskCard;