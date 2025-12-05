// models/Veiculo.js
import mongoose from 'mongoose';

/**
 * Schema (Planta/Contrato) para os documentos de Veículo.
 * Define a estrutura, os tipos de dados e as validações que cada
 * documento na coleção 'veiculos' deve seguir.
 */
const veiculoSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'A placa do veículo é obrigatória.'],
        unique: true, // Garante que não hajam duas placas iguais no banco.
        uppercase: true, // Salva a placa sempre em maiúsculas.
        trim: true, // Remove espaços em branco do início e do fim.
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido. Use o formato Mercosul (ABC1D23) ou tradicional (ABC1234).']
    },
    marca: {
        type: String,
        required: [true, 'A marca do veículo é obrigatória.'],
        trim: true,
    },
    modelo: {
        type: String,
        required: [true, 'O modelo do veículo é obrigatório.'],
        trim: true,
    },
    ano: {
        type: Number,
        required: [true, 'O ano de fabricação é obrigatório.'],
        min: [1900, 'O ano de fabricação deve ser, no mínimo, 1900.'],
        max: [new Date().getFullYear() + 1, 'O ano de fabricação não pode ser um ano futuro.'],
    },
    cor: {
        type: String,
        trim: true,
        required: [true, 'A cor do veículo é obrigatória.'],
    },
    // Adicionamos os campos de controle do Veiculo.js do frontend aqui também.
    ligado: {
        type: Boolean,
        default: false,
    },
    velocidade: {
        type: Number,
        default: 0,
        min: 0,
    }
}, {
    // Adiciona automaticamente os campos `createdAt` e `updatedAt`.
    timestamps: true
});

/**
 * Modelo Mongoose para a coleção 'veiculos'.
 * O Modelo é a nossa interface principal para realizar operações de
 * Create, Read, Update e Delete (CRUD) na coleção 'veiculos' do MongoDB.
 * É como uma "classe" que representa e interage com a coleção.
 */
const Veiculo = mongoose.model('Veiculo', veiculoSchema);

export default Veiculo;