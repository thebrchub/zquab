import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import RootLayout from './layout/RootLayout';

// Pages
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Safety from './pages/Safety';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/safety" element={<Safety />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;