// src/application/data/database.js

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://kcnaozkeqghhqpskllem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbmFvemtlcWdoaHFwc2tsbGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTY2MTAsImV4cCI6MjA3NzMzMjYxMH0.Oe4EmjQklOMcdE-CEp4bEk_-MO7h-xGmPzM0gsX1iI8';

// Cria e exporta o cliente Supabase para ser usado em toda a aplicação
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Módulo de Database inicializado e cliente Supabase criado.");


// --- FUNÇÕES DE INTERAÇÃO COM O BANCO (CRUD) ---

/**
 * Carrega todas as atividades do Supabase, ordenadas pela mais recente.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de atividades.
 */
export async function carregarAtividades() {
    const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar atividades do Supabase:', error);
        return [];
    }
    console.log("Atividades carregadas do Supabase:", data);
    return data;
}

/**
 * Busca uma única atividade pelo seu ID.
 * @param {string} id - O ID da atividade a ser buscada.
 * @returns {Promise<Object|null>} Uma promessa que resolve para o objeto da atividade ou null se não for encontrada.
 */
export async function getAtividadePorId(id) {
    const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .eq('id', id)
        .single(); // .single() retorna um objeto só, ou null se não achar

    if (error) {
        console.error(`Erro ao buscar atividade com ID ${id}:`, error);
        return null;
    }
    return data;
}

/**
 * Cria uma nova atividade no Supabase.
 * @param {Object} novaAtividade - O objeto da atividade a ser criada.
 * @returns {Promise<Object|null>}
 */
export async function criarAtividade(novaAtividade) {
    const { data, error } = await supabase
        .from('atividades')
        .insert([novaAtividade])
        .select();

    if (error) {
        console.error("Erro ao criar atividade no Supabase: ", error);
        return null;
    }
    return data;
}

/**
 * Exclui uma atividade do Supabase pelo ID.
 * @param {string} id - O ID da atividade a ser excluída.
 * @returns {Promise<{data: null, error: any}>}
 */
export async function excluirAtividade(id) {
    const { data, error } = await supabase.from('atividades').delete().eq('id', id);
    return { data, error };
}

/**
 * Atualiza uma atividade existente no Supabase.
 * @param {string} id - O ID da atividade a ser atualizada.
 * @param {Object} updates - Um objeto com os campos a serem atualizados.
 * @returns {Promise<Object|null>}
 */
export async function atualizarAtividade(id, updates) {
    const { data, error } = await supabase
        .from('atividades')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) console.error(`Erro ao atualizar atividade com ID ${id}:`, error);
    return data;
}

/**
 * Faz o upload de um arquivo de imagem para o Supabase Storage e retorna a URL pública.
 * @param {File} file - O arquivo de imagem a ser enviado.
 * @returns {Promise<string|null>} A URL pública da imagem ou null em caso de erro.
 */
export async function uploadImagemAtividade(file) {
    if (!file) return null;

    const bucketName = 'imagens-atividades';
    // Cria um nome de arquivo único para evitar conflitos
    const fileName = `public/${Date.now()}-${file.name}`;

    // Faz o upload do arquivo
    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

    if (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        return null;
    }

    // Obtém a URL pública do arquivo que acabamos de enviar
    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data.publicUrl;
}

/**
 * Carrega todas as atividades atribuídas a uma turma específica.
 * @param {string} turmaId O ID da turma.
 * @returns {Promise<Array>} Uma lista de atividades.
 */
export async function carregarAtividadesDaTurma(turmaId) {
    if (!turmaId) return [];

    // 1. Busca os IDs das atividades na tabela de associação
    const { data: ids, error: idsError } = await supabase
        .from('turma_atividades')
        .select('atividade_id')
        .eq('turma_id', turmaId);
        console.log(ids);

    if (idsError) {
        console.error("Erro ao buscar IDs de atividades da turma:", idsError);
        return [];
    }

    const activityIds = ids.map(item => item.atividade_id);
    console.log(activityIds);
    
    if (activityIds.length === 0) return [];

    // 2. Busca os detalhes das atividades usando os IDs obtidos
    const { data: atividades, error: atividadesError } = await supabase
        .from('atividades')
        .select('*') // Seleciona todas as colunas
        .in('id', activityIds) // Busca atividades cujos IDs estão no array activityIds
        .order('titulo', { ascending: true });
        console.log(atividades);

    if (atividadesError) {
        console.error("Erro ao carregar detalhes das atividades:", atividadesError);
        return [];
    }
    return atividades;
}

