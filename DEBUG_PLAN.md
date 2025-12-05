# Plano de Caça-Fantasmas - Garagem Inteligente V3

## Prioridade Alta (Bugs Críticos e de Integridade)

- [ ] **Problema:** Excluir um veículo não exclui suas manutenções associadas no banco de dados.
  - **Hipótese:** A rota `DELETE /api/veiculos/:id` no `server.js` apaga apenas o documento do veículo, deixando os registros de manutenção "órfãos". Isso é um bug de integridade de dados.
  - **Como Investigar:**
    1.  Adicionar um `console.log` no início da rota `DELETE` no `server.js` para confirmar que ela é chamada com o ID correto.
    2.  Após a linha `Veiculo.findByIdAndDelete(id)`, adicionar uma nova lógica para deletar as manutenções: `Manutencao.deleteMany({ veiculo: id })`.
    3.  Usar `console.log` para verificar o resultado da operação `deleteMany` e confirmar que as manutenções foram removidas.

- [ ] **Problema:** A funcionalidade de Previsão do Tempo, mencionada no CSS e no `README.md`, não existe na aplicação.
  - **Hipótese:** O código HTML e JavaScript para a previsão do tempo nunca foi implementado ou foi removido, deixando o CSS e a configuração da API (`OPENWEATHER_API_KEY`) sem uso.
  - **Como Investigar:**
    1.  Verificar o arquivo `index.html` para confirmar a ausência de elementos com IDs como `secao-previsao-tempo`.
    2.  Verificar o `js/principal.js` para confirmar que não há nenhuma chamada `fetch` para uma API de clima.
    3.  **Ação Corretiva:** Como se trata de uma funcionalidade complexa, a melhor abordagem para "corrigir" é remover o código morto. Apagar as seções `#secao-previsao-tempo` do `style.css` e remover a menção à `OPENWEATHER_API_KEY` do `README.md` para alinhar a documentação com o estado real do projeto.

## Prioridade Média (Melhorias de UX e Refatoração)

- [ ] **Problema:** A única forma de editar um veículo é através de um pequeno ícone na lista da barra lateral. A interface poderia ser mais clara.
  - **Hipótese:** O design atual esconde uma funcionalidade importante. Adicionar um botão de edição mais proeminente no painel principal do veículo melhoraria a experiência do usuário.
  - **Como Investigar:**
    1.  No `index.html`, adicionar um novo botão "Editar" ao lado do botão "Remover" no cabeçalho do veículo (`.vehicle-header`).
    2.  No `js/principal.js`, criar um event listener para este novo botão que chame a função já existente `abrirModalDeEdicao(veiculoId)`.
    3.  Atualizar a função `selecionarEExibirVeiculo` para atribuir o `dataset.id` correto a este novo botão.

- [ ] **Problema:** O projeto contém uma pasta `js/models` com arquivos (`Garagem.js`, `Carro.js`, etc.) que não são utilizados pela aplicação principal (`js/principal.js`).
  - **Hipótese:** Estes arquivos são de uma versão anterior do projeto que funcionava com LocalStorage e não foram removidos após a migração para uma arquitetura full-stack (com backend). Isso é "código morto".
  - **Como Investigar:**
    1.  Analisar o `index.html` e confirmar que o único script sendo importado é o `js/principal.js`.
    2.  Verificar o `js/principal.js` e confirmar que não há `import` de nenhum arquivo da pasta `js/models`.
    3.  **Ação Corretiva:** Remover completamente a pasta `js/models` para limpar o projeto e evitar confusão.

## Prioridade Baixa (Bugs Menores e Visuais)

- [ ] **Problema:** O botão "Remover" no cabeçalho do veículo só funciona, mas não há como remover um veículo diretamente da lista principal.
  - **Hipótese:** O `handleDeletarVeiculo` já existe e funciona. O que falta é um elemento na UI da lista para acioná-lo para outros veículos que não o selecionado.
  - **Como Investigar:**
    1.  Na função `atualizarListaVeiculosSidebar` em `js/principal.js`, modificar o HTML do `<li>` para incluir um botão de remoção ao lado do de edição.
    2.  No `event listener` principal da `listaVeiculosSidebar`, adicionar uma condição que, se o alvo do clique for o novo botão de remoção (`.btn-delete`), ele chame a função `handleDeletarVeiculo(veiculoId)`.