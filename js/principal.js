// ARQUIVO: js/principal.js
const API_BASE_URL = 'https://vinicius-yuji-miaki-iiw24a.onrender.com/api'; 
const WEATHER_API_KEY = '569ee28c1908ad6eaadb431e635166be'; 

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
    const dados = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error('Erro');
        
        document.getElementById('modalAdicionarVeiculo').close();
        document.getElementById('formNovoVeiculo').reset();
        showNotification('Veículo adicionado!', 'success');
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
        document.getElementById('info-detalhes').textContent = `${veiculoAtual.tipo} - ${veiculoAtual.marca} (${veiculoAtual.ano}) - Placa: ${veiculoAtual.placa}`;

        const img = document.getElementById('imagemVeiculo');
        img.src = veiculoAtual.imageUrl && veiculoAtual.imageUrl.trim() !== "" ? veiculoAtual.imageUrl : 'https://via.placeholder.com/300x200?text=Sem+Foto';

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
        
        // Carrega as abas extras
        carregarManutencoes(id);
        carregarViagens(id);

    } catch (e) { console.error(e); }
};

const removerVeiculo = async (id) => {
    if(!confirm("Remover este veículo?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            showNotification('Removido.', 'info');
            document.getElementById('painelVeiculoSelecionado').style.display = 'none';
            document.getElementById('mensagem-selecione').style.display = 'block';
            carregarVeiculos();
        }
    } catch(e) { showNotification('Erro.', 'error'); }
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
        if(res.ok) showNotification('Compartilhado!', 'success');
        else showNotification('Erro.', 'error');
    } catch(e) { showNotification('Erro.', 'error'); }
};

// --- PAINEL ---
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

// --- MANUTENÇÕES ---
const carregarManutencoes = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-manutencoes');
    ul.innerHTML = '<li>Carregando...</li>';
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/manutencoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lista = await res.json();
        ul.innerHTML = '';
        if(lista.length === 0) { ul.innerHTML = '<li style="color:#777; padding:10px;">Sem manutenções.</li>'; return; }
        lista.forEach(m => {
            const dataFmt = new Date(m.data).toLocaleDateString('pt-BR');
            const isFuturo = new Date(m.data) > new Date();
            const estilo = isFuturo ? 'border-left: 4px solid orange; background:#fff8e1;' : 'border-left: 4px solid green;';
            const li = document.createElement('li');
            li.style = `padding: 10px; margin-bottom: 5px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 4px; display:flex; justify-content:space-between; ${estilo}`;
            li.innerHTML = `<div><strong>${m.descricaoServico}</strong> <br><small>Data: ${dataFmt}</small></div><div style="font-weight:bold;">R$ ${m.custo}</div>`;
            ul.appendChild(li);
        });
    } catch(e) { ul.innerHTML = 'Erro ao carregar.'; }
};

document.getElementById('formManutencao').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    try {
        const res = await fetch(`${API_BASE_URL}/manutencoes`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ descricaoServico: formData.get('descricaoServico'), custo: formData.get('custo'), data: formData.get('data'), veiculo: veiculoAtual._id })
        });
        if(res.ok) { showNotification('Salvo!', 'success'); e.target.reset(); carregarManutencoes(veiculoAtual._id); }
        else throw new Error();
    } catch(err) { showNotification('Erro ao salvar.', 'error'); }
};

// --- VIAGENS E CLIMA ---
window.buscarClima = async () => {
    const cidade = document.getElementById('cidadeClima').value;
    if(!cidade) return showNotification("Digite cidade", "error");
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`);
        if(!res.ok) throw new Error();
        const dados = await res.json();
        
        document.getElementById('clima-cidade').textContent = `${dados.name}`;
        document.getElementById('clima-temp').textContent = `${Math.round(dados.main.temp)}°C`;
        document.getElementById('clima-desc').textContent = dados.weather[0].description;
        document.getElementById('clima-icone').src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`;
        document.getElementById('resultadoClima').style.display = 'block';

        document.getElementById('inputDestinoViagem').value = dados.name;
        document.getElementById('inputClimaViagem').value = `${dados.weather[0].description}, ${Math.round(dados.main.temp)}°C`;
    } catch (error) { showNotification("Erro API Clima.", "error"); }
};

const carregarViagens = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-viagens');
    ul.innerHTML = '<li>Carregando...</li>';
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/viagens`, { headers: {'Authorization': `Bearer ${token}`} });
        const viagens = await res.json();
        ul.innerHTML = '';
        if(viagens.length === 0) { ul.innerHTML = '<li style="padding:10px; color:#888;">Nenhuma viagem.</li>'; return; }
        viagens.forEach(v => {
            const dataFmt = new Date(v.dataIda).toLocaleDateString('pt-BR');
            const li = document.createElement('li');
            li.style = 'background: #f1f1f1; padding:10px; margin-bottom:8px; border-radius:5px; border-left: 4px solid #007bff; list-style:none;';
            li.innerHTML = `<strong>${v.destino}</strong> (${dataFmt}) <br><small>Clima: ${v.previsaoClima || '?'}</small> <span style="font-style:italic">"${v.descricao}"</span>`;
            ul.appendChild(li);
        });
    } catch(e) { ul.innerHTML = 'Erro.'; }
};

document.getElementById('formViagem').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    try {
        const res = await fetch(`${API_BASE_URL}/viagens`, {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ destino: formData.get('destino'), dataIda: formData.get('dataIda'), descricao: formData.get('descricao'), previsaoClima: formData.get('previsaoClima'), veiculo: veiculoAtual._id })
        });
        if(res.ok) { showNotification('Viagem Salva!', 'success'); e.target.reset(); document.getElementById('resultadoClima').style.display = 'none'; carregarViagens(veiculoAtual._id); }
        else throw new Error();
    } catch(e) { showNotification('Erro.', 'error'); }
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