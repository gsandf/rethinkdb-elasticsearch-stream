import { obj as objectStream } from 'through2';
import saveDocument from './save-document';

/**
* Stream changes from a RethinkDB table into Elasticsearch
* @param  {String}   r         A handle to the RethinkDB driver
* @param  {String}   db        The database in RethinkDB to stream updates from
* @param  {String}   table     The table in RethinkDB to stream updates from
*/
function watchTable(r, { db, table, ...properties }) {
  const dataStream = r
    .db(db)
    .table(table)
    .changes()
    .toStream();

  return dataStream.pipe(
    objectStream(async ({ new_val: chunk }, enc, cb) => {
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
  );
}

export default watchTable;
