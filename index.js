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
  var routeExp = 'GET '+route+':file*:'
  
  crossroads.addRoute(routeExp, function(req, res) {
    var file = req.url.pathname.replace(route, '/')
    file = path.join(opts.dir, file)
    if (path.existsSync(file)) filed(file).pipe(res)
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
  code = code === undefined ? 302 : code
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
  route = method+' '+route
  crossroads.addRoute(route, cb);
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
  addRoute('POST', route, function(req, res) {
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