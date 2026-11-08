import { createFrontendModule, createRouteRef, PageBlueprint } from '@backstage/frontend-plugin-api';
import MenuBookIcon from '@material-ui/icons/MenuBook';

const documentationPage = PageBlueprint.make({
  name: 'documentation',
  params: {
    path: '/documentation',
    title: 'Documentation',
    icon: <MenuBookIcon />,
    noHeader: true,
    routeRef: createRouteRef(),
    loader: () => import('./DocumentationPage').then(m => <m.DocumentationPage />),
  },
});

export const docsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [documentationPage],
});
