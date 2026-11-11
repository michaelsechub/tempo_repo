import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createRouter } from './router';
import { todoListServiceRef } from './services/TodoListService';

/**
 * tesfaPlugin backend plugin
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
        todoList: todoListServiceRef,
      },
      async init({ httpAuth, httpRouter, database, catalog, todoList }) {
        // Migrations run in the todoList service factory, which is resolved before init.
        const db = await database.getClient();
        httpRouter.use(
          await createRouter({
            httpAuth,
            todoList,
            db,
            catalog,
          }),
        );
      },
    });
  },
});
