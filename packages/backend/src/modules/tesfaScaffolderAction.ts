import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  createTemplateAction,
  scaffolderActionsExtensionPoint,
} from '@backstage/plugin-scaffolder-node';
import { parseEntityRef } from '@backstage/catalog-model';

/**
 * Scaffolder actions:
 * - `tesfa:entity:save`   creates a new entity row in the `tesfa.entities` table.
 * - `tesfa:entity:update` edits an existing row in place (used by the edit template).
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
          createTemplateAction({
            id: 'tesfa:entity:update',
            description:
              'Updates an existing catalog entity in the tesfa database (same row, no duplicate)',
            schema: {
              input: {
                entityRef: z =>
                  z
                    .string()
                    .describe('The entity being edited, e.g. component:default/my-service'),
                entity: z =>
                  z
                    .record(z.any())
                    .describe('The new version of the entity (apiVersion, kind, metadata, spec)'),
              },
            },
            async handler(ctx) {
              const { kind, name } = parseEntityRef(ctx.input.entityRef);
              const baseUrl = await discovery.getBaseUrl('tesfa');
              const { token } = await auth.getPluginRequestToken({
                onBehalfOf: await ctx.getInitiatorCredentials(),
                targetPluginId: 'tesfa',
              });

              const res = await fetch(
                `${baseUrl}/entities/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(ctx.input.entity),
                },
              );
              if (!res.ok) {
                throw new Error(
                  `tesfa backend returned ${res.status}: ${await res.text()}`,
                );
              }

              const { saved } = await res.json();
              ctx.logger.info(
                `Updated ${saved} in the database. The catalog shows the change within about a minute.`,
              );
            },
          }),
          createTemplateAction({
            id: 'tesfa:file:upload',
            description:
              'Uploads a PDF (from a `format: data-url` form field) to the tesfa backend and returns its link',
            schema: {
              input: {
                file: z =>
                  z
                    .string()
                    .describe('The file as a data URL, e.g. data:application/pdf;name=x.pdf;base64,...'),
              },
              output: {
                url: z => z.string().describe('Link that opens the PDF in the browser'),
                name: z => z.string().describe('The stored file name'),
              },
            },
            async handler(ctx) {
              const baseUrl = await discovery.getBaseUrl('tesfa');
              const { token } = await auth.getPluginRequestToken({
                onBehalfOf: await ctx.getInitiatorCredentials(),
                targetPluginId: 'tesfa',
              });

              const res = await fetch(`${baseUrl}/files`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dataUrl: ctx.input.file }),
              });
              if (!res.ok) {
                throw new Error(
                  `tesfa backend returned ${res.status}: ${await res.text()}`,
                );
              }

              const { name, path } = await res.json();
              // Browser-facing address, e.g. http://localhost:7007/api/tesfa/files/<id>/<name>
              const url = `${await discovery.getExternalBaseUrl('tesfa')}${path}`;
              ctx.logger.info(`Uploaded ${name}: ${url}`);
              ctx.output('url', url);
              ctx.output('name', name);
            },
          }),
          createTemplateAction({
            id: 'tesfa:entity:delete',
            description: 'Deletes an entity from the tesfa database',
            schema: {
              input: {
                entityRef: z =>
                  z
                    .string()
                    .describe('The entity to delete, e.g. system:default/payments-core'),
              },
            },
            async handler(ctx) {
              const { kind, name } = parseEntityRef(ctx.input.entityRef);
              const baseUrl = await discovery.getBaseUrl('tesfa');
              const { token } = await auth.getPluginRequestToken({
                onBehalfOf: await ctx.getInitiatorCredentials(),
                targetPluginId: 'tesfa',
              });

              const res = await fetch(
                `${baseUrl}/entities/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (!res.ok) {
                throw new Error(
                  `tesfa backend returned ${res.status}: ${await res.text()}`,
                );
              }

              const { deleted } = await res.json();
              ctx.logger.info(
                `Deleted ${deleted} from the database. It leaves the catalog within about a minute.`,
              );
            },
          }),
        );
      },
    });
  },
});
