const mongoose = require('mongoose')

const TaskModel = mongoose.model('tasks', {
    titulo: String,
    descricao: String,
    acao: Boolean,
    usuario: String
})

module.exports = {
    TaskModel
}