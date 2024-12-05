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

// metodo para comparar contraseñas en login
userSchema.methods.comparePassword = async function (canditePassword) {
    return await bcrypt.compare(canditePassword, this.userPassword);
};

const UserModel = mongoose.model('users', userSchema);
module.exports = UserModel;
//el esquema es la forma de los datos a enviar
//los esquemas al ser creados vendrian siendo los documentos dentro de una coleccion de la base de datos
//el modelo vendria siendo la collecion a crear dentro de la base de datos
//la base de datos a llenar seria a la que estamos conectados en db