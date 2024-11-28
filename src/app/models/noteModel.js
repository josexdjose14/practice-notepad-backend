const mongoose = require('mongoose');

const { Schema } = mongoose;

const noteSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const NoteModel = mongoose.model('notes', noteSchema);
module.exports = NoteModel;

// otra manera de referenciar al usuario de una manera mas exacta
// userEmail: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
// }