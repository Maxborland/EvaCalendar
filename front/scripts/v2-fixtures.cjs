const child = {
  uuid: 'c1',
  childName: 'Аня',
  parentName: 'Мария',
  parentPhone: '+79990000000',
  address: 'Ленина, 12',
  hourlyRate: 2500,
  comment: null,
};

const lessonChild = {
  uuid: 'c2',
  childName: 'Боря',
  parentName: 'Ольга',
  parentPhone: '+79990000001',
  address: 'Пушкина, 5',
  hourlyRate: 1800,
  comment: null,
};

const moneyCategory = {
  uuid: 'cat-food',
  categoryName: 'Еда',
};

const getToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
};

const getTomorrow = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1)).toISOString().slice(0, 10);
};

const buildTasks = () => {
  const today = getToday();

  return [
    {
      uuid: 'income-1',
      title: 'Оплата: Аня',
      type: 'income',
      dueDate: today,
      time: '10:00',
      amount: 2500,
      amountEarned: 2500,
      child_uuid: child.uuid,
      childId: child.uuid,
      childName: child.childName,
      hourlyRate: 2500,
      hoursWorked: 1,
    },
    {
      uuid: 'expense-1',
      title: 'Материалы',
      type: 'expense',
      dueDate: today,
      amount: 700,
      amountSpent: 700,
      expenseCategoryName: moneyCategory.categoryName,
      expense_category_uuid: moneyCategory.uuid,
    },
    {
      uuid: 'lesson-1',
      title: 'Занятие: Боря',
      type: 'lesson',
      dueDate: today,
      time: '11:00',
      child_uuid: lessonChild.uuid,
      childId: lessonChild.uuid,
      childName: lessonChild.childName,
      childHourlyRate: lessonChild.hourlyRate,
      address: lessonChild.address,
    },
    {
      uuid: 'task-1',
      title: 'Позвонить родителю',
      type: 'task',
      dueDate: today,
      time: '12:30',
      completed: false,
    },
  ];
};

module.exports = {
  buildTasks,
  child,
  getToday,
  getTomorrow,
  lessonChild,
  moneyCategory,
};
