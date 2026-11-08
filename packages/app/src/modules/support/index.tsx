import { createFrontendModule, createRouteRef, PageBlueprint } from '@backstage/frontend-plugin-api';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

const supportPage = PageBlueprint.make({
  name: 'support',
  params: {
    path: '/support',
    title: 'Support',
    icon: <HelpOutlineIcon />,
    noHeader: true,
    routeRef: createRouteRef(),
    loader: () => import('./SupportPage').then(m => <m.SupportPage />),
  },
});

export const supportModule = createFrontendModule({
  pluginId: 'app',
  extensions: [supportPage],
});
