const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

//esquema de usuarios
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
        unique: true,
    },
    userPassword: {
        type: String,
        required: true
    },
    userToken: {
        type: String,
        default: null
    },
    isAccountActivated: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
});

//proteccion de la contraseña
userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('userPassword')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.userPassword, salt);

        user.userPassword = hash
        next()
    } catch (error) {
        console.log(error)
        throw new Error('Error al codificar la contraseña')
    }
});

module.exports = mongoose.model('UserMod', userSchema);