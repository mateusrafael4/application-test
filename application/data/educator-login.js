import { signInWithEmailPassword, getCurrentUser, signOut } from './database.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log("Script do Login do Educador carregado.");

    const loginForm = document.getElementById('educator-login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha'); // Adicionado input de senha
    const emailError = document.getElementById('email-error');
    const closeModalButton = document.querySelector('.close-modal');

    // 1. Verificar se o educador já está logado
    const session = await getCurrentUser();
    if (session && session.user) {
        console.log("Educador já logado, redirecionando para o catálogo.");
        window.location.href = 'activities-collection.html';
        return; // Interrompe a execução do script
    }

    // 2. Lógica de submissão do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Previne o comportamento padrão de recarregar a página
            const submitButton = loginForm.querySelector('button[type="submit"]');

            const email = emailInput.value.trim();
            const password = passwordInput.value; // Pega o valor da senha

            // Limpa mensagens de erro anteriores
            emailInput.classList.remove('input-error');
            emailError.classList.remove('visible');
            // Você pode adicionar uma mensagem de erro genérica para senha se quiser

            // Validação básica de e-mail (pode ser mais robusta)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                emailInput.classList.add('input-error');
                emailError.textContent = 'Por favor, digite um e-mail válido.';
                emailError.classList.add('visible');
                return;
            }

            // Adiciona feedback de carregamento
            submitButton.disabled = true;
            submitButton.querySelector('span').textContent = 'Entrando...';

            try {
                // Tenta fazer login com Supabase
                const session = await signInWithEmailPassword(email, password);

                if (session) {
                    // Login bem-sucedido
                    window.location.href = 'activities-collection.html'; // Redireciona para o catálogo do educador
                } else {
                    // Login falhou (e-mail ou senha incorretos)
                    emailInput.classList.add('input-error');
                    emailError.textContent = 'E-mail ou senha incorretos.';
                    emailError.classList.add('visible');
                }
            } finally {
                // Restaura o botão, independentemente do resultado
                submitButton.disabled = false;
                submitButton.querySelector('span').textContent = 'Entrar';
            }
        });
    }

    // 3. Lógica do botão de fechar
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            window.location.href = 'index.html'; // Redireciona para a página inicial
        });
    }
});