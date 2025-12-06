// ARQUIVO: js/principal.js

// URL da API (Backend no Render)
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
        else showNotification(data.message || 'Erro Login', 'error');
    } catch (e) { showNotification('Erro conexão', 'error'); }
};

const realizarRegistro = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: document.getElementById('registerEmail').value, password: document.getElementById('registerPassword').value })
        });
        if (res.ok) { showNotification('Conta criada!', 'success'); document.getElementById('formRegister').reset(); }
        else showNotification('Erro no registro.', 'error');
    } catch (e) { showNotification('Erro.', 'error'); }
};

// --- VEÍCULOS ---
const carregarVeiculos = async () => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('listaVeiculosSidebar');
    ul.innerHTML = '<li>Carregando...</li>';
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const veiculos = await res.json();
        ul.innerHTML = '';
        veiculos.forEach(v => {
            const li = document.createElement('li');
            li.style = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 8px;';
            li.innerHTML = `<i class="fas fa-car-side"></i> <div><strong>${v.modelo}</strong><br><small>${v.placa}</small></div>`;
            li.onclick = () => selecionarVeiculo(v._id);
            ul.appendChild(li);
        });
    } catch (e) { console.error(e); ul.innerHTML = 'Erro de conexão'; }
};

const adicionarVeiculo = async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#formNovoVeiculo button[type="submit"]');
    btn.disabled = true; btn.innerText = 'Aguarde...';

    const formData = new FormData(document.getElementById('formNovoVeiculo'));
    const dados = Object.fromEntries(formData.entries());
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/veiculos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dados)
        });
        if(res.ok) {
            document.getElementById('modalAdicionarVeiculo').close();
            document.getElementById('formNovoVeiculo').reset();
            showNotification('Veículo adicionado!', 'success');
            carregarVeiculos();
        } else { throw new Error('Falha ao criar'); }
    } catch (e) { showNotification('Erro ao criar veículo.', 'error'); } 
    finally { btn.disabled = false; btn.innerText = 'Salvar'; }
};

const selecionarVeiculo = async (id) => {
    const token = localStorage.getItem('token');
    try {
        // Busca Detalhes
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        veiculoAtual = await res.json();
        
        // Atualiza Header
        document.getElementById('info-modelo-placa').textContent = veiculoAtual.modelo;
        const emailDono = veiculoAtual.owner.email || '?';
        document.getElementById('info-proprietario').innerText = `<small>${emailDono}</small>`;
        document.getElementById('info-detalhes').textContent = `${veiculoAtual.marca} (${veiculoAtual.ano}) - ${veiculoAtual.placa}`;

        const img = document.getElementById('imagemVeiculo');
        img.src = (veiculoAtual.imageUrl && veiculoAtual.imageUrl.startsWith('http')) 
            ? veiculoAtual.imageUrl 
            : 'https://via.placeholder.com/300x200?text=Sem+Foto';

        // Atualiza Botoes Header
        const btnShare = document.getElementById('botaoCompartilharHeader');
        const btnRemove = document.getElementById('botaoRemoverHeader');
        
        const cloneShare = btnShare.cloneNode(true);
        const cloneRemove = btnRemove.cloneNode(true);
        btnShare.parentNode.replaceChild(cloneShare, btnShare);
        btnRemove.parentNode.replaceChild(cloneRemove, btnRemove);

        cloneShare.onclick = () => compartilharVeiculo(veiculoAtual._id);
        cloneRemove.onclick = () => removerVeiculo(veiculoAtual._id);

        document.getElementById('btn-turbo').style.display = (veiculoAtual.tipo === 'Carro Esportivo') ? 'inline-flex' : 'none';

        // Mostra Painel
        document.getElementById('mensagem-selecione').style.display = 'none';
        document.getElementById('painelVeiculoSelecionado').style.display = 'block';

        // Atualiza estados
        atualizarInterfaceControle();
        carregarManutencoes(id);
        carregarViagens(id);
        
        // Por padrão abre na aba de painel
        document.querySelector('.tab-button').click(); // Clica na primeira aba

    } catch (e) { console.error(e); }
};

