/**
 * Utility to create a URL string from an object representing parts of a URL
 */
function urlString({ host = '127.0.0.1', port, protocol = 'http' }) {
  return `${protocol}://${host}:${port}`;
}

export default urlString;
