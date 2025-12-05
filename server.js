// ===================================================================================
// ARQUIVO: server.js (SUBSTITUA TUDO)
// ===================================================================================
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs'; 

// --- ATENÇÃO AOS NOMES DOS ARQUIVOS (IMPORTANTE!) ---
// O Linux diferencia Maiúsculas de minúsculas.
// Verifique se no seu VS Code os arquivos estão EXATAMENTE assim:
import Veiculo from './models/Veiculo.js';     // V maiúsculo
import Manutencao from './models/Manutencao.js'; // M maiúsculo
import User from './models/user.js';           // u minúsculo (conforme seu print antigo)
import authMiddleware from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- CORREÇÃO DA PASTA DE IMAGENS ---
// Cria a pasta uploads na raiz do projeto se ela não existir
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
    console.log("📁 Pasta 'uploads' criada!");
}
app.use('/uploads', express.static('./uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); 
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({ storage: storage });

// --- CONEXÃO ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB!");
        app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
    })
    .catch(err => console.error("❌ Erro no MongoDB:", err));

// --- ROTAS ---

// Rota de Teste (Para saber se o código atualizou)
app.get('/', (req, res) => {
    res.send('Servidor Atualizado V5 - Com Compartilhar e Upload!');
});

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

app.post('/api/veiculos', authMiddleware, upload.single('imagem'), async (req, res) => {
    try {
        let imagePath = null;
        if (req.file) {
            imagePath = `uploads/${req.file.filename}`;
        }

        const veiculoData = {
            ...req.body,
            owner: req.userId,
            imageUrl: imagePath,
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

// Compartilhar (SE ESSA ROTA NÃO EXISTIR NO SERVIDOR, DÁ ERRO "CANNOT POST")
app.post('/api/veiculos/:id/share', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findById(req.params.id);
        if (veiculo.owner.toString() !== req.userId) return res.status(403).json({ message: 'Apenas o dono pode compartilhar.' });
        
        const userToShare = await User.findOne({ email: req.body.email });
        if (!userToShare) return res.status(404).json({ message: 'Este e-mail não tem conta no site.' });
        
        if(veiculo.sharedWith.includes(userToShare._id)) {
            return res.status(400).json({ message: 'Já está compartilhado.' });
        }

        veiculo.sharedWith.push(userToShare._id);
        await veiculo.save();
        res.json({ message: 'Veículo compartilhado!' });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ message: 'Erro ao compartilhar.' }); 
    }
});

// Status e Manutenção
app.patch('/api/veiculos/:id/status', authMiddleware, async (req, res) => {
    try {
        const { velocidade, ligado } = req.body;
        const veiculo = await Veiculo.findByIdAndUpdate(req.params.id, { velocidade, ligado }, { new: true });
        res.json(veiculo);
    } catch (e) { res.status(500).json({ message: 'Erro ao atualizar.' }); }
});

app.get('/api/veiculos/:id/manutencoes', authMiddleware, async (req, res) => {
    try {
        const manutencoes = await Manutencao.find({ veiculo: req.params.id }).sort({ data: -1 });
        res.json(manutencoes);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar manutenções.' }); }
});

app.post('/api/manutencoes', authMiddleware, async (req, res) => {
    try {
        const novaManutencao = await Manutencao.create(req.body);
        res.status(201).json(novaManutencao);
    } catch (e) { res.status(500).json({ message: 'Erro ao criar manutenção.' }); }
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