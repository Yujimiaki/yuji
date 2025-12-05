// js/utils/notificacoes.js
'use strict';

/**
 * Referência para o timeout da notificação atual, para poder cancelá-lo.
 * @type {number|null}
 * @private
 */
let notificationTimeout = null;

/**
 * Exibe uma mensagem de notificação na área designada da UI.
 * Remove qualquer notificação anterior antes de exibir a nova.
 *
 * @param {string} message - A mensagem a ser exibida.
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - O tipo de notificação (controla a cor/estilo CSS).
 * @param {number} [duration=4000] - Duração em milissegundos que a notificação ficará visível.
 * @param {object} uiElements - Objeto contendo referências aos elementos da UI.
 * @param {HTMLElement | null} uiElements.notificationArea - O elemento container da notificação.
 * @param {HTMLElement | null} uiElements.notificationMessage - O elemento onde o texto da mensagem será inserido.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function showNotification(message, type = 'info', duration = 4000, uiElements) {
    // Validação dos elementos da UI necessários
    if (!uiElements?.notificationArea || !uiElements?.notificationMessage) {
        console.warn("showNotification: Elementos da UI de notificação não encontrados ou não fornecidos.", uiElements);
        alert(`Notificação (${type}): ${message}`); // Fallback para alert caso a UI não esteja pronta
        return;
    }

    // Cancela timeout anterior, se existir, para evitar sobreposição ou fechamento prematuro
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    // Define a mensagem e as classes CSS para estilização e animação
    uiElements.notificationMessage.textContent = message;
    uiElements.notificationArea.className = 'notification'; // Reseta para a classe base
    uiElements.notificationArea.classList.add(type, 'show'); // Adiciona tipo e classe 'show' para ativar CSS
    uiElements.notificationArea.style.display = 'flex'; // Garante visibilidade (CSS pode ter 'display: none' inicialmente)

    // Define um timeout para esconder a notificação automaticamente após a duração especificada
    notificationTimeout = setTimeout(() => {
        hideNotification(uiElements);
    }, duration);
}

/**
 * Esconde a área de notificação da UI.
 * Inicia uma animação de fade-out (se definida no CSS) e depois esconde o elemento.
 *
 * @param {object} uiElements - Objeto contendo referência à área de notificação.
 * @param {HTMLElement | null} uiElements.notificationArea - O elemento container da notificação.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function hideNotification(uiElements) {
    if (!uiElements?.notificationArea) {
        // console.warn("hideNotification: Elemento da área de notificação não encontrado ou não fornecido.");
        return; // Não faz nada se o elemento não existe ou não foi passado
    }

    // Remove a classe 'show' para iniciar a animação de fade-out (transição definida no CSS)
    uiElements.notificationArea.classList.remove('show');

    // Usa um timeout um pouco maior que a transição CSS para realmente esconder o elemento (display: none)
    // e resetar suas classes, evitando que uma nova notificação rápida herde o tipo antigo
    // ou que o elemento permaneça ocupando espaço invisivelmente.
    const transitionDurationCSS = 400; // Duração da transição 'opacity' e 'transform' no CSS (0.4s)
                                       // Ajuste este valor se a duração da transição no seu CSS for diferente.
    setTimeout(() => {
         // Verifica se a classe 'show' não foi readicionada enquanto esperava (ex: uma nova notificação chamou showNotification).
         // Se 'show' não estiver presente, significa que a notificação deve realmente ser escondida.
         if (!uiElements.notificationArea.classList.contains('show')) {
             uiElements.notificationArea.style.display = 'none'; // Esconde completamente o elemento do layout
             uiElements.notificationArea.className = 'notification'; // Reseta para a classe base, removendo classes de tipo (info, error, etc.)
         }
    }, transitionDurationCSS + 50); // Adiciona uma pequena margem para garantir que a transição CSS termine.

    // Limpa a referência do timeout global, caso hideNotification seja chamada manualmente (ex: pelo botão de fechar)
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null; // Define como nulo para indicar que não há timeout ativo para auto-esconder.
    }
}

// Exporta as funções para serem usadas em outros módulos
export { showNotification, hideNotification };