var crossroads = require('crossroads')
var ejs = require('ejs')
var formidable = require('formidable')
var static = require('node-static')
var wrench = require('wrench')

var fs = require('fs')
var http = require('http')
var path = require('path')
var qs = require('querystring')
var url = require('url')

var app = {}
var cache = {}
var routes = {
  get: crossroads.create(),
  post: crossroads.create()
}


app.settings = function(opts) {
  for (var opt in opts) {
    if (opt in add) add[opt](opts[opt])
  }
  return app
}

var add = {
  static: function(opts) {
    var file = new static.Server(opts.dir)
    
    var last = opts.route.charAt(opts.route.length-1)
    var regex = last !== '/' ? opts.route+'/' : opts.route
    regex = '^'+regex.replace(/\//g, '\\/')+'(.{0,})$'
    regex = new RegExp(regex)
    
    var staticCb = function(req, res) {
      var f = req.url.pathname.match(regex)[1]
      req.addListener('end', function() {
        file.serveFile(f, 200, {}, req, res)
      })
    }
    
    routes.get.addRoute(regex, staticCb, 1)
    routes.post.addRoute(regex, staticCb, 1)
  },
  template: function(opts) {
    var files = wrench.readdirSyncRecursive(opts.dir)
    files.forEach(function(file) {
      var p = path.join(opts.dir, file)
      var stats = fs.statSync(p)
      if ( stats.isDirectory() === false ) {
        var template = fs.readFileSync(p)
        cache[file] = template.toString()
      }
    })    
  }
}


var render = function(template, data, code) {
  if (template in cache === false) {
    throw new Error('template does not exist')
    return
  }
  
  var html = ejs.render(cache[template], data)
  code = code === undefined ? 200 : code
  var head = { 'Content-Type': 'text/html' }
  this.writeHead(code, head)
  this.end(html)
}

var json = function(obj, code) {
  var body = JSON.stringify(obj)
  code = code === undefined ? 200 : code
  var head = { 'Content-Type': 'application/json' }
  this.writeHead(code, head)
  this.end(body)
}

var redirect = function(url, code) {
  code = code === undefined ? 302 : code
  this.writeHead(code, { Location: url })
  this.end()
}


var server = function(req, res) {
  res.json = json
  res.render = render
  res.redirect = redirect
  req.url = url.parse(req.url)

  var method = req.method.toLowerCase()
  routes[method].parse(req.url.pathname, [req, res])
}

app.listen = function(port) {
  http.createServer(server).listen(port)
  return app
}


app.get = function(route, cb) {
  routes.get.addRoute(route, function(req, res) {
    req.query = qs.parse(req.url.query)
    cb(req, res)
  })
  return app
}

app.post = function(route, cb) {
  routes.post.addRoute(route, function(req, res) {
    var form = new formidable.IncomingForm()
    form.parse(req, function(err, fields, files) {
      req.body = fields
      req.files = files
      cb(req, res)
    })
  })
  return app
}


module.exports = app