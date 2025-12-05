// middleware/auth.js
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // Pega o token do cabeçalho: "Authorization: Bearer <token>"
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido ou token mal formatado.' });
    }

    const token = authHeader.split(' ')[1]; // Pega apenas a parte do token

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        // Verifica se o token é válido usando o segredo
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SEU_SEGREDO_SUPER_SECRETO');
        
        // Anexa o ID do usuário (payload do token) ao objeto 'req'
        // para que as próximas rotas na cadeia possam usá-lo.
        req.userId = decoded.userId;
        
        next(); // Tudo certo, passa para o próximo passo (o controlador da rota)
    } catch (error) {
        res.status(401).json({ message: 'Token inválido.' });
    }
};

export default authMiddleware;