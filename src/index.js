import axios from 'axios';
import rethinkdbdash from 'rethinkdbdash';
import { obj as objectStream } from 'through2';
import defaultOptions from './defaultOptions';
import ensureTables from './ensure-tables';
import urlString from './url-string';

// The base URL for the Elasticsearch server
let elasticsearchBaseUrl;
// A handle to the RethinkDB driver instance
let r;

async function init(extraOptions) {
  const options = {
    ...defaultOptions,
    ...extraOptions
  };

  elasticsearchBaseUrl = urlString(options.elasticsearch);
  r = rethinkdbdash(options.rethinkdb);

  try {
    ensureConnections(options.elasticsearch);
    await ensureTables(r, options.tables);
  } catch (e) {
    console.error(e.message);
    return cleanup();
  }

  if (options.watch) {
    options.tables.forEach(watchTable);
  }

  if (options.backfill) {
    options.tables.forEach(backfillTable);
  }

  // If nothing is to be done, cleanup connections and exit
  if (!options.watch && !options.backfill) {
    cleanup();
  }
}

/**
 * Fill an Elasticsearch type with the contents of a RethinkDB table
 * @param  {String}   db        The database in RethinkDB to duplicate
 * @param  {String}   table     The table in RethinkDB to duplicate
 * @param  {Function} transform (optional) A function to transform the document before storage in Elasticsearch
 */
async function backfillTable({ db, table, transform }) {
  const dataStream = r.db(db).table(table).toStream();

  dataStream.pipe(
    objectStream((chunk, enc, cb) => {
      saveDocument({ db, document: chunk, table, transform });
      cb();
    })
  );
}

async function cleanup() {
  return r.getPoolMaster().drain();
}

/**
 * Make sure a connection can be made to the services needed.
 */
async function ensureConnections() {
  // `rethinkdbdash` hanldes RethinkDB's connection pools, so we're ignoring that for now
  const elasticsearchResponse = await axios.get(elasticsearchBaseUrl);
  const elasticsearchHealthy =
    typeof elasticsearchResponse.data.cluster_uuid === 'string';
  return elasticsearchHealthy;
}

/**
 * Replicate a document in Elasticsearch
 * @param  {String}   db        The database in RethinkDB the document resides in (used as Elasticsearch index)
 * @param  {Object}   document  The document to save.  This may be transformed by `transform`.
 * @param  {String}   table     The table in RethinkDB the document resides in (used as Elasticsearch type)
 * @param  {Function} transform (optional) A function to transform the document before storage in Elasticsearch
 */
function saveDocument({ db, document, table, transform }) {
  // Transform the document if necessary
  const documentToSave =
    typeof transform === 'function'
      ? transform({ db, document, table })
      : document;

  if (documentToSave == null) return;
  // TODO: save document to Elasticsearch

  axios.post(`/${db}/${table}`, documentToSave, {
    baseURL: elasticsearchBaseUrl
  });
}

/**
* Stream changes from a RethinkDB table into Elasticsearch
* @param  {String}   db        The database in RethinkDB to stream updates from
* @param  {String}   table     The table in RethinkDB to stream updates from
* @param  {Function} transform (optional) A function to transform the document before storage in Elasticsearch
*/
async function watchTable({ db, table, transform }) {
  const dataStream = r.db(db).table(table).changes().toStream();

  dataStream.pipe(
    objectStream(({ new_val: chunk }, enc, cb) => {
      saveDocument({ db, document: chunk, table, transform });
      cb();
    })
  );
}

export default init;
