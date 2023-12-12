/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('user', function(table) {
        table.increments().primary()
        table.string('name', 255).notNullable()
        table.string('email', 255).notNullable()
        table.string('password', 255).notNullable()
        table.timestamp('createdAt').defaultTo(knex.fn.now())
        table.timestamp('updatedAt').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('user')
};
