const moment = require('moment');

module.exports.seed = async function seed(knex) {
  // Deletes ALL existing entries
  await knex('weeks').del();

  const startOfWeek = moment().startOf('isoWeek');
  const endOfWeek = moment().endOf('isoWeek');

  // Inserts seed entries
  await knex('weeks').insert([
    {
      startDate: startOfWeek.format('YYYY-MM-DD'),
      endDate: endOfWeek.format('YYYY-MM-DD')
    }
  ]);
}