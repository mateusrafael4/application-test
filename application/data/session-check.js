import { getCurrentUser } from './database.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Verificando sessão na página inicial...");

    // Verifica sessão de educador
    const educatorSession = await getCurrentUser();
    if (educatorSession && educatorSession.user) {
        console.log("Educador logado, redirecionando para o catálogo.");
        window.location.href = 'activities-collection.html';
        return;
    }

    // Verifica sessão de aluno (customizada)
    const studentSession = localStorage.getItem('studentSession');
    if (studentSession) {
        try {
            const student = JSON.parse(studentSession);
            console.log("Aluno logado, redirecionando para o catálogo de atividades do aluno.");
            window.location.href = 'student-activities-collection.html';
        } catch (e) { console.error("Erro ao parsear sessão de aluno:", e); localStorage.removeItem('studentSession'); }
    }
});