// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
    // Adicionamos o novo campo "tipo"
    tipo: {
        type: String,
        required: [true, 'O tipo do veículo é obrigatório.'],
        enum: ['Carro', 'Carro Esportivo', 'Caminhão'] // Garante que só esses valores são aceitos
    },
    placa: {
        type: String,
        required: [true, 'A placa do veículo é obrigatória.'],
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}[0-9]([A-Z0-9])[0-9]{2}$/, 'Formato de placa inválido. Use o formato Mercosul (ABC1D23) ou tradicional (ABC1234).']
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
    ligado: {
        type: Boolean,
        default: false,
    },
    velocidade: {
        type: Number,
        default: 0,
        min: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // NOVO CAMPO PARA COMPARTILHAMENTO
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' 
    }]
}, {
    timestamps: true
});

veiculoSchema.index({ placa: 1, owner: 1 }, { unique: true });

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

export default Veiculo;