import { NavLink } from 'react-router-dom';
import './SettingsMenu.css';

const SettingsMenu = () => {
  return (
    <nav>
      <ul>
        <li>
          <NavLink
            to="/settings/expense-categories"
            className={({ isActive }) =>
              isActive ? "settings-menu-link settings-menu-link-active" : "settings-menu-link"
            }
          >
            Категории расходов
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings/child-cards"
            className={({ isActive }) =>
              isActive ? "settings-menu-link settings-menu-link-active" : "settings-menu-link"
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