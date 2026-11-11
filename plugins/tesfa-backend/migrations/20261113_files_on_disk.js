// @ts-check

/**
 * PDFs are now stored as files in the folder set by `tesfa.filesDir`
 * (<filesDir>/<id>.pdf). The table only keeps the file's details.
 *
 * Before this ran, existing PDFs were copied out of the `data` column into that folder.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('files', table => {
    table.dropColumn('data');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.alterTable('files', table => {
    table.binary('data');
  });
};
