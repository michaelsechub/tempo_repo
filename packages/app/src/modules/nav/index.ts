import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { EthLayout } from './EthLayout';
import { SidebarContent } from './Sidebar';

export const navModule = createFrontendModule({
  pluginId: 'app',
  extensions: [EthLayout, SidebarContent],
});
