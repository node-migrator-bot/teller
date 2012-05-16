var crossroads = require('crossroads')
var ejs = require('ejs')
var formidable = require('formidable')
var static = require('node-static')

var fs = require('fs')
var http = require('http')
var qs = require('querystring')
var url = require('url')

var app = {}
var settings = {}
var routes = {
  get: crossroads.create(),
  post: crossroads.create()
}


app.settings = function(opts) {
  for (var opt in opts) {
    switch(opt) {
      case 'template':
      case 'static':
        add[opt](opts[opt])
        break
    }
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
      var path = req.url.pathname.match(regex)[1]
      req.addListener('end', function() {
        file.serveFile(path, 400, {}, req, res)
      })
    }
    
    routes.get.addRoute(regex, staticCb, 1)
    routes.post.addRoute(regex, staticCb, 1)
  },
  template: function(opts) {
    settings.template = opts.dir
  }
}


var render = function(template, data, code) {
  var res = this
  template = [settings.template, template].join('/')
  fs.readFile(template, function (err, buff) {
    if (err) throw err
    var html = ejs.render(buff.toString(), data)
    code = code === undefined ? 200 : code
    var head = { 'Content-Type': 'text/html' }
    res.writeHead(code, head)
    res.end(html)
  })
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