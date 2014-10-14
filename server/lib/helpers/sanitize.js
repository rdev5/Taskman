function SanitizeHelper() {
}

SanitizeHelper.cleanObj = function(obj) {
  delete obj.type;
  return obj;
}

// Extract only whitelisted fields from data object
SanitizeHelper.extractFields = function(data, fields) {
  var result = {};

  for (var i = 0; i < fields.length; i++) {
    var k = fields[i];

    result[k] = (k in data) ? data[k] : null;
  }

  return result;
}

module.exports = SanitizeHelper;