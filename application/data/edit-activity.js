import { getAtividadePorId, atualizarAtividade as atualizarAtividadeSupabase, uploadImagemAtividade } from './database.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log("Script da Página de Edição carregado.");

    // --- LÓGICA DO POP-UP DE SUCESSO ---
    const successPopup = document.getElementById('success-popup');
    const closePopupButton = document.getElementById('close-popup');
    const popupOkButton = document.getElementById('popup-ok-btn');

    function showSuccessPopup() {
        if (successPopup) {
            successPopup.style.display = 'flex';
        } else {
            alert("Atividade atualizada com sucesso!");
            window.location.href = 'activities-collection.html';
        }
    }

    function hidePopupAndRedirect() {
        if (successPopup) {
            successPopup.style.display = 'none';
        }
        window.location.href = 'activities-collection.html';
    }

    if (closePopupButton && popupOkButton) {
        closePopupButton.addEventListener('click', hidePopupAndRedirect);
        popupOkButton.addEventListener('click', hidePopupAndRedirect);
    }
    if (successPopup) {
        successPopup.addEventListener('click', function (event) {
            if (event.target === successPopup) {
                hidePopupAndRedirect();
            }
        });
    }

    // --- LÓGICA PRINCIPAL DA PÁGINA DE EDIÇÃO ---
    const editForm = document.getElementById('edit-activity-form');
    const tituloInput = document.getElementById('lesson-title'); // Declarado aqui para escopo global
    const imagemUrlInput = document.getElementById('lesson-image-url'); // Declarado aqui para escopo global
    const textoInput = document.getElementById('lesson-text'); // Declarado aqui para escopo global

    // --- LÓGICA DO UPLOAD DE ARQUIVO ---
    const uploader = document.getElementById('image-drop-zone');
    const fileInput = document.getElementById('lesson-image-upload');
    const filePreview = document.getElementById('file-preview');
    const previewImage = document.getElementById('preview-image');
    // const previewFilename = document.getElementById('preview-filename'); // Comentado para não exibir o nome do arquivo
    const removeFileBtn = document.getElementById('remove-file-btn');
    const fileBrowserLink = document.querySelector('.file-browser-link');
    const dropZoneText = document.getElementById('drop-zone-text');
    let uploadedFile = null; // Variável para armazenar o arquivo selecionado

    if (uploader) {
        fileBrowserLink.addEventListener('click', () => fileInput.click());
        uploader.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploader.classList.add('drag-over');
        });
        uploader.addEventListener('dragleave', () => uploader.classList.remove('drag-over'));
        uploader.addEventListener('drop', (e) => {
            e.preventDefault();
            uploader.classList.remove('drag-over');
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
            imagemUrlInput.disabled = false; // Reativa o input de URL
            imagemUrlInput.value = ''; // Limpa o campo de URL
        });
    }

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            uploadedFile = file;
            imagemUrlInput.value = ''; // Limpa o campo de URL
            imagemUrlInput.disabled = true; // Desativa o campo de URL
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                filePreview.style.display = 'flex';
                dropZoneText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Por favor, selecione um arquivo de imagem válido.');
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const atividadeId = urlParams.get('id');

    if (!atividadeId) {
        alert("Erro: ID da atividade não fornecido.");
        window.location.href = 'activities-collection.html';
        return;
    }

    // Carrega os dados da atividade diretamente do Supabase
    getAtividadePorId(atividadeId).then(atividadeParaEditar => {
        if (atividadeParaEditar) {
            console.log("Atividade carregada para edição:", atividadeParaEditar);
            tituloInput.value = atividadeParaEditar.titulo;
            textoInput.value = atividadeParaEditar.texto;

            // Preenche a pré-visualização da imagem se houver uma URL
            if (atividadeParaEditar.imagem_url) {
                previewImage.src = atividadeParaEditar.imagem_url;
                filePreview.style.display = 'flex';
                dropZoneText.style.display = 'none';
                // Preenche o input de URL, mas não o desativa ainda, a menos que um novo arquivo seja selecionado
                imagemUrlInput.value = atividadeParaEditar.imagem_url;
            } else {
                imagemUrlInput.value = ''; // Garante que o campo de URL esteja vazio se não houver imagem
            }
            textoInput.value = atividadeParaEditar.texto;
        } else {
            alert("Erro: Atividade não encontrada.");
            window.location.href = 'activities-collection.html';
        }
    });

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const titulo = tituloInput.value.trim(); // Pega o título do input
        let finalImageUrl = ''; // Variável para armazenar a URL final da imagem
        const texto = textoInput.value.trim();

        if (!titulo || !texto) {
            alert("Por favor, preencha o título e o texto da história.");
            return;
        }
        
        if (uploadedFile) {
            // Caso 1: Um novo arquivo foi selecionado/enviado
            console.log("Fazendo upload da nova imagem para edição...");
            const newImageUrl = await uploadImagemAtividade(uploadedFile);
            if (newImageUrl) {
                finalImageUrl = newImageUrl;
            } else {
                alert("Erro ao fazer upload da nova imagem. Por favor, tente novamente.");
                return;
            }
        } else if (imagemUrlInput.value.trim() !== '') {
            // Caso 2: Nenhum arquivo novo, mas há uma URL no campo de input
            finalImageUrl = imagemUrlInput.value.trim();
        }
        // Caso 3: Nenhum arquivo novo e o campo de URL está vazio (finalImageUrl permanece '')

        const atividadeAtualizada = {
            titulo: titulo,
            imagem_url: finalImageUrl, // Usa a URL final determinada
            texto: texto
        };

        const data = await atualizarAtividadeSupabase(atividadeId, atividadeAtualizada);

        if (data) {
            console.log("Atividade atualizada com sucesso:", data);
            showSuccessPopup();
        } else {
            alert("Ocorreu um erro ao salvar as alterações.");
        }
    });
});
