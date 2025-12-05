// ARQUIVO: js/principal.js (SUBSTITUA TUDO)

const API_BASE_URL = 'https://vinicius-yuji-miaki-iiw24a.onrender.com/api';
let veiculoAtual = null;

// --- SISTEMA DE NOTIFICAÇÃO ---
const showNotification = (msg, type) => {
    const area = document.getElementById('notification-area');
    document.getElementById('notification-message').textContent = msg;
    area.className = type + ' show';
    setTimeout(() => area.className = '', 5000);
};

// --- AUTH ---
const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        carregarVeiculos();
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
};

const realizarLogin = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.textContent = "..."; btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            checkAuth();
            showNotification('Logado!', 'success');
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Erro conexão.', 'error'); } 
    finally { btn.textContent = "Entrar"; btn.disabled = false; }
};

const realizarRegistro = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.textContent = "..."; btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: document.getElementById('registerEmail').value, password: document.getElementById('registerPassword').value })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Criado! Faça login.', 'success');
            document.getElementById('formRegister').reset();
        } else showNotification(data.message, 'error');
    } catch (e) { showNotification('Erro registro.', 'error'); } 
    finally { btn.textContent = "Criar Conta"; btn.disabled = false; }
};

// --- VEÍCULOS ---
const carregarVeiculos = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const veiculos = await res.json();
        const lista = document.getElementById('listaVeiculosSidebar');
        lista.innerHTML = '';
        if (veiculos.length === 0) lista.innerHTML = '<li style="padding:15px; color:#888;">Nada aqui.</li>';
        veiculos.forEach(v => {
            const li = document.createElement('li');
            li.style.padding = '10px'; li.style.cursor = 'pointer'; li.style.borderBottom = '1px solid #eee';
            li.innerHTML = `<i class="fas fa-car"></i> ${v.modelo} <small>(${v.placa})</small>`;
            li.onclick = () => selecionarVeiculo(v._id);
            lista.appendChild(li);
        });
    } catch (e) { console.error(e); }
};

const adicionarVeiculo = async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#formNovoVeiculo button[type="submit"]');
    btn.textContent = "Salvando..."; btn.disabled = true;
    const formData = new FormData(document.getElementById('formNovoVeiculo'));
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        // Tenta ler como texto primeiro para debug
        const textResponse = await res.text();
        
        try {
            const data = JSON.parse(textResponse);
            if (!res.ok) throw new Error(data.message || 'Erro servidor');
            
            document.getElementById('modalAdicionarVeiculo').close();
            document.getElementById('formNovoVeiculo').reset();
            showNotification('Veículo criado!', 'success');
            carregarVeiculos();
        } catch (jsonError) {
            console.error("Erro Servidor (HTML):", textResponse);
            throw new Error("O servidor falhou. Verifique o console.");
        }
    } catch (e) { showNotification(e.message, 'error'); } 
    finally { btn.textContent = "Adicionar"; btn.disabled = false; }
};

// ARQUIVO: js/principal.js (SUBSTITUA A FUNÇÃO selecionarVeiculo ou o arquivo todo se preferir)

// ... (resto do código igual) ...

const selecionarVeiculo = async (id) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        veiculoAtual = await res.json();
        
        // Preenche Infos de Texto
        document.getElementById('info-modelo-placa').textContent = veiculoAtual.modelo;
        const donoEmail = veiculoAtual.owner.email || 'Desconhecido';
        document.getElementById('info-proprietario').textContent = `Placa: ${veiculoAtual.placa} (Dono: ${donoEmail})`;
        
        document.getElementById('info-tipo').textContent = veiculoAtual.tipo;
        document.getElementById('info-ano').textContent = veiculoAtual.ano;
        document.getElementById('info-cor').textContent = veiculoAtual.cor;

        // --- CORREÇÃO DA IMAGEM ---
        const img = document.getElementById('imagemVeiculo');
        
        // URL da Imagem de "Fallback" (Reserva) caso a original falhe
        const imagemReserva = 'https://placehold.co/600x400/EEE/31343C?text=Sem+Foto';

        if (veiculoAtual.imageUrl) {
            // 1. Corrige barras invertidas (Windows) para barras normais
            let caminhoLimpo = veiculoAtual.imageUrl.replace(/\\/g, '/');
            
            // 2. Garante que não tenha "uploads/" duplicado
            // Se o banco salvou "uploads/carro.jpg", ok. Se salvou só "carro.jpg", a gente arruma.
            if (!caminhoLimpo.includes('uploads/')) {
                caminhoLimpo = 'uploads/' + caminhoLimpo;
            }

            // 3. Monta a URL completa do Render
            // IMPORTANTE: O link da imagem NÃO leva "/api" no meio.
            // Pega a base url (https://...com) removendo o final "/api"
            const baseUrl = API_BASE_URL.replace('/api', ''); 
            img.src = `${baseUrl}/${caminhoLimpo}`;

            // 4. Se a imagem não existir (Render apagou), carrega a reserva
            img.onerror = () => {
                console.log("Imagem não encontrada no servidor (pode ter sido apagada pelo Render). Usando reserva.");
                img.src = imagemReserva;
            };
        } else {
            img.src = imagemReserva;
        }

        // --- BOTÕES E RESTO DO CÓDIGO (Igual ao anterior) ---
        const btnShare = document.getElementById('botaoCompartilharHeader');
        const btnRemove = document.getElementById('botaoRemoverHeader');
        
        const newBtnShare = btnShare.cloneNode(true);
        const newBtnRemove = btnRemove.cloneNode(true);
        btnShare.parentNode.replaceChild(newBtnShare, btnShare);
        btnRemove.parentNode.replaceChild(newBtnRemove, btnRemove);

        newBtnShare.onclick = () => compartilharVeiculo(veiculoAtual._id);
        newBtnRemove.onclick = () => removerVeiculo(veiculoAtual._id);

        document.getElementById('btn-turbo').style.display = (veiculoAtual.tipo === 'Carro Esportivo') ? 'inline-flex' : 'none';

        document.getElementById('mensagem-selecione').style.display = 'none';
        document.getElementById('painelVeiculoSelecionado').style.display = 'block';

        atualizarInterfaceControle();
        carregarManutencoes(id);
    } catch (e) { console.error(e); }
};

