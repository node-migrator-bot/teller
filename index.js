var crossroads = require('crossroads')

var http = require('http')
var qs = require('querystring')
var url = require('url')
var util = require('util')

var server = function(req, res) {
  req.url = url.parse(req.url)
  crossroads.parse(req.url.pathname, [req, res])
}

module.exports = {
  get: function(route, cb) {
    crossroads.addRoute(route, function(req, res) {
      req.query = qs.parse(req.url.query)
      cb(req, res)
    })
  },
  listen: function(port) {
    http.createServer(server).listen(port)
  }
}