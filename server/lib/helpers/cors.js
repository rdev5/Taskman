/* jslint node: true */
'use strict';

module.exports = function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Authorization, Content-Length, X-Requested-With');
   res.header('Access-Control-Expose-Headers', 'Authorization, Content-Length, X-Requested-With');
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');

   // Intercept OPTIONS method
   if ('OPTIONS' == req.method) {
      res.send(200);
   } else {
      next();
   }
};
