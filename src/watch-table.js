import setupChangefeed from 'rethinkdb-changefeed-reconnect';
import saveDocument from './save-document';

/**
* Stream changes from a RethinkDB table into Elasticsearch
* @param  {String}   r         A handle to the RethinkDB driver
* @param  {String}   db        The database in RethinkDB to stream updates from
* @param  {String}   table     The table in RethinkDB to stream updates from
*/
function watchTable(r, { db, table, ...properties }) {
  setupChangefeed(
    () =>
      r
        .db(db)
        .table(table)
        .changes(),
    ({ new_val: document, old_val: oldDocument }) =>
      saveDocument({ db, document, oldDocument, table, ...properties }),
    err => console.error(err.stack),
    { attemptDelay: 60000, maxAttempts: Infinity, silent: true }
  );
}

export default watchTable;
