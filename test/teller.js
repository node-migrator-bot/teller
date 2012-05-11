var request = require('request')
var should = require('should')

var app = require('../index')
app.get('/', function(req, res) {
  res.end('get')
})
app.get(/^\/(reg|ex)$/, function(req, res) {
  res.end('regex')
})
app.listen(1234)

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
  })

})