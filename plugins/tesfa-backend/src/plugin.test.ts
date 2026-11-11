import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { tesfaPlugin } from './plugin';

// Integration test: starts the plugin with a real (in-memory) database,
// so the migrations and routes are exercised end-to-end.
describe('plugin', () => {
  it('runs the migrations and lists stored entities', async () => {
    const { server } = await startTestBackend({
      features: [
        tesfaPlugin,
        catalogServiceMock.factory(),
        mockServices.rootConfig.factory({
          data: { tesfa: { filesDir: mkdtempSync(join(tmpdir(), 'tesfa-files-')) } },
        }),
      ],
    });

    await request(server).get('/api/tesfa/entities').expect(200, []);
  });

  it('returns 404 for an unknown file', async () => {
    const { server } = await startTestBackend({
      features: [
        tesfaPlugin,
        catalogServiceMock.factory(),
        mockServices.rootConfig.factory({
          data: { tesfa: { filesDir: mkdtempSync(join(tmpdir(), 'tesfa-files-')) } },
        }),
      ],
    });

    await request(server)
      .get('/api/tesfa/files/00000000-0000-0000-0000-000000000000/x.pdf')
      .expect(404);
  });
});