const removerVeiculo = async (id) => {
    if(!confirm("Tem certeza que deseja apagar este veículo e seus dados?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            showNotification('Veículo removido.', 'info');
            document.getElementById('painelVeiculoSelecionado').style.display = 'none';
            document.getElementById('mensagem-selecione').style.display = 'block';
            carregarVeiculos();
        }
    } catch(e) { showNotification('Erro ao remover.', 'error'); }
};

const compartilharVeiculo = async (id) => {
    const email = prompt("Digite o e-mail do usuário para compartilhar:");
    if(!email) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/share`, {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ email })
        });
        if(res.ok) showNotification('Compartilhado com sucesso!', 'success');
        else showNotification('Erro ou e-mail inválido.', 'error');
    } catch(e) { showNotification('Erro.', 'error'); }
};

// --- CONTROLE PAINEL ---
const atualizarInterfaceControle = () => {
    if(!veiculoAtual) return;
    const btnLigar = document.getElementById('btn-ligar');
    const display = document.getElementById('valor-velocidade');
    const ponteiro = document.getElementById('ponteiro-velocidade');
    const btns = [document.getElementById('btn-acelerar'), document.getElementById('btn-frear')];

    if(veiculoAtual.ligado) {
        btnLigar.innerText = "DESLIGAR"; btnLigar.className = "botao-perigo";
        btns.forEach(b => b.disabled = false);
    } else {
        btnLigar.innerText = "LIGAR"; btnLigar.className = "botao-sucesso";
        btns.forEach(b => b.disabled = true);
        veiculoAtual.velocidade = 0;
    }
    
    display.textContent = veiculoAtual.velocidade;
    // Calc angulo
    const angulo = (veiculoAtual.velocidade / 220) * 180 - 90; 
    ponteiro.style.transform = `rotate(${Math.min(angulo, 90)}deg)`;
};

const atualizarServidorStatus = async () => {
    if(!veiculoAtual) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/veiculos/${veiculoAtual._id}/status`, {
        method: 'PATCH', headers: {'Content-Type':'application/json', 'Authorization':`Bearer ${token}`},
        body: JSON.stringify({ ligado: veiculoAtual.ligado, velocidade: veiculoAtual.velocidade })
    });
};

document.getElementById('btn-ligar').onclick = () => { veiculoAtual.ligado = !veiculoAtual.ligado; atualizarInterfaceControle(); atualizarServidorStatus(); };
document.getElementById('btn-acelerar').onclick = () => { if(veiculoAtual.ligado) { veiculoAtual.velocidade += 10; atualizarInterfaceControle(); atualizarServidorStatus(); }};
document.getElementById('btn-frear').onclick = () => { if(veiculoAtual.ligado && veiculoAtual.velocidade > 0) { veiculoAtual.velocidade -= 10; atualizarInterfaceControle(); atualizarServidorStatus(); }};
document.getElementById('btn-turbo').onclick = () => { if(veiculoAtual.ligado) { veiculoAtual.velocidade += 50; showNotification('TURBO!!!', 'warning'); atualizarInterfaceControle(); atualizarServidorStatus(); }};

