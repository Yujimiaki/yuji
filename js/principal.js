// js/principal.js

// ===================================================================================
// ARQUIVO COMPLETO E CORRIGIDO - Versão Definitiva
// ===================================================================================

// --- CONFIGURAÇÃO INICIAL ---
const API_BASE_URL = 'http://localhost:3001/api'; 

// --- FUNÇÕES DE UTILIDADE ---
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const showNotification = (message, type = 'info', ui) => {
    if (!ui.notificationArea || !ui.notificationMessage) return;
    ui.notificationMessage.textContent = message;
    ui.notificationArea.className = '';
    ui.notificationArea.classList.add(type, 'show');
    setTimeout(() => {
        ui.notificationArea.classList.remove('show');
    }, 4000);
};

// --- LÓGICA DE AUTENTICAÇÃO E VISIBILIDADE ---
const checkAuthState = async (ui) => {
    const token = localStorage.getItem('token');
    if (token) {
        ui.authContainer.style.display = 'none';
        ui.appContainer.style.display = 'flex';
        await carregarVeiculosDoUsuario(ui);
    } else {
        ui.authContainer.style.display = 'block';
        ui.appContainer.style.display = 'none';
    }
};

const handleLogin = async (event, ui) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        localStorage.setItem('token', data.token);
        showNotification(data.message, 'success', ui);
        ui.formLogin.reset();
        await checkAuthState(ui);
    } catch (error) {
        showNotification(error.message || 'Erro no login.', 'error', ui);
    }
};

const handleRegister = async (event, ui) => {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        showNotification(data.message, 'success', ui);
        ui.formRegister.reset();
    } catch (error) {
        showNotification(error.message || 'Erro no registro.', 'error', ui);
    }
};

const handleLogout = (ui) => {
    localStorage.removeItem('token');
    showNotification('Você saiu da sua garagem.', 'info', ui);
    if (ui.listaVeiculosSidebar) ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Faça login para ver seus veículos.</li>';
    if (ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'none';
    if (ui.mensagemBoasVindas) ui.mensagemBoasVindas.style.display = 'block';
    checkAuthState(ui);
};

// --- LÓGICA DA GARAGEM ---
const handleAddVehicle = async (event, ui) => {
    event.preventDefault();
    const form = ui.formNovoVeiculo;
    const formData = new FormData(form); // Cria um pacote de dados com o formulário

    if (!formData.get('tipo')) {
        showNotification('Por favor, selecione o tipo de veículo.', 'warning', ui);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // NÃO defina o 'Content-Type', o navegador fará isso automaticamente
            },
            body: formData // Envia o pacote
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showNotification(`Veículo adicionado!`, 'success', ui);
        ui.modalAdicionarVeiculo.close();
        form.reset();
        await carregarVeiculosDoUsuario(ui);
    } catch (error) {
        showNotification(error.message || 'Erro ao adicionar veículo.', 'error', ui);
    }
};

const handleShareVehicle = async (event, ui) => {
    const veiculoId = event.currentTarget.dataset.id;
    if (!veiculoId) {
        showNotification('Selecione um dos seus veículos para compartilhar.', 'warning', ui);
        return;
    }
    const email = prompt("Digite o e-mail do usuário para compartilhar:");
    if (!email || email.trim() === '') return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/veiculos/${veiculoId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        showNotification(data.message, 'success', ui);
    } catch (error) {
        showNotification(error.message || 'Erro ao compartilhar.', 'error', ui);
    }
};

const carregarVeiculosDoUsuario = async (ui) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_BASE_URL}/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const veiculos = await response.json();
        if (!response.ok) throw new Error(veiculos.message);
        atualizarListaVeiculosSidebar(veiculos, ui);
    } catch (error) {
        showNotification(error.message || 'Erro ao carregar veículos.', 'error', ui);
    }
};

const atualizarListaVeiculosSidebar = (veiculos, ui) => {
    if (!ui.listaVeiculosSidebar) return;
    ui.listaVeiculosSidebar.innerHTML = '';
    const token = localStorage.getItem('token');
    if (!token) return;
    const userData = parseJwt(token);
    if (!veiculos || veiculos.length === 0) {
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Sua garagem está vazia.</li>';
        return;
    }
    veiculos.forEach(veiculo => {
        const li = document.createElement('li');
        li.dataset.id = veiculo._id;
        const isOwner = userData.userId === (veiculo.owner._id || veiculo.owner);
        let ownerInfo = !isOwner && veiculo.owner && veiculo.owner.email ? ` <small style="opacity: 0.7;">(de ${veiculo.owner.email})</small>` : '';
        li.innerHTML = `<i class="fas fa-car-side"></i><span class="veiculo-nome">${veiculo.modelo} - ${veiculo.placa}${ownerInfo}</span>`;
        li.addEventListener('click', () => selecionarEExibirVeiculo(veiculo._id, ui));
        ui.listaVeiculosSidebar.appendChild(li);
    });
};

