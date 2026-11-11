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
import { Entity } from '@backstage/catalog-model';

const PROVIDER_NAME = 'tesfa-db';

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
      },
      async init({ catalog, scheduler, discovery, auth, logger }) {
        const provider = new TesfaEntityProvider(discovery, auth, logger);
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
