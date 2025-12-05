// ===================================================================================
// ARQUIVO: server.js (SOLUÇÃO DEFINITIVA - BASE64)
// ===================================================================================
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
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
// Aumenta o limite de tamanho para aceitar imagens grandes no banco
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- MUDANÇA: USAR MEMÓRIA EM VEZ DE DISCO ---
const storage = multer.memoryStorage(); // Guarda na memória RAM temporariamente
const upload = multer({ storage: storage });

// --- CONEXÃO ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB!");
        app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
    })
    .catch(err => console.error("❌ Erro no MongoDB:", err));

// --- ROTAS ---

// Auth
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'E-mail já usado.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await new User({ email, password: hashedPassword }).save();
        res.status(201).json({ message: 'Registrado com sucesso!' });
    } catch (e) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Dados inválidos.' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: 'Login OK!', token });
    } catch (e) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

// Veículos
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ $or: [{ owner: req.userId }, { sharedWith: req.userId }] }).populate('owner', 'email').sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar veículos.' }); }
});

// --- ROTA DE CRIAR COM IMAGEM BASE64 ---
app.post('/api/veiculos', authMiddleware, upload.single('imagem'), async (req, res) => {
    try {
        let imageString = null;

        // Se enviou imagem, converte para Texto (Base64)
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const mime = req.file.mimetype; // ex: image/jpeg
            imageString = `data:${mime};base64,${b64}`;
        }

        const veiculoData = {
            ...req.body,
            owner: req.userId,
            imageUrl: imageString, // Salva o código da imagem direto no banco
            velocidade: 0,
            ligado: false
        };

        const novoVeiculo = await Veiculo.create(veiculoData);
        res.status(201).json(novoVeiculo);
    } catch (error) {
        console.error("Erro criar veiculo:", error);
        res.status(500).json({ message: 'Erro ao criar veículo.' });
    }
});

app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id).populate('owner', 'email');
        if (!veiculo) return res.status(404).json({ message: 'Não encontrado.' });
        res.json(veiculo);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar.' }); }
});

app.post('/api/veiculos/:id/share', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Apenas o dono pode compartilhar.' });
        
        const userToShare = await User.findOne({ email: req.body.email });
        if (!userToShare) return res.status(404).json({ message: 'Este e-mail não tem conta no site.' });
        
        if(veiculo.sharedWith.includes(userToShare._id)) return res.status(400).json({ message: 'Já está compartilhado.' });

        veiculo.sharedWith.push(userToShare._id);
        await veiculo.save();
        res.json({ message: 'Veículo compartilhado!' });
    } catch (e) { res.status(500).json({ message: 'Erro ao compartilhar.' }); }
});

// Status e Manutenção
app.patch('/api/veiculos/:id/status', authMiddleware, async (req, res) => {
    try {
        const { velocidade, ligado } = req.body;
        const veiculo = await Veiculo.findByIdAndUpdate(req.params.id, { velocidade, ligado }, { new: true });
        res.json(veiculo);
    } catch (e) { res.status(500).json({ message: 'Erro status.' }); }
});

app.get('/api/veiculos/:id/manutencoes', authMiddleware, async (req, res) => {
    try {
        const manutencoes = await Manutencao.find({ veiculo: req.params.id }).sort({ data: -1 });
        res.json(manutencoes);
    } catch (e) { res.status(500).json({ message: 'Erro manutencao.' }); }
});

app.post('/api/manutencoes', authMiddleware, async (req, res) => {
    try {
        const nova = await Manutencao.create(req.body);
        res.status(201).json(nova);
    } catch (e) { res.status(500).json({ message: 'Erro manutenção.' }); }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Proibido.' });
        await Veiculo.findByIdAndDelete(req.params.id);
        await Manutencao.deleteMany({ veiculo: req.params.id });
        res.json({ message: 'Removido.' });
    } catch(e) { res.status(500).json({ message: 'Erro.' }); }
});