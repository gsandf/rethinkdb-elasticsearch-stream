import test from 'ava';
import nock from 'nock';
import backfillTable from './backfill-table';
import elasticsearchPath from './elasticsearch-path';
import { elasticsearch, r } from './test-helpers';

const baseURL = elasticsearch.url;

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

const elasticsearchInsertMock = (uri, requestBody) => {
  const [_index, _type, _id] = uri.slice(1).split('/');
  return { _id, _index, _type };
};

test('backfillTable: copies every row in table', async t => {
  t.plan(3);

  const db = 'backfillTableTest1';
  const table = 'users';

  await r.dbCreate(db);
  await r.db(db).tableCreate(table);
  await r.db(db).table(table).insert(testData);

  const expectedCalls = testData.map(({ id }) =>
    nock(baseURL)
      .put(elasticsearchPath({ db, id, table }))
      .reply(200, elasticsearchInsertMock)
  );

  await backfillTable(r, { baseURL, db, idKey: 'id', table });
  expectedCalls.forEach(call => t.true(call.isDone()));
  await r.dbDrop(db);
});
