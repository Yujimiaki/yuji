// ===================================================================================
// ARQUIVO COMPLETO E CORRIGIDO - Garagem Inteligente V3 (server.js) - VERSÃO FINAL
// ===================================================================================


// 1. A PRIMEIRA COISA A FAZER É CARREGAR AS VARIÁVEIS DE AMBIENTE
import dotenv from 'dotenv';
dotenv.config();

// 2. AGORA, IMPORTAR AS FERRAMENTAS (DEPENDÊNCIAS)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 3. E POR ÚLTIMO, OS SEUS PRÓPRIOS ARQUIVOS E MÓDULOS
import Veiculo from './models/Veiculo.js'; // Agora isso vai funcionar!
import Manutencao from './models/Manutencao.js';
import User from './models/user.js';
import authMiddleware from './middleware/auth.js';


// --- CONFIGURAÇÃO INICIAL DO SERVIDOR ---
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// --- CONFIGURAÇÃO DO MULTER (UPLOAD DE ARQUIVOS) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });


// --- CONEXÃO COM O BANCO DE DADOS ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
        app.listen(port, () => {
            console.log(`🚗 Servidor da Garagem Inteligente rodando em http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error("❌ Erro fatal ao conectar com o MongoDB Atlas:", err);
        process.exit(1);
    });

    
// --- ROTAS DA APLICAÇÃO ---

// ROTAS DE AUTENTICAÇÃO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ message: 'E-mail e senha (mínimo 6 caracteres) são obrigatórios.' });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await new User({ email, password: hashedPassword }).save();
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error("[ERRO REGISTRO]", error);
        res.status(500).json({ message: 'Erro no servidor ao registrar.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const payload = { userId: user._id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        console.error("[ERRO LOGIN]", error);
        res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
    }
});

// ROTAS DE VEÍCULOS (CRUD)
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ $or: [{ owner: req.userId }, { sharedWith: req.userId }] }).populate('owner', 'email').sort({ createdAt: -1 });
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os veículos.' });
    }
});

app.post('/api/veiculos', authMiddleware, upload.single('imagem'), async (req, res) => {
    try {
        const veiculoData = {
            ...req.body,
            owner: req.userId,
            imageUrl: req.file ? req.file.path : null
        };
        const veiculoCriado = await Veiculo.create(veiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(' ') });
        }
        res.status(500).json({ message: 'Erro inesperado ao criar o veículo.'});
    }
});

app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id).populate('owner', 'email');
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        const isOwner = veiculo.owner._id.toString() === req.userId;
        const isSharedWith = veiculo.sharedWith.some(id => id.toString() === req.userId);
        if (!isOwner && !isSharedWith) return res.status(403).json({ message: 'Acesso negado.' });
        res.status(200).json(veiculo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar o veículo.' });
    }
});