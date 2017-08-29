import test from 'ava';
import rethinkdbdash from 'rethinkdbdash';
import ensureTables from './ensure-tables';

const rethinkSettings = { host: 'rethinkdb', port: 28015, silent: true };
const r = rethinkdbdash(rethinkSettings);

test('ensureTables ensures tables are correct format', async t => {
  await t.throws(ensureTables(), TypeError);
  await t.throws(ensureTables(r), TypeError);
});

test('ensureTables ensures tables exist', async t => {
  const db = 'ensureTables1';
  const tables = [{ db, table: 'testTable1' }, { db, table: 'testTable2' }];

  // Tables do not exist yet
  await t.throws(ensureTables(r, tables));

  await r.dbCreate('ensureTables1');

  await r.db(db).tableCreate('testTable1');

  // One table still doesn't exist
  await t.throws(ensureTables(r, tables));

  await r.db(db).tableCreate('testTable2');

  // Ensuring tables should be fine now
  t.is(await ensureTables(r, tables), undefined);
});
