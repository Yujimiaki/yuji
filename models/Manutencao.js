// models/Manutencao.js
import mongoose from 'mongoose';

/**
 * Schema para os documentos de Manutenção.
 * Cada manutenção está diretamente ligada a um Veículo.
 */
const manutencaoSchema = new mongoose.Schema({
    descricaoServico: {
        type: String,
        required: [true, 'A descrição do serviço é obrigatória.'],
        trim: true,
    },
    data: {
        type: Date,
        required: true,
        default: Date.now, // O valor padrão será a data e hora da criação.
    },
    custo: {
        type: Number,
        required: [true, 'O custo da manutenção é obrigatório.'],
        min: [0, 'O custo não pode ser negativo.'],
    },
    quilometragem: {
        type: Number,
        min: [0, 'A quilometragem não pode ser negativa.'],
        // Não é obrigatório, pois pode ser uma manutenção que não envolve km (ex: reparo estético).
    },
    // O campo mais importante: a conexão com o Veículo.
    veiculo: {
        type: mongoose.Schema.Types.ObjectId, // Armazena o ID único de um documento.
        ref: 'Veiculo', // Especifica que o ID se refere a um documento do modelo 'Veiculo'.
        required: true, // Uma manutenção não pode existir sem um veículo associado.
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente.
});

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

export default Manutencao;