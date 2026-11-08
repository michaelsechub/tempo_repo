import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import { navModule } from './modules/nav';
import { homeModule } from './modules/home';
import { themeModule } from './modules/theme';
import { supportModule } from './modules/support';
import { docsModule } from './modules/docs';

export default createApp({
  features: [catalogPlugin, apiDocsPlugin, navModule, homeModule, themeModule, supportModule, docsModule],
});
