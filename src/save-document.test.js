import test from 'ava';
import nock from 'nock';
import saveDocument from './save-document';

const testData = {
  baseURL: 'http://lotr:9200',
  db: 'cool-people',
  document: { id: '123', name: 'Treebeard' },
  idKey: 'id',
  table: 'ent',
  transform: null
};

const elasticsearchInsertMock = (uri, requestBody) => {
  const [_index, _type, _id] = uri.slice(1).split('/');
  return { _id, _index, _type };
};

test('saveDocument: upsert a document to Elasticsearch', async t => {
  nock(testData.baseURL)
    .put('/cool-people/ent/123')
    .reply(200, elasticsearchInsertMock);

  const response = await saveDocument(testData);
  t.is(response.status, 200);

  const { data } = response;
  t.is(data._index, testData.db);
  t.is(data._type, testData.table);
  t.is(data._id, testData.document.id);
});

test('saveDocument: insert a document without an id', async t => {
  nock(testData.baseURL)
    .post('/cool-people/ent')
    .reply(200, elasticsearchInsertMock);

  const newTestData = { ...testData };
  delete newTestData.idKey;

  const response = await saveDocument(newTestData);
  t.is(response.status, 200);

  const { data } = response;
  t.is(data._index, testData.db);
  t.is(data._type, testData.table);
});

test('saveDocument: transform document before saving', async t => {
  const extraDocumentInfo = {
    title: 'Shepherd of the Trees, Oldest of the Ents'
  };

  nock(testData.baseURL)
    .put('/cool-people/ent/123')
    .reply(200, (uri, requestBody) => {
      t.is(JSON.parse(requestBody).title, extraDocumentInfo.title);
    });

  const response = await saveDocument({
    ...testData,
    transform: ({ document }) => ({ ...document, ...extraDocumentInfo })
  });

  t.is(response.status, 200);
});

test('saveDocument: do not save null documents', async t => {
  const response = await saveDocument({
    ...testData,
    transform: ({ document }) => null
  });

  t.falsy(response);
});

test('saveDocument: do not save undefined documents', async t => {
  const response = await saveDocument({
    ...testData,
    transform: ({ document }) => undefined
  });

  t.falsy(response);
});

test('saveDocument: do not save empty documents', async t => {
  const response = await saveDocument({
    ...testData,
    transform: ({ document }) => ({})
  });

  t.falsy(response);
});
