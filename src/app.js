'use strict';

var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var monitor = require('./lib/monitor');
var settings = require('../settings.json');

var router = express.Router();
monitor.init(router, {
  dbURL: settings.dbURL
}).then(function () {
  app.use(bodyparser.json());
  app.use('/', router);

  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Monitor listening at http://%s:%s', host, port)
  });

}).fail(function (error) {
  console.error("Startup failed.");
  console.error("Reason", error);
});