// --- MANUTENCOES ---
const carregarManutencoes = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-manutencoes');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/manutencoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lista = await res.json();
        ul.innerHTML = '';
        if(lista.length === 0) { ul.innerHTML = '<li style="color:#777; text-align:center; padding:10px;">Sem manutenções.</li>'; return; }
        
        lista.forEach(m => {
            const dataFmt = new Date(m.data).toLocaleDateString('pt-BR');
            const futuro = new Date(m.data) > new Date();
            const cor = futuro ? 'border-left: 4px solid #ffc107' : 'border-left: 4px solid #28a745';
            
            const li = document.createElement('li');
            li.style = `padding: 10px; margin-bottom:5px; background:#f9f9f9; box-shadow:0 1px 2px rgba(0,0,0,0.1); border-radius:4px; ${cor}`;
            li.innerHTML = `<div style="display:flex; justify-content:space-between;">
                <div><strong>${m.descricaoServico}</strong> <br><small>Data: ${dataFmt}</small></div>
                <div style="font-weight:bold;">R$ ${m.custo}</div>
            </div>`;
            ul.appendChild(li);
        });
    } catch(e) { console.error(e); }
};

document.getElementById('formManutencao').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const fd = new FormData(e.target);
    const dados = { descricaoServico: fd.get('descricaoServico'), custo: fd.get('custo'), data: fd.get('data'), veiculo: veiculoAtual._id };
    
    try {
        const res = await fetch(`${API_BASE_URL}/manutencoes`, {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(dados)
        });
        if(res.ok) {
            showNotification('Manutenção Agendada!', 'success');
            e.target.reset();
            carregarManutencoes(veiculoAtual._id);
        } else { showNotification('Erro ao salvar.', 'error'); }
    } catch(e) { showNotification('Erro.', 'error'); }
};

// --- CLIMA E VIAGEM ---
window.buscarClima = async () => {
    const cidade = document.getElementById('cidadeClima').value;
    if(!cidade) return showNotification("Digite a cidade", "info");
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`);
        if(!res.ok) throw new Error();
        const dados = await res.json();
        
        document.getElementById('clima-cidade').textContent = dados.name;
        document.getElementById('clima-temp').textContent = Math.round(dados.main.temp) + "°C";
        document.getElementById('clima-desc').textContent = dados.weather[0].description;
        document.getElementById('clima-icone').src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`;
        document.getElementById('resultadoClima').style.display = 'block';
        
        // Auto-preenche viagem
        document.getElementById('inputDestinoViagem').value = dados.name;
        document.getElementById('inputClimaViagem').value = `${dados.weather[0].description}, ${Math.round(dados.main.temp)}°C`;
    } catch(e) { showNotification("Erro ao buscar clima.", "error"); }
};

const carregarViagens = async (id) => {
    const token = localStorage.getItem('token');
    const ul = document.getElementById('lista-viagens');
    try {
        const res = await fetch(`${API_BASE_URL}/veiculos/${id}/viagens`, { headers: { 'Authorization': `Bearer ${token}` } });
        const viagens = await res.json();
        ul.innerHTML = '';
        if(viagens.length === 0) { ul.innerHTML = '<li style="text-align:center; padding:10px; color:#888;">Nenhuma viagem planejada.</li>'; return; }
        viagens.forEach(v => {
            const li = document.createElement('li');
            li.style = 'padding:10px; background:#f1f1f1; margin-bottom:5px; border-radius:5px; list-style:none;';
            li.innerHTML = `<strong>✈️ ${v.destino}</strong> (${new Date(v.dataIda).toLocaleDateString()}) <br> <small>${v.previsaoClima || ''}</small>`;
            ul.appendChild(li);
        });
    } catch(e){console.error(e);}
};

document.getElementById('formViagem').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const fd = new FormData(e.target);
    const dados = { destino: fd.get('destino'), dataIda: fd.get('dataIda'), descricao: fd.get('descricao'), previsaoClima: fd.get('previsaoClima'), veiculo: veiculoAtual._id };
    
    try {
        const res = await fetch(`${API_BASE_URL}/viagens`, {
            method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(dados)
        });
        if(res.ok) {
            showNotification('Boa viagem!', 'success');
            e.target.reset(); document.getElementById('resultadoClima').style.display = 'none';
            carregarViagens(veiculoAtual._id);
        } else { showNotification('Erro.', 'error'); }
    } catch(e){ showNotification('Erro.', 'error'); }
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