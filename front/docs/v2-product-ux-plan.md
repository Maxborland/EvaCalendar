# EvaCalendar v2.0 Product and UX Plan

## Product Intent
- Problem: the app has useful pieces, but the main mobile experience is not coherent enough for daily use.
- User / role: a mobile-first user who plans a week, tracks lessons/work with children, records income and expenses, and delegates tasks inside a family.
- Customer need: open the app, understand the week, add the right kind of item quickly, and see money impact without navigating through settings or reports.
- Desired outcome: EvaCalendar feels like a compact mobile workbench for planning, children, money, and tasks.
- Business value: better daily retention because the first screen becomes useful every day, not just a data entry surface.
- Non-goals: desktop dashboard redesign, advanced analytics, exports, complex CRM, and broad backend rewrites in the first v2 slice.

## Product Principles
- Mobile only is a constraint, not a limitation.
- The two-column weekly planning screen is the core product surface and must stay.
- Creation must start from user intent: income, expense, task, lesson.
- Children and money are connected, but should not overload every form.
- Color can support meaning, but labels and icons must also carry meaning.
- Every visible action must be real: no dead buttons, fake drag-only flows, or unsupported API calls.

## v2 Information Architecture
1. Plan: two-column weekly screen, quick creation, week note, daily totals.
2. Money: balance, income, expenses, categories, recent operations.
3. Children: child cards, rates, contact/address, quick income/lesson actions.
4. Tasks: personal, assigned, family, overdue, completed.
5. Settings: secondary surface, not a core navigation destination.

## Now
- Keep the main weekly screen in two columns.
- Add daily income/expense/task signals directly inside each day.
- Add quick empty-day actions: Income, Expense, Task.
- Make event cards show real financial amounts from backend fields.
- Convert the creation modal into type-first progressive disclosure.
- Move category and child management closer to their workflows.

## Next
- Money screen v2 with period switch, balance, income by child, expenses by category, and latest operations.
- Child profile v2 with quick actions, rate, contacts, address, and history.
- Task state model in UI: assigned to me, delegated, overdue, done.
- Consistent bottom navigation: Plan, Money, Children, Tasks, Create.

## Later
- Advanced analytics and reports.
- Offline synchronization as an explicit, visible feature.
- Smart reminders and recurring templates.
- Export and shareable summaries.

## Acceptance Criteria For v2 Main Flow
AC1. Weekly overview
Given I open the app on mobile
When the weekly planner loads
Then I can see all seven days in the two-column layout
And each day shows counts or totals for income, expenses, and tasks when present.

AC2. Fast creation
Given a day has no items
When I tap Income, Expense, or Task
Then the creation sheet opens with that type preselected
And the date is set to the tapped day.

AC3. Financial clarity
Given a day has income or expense items
When I look at the day card
Then income and expenses are visible as separate numbers
And event cards display the stored amount even when the backend field is amountEarned or amountSpent.

AC4. Mobile quality
Given I use a narrow phone viewport
When I tap, scroll, or open a sheet
Then primary tap targets are at least 44px
And controls do not require hover or precise drag gestures.

## Current Checkpoint
- Main nav is now Plan, Money, Children, Tasks, with Settings kept secondary.
- Weekly planner keeps the two-column layout and now shows day/week money, children, lessons, and task signals.
- Fast creation is type-first and stays local on Plan, Money, Children, Tasks, and day details.
- Empty-day quick actions on the weekly planner open Income, Expense, and Task sheets with the selected day prefilled.
- Money defaults to the current week, matching the daily hub mental model.
- Empty states for Money, Children, and Tasks now lead to real next actions instead of dead ends.
- v2 smoke covers weekly hub, day drill-down, local create, and the key empty states.
- v2 smoke covers core error states so API failures no longer look like empty weeks, children, money, or tasks.
- v2 smoke now includes a 390px mobile audit for Plan, Money, Children, Tasks, and core error states: no horizontal overflow and visible button/role-button tap targets at least 44px.
- Frontend domain contracts now have fast tests for task records, task entry payloads, and planning projections.
- Backend access scope now has a focused test gate that skips the full hanging database setup.
- Full backend tests now pass after making seed setup tolerant of the missing `back/seeds` directory.
- Build no longer emits the previous large initial chunk or `lottie-web` eval warnings.

## Remaining Before Calling v2 Done
- Split the large `WeekView`/modal logic later if development velocity starts suffering; do not block v2 UX on that refactor.
- Keep backend full test stabilization separate from the v2 smoke gate because the current suite can hang.

## Architecture Notes
- Keep frontend UI changes inside `front/src/components` and `front/src/pages`, with repeated product rules moved into `front/src/domain`.
- Do not introduce a new design system before stabilizing existing tokens in `theme.css`.
- Treat task type as a product concept and backend storage type as an implementation detail.
- Keep backend/API work targeted to visible broken contracts only.
- `taskRecord`, `taskEntry`, and `planningProjection` are the main frontend seams for V2 product behavior.
- `accessScopeService` is the backend seam for family/user visibility and financial summary scope.
- Route-level lazy loading keeps Plan fast as the core mobile entry point.
