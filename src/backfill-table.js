import { obj as objectStream } from 'through2';
import saveDocument from './save-document';

/**
 * Fill an Elasticsearch type with the contents of a RethinkDB table
 * @param  {String}   r         A handle to the RethinkDB driver
 * @param  {String}   db        The database in RethinkDB to duplicate
 * @param  {String}   table     The table in RethinkDB to duplicate
 */
function backfillTable(r, { db, table, ...properties }) {
  return new Promise((resolve, reject) => {
    const dataStream = r
      .db(db)
      .table(table)
      .toStream();

    dataStream
      .pipe(
        objectStream(async (chunk, enc, cb) => {
          try {
            await saveDocument({
              db,
              document: chunk,
              table,
              ...properties
            });
          } catch (e) {
            cb(e);
          }

          cb();
        })
      )
      .on('error', reject)
      .on('finish', resolve);
  });
}

export default backfillTable;
