import useAuthStore from './store/authStore';
import LoginForm from './components/LoginForm';
import CalendarPage from './pages/CalendarPage';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <ErrorBoundary>
      {token ? <CalendarPage /> : <LoginForm />}
      <Toast />
    </ErrorBoundary>
  );
}

export default App;