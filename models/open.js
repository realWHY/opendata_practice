var mongoose = require('mongoose');

var potentSchema = mongoose.Schema({
    County: {type: String},
    Town: {type: String},
    Vill: {type: String},
    Debrisno: {type: String},
    AlertValue: {type: String},
    station1ID: {type: String},
    station2ID: {type: String},
    station1StationName: {type: String},
    station2StationName: {type: String},
});

module.exports = mongoose.model('Open', potentSchema);