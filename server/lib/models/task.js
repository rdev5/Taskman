var uuid = require('node-uuid');
var sanitize = require(__dirname + '/../helpers/sanitize');

function TaskModel() {

}

TaskModel.load = function(db, task_ids, callback) {

  if (!db.bucket.connected) return callback('Not connected (TaskModel#load)');

  // Multiple: db.getMulti()
  if (task_ids instanceof Array && task_ids.length > 0) {
    db.bucket.getMulti(task_ids, function(count, results) {
      return callback(null, results);
    });
  } else {
    var query = db.couchbase.ViewQuery.from('keys', 'keys');
    db.bucket.query(query, function(err, results) {
      if (err) {
        return callback(err);
      }

      var task_ids = [];
      for (var i = 0; i < results.length; i++) {
        task_ids.push(results[i].id);
      }

      db.bucket.getMulti(task_ids, function(count, results) {
        return callback(null, results);
      });
    });
  }
}

TaskModel.save = function(db, task, callback) {

  if (!db.connected) return callback('Not connected (TaskModel#save)');

  // Details doc
  var taskDoc = sanitize.extractFields(task, ['parent', 'title', 'description', 'index', 'date']);

  taskDoc['type'] = 'task';
  taskDoc['uid'] = ('uid' in task) ? task['uid'] : uuid.v4();
  taskDoc['modified'] = new Date();

  // Details key
  var taskDocKey = 'task-' + taskDoc.uid;

  db.upsert(taskDocKey, taskDoc, function(err, result) {
    if (err) {
      return callback(err);
    }

    callback(null, sanitize.cleanObj(taskDoc), result.cas);
  });
};

module.exports = TaskModel;