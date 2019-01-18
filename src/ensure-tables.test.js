import test from 'ava';
import ensureTables from './ensure-tables';
import { r } from './test-helpers';

test('ensureTables ensures tables are correct format', async t => {
  await t.throwsAsync(ensureTables(), TypeError);
  await t.throwsAsync(ensureTables(r), TypeError);
});

test('ensureTables ensures tables exist', async t => {
  const db = 'ensureTables1';
  const tables = [{ db, table: 'testTable1' }, { db, table: 'testTable2' }];

  // Tables do not exist yet
  await t.throwsAsync(ensureTables(r, tables));

  await r.dbCreate(db);

  await r.db(db).tableCreate('testTable1');

  // One table still doesn't exist
  await t.throwsAsync(ensureTables(r, tables));

  await r.db(db).tableCreate('testTable2');

  // Ensuring tables should be fine now
  t.is(await ensureTables(r, tables), undefined);

  await r.dbDrop(db);
});
