import './App.css';
import Header from './components/Header';
import WeekView from './components/WeekView';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <div id="app">
        <Header />
        <WeekView />
      </div>
    </AppProvider>
  );
}

export default App;
