// ARQUIVO: js/principal.js (SUBSTITUA TUDO)

// SEU RENDER
const API_BASE_URL = 'https://vinicius-yuji-miaki-iiw24a.onrender.com/api';
let veiculoAtual = null;

const showNotification = (msg, type) => {
    const area = document.getElementById('notification-area');
    document.getElementById('notification-message').textContent = msg;
    area.className = type + ' show';
    setTimeout(() => area.className = '', 4000);
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
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value })
        });
        const data = await res.json();
        if (res.ok) { localStorage.setItem('token', data.token); checkAuth(); }
        else showNotification(data.message, 'error');
    } catch (e) { showNotification('Erro conexão', 'error'); }
};

const realizarRegistro = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: document.getElementById('registerEmail').value, password: document.getElementById('registerPassword').value })
        });
        if (res.ok) { showNotification('Criado!', 'success'); document.getElementById('formRegister').reset(); }
        else showNotification('Erro.', 'error');
    } catch (e) { showNotification('Erro.', 'error'); }
};

// --- VEÍCULOS ---
const carregarVeiculos = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const veiculos = await res.json();
        const lista = document.getElementById('listaVeiculosSidebar');
        lista.innerHTML = '';
        veiculos.forEach(v => {
            const li = document.createElement('li');
            li.style.padding = '10px'; li.style.cursor = 'pointer'; li.style.borderBottom = '1px solid #eee';
            li.innerHTML = `<i class="fas fa-car"></i> ${v.modelo}`;
            li.onclick = () => selecionarVeiculo(v._id);
            lista.appendChild(li);
        });
    } catch (e) { console.error(e); }
};

// --- NOVA FUNÇÃO DE ADICIONAR (ENVIA JSON, NÃO FILE) ---
const adicionarVeiculo = async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#formNovoVeiculo button[type="submit"]');
    btn.textContent = "Salvando..."; btn.disabled = true;

    // Converte os dados do form para um objeto JSON simples
    const formData = new FormData(document.getElementById('formNovoVeiculo'));
    const dados = Object.fromEntries(formData.entries());
    
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', // Importante: JSON!
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(dados) // Envia como texto
        });

        if (!res.ok) throw new Error('Erro');
        
        document.getElementById('modalAdicionarVeiculo').close();
        document.getElementById('formNovoVeiculo').reset();
        showNotification('Veículo criado com sucesso!', 'success');
        carregarVeiculos();
    } catch (e) { showNotification('Erro ao criar.', 'error'); } 
    finally { btn.textContent = "Salvar"; btn.disabled = false; }
};

const selecionarVeiculo = async (id) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        veiculoAtual = await res.json();
        
        document.getElementById('info-modelo-placa').textContent = veiculoAtual.modelo;
        const dono = veiculoAtual.owner.email || '?';
        document.getElementById('info-proprietario').textContent = `Dono: ${dono}`;
        document.getElementById('info-detalhes').innerHTML = `Placa: ${veiculoAtual.placa} | Ano: ${veiculoAtual.ano} | Cor: ${veiculoAtual.cor} | Tipo: ${veiculoAtual.tipo}`;

        // Imagem (Agora é direto, pois salvamos o link)
        const img = document.getElementById('imagemVeiculo');
        img.src = veiculoAtual.imageUrl || 'https://placehold.co/600x400?text=Sem+Foto';

        // Botões Header
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

const compartilharVeiculo = async (id) => {
    const email = prompt("E-mail para compartilhar:");
    if(!email) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/share`, {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ email })
        });
        if(res.ok) showNotification('Sucesso!', 'success');
        else showNotification('Erro/Não encontrado', 'error');
    } catch(e) { showNotification('Erro.', 'error'); }
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
        }
    } catch(e) { showNotification('Erro.', 'error'); }
};

// Controles (Sem mudanças)
const atualizarServidorStatus = async () => {
    if (!veiculoAtual) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/veiculos/${veiculoAtual._id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

const carregarManutencoes = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-manutencoes');
    ul.innerHTML = '...';
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/manutencoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lista = await res.json();
        ul.innerHTML = '';
        lista.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${m.descricaoServico}</span> <strong>R$ ${m.custo}</strong>`;
            ul.appendChild(li);
        });
    } catch(e) { ul.innerHTML = 'Erro.'; }
};

document.getElementById('formManutencao').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    await fetch(`${API_BASE_URL}/manutencoes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ descricaoServico: formData.get('descricaoServico'), custo: formData.get('custo'), veiculo: veiculoAtual._id })
    });
    e.target.reset();
    carregarManutencoes(veiculoAtual._id);
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formLogin').onsubmit = realizarLogin;
    document.getElementById('formRegister').onsubmit = realizarRegistro;
    document.getElementById('btnLogout').onclick = () => { localStorage.removeItem('token'); checkAuth(); };
    document.getElementById('btnAbrirModalAdicionar').onclick = () => document.getElementById('modalAdicionarVeiculo').showModal();
    document.getElementById('btnFecharModalAdicionar').onclick = () => document.getElementById('modalAdicionarVeiculo').close();
    document.getElementById('formNovoVeiculo').addEventListener('submit', adicionarVeiculo);
    checkAuth();
});