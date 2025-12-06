// ARQUIVO: server.js
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
import Viagem from './models/Viagem.js'; // Novo Modelo
import authMiddleware from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- CONEXÃO ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB!");
        app.listen(port, () => console.log(`🚀 Servidor na porta ${port}`));
    })
    .catch(err => console.error("❌ Erro MongoDB:", err));

// --- ROTAS DE AUTENTICAÇÃO ---
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
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'seusegredobackend', { expiresIn: '24h' });
        res.json({ message: 'OK', token });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// --- ROTAS DE VEÍCULOS ---
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ $or: [{ owner: req.userId }, { sharedWith: req.userId }] }).sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const { placa, marca, modelo, ano, cor, tipo, imagemUrl } = req.body;
        const novoVeiculo = await Veiculo.create({
            placa, marca, modelo, ano, cor, tipo,
            imageUrl: imagemUrl, 
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

app.patch('/api/veiculos/:id/status', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(v);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const v = await Veiculo.findById(req.params.id);
        if (v.owner.toString() !== req.userId) return res.status(403).json({ message: 'Proibido.' });
        await Veiculo.findByIdAndDelete(req.params.id);
        // Remove manutenções e viagens associadas
        await Manutencao.deleteMany({ veiculo: req.params.id });
        await Viagem.deleteMany({ veiculo: req.params.id });
        res.json({ message: 'Deletado.' });
    } catch(e) { res.status(500).json({ message: 'Erro.' }); }
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

// --- ROTAS DE MANUTENÇÃO (ATUALIZADO PARA ACEITAR DATA) ---
app.get('/api/veiculos/:id/manutencoes', authMiddleware, async (req, res) => {
    try {
        // Ordena por data (a mais recente ou futura primeiro)
        const m = await Manutencao.find({ veiculo: req.params.id }).sort({ data: -1 });
        res.json(m);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/manutencoes', authMiddleware, async (req, res) => {
    try {
        // Certifica que passamos o body completo (descrição, custo, DATA, veículo)
        const m = await Manutencao.create(req.body);
        res.status(201).json(m);
    } catch (e) { 
        console.error(e);
        res.status(500).json({ message: 'Erro ao criar manutenção.' }); 
    }
});

// --- ROTAS DE VIAGEM (NOVO) ---
app.get('/api/veiculos/:id/viagens', authMiddleware, async (req, res) => {
    try {
        const v = await Viagem.find({ veiculo: req.params.id }).sort({ dataIda: 1 });
        res.json(v);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/viagens', authMiddleware, async (req, res) => {
    try {
        const { destino, dataIda, descricao, previsaoClima, veiculo } = req.body;
        const viagem = await Viagem.create({
            destino, dataIda, descricao, previsaoClima, veiculo, owner: req.userId
        });
        res.status(201).json(viagem);
    } catch (error) { res.status(500).json({ message: 'Erro ao agendar viagem.' }); }
});