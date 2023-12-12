/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('stock', function(table) {
        table.increments().primary()
        table.dateTime('period').notNullable()
        table.string('name', 255).notNullable()
        table.integer('price', 255).notNullable()
        table.integer('high', 255).notNullable()
        table.integer('low', 255).notNullable()
        table.integer('open',255).notNullable()
        table.integer('close', 255).notNullable()
        table.timestamp('createdAt').defaultTo(knex.fn.now())
        table.timestamp('updatedAt').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('stock')
};
