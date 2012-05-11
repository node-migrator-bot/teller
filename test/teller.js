var request = require('request')
var should = require('should')

var app = require('../index')
app.get('/', function(req, res) {
  res.end('get')
}).get(/^\/(reg|ex)$/, function(req, res) {
  res.end('regex')
}).get('/query', function(req, res) {
  res.end(req.query.a)
}).get('/json', function(req, res) {
  res.json(req.query, req.query.code)
}).listen(1234)

describe('app', function() {

  describe('get()', function() {
    it('should match a string route', function(done) {
      request('http://localhost:1234', function(err, res, body) {
        should.not.exist(err)
        should.exist(res)
        body.should.equal('get')
        done()
      })
    })
    it('should match a regex route', function(done) {
      request('http://localhost:1234/ex', function(err, res, body) {
        should.not.exist(err)
        should.exist(res)
        body.should.equal('regex')
        done()
      })
    })
    it('should pass through parsed query string', function(done) {
      request('http://localhost:1234/query?a=b', function(err, res, body) {
        should.not.exist(err)
        should.exist(res)
        body.should.equal('b')
        done()
      })
    })
  })
  
  describe('res.json()', function() {
    it('should respond with json', function(done) {
      request('http://localhost:1234/json?code=200', function(err, res, body) {
        should.not.exist(err)
        should.exist(res)
        res.headers['content-type'].should.equal('application/json')
        body.should.equal('{"code":"200"}')
        done()
      })
    })
    it('should respond with correct status codes', function(done) {
      request('http://localhost:1234/json?code=404', function(err, res, body) {
        should.not.exist(err)
        should.exist(res)
        res.statusCode.should.equal(404)
        body.should.equal('{"code":"404"}')
        done()
      })
    })  
  })

})