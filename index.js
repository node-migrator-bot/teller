var crossroads = require('crossroads')

var http = require('http')
var qs = require('querystring')
var url = require('url')
var util = require('util')

var app = {}


var json = function(obj, code) {
  var body = JSON.stringify(obj)
  code = code === undefined ? 200 : code
  var head = { 'Content-Type': 'application/json' }
  this.writeHead(code, head)
  this.end(body)
}


var server = function(req, res) {
  res.json = json
  req.url = url.parse(req.url)
  crossroads.parse(req.url.pathname, [req, res])
}

app.listen = function(port) {
  http.createServer(server).listen(port)
  return app
}


app.get = function(route, cb) {
  crossroads.addRoute(route, function(req, res) {
    req.query = qs.parse(req.url.query)
    cb(req, res)
  })
  return app
}

module.exports = app