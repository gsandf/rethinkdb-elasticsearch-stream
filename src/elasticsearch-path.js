/**
 * Utility to get the path Elasticsearch should work with
 * @param  {String} [db='']      An index (or database)
 * @param  {String} [table='' }] A type (or table)
 * @return {[String]}            The path to query against or save to
 */
function elasticsearchPath({ db = '', id = '', table = '' } = {}) {
  // If `db` or `table` are not strings, that's probably a mistake
  if (typeof db !== 'string') {
    throw new TypeError('`db` should be a string');
  }

  if (typeof table !== 'string') {
    throw new TypeError('`table` should be a string');
  }

  if (db === '') {
    if (table === '') {
      // If given nothing, just return a root path
      return '/';
    }
    // Given table but no db is probably incorrect
    throw new Error('Table provided but not database.');
  }

  if (table === '') {
    return `/${db}`;
  }

  /* 
  * As of ES 6.0 you can only have 1 mapping per Indice. Therefore Indices must be unique for multiple tables in same DB
  * see https://www.elastic.co/guide/en/elasticsearch/reference/6.0/removal-of-types.html
  */
  if (id == null || id === '') {
    return `/${db}_${table}/${table}`;
  }

  return `/${db}_${table}/${table}/${id}`;
}

export default elasticsearchPath;
