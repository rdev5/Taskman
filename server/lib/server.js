// Database bridge over REST written in Node.js
var fs = require('fs');
var restify = require('restify');
var sanitize = require(__dirname + '/helpers/sanitize');
var TaskModel = require(__dirname + '/models/task');
var CORS = require(__dirname + '/helpers/cors');
var Database = require('./database');

var options = {
  app_name: 'Taskman Server',
  port: 5000,

  // Performance tips:
  // Establishing new connections are expensive. Connect once per application instance.
  // Don't use to many buckets or views which can negatively impact server performance and connected clients.
  // Dispatch two discreet operations simultaneously rather than waiting for an operation callback
  // Or use "Multi versions of operations" to perform multiple operations through a single function call.
  db: new Database(),

  ssl: {
    keyfile: __dirname + '/ssl/server.key',
    certfile: __dirname + '/ssl/server.crt'
  },

  task_prefix: 'task-',
  task_meta: {
    expiry: 0
  }
}

var server = restify.createServer({
  certificate: fs.readFileSync(options.ssl.certfile),
  key: fs.readFileSync(options.ssl.keyfile),
  name: options.app_name
});

// Start the service
server.use(restify.bodyParser());
server.use(CORS);

console.log('[+] Listening on port ' + options.port);
server.listen(options.port);

// GET /tasks
server.get('/tasks', function(req, res, next) {
  console.log('[+] GET /tasks');

  res.send(200, 'get_tasks');
});

// POST /tasks/save/:id
server.post('/tasks/save/:uid', function(req, res, next) {
  console.log('[+] POST /tasks/save/' + req.params.uid);

  TaskModel.save(options.db.bucket, req.params, function(err, task, cas) {
    if (err) {
      console.log('[!] ' + err);
      res.send(500, err);
      return;
    }

    res.send(200, task);
  });
});