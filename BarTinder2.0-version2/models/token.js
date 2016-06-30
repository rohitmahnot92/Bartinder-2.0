var mongoose = require('mongoose');

var tokenSchema = new mongoose.Schema({
  token: String,
  user_id: String
});

module.exports = mongoose.model('Token', tokenSchema);