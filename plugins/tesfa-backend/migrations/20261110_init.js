
// @ts-check

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('todos', table => {
    table.uuid('id').primary();
    table.string('title').notNullable();
    table.string('entity_ref').nullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('todos');
};
