import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WeekView from './components/WeekView';
import SettingsPage from './pages/SettingsPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WeekView />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
