import axios from 'axios';
import rethinkdbdash from 'rethinkdbdash';
import progressBar from 'ts-progress';
import { obj as objectStream } from 'through2';
import defaultOptions from './defaultOptions';

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
    await ensureTables(options.tables);
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
  const expectedLength = await r.db(db).table(table).count();
  const dataStream = r.db(db).table(table).toStream();
  const progress = progressBar.create({
    pattern: '{percent} {bar} | Elapsed: {elapsed} | ETA: {remaining}',
    title: `Backfilling ${table}:${db}`,
    total: expectedLength
  });

  dataStream.pipe(
    objectStream((chunk, enc, cb) => {
      saveDocument({ db, document: chunk, table, transform });

      progress.update();
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
 * Make sure table options are in the correct format
 */
async function ensureTables(tables) {
  return true;
  // if (!Array.isArray(tables)) {
  //   throw new TypeError('`tables` must be an array of objects.');
  // }
  //
  // const missingTables = tables.filter(async table => !await tableExists(table));
  //
  // if (missingTables.length !== 0) {
  //   const missingTableNames = missingTables
  //     .map(({ db, table }) => `${db}:${table}`)
  //     .join(', ');
  //
  //   throw new Error(`Table(s) ${missingTableNames} could not be found.`);
  // }
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
  // const documentToSave =
  //   typeof transform === 'function'
  //     ? transform({ db, document, table })
  //     : document;
  //
  // if (documentToSave == null) return;
  // TODO: save document to Elasticsearch
  //
  // axios.post(`/${db}/${table}`, documentToSave, {
  //   baseURL: elasticsearchBaseUrl
  // });
}

/**
 * If the given table exists in the RethinkDB instance
 * @param  {String} db    The database containing the table
 * @param  {String} table The name of the table to check
 * @return {Boolean}       If the table exists in the database
 */
// async function tableExists({ db, table }) {
//   return r.db(db).tableList().contains(table);
// }

/**
 * Utility to create a URL string from an object representing parts of a URL
 */
function urlString({ host, port, protocol = 'http' }) {
  return `${protocol}://${host}:${port}`;
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
