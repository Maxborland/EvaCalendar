import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WeekView from './components/WeekView';
import { NavProvider } from './context/NavContext';
import ChildCardsSettingsPage from './pages/ChildCardsSettingsPage';
import DayDetailsPage from './pages/DayDetailsPage'; // Импортируем новую страницу
import ExpenseCategoriesSettingsPage from './pages/ExpenseCategoriesSettingsPage';
import NoteDetailsPage from './pages/NoteDetailsPage'; // Импортируем страницу заметок
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <NavProvider>
        <Routes>
          <Route path="/" element={<WeekView />} />
          <Route path="/settings" element={<SettingsPage />}>
            <Route path="expense-categories" element={<ExpenseCategoriesSettingsPage />} />
            <Route path="child-cards" element={<ChildCardsSettingsPage />} />
          </Route>
          <Route path="/day/:dateString" element={<DayDetailsPage />} /> {/* Новый маршрут */}
          <Route path="/notes/:date" element={<NoteDetailsPage />} /> {/* Обновленный маршрут для заметок с датой */}
        </Routes>
      </NavProvider>
    </BrowserRouter>
  )
}

export default App
