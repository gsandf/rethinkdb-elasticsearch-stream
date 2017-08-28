import test from 'ava';
import rethinkdbdash from 'rethinkdbdash';
import tableExists from './table-exists';

const rethinkSettings = { host: 'rethinkdb', port: 28015, silent: true };
const r = rethinkdbdash(rethinkSettings);

test('tableExists: true if table exists; false otherwise', async t => {
  const db = 'tableExistsTest1';
  const table = 'fun';

  t.false(await tableExists({ db, r, table }));

  await r.dbCreate(db);
  await r.db(db).tableCreate(table);

  t.true(await tableExists({ db, r, table }));

  await r.dbDrop('tableExistsTest1');
});
