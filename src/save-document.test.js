import test from 'ava';
import nock from 'nock';
import { _delete } from '.';
import saveDocument from './save-document';

const testData = {
  baseURL: 'http://lotr:9200',
  db: 'cool-people',
  document: { id: '123', name: 'Treebeard' },
  idKey: 'id',
  table: 'ent',
  transform: null
};

const elasticsearchCallMock = (uri, requestBody) => {
  const [_index, _type, _id] = uri.slice(1).split('/');
  return { _id, _index, _type };
};

test('saveDocument: upsert a document to Elasticsearch', async t => {
  nock(testData.baseURL)
    .put('/cool-people/ent/123')
    .reply(200, elasticsearchCallMock);

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
    .reply(200, elasticsearchCallMock);

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

test('saveDocument: remove document from Elasticsearch', async t => {
  nock(testData.baseURL)
    .delete('/cool-people/ent/123')
    .reply(200, elasticsearchCallMock);

  const response = await saveDocument({
    ...testData,
    transform: ({ document }) => ({
      ...document,
      _delete
    })
  });

  t.is(response.status, 200);
});

test('saveDocument: default behavior for deleted doc is DELETE', async t => {
  nock(testData.baseURL)
    .delete('/cool-people/ent/123')
    .reply(200, elasticsearchCallMock);

  // no deleteTransform is provided, so since document is null, it should send
  // a DELETE request to ES by default
  const response = await saveDocument({
    ...testData,
    document: null,
    oldDocument: testData.document
  });

  t.is(response.status, 200);
});

test('saveDocument: deleteTransform can return a doc that gets PUT', async t => {
  t.plan(2);
  nock(testData.baseURL)
    .put('/cool-people/ent/123')
    .reply(200, elasticsearchCallMock);

  const response = await saveDocument({
    ...testData,
    deleteTransform({ document, oldDocument }) {
      t.is(document, null);
      return oldDocument;
    },
    document: null,
    oldDocument: testData.document
  });

  t.is(response.status, 200);
});

test('saveDocument: deleteTransform can return a doc that gets DELETEd', async t => {
  t.plan(2);
  nock(testData.baseURL)
    .delete('/cool-people/ent/123')
    .reply(200, elasticsearchCallMock);

  const response = await saveDocument({
    ...testData,
    deleteTransform({ document, oldDocument }) {
      t.is(document, null);
      return {
        ...oldDocument,
        _delete
      };
    },
    document: null,
    oldDocument: testData.document
  });

  t.is(response.status, 200);
});

test('saveDocument: change es type', async t => {
  const esType = 'test';

  nock(testData.baseURL)
    .put(`/cool-people/${esType}/123`)
    .reply(200, elasticsearchCallMock);

  const response = await saveDocument({
    ...testData,
    esType
  });

  const { data } = response;
  t.is(data._type, esType);
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

test('saveDocument: insert array of documents', async t => {
  const arrayTest = {
    ...testData,
    document: [
      {
        id: '233',
        name: 'Test Name 1'
      },
      {
        id: '234',
        name: 'Test Name 2'
      }
    ]
  };
  nock(testData.baseURL)
    .put(/\/cool-people\/ent\/\d{3}/)
    .times(2)
    .reply(200, elasticsearchCallMock);

  const responses = await saveDocument(arrayTest);
  responses.map((response, i) => {
    t.is(response.status, 200);
    const { data } = response;
    t.is(data._index, arrayTest.db);
    t.is(data._type, arrayTest.table);
    t.is(data._id, arrayTest.document[i].id);
  });
});
