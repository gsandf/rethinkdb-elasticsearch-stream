import test from 'ava';
import tableExists from './table-exists';
import { r } from './test-helpers';

test('tableExists: true if table exists; false otherwise', async t => {
  const db = 'tableExistsTest1';
  const table = 'fun';

  t.false(await tableExists({ db, r, table }));

  await r.dbCreate(db);
  await r.db(db).tableCreate(table);

  t.true(await tableExists({ db, r, table }));

  await r.dbDrop('tableExistsTest1');
});
