# Анализ схемы базы данных на основе миграций

## Резюме структуры базы данных

**1. Таблица `children`**
   - `uuid` (UUID, PK, NOT NULL) - *Изменение: ранее `increments`*
   - `childName` (STRING, NOT NULL)
   - `parentName` (STRING, NOT NULL)
   - `parentPhone` (STRING, NOT NULL)
   - `address` (STRING)
   - `hourlyRate` (FLOAT)
   - `comment` (TEXT)

**2. Таблица `expense_categories`**
   - `uuid` (UUID, PK, NOT NULL) - *Изменение: ранее `increments`*
   - `category_name` (STRING, NOT NULL, UNIQUE)

**3. Таблица `notes`**
   - `uuid` (UUID, PK, NOT NULL) - *Изменение: ранее `increments`*
   - `date` (DATE, NOT NULL)
   - `content` (TEXT)

**4. Таблица `tasks`**
   - `uuid` (UUID, PK, NOT NULL) - *Изменение: ранее `increments`*
   - `type` (STRING, NOT NULL)
   - `title` (STRING, NOT NULL)
   - `dueDate` (DATE, NOT NULL) - *Изменение: добавлено как обязательное поле*
   - `time` (DATETIME)
   - `childId` (UUID, FK references `children(uuid)` ON DELETE CASCADE) - *Изменение: тип с `integer` на `uuid`, `references` на `uuid`*
   - `hoursWorked` (INTEGER)
   - `amountEarned` (FLOAT)
   - `amountSpent` (FLOAT)
   - `comments` (TEXT)
   - `expenceTypeId` (UUID, FK references `expense_categories(uuid)` ON DELETE RESTRICT) - *Изменение: тип с `integer` на `uuid`, `references` на `uuid`*

## Ключевые связи таблицы `tasks`
*   **Связь с `children`:** Поле `childId` в таблице `tasks` ссылается на `uuid` в таблице `children`. Это связь "многие-к-одному", где одна задача может быть (опционально) связана с одним ребенком, а один ребенок может иметь несколько задач. При удалении записи о ребенке из таблицы `children`, все связанные с ним задачи из таблицы `tasks` будут автоматически удалены (ON DELETE CASCADE).
*   **Связь с `expense_categories`:** Поле `expenceTypeId` в таблице `tasks` ссылается на `uuid` в таблице `expense_categories`. Это связь "многие-к-одному", где одна задача может быть (опционально) связана с одной категорией расходов, а одна категория расходов может быть связана с несколькими задачами. Попытка удалить категорию расходов, если на нее есть ссылки из таблицы `tasks`, будет заблокирована (ON DELETE RESTRICT).

## Предполагаемые недавние изменения в схеме
1.  **Переход на UUID в качестве первичных ключей:** Все таблицы теперь используют `uuid` вместо автоинкрементных ID.
2.  **Обновление внешних ключей в `tasks`:** Поля `childId` и `expenceTypeId` в таблице `tasks` были обновлены для использования `uuid`.
3.  **Добавление `dueDate` в `tasks`:** Поле `dueDate` стало обязательным в таблице `tasks`.

## Диаграмма связей (Mermaid)
```mermaid
erDiagram
    children {
        UUID uuid PK "Первичный ключ"
        STRING childName
        STRING parentName
        STRING parentPhone
        STRING address
        FLOAT hourlyRate
        TEXT comment
    }
    expense_categories {
        UUID uuid PK "Первичный ключ"
        STRING category_name "Уникальное имя"
    }
    notes {
        UUID uuid PK "Первичный ключ"
        DATE date
        TEXT content
    }
    tasks {
        UUID uuid PK "Первичный ключ"
        STRING type
        STRING title
        DATE dueDate "Обязательное поле"
        DATETIME time
        UUID childId FK "Ссылка на children"
        INTEGER hoursWorked
        FLOAT amountEarned
        FLOAT amountSpent
        TEXT comments
        UUID expenceTypeId FK "Ссылка на expense_categories"
    }

    tasks }o--|| children : "связана с (ребенок)"
    tasks }o--|| expense_categories : "относится к (категория расходов)"