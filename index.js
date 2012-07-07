var crossroads = require('crossroads')
var ejs = require('ejs')
var filed = require('filed')
var formidable = require('formidable')
var wrench = require('wrench')

var fs = require('fs')
var http = require('http')
var path = require('path')
var qs = require('querystring')
var url = require('url')

var app = {}
var cache = {}


app.settings = function(opts) {
  for (var opt in opts) {
    if (opt in add) add[opt](opts[opt])
  }
  return app
}

var add = {}
add.static = function(opts) {
  var lastChar = opts.route.charAt(opts.route.length-1)
  var route = lastChar !== '/' ? opts.route+'/' : opts.route
  addRoute('GET', route+':file*:', function(req, res) {
    var file = req.url.pathname.replace(route, '/')
    file = path.join(opts.dir, file)
    if (fs.existsSync(file)) filed(file).pipe(res)
    else res.show404()
  }, 1)
}

add.template = function(opts) {
  var files = wrench.readdirSyncRecursive(opts.dir)
  files.forEach(function(file) {
    var p = path.join(opts.dir, file)
    var stats = fs.statSync(p)
    if (stats.isDirectory() === false) {
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
  this.send(html, code)
}

var show404 = function() {
  this.send('<h1>404, not found</h1>', 404)
}

crossroads.bypassed.add(function(req, res) {
  res.show404()
})

var json = function(obj, code) {
  var body = JSON.stringify(obj)
  this.send(body, code, 'application/json')
}

var send = function(output, code, type) {
  code = code || 200
  type = type || 'text/html'
  this.writeHead(code, { 'Content-Type': type })
  this.end(String(output));
}

var redirect = function(url, code) {
  code = code || 302
  this.writeHead(code, { Location: url })
  this.end()
}


var server = function(req, res) {
  res.json = json
  res.render = render
  res.redirect = redirect
  res.send = send
  res.show404 = show404
  req.url = url.parse(req.url)
  var route = req.method+' '+req.url.pathname
  crossroads.parse(route, [req, res])
}

var addRoute = function(method, route, cb) {
  var match = method+' '+route
  var ids = crossroads.addRoute(match, function(req, res) {
    if (ids.length > 0) {
      req.route = {}
      for (var i = 0; i < ids.length; i++) {
        var part = ids[i].replace('*', '')
        req.route[part] = arguments[i+2]
      }
    }
    cb(req, res)
  })._paramsIds
}

app.listen = function(port) {
  http.createServer(server).listen(port)
  return app
}


app.get = function(route, cb) {
  addRoute('GET', route, function(req, res) {
    req.query = qs.parse(req.url.query)
    cb(req, res)
  })
  return app
}

app.post = function(route, cb) {
  addRoute('POST', route, parseForm(cb))
  return app
}

app.delete = function(route, cb) {
  addRoute('DELETE', route, parseForm(cb))
  return app
}

var parseForm = function(cb) {
  return function(req, res) {
    var parsed = function(err, body, files) {
      req.body = body || {}
      req.files = files || {}
      cb(req, res)
    }
  
    var form = new formidable.IncomingForm()
    try { form.parse(req, parsed) }
    catch(e) { parsed() }
  }
}

module.exports = app