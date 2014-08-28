var pluralize = function(s, n) {
	return n + ' ' + ((n !== 1) ? s.pluralize() : s);
}

var collectEntropy = function() {
	$('body').mousemove(function(e) {
		entropy += e.pageX.toString() + e.pageY.toString();
	});
}

// guid() - http://stackoverflow.com/a/105074/901156
var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();