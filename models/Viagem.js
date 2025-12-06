// models/Viagem.js
import mongoose from 'mongoose';

const viagemSchema = new mongoose.Schema({
    destino: { type: String, required: true },
    dataIda: { type: Date, required: true },
    descricao: { type: String },
    previsaoClima: { type: String }, // Salva o clima que estava no momento do agendamento (histórico)
    veiculo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veiculo',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const Viagem = mongoose.model('Viagem', viagemSchema);
export default Viagem;