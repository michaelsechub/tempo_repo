/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import crypto from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-plugin-api';

export interface TodoItem {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
}

// TEMPLATE NOTE:
// This is a simple in-memory todo list store. It is recommended to use a
// database to store data in a real application. See the database service
// documentation for more information on how to do this:
// https://backstage.io/docs/backend-system/core-services/database
export class TodoListService {
  readonly #logger: LoggerService;
  readonly #catalog: typeof catalogServiceRef.T;
  readonly #db: Knex;

  static create(options: {
    logger: LoggerService;
    catalog: typeof catalogServiceRef.T;
    db: Knex;
  }) {
    return new TodoListService(options.logger, options.catalog, options.db);
  }

  private constructor(
    logger: LoggerService,
    catalog: typeof catalogServiceRef.T,
    db: Knex,
  ) {
    this.#logger = logger;
    this.#catalog = catalog;
    this.#db = db;
  }

  async createTodo(
    input: {
      title: string;
      entityRef?: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<TodoItem> {
    let title = input.title;

    // TEMPLATE NOTE:
    // A common pattern for Backstage plugins is to pass an entity reference
    // from the frontend to then fetch the entire entity from the catalog in the
    // backend plugin.
    if (input.entityRef) {
      // TEMPLATE NOTE:
      // Cross-plugin communication uses service-to-service authentication. The
      // `AuthService` lets you generate a token that is valid for communication
      // with the target plugin only. You must also provide credentials for the
      // identity that you are making the request on behalf of.
      //
      // If you want to make a request using the plugin backend's own identity,
      // you can access it via the `auth.getOwnServiceCredentials()` method.
      // Beware that this bypasses any user permission checks.
      const entity = await this.#catalog.getEntityByRef(
        input.entityRef,
        options,
      );
      if (!entity) {
        throw new NotFoundError(`No entity found for ref '${input.entityRef}'`);
      }

      // TEMPLATE NOTE:
      // Here you could read any form of data from the entity. A common use case
      // is to read the value of a custom annotation for your plugin. You can
      // read more about how to add custom annotations here:
      // https://backstage.io/docs/features/software-catalog/extending-the-model#adding-a-new-annotation
      //
      // In this example we just use the entity title to decorate the todo item.

      const entityDisplay = entity.metadata.title ?? input.entityRef;
      title = `[${entityDisplay}] ${input.title}`;
    }

    const id = crypto.randomUUID();
    const createdBy = options.credentials.principal.userEntityRef;
    const newTodo = {
      title,
      id,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await this.#db('todos').insert({
      id: newTodo.id,
      title: newTodo.title,
      entity_ref: input.entityRef ?? null,
      created_by: newTodo.createdBy,
      created_at: newTodo.createdAt,
    });

    // TEMPLATE NOTE:
    // The second argument of the logger methods can be used to pass
    // structured metadata. You can read more about the logger service here:
    // https://backstage.io/docs/backend-system/core-services/logger
    this.#logger.info('Created new todo item', { id, title, createdBy });

    return newTodo;
  }

  async listTodos(): Promise<{ items: TodoItem[] }> {
    const rows = await this.#db('todos').select().orderBy('created_at', 'desc');
    return { items: rows.map(toTodoItem) };
  }

  async getTodo(request: { id: string }): Promise<TodoItem> {
    const row = await this.#db('todos').where({ id: request.id }).first();
    if (!row) {
      throw new NotFoundError(`No todo found with id '${request.id}'`);
    }
    return toTodoItem(row);
  }
}

// Converts a database row (snake_case) to the API shape (camelCase)
function toTodoItem(row: any): TodoItem {
  return {
    id: row.id,
    title: row.title,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export const todoListServiceRef = createServiceRef<Expand<TodoListService>>({
  // id: 'tesfa.todo-list',
  id:'todo.list',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        catalog: catalogServiceRef,
        database: coreServices.database,
      },
      async factory({ logger, catalog, database }) {
        const db = await database.getClient();

        if (!database.migrations?.skip) {
          await db.migrate.latest({
            directory: resolvePackagePath(
              '@internal/backstage-plugin-tesfa-backend',
              'migrations',
            ),
          });
        }

        return TodoListService.create({ logger, catalog, db });
      },
    }),
});
