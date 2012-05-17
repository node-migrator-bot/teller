#teller
Simple node.js webserver.

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

## Request

### app.get()

Add an GET route with callback. The query string will be parsed and available in req.query.

```javascript
app.get(route, function(req, res) {
  console.log(req.query)
})
```

### app.post()

Add a POST route with callback. The body and files in the request will be parsed and available in req.body and req.files.

```javascript
app.post(route, function(req, res) {
  console.log(req.body)
})
```

### app.settings()

Settings for template rendering and static file serving.

```javascript
app.settings({
  template: { dir: __dirname+'/templates' },
  static: { route: '/public', dir: __dirname+'/public' }
})
```

### app.listen()

Begin accepting connections on the specified port.

```javascript
app.listen(1234)
```

## Response

### res.render()

Render the specified template, the path of which must be specified in app.settings(). Data and statusCode are not required.

```javascript
app.settings({ dir: __dirname+'/templates' })
app.get(route, function(req, res) {
  res.render('template.ejs', data, statusCode)
})
```

### res.json()

Render the object as json. StatusCode is not required.

```javascript
app.get(route, function(req, res) {
  res.json({ foo: bar }, statusCode)
})
```

### res.redirect()

Redirect to another url. StatusCode is not required.

```javascript
app.get(route, function(req, res) {
  res.redirect('/login', statusCode)
})
```

### res.show404()

Sends the default 404 page.

```javascript
app.get(route, function(req, res) {
  res.show404()
})
```