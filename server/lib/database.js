var couchbase = require('couchbase');

var default_options = {
  cluster: 'couchbase://localhost',
  bucket: 'default'
}

function Database(options) {
  if (this instanceof Database) {
    this.options = options ? options : default_options;
    this.reconnect();
  } else {
    return (new Database(options));
  }
}

Database.prototype.reconnect = function() {
  this.cluster = new couchbase.Cluster(this.options.cluster);
  this.bucket = this.cluster.openBucket(this.options.bucket);

  if (this.bucket.connected === false) {
    console.log('[!] Connection failed (Database#reconnect)');
  }

  return this.bucket;
}

Database.prototype.bucket = function() {
  return this.bucket;
}

module.exports = Database;