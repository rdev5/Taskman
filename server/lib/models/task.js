var uuid = require('node-uuid');
var sanitize = require(__dirname + '/../helpers/sanitize');

function TaskModel() {

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