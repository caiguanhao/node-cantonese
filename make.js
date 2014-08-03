var Q = require('q');
var fs = require('fs');
var http = require('http');
var path = require('path');
var charSpinner = require('char-spinner');
var querystring = require('querystring');
var MIN = 19968, MAX = 40907, CONCURRENT = 5;
var Can2Latin = path.join(__dirname, 'dict', 'can2latin.js');

charSpinner();

var rangePromises = makeRanges(MIN, MAX, CONCURRENT).map(function(range) {
  var chars = charsRange(range.min, range.max);
  return request(chars);
});

Q.
all(rangePromises).
then(function(allContent) {
  var obj = {};
  for (var i = 0; i < allContent.length; i++) {
    parse(allContent[i], obj);
  }
  var chars = {};
  try { chars = require(Can2Latin); } catch(e) {}
  for (var ch in chars) {
    if (!obj[ch]) obj[ch] = chars[ch];
  }
  var str = stringify(obj);
  fs.writeFileSync(Can2Latin, str);
}).
catch(console.error);

function request(content) {
  var deferred = Q.defer();
  var query = querystring.stringify({
    mode: 'cantonese',
    q: content
  });
  var req = http.request({
    host: 'www.kawa.net',
    path: '/works/ajax/romanize/romanize.cgi',
    method: 'POST',
    headers: {
      'Content-Length': Buffer.byteLength(query)
    }
  }, function(res) {
    var body = '';
    res.on('data', function(data) {
      body += data;
    });
    res.on('end', function() {
      deferred.resolve(body);
    });
  });
  req.on('error', function(error) {
    deferred.reject(error);
  });
  req.end(query);
  return deferred.promise;
}

function parse(content, obj) {
  obj = obj || {};
  var matches = content.match(/^<span\stitle=".*">.*<\/span>$/img);
  if (content) {
    for (var i = 0; i < matches.length; i++) {
      var match = /^<span\stitle="(.*)">(.*)<\/span>$/.exec(matches[i]);
      var code = match[2].charCodeAt();
      if (code < MIN || code > MAX) continue;
      obj[code] = match[1].split('/');
    }
  }
  return obj;
}

function stringify(obj) {
  var str = JSON.stringify(obj);
  str = str.replace(/"(\d+)"/g, function(s, $1) {
    return '\n  /* ' + String.fromCharCode($1) + ' */ ' + $1;
  }).replace(/"/g, '\'').replace(/:\[/g, ': [');
  str = 'module.exports = ' + str + ';';
  str = str.replace('};', '\n};\n');
  return str;
}

function makeRanges(min, max, count) {
  var delta = max - min, count = Math.ceil(count);
  if (count < 2) return [ { min: min, max: max } ];
  var average = Math.ceil(delta / count);
  var ranges = [];
  for (var i = 0; i < count; i++) {
    ranges[i] = {
      min: min + i * average,
      max: min + (i + 1) * average - 1,
    };
  }
  return ranges;
}

function charsRange(min, max) {
  var chars = '';
  for (var i = min; i <= max; i++) {
    chars += String.fromCharCode(i);
  }
  return chars;
}
