import tableExists from './table-exists';

const getTableExists = async (r, { db, table }) => ({
  exists: await tableExists({ db, r, table }),
  name: `${db}:${table}`
});

/**
 * Make sure table options are in the correct format
 */
async function ensureTables(r, tables) {
  if (!Array.isArray(tables)) {
    throw new TypeError('`tables` must be an array of objects.');
  }

  const existingTables = await Promise.all(
    tables.map(table => getTableExists(r, table))
  );

  const missingTables = existingTables.filter(table => !table.exists);

  if (missingTables.length !== 0) {
    const missingTableNames = missingTables.map(t => t.name).join(', ');
    throw new Error(`Table(s) ${missingTableNames} could not be found.`);
  }
}

export default ensureTables;
