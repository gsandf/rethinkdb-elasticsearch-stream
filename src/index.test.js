import axios from 'axios';
import elasticsearchPath from './elasticsearch-path';
import test from 'ava';
import retry from 'p-retry';
import defaultOptions from './defaultOptions';
import { data as testData, elasticsearch, r, rethinkdb } from './test-helpers';
import elasticsearchStream from '.';

const options = {
  ...defaultOptions,
  elasticsearch,
  rethinkdb
};

const elasticsearchSource = async tableInfo => {
  const path = elasticsearchPath({
    ...tableInfo,
    id: tableInfo.document[tableInfo.idKey]
  });

  const response = await axios.get(path, { baseURL: elasticsearch.url });
  return response.data._source;
};

test.before(async () => {
  // Ensure the Elasticsearch container is ready
  const retries = 5;
  await retry(
    async attempt => {
      console.log(`Connecting to Elasticsearch (try ${attempt}/${retries})`);
      return axios.get(elasticsearch.url);
    },
    { retries }
  );
});

test('if nothing provided to do, just verifies a connection to the databases', async t => {
  const doNothingOptions = {
    ...options,
    backfill: false,
    watch: false
  };

  await elasticsearchStream(doNothingOptions);

  t.pass();

  const noESOptions = {
    ...doNothingOptions,
    elasticsearch: { ...elasticsearch, host: 'nonexistent-host' }
  };

  await t.throws(elasticsearchStream(noESOptions));
});

test('can backfill tables from RethinkDB to elasticsearch', async t => {
  const dbPrefix = 'index_test_js_db';
  const tableName = 't1';

  const testTableInfo = [
    {
      db: `${dbPrefix}_1`,
      idKey: 'id',
      table: tableName
    },
    {
      db: `${dbPrefix}_2`,
      idKey: 'uid',
      table: tableName,
      transform: ({ document }) => ({ ...document, didTransform: true })
    }
  ];

  // Prepopulate tables...
  const [db1, db2] = testTableInfo.map(t => t.db);
  await r.dbCreate(db1);
  await r.dbCreate(db2);
  await r.db(db1).tableCreate(tableName);
  await r.db(db2).tableCreate(tableName);
  await r.db(db1).table(tableName).insert(testData[0]);
  await r.db(db2).table(tableName).insert(testData[1]);

  await elasticsearchStream({
    ...options,
    tables: testTableInfo,
    watch: false
  });

  const tests = testTableInfo.reduce(
    (accum, testInfo, i) => [
      ...accum,
      ...testData[i].map(document => ({
        baseURL: elasticsearch.url,
        document,
        ...testInfo
      }))
    ],
    []
  );

  const storedData = await r
    .db(db1)
    .table(tableName)
    .union(r.db(db2).table(tableName));

  const expectedData = tests.map(
    t =>
      t.transform
        ? t.transform({
          ...t,
          document: storedData.find(s => s[t.idKey] === t.document[t.idKey])
        })
        : t.document
  );

  const actualData = await Promise.all(tests.map(elasticsearchSource));

  t.deepEqual(expectedData, actualData);
});
