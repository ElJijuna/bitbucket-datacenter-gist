import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import '@gnome-ui/core/styles';
import '@gnome-ui/react/styles';
import '@gnome-ui/layout/styles';

const router = createRouter({ routeTree });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
