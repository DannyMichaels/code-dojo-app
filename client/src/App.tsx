import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import router from './routes';

export default function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <RouterProvider router={ router } />
    </SnackbarProvider>
  );
}
