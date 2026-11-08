import { ThemeBlueprint } from '@backstage/plugin-app-react';
import {
  UnifiedThemeProvider,
  createUnifiedTheme,
  genPageTheme,
  palettes,
  shapes,
} from '@backstage/theme';
import DarkIcon from '@material-ui/icons/Brightness2';
import LightIcon from '@material-ui/icons/WbSunny';

const pageTheme = genPageTheme({
  colors: ['#142536', '#F37321'],
  shape: shapes.wave,
  options: { fontColor: '#ffffff' },
});

const sharedPages = {
  home: pageTheme,
  documentation: pageTheme,
  tool: pageTheme,
  service: pageTheme,
  website: pageTheme,
  library: pageTheme,
  other: pageTheme,
  app: pageTheme,
  apis: pageTheme,
};

const ethLight = createUnifiedTheme({
  fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultPageTheme: 'home',
  pageTheme: sharedPages,
  palette: {
    ...palettes.light,
    primary: { main: '#F37321' },
    secondary: { main: '#1B2A3B' },
    background: { default: '#f7f8fa', paper: '#ffffff' },
    text: { primary: '#1B2A3B', secondary: '#5f6975' },
    link: '#e86617',
    linkHover: '#F37321',
    navigation: {
      background: '#ffffff',
      indicator: '#F37321',
      color: '#58616d',
      selectedColor: '#F37321',
      navItem: { hoverBackground: '#fff4ec' },
      submenu: { background: '#ffffff' },
    },
    bursts: {
      fontColor: '#ffffff',
      slackChannelText: '#F37321',
      backgroundColor: { default: '#1B2A3B' },
      gradient: {
        linear: 'linear-gradient(116deg, #142536 0%, #1B2A3B 58%, #aa4b1e 100%)',
      },
    },
  },
});

export const ethLightTheme = ThemeBlueprint.make({
  name: 'light',
  params: {
    theme: {
      id: 'light',
      title: 'ETH Switch',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={ethLight}>{children}</UnifiedThemeProvider>
      ),
    },
  },
});

export const ethDarkTheme = ThemeBlueprint.make({
  name: 'dark',
  params: {
    theme: {
      id: 'dark',
      title: 'ETH Switch',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={ethLight}>{children}</UnifiedThemeProvider>
      ),
    },
  },
});
