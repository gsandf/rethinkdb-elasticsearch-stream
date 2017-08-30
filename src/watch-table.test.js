import test from 'ava';
import nock from 'nock';
import rethinkdbdash from 'rethinkdbdash';
import watchTable from './watch-table';
import elasticsearchPath from './elasticsearch-path';
import { rethinkdb as rethinkSettings } from './test-helpers';

const r = rethinkdbdash(rethinkSettings);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const baseURL = 'http://elastic:9200';

const testData = [
  {
    id: 1,
    name: 'Ernesto Muller',
    username: 'Carter_Hammes70'
  },
  {
    id: 2,
    name: 'Johnson Bashirian',
    username: 'Gage57'
  },
  {
    id: 3,
    name: "Mr. Rhea O'Hara",
    username: 'Eloy.Spencer'
  }
];

test('watchTable: copies every row in table', async t => {
  t.plan(4);

  const db = 'watchTableTest1';
  const table = 'users';

  await r.dbCreate(db);
  await r.db(db).tableCreate(table);

  const expectedCalls = testData.map(({ id }) =>
    nock(baseURL)
      .put(elasticsearchPath({ db, id, table }))
      .reply(200, () => t.pass())
  );

  watchTable(r, { baseURL, db, idKey: 'id', table });

  await delay(200);
  await r.db(db).table(table).insert(testData);

  await delay(100);
  t.true(expectedCalls.every(call => call.isDone()));
});
