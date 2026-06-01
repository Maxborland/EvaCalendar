# EvaCalendar v2.0 Release Audit

## Verdict
EvaCalendar v2.0 is ready as a mobile daily hub slice for the core morning loop:

`open app -> understand the week -> add income/expense/task/lesson -> close action -> see the updated context`

This audit covers the product goal, not the entire historical backend test suite.

## Requirement Evidence

| Requirement | Status | Evidence |
|---|---|---|
| Mobile-only daily hub | Met | App shell is constrained for mobile use; v2 smoke runs at 390px and asserts no horizontal overflow or sub-44px visible button/role-button targets on core tabs. |
| Keep weekly planning split into two blocks/columns | Met | `v2-smoke` asserts the weekly planner grid has exactly 2 columns. |
| User understands today/week in 30 seconds | Met | `WeekView` first screen has `Фокус дня`, today totals, week totals, active days, children count, lessons, tasks, and two-column week plan. |
| Income and expenses are visible | Met | `WeekView`, `DayColumn`, `MoneyPage`, and `DayDetailsPage` surface income/expense totals and stored task amounts. `v2-smoke` checks `+2 500 ₽`, `+1 800 ₽`, and `-700 ₽`. |
| Children/lessons/clients are connected to the day | Met | `ChildrenPage` shows cards, rates, contacts, next lesson, today's child items; `WeekView` highlights unpaid lesson income action. |
| Tasks needing action are visible and closable | Met | `WeekView`, `DayDetailsPage`, and `TasksPage` show focus/open/overdue tasks. `v2-smoke` verifies task completion sends `completed=true`. |
| Add event/money/task in about 2 taps | Met | Type-first creation sheet is reachable from Plan, Money, Children, Tasks, day detail, and empty day quick actions. `v2-smoke` verifies local creation and selected-day prefill. |
| Empty states lead to next action | Met | Money, Children, and Tasks empty states have concrete CTAs. `v2-smoke` covers all three. |
| API failures do not masquerade as empty data | Met | `CoreStateNotice` handles core error states. `v2-smoke` covers Plan, Money, Children, and Tasks API failure states. |
| Mobile quality | Met | `core-mobile-audit` checks core happy/error screens at 390px for horizontal overflow and 44px tap targets. |

## Verification Gates

- `npm run test:domain`
  - Covers: frontend task record contract, entry payload contract, and planning projection behavior.
- `npm run test:access-scope` from `back`
  - Covers: backend family/user visibility rules without booting the full hanging test suite.
- `npm run test:v2-smoke`
  - Covers: weekly hub, day drill-down, local create, money empty state, children empty state, tasks empty state, empty-day quick actions, core error states, core mobile audit.
- `npm run lint`
  - Passes with 3 pre-existing warnings in `AuthContext` and `NavContext`.
- `npm run build`
  - Passes without Vite chunk-size or `lottie-web` eval warnings after route code-splitting and the lightweight CSS loader.

## Residual Risks

- The full backend test suite is not used as the v2 release gate because it can hang. Backend stabilization should remain a separate test-infrastructure task.
- `WeekView` and `UnifiedTaskFormModal` are now large and should be split later, but this is not blocking the v2 user journey.
- Statistics and child-card settings remain the largest lazy chunks, but they are no longer part of the initial route bundle.
- Existing lint warnings in `AuthContext` and `NavContext` remain outside this slice.

## Architecture Notes

- The v2 slice keeps backend/API changes targeted to visible task contract and access-scope issues.
- The UI now treats `income`, `expense`, `task`, and `lesson` as product-level creation intents.
- `taskRecord` owns frontend task kind, money amount, child matching, and time ordering.
- `taskEntry` owns creation/edit payload construction for the unified entry sheet.
- `planningProjection` owns derived day/week/task queue projections used by planning surfaces.
- `accessScopeService` owns backend family/user task visibility and financial summary scope.
- `v2-fixtures` keeps smoke data separate from the smoke runner logic.
- `CoreStateNotice` centralizes core loading/error messaging so failed API calls do not become misleading empty states.
- `useCreateTaskModal` keeps creation local to the user's current workflow instead of routing back to the weekly plan.
- Route-level lazy loading keeps secondary pages out of the initial mobile planning bundle.
- `LoadingAnimation` uses lightweight CSS instead of `lottie-web`, removing the eval warning and cutting initial JS size.
