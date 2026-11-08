import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from '@material-ui/icons/Search';
import NotificationsIcon from '@material-ui/icons/NotificationsNone';
import { NavContentBlueprint, type NavContentNavItem } from '@backstage/plugin-app-react';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';

const PRIMARY_IDS = [
  'page:home',
  'page:catalog',
  'page:app/documentation',
  'page:app/support',
];

const LABELS: Record<string, string> = {
  'page:home': 'Home',
  'page:catalog': 'Catalog',
  'page:app/documentation': 'Documentation',
  'page:api-docs': 'API Reference',
  'page:app/support': 'Support',
  'page:scaffolder': 'Templates',
};

function isCurrent(href: string, pathname: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function EthHeader({
  primary,
  more,
  ctaHref,
  settingsHref,
  notificationsHref,
}: {
  primary: NavContentNavItem[];
  more: NavContentNavItem[];
  ctaHref: string;
  settingsHref?: string;
  notificationsHref?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const links = [...primary, ...more.filter(item => item.node.spec.id !== 'page:search')];

  return (
    <div>
      <header className="eth-header">
        <Link to="/" className="eth-brand" aria-label="ETH Switch Developer Portal home">
          <img src="/eth-switch-logo.png" alt="" />
          <span>
            <strong>ETH Switch</strong>
            <small>Developer Portal</small>
          </span>
        </Link>

        <nav className="eth-nav" aria-label="Primary">
          {primary.map(item => (
            <Link
              key={item.node.spec.id}
              to={item.href}
              className={isCurrent(item.href, location.pathname) ? 'active' : undefined}
            >
              {LABELS[item.node.spec.id] ?? item.title}
            </Link>
          ))}
        </nav>

        <div className="eth-header-tools">
          <form
            className="eth-search"
            role="search"
            onSubmit={event => {
              event.preventDefault();
              navigate(query ? `/search?query=${encodeURIComponent(query)}` : '/search');
            }}
          >
            <SearchIcon />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search docs..."
              aria-label="Search docs"
            />
          </form>
          <span className="eth-status">All Systems Operational</span>
          {notificationsHref ? (
            <Link className="eth-icon-link" to={notificationsHref} aria-label="Notifications">
              <NotificationsIcon />
            </Link>
          ) : null}
          <Link className="eth-cta" to={ctaHref}>
            Get API Keys
          </Link>
          {settingsHref ? (
            <Link to={settingsHref} aria-label="Settings" className="eth-icon-link">
              <UserSettingsSignInAvatar />
            </Link>
          ) : (
            <UserSettingsSignInAvatar />
          )}
          <button
            type="button"
            className="eth-menu-button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>
      <nav className={open ? 'eth-mobile-nav open' : 'eth-mobile-nav'} aria-label="Mobile">
        {links.map(item => (
          <Link key={item.node.spec.id} to={item.href} onClick={() => setOpen(false)}>
            {LABELS[item.node.spec.id] ?? item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const primary = PRIMARY_IDS.flatMap(id => {
        const item = navItems.take(id);
        return item ? [item] : [];
      });
      const settings = navItems.take('page:user-settings');
      const notifications = navItems.take('page:notifications');
      const scaffolder = navItems.take('page:scaffolder');
      const more = navItems.rest().filter(item => item.node.spec.id !== 'page:app-visualizer');

      return (
        <EthHeader
          primary={primary}
          more={more}
          ctaHref={scaffolder?.href ?? '/create'}
          settingsHref={settings?.href}
          notificationsHref={notifications?.href}
        />
      );
    },
  },
});
