import {
  coreServices,
  createBackendPlugin,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createRouter } from './router';

/**
 * tesfaPlugin backend plugin: stores catalog entities and uploaded PDFs
 * for the "Manage a …" templates.
 *
 * @public
 */
export const tesfaPlugin = createBackendPlugin({
  pluginId: 'tesfa',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
      },
      async init({ httpAuth, httpRouter, database, catalog, config }) {
        const db = await database.getClient();

        // Creates/updates the plugin's tables (entities, files) from ../migrations
        if (!database.migrations?.skip) {
          await db.migrate.latest({
            directory: resolvePackagePath(
              '@internal/backstage-plugin-tesfa-backend',
              'migrations',
            ),
          });
        }

        // PDF links on entity pages are opened directly by the browser, which sends
        // no Backstage token. Uploading (POST /files) still requires a signed-in user.
        httpRouter.addAuthPolicy({ path: '/files', allow: 'unauthenticated' });
        httpRouter.use(
          await createRouter({
            httpAuth,
            db,
            catalog,
            // Where uploaded PDFs are saved; relative paths start from packages/backend
            filesDir: config.getOptionalString('tesfa.filesDir') ?? 'files',
          }),
        );
      },
    });
  },
});
