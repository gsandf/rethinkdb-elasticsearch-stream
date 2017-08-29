import { obj as objectStream } from 'through2';
import saveDocument from './save-document';

/**
 * Fill an Elasticsearch type with the contents of a RethinkDB table
 * @param  {String}   db        The database in RethinkDB to duplicate
 * @param  {String}   table     The table in RethinkDB to duplicate
 * @param  {Function} transform (optional) A function to transform the document before storage in Elasticsearch
 */
function backfillTable(r, { db, table, transform }) {
  const dataStream = r.db(db).table(table).toStream();

  dataStream.pipe(
    objectStream((chunk, enc, cb) => {
      saveDocument({ db, document: chunk, table, transform });
      cb();
    })
  );
}

export default backfillTable;
