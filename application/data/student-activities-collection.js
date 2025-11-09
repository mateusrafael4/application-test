import { carregarAtividadesDaTurma } from './database.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log("Script do Catálogo do Aluno carregado.");

    // --- 1. PROTEGER A ROTA: VERIFICAR SESSÃO DO ALUNO ---
    const studentSession = localStorage.getItem('studentSession');
    if (!studentSession) {
        console.log("Nenhum aluno logado. Redirecionando para a página de login.");
        window.location.href = 'student-login.html';
        return; // Interrompe a execução do script para evitar carregar o resto da página
    }

    // Se a sessão existe, podemos dar as boas-vindas
    const student = JSON.parse(studentSession);
    console.log(`Bem-vindo(a), aluno(a) com RA: ${student.ra} da Turma ID: ${student.turma_id}`);

    // --- 2. LÓGICA DE LOGOUT ---
    const btnLogout = document.getElementById('student-logout-btn');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            localStorage.removeItem('studentSession');
            window.location.href = 'index.html';
        });
    }
    const lessonGrid = document.querySelector('.lesson-grid');

    if (lessonGrid) {
        // --- LIMPAR CARTÕES ANTIGOS (BOA PRÁTICA) ---
        lessonGrid.innerHTML = '<p>Carregando atividades...</p>'; // Feedback para o usuário
        
        // --- CARREGAR E EXIBIR ATIVIDADES DO SUPABASE ---
        // Agora, usamos o turma_id do aluno para carregar apenas as atividades da sua turma
        const atividadesSalvas = await carregarAtividadesDaTurma(student.turma_id);
        console.log("[Catálogo Aluno] Carregando atividades:", atividadesSalvas);

        lessonGrid.innerHTML = ''; // Limpa a mensagem de "carregando"
        
        // Verifica se há atividades para exibir
        if (atividadesSalvas.length === 0) {
            lessonGrid.innerHTML = '<p class="empty-message">Nenhuma atividade foi atribuída à sua turma ainda.</p>';
            console.log("[Catálogo Aluno] Nenhuma atividade encontrada para esta turma.");
            return;
        }

        atividadesSalvas.forEach(atividade => { // O forEach não fará nada se o array estiver vazio
            console.log(`[Catálogo Aluno] Criando cartão para: "${atividade.titulo}"`);
            const novoCartao = document.createElement('a');
            novoCartao.href = `activity-detail.html?id=${atividade.id}`; // Link para a visualização da atividade
            novoCartao.classList.add('lesson-card');
            novoCartao.innerHTML = `
                <img src="${atividade.imagem_url || 'https://placehold.co/400x300/EFEFEF/333?text=Nova+Lição'}" alt="Capa da lição ${atividade.titulo}">
                <span class="lesson-title">${atividade.titulo}</span>
            `;
            lessonGrid.appendChild(novoCartao);
        });
    } else {
         console.warn("[Catálogo Aluno] AVISO: Grid (.lesson-grid) não encontrado.");
    }

}); // Fim do DOMContentLoaded