module.exports = {
  toLatin: toLatin,
  fromLatin: fromLatin
};

function toLatin(ch) {
  var chars = require('./dict/can2latin');
  if (typeof ch !== 'string') return undefined;
  return chars[ch.charCodeAt()];
}

function fromLatin(latin) {
  var latins = require('./dict/latin2can');
  if (typeof latin !== 'string') return undefined;
  return (latins[latin] || []).map(function(l) {
    return String.fromCharCode(l);
  });
}
