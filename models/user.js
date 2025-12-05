// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true, // Garante que cada e-mail seja único no banco de dados.
        lowercase: true, // Armazena o e-mail sempre em letras minúsculas.
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Por favor, use um formato de e-mail válido.']
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres.']
    }
}, {
    timestamps: true // Adiciona 'createdAt' e 'updatedAt' automaticamente.
});

const User = mongoose.model('User', userSchema);

export default User;