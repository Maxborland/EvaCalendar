# План проектирования "мини-карточки" для отображения информации о выбранном ребенке

## 1. Содержимое карточки:
*   Имя ребенка.
*   Имя родителя.
*   Телефон родителя.
*   Адрес.
*   Ставка в час.
*   Комментарий.

## 2. Расположение:
*   Мини-карточка будет интегрирована в компонент `front/src/components/UnifiedChildSelector.tsx`.
*   Она будет отображаться непосредственно под полем ввода имени ребенка.
*   Видимость карточки будет зависеть от того, выбран ли ребенок.

## 3. Внешний вид и структура:

### JSX (внутри `UnifiedChildSelector.tsx`):
```jsx
{/* selectedChildDetails будет новым пропсом, содержащим данные выбранного ребенка */}
{selectedChildDetails && (
  <div className="child-info-card">
    <h4>{selectedChildDetails.childName}</h4>
    <div className="info-item">
      <span className="info-label">Родитель:</span>
      <span className="info-value">{selectedChildDetails.parentName}</span>
    </div>
    <div className="info-item">
      <span className="info-label">Телефон:</span>
      <span className="info-value">{selectedChildDetails.parentPhone}</span>
    </div>
    <div className="info-item">
      <span className="info-label">Адрес:</span>
      <span className="info-value">{selectedChildDetails.address}</span>
    </div>
    <div className="info-item">
      <span className="info-label">Ставка:</span>
      <span className="info-value">{selectedChildDetails.hourlyRate} ₽/час</span>
    </div>
    {selectedChildDetails.comment && ( // Отображаем, только если комментарий есть
      <div className="info-item">
        <span className="info-label">Комментарий:</span>
        <span className="info-value">{selectedChildDetails.comment}</span>
      </div>
    )}
  </div>
)}
```

### CSS (предлагаемые стили для `front/src/components/UnifiedChildSelector.css`):
```css
.child-info-card {
  background-color: var(--theme-gray-light);
  border: 1px solid var(--theme-gray-medium);
  border-radius: 4px;
  padding: 10px;
  margin-top: 8px;
  color: var(--theme-gray-dark);
  font-size: 0.9em;
}

.child-info-card h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1em;
  font-weight: bold;
  color: var(--theme-gray-dark);
}

.child-info-card .info-item {
  display: flex;
  margin-bottom: 4px;
}

.child-info-card .info-item:last-child {
  margin-bottom: 0;
}

.child-info-card .info-label {
  font-weight: bold;
  margin-right: 5px;
  color: var(--theme-gray-dark);
}

.child-info-card .info-value {
  color: var(--theme-gray-dark);
  word-break: break-word; /* Для переноса длинных строк адреса и комментариев */
}
```

## 4. Взаимодействие:
*   Карточка будет неинтерактивной, служащей только для отображения информации.

## 5. Необходимые изменения в компонентах:
*   **`front/src/components/UnifiedChildSelector.tsx`:**
    *   Добавить новый пропс `selectedChildDetails: Child | null`.
    *   Реализовать условный рендеринг мини-карточки на основе этого пропа.
*   **`front/src/components/TaskForm.tsx`:**
    *   Модифицировать логику для передачи полных данных выбранного ребенка (включая `comment`) в `UnifiedChildSelector` через новый пропс `selectedChildDetails`.

## 6. Диаграмма последовательности (Mermaid):
```mermaid
sequenceDiagram
    participant User
    participant TaskForm
    participant UnifiedChildSelector

    User->>UnifiedChildSelector: Вводит имя и выбирает ребенка
    UnifiedChildSelector->>TaskForm: Вызывает onChange(childId)
    TaskForm->>TaskForm: В useEffect при изменении selectedChildUuid: загружает полные данные ребенка (childData)
    TaskForm->>TaskForm: Сохраняет childData в своем состоянии
    TaskForm->>UnifiedChildSelector: Передает обновленные childData как проп selectedChildDetails
    UnifiedChildSelector->>UnifiedChildSelector: Отображает мини-карточку, используя selectedChildDetails (включая hourlyRate и comment)