/**
 * Carrega as turmas associadas a um educador.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de turmas.
 */
export async function getTurmasDoEducador() {
    const session = await getCurrentUser();
    if (!session || !session.user) {
        console.error("Nenhum educador logado para buscar turmas.");
        return [];
    }

    const educadorId = session.user.id;

    const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('educador_id', educadorId)
        .order('nome_turma', { ascending: true });

    if (error) {
        console.error('Erro ao carregar turmas do educador:', error);
        return [];
    }
    console.log("Turmas do educador carregadas:", data);
    return data;
}

/**
 * Atribui uma atividade a uma turma.
 * @param {string} turmaId - O ID da turma.
 * @param {string} atividadeId - O ID da atividade.
 * @returns {Promise<Object|null>} O objeto de associação criada ou null em caso de erro.
 */
export async function atribuirAtividadeTurma(turmaId, atividadeId) {
    const { data, error } = await supabase
        .from('turma_atividades')
        .insert([{ turma_id: turmaId, atividade_id: atividadeId }]);
    if (error) console.error("Erro ao atribuir atividade à turma:", error);
    return data;
}

// --- FUNÇÕES DE AUTENTICAÇÃO (EDUCADOR) ---

/**
 * Realiza o login de um educador com e-mail e senha.
 * @param {string} email - O e-mail do educador.
 * @param {string} password - A senha do educador.
 * @returns {Promise<Object|null>} O objeto de sessão do usuário ou null em caso de erro.
 */
export async function signInWithEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Erro ao fazer login do educador:', error.message);
        return null;
    }
    console.log('Educador logado com sucesso:', data.user);
    return data.session;
}

/**
 * Realiza o logout do usuário atual.
 * @returns {Promise<Object|null>} Um objeto vazio em caso de sucesso ou null em caso de erro.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error.message);
        return null;
    }
    console.log('Usuário deslogado com sucesso.');
    return {};
}

/**
 * Obtém a sessão do usuário atualmente logado.
 * @returns {Promise<Object|null>} O objeto de sessão do usuário ou null se não houver sessão ativa.
 */
export async function getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Erro ao obter sessão:', error.message);
        return null;
    }
    return session;
}

// --- FUNÇÃO DE AUTENTICAÇÃO CUSTOMIZADA (ALUNO) ---

/**
 * Autentica um aluno com RA e senha.
 * @param {string} ra - O Registro do Aluno.
 * @param {string} password - A senha do aluno.
 * @returns {Promise<Object|null>} O objeto do aluno logado ou null em caso de falha.
 */
export async function authenticateStudent(ra, password) {
    // Em um cenário real, 'password' seria um hash e a comparação seria feita no backend.
    // Para este exemplo, vamos buscar o aluno e comparar a senha diretamente (NÃO FAÇA ISSO EM PRODUÇÃO).
    
    // Usamos uma função RPC ('get_student_by_ra') para buscar o aluno tratando espaços em branco no RA.
    const { data: students, error } = await supabase.rpc('get_student_by_ra', { p_ra: ra });

    if (error) {
        console.error('Erro ao buscar aluno:', error.message);
        return null;
    }

    if (students.length === 0) {
        console.warn(`Nenhum aluno encontrado com o RA: ${ra}`);
        return null;
    }

    if (students.length > 1) {
        console.error(`ERRO DE DADOS: Múltiplos alunos encontrados com o mesmo RA: ${ra}. A coluna 'ra' deve ser única.`);
        return null; // Falha na autenticação por segurança
    }

    const student = students[0];
    // Comparação de senha (MUITO INSEGURO PARA PRODUÇÃO - USE HASHING NO BACKEND)
    if (student.password === password) { // Assumindo que 'password' é uma coluna na tabela 'students'
        console.log('Aluno logado com sucesso:', student);
        // Retornamos um objeto simplificado do aluno para a sessão
        return {
            id: student.id,
            ra: student.ra,
            profile: 'student', // Adiciona um identificador de perfil
            turma_id: student.turma_id // Adiciona o ID da turma do aluno
        };
    } else {
        console.warn('Senha incorreta para o RA:', ra);
        return null;
    }
}   
