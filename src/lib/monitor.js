'use strict';

var Q = require('q');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

module.exports = (function () {
  var db;

  function connect(dbURL) {
    var deferred = Q.defer();

    MongoClient.connect(dbURL, function (err, db) {
      if(err) {
        deferred.reject(new Error(err));
        return;
      }

      deferred.resolve(db);
    });

    return deferred.promise;
  }

  return {
    init: function (router, opts) {
      var self = this;

      this.setupRoutes(router);

      return connect(opts.dbURL)
          .then(function (database) {
            console.log("Connected to", opts.dbURL);
            db = database;
          });
    },

    getAllRunIds: function () {
      var deferred = Q.defer();

      var runCollection = db.collection('runs');

      runCollection.find({}, {_id: 1}).toArray(function (err, docs) {
        if(err) {
          deferred.reject(new Error(err));
        }

        deferred.resolve(docs);
      });

      return deferred.promise;
    },

    getRun: function (id) {
      var deferred = Q.defer();

      var runCollection = db.collection('runs');

      runCollection.findOne({_id: new ObjectID(id)}, function (err, doc) {
        if(err) {
          deferred.reject(new Error(err));
        }

        deferred.resolve(doc);
      });

      return deferred.promise;
    },

    /**
     * Create new run and return it
     * @returns {promise|*|Q.promise}
     */
    createRun: function () {
      var deferred = Q.defer();
      console.log("Creating new run.");

      var runCollection = db.collection('runs');

      runCollection.insertOne({created_at: new Date(), results: []}, function (err, result) {
        if(err) {
          deferred.reject(new Error(err));
        }

        var run = result.ops[0];
        console.log("Created new run", run);
        deferred.resolve(run);
      });

      return deferred.promise;
    },

    /**
     * Store result
     * @returns {promise|*|Q.promise}
     */
    pushResult: function (runId, data) {
      var deferred = Q.defer();

      var runCollection = db.collection('runs');

      runCollection.updateOne({_id: new ObjectID(runId)}, {$push: {results: data}}, function (err, result) {
        if(err) {
          deferred.reject(new Error(err));
        }

        var data = result;
        console.log("Pushed data", data.result);
        deferred.resolve(data);
      });

      return deferred.promise;
    },

    setupRoutes: function (router) {
      var self = this;
      router.get('/runs', function (req, res, next) {
        // Get run IDs
        self.getAllRunIds().then(function (docs) {

          res.send(docs);
          res.end();
          next();
        }).fail(function (err) {
          res.status(500);
          res.end();

          console.error("Failed to get runs from DB", err);
        });

      });

      router.get('/run/:id', function (req, res, next) {
        var runId = req.params.id;
        // Load data
        self.getRun(runId).then(function (run) {
          res.send(run);
        }).fail(function (err) {
          res.status(500);
          res.end();

          console.error("Failed to get runs from DB", err);
        });
      });

      router.post('/run', function (req, res, next) {
        // Create a new run and return the id
        self.createRun().then(function (result) {
          res.send(result);
        }).fail(function () {
          res.status(500);
        }).fin(function () {
          res.end();
          next();
        });
      });

      router.put('/run/:id', function (req, res, next) {
        var runId = req.params.id;
        // Store the data point for run with id
        self.pushResult(runId, req.body).then(function () {
          res.status(204);
        }).fail(function (err) {
          console.log("Save failed", err);
          res.status(500);
        }).fin(function () {
          res.end();
          next();
        })
      });

      router.delete('/run/:id', function (req, res,next) {
        // Delete the run from the DB

        res.status(204);
        res.end();
        next();
      });

      router.delete('/runs', function (req, res,next) {
        // Drop all runs from the db
        var runCollection = db.collection('runs');

        runCollection.removeMany({}, function (err, result) {
          console.log("Delete all runs", result.deletedCount);
        });

        res.status(204);
        res.end();
        next();
      });
    }
  }
})();