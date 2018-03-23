import axios from 'axios';
import elasticsearchPath from './elasticsearch-path';
import { _delete } from '.';

/**
 * Replicate a document in Elasticsearch
 * @param  {String}   db        The database in RethinkDB the document resides in (used as Elasticsearch index)
 * @param  {Object}   document  The document to save.  This may be transformed by `transform`.
 * @param  {String}   esType    The Elasticsearch type where the document will be stored (defaults to RethinkDB table name)
 * @param  {String}   table     The table in RethinkDB the document resides in (used as Elasticsearch type)
 * @param  {Function} transform (optional) A function or promise to transform the document before storage in Elasticsearch
 */
async function saveDocument({
  baseURL,
  db,
  deleteTransform,
  document,
  esType,
  idKey,
  oldDocument,
  table,
  transform
}) {
  let documentToSave;

  // document will be null if the doc was deleted in Rethink
  if (document === null) {
    documentToSave =
      deleteTransform != null
        ? await deleteTransform({ db, document, oldDocument, table })
        // if a deleteTransform isn't provided, the default behavior is to just
        // delete the document from elastic search
        : {
          ...oldDocument,
          _delete
        };
  } else {
    documentToSave =
      transform != null
        ? await transform({ db, document, oldDocument, table })
        : document;
  }

  if (Array.isArray(documentToSave)) {
    return Promise.all(
      documentToSave.map(d =>
        pushDocument(baseURL, db, d, idKey, esType || table)
      )
    );
  }
  return pushDocument(baseURL, db, documentToSave, idKey, esType || table);
}

function pushDocument(baseURL, db, doc, idKey, table) {
  if (doc == null) return;
  if (Object.keys(doc).length === 0) return;

  const path = elasticsearchPath({
    db,
    id: idKey ? doc[idKey] : null,
    table
  });

  if (doc._delete === _delete) {
    return axios.delete(path, { baseURL });
  }

  if (idKey) {
    return axios.put(path, doc, { baseURL });
  }

  return axios.post(path, doc, { baseURL });
}

export default saveDocument;
