import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import { Knex } from 'knex';
import request from 'supertest';
import { CatalogService } from '@backstage/plugin-catalog-node';

import { createRouter } from './router';
import { todoListServiceRef } from './services/TodoListService';

const mockTodoItem = {
  title: 'Do the thing',
  id: '123',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date().toISOString(),
};

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  let todoList: jest.Mocked<typeof todoListServiceRef.T>;
  let catalog: { validateEntity: jest.Mock; getEntitiesByRefs: jest.Mock };
  let db: jest.Mock;
  let merge: jest.Mock;

  beforeEach(async () => {
    todoList = {
      createTodo: jest.fn(),
      listTodos: jest.fn(),
      getTodo: jest.fn(),
    };
    catalog = {
      validateEntity: jest.fn().mockResolvedValue({ valid: true }),
      // By default every referenced entity exists
      getEntitiesByRefs: jest.fn(async ({ entityRefs }: { entityRefs: string[] }) => ({
        items: entityRefs.map(() => ({ kind: 'Found', metadata: { name: 'x' } })),
      })),
    };
    // Mocks the knex chain: db('entities').insert(...).onConflict(...).merge(...)
    merge = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn(() => ({ onConflict: () => ({ merge }) }));
    db = jest.fn(() => ({ insert }));
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      todoList,
      db: db as unknown as Knex,
      catalog: catalog as unknown as CatalogService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a TODO', async () => {
    todoList.createTodo.mockResolvedValue(mockTodoItem);

    const response = await request(app).post('/todos').send({
      title: 'Do the thing',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTodoItem);
  });

  it('should not allow unauthenticated requests to create a TODO', async () => {
    todoList.createTodo.mockResolvedValue(mockTodoItem);

    // TEMPLATE NOTE:
    // The HttpAuth mock service considers all requests to be authenticated as a
    // mock user by default. In order to test other cases we need to explicitly
    // pass an authorization header with mock credentials.
    const response = await request(app)
      .post('/todos')
      .set('Authorization', mockCredentials.none.header())
      .send({
        title: 'Do the thing',
      });

    expect(response.status).toBe(401);
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
      expect(merge).toHaveBeenCalled();
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
});
