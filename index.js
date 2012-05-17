var crossroads = require('crossroads')
var ejs = require('ejs')
var formidable = require('formidable')
var mime = require('mime')
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
    switch (opt) {
      case 'static':
        addStaticRouting(opts[opt])
        break
      case 'template':
        cacheTemplates(opts[opt].dir)
        break
    }
  }
  return app
}

var addStaticRouting = function(opts) {
  var lastChar = opts.route.charAt(opts.route.length-1)
  var route = lastChar !== '/' ? opts.route+'/' : opts.route
  var regex = new RegExp('^'+route.replace(/\//g, '\\/')+'(.{0,})$')
  
  routes.get.addRoute(regex, function(req, res) {
    var file = req.url.pathname.replace(route, '/')
    file = path.join(opts.dir, file)
    
    if (path.existsSync(file) === false) {
      return res.end('404')
    }
    if (fs.statSync(file).isDirectory()) {
      file = file+'/index.html'
      if (path.existsSync(file) === false) {
        return res.end('404')
      }
    }
    
    var content = fs.readFileSync(file)  
    res.writeHead(200, { 'Content-Type': mime.lookup(file) })
    res.end(content.toString())
  }, 1)
}

var cacheTemplates = function(dir) {
  var files = wrench.readdirSyncRecursive(dir)
  files.forEach(function(file) {
    var p = path.join(dir, file)
    var stats = fs.statSync(p)
    if ( stats.isDirectory() === false ) {
      var content = fs.readFileSync(p)
      cache[file] = content.toString()
    }
  })    
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