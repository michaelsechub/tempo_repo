import { createFrontendModule, createRouteRef, PageBlueprint } from '@backstage/frontend-plugin-api';
import HomeIcon from '@material-ui/icons/Home';

const homePage = PageBlueprint.make({
  params: {
    path: '/',
    title: 'Home',
    icon: <HomeIcon />,
    noHeader: true,
    routeRef: createRouteRef(),
    loader: () => import('./PortalHomePage').then(m => <m.PortalHomePage />),
  },
});

export const homeModule = createFrontendModule({
  pluginId: 'home',
  extensions: [homePage],
});
