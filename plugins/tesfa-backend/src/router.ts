import {
  BackstageCredentials,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import { ConflictError, InputError, NotFoundError } from '@backstage/errors';
import { z } from 'zod/v3';
import express from 'express';
import Router from 'express-promise-router';
import { Knex } from 'knex';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { todoListServiceRef } from './services/TodoListService';

// Location ref the catalog uses when validating entities stored by this plugin
const VALIDATION_LOCATION_REF = 'url:tesfa-db';

// spec fields that must point to entities that already exist in the catalog.
// defaultKind is the Backstage convention when the value has no kind, e.g. `owner: team-a`.
const REQUIRED_REFERENCES = [
  { field: 'owner', defaultKind: 'Group' },
  { field: 'system', defaultKind: 'System' },
] as const;

/** Reads spec.owner / spec.system (when present) as full refs like `user:default/tesfa`. */
function collectReferences(entity: any): { field: string; ref: string }[] {
  const defaultNamespace = entity.metadata?.namespace ?? 'default';

  return REQUIRED_REFERENCES.flatMap(({ field, defaultKind }) => {
    const value = entity.spec?.[field];
    if (value === undefined || value === null || value === '') {
      return [];
    }
    if (typeof value !== 'string') {
      throw new InputError(`spec.${field} must be a string entity reference`);
    }
    try {
      const ref = stringifyEntityRef(
        parseEntityRef(value, { defaultKind, defaultNamespace }),
      );
      return [{ field, ref }];
    } catch {
      throw new InputError(
        `spec.${field} "${value}" is not a valid entity reference`,
      );
    }
  });
}

export async function createRouter({
  httpAuth,
  todoList,
  db,
  catalog,
}: {
  httpAuth: HttpAuthService;
  todoList: typeof todoListServiceRef.T;
  db: Knex;
  catalog: CatalogService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Checks used by both create and edit: the body is a valid entity and its
  // owner/system exist in the catalog. Throws an InputError (400) otherwise.
  async function checkEntity(entity: any, credentials: BackstageCredentials) {
    if (!entity?.kind || !entity?.metadata?.name) {
      throw new InputError(
        'Body must be an entity with "kind" and "metadata.name"',
      );
    }

    // Ask the catalog to check the entity with its own rules (known kind,
    // valid name, required spec fields...) before anything is saved.
    const validation = await catalog.validateEntity(
      entity,
      VALIDATION_LOCATION_REF,
      { credentials },
    );
    if (!validation.valid) {
      const reasons = validation.errors.map(e => e.message).join('; ');
      throw new InputError(`Invalid entity: ${reasons}`);
    }

    // The catalog only checks the *format* of references, so also make sure
    // the owner and system actually exist (one catalog call for both).
    const references = collectReferences(entity);
    if (references.length > 0) {
      const { items } = await catalog.getEntitiesByRefs(
        {
          entityRefs: references.map(r => r.ref),
          fields: ['kind', 'metadata.name'],
        },
        { credentials },
      );
      const missing = references.filter((_, index) => !items[index]);
      if (missing.length > 0) {
        const list = missing.map(m => `spec.${m.field} → ${m.ref}`).join(', ');
        throw new InputError(
          `Referenced entities do not exist in the catalog: ${list}`,
        );
      }
    }
  }

  // Creates one catalog entity. Fails with 409 if it already exists —
  // existing entities are changed with PUT /entities/:kind/:name instead.
  // Called by the `tesfa:entity:save` scaffolder action on behalf of the user.
  router.post('/entities', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const entity = req.body;
    await checkEntity(entity, credentials);

    const inserted = await db('entities')
      .insert({
        kind: entity.kind,
        name: entity.metadata.name,
        entity: JSON.stringify(entity),
        created_by: credentials.principal.userEntityRef,
      })
      .returning('name')
      .onConflict(['kind', 'name'])
      .ignore();
    if (inserted.length === 0) {
      throw new ConflictError(
        `${entity.kind}:${entity.metadata.name} already exists. Use "Manage a ${entity.kind} (database)" → Edit to change it.`,
      );
    }

    res.status(201).json({ saved: `${entity.kind}:${entity.metadata.name}` });
  });

  // Edits an existing entity in place — never inserts a new row.
  // :kind/:name identify the row being edited; the body is the new version
  // (it may have a new name, in which case the same row is renamed).
  // Called by the `tesfa:entity:update` scaffolder action on behalf of the user.
  router.put('/entities/:kind/:name', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const entity = req.body;
    await checkEntity(entity, credentials);

    let updated: number;
    try {
      updated = await db('entities')
        // Entity refs use lowercase kinds (component:default/x); the table stores "Component"
        .whereRaw('lower(kind) = ?', [req.params.kind.toLowerCase()])
        .andWhere({ name: req.params.name })
        .update({
          kind: entity.kind,
          name: entity.metadata.name,
          entity: JSON.stringify(entity),
        });
    } catch (e: any) {
      // 23505 = unique violation: renamed onto a name that is already taken
      if (e?.code === '23505') {
        throw new ConflictError(
          `${entity.kind}:${entity.metadata.name} already exists`,
        );
      }
      throw e;
    }
    if (updated === 0) {
      throw new NotFoundError(
        `${req.params.kind}:${req.params.name} is not in the database`,
      );
    }

    res.json({ saved: `${entity.kind}:${entity.metadata.name}` });
  });

  // Deletes one entity row. The provider's next run (within a minute) removes
  // it from the catalog. Refuses while other entities still belong to it
  // (components/APIs in a system, systems in a domain).
  // Called by the `tesfa:entity:delete` scaffolder action on behalf of the user.
  router.delete('/entities/:kind/:name', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const kind = req.params.kind.toLowerCase();
    const { name } = req.params;
    const ref = `${kind}:default/${name}`;

    const { items: children } = await catalog.getEntities(
      {
        filter: { 'relations.partOf': ref },
        fields: ['kind', 'metadata.name'],
      },
      { credentials },
    );
    if (children.length > 0) {
      const list = children
        .map(c => `${c.kind}:${c.metadata.name}`)
        .join(', ');
      throw new ConflictError(
        `${ref} still has entities that belong to it: ${list}. Move or delete them first.`,
      );
    }

    const deleted = await db('entities')
      .whereRaw('lower(kind) = ?', [kind])
      .andWhere({ name })
      .delete();
    if (deleted === 0) {
      throw new NotFoundError(`${ref} is not in the database`);
    }

    res.json({ deleted: ref });
  });

  // Lists all stored entities. Called by the tesfa-db catalog entity provider.
  router.get('/entities', async (_req, res) => {
    const rows = await db('entities').select('entity');
    res.json(rows.map(row => row.entity));
  });

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoList.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoList.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoList.getTodo({ id: req.params.id }));
  });

  return router;
}