// ... (resto do código) ...
const compartilharVeiculo = async (id) => {
    const email = prompt("Email da pessoa (ela precisa ter conta no site):");
    if (!email) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/share`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ email })
        });

        const textResponse = await res.text();
        try {
            const data = JSON.parse(textResponse);
            if(res.ok) showNotification('Compartilhado!', 'success');
            else showNotification(data.message, 'warning');
        } catch (jsonError) {
            console.error("Erro HTML no Compartilhar:", textResponse);
            showNotification("Erro interno no servidor.", 'error');
        }
    } catch (e) { showNotification('Erro conexão.', 'error'); }
};

const removerVeiculo = async (id) => {
    if(!confirm("Tem certeza?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            showNotification('Removido.', 'info');
            document.getElementById('painelVeiculoSelecionado').style.display = 'none';
            document.getElementById('mensagem-selecione').style.display = 'block';
            carregarVeiculos();
        } else showNotification('Erro ao remover', 'error');
    } catch(e) { showNotification('Erro conexão', 'error'); }
};

// --- FUNÇÕES DE CONTROLE (Sem alterações) ---
const atualizarServidorStatus = async () => {
    if (!veiculoAtual) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/veiculos/${veiculoAtual._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ velocidade: veiculoAtual.velocidade, ligado: veiculoAtual.ligado })
    });
};

const atualizarInterfaceControle = () => {
    const btnLigar = document.getElementById('btn-ligar');
    const btnAcelerar = document.getElementById('btn-acelerar');
    const btnFrear = document.getElementById('btn-frear');
    const display = document.getElementById('valor-velocidade');
    const ponteiro = document.getElementById('ponteiro-velocidade');

    if (veiculoAtual.ligado) {
        btnLigar.textContent = "DESLIGAR"; btnLigar.className = "botao-perigo";
        btnAcelerar.disabled = false; btnFrear.disabled = false;
    } else {
        btnLigar.textContent = "LIGAR"; btnLigar.className = "botao-sucesso";
        btnAcelerar.disabled = true; btnFrear.disabled = true;
        veiculoAtual.velocidade = 0;
    }
    display.textContent = veiculoAtual.velocidade;
    const angulo = (veiculoAtual.velocidade / 220) * 180 - 90;
    ponteiro.style.transform = `rotate(${Math.min(angulo, 90)}deg)`;
};

document.getElementById('btn-ligar').onclick = () => { veiculoAtual.ligado = !veiculoAtual.ligado; atualizarInterfaceControle(); atualizarServidorStatus(); };
document.getElementById('btn-acelerar').onclick = () => { if(veiculoAtual.ligado) { veiculoAtual.velocidade += 10; atualizarInterfaceControle(); atualizarServidorStatus(); } };
document.getElementById('btn-frear').onclick = () => { if(veiculoAtual.ligado && veiculoAtual.velocidade > 0) { veiculoAtual.velocidade = Math.max(0, veiculoAtual.velocidade - 10); atualizarInterfaceControle(); atualizarServidorStatus(); } };
document.getElementById('btn-turbo').onclick = () => { if(veiculoAtual.ligado) { veiculoAtual.velocidade += 50; showNotification('TURBO!', 'warning'); atualizarInterfaceControle(); atualizarServidorStatus(); } };

// --- MANUTENÇÃO ---
const carregarManutencoes = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-manutencoes');
    ul.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/manutencoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lista = await res.json();
        ul.innerHTML = '';
        if(lista.length === 0) ul.innerHTML = '<li style="color:#777;text-align:center;">Sem manutenções.</li>';
        lista.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${m.descricaoServico}</span> <strong>R$ ${m.custo}</strong>`;
            ul.appendChild(li);
        });
    } catch(e) { ul.innerHTML = 'Erro ao carregar.'; }
};

document.getElementById('formManutencao').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button'); btn.textContent = "..."; btn.disabled = true;
    await fetch(`${API_BASE_URL}/manutencoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ descricaoServico: formData.get('descricaoServico'), custo: formData.get('custo'), veiculo: veiculoAtual._id })
    });
    e.target.reset();
    btn.textContent = "Add"; btn.disabled = false;
    carregarManutencoes(veiculoAtual._id);
};

// --- START ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formLogin').onsubmit = realizarLogin;
    document.getElementById('formRegister').onsubmit = realizarRegistro;
    document.getElementById('btnLogout').onclick = () => { localStorage.removeItem('token'); checkAuth(); };
    document.getElementById('btnAbrirModalAdicionar').onclick = () => document.getElementById('modalAdicionarVeiculo').showModal();
    document.getElementById('btnFecharModalAdicionar').onclick = () => document.getElementById('modalAdicionarVeiculo').close();
    document.getElementById('formNovoVeiculo').addEventListener('submit', adicionarVeiculo);
    checkAuth();
});