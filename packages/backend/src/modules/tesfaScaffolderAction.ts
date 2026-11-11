import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  createTemplateAction,
  scaffolderActionsExtensionPoint,
} from '@backstage/plugin-scaffolder-node';

/**
 * Scaffolder action `tesfa:entity:save`.
 * Form → database: sends the entity built from the form to the tesfa backend,
 * which stores it in the `tesfa.entities` table.
 */
export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'tesfa-actions',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ scaffolder, discovery, auth }) {
        scaffolder.addActions(
          createTemplateAction({
            id: 'tesfa:entity:save',
            description: 'Saves a catalog entity to the tesfa database',
            schema: {
              input: {
                entity: z =>
                  z
                    .record(z.any())
                    .describe('The entity to save (apiVersion, kind, metadata, spec)'),
              },
            },
            async handler(ctx) {
              const baseUrl = await discovery.getBaseUrl('tesfa');
              // Call the tesfa backend as the user who started the template
              const { token } = await auth.getPluginRequestToken({
                onBehalfOf: await ctx.getInitiatorCredentials(),
                targetPluginId: 'tesfa',
              });

              const res = await fetch(`${baseUrl}/entities`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(ctx.input.entity),
              });
              if (!res.ok) {
                throw new Error(
                  `tesfa backend returned ${res.status}: ${await res.text()}`,
                );
              }

              const { saved } = await res.json();
              ctx.logger.info(
                `Saved ${saved} to the database. It will appear in the catalog within about a minute.`,
              );
            },
          }),
        );
      },
    });
  },
});
