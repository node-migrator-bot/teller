#teller
Simple node.js webserver.  
Dependencies: [crossroads](http://millermedeiros.github.com/crossroads.js/), [ejs](https://github.com/visionmedia/ejs), [filed](https://github.com/mikeal/filed), [formidable](https://github.com/felixge/node-formidable), [wrench](https://github.com/ryanmcgrath/wrench-js).

[![Build Status](https://secure.travis-ci.org/twentyrogersc/teller.png)](http://travis-ci.org/twentyrogersc/teller)

## Installation

```javascript
npm install teller
```

```javascript
var app = require('teller')
app.get('/', function(req, res) {
  res.json({ foo: 'bar' })
}).listen(1234)
```

## Routing

See [crossroads.addRoute](http://millermedeiros.github.com/crossroads.js/#crossroads-add_route) for more documentation on route patterns. Teller only supports string patterns, and named variables are available in [req.route](#reqroute).

### app.get(route, callback)

Add an GET route with callback.

```javascript
app.get('/', function(req, res) {
  res.send('<h1>Hello world!</h1>')
})
```

### app.post(route, callback)

Add a POST route with callback.

```javascript
app.post('/add', function(req, res) {
  res.json(req.body)
})
```

### app.settings(settings)

Settings for template rendering and static file serving.

```javascript
app.settings({
  template: { dir: __dirname+'/templates' },
  static: { route: '/public', dir: __dirname+'/public' }
})
```

### app.listen(port)

Begin accepting connections on the specified port.

```javascript
app.listen(1234)
```

## Request

### req.route

Contains named variables (see [Routing](#routing)) as key-value pairs.

```javascript
app.get('/:foo:', function(req, res) {
  console.log(req.route.foo)
  // GET /bar would log 'bar'
})
```

### req.query

Contains a parsed query string for GET requests.

```javascript
app.get('/qs', function(req, res) {
  console.log(req.query.foo)
  // GET /qs?foo=bar would log 'bar'
})
```

### req.body

Contains a parsed form body for POST requests.

```javascript
app.post('/form', function(req, res) {
  console.log(req.body.foo)
  // POST /form foo=bar would log 'bar'
})
```

## Response

### res.json(obj [, statusCode])

Render the object as json.

```javascript
app.get(route, function(req, res) {
  res.json({ foo: bar })
})
```

### res.redirect(url [, statusCode])

Redirect to another url.

```javascript
app.get(route, function(req, res) {
  res.redirect('/login')
})
```

### res.render(template [, data [, statusCode]])

Render the specified template. Template directory must be specified in [app.settings()](#appsettingssettings).

```javascript
app
  .settings({ dir: __dirname+'/templates' })
  .get(route, function(req, res) {
    res.render('template.ejs', data, statusCode)
  })
```

### res.send(data [, contentType [, statusCode]])

Renders a string, with optional Content-Type header and status code.

```javascript
app.get(route, function(req, res) {
  res.send('<h1>hello</h1>')
})
```

### res.show404()

Sends the default 404 page.

```javascript
app.get(route, function(req, res) {
  res.show404()
})
```