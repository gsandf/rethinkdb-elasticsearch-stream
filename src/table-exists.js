/**
 * If the given table exists in the RethinkDB instance
 * @param  {String} db    The database containing the table
 * @param  {String} table The name of the table to check
 * @return {Boolean}       If the table exists in the database
 */
async function tableExists({ r, db, table }) {
  const hasDB = await r.dbList().contains(db);

  if (hasDB) {
    return r
      .db(db)
      .tableList()
      .contains(table);
  }

  return false;
}

export default tableExists;
