import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WeekView from './components/WeekView';
import { NavProvider } from './context/NavContext';
import DayDetailsPage from './pages/DayDetailsPage'; // Импортируем новую страницу
import SettingsPage from './pages/SettingsPage';


function App() {
  return (
    <BrowserRouter>
      <NavProvider>
        <Routes>
          <Route path="/" element={<WeekView />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/day/:dateString" element={<DayDetailsPage />} /> {/* Новый маршрут */}
        </Routes>
      </NavProvider>
    </BrowserRouter>
  )
}

export default App
