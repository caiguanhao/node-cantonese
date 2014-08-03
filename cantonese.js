var chars = require('./dict/can2latin');

module.exports = {
  toLatin: toLatin
};

function toLatin(ch) {
  if (typeof ch !== 'string') return undefined;
  return chars[ch.charCodeAt()];
}
