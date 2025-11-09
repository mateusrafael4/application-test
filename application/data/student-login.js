import { authenticateStudent } from './database.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log("Script do Login do Aluno carregado.");

    const raInput = document.getElementById('ra');
    const passwordInput = document.getElementById('senha'); // Adicionado input de senha
    const loginFormAluno = document.getElementById('login-form');
    const raError = document.getElementById('ra-error');

    // 1. Verificar se o aluno já está logado (usando localStorage para sessão customizada)
    const studentSession = localStorage.getItem('studentSession');
    if (studentSession) {
        console.log("Aluno já logado, redirecionando para o catálogo de atividades.");
        window.location.href = 'student-activities-collection.html';
        return; // Interrompe a execução do script
    }

    // Regex para validar o formato final: 000.000.000-0
    const raRegex = /^\d{3}\.\d{3}\.\d{3}-\d{1}$/;

    // 2. Formatação automática do RA enquanto digita
    raInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
        let formattedValue = '';
        
        // Limita a quantidade de dígitos a 10
        value = value.substring(0, 10);

        if (value.length > 9) { // 10 dígitos
            formattedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            formattedValue = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        } else if (value.length > 3) {
            formattedValue = value.replace(/(\d{3})(\d+)/, '$1.$2');
        } else {
            formattedValue = value;
        }
        
        e.target.value = formattedValue;

        // Remove o erro ao começar a corrigir
        if (raInput.classList.contains('input-error')) {
            raInput.classList.remove('input-error');
            raError.classList.remove('visible');
        }
    });

    // 3. Validação e autenticação ao tentar enviar o formulário
    if (loginFormAluno) {
        loginFormAluno.addEventListener('submit', async function(event) {
            event.preventDefault();
            const ra = raInput.value.trim();
            const password = passwordInput.value;

            // Limpa mensagens de erro anteriores
            raInput.classList.remove('input-error');
            raError.classList.remove('visible');

            if (!raRegex.test(ra)) {
                raInput.classList.add('input-error');
                raError.classList.add('visible');
                return;
            }

            const student = await authenticateStudent(ra, password);

            if (student) {
                localStorage.setItem('studentSession', JSON.stringify(student)); // Armazena a sessão do aluno
                window.location.href = 'student-activities-collection.html';
            } else {
                raInput.classList.add('input-error');
                raError.textContent = 'RA ou senha incorretos.'; // Mensagem de erro mais específica
                raError.classList.add('visible');
            }
        });
    }
});