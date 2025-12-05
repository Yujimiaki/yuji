# Garagem Virtual V3

## Descrição
... (sua descrição existente) ...

## Deploy

*   **Frontend**: A aplicação frontend está publicada em: `[COLOQUE AQUI A URL DO SEU FRONTEND PUBLICADO, SE HOUVER]`
    *   Se estiver rodando apenas localmente: "O frontend pode ser executado localmente abrindo o `index.html` com uma extensão como Live Server (VS Code) ou um servidor HTTP simples."
*   **Backend**: O servidor backend Node.js/Express está publicado na plataforma Render.com.
    *   URL Pública do Backend: `[COLOQUE AQUI A SUA URL PÚBLICA DO RENDER.COM]`
    *   A variável de ambiente `OPENWEATHER_API_KEY` foi configurada diretamente no painel do Render.com para segurança.

## Tecnologias Utilizadas
... (sua lista existente) ...
*   Node.js
*   Express.js
*   Render.com (para deploy do backend)

## Como Executar o Projeto

**Para rodar localmente:**

1.  **Backend (Servidor Node.js):**
    *   Clone este repositório.
    *   Navegue até a pasta raiz do projeto no terminal.
    *   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo, substituindo `SUA_CHAVE_AQUI` pela sua chave da OpenWeatherMap:
        ```
        OPENWEATHER_API_KEY=6dacf82d5af7c058dc2b4bde9bfe765a
        ```
    *   Instale as dependências: `npm install`
    *   Inicie o servidor backend: `node server.js`
    *   O backend estará rodando em `http://localhost:3001` (ou a porta definida em `process.env.PORT`).

2.  **Frontend (Interface da Garagem):**
    *   Abra o arquivo `index.html` em seu navegador. É recomendado usar uma extensão como "Live Server" no VS Code ou um servidor HTTP simples para evitar problemas com módulos ES6 (`file:///` pode não funcionar corretamente).
    *   **Observação**: Para desenvolvimento local, o `js/principal.js` pode estar configurado para apontar para `http://localhost:3001`. Para usar a versão publicada do backend, ele deve apontar para a URL do Render.


oi vagner
umrgwBil1EIYrX6F
...(resto do seu README)...