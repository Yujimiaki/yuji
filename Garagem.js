// js/models/Garagem.js
'use strict';

// Certifique-se que os nomes dos arquivos são: Veiculo.js, Carro.js, CarroEsportivo.js, Caminhao.js, Manutencao.js
import Veiculo from './Veiculo.js';
import Carro from './Carro.js';
import CarroEsportivo from './CarroEsportivo.js';
import Caminhao from './Caminhao.js';
import Manutencao from './Manutencao.js';

/**
 * Gerencia a coleção de veículos e o veículo atualmente selecionado.
 * É o cérebro da sua garagem virtual!
 * @class Garagem
 */
export default class Garagem {
    constructor() {
        /** @type {Array<Veiculo>} */
        this.veiculos = [];
        /** @type {string|null} */
        this.veiculoSelecionadoId = null;
    }

    /**
     * Adiciona um veículo à garagem.
     * @param {Veiculo} veiculo - A instância do veículo a ser adicionada.
     * @returns {{success: boolean, message?: string}} Objeto indicando o resultado da operação.
     * @public
     */
    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar objeto que não é um Veiculo à garagem:", veiculo);
            return { success: false, message: "Erro interno: Só veículos são permitidos aqui." };
        }
        // Verifica duplicidade por ID (improvável com IDs únicos, mas bom ter)
        if (this.veiculos.some(v => v.id === veiculo.id)) {
             console.warn(`Veículo com ID ${veiculo.id} (${veiculo.modelo}) já existe na garagem (por ID). Não será adicionado novamente.`);
             return { success: false, message: `Um veículo com este ID específico já existe.` };
        }
        // Verifica duplicidade por modelo e cor (mais provável para o usuário)
        if (this.veiculos.some(v => v.modelo.toLowerCase() === veiculo.modelo.toLowerCase() && v.cor.toLowerCase() === veiculo.cor.toLowerCase())) {
            console.warn(`Um veículo ${veiculo.modelo} ${veiculo.cor} já existe na garagem.`);
            return { success: false, message: `Já existe um ${veiculo.modelo} ${veiculo.cor} na garagem. Que tal variar um pouco?` };
        }

        this.veiculos.push(veiculo);
        console.log(`🚗 Veículo ${veiculo.modelo} (ID: ${veiculo.id}, Tipo: ${veiculo.constructor.name}) adicionado à garagem!`);
        // Mantém a lista de veículos ordenada alfabeticamente pelo modelo
        this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
        return { success: true };
    }

    /**
     * Remove um veículo da garagem pelo seu ID.
     * @param {string} idVeiculo - O ID do veículo a remover.
     * @returns {boolean} True se o veículo foi removido com sucesso, false caso contrário.
     * @public
     */
    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0]; // Remove o veículo
            console.log(`💨 Veículo ${removido.modelo} (ID: ${idVeiculo}) removido da garagem.`);
            // Se o veículo removido era o selecionado, limpa a seleção
            if (this.veiculoSelecionadoId === idVeiculo) {
                this.veiculoSelecionadoId = null;
                 localStorage.removeItem('garagemVeiculoSelecionadoId'); // Limpa do LocalStorage também
                 console.log("Seleção de veículo limpa, pois o veículo selecionado foi removido.");
            }
            return true;
        }
        console.warn(`Veículo com ID ${idVeiculo} não encontrado. Nada foi removido.`);
        return false;
    }

    /**
     * Encontra e retorna um veículo na garagem pelo seu ID.
     * @param {string} idVeiculo - O ID do veículo a ser procurado.
     * @returns {Veiculo|undefined} O veículo encontrado, ou undefined se não existir.
     * @public
     */
    encontrarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }

    /**
     * Define o veículo atualmente selecionado na garagem.
     * @param {string|null} idVeiculo - O ID do veículo a selecionar, ou null para limpar a seleção.
     * @returns {boolean} True se a seleção foi alterada ou confirmada, false se o veículo não foi encontrado.
     * @public
     */
    selecionarVeiculo(idVeiculo) {
         if (idVeiculo === null) { // Limpar seleção
             if (this.veiculoSelecionadoId !== null) { // Só limpa se havia algo selecionado
                 this.veiculoSelecionadoId = null;
                 console.log("Nenhum veículo selecionado.");
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
                 return true; // A seleção mudou (para nulo)
             }
             return false; // Já estava nulo, nenhuma mudança
         }

         const veiculoEncontrado = this.encontrarVeiculo(idVeiculo);
         if (veiculoEncontrado) {
             if (this.veiculoSelecionadoId !== idVeiculo) { // Só atualiza se for um ID diferente
                 this.veiculoSelecionadoId = idVeiculo;
                 console.log(`🔎 Veículo selecionado: ${veiculoEncontrado.modelo} (ID: ${idVeiculo})`);
                 localStorage.setItem('garagemVeiculoSelecionadoId', idVeiculo); // Salva no LocalStorage
                 return true; // Seleção alterada
             }
             return true; // Já estava selecionado, apenas confirma a seleção
         } else {
             console.warn(`Tentativa de selecionar veículo com ID inválido ou não existente: ${idVeiculo}. Limpando seleção se houver.`);
             // Se tentou selecionar um ID inválido, e algo estava selecionado, limpa a seleção.
             if(this.veiculoSelecionadoId !== null){
                this.veiculoSelecionadoId = null;
                localStorage.removeItem('garagemVeiculoSelecionadoId');
                return true; // Seleção mudou (para nulo)
             }
             return false; // Não encontrou o veículo e a seleção já era nula
         }
    }

    /**
     * Retorna a instância do veículo atualmente selecionado.
     * @returns {Veiculo|null} O veículo selecionado, ou null se nenhum estiver selecionado.
     * @public
     */
    getVeiculoSelecionado() {
        if (!this.veiculoSelecionadoId) return null;
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }

    /**
     * Salva o estado atual da lista de veículos no LocalStorage do navegador.
     * Converte cada veículo para JSON antes de salvar.
     * @returns {void}
     * @public
     */
    salvarNoLocalStorage() {
        try {
            const garagemParaSalvar = this.veiculos.map(v => v.toJSON());
            const garagemJSON = JSON.stringify(garagemParaSalvar);
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
            // console.log(`💾 Garagem salva no LocalStorage com ${this.veiculos.length} veículo(s).`);
        } catch (error) {
            console.error("☠️ ERRO CRÍTICO ao salvar a garagem no LocalStorage:", error);
            alert("ALERTA! Não consegui salvar seus preciosos veículos no LocalStorage. Suas últimas alterações podem ter se perdido no limbo digital! Verifique o console (F12).");
        }
    }

    /**
     * Carrega os dados dos veículos do LocalStorage e recria as instâncias das classes corretas.
     * @returns {Array<Veiculo>} Uma lista de instâncias de Veiculo recriadas.
     * @static
     * @public
     */
    static carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        const veiculosCarregados = [];

        if (!garagemJSON) {
             console.log("💾 Nenhum dado de garagem encontrado no LocalStorage. Começando do zero!");
             return veiculosCarregados; // Retorna array vazio
        }

        try {
            const veiculosSalvos = JSON.parse(garagemJSON);

            veiculosSalvos.forEach(obj => {
                try {
                    if (!obj || !obj._tipoClasse) { // Validação básica do objeto salvo
                        console.warn("Objeto de veículo inválido ou sem _tipoClasse encontrado no LocalStorage. Pulando:", obj);
                        return; // Pula este objeto defeituoso
                    }

                    let veiculo = null;
                    let historicoRecriado = [];

                    // Recria o histórico de manutenções
                    if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                       historicoRecriado = obj.historicoManutencao
                        .map(mObj => {
                            if (mObj && mObj._tipoClasse === 'Manutencao') { // Verifica se é um objeto de Manutencao
                                try {
                                    const manut = new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                    // Restaura o ID original da manutenção para consistência na remoção.
                                    if(mObj.id) manut.id = mObj.id;
                                    return manut.isValidDate() ? manut : null; // Só adiciona se a data for válida
                                } catch(manutError) {
                                    console.error("Erro ao recriar Manutencao a partir do JSON:", mObj, manutError);
                                    return null; // Descarta manutenção inválida
                                }
                            }
                            console.warn("Objeto de manutenção inválido encontrado no histórico:", mObj);
                            return null;
                        })
                        .filter(m => m !== null); // Remove quaisquer nulos que possam ter sido retornados

                       // Ordena as manutenções recriadas pela data (mais recentes primeiro)
                       historicoRecriado.sort((a, b) => b.data.getTime() - a.data.getTime());
                    }

                    // Recria a instância do Veiculo correto baseado no _tipoClasse
                    switch (obj._tipoClasse) {
                        case 'Carro':
                            veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                            break;
                        case 'CarroEsportivo':
                            veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                            break;
                        case 'Caminhao':
                            veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                            break;
                        default:
                            console.warn(`Tipo de veículo desconhecido ('${obj._tipoClasse}') encontrado no LocalStorage. Não foi possível recriar o objeto:`, obj);
                    }

                    if (veiculo) {
                        veiculo.historicoManutencao = historicoRecriado;
                        // Adiciona à lista apenas se não houver outro com o mesmo ID (prevenção extra)
                        if (!veiculosCarregados.some(v => v.id === veiculo.id)) {
                            veiculosCarregados.push(veiculo);
                        } else {
                            console.warn(`Veículo duplicado (ID: ${veiculo.id}, Modelo: ${veiculo.modelo}) detectado durante carregamento do LocalStorage. Não foi adicionado novamente.`);
                        }
                    }
                 } catch (veiculoError) { // Erro ao processar um veículo individual
                      console.error(`Erro ao carregar ou recriar um veículo do LocalStorage (ID: ${obj?.id}, Tipo: ${obj?._tipoClasse}):`, veiculoError, "Objeto original:", obj);
                 }
            });

             // Ordena a lista final de veículos carregados pelo modelo
             veiculosCarregados.sort((a, b) => a.modelo.localeCompare(b.modelo));
             console.log(`⚙️ ${veiculosCarregados.length} veículo(s) carregado(s) e tunado(s) do LocalStorage!`);
             return veiculosCarregados;

        } catch (error) { // Erro ao parsear o JSON principal da garagem
            console.error("☠️ ERRO CRÍTICO ao carregar ou parsear dados da garagem do LocalStorage:", error);
            alert("ALERTA CATASTRÓFICO! Os dados da sua garagem no LocalStorage parecem ter sido abduzidos por aliens (ou estão corrompidos). Resetando para uma garagem vazia. Cheque o console (F12) para o relatório forense.");
            localStorage.removeItem('minhaGaragemVirtual'); // Limpa os dados corrompidos
            localStorage.removeItem('garagemVeiculoSelecionadoId');
            return []; // Retorna um array vazio em caso de erro crítico
        }
    }

    /**
     * Verifica agendamentos de manutenção próximos (por padrão, nos próximos 2 dias).
     * Ideal para notificações amigáveis ao usuário.
     * @param {number} [diasAntecedencia=2] - Número de dias de antecedência para considerar "próximo".
     * @returns {Array<string>} Uma lista de mensagens de notificação formatadas para agendamentos próximos.
     * @public
     */
    verificarAgendamentosProximos(diasAntecedencia = 2) {
        const agora = new Date();
        // Define o início do dia de hoje para comparações justas
        const inicioDoDiaDeHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

        const diasEmMillis = diasAntecedencia * 24 * 60 * 60 * 1000;
        // Define o limite como o final do N-ésimo dia a partir de hoje
        const limiteData = new Date(inicioDoDiaDeHoje.getTime() + diasEmMillis + (24 * 60 * 60 * 1000 - 1)); // Inclui o dia inteiro

        let notificacoesParaMostrar = [];

        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                // Considera apenas agendamentos válidos, futuros ou de hoje, dentro do limite
                if (manutencao.isValidDate() && manutencao.data >= inicioDoDiaDeHoje && manutencao.data <= limiteData) {
                    const diffMillis = manutencao.data.getTime() - agora.getTime(); // Diferença para o momento exato atual
                    const diffHorasTotal = Math.floor(diffMillis / (1000 * 60 * 60));
                    const diffDias = Math.floor(diffMillis / (1000 * 60 * 60 * 24)); // Dias completos restantes

                    let tempoRestanteStr = "";
                    const dataAgendamento = manutencao.data;

                    if (dataAgendamento.toDateString() === agora.toDateString()) { // Se for HOJE
                        if (diffMillis < 0) {
                           // Já passou hoje, não notificar a menos que seja uma regra de "atrasado"
                        } else if (diffMillis < 30 * 60 * 1000) tempoRestanteStr = "em MENOS DE 30 MINUTOS ⏳";
                        else if (diffMillis < 60 * 60 * 1000) tempoRestanteStr = "em MENOS DE 1 HORA ⏱️";
                        else tempoRestanteStr = `HOJE (~${Math.max(1,Math.round(diffMillis / (1000 * 60 * 60)))}h) 🗓️`;
                    } else if (diffDias === 0 && dataAgendamento > agora ) { // Agendado para as próximas horas, mas já virou o dia
                         tempoRestanteStr = `nas PRÓXIMAS ${Math.max(1,diffHorasTotal)} HORAS 🌙`;
                    } else if (diffDias >= 0) { // Amanhã ou depois (dentro do limite)
                         tempoRestanteStr = `em ${diffDias + 1} dia(s) 🗓️`;
                         if(diffDias === 0 && dataAgendamento > agora) tempoRestanteStr = `AMANHÃ 🌅`; // Se for amanhã
                    } else {
                        return; // Já passou de dias anteriores (deve ser pego pelo histórico)
                    }

                    if (!tempoRestanteStr) return; // Se não conseguiu formatar o tempo, pula

                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    notificacoesParaMostrar.push({
                        data: manutencao.data, // Para ordenação
                        msg: `📣 Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} ${tempoRestanteStr} (${dataFormatada}). Prepare a máquina!`
                    });
                }
            });
        });

        // Ordena as notificações pela data do agendamento (mais próximos primeiro)
        notificacoesParaMostrar.sort((a, b) => a.data.getTime() - b.data.getTime());

        if (notificacoesParaMostrar.length > 0) {
            console.log(`[Agendamentos] ${notificacoesParaMostrar.length} alerta(s) de manutenção próxima na área!`);
        }
        return notificacoesParaMostrar.map(n => n.msg);
    }
}