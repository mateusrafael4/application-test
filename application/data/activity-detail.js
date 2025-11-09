import { criarAtividade, getAtividadePorId, uploadImagemAtividade } from './database.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log("Script da Página de Detalhe/Criação carregado.");

    // --- LÓGICA PRINCIPAL: DECIDIR ENTRE MODO CRIAÇÃO E VISUALIZAÇÃO ---
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('id');

    // Elementos da página
    const creationModeContent = document.getElementById('creation-mode-content');
    const viewModeContent = document.getElementById('view-mode-content');
    const activityTitleEl = document.getElementById('activity-title');
    const activityInstructionEl = document.getElementById('activity-instruction');

    // --- LÓGICA DO BOTÃO VOLTAR ---
    // Ajusta o link do botão "Voltar" para a página correta (aluno ou educador)
    const btnVoltar = document.querySelector('.btn-voltar');
    if (btnVoltar) {
        // Verifica se a página anterior era a do catálogo do aluno
        if (document.referrer && document.referrer.includes('student-activities-collection.html')) {
            btnVoltar.href = 'student-activities-collection.html';
            console.log("Botão 'Voltar' ajustado para o catálogo do aluno.");
        }
    }

    if (!activityId) {
        // --- MODO CRIAÇÃO ---
        console.log("Modo Criação detectado (sem ID na URL).");
        const createActivityForm = document.getElementById('create-activity-form');

        const successPopup = document.getElementById('success-popup');
        const closePopupButton = document.getElementById('close-popup');
        const popupOkButton = document.getElementById('popup-ok-btn');

        // Configura a interface para o modo de criação
        activityTitleEl.textContent = 'Criar Nova Atividade';
        activityInstructionEl.textContent = 'Preencha os campos abaixo para adicionar uma nova lição.';
        if (creationModeContent) creationModeContent.style.display = 'block';
        if (viewModeContent) viewModeContent.style.display = 'none';

        // --- LÓGICA DO UPLOAD DE ARQUIVO ---
        const uploader = document.getElementById('image-drop-zone'); // Corrigido ID
        const fileInput = document.getElementById('lesson-image-upload'); // Corrigido ID
        const filePreview = document.getElementById('file-preview');
        const previewImage = document.getElementById('preview-image');
        const previewFilename = document.getElementById('preview-filename'); // Corrigido ID
        const removeFileBtn = document.getElementById('remove-file-btn');
        const fileBrowserLink = document.querySelector('.file-browser-link');
        const dropZoneText = document.getElementById('drop-zone-text'); // Novo elemento
        let uploadedFile = null;

        if (uploader) {
            fileBrowserLink.addEventListener('click', () => fileInput.click());
            uploader.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploader.classList.add('drag-over'); // Melhor nome de classe
            });
            uploader.addEventListener('dragleave', () => uploader.classList.remove('dragging'));
            uploader.addEventListener('drop', (e) => {
                e.preventDefault();
                uploader.classList.remove('dragging');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFile(files[0]);
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
            });
            removeFileBtn.addEventListener('click', () => {
                uploadedFile = null;
                fileInput.value = ''; // Limpa o input file
                filePreview.style.display = 'none';
                dropZoneText.style.display = 'block'; // Mostra o texto original
                // Reativa o input de URL se ele foi desativado
                imagemUrlInput.disabled = false;
                imagemUrlInput.value = ''; // Limpa o campo de URL
            });
        }

        function handleFile(file) {
            if (file && file.type.startsWith('image/')) {
                uploadedFile = file;
                // Desativa e limpa o input de URL quando um arquivo é selecionado
                const imagemUrlInput = document.getElementById('lesson-image-url');
                if (imagemUrlInput) {
                    imagemUrlInput.value = '';
                    imagemUrlInput.disabled = true;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    // previewFilename.textContent = file.name; // Removido para não exibir o nome do arquivo
                    filePreview.style.display = 'flex';
                    dropZoneText.style.display = 'none'; // Esconde o texto original
                };
                reader.readAsDataURL(file);
            } else {
                alert('Por favor, selecione um arquivo de imagem válido.');
            }
        }

        createActivityForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const tituloInput = document.getElementById('lesson-title');
            const imagemUrlInput = document.getElementById('lesson-image-url');
            const textoInput = document.getElementById('lesson-text');

            if (tituloInput && textoInput) {
                const titulo = tituloInput.value.trim();
                let imagem_url = imagemUrlInput ? imagemUrlInput.value.trim() : '';

                // Se um arquivo foi enviado, faz o upload e usa a URL dele
                if (uploadedFile) {
                    console.log("Fazendo upload da imagem...");
                    imagem_url = await uploadImagemAtividade(uploadedFile);
                    if (!imagem_url) {
                        alert("Erro ao fazer upload da imagem. Por favor, tente novamente.");
                        return;
                    }
                    // Se o upload foi bem-sucedido, a URL do input de texto é ignorada
                }

                const texto = textoInput.value.trim();

                if (!titulo || !texto) {
                    alert("Por favor, preencha o título e o texto da história.");
                    return;
                }

                const novaAtividade = {
                    titulo: titulo,
                    imagem_url: imagem_url,
                    texto: texto
                };

                console.log("Salvando nova atividade no Supabase:", novaAtividade);
                const data = await criarAtividade(novaAtividade);
                if (data) {
                    console.log("Atividade salva com sucesso:", data);
                    showSuccessPopup();
                } else {
                    alert("Ocorreu um erro ao salvar a atividade.");
                }
            } else {
                console.error("[Criação] ERRO: Inputs do formulário não encontrados.");
            }
        });

        function showSuccessPopup() {
            if (successPopup) successPopup.style.display = 'flex';
        }
        function hidePopupAndRedirect() {
            if (successPopup) successPopup.style.display = 'none';
            window.location.href = 'activities-collection.html';
        }

        if (closePopupButton && popupOkButton) {
            closePopupButton.addEventListener('click', hidePopupAndRedirect);
            popupOkButton.addEventListener('click', hidePopupAndRedirect);
        }
        if (successPopup) {
            successPopup.addEventListener('click', function (event) {
                if (event.target === successPopup) hidePopupAndRedirect();
            });
        }

    } else {
        // --- MODO VISUALIZAÇÃO ---
        console.log(`Modo Visualização detectado. ID da atividade: ${activityId}`);

        // Configura a interface para o modo de visualização
        if (creationModeContent) creationModeContent.style.display = 'none';
        if (viewModeContent) viewModeContent.style.display = 'flex'; // 'flex' para manter o layout de colunas

        const atividade = await getAtividadePorId(activityId);

        if (atividade) {
            console.log("Atividade encontrada:", atividade);
            activityTitleEl.textContent = `Atividade: ${atividade.titulo}`;
            activityInstructionEl.textContent = 'Leia o texto a seguir e responda ao exercício';

            const activityTextContent = document.getElementById('activity-text-content');

            activityTextContent.innerHTML = `
                <h2>${atividade.titulo}</h2>
                <p>${atividade.texto.replace(/\n/g, '</p><p>')}</p>
            `;

            // ==========================================================
            // ===== LÓGICA PARA ATIVAÇÃO AUTOMÁTICA DO VLIBRAS =====
            // ==========================================================

            // Esta lógica só roda em modo de visualização
            const avatarContainer = document.getElementById('avatar-placeholder');
            if (avatarContainer) {
                console.log("Modo de visualização de atividade detectado. Ativando VLibras...");

                // Aguarda um tempo para garantir que o plugin VLibras tenha sido totalmente carregado na página.
                setTimeout(() => {
                    const activateButton = document.querySelector('[vw-access-button]');
                    if (activateButton) {
                        console.log("Botão de acesso VLibras encontrado. Clicando para ativar...");
                        activateButton.click(); // Simula o clique para abrir o avatar.

                        // Adiciona uma classe para esconder o botão flutuante após a ativação.
                        activateButton.classList.add('vlibras-button-hidden');
                    } else {
                        console.warn("Botão de acesso VLibras não foi encontrado após o tempo de espera.");
                    }
                }, 2500); // Espera para garantir que o script do plugin carregue.
            }
        } else {
            console.error("Atividade não encontrada!");
            activityTitleEl.textContent = 'Erro';
            activityInstructionEl.textContent = 'A atividade que você está tentando acessar não foi encontrada.';
        }
    }
}); // Fim do DOMContentLoaded