import { carregarAtividades, excluirAtividade, getCurrentUser, signOut, getTurmasDoEducador, atribuirAtividadeTurma } from './database.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log("Script do Catálogo do Educador carregado.");

    const btnCriar = document.getElementById('add-lesson-btn');
    const btnExcluirGeral = document.getElementById('delete-lesson-btn');
    const btnLogout = document.getElementById('logout-btn');
    const lessonGrid = document.querySelector('.lesson-grid');

    // --- VERIFICAR AUTENTICAÇÃO DO EDUCADOR ---
    const session = await getCurrentUser();
    if (!session || !session.user) {
        console.log("Nenhum educador logado, redirecionando para a página de login.");
        window.location.href = 'educator-login.html';
        return; // Interrompe a execução do script
    } else {
        console.log("Educador logado:", session.user.email);
    }

    // --- LÓGICA DO BOTÃO DE LOGOUT ---
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    if (lessonGrid) {
        // --- CARREGAR E EXIBIR ATIVIDADES DO SUPABASE ---
        lessonGrid.innerHTML = '<p>Carregando atividades...</p>'; // Feedback para o usuário
        const atividadesSalvas = await carregarAtividades();

        lessonGrid.innerHTML = ''; // Limpa a mensagem de "carregando"

        atividadesSalvas.forEach(atividade => {
            console.log(`[Catálogo] Criando cartão para: "${atividade.titulo}"`);
            const novoCartao = document.createElement('a');
            novoCartao.href = `activity-detail.html?id=${atividade.id}`; // Link principal para visualização
            novoCartao.classList.add('lesson-card', 'dynamic-card');
            novoCartao.style.position = 'relative'; // Necessário para o ícone de edição
            novoCartao.innerHTML = `
                <div class="card-actions">
                    <a href="edit-activity.html?id=${atividade.id}" class="edit-icon" title="Editar Atividade">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </a>
                    <button class="publish-icon action-icon" data-id="${atividade.id}" data-title="${atividade.titulo}" title="Atribuir à Turma">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                            <polyline points="16 6 12 2 8 6"></polyline>
                            <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                    </button>
                    <button class="delete-icon" data-id="${atividade.id}" title="Excluir Atividade">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <img src="${atividade.imagem_url || 'https://placehold.co/400x300/EFEFEF/333?text=Nova+Lição'}" alt="Capa da lição ${atividade.titulo}">
                <span class="lesson-title">${atividade.titulo}</span>
            `;
            // Impede que o clique nos ícones de ação propague para o link do cartão principal
            novoCartao.querySelector('.card-actions').addEventListener('click', (e) => e.stopPropagation());

            // Adiciona o evento de clique para o botão de excluir
            const btnExcluirCartao = novoCartao.querySelector('.delete-icon');
            btnExcluirCartao.addEventListener('click', function(event) {
                event.preventDefault(); // Previne a navegação do link <a> pai
                const activityId = this.dataset.id;
                const activityTitle = atividade.titulo; // Usa o título da atividade atual no loop
                confirmarExclusao(activityId, activityTitle, novoCartao);
            });

            // Adiciona o evento de clique para o botão de publicar
            const btnPublicar = novoCartao.querySelector('.publish-icon');
            btnPublicar.addEventListener('click', function(event) {
                event.preventDefault();
                const activityId = this.dataset.id;
                const activityTitle = this.dataset.title;
                abrirModalPublicacao(activityId, activityTitle);
            });

            lessonGrid.appendChild(novoCartao);
        });
    } else {
         console.warn("[Catálogo] AVISO: Grid (.lesson-grid) não encontrado.");
    }

    // --- Lógica dos Botões de Ação ---
    if (btnCriar) {
        btnCriar.addEventListener('click', function () {
            console.log("[Catálogo] Botão Criar clicado.");
            // Leva para activity-detail.html SEM ID para indicar modo CRIAÇÃO
            window.location.href = 'activity-detail.html'; 
        });
    } else {
        console.warn("[Catálogo] AVISO: Botão Criar (add-lesson) não encontrado.");
    }

    if (btnExcluirGeral) {
        // A lógica do botão de exclusão geral foi movida para os ícones individuais.
        // Podemos esconder ou remover este botão se não tiver mais uso.
        btnExcluirGeral.style.display = 'none';
    } else {
        console.warn("[Catálogo] AVISO: Botão Excluir (delete-lesson) não encontrado.");
    }

    // --- FUNÇÃO DE EXCLUSÃO ---
    function confirmarExclusao(id, titulo, cardElement) {
        // 1. Criar os elementos do modal dinamicamente
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'confirm-modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'confirm-modal-content';
        modalContent.innerHTML = `
            <h3>Excluir Atividade</h3>
            <p>Deseja realmente excluir a atividade "<strong>${titulo}</strong>"?<br>Essa ação não pode ser desfeita.</p>
            <div class="confirm-modal-actions">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-confirm-delete">Sim, Excluir</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // 2. Adicionar a classe para mostrar o modal com transição
        setTimeout(() => modalOverlay.classList.add('visible'), 10);

        // 3. Funções de controle do modal
        const btnConfirmar = modalContent.querySelector('.btn-confirm-delete');
        const btnCancelar = modalContent.querySelector('.btn-cancel');

        const fecharModal = () => {
            modalOverlay.classList.remove('visible');
            // Remove o elemento do DOM após a transição de fade-out
            modalOverlay.addEventListener('transitionend', () => modalOverlay.remove(), { once: true });
        };

        // 4. Lógica de exclusão ao confirmar
        btnConfirmar.addEventListener('click', async () => {
            console.log(`[Exclusão] Confirmado para ID: ${id}`);
            const { error } = await excluirAtividade(id);

            if (error) {
                console.error(`[Exclusão] Erro ao excluir atividade com ID ${id}:`, error);
                alert(`Erro ao excluir a atividade: ${error.message}`);
            } else {
                cardElement.remove(); // Remove o cartão da tela
                console.log(`[Exclusão] Atividade "${titulo}" removida com sucesso.`);
            }
            fecharModal();
        });

        // 5. Apenas fecha o modal ao cancelar
        btnCancelar.addEventListener('click', fecharModal);
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });
    }

    // --- FUNÇÃO DE POP-UP DE SUCESSO GENÉRICA ---
    function mostrarPopupSucesso(titulo, mensagem, callback) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'confirm-modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'confirm-modal-content success-popup-content'; // Adiciona classe específica
        modalContent.innerHTML = `
            <div class="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3>${titulo}</h3>
            <p>${mensagem}</p>
            <div class="confirm-modal-actions">
                <button class="btn-ok">OK</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        setTimeout(() => modalOverlay.classList.add('visible'), 10);

        const fecharEExecutarCallback = () => {
            modalOverlay.classList.remove('visible');
            modalOverlay.addEventListener('transitionend', () => {
                modalOverlay.remove();
                if (callback) callback(); // Executa o callback após fechar
            }, { once: true });
        };

        modalContent.querySelector('.btn-ok').addEventListener('click', fecharEExecutarCallback);
    }

    // --- FUNÇÃO DE PUBLICAÇÃO ---
    async function abrirModalPublicacao(activityId, activityTitle) {
        const turmas = await getTurmasDoEducador();

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'confirm-modal-overlay visible'; // Já inicia visível

        const modalContent = document.createElement('div');
        modalContent.className = 'confirm-modal-content';

        let turmasHtml = '<p>Nenhuma turma encontrada. Crie uma turma primeiro.</p>';
        if (turmas && turmas.length > 0) {
            turmasHtml = turmas.map(turma => `
                <label class="turma-checkbox">
                    <input type="checkbox" name="turma" value="${turma.id}">
                    <span>${turma.nome_turma} (${turma.ano_escolar})</span>
                </label>
            `).join('');
        }

        modalContent.innerHTML = `
            <h3>Atribuir Atividade</h3>
            <p>Selecione as turmas que receberão a atividade "<strong>${activityTitle}</strong>":</p>
            <div class="turmas-list">${turmasHtml}</div>
            <div class="confirm-modal-actions">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-confirm-publish">Atribuir</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        const fecharModal = () => modalOverlay.remove();

        modalContent.querySelector('.btn-cancel').addEventListener('click', fecharModal);
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });

        modalContent.querySelector('.btn-confirm-publish').addEventListener('click', async () => {
            const checkboxes = modalContent.querySelectorAll('input[name="turma"]:checked');
            const turmasIds = Array.from(checkboxes).map(cb => cb.value);

            if (turmasIds.length === 0) {
                alert("Por favor, selecione pelo menos uma turma.");
                return;
            }

            // O Promise.all executa todas as atribuições em paralelo
            const promises = turmasIds.map(turmaId => atribuirAtividadeTurma(turmaId, activityId));
            
            try {
                await Promise.all(promises);
                // Substitui o alert pelo novo pop-up de sucesso
                mostrarPopupSucesso(
                    "Atividade Atribuída!",
                    `A atividade "${activityTitle}" foi atribuída com sucesso às turmas selecionadas.`
                );
                fecharModal(); // Fecha o modal de seleção de turmas
            } catch (error) {
                console.error("Erro ao atribuir atividade:", error);
                alert("Ocorreu um erro ao atribuir a atividade. Verifique o console para mais detalhes.");
            }
        });
    }


    async function handleLogout() {
        await signOut();
        window.location.href = 'index.html'; // Redireciona para a página inicial após o logout
    }
}); // Fim do DOMContentLoaded