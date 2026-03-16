const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    level: {
        type: String,
        required: true,
        enum: ['info', 'warn', 'error'],
    },
    message: {
        type: String,
        required: true,
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Log', LogSchema);
