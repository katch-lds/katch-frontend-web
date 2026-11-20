import { BrowserRouter } from 'react-router';
import { AppRouter } from './routes/AppRouter';
import { SessionProvider } from './session/SessionProvider';

/** Raiz da área de gestão web: sessão e rotas. */
export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </BrowserRouter>
  );
}
