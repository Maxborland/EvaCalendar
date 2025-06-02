# Технический план: Сворачиваемая/разворачиваемая верхняя сводка

## 1. Обзор

Цель: Реализовать интерактивность для компонента "верхняя сводка" ([`SummaryBlock.tsx`](front/src/components/SummaryBlock.tsx:0)), позволяющую пользователю сворачивать и разворачивать её. По умолчанию сводка должна быть свёрнута.

## 2. Управление состоянием

-   В React-компоненте [`SummaryBlock.tsx`](front/src/components/SummaryBlock.tsx:0) будет использовано локальное состояние для отслеживания, развёрнут ли блок:
    ```typescript
    const [isExpanded, setIsExpanded] = useState(false); // По умолчанию свёрнуто
    ```
-   Будет создана функция `toggleExpansion` для переключения этого состояния по клику.

## 3. Структура HTML (JSX) компонента

-   Основной контейнер `<div class="summary-block-container">` получит дополнительный класс `.expanded` в зависимости от состояния `isExpanded`.
-   Будет создана общая кликабельная "шапка" (`.summary-header-clickable`), отвечающая за переключение состояния. Внутри неё:
    -   Элемент для отображения даты (`.summary-today-display`).
    -   Блок баланса (`.summary-balance-collapsed-view`), который будет виден **и в свёрнутом, и в развёрнутом состоянии** (согласно последним уточнениям, он остается видимым). В свёрнутом виде он стилизуется согласно скриншоту.
-   Существующий контент, который должен сворачиваться/разворачиваться (карточки доходов/расходов `<div class="summary-cards-wrapper">` и, если баланс не дублируется в шапке, то и основной блок баланса `<div class="summary-balance">`), будет обёрнут в новый контейнер `.summary-collapsible-content`. Этот контейнер будет анимироваться.

**Примерная структура JSX:**
```tsx
// В SummaryBlock.tsx

const [isExpanded, setIsExpanded] = useState(false);
const toggleExpansion = () => setIsExpanded(!isExpanded);

return (
    <div className={`summary-block-container ${isExpanded ? 'expanded' : ''}`}>
        <div
            className="summary-header-clickable"
            onClick={toggleExpansion}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-controls="summary-details-content"
        >
            <div className="summary-today-display">
                <p className="summary-item">Сегодня: {today.format('DD MMMM YYYY')}</p>
            </div>
            {/* Баланс, видимый всегда в шапке, стилизуется по-разному в зависимости от isExpanded */}
            <div className={`summary-balance-header-view ${!isExpanded ? 'collapsed-style' : ''}`}>
                <p className="summary-item">Баланс: {formatCurrency(monthlySummary.balance)}</p>
            </div>
        </div>

        <div id="summary-details-content" className="summary-collapsible-content">
            <div className="summary-cards-wrapper">
                {/* Карточки доходов и расходов */}
            </div>
            {/* Если основной блок баланса не является частью шапки и должен анимироваться */}
            {/* <div className="summary-balance">
                <p className="summary-item">Баланс: {formatCurrency(monthlySummary.balance)}</p>
            </div> */}
        </div>
    </div>
);
```
*Примечание: Структура баланса в JSX выше предполагает, что он всегда в шапке. Если он должен быть частью анимируемого контента, его нужно будет переместить в `.summary-collapsible-content`.*

## 4. Стилизация и CSS ([`SummaryBlock.css`](front/src/components/SummaryBlock.css:0))

-   **`.summary-header-clickable`**:
    -   Стилизация для корректного отображения даты и блока баланса.
    -   `cursor: pointer;`
    -   При `:active` (тап) - лёгкое изменение стиля (например, `background-color` или `opacity`) для визуального отклика.
-   **`.summary-balance-header-view.collapsed-style`**:
    -   Стили согласно скриншоту для свёрнутого состояния (светло-голубой фон и т.д.).
-   **`.summary-collapsible-content`**:
    -   В свёрнутом состоянии (`.summary-block-container:not(.expanded) .summary-collapsible-content`):
        -   `max-height: 0;`
        -   `opacity: 0;`
        -   `overflow: hidden;`
        -   `visibility: hidden;`
    -   В развёрнутом состоянии (`.summary-block-container.expanded .summary-collapsible-content`):
        -   `max-height: 1000px;` (или другое достаточно большое значение).
        -   `opacity: 1;`
        -   `visibility: visible;`

## 5. Анимация

-   CSS Transitions для свойств `max-height` и `opacity` элемента `.summary-collapsible-content`.
-   Длительность анимации: `0.35s`.
-   Функция плавности: `ease-in-out`.
-   `visibility` будет изменяться с задержкой:
    ```css
    .summary-collapsible-content {
        /* ... */
        transition: max-height 0.35s ease-in-out,
                    opacity 0.35s ease-in-out,
                    visibility 0s linear 0.35s; /* Задержка для скрытия */
    }

    .summary-block-container.expanded .summary-collapsible-content {
        /* ... */
        transition: max-height 0.35s ease-in-out,
                    opacity 0.35s ease-in-out,
                    visibility 0s linear 0s; /* Без задержки для показа */
    }
    ```

## 6. Доступность (ARIA)

-   Кликабельный элемент `.summary-header-clickable` будет иметь:
    -   `role="button"`
    -   `tabIndex="0"`
    -   `aria-expanded={isExpanded.toString()}`
    -   `aria-controls="summary-details-content"`
-   Анимируемый блок `.summary-collapsible-content` будет иметь `id="summary-details-content"`.

## 7. Производительность

-   Анимация `max-height` может вызывать пересчеты макета, но для данного компонента это должно быть приемлемо.
-   Использование `visibility` помогает улучшить производительность.

## 8. Mermaid-диаграмма логики

```mermaid
graph TD
    A[Свёрнуто (isExpanded: false)] -- Клик на шапку --> B[Развёрнуто (isExpanded: true)];
    B -- Клик на шапку --> A;

    subgraph "Компонент SummaryBlock"
        direction TB

        HeaderClickable["Кликабельная Шапка (.summary-header-clickable)"]
            DateView["Отображение Даты (.summary-today-display)"]
            BalanceHeaderView["Баланс в Шапке (.summary-balance-header-view)"]

        CollapsibleContent["Сворачиваемый Контент (.summary-collapsible-content)"]
            CardsWrapper["Карточки Доходов/Расходов (.summary-cards-wrapper)"]
            %% OptionalFullBalanceView["(Опционально) Основной Блок Баланса"]

        HeaderClickable --> DateView;
        HeaderClickable --> BalanceHeaderView;
        CollapsibleContent --> CardsWrapper;
        %% CollapsibleContent --> OptionalFullBalanceView;
    end

    A :-> Отображает DateView;
    A :-> Отображает BalanceHeaderView (стиль .collapsed-style);
    A :-> Скрывает CollapsibleContent (max-height:0, opacity:0);

    B :-> Отображает DateView;
    B :-> Отображает BalanceHeaderView (обычный стиль);
    B :-> Показывает CollapsibleContent (max-height:auto, opacity:1);
```

## 9. Рекомендации для разработчика

1.  **Реализовать управление состоянием** `isExpanded` в [`SummaryBlock.tsx`](front/src/components/SummaryBlock.tsx:0).
2.  **Обновить JSX-структуру** компонента согласно предложенному плану.
3.  **Добавить CSS-классы и стили** в [`SummaryBlock.css`](front/src/components/SummaryBlock.css:0).
4.  **Настроить CSS Transitions**.
5.  **Установить ARIA-атрибуты**.
6.  **Протестировать** поведение, анимацию и доступность.