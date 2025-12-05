// ARQUIVO: server.js (SUBSTITUA TUDO)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Modelos
import Veiculo from './models/Veiculo.js';
import Manutencao from './models/Manutencao.js';
import User from './models/user.js';
import authMiddleware from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Aceita JSON

// --- CONEXÃO ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB!");
        app.listen(port, () => console.log(`🚀 Servidor na porta ${port}`));
    })
    .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTAS ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'E-mail existe.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ email, password: hashedPassword }).save();
        res.status(201).json({ message: 'Sucesso!' });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Erro.' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'OK', token });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ $or: [{ owner: req.userId }, { sharedWith: req.userId }] }).sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// --- ROTA DE CRIAR VEÍCULO (AGORA RECEBE URL SIMPLES) ---
app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        // Agora pegamos 'imagemUrl' direto do corpo da requisição (JSON)
        const { placa, marca, modelo, ano, cor, tipo, imagemUrl } = req.body;

        const novoVeiculo = await Veiculo.create({
            placa, marca, modelo, ano, cor, tipo,
            imageUrl: imagemUrl, // Salva o link que veio do formulário
            owner: req.userId,
            velocidade: 0,
            ligado: false
        });
        
        res.status(201).json(novoVeiculo);
    } catch (error) {
        console.error("Erro criar:", error);
        res.status(500).json({ message: 'Erro ao criar.' });
    }
});

app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id).populate('owner', 'email');
        if (!veiculo) return res.status(404).json({ message: 'Não encontrado.' });
        res.json(veiculo);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/veiculos/:id/share', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Proibido.' });
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: 'Usuario nao existe.' });
        if(veiculo.sharedWith.includes(user._id)) return res.status(400).json({ message: 'Ja compartilhado.' });
        
        veiculo.sharedWith.push(user._id);
        await veiculo.save();
        res.json({ message: 'OK' });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.patch('/api/veiculos/:id/status', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(v);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.get('/api/veiculos/:id/manutencoes', authMiddleware, async (req, res) => {
    try {
        const m = await Manutencao.find({ veiculo: req.params.id }).sort({ data: -1 });
        res.json(m);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/manutencoes', authMiddleware, async (req, res) => {
    try {
        const m = await Manutencao.create(req.body);
        res.status(201).json(m);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.findById(req.params.id);
        if (v.owner.toString() !== req.userId) return res.status(403).json({ message: 'Proibido.' });
        await Veiculo.findByIdAndDelete(req.params.id);
        await Manutencao.deleteMany({ veiculo: req.params.id });
        res.json({ message: 'Deletado.' });
    } catch(e) { res.status(500).json({ message: 'Erro.' }); }
});