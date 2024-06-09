require('dotenv').config()
const express = require('express')
const router = express.Router()
const auth = require("../middlewares/auth")
const { TaskModel } = require("../models/todo-page")

router.get("/lista", auth, async (req, res) => {
    try {
        const tasks = await TaskModel.find({})
        return res.status(200).json(tasks)
    } catch (error) {
        return res.status(500).json({mensagem: "Erro ao buscar tarefas", error: error.message})
    }
})

router.put("/editar", auth, async (req, res) => {
    const { titulo, usuario, novoTitulo, novaDescricao, novaAcao } = req.body;

    if (!titulo || !usuario) {
        return res.status(400).json({ mensagem: "Os campos 'titulo' e 'usuario' são obrigatórios" });
    }

    try {
        const task = await TaskModel.findOne({ titulo: titulo, usuario: usuario });
        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada para este usuário" });
        }

        if (novoTitulo !== undefined) {
            task.titulo = novoTitulo;
        }
        if (novaDescricao !== undefined) {
            task.descricao = novaDescricao;
        }
        if (novaAcao !== undefined) {
            task.acao = novaAcao;
        }

        await task.save();

        return res.status(200).json({ mensagem: "Tarefa atualizada com sucesso", task: task });
    } catch (error) {
        console.error("Erro ao atualizar a tarefa:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.put("/edit-state", auth, async (req, res) => {
    const { acao } = req.body;

    try {
        if (acao === undefined) {
            return res.status(400).json({ mensagem: "O campo 'acao' é obrigatório" });
        }

        await TaskModel.updateMany({ acao: { $ne: acao } }, { acao: acao });

        return res.status(200).json({ mensagem: "Tarefas atualizadas com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar as tarefas:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.delete("/delete", auth, async (req, res) => {
    const { usuario, titulo} = req.body

    if (!usuario || !titulo) {
        return res.status(400).json({mensagem: "Os campos 'usuario' e 'titulo' são obrigatórios"})
    }

    try {
        const task = await TaskModel.findOne({ titulo: titulo, usuario: usuario })
        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada para este usuário" })
        }

        await TaskModel.deleteOne({ titulo: titulo, usuario: usuario })

        return res.status(200).json({ mensagem: "Tarefa excluída com sucesso "})
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

router.post("/criar", auth, async (req, res) => {
    const {titulo, descricao, acao, usuario} = req.body 
    const task = {
        titulo: titulo,
        descricao: descricao,
        acao: acao
    }

    if(usuario) {
        task.usuario = usuario
    }

    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: "Os campos 'titulo', 'descricao'são obrigatórios" });
    }

    try {
        await TaskModel.create(task)
        return res.status(201).json({
            mensagem: "Tarefa criada com sucesso"
        })
    } catch(error) {
        return res.status(500).json({
            error: error.message
        })
    }
})

router.get("/tasks-sem-dono", async (req, res) => {
    try {
        const tasks = await TaskModel.find({ usuario: { $exists: false } });

        return res.status(200).json({ tasks: tasks });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.put("/adicionar-dono", auth, async (req, res) => {
    const { titulo, usuario } = req.body;

    try {
        const task = await TaskModel.findOne({ titulo: titulo, usuario: { $exists: false } });
        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada ou já possui um proprietário" });
        }

        task.usuario = usuario;
        await task.save(); 

        return res.status(200).json({ mensagem: "Proprietário adicionado à tarefa com sucesso", task: task });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router