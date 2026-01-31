import { NavLink } from 'react-router-dom';

const SettingsMenu = () => {
  return (
    <nav>
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
        <li>
          <NavLink
            to="/settings/expense-categories"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary transition-colors hover:bg-white/[0.06] ${isActive ? 'bg-white/[0.08] text-text-primary font-medium' : ''}`
            }
          >
            Категории расходов
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings/child-cards"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary transition-colors hover:bg-white/[0.06] ${isActive ? 'bg-white/[0.08] text-text-primary font-medium' : ''}`
            }
          >
            Карточки детей
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default SettingsMenu;
