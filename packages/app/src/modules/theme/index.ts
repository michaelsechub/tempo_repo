import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { ethDarkTheme, ethLightTheme } from './ethTheme';

export const themeModule = createFrontendModule({
  pluginId: 'app',
  extensions: [ethLightTheme, ethDarkTheme],
});
