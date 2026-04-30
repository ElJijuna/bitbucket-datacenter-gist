import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Layout } from '@gnome-ui/layout';
import {
  HeaderBar,
  ViewSwitcher,
  ViewSwitcherItem,
  ViewSwitcherBar,
  useBreakpoint,
} from '@gnome-ui/react';
import { GoHome, Applications, Check, Refresh, Information } from '@gnome-ui/icons';

export const Route = createRootRoute({
  component: RootLayout,
});

const VIEWS = [
  { to: '/', label: 'Dashboard', icon: GoHome },
  { to: '/repos', label: 'Repos', icon: Applications },
  { to: '/tasks', label: 'Tasks', icon: Check },
  { to: '/gists', label: 'Gists', icon: Refresh },
  { to: '/logs', label: 'Logs', icon: Information },
];

function NavItems() {
  const navigate = useNavigate();
  const { location } = useRouterState();

  return VIEWS.map(({ to, label, icon }) => (
    <ViewSwitcherItem
      key={to}
      label={label}
      icon={icon}
      active={location.pathname === to}
      onClick={() => navigate({ to })}
    />
  ));
}

function RootLayout() {
  const { isMedium } = useBreakpoint();

  return (
    <Layout
      topBar={
        <HeaderBar
          flat
          title={
            !isMedium
              ? <ViewSwitcher aria-label="View"><NavItems /></ViewSwitcher>
              : 'Bitbucket Gist'
          }
        />
      }
      bottomBar={
        <ViewSwitcherBar reveal={isMedium}>
          <NavItems />
        </ViewSwitcherBar>
      }
    >
      <Outlet />
    </Layout>
  );
}
