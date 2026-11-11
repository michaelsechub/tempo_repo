// @ts-check

/**
 * Stores catalog entities submitted from the "Register a Component (database)" form.
 * The catalog reads this table through the tesfa-db entity provider.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('entities', table => {
    table.string('kind').notNullable();
    table.string('name').notNullable();
    table.jsonb('entity').notNullable();
    table.string('created_by').notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.primary(['kind', 'name']);
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('entities');
};
