const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
});

const NoteMod = mongoose.model('NoteMod', noteSchema);
module.exports = NoteMod;