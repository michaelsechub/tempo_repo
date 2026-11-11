import {
  AuthService,
  coreServices,
  createBackendModule,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';

const PROVIDER_NAME = 'tesfa-db';

/**
 * Link to the "Edit a Component (database)" template, pre-filled with the
 * entity's current values. Shown as the pencil icon on the entity's About card.
 */
function buildEditUrl(appBaseUrl: string, entity: Entity): string {
  const spec: any = entity.spec ?? {};
  const formData = {
    component: stringifyEntityRef(entity),
    name: entity.metadata.name,
    description: entity.metadata.description ?? '',
    type: spec.type,
    lifecycle: spec.lifecycle,
    owner: spec.owner,
    system: spec.system,
    providesApis: spec.providesApis ?? [],
    consumesApis: spec.consumesApis ?? [],
    dependsOn: spec.dependsOn ?? [],
  };
  return `${appBaseUrl}/create/templates/default/edit-component-db?formData=${encodeURIComponent(
    JSON.stringify(formData),
  )}`;
}

/**
 * Database → catalog: reads all entities from the tesfa backend and
 * gives them to the catalog. Uses a "full" mutation, so rows deleted
 * from the database are also removed from the catalog.
 */
class TesfaEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly appBaseUrl: string,
  ) {}

  getProviderName() {
    return PROVIDER_NAME;
  }

  async connect(connection: EntityProviderConnection) {
    this.connection = connection;
  }

  async run() {
    if (!this.connection) {
      return;
    }

    const baseUrl = await this.discovery.getBaseUrl('tesfa');
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'tesfa',
    });

    const res = await fetch(`${baseUrl}/entities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`tesfa backend returned ${res.status}: ${await res.text()}`);
    }
    const entities: Entity[] = await res.json();

    // Tells the catalog where these entities came from
    const location = `url:${baseUrl}/entities`;

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        locationKey: PROVIDER_NAME,
        entity: {
          ...entity,
          metadata: {
            ...entity.metadata,
            annotations: {
              ...entity.metadata.annotations,
              'backstage.io/managed-by-location': location,
              'backstage.io/managed-by-origin-location': location,
              // Lets the edit template's picker show only database entities
              'tesfa.io/source': 'database',
              ...(entity.kind === 'Component'
                ? { 'backstage.io/edit-url': buildEditUrl(this.appBaseUrl, entity) }
                : {}),
            },
          },
        },
      })),
    });

    this.logger.info(`Sent ${entities.length} entities from the database to the catalog`);
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'tesfa-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        scheduler: coreServices.scheduler,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ catalog, scheduler, discovery, auth, logger, config }) {
        const provider = new TesfaEntityProvider(
          discovery,
          auth,
          logger,
          config.getString('app.baseUrl'),
        );
        catalog.addEntityProvider(provider);

        await scheduler.scheduleTask({
          id: 'tesfa-db-provider-refresh',
          frequency: { minutes: 1 },
          timeout: { minutes: 1 },
          fn: () => provider.run(),
        });
      },
    });
  },
});
