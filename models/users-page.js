const mongoose = require('mongoose')

const UserModel = mongoose.model('users', {
    usuario: String,
    email: String, 
    senha: String
})

const RoleUserModel = mongoose.model('usersRole', {
    usuario: String, 
    email: String, 
    role: String,
    senha: String
})

RoleUserModel.schema.add({
    novoUsuario: String,
});

module.exports = {
    UserModel,
    RoleUserModel
}