const selecionarEExibirVeiculo = async (veiculoId, ui) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/veiculos/${veiculoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const veiculo = await response.json();
        if (!response.ok) throw new Error(veiculo.message);
        
        // Preenche dados
        document.getElementById('info-modelo-placa').textContent = `${veiculo.modelo} (${veiculo.placa})`;
        document.getElementById('info-tipo').textContent = veiculo.tipo;
        document.getElementById('info-marca').textContent = veiculo.marca;
        document.getElementById('info-cor').textContent = veiculo.cor;
        document.getElementById('info-ano').textContent = veiculo.ano;
        document.getElementById('info-id').textContent = `ID: ${veiculo._id}`;

           const imgElement = document.getElementById('imagemVeiculo');
        if (veiculo.imageUrl) {
            // Corrige as barras do caminho (importante para o navegador)
            const correctedUrl = veiculo.imageUrl.replace(/\\/g, '/');
            // Monta a URL completa para a imagem
            imgElement.src = `http://localhost:3001/${correctedUrl}`;
        } else {
            // Usa uma imagem padrão se não houver upload
            imgElement.src = 'https://i.imgur.com/2s46e5k.png';
        }
        
        // Verifica se é proprietário
        const userData = parseJwt(token);
        const isOwner = userData.userId === (veiculo.owner._id || veiculo.owner);
        const infoProprietario = document.getElementById('info-proprietario');
        infoProprietario.style.display = isOwner ? 'none' : 'block';
        if (!isOwner) infoProprietario.textContent = `Compartilhado por: ${veiculo.owner.email}`;
        
        // Habilita/desabilita botões
        ui.botaoCompartilharHeader.disabled = !isOwner;
        ui.botaoEditarHeader.disabled = !isOwner;
        ui.botaoRemoverHeader.disabled = !isOwner;
        
        // Adiciona IDs aos botões
        ui.botaoCompartilharHeader.dataset.id = veiculo._id;
        ui.botaoEditarHeader.dataset.id = veiculo._id;
        ui.botaoRemoverHeader.dataset.id = veiculo._id;
        
        // Mostra o painel
        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemBoasVindas.style.display = 'none';

    } catch (error) {
        showNotification(error.message || 'Erro ao exibir detalhes.', 'error', ui);
    }
};


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
// Este bloco garante que o script só roda depois que o HTML está 100% carregado.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mapeia todos os elementos da interface uma única vez.
    const ui = {
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),
        formLogin: document.getElementById('formLogin'),
        formRegister: document.getElementById('formRegister'),
        btnLogout: document.getElementById('btnLogout'),
        listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
        painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
        mensagemBoasVindas: document.getElementById('mensagem-selecione'),
        modalAdicionarVeiculo: document.getElementById('modalAdicionarVeiculo'),
        formNovoVeiculo: document.getElementById('formNovoVeiculo'),
        btnAbrirModalAdicionar: document.getElementById('btnAbrirModalAdicionar'),
        btnFecharModalAdicionar: document.getElementById('btnFecharModalAdicionar'),
        botaoCompartilharHeader: document.getElementById('botaoCompartilharHeader'),
        botaoEditarHeader: document.getElementById('botaoEditarHeader'),
        botaoRemoverHeader: document.getElementById('botaoRemoverHeader'),
        notificationArea: document.getElementById('notification-area'),
        notificationMessage: document.getElementById('notification-message'),
        notificationCloseBtn: document.querySelector('#notification-area .close-btn'),
    };
    
    // 2. Garante que elementos essenciais existem antes de adicionar listeners
    if (ui.formLogin) ui.formLogin.addEventListener('submit', (e) => handleLogin(e, ui));
    if (ui.formRegister) ui.formRegister.addEventListener('submit', (e) => handleRegister(e, ui));
    if (ui.btnLogout) ui.btnLogout.addEventListener('click', () => handleLogout(ui));
    
    if (ui.btnAbrirModalAdicionar) ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionarVeiculo.showModal());
    if (ui.btnFecharModalAdicionar) ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionarVeiculo.close());
    if (ui.formNovoVeiculo) ui.formNovoVeiculo.addEventListener('submit', (e) => handleAddVehicle(e, ui));
    
    if (ui.botaoCompartilharHeader) ui.botaoCompartilharHeader.addEventListener('click', (e) => handleShareVehicle(e, ui));
    
    if (ui.notificationCloseBtn) ui.notificationCloseBtn.addEventListener('click', () => ui.notificationArea.classList.remove('show'));

    // 3. Inicia a aplicação verificando o estado de login.
    checkAuthState(ui);
});