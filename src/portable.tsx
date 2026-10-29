import { createRoot } from 'react-dom/client';
import { Studio } from './components/studio';
import './app/globals.css';

createRoot(document.getElementById('studio')!).render(<Studio />);
