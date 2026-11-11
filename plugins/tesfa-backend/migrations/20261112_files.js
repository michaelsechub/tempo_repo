// @ts-check

/**
 * Stores PDF files uploaded from the "Manage a …" templates.
 * Entities link to them as /api/tesfa/files/<id>/<name>.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('files', table => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('content_type').notNullable();
    table.integer('size').notNullable();
    table.binary('data').notNullable();
    table.string('created_by').notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('files');
};
