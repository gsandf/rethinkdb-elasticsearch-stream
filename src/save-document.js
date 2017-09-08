import axios from 'axios';
import elasticsearchPath from './elasticsearch-path';

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
  document,
  esType,
  idKey,
  table,
  transform
}) {
  // Transform the document if necessary
  const documentToSave =
    transform != null ? await transform({ db, document, table }) : document;

  if (documentToSave == null) return;
  if (Object.keys(documentToSave).length === 0) return;

  const path = elasticsearchPath({
    db,
    id: idKey ? documentToSave[idKey] : null,
    table: esType || table
  });

  if (idKey) {
    return axios.put(path, documentToSave, { baseURL });
  }

  return axios.post(path, documentToSave, { baseURL });
}

export default saveDocument;
