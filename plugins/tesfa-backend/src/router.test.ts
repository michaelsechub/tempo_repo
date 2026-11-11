import {
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import { Knex } from 'knex';
import request from 'supertest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CatalogService } from '@backstage/plugin-catalog-node';

import { createRouter } from './router';

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  let catalog: { validateEntity: jest.Mock; getEntitiesByRefs: jest.Mock };
  let db: jest.Mock;
  let ignore: jest.Mock;
  let update: jest.Mock;
  let whereRaw: jest.Mock;
  let andWhere: jest.Mock;

  beforeEach(async () => {
    catalog = {
      validateEntity: jest.fn().mockResolvedValue({ valid: true }),
      // By default every referenced entity exists
      getEntitiesByRefs: jest.fn(async ({ entityRefs }: { entityRefs: string[] }) => ({
        items: entityRefs.map(() => ({ kind: 'Found', metadata: { name: 'x' } })),
      })),
    };
    // Mocks the knex chains:
    //   create: db('entities').insert(...).returning(...).onConflict(...).ignore()
    //   edit:   db('entities').whereRaw(...).andWhere(...).update(...)
    ignore = jest.fn().mockResolvedValue([{ name: 'my-service' }]); // 1 row inserted
    const insert = jest.fn(() => ({
      returning: () => ({ onConflict: () => ({ ignore }) }),
    }));
    update = jest.fn().mockResolvedValue(1); // 1 row updated
    andWhere = jest.fn(() => ({ update }));
    whereRaw = jest.fn(() => ({ andWhere }));
    db = jest.fn(() => ({ insert, whereRaw }));
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      db: db as unknown as Knex,
      catalog: catalog as unknown as CatalogService,
      // Keep test uploads out of the project folder
      filesDir: mkdtempSync(join(tmpdir(), 'tesfa-files-')),
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('POST /entities', () => {
    const entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-service' },
      spec: {
        type: 'service',
        lifecycle: 'experimental',
        owner: 'user:default/tesfa',
        system: 'system:default/system1',
      },
    };

    it('saves an entity the catalog says is valid', async () => {
      catalog.validateEntity.mockResolvedValue({ valid: true });

      const response = await request(app).post('/entities').send(entity);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ saved: 'Component:my-service' });
      expect(catalog.validateEntity).toHaveBeenCalledWith(
        entity,
        'url:tesfa-db',
        expect.objectContaining({ credentials: expect.anything() }),
      );
      expect(catalog.getEntitiesByRefs).toHaveBeenCalledWith(
        expect.objectContaining({
          entityRefs: ['user:default/tesfa', 'system:default/system1'],
        }),
        expect.objectContaining({ credentials: expect.anything() }),
      );
      expect(ignore).toHaveBeenCalled();
    });

    it('refuses to overwrite an entity that already exists', async () => {
      ignore.mockResolvedValue([]); // conflict → nothing inserted

      const response = await request(app).post('/entities').send(entity);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already exists');
    });

    it('rejects an invalid entity and does not save it', async () => {
      catalog.validateEntity.mockResolvedValue({
        valid: false,
        errors: [
          { name: 'InputError', message: 'No processor recognized the entity' },
        ],
      });

      const response = await request(app)
        .post('/entities')
        .send({ ...entity, kind: 'Foo' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain(
        'Invalid entity: No processor recognized the entity',
      );
      expect(db).not.toHaveBeenCalled();
    });

    it('rejects an entity whose owner does not exist', async () => {
      catalog.getEntitiesByRefs.mockResolvedValue({
        items: [undefined, { kind: 'System', metadata: { name: 'system1' } }],
      });

      const response = await request(app).post('/entities').send(entity);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'Referenced entities do not exist in the catalog: spec.owner → user:default/tesfa',
      );
      expect(db).not.toHaveBeenCalled();
    });

    it('lists every missing reference', async () => {
      catalog.getEntitiesByRefs.mockResolvedValue({ items: [undefined, undefined] });

      const response = await request(app).post('/entities').send(entity);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('spec.owner → user:default/tesfa');
      expect(response.body.error.message).toContain('spec.system → system:default/system1');
      expect(db).not.toHaveBeenCalled();
    });

    it('expands short refs using Backstage defaults (owner → Group, system → System)', async () => {
      const response = await request(app)
        .post('/entities')
        .send({ ...entity, spec: { ...entity.spec, owner: 'team-a', system: 'system1' } });

      expect(response.status).toBe(201);
      expect(catalog.getEntitiesByRefs).toHaveBeenCalledWith(
        expect.objectContaining({
          entityRefs: ['group:default/team-a', 'system:default/system1'],
        }),
        expect.anything(),
      );
    });

    it('skips the lookup when there is no owner or system', async () => {
      const { owner, system, ...spec } = entity.spec;

      const response = await request(app).post('/entities').send({ ...entity, spec });

      expect(response.status).toBe(201);
      expect(catalog.getEntitiesByRefs).not.toHaveBeenCalled();
    });

    it('rejects a reference with an invalid format', async () => {
      const response = await request(app)
        .post('/entities')
        .send({ ...entity, spec: { ...entity.spec, owner: 'user:' } });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'spec.owner "user:" is not a valid entity reference',
      );
      expect(db).not.toHaveBeenCalled();
    });
  });

  describe('PUT /entities/:kind/:name', () => {
    const entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-service', description: 'Updated' },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'user:default/tesfa',
        system: 'system:default/system1',
      },
    };

    it('updates the existing row in place (no insert)', async () => {
      const response = await request(app)
        .put('/entities/component/my-service')
        .send(entity);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ saved: 'Component:my-service' });
      // lowercase kind from the entity ref matches the stored "Component"
      expect(whereRaw).toHaveBeenCalledWith('lower(kind) = ?', ['component']);
      expect(andWhere).toHaveBeenCalledWith({ name: 'my-service' });
      expect(update).toHaveBeenCalledWith({
        kind: 'Component',
        name: 'my-service',
        entity: JSON.stringify(entity),
      });
      expect(ignore).not.toHaveBeenCalled();
    });

    it('renames the same row when the name changes', async () => {
      const renamed = { ...entity, metadata: { ...entity.metadata, name: 'new-name' } };

      const response = await request(app)
        .put('/entities/component/my-service')
        .send(renamed);

      expect(response.status).toBe(200);
      expect(andWhere).toHaveBeenCalledWith({ name: 'my-service' });
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'new-name' }));
    });

    it('returns 404 when the entity is not in the database', async () => {
      update.mockResolvedValue(0);

      const response = await request(app)
        .put('/entities/component/missing')
        .send(entity);

      expect(response.status).toBe(404);
    });

    it('returns 409 when renaming onto a name that is taken', async () => {
      update.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

      const response = await request(app)
        .put('/entities/component/my-service')
        .send(entity);

      expect(response.status).toBe(409);
    });

    it('runs the same validation as create', async () => {
      catalog.getEntitiesByRefs.mockResolvedValue({ items: [undefined, {}] });

      const response = await request(app)
        .put('/entities/component/my-service')
        .send(entity);

      expect(response.status).toBe(400);
      expect(db).not.toHaveBeenCalled();
    });
  });
});
