require('dotenv').config()
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const express = require('express')
const router = express.Router()
const auth = require("../middlewares/auth")
const { UserModel } = require("../models/users-page")
const { RoleUserModel } = require("../models/users-page")

const JWT_SECRET = process.env.JWT_SECRET

// Rotas autenticadas
router.get("/lista", auth, async (req, res) => {
    try{
        const users = await RoleUserModel.find({})
        return res.status(200).json(users)
    } catch (error){
        return res.status(500).json({mensagem: "Erro ao buscar usuários", error: error.message})
    }
})

router.get("/count", async (req, res) => {
    try {
        const users = await UserModel.countDocuments()
        return res.status(200).json({ totalUsers: users })
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})

router.get("/count-roles", async (req, res) => {
    try {
        const users = await RoleUserModel.countDocuments()
        return res.status(200).json({ totalUsers: users })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

router.get("/roles", auth, async (req, res) => {
    try {
        const roleCounts = await RoleUserModel.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
        ])

        const roleCountsObject = roleCounts.reduce((acc, role) => {
            acc[role._id] = role.count
            return acc
        }, {})

        return res.json({
            roleCounts: roleCountsObject
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ mensagem: "Erro ao buscar a contagem de funções", error: error.message})
    }
})

router.put('/editar', auth, async (req, res) => {
    const { username, newUsername, email, role, password } = req.body;

    try {
        const user = await RoleUserModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Usuario não encontrado' });
        }

        user.username = newUsername || user.username;
        user.email = email || user.email;
        user.role = role || user.role;

        if (password) {
            user.password = await bcryptjs.hash(password, 10);
        }

        const updatedUser = await user.save();

        return res.status(200).json({
            message: 'Usuário atualizado!',
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar usuario', error: error.message });
    }
});

router.post("/criar", auth, async (req, res) => {
    const { username, email, role, password } = req.body;
    const passwordEncrypt = await bcryptjs.hash(password, 10)
    const user = {
        username: username,
        email: email,
        role: role,
        password: passwordEncrypt
    };

    try {
        await RoleUserModel.create(user)
        return res.status(201).json({
            mensagem: "Usuário criado com sucesso"
        })
    } catch(error) {
        return res.status(500).json({
            error: error
        })
    }
});

router.delete("/deletar/:username", auth, async (req, res) => {
    const username = req.params.username

    try {
        const user = await RoleUserModel.findOneAndDelete({username: username})

        if(!user) {
            return res.status(404).json({mensagem: "Usuário não encontrado!"})
        }

        return res.status(200).json({mensagen: "Usuário deletado com sucesso!"})
    } catch (error) {
        console.error(error)
        return res.status(500).json({mensagem: "Erro ao deletar usuário", error: error.message})
    }
})

// Rotas não autenticadas	
router.post("/registrar", async(req, res) => {
    const { username, email, password } = req.body;
    const passwordEncrypt = await bcryptjs.hash(password, 10)
    const user = {
        username: username,
        email: email,
        password: passwordEncrypt
    };

    try {
        await UserModel.create(user)
        return res.status(201).json({
            mensagem: "Usuário criado com sucesso"
        })
    } catch(error) {
        return res.status(500).json({
            error: error
        })
    }
});

router.post("/login", async(req, res) => {
    const {username, password} = req.body
    const user = await UserModel.findOne({username: username})
    if(!user) {
        return res.status(400).json({mensagem: "Usuário não encontrado"})
    }

    if(await bcryptjs.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, JWT_SECRET, {expiresIn: '2d'})

        return res.status(200).json({
            mensagem: "Usuário logado com sucesso",
            token: token
        })
    } else {
        return res.status(401).json({mensage: "Usuário ou senha inválidos"})
    }
})

module.exports = router