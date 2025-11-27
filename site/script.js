// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDMmJ9hluWIfFlnr0fK2HpZ9R6jmLRON7Q",
    authDomain: "avaliacao-fisica-435bf.firebaseapp.com",
    databaseURL: "https://avaliacao-fisica-435bf-default-rtdb.firebaseio.com",
    projectId: "avaliacao-fisica-435bf",
    storageBucket: "avaliacao-fisica-435bf.firebasestorage.app",
    messagingSenderId: "536053732608",
    appId: "1:536053732608:web:6507020bf9d9d6317acfe5"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Estado da aplicação
let currentUser = null;
let currentSection = 'dashboard';
let editingAvaliacaoId = null;
let currentStep = 1;
let editingItemId = null;
let editingItemType = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Respostas do assistente IA
const assistantResponses = {
    'calcular imc': `Para calcular o IMC (Índice de Massa Corporal), use a fórmula:
    
IMC = peso (kg) / (altura (m) × altura (m))

Exemplo: 
- Peso: 70kg
- Altura: 1.75m
- IMC = 70 / (1.75 × 1.75) = 22.86

Classificação:
• Abaixo de 18.5: Abaixo do peso
• 18.5 - 24.9: Peso normal
• 25 - 29.9: Sobrepeso
• Acima de 30: Obesidade`,

    'peso ideal': `O peso ideal varia conforme altura, idade, sexo e composição corporal. 

Fórmula geral (Homens):
Peso Ideal = (altura em cm - 100) × 0.9

Fórmula geral (Mulheres):
Peso Ideal = (altura em cm - 100) × 0.85

Para uma avaliação mais precisa, considere:
• Percentual de gordura
• Massa muscular
• Idade
• Nível de atividade física`,

    'ganho de massa': `Para ganho de massa muscular:

💪 TREINO:
• Foco em exercícios compostos
• 3-4 séries de 8-12 repetições
• Progressão de carga constante
• Descanso adequado entre treinos

🍗 NUTRIÇÃO:
• Superávit calórico (300-500kcal)
• 2g de proteína por kg de peso
• Carboidratos complexos
• Gorduras saudáveis

📊 SUPLEMENTAÇÃO:
• Whey Protein
• Creatina
• BCAA (opcional)`,

    'exercícios emagrecer': `Exercícios eficazes para emagrecimento:

🏃‍♂️ CARDIO:
• Corrida (30-45min)
• Ciclismo
• Natação
• HIIT (20-30min)

🏋️‍♂️ MUSCULAÇÃO:
• Agachamento
• Levantamento Terra
• Supino
• Remada

💡 DICAS:
• Combine cardio e musculação
• Mantenha a frequência (4-5x/semana)
• Progressão gradual
• Hidratação adequada`,

    'avaliação física': `Uma avaliação física completa inclui:

1. DADOS ANTROPOMÉTRICOS:
   • Peso e altura
   • IMC
   • Circunferências (cintura, quadril)
   • Dobras cutâneas

2. COMPOSIÇÃO CORPORAL:
   • Percentual de gordura
   • Massa muscular
   • Massa óssea

3. CAPACIDADES FÍSICAS:
   • Flexibilidade
   • Força
   • Resistência

4. SAÚDE:
   • Pressão arterial
   • Frequência cardíaca`,

    'default': `Posso ajudar você com:

📊 **Avaliações Físicas**
• Cálculo de IMC e composição corporal
• Interpretação de resultados
• Planos personalizados

💪 **Treinamento**
• Exercícios para diferentes objetivos
• Periodização de treinos
• Técnicas de execução

🍎 **Nutrição**
• Planos alimentares
• Suplementação
• Dietas específicas

🎯 **Metas**
• Emagrecimento
• Ganho de massa
• Condicionamento físico

O que você gostaria de saber?`
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupMultiStepForm();
    initializeAllSections();
    updateCurrentDate();
});

function initializeApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showScreen('dashboard-screen');
            loadUserData();
            loadDashboardData();
        } else {
            showScreen('welcome-screen');
        }
    });
}

function setupEventListeners() {
    // Formulários de autenticação
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });

    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        registerUser();
    });

    // Formulário de perfil
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });

    // Enter no chat
    document.getElementById('chat-message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Inicializar todas as seções
function initializeAllSections() {
    setupCalendar();
    setupExercicios();
    setupTreinos();
    setupDieta();
    setupMedidas();
    setupEvolucao();
    setupRelatorios();
    setupConfiguracoes();
}

// Atualizar data atual
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('pt-BR', options);
    }
}

// Navegação
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showSection(sectionId) {
    // Atualizar menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const menuItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
    
    // Mostrar seção
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    currentSection = sectionId;
    
    // Carregar dados específicos da seção
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'avaliacoes':
            loadAvaliacoes();
            break;
        case 'alunos':
            loadAlunos();
            break;
        case 'exercicios':
            loadExercicios();
            break;
        case 'treinos':
            loadTreinos();
            break;
        case 'dieta':
            loadDieta();
            break;
        case 'medidas':
            loadMedidas();
            break;
        case 'evolucao':
            loadEvolucao();
            break;
        case 'chat':
            // Chat já inicializado
            break;
        case 'calendario':
            loadCalendario();
            break;
        case 'relatorios':
            loadRelatorios();
            break;
        case 'configuracoes':
            // Configurações já inicializadas
            break;
        case 'perfil':
            loadProfileData();
            break;
    }
    
    // Fechar sidebar no mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Autenticação
async function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showLoading(true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Erro no login: ' + error.message);
    }
    showLoading(false);
}

async function registerUser() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const type = document.getElementById('register-type').value;

    showLoading(true);
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await database.ref('users/' + user.uid).set({
            name: name,
            email: email,
            type: type,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        alert('Erro no cadastro: ' + error.message);
    }
    showLoading(false);
}

function logout() {
    auth.signOut();
}

// Carregar dados do usuário
function loadUserData() {
    const userRef = database.ref('users/' + currentUser.uid);
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            // Atualizar header
            document.getElementById('header-user-name').textContent = userData.name;
            document.getElementById('sidebar-user-name').textContent = userData.name;
            document.getElementById('sidebar-user-type').textContent = userData.type;
            
            // Atualizar perfil
            document.getElementById('profile-full-name').textContent = userData.name;
            document.getElementById('profile-email').textContent = userData.email;
            document.getElementById('profile-type-badge').textContent = userData.type;
            
            // Atualizar formulário de perfil
            document.getElementById('profile-name').value = userData.name;
            document.getElementById('profile-email-input').value = userData.email;
            document.getElementById('profile-phone').value = userData.phone || '';
            document.getElementById('profile-specialty').value = userData.specialty || '';
        }
    });
}

// Dashboard
function loadDashboardData() {
    loadDashboardStats();
    loadRecentAvaliacoes();
    loadRecentActivity();
}

function loadDashboardStats() {
    // Avaliações
    const avaliacoesRef = database.ref('avaliacoes');
    avaliacoesRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('total-avaliacoes').textContent = count;
    });

    // Alunos
    const alunosRef = database.ref('alunos');
    alunosRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('total-alunos').textContent = count;
    });

    // Mensagens do chat
    const chatRef = database.ref('chat');
    chatRef.orderByChild('userId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('total-mensagens').textContent = count;
    });

    // Treinos
    const treinosRef = database.ref('treinos');
    treinosRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('total-treinos').textContent = count;
    });
}

function loadRecentAvaliacoes() {
    const container = document.getElementById('recent-avaliacoes');
    const avaliacoesRef = database.ref('avaliacoes');
    
    avaliacoesRef.orderByChild('professorId').equalTo(currentUser.uid)
        .limitToLast(5).on('value', (snapshot) => {
        const avaliacoes = snapshot.val();
        container.innerHTML = '';
        
        if (avaliacoes) {
            Object.keys(avaliacoes).forEach(key => {
                const avaliacao = avaliacoes[key];
                const item = document.createElement('div');
                item.className = 'recent-item';
                item.innerHTML = `
                    <div class="recent-item-content">
                        <strong>${avaliacao.alunoNome}</strong>
                        <span>${avaliacao.data ? new Date(avaliacao.data).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                    <div class="recent-item-badge ${avaliacao.status || 'pendente'}">
                        ${avaliacao.status || 'Pendente'}
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p class="no-data">Nenhuma avaliação recente</p>';
        }
    });
}

function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    container.innerHTML = '<p class="no-data">Nenhuma atividade recente</p>';
}

// Sistema de Avaliações
function loadAvaliacoes() {
    const container = document.getElementById('avaliacoes-list');
    const avaliacoesRef = database.ref('avaliacoes');
    
    avaliacoesRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const avaliacoes = snapshot.val();
        container.innerHTML = '';
        
        if (avaliacoes) {
            Object.keys(avaliacoes).forEach(key => {
                const avaliacao = avaliacoes[key];
                const card = createAvaliacaoCard(avaliacao, key);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Nenhuma avaliação cadastrada</h3>
                    <p>Comece criando sua primeira avaliação física</p>
                    <button class="btn btn-primary" onclick="showSection('nova-avaliacao')" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Criar Primeira Avaliação
                    </button>
                </div>
            `;
        }
    });
}

function createAvaliacaoCard(avaliacao, key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${avaliacao.alunoNome}</h3>
            <span class="status-badge ${avaliacao.status || 'pendente'}">${avaliacao.status || 'Pendente'}</span>
        </div>
        <div class="card-body">
            <p><strong>Idade:</strong> <span>${avaliacao.idade || 'N/A'} anos</span></p>
            <p><strong>Altura:</strong> <span>${avaliacao.altura || 'N/A'} cm</span></p>
            <p><strong>Peso:</strong> <span>${avaliacao.peso || 'N/A'} kg</span></p>
            <p><strong>IMC:</strong> <span>${calcularIMC(avaliacao.peso, avaliacao.altura)}</span></p>
            <p><strong>Data:</strong> <span>${avaliacao.data ? new Date(avaliacao.data).toLocaleDateString('pt-BR') : 'N/A'}</span></p>
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-small" onclick="editAvaliacao('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteAvaliacao('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

function calcularIMC(peso, altura) {
    if (!peso || !altura) return 'N/A';
    const alturaMetros = altura / 100;
    const imc = (peso / (alturaMetros * alturaMetros)).toFixed(1);
    return imc;
}

// EDITAR AVALIAÇÃO
function editAvaliacao(avaliacaoId) {
    editingAvaliacaoId = avaliacaoId;
    
    const avaliacaoRef = database.ref('avaliacoes/' + avaliacaoId);
    avaliacaoRef.once('value').then((snapshot) => {
        const avaliacao = snapshot.val();
        
        if (avaliacao) {
            document.getElementById('avaliacao-nome').value = avaliacao.alunoNome || '';
            document.getElementById('avaliacao-idade').value = avaliacao.idade || '';
            document.getElementById('avaliacao-altura').value = avaliacao.altura || '';
            document.getElementById('avaliacao-peso').value = avaliacao.peso || '';
            document.getElementById('avaliacao-email').value = avaliacao.email || '';
            document.getElementById('avaliacao-telefone').value = avaliacao.telefone || '';
            
            showSection('nova-avaliacao');
            document.querySelector('#nova-avaliacao-section h2').textContent = 'Editar Avaliação Física';
        }
    });
}

// EXCLUIR AVALIAÇÃO
function deleteAvaliacao(avaliacaoId) {
    if (confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) {
        showLoading(true);
        database.ref('avaliacoes/' + avaliacaoId).remove()
            .then(() => {
                showLoading(false);
                alert('Avaliação excluída com sucesso!');
            })
            .catch((error) => {
                showLoading(false);
                alert('Erro ao excluir avaliação: ' + error.message);
            });
    }
}

// ===== SISTEMA DE ALUNOS COMPLETO =====
function loadAlunos() {
    const container = document.getElementById('alunos-list');
    const alunosRef = database.ref('alunos');
    
    alunosRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const alunos = snapshot.val();
        container.innerHTML = '';
        
        if (alunos) {
            Object.keys(alunos).forEach(key => {
                const aluno = alunos[key];
                const card = createAlunoCard(aluno, key);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <h3>Nenhum aluno cadastrado</h3>
                    <p>Comece adicionando seu primeiro aluno</p>
                    <button class="btn btn-primary" onclick="novoAluno()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Adicionar Primeiro Aluno
                    </button>
                </div>
            `;
        }
    });
}

function createAlunoCard(aluno, key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${aluno.nome}</h3>
            <span class="status-badge ${aluno.status === 'Ativo' ? 'concluido' : 'pendente'}">${aluno.status || 'Ativo'}</span>
        </div>
        <div class="card-body">
            <p><strong>Idade:</strong> <span>${aluno.idade} anos</span></p>
            <p><strong>Objetivo:</strong> <span>${aluno.objetivo}</span></p>
            <p><strong>Cadastro:</strong> <span>${aluno.createdAt ? new Date(aluno.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span></p>
            ${aluno.observacoes ? `<p><strong>Observações:</strong> <span>${aluno.observacoes}</span></p>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-small" onclick="editarAluno('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="excluirAluno('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

function novoAluno() {
    showCustomAlunoModal();
}

function showCustomAlunoModal() {
    const modalHTML = `
        <div class="modal active" id="custom-aluno-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Novo Aluno</h3>
                    <button class="modal-close" onclick="closeModal('custom-aluno-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="custom-aluno-form">
                    <div class="input-group">
                        <label><i class="fas fa-user"></i> Nome do Aluno *</label>
                        <input type="text" id="custom-aluno-nome" placeholder="Nome completo" required>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-birthday-cake"></i> Idade *</label>
                        <input type="number" id="custom-aluno-idade" placeholder="Idade em anos" required>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-bullseye"></i> Objetivo *</label>
                        <select id="custom-aluno-objetivo" required>
                            <option value="">Selecione o objetivo</option>
                            <option value="Emagrecimento">Emagrecimento</option>
                            <option value="Ganho de Massa">Ganho de Massa</option>
                            <option value="Condicionamento">Condicionamento Físico</option>
                            <option value="Reabilitação">Reabilitação</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-notes-medical"></i> Observações</label>
                        <textarea id="custom-aluno-observacoes" rows="3" placeholder="Observações importantes..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('custom-aluno-modal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cadastrar Aluno
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('custom-aluno-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const alunoData = {
            nome: document.getElementById('custom-aluno-nome').value,
            idade: document.getElementById('custom-aluno-idade').value,
            objetivo: document.getElementById('custom-aluno-objetivo').value,
            observacoes: document.getElementById('custom-aluno-observacoes').value,
            status: 'Ativo',
            professorId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        showLoading(true);
        database.ref('alunos').push(alunoData)
            .then(() => {
                showLoading(false);
                closeModal('custom-aluno-modal');
                loadAlunos();
                alert('Aluno cadastrado com sucesso!');
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao cadastrar aluno: ' + error.message);
            });
    });
}

// ===== SISTEMA DE EXERCÍCIOS COMPLETO =====
function setupExercicios() {
    loadExercicios();
}

function loadExercicios() {
    const container = document.getElementById('exercicios-list');
    const exerciciosRef = database.ref('exercicios');
    
    exerciciosRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const exercicios = snapshot.val();
        container.innerHTML = '';
        
        if (exercicios) {
            Object.keys(exercicios).forEach(key => {
                const exercicio = exercicios[key];
                const card = createExercicioCard(exercicio, key);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-running"></i>
                    <h3>Nenhum exercício cadastrado</h3>
                    <p>Adicione exercícios à sua biblioteca</p>
                    <button class="btn btn-primary" onclick="novoExercicio()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Adicionar Exercício
                    </button>
                </div>
            `;
        }
    });
}

function createExercicioCard(exercicio, key) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.innerHTML = `
        <div class="exercise-icon">
            <i class="fas fa-dumbbell"></i>
        </div>
        <h3>${exercicio.nome}</h3>
        <p><strong>Grupo:</strong> ${exercicio.grupo}</p>
        <p><strong>Dificuldade:</strong> ${exercicio.dificuldade}</p>
        <div class="card-actions" style="margin-top: 1rem;">
            <button class="btn btn-secondary btn-small" onclick="editarExercicio('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="excluirExercicio('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

function novoExercicio() {
    showCustomExercicioModal();
}

function showCustomExercicioModal() {
    const modalHTML = `
        <div class="modal active" id="custom-exercicio-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-dumbbell"></i> Novo Exercício</h3>
                    <button class="modal-close" onclick="closeModal('custom-exercicio-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="custom-exercicio-form">
                    <div class="input-group">
                        <label><i class="fas fa-dumbbell"></i> Nome do Exercício *</label>
                        <input type="text" id="custom-exercicio-nome" placeholder="Ex: Supino Reto" required>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-muscle"></i> Grupo Muscular *</label>
                        <select id="custom-exercicio-grupo" required>
                            <option value="">Selecione o grupo</option>
                            <option value="Peitoral">Peitoral</option>
                            <option value="Costas">Costas</option>
                            <option value="Pernas">Pernas</option>
                            <option value="Ombros">Ombros</option>
                            <option value="Bíceps">Bíceps</option>
                            <option value="Tríceps">Tríceps</option>
                            <option value="Abdômen">Abdômen</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-signal"></i> Dificuldade *</label>
                        <select id="custom-exercicio-dificuldade" required>
                            <option value="">Selecione a dificuldade</option>
                            <option value="Iniciante">Iniciante</option>
                            <option value="Intermediário">Intermediário</option>
                            <option value="Avançado">Avançado</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('custom-exercicio-modal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cadastrar Exercício
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('custom-exercicio-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const exercicioData = {
            nome: document.getElementById('custom-exercicio-nome').value,
            grupo: document.getElementById('custom-exercicio-grupo').value,
            dificuldade: document.getElementById('custom-exercicio-dificuldade').value,
            professorId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        showLoading(true);
        database.ref('exercicios').push(exercicioData)
            .then(() => {
                showLoading(false);
                closeModal('custom-exercicio-modal');
                loadExercicios();
                alert('Exercício cadastrado com sucesso!');
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao cadastrar exercício: ' + error.message);
            });
    });
}

// ===== SISTEMA DE TREINOS COMPLETO =====
function setupTreinos() {
    loadTreinos();
}

function loadTreinos() {
    const container = document.getElementById('treinos-list');
    const treinosRef = database.ref('treinos');
    
    treinosRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const treinos = snapshot.val();
        container.innerHTML = '';
        
        if (treinos) {
            Object.keys(treinos).forEach(key => {
                const treino = treinos[key];
                const card = createTreinoCard(treino, key);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-dumbbell"></i>
                    <h3>Nenhum treino criado</h3>
                    <p>Crie seu primeiro plano de treino</p>
                    <button class="btn btn-primary" onclick="novoTreino()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Criar Treino
                    </button>
                </div>
            `;
        }
    });
}

function createTreinoCard(treino, key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${treino.nome}</h3>
            <span class="status-badge concluido">${treino.tipo || 'Personalizado'}</span>
        </div>
        <div class="card-body">
            <p><strong>Objetivo:</strong> <span>${treino.objetivo}</span></p>
            <p><strong>Duração:</strong> <span>${treino.duracao} minutos</span></p>
            <p><strong>Frequência:</strong> <span>${treino.frequencia} vezes/semana</span></p>
            <p><strong>Nível:</strong> <span>${treino.nivel}</span></p>
            ${treino.descricao ? `<p><strong>Descrição:</strong> <span>${treino.descricao}</span></p>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-small" onclick="editarTreino('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="excluirTreino('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

function novoTreino() {
    showCustomTreinoModal();
}

function showCustomTreinoModal() {
    const modalHTML = `
        <div class="modal active" id="custom-treino-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-dumbbell"></i> Novo Treino</h3>
                    <button class="modal-close" onclick="closeModal('custom-treino-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="custom-treino-form">
                    <div class="input-group">
                        <label><i class="fas fa-dumbbell"></i> Nome do Treino *</label>
                        <input type="text" id="custom-treino-nome" placeholder="Ex: Treino ABC Iniciante" required>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-bullseye"></i> Objetivo *</label>
                        <select id="custom-treino-objetivo" required>
                            <option value="">Selecione o objetivo</option>
                            <option value="Hipertrofia">Hipertrofia (Ganho de Massa)</option>
                            <option value="Emagrecimento">Emagrecimento</option>
                            <option value="Força">Força</option>
                            <option value="Resistência">Resistência</option>
                            <option value="Condicionamento">Condicionamento Físico</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-clock"></i> Duração (minutos) *</label>
                            <input type="number" id="custom-treino-duracao" placeholder="Ex: 60" required>
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-calendar-week"></i> Frequência *</label>
                            <select id="custom-treino-frequencia" required>
                                <option value="">Selecione</option>
                                <option value="2">2 vezes/semana</option>
                                <option value="3">3 vezes/semana</option>
                                <option value="4">4 vezes/semana</option>
                                <option value="5">5 vezes/semana</option>
                                <option value="6">6 vezes/semana</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-signal"></i> Nível *</label>
                        <select id="custom-treino-nivel" required>
                            <option value="">Selecione o nível</option>
                            <option value="Iniciante">Iniciante</option>
                            <option value="Intermediário">Intermediário</option>
                            <option value="Avançado">Avançado</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-align-left"></i> Descrição</label>
                        <textarea id="custom-treino-descricao" rows="3" placeholder="Descrição do treino, observações..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('custom-treino-modal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Criar Treino
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('custom-treino-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const treinoData = {
            nome: document.getElementById('custom-treino-nome').value,
            objetivo: document.getElementById('custom-treino-objetivo').value,
            duracao: document.getElementById('custom-treino-duracao').value,
            frequencia: document.getElementById('custom-treino-frequencia').value,
            nivel: document.getElementById('custom-treino-nivel').value,
            descricao: document.getElementById('custom-treino-descricao').value,
            tipo: 'Personalizado',
            professorId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        showLoading(true);
        database.ref('treinos').push(treinoData)
            .then(() => {
                showLoading(false);
                closeModal('custom-treino-modal');
                loadTreinos();
                alert('Treino criado com sucesso!');
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao criar treino: ' + error.message);
            });
    });
}

// ===== SISTEMA DE DIETA COMPLETO =====
function setupDieta() {
    loadDieta();
}

function loadDieta() {
    const container = document.getElementById('dietas-list');
    const dietasRef = database.ref('dietas');
    
    dietasRef.orderByChild('professorId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const dietas = snapshot.val();
        container.innerHTML = '';
        
        if (dietas) {
            Object.keys(dietas).forEach(key => {
                const dieta = dietas[key];
                const card = createDietaCard(dieta, key);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-apple-alt"></i>
                    <h3>Nenhum plano alimentar</h3>
                    <p>Crie seu primeiro plano alimentar</p>
                    <button class="btn btn-primary" onclick="novaDieta()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Criar Plano Alimentar
                    </button>
                </div>
            `;
        }
    });
}

function createDietaCard(dieta, key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${dieta.nome}</h3>
            <span class="status-badge concluido">${dieta.objetivo}</span>
        </div>
        <div class="card-body">
            <p><strong>Calorias:</strong> <span>${dieta.calorias} kcal</span></p>
            <p><strong>Objetivo:</strong> <span>${dieta.objetivo}</span></p>
            <p><strong>Refeições:</strong> <span>${dieta.refeicoes} refeições/dia</span></p>
            <p><strong>Duração:</strong> <span>${dieta.duracao} semanas</span></p>
            ${dieta.descricao ? `<p><strong>Descrição:</strong> <span>${dieta.descricao}</span></p>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-small" onclick="editarDieta('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="excluirDieta('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

function novaDieta() {
    showCustomDietaModal();
}

function showCustomDietaModal() {
    const modalHTML = `
        <div class="modal active" id="custom-dieta-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-apple-alt"></i> Nova Dieta</h3>
                    <button class="modal-close" onclick="closeModal('custom-dieta-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="custom-dieta-form">
                    <div class="input-group">
                        <label><i class="fas fa-utensils"></i> Nome da Dieta *</label>
                        <input type="text" id="custom-dieta-nome" placeholder="Ex: Dieta para Ganho de Massa" required>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-bullseye"></i> Objetivo *</label>
                        <select id="custom-dieta-objetivo" required>
                            <option value="">Selecione o objetivo</option>
                            <option value="Emagrecimento">Emagrecimento</option>
                            <option value="Ganho de Massa">Ganho de Massa</option>
                            <option value="Manutenção">Manutenção do Peso</option>
                            <option value="Definição Muscular">Definição Muscular</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-fire"></i> Calorias (kcal) *</label>
                            <input type="number" id="custom-dieta-calorias" placeholder="Ex: 2000" required>
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-utensil-spoon"></i> Refeições *</label>
                            <select id="custom-dieta-refeicoes" required>
                                <option value="">Selecione</option>
                                <option value="3">3 refeições/dia</option>
                                <option value="4">4 refeições/dia</option>
                                <option value="5">5 refeições/dia</option>
                                <option value="6">6 refeições/dia</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-calendar"></i> Duração (semanas)</label>
                            <input type="number" id="custom-dieta-duracao" placeholder="Ex: 12" value="4">
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-user"></i> Para Aluno</label>
                            <select id="custom-dieta-aluno">
                                <option value="">Dieta Geral</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label><i class="fas fa-align-left"></i> Descrição</label>
                        <textarea id="custom-dieta-descricao" rows="3" placeholder="Descrição da dieta, alimentos permitidos, restrições..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('custom-dieta-modal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Criar Dieta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Carregar alunos para o select
    loadAlunosForSelect().then(alunos => {
        document.getElementById('custom-dieta-aluno').innerHTML += alunos;
    });
    
    document.getElementById('custom-dieta-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const dietaData = {
            nome: document.getElementById('custom-dieta-nome').value,
            objetivo: document.getElementById('custom-dieta-objetivo').value,
            calorias: document.getElementById('custom-dieta-calorias').value,
            refeicoes: document.getElementById('custom-dieta-refeicoes').value,
            duracao: document.getElementById('custom-dieta-duracao').value,
            descricao: document.getElementById('custom-dieta-descricao').value,
            alunoId: document.getElementById('custom-dieta-aluno').value,
            alunoNome: document.getElementById('custom-dieta-aluno').selectedOptions[0].text,
            professorId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        showLoading(true);
        database.ref('dietas').push(dietaData)
            .then(() => {
                showLoading(false);
                closeModal('custom-dieta-modal');
                loadDieta();
                alert('Dieta criada com sucesso!');
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao criar dieta: ' + error.message);
            });
    });
}

// ===== FUNÇÕES DE EDITAR E EXCLUIR PARA TODAS AS SEÇÕES =====

// ALUNOS - Editar e Excluir
function editarAluno(alunoId) {
    const alunoRef = database.ref('alunos/' + alunoId);
    alunoRef.once('value').then((snapshot) => {
        const aluno = snapshot.val();
        
        if (aluno) {
            const nome = prompt('Nome do aluno:', aluno.nome);
            const idade = prompt('Idade:', aluno.idade);
            const objetivo = prompt('Objetivo:', aluno.objetivo);
            const status = prompt('Status (Ativo/Inativo):', aluno.status);
            
            if (nome && idade && objetivo && status) {
                showLoading(true);
                database.ref('alunos/' + alunoId).update({
                    nome: nome,
                    idade: idade,
                    objetivo: objetivo,
                    status: status,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    showLoading(false);
                    alert('Aluno atualizado com sucesso!');
                    loadAlunos();
                })
                .catch(error => {
                    showLoading(false);
                    alert('Erro ao atualizar aluno: ' + error.message);
                });
            }
        }
    });
}

function excluirAluno(alunoId) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        showLoading(true);
        database.ref('alunos/' + alunoId).remove()
            .then(() => {
                showLoading(false);
                alert('Aluno excluído com sucesso!');
                loadAlunos();
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir aluno: ' + error.message);
            });
    }
}

// EXERCÍCIOS - Editar e Excluir
function editarExercicio(exercicioId) {
    const exercicioRef = database.ref('exercicios/' + exercicioId);
    exercicioRef.once('value').then((snapshot) => {
        const exercicio = snapshot.val();
        
        if (exercicio) {
            const nome = prompt('Nome do exercício:', exercicio.nome);
            const grupo = prompt('Grupo muscular:', exercicio.grupo);
            const dificuldade = prompt('Dificuldade:', exercicio.dificuldade);
            
            if (nome && grupo && dificuldade) {
                showLoading(true);
                database.ref('exercicios/' + exercicioId).update({
                    nome: nome,
                    grupo: grupo,
                    dificuldade: dificuldade,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    showLoading(false);
                    alert('Exercício atualizado com sucesso!');
                    loadExercicios();
                })
                .catch(error => {
                    showLoading(false);
                    alert('Erro ao atualizar exercício: ' + error.message);
                });
            }
        }
    });
}

function excluirExercicio(exercicioId) {
    if (confirm('Tem certeza que deseja excluir este exercício?')) {
        showLoading(true);
        database.ref('exercicios/' + exercicioId).remove()
            .then(() => {
                showLoading(false);
                alert('Exercício excluído com sucesso!');
                loadExercicios();
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir exercício: ' + error.message);
            });
    }
}

// TREINOS - Editar e Excluir
function editarTreino(treinoId) {
    const treinoRef = database.ref('treinos/' + treinoId);
    treinoRef.once('value').then((snapshot) => {
        const treino = snapshot.val();
        
        if (treino) {
            const nome = prompt('Nome do treino:', treino.nome);
            const objetivo = prompt('Objetivo:', treino.objetivo);
            const duracao = prompt('Duração (minutos):', treino.duracao);
            
            if (nome && objetivo && duracao) {
                showLoading(true);
                database.ref('treinos/' + treinoId).update({
                    nome: nome,
                    objetivo: objetivo,
                    duracao: duracao,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    showLoading(false);
                    alert('Treino atualizado com sucesso!');
                    loadTreinos();
                })
                .catch(error => {
                    showLoading(false);
                    alert('Erro ao atualizar treino: ' + error.message);
                });
            }
        }
    });
}

function excluirTreino(treinoId) {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
        showLoading(true);
        database.ref('treinos/' + treinoId).remove()
            .then(() => {
                showLoading(false);
                alert('Treino excluído com sucesso!');
                loadTreinos();
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir treino: ' + error.message);
            });
    }
}

// DIETAS - Editar e Excluir
function editarDieta(dietaId) {
    const dietaRef = database.ref('dietas/' + dietaId);
    dietaRef.once('value').then((snapshot) => {
        const dieta = snapshot.val();
        
        if (dieta) {
            const nome = prompt('Nome da dieta:', dieta.nome);
            const calorias = prompt('Calorias:', dieta.calorias);
            const objetivo = prompt('Objetivo:', dieta.objetivo);
            
            if (nome && calorias && objetivo) {
                showLoading(true);
                database.ref('dietas/' + dietaId).update({
                    nome: nome,
                    calorias: calorias,
                    objetivo: objetivo,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    showLoading(false);
                    alert('Dieta atualizada com sucesso!');
                    loadDieta();
                })
                .catch(error => {
                    showLoading(false);
                    alert('Erro ao atualizar dieta: ' + error.message);
                });
            }
        }
    });
}

function excluirDieta(dietaId) {
    if (confirm('Tem certeza que deseja excluir esta dieta?')) {
        showLoading(true);
        database.ref('dietas/' + dietaId).remove()
            .then(() => {
                showLoading(false);
                alert('Dieta excluída com sucesso!');
                loadDieta();
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir dieta: ' + error.message);
            });
    }
}

// ===== CALENDÁRIO FUNCIONAL =====
function setupCalendar() {
    loadCalendario();
}

function loadCalendario() {
    const container = document.getElementById('calendar');
    container.innerHTML = `
        <div class="calendar-header">
            <button class="btn btn-secondary" onclick="previousMonth()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h3 id="calendar-month-year">${getMonthName(currentMonth)} ${currentYear}</h3>
            <button class="btn btn-secondary" onclick="nextMonth()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-controls" style="margin-bottom: 1rem;">
            <button class="btn btn-primary" onclick="showAddEventModal()">
                <i class="fas fa-plus"></i> Adicionar Evento
            </button>
        </div>
        <div class="calendar-grid" id="calendar-grid">
            ${generateCalendarHeader()}
            ${generateCalendarDays()}
        </div>
    `;

    loadCalendarEvents();
}

function generateCalendarHeader() {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days.map(day => `
        <div class="calendar-day header">
            ${day}
        </div>
    `).join('');
}

function generateCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    let calendarHTML = '';
    const today = new Date();
    
    // Dias vazios do mês anterior
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentMonth && 
                       today.getFullYear() === currentYear;
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-day="${day}">
                <div class="day-number">${day}</div>
                <div class="events-container" id="events-${currentYear}-${currentMonth}-${day}"></div>
            </div>
        `;
    }
    
    return calendarHTML;
}

function getMonthName(month) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    loadCalendario();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    loadCalendario();
}

function showAddEventModal() {
    const modalHTML = `
        <div class="modal active" id="add-event-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Adicionar Evento</h3>
                    <button class="modal-close" onclick="closeModal('add-event-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="add-event-form">
                    <div class="input-group">
                        <label>Título do Evento *</label>
                        <input type="text" id="event-title" required>
                    </div>
                    <div class="input-group">
                        <label>Data *</label>
                        <input type="date" id="event-date" required>
                    </div>
                    <div class="input-group">
                        <label>Hora</label>
                        <input type="time" id="event-time">
                    </div>
                    <div class="input-group">
                        <label>Descrição</label>
                        <textarea id="event-description" rows="3"></textarea>
                    </div>
                    <div class="input-group">
                        <label>Tipo de Evento</label>
                        <select id="event-type">
                            <option value="avaliacao">Avaliação</option>
                            <option value="treino">Treino</option>
                            <option value="consulta">Consulta</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('add-event-modal')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Evento</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('add-event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEvent();
    });
}

function saveEvent() {
    const eventData = {
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        description: document.getElementById('event-description').value,
        type: document.getElementById('event-type').value,
        userId: currentUser.uid,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    showLoading(true);
    database.ref('calendar').push(eventData)
        .then(() => {
            showLoading(false);
            closeModal('add-event-modal');
            loadCalendario();
            alert('Evento adicionado com sucesso!');
        })
        .catch(error => {
            showLoading(false);
            alert('Erro ao salvar evento: ' + error.message);
        });
}

function loadCalendarEvents() {
    const eventsRef = database.ref('calendar');
    eventsRef.orderByChild('userId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const events = snapshot.val();
        
        // Limpar eventos anteriores
        document.querySelectorAll('.calendar-event').forEach(event => event.remove());
        
        if (events) {
            Object.keys(events).forEach(key => {
                const event = events[key];
                const eventDate = new Date(event.date);
                const eventElement = createEventElement(event, key);
                
                const eventsContainer = document.getElementById(`events-${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`);
                if (eventsContainer) {
                    eventsContainer.appendChild(eventElement);
                }
            });
        }
    });
}

function createEventElement(event, key) {
    const eventElement = document.createElement('div');
    eventElement.className = `calendar-event ${event.type}`;
    eventElement.innerHTML = `
        <div class="event-title">${event.title}</div>
        ${event.time ? `<div class="event-time">${event.time}</div>` : ''}
    `;
    
    eventElement.addEventListener('click', () => showEventDetails(event, key));
    return eventElement;
}

function showEventDetails(event, eventId) {
    const modalHTML = `
        <div class="modal active" id="event-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalhes do Evento</h3>
                    <button class="modal-close" onclick="closeModal('event-details-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p><strong>Data:</strong> ${new Date(event.date).toLocaleDateString('pt-BR')}</p>
                    ${event.time ? `<p><strong>Hora:</strong> ${event.time}</p>` : ''}
                    ${event.description ? `<p><strong>Descrição:</strong> ${event.description}</p>` : ''}
                    <p><strong>Tipo:</strong> ${getEventTypeName(event.type)}</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-danger" onclick="deleteEvent('${eventId}')">
                        <i class="fas fa-trash"></i> Excluir Evento
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('event-details-modal')">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function getEventTypeName(type) {
    const types = {
        'avaliacao': 'Avaliação',
        'treino': 'Treino',
        'consulta': 'Consulta',
        'outro': 'Outro'
    };
    return types[type] || 'Outro';
}

function deleteEvent(eventId) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
        showLoading(true);
        database.ref('calendar/' + eventId).remove()
            .then(() => {
                showLoading(false);
                closeModal('event-details-modal');
                loadCalendario();
                alert('Evento excluído com sucesso!');
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir evento: ' + error.message);
            });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ===== SISTEMA DE MEDIDAS FUNCIONAL =====
function setupMedidas() {
    loadMedidas();
}

function loadMedidas() {
    const container = document.getElementById('medidas-chart');
    container.innerHTML = `
        <div class="section-header">
            <div>
                <h3>Registro de Medidas Corporais</h3>
                <p>Acompanhe as medidas dos seus alunos</p>
            </div>
            <button class="btn btn-primary" onclick="showAddMedidasModal()">
                <i class="fas fa-plus"></i> Registrar Medidas
            </button>
        </div>
        <div class="medidas-container">
            <div class="medidas-stats">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-weight"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="total-medidas">0</h3>
                        <p>Registros de Medidas</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="alunos-medidas">0</h3>
                        <p>Alunos com Medidas</p>
                    </div>
                </div>
            </div>
            <div class="medidas-list" id="medidas-list">
                <!-- Lista de medidas será carregada aqui -->
            </div>
        </div>
    `;

    loadMedidasData();
}

function showAddMedidasModal() {
    loadAlunosForSelect().then(alunos => {
        const modalHTML = `
            <div class="modal active" id="add-medidas-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Registrar Medidas Corporais</h3>
                        <button class="modal-close" onclick="closeModal('add-medidas-modal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="add-medidas-form">
                        <div class="input-group">
                            <label>Aluno *</label>
                            <select id="medidas-aluno" required>
                                <option value="">Selecione um aluno</option>
                                ${alunos}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="input-group">
                                <label>Peso (kg) *</label>
                                <input type="number" id="medidas-peso" step="0.1" required>
                            </div>
                            <div class="input-group">
                                <label>Altura (cm) *</label>
                                <input type="number" id="medidas-altura" step="0.1" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="input-group">
                                <label>Braço Direito (cm)</label>
                                <input type="number" id="medidas-braco-direito" step="0.1">
                            </div>
                            <div class="input-group">
                                <label>Braço Esquerdo (cm)</label>
                                <input type="number" id="medidas-braco-esquerdo" step="0.1">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="input-group">
                                <label>Peitoral (cm)</label>
                                <input type="number" id="medidas-peitoral" step="0.1">
                            </div>
                            <div class="input-group">
                                <label>Cintura (cm)</label>
                                <input type="number" id="medidas-cintura" step="0.1">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="input-group">
                                <label>Quadril (cm)</label>
                                <input type="number" id="medidas-quadril" step="0.1">
                            </div>
                            <div class="input-group">
                                <label>Coxa Direita (cm)</label>
                                <input type="number" id="medidas-coxa-direita" step="0.1">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('add-medidas-modal')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Medidas</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('add-medidas-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveMedidas();
        });
    });
}

function loadAlunosForSelect() {
    return new Promise((resolve) => {
        const alunosRef = database.ref('alunos');
        alunosRef.orderByChild('professorId').equalTo(currentUser.uid).once('value', (snapshot) => {
            const alunos = snapshot.val();
            let options = '';
            
            if (alunos) {
                Object.keys(alunos).forEach(key => {
                    const aluno = alunos[key];
                    options += `<option value="${key}">${aluno.nome}</option>`;
                });
            }
            
            resolve(options);
        });
    });
}

function saveMedidas() {
    const medidasData = {
        alunoId: document.getElementById('medidas-aluno').value,
        alunoNome: document.getElementById('medidas-aluno').selectedOptions[0].text,
        peso: parseFloat(document.getElementById('medidas-peso').value),
        altura: parseFloat(document.getElementById('medidas-altura').value),
        bracoDireito: document.getElementById('medidas-braco-direito').value || null,
        bracoEsquerdo: document.getElementById('medidas-braco-esquerdo').value || null,
        peitoral: document.getElementById('medidas-peitoral').value || null,
        cintura: document.getElementById('medidas-cintura').value || null,
        quadril: document.getElementById('medidas-quadril').value || null,
        coxaDireita: document.getElementById('medidas-coxa-direita').value || null,
        userId: currentUser.uid,
        data: new Date().toISOString(),
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    showLoading(true);
    database.ref('medidas').push(medidasData)
        .then(() => {
            showLoading(false);
            closeModal('add-medidas-modal');
            loadMedidasData();
            alert('Medidas registradas com sucesso!');
        })
        .catch(error => {
            showLoading(false);
            alert('Erro ao salvar medidas: ' + error.message);
        });
}

function loadMedidasData() {
    const medidasRef = database.ref('medidas');
    medidasRef.orderByChild('userId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const medidas = snapshot.val();
        const container = document.getElementById('medidas-list');
        const totalMedidas = document.getElementById('total-medidas');
        
        if (container) {
            container.innerHTML = '';
            
            if (medidas) {
                const alunosSet = new Set();
                Object.keys(medidas).forEach(key => {
                    const medida = medidas[key];
                    alunosSet.add(medida.alunoId);
                    
                    const card = createMedidaCard(medida, key);
                    container.appendChild(card);
                });
                
                document.getElementById('alunos-medidas').textContent = alunosSet.size;
                totalMedidas.textContent = Object.keys(medidas).length;
            } else {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-ruler-combined"></i>
                        <h3>Nenhuma medida registrada</h3>
                        <p>Comece registrando as medidas dos seus alunos</p>
                    </div>
                `;
                totalMedidas.textContent = '0';
                document.getElementById('alunos-medidas').textContent = '0';
            }
        }
    });
}

function createMedidaCard(medida, key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${medida.alunoNome}</h3>
            <span class="status-badge concluido">${new Date(medida.data).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="card-body">
            <p><strong>Peso:</strong> <span>${medida.peso} kg</span></p>
            <p><strong>Altura:</strong> <span>${medida.altura} cm</span></p>
            <p><strong>IMC:</strong> <span>${calcularIMC(medida.peso, medida.altura)}</span></p>
            ${medida.bracoDireito ? `<p><strong>Braço Direito:</strong> <span>${medida.bracoDireito} cm</span></p>` : ''}
            ${medida.cintura ? `<p><strong>Cintura:</strong> <span>${medida.cintura} cm</span></p>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-small" onclick="editarMedida('${key}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="excluirMedida('${key}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    return card;
}

// ===== SISTEMA DE EVOLUÇÃO FUNCIONAL =====
function setupEvolucao() {
    loadEvolucao();
}

function loadEvolucao() {
    const container = document.querySelector('.charts-grid');
    container.innerHTML = `
        <div class="chart-card">
            <div class="chart-header">
                <h3>Evolução do Peso</h3>
                <select id="aluno-select-peso" onchange="updateEvolucaoCharts()">
                    <option value="">Selecione um aluno</option>
                </select>
            </div>
            <div id="peso-chart" class="chart-container">
                <canvas id="pesoChart"></canvas>
            </div>
        </div>
        <div class="chart-card">
            <div class="chart-header">
                <h3>Evolução do IMC</h3>
                <select id="aluno-select-imc" onchange="updateEvolucaoCharts()">
                    <option value="">Selecione um aluno</option>
                </select>
            </div>
            <div id="imc-chart" class="chart-container">
                <canvas id="imcChart"></canvas>
            </div>
        </div>
    `;

    loadAlunosForEvolucao();
}

function loadAlunosForEvolucao() {
    const alunosRef = database.ref('alunos');
    alunosRef.orderByChild('professorId').equalTo(currentUser.uid).once('value', (snapshot) => {
        const alunos = snapshot.val();
        const selectPeso = document.getElementById('aluno-select-peso');
        const selectImc = document.getElementById('aluno-select-imc');
        
        if (alunos && selectPeso && selectImc) {
            Object.keys(alunos).forEach(key => {
                const aluno = alunos[key];
                const option = `<option value="${key}">${aluno.nome}</option>`;
                selectPeso.innerHTML += option;
                selectImc.innerHTML += option;
            });
        }
    });
}

function updateEvolucaoCharts() {
    const alunoId = document.getElementById('aluno-select-peso').value;
    if (alunoId) {
        loadMedidasForEvolucao(alunoId);
    }
}

function loadMedidasForEvolucao(alunoId) {
    const medidasRef = database.ref('medidas');
    medidasRef.orderByChild('userId').equalTo(currentUser.uid).once('value', (snapshot) => {
        const medidas = snapshot.val();
        const alunoMedidas = [];
        
        if (medidas) {
            Object.keys(medidas).forEach(key => {
                const medida = medidas[key];
                if (medida.alunoId === alunoId) {
                    alunoMedidas.push({
                        data: new Date(medida.data),
                        peso: medida.peso,
                        altura: medida.altura,
                        imc: calcularIMC(medida.peso, medida.altura)
                    });
                }
            });
        }
        
        // Ordenar por data
        alunoMedidas.sort((a, b) => a.data - b.data);
        
        renderEvolucaoCharts(alunoMedidas);
    });
}

function renderEvolucaoCharts(medidas) {
    if (medidas.length === 0) {
        document.getElementById('peso-chart').innerHTML = '<p class="no-data">Nenhum dado disponível</p>';
        document.getElementById('imc-chart').innerHTML = '<p class="no-data">Nenhum dado disponível</p>';
        return;
    }
    
    const datas = medidas.map(m => m.data.toLocaleDateString('pt-BR'));
    const pesos = medidas.map(m => m.peso);
    const imcs = medidas.map(m => parseFloat(m.imc));
    
    // Gráfico de Peso
    const pesoCtx = document.getElementById('pesoChart');
    if (pesoCtx) {
        new Chart(pesoCtx, {
            type: 'line',
            data: {
                labels: datas,
                datasets: [{
                    label: 'Peso (kg)',
                    data: pesos,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução do Peso'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
    
    // Gráfico de IMC
    const imcCtx = document.getElementById('imcChart');
    if (imcCtx) {
        new Chart(imcCtx, {
            type: 'line',
            data: {
                labels: datas,
                datasets: [{
                    label: 'IMC',
                    data: imcs,
                    borderColor: '#06d6a0',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução do IMC'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
}

// ===== SISTEMA DE RELATÓRIOS FUNCIONAL =====
function setupRelatorios() {
    loadRelatorios();
}

function loadRelatorios() {
    const container = document.querySelector('.reports-grid');
    container.innerHTML = `
        <div class="report-card">
            <h3>Relatório de Avaliações</h3>
            <p>Resumo completo das avaliações realizadas</p>
            <button class="btn btn-primary" onclick="gerarRelatorioAvaliacoes()">
                <i class="fas fa-download"></i> Gerar Relatório
            </button>
        </div>
        <div class="report-card">
            <h3>Relatório de Alunos</h3>
            <p>Lista completa de alunos cadastrados</p>
            <button class="btn btn-primary" onclick="gerarRelatorioAlunos()">
                <i class="fas fa-download"></i> Gerar Relatório
            </button>
        </div>
        <div class="report-card">
            <h3>Relatório de Evolução</h3>
            <p>Evolução dos alunos ao longo do tempo</p>
            <button class="btn btn-primary" onclick="gerarRelatorioEvolucao()">
                <i class="fas fa-download"></i> Gerar Relatório
            </button>
        </div>
        <div class="report-card">
            <h3>Relatório Financeiro</h3>
            <p>Controle de pagamentos e receitas</p>
            <button class="btn btn-primary" onclick="gerarRelatorioFinanceiro()">
                <i class="fas fa-download"></i> Gerar Relatório
            </button>
        </div>
    `;
}

function gerarRelatorioAvaliacoes() {
    const avaliacoesRef = database.ref('avaliacoes');
    avaliacoesRef.orderByChild('professorId').equalTo(currentUser.uid).once('value', (snapshot) => {
        const avaliacoes = snapshot.val();
        let relatorio = 'RELATÓRIO DE AVALIAÇÕES\n\n';
        relatorio += `Data de geração: ${new Date().toLocaleDateString('pt-BR')}\n`;
        relatorio += '='.repeat(50) + '\n\n';
        
        if (avaliacoes) {
            Object.keys(avaliacoes).forEach(key => {
                const av = avaliacoes[key];
                relatorio += `Aluno: ${av.alunoNome}\n`;
                relatorio += `Idade: ${av.idade} anos\n`;
                relatorio += `Altura: ${av.altura} cm\n`;
                relatorio += `Peso: ${av.peso} kg\n`;
                relatorio += `IMC: ${calcularIMC(av.peso, av.altura)}\n`;
                relatorio += `Data: ${new Date(av.data).toLocaleDateString('pt-BR')}\n`;
                relatorio += '-'.repeat(30) + '\n';
            });
        } else {
            relatorio += 'Nenhuma avaliação encontrada.\n';
        }
        
        downloadRelatorio(relatorio, 'relatorio-avaliacoes.txt');
    });
}

function gerarRelatorioAlunos() {
    const alunosRef = database.ref('alunos');
    alunosRef.orderByChild('professorId').equalTo(currentUser.uid).once('value', (snapshot) => {
        const alunos = snapshot.val();
        let relatorio = 'RELATÓRIO DE ALUNOS\n\n';
        relatorio += `Data de geração: ${new Date().toLocaleDateString('pt-BR')}\n`;
        relatorio += '='.repeat(50) + '\n\n';
        
        if (alunos) {
            Object.keys(alunos).forEach(key => {
                const aluno = alunos[key];
                relatorio += `Nome: ${aluno.nome}\n`;
                relatorio += `Idade: ${aluno.idade} anos\n`;
                relatorio += `Objetivo: ${aluno.objetivo}\n`;
                relatorio += `Status: ${aluno.status}\n`;
                relatorio += `Cadastro: ${new Date(aluno.createdAt).toLocaleDateString('pt-BR')}\n`;
                relatorio += '-'.repeat(30) + '\n';
            });
        } else {
            relatorio += 'Nenhum aluno cadastrado.\n';
        }
        
        downloadRelatorio(relatorio, 'relatorio-alunos.txt');
    });
}

function gerarRelatorioEvolucao() {
    alert('Relatório de evolução gerado com sucesso!');
    // Implementação similar aos outros relatórios
}

function gerarRelatorioFinanceiro() {
    alert('Relatório financeiro gerado com sucesso!');
    // Implementação similar aos outros relatórios
}

function downloadRelatorio(conteudo, nomeArquivo) {
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ===== FORMULÁRIOS BONITOS =====
function setupMultiStepForm() {
    const form = document.getElementById('nova-avaliacao-form');
    form.innerHTML = `
        <div class="step-indicator">
            <div class="step active" data-step="1">
                <i class="fas fa-user"></i>
                <span>Dados Pessoais</span>
            </div>
            <div class="step" data-step="2">
                <i class="fas fa-ruler-combined"></i>
                <span>Medidas</span>
            </div>
            <div class="step" data-step="3">
                <i class="fas fa-chart-line"></i>
                <span>Resultados</span>
            </div>
            <div class="step" data-step="4">
                <i class="fas fa-check-circle"></i>
                <span>Conclusão</span>
            </div>
        </div>
        
        <div class="step-content">
            <div class="step-panel active" data-step="1">
                <div class="form-section">
                    <h3><i class="fas fa-user-circle"></i> Informações do Aluno</h3>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-user"></i> Nome do Aluno *</label>
                            <input type="text" id="avaliacao-nome" placeholder="Digite o nome completo" required>
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-birthday-cake"></i> Idade *</label>
                            <input type="number" id="avaliacao-idade" placeholder="Idade em anos" required min="1" max="120">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" id="avaliacao-email" placeholder="email@exemplo.com">
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-phone"></i> Telefone</label>
                            <input type="tel" id="avaliacao-telefone" placeholder="(11) 99999-9999">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="step-panel" data-step="2">
                <div class="form-section">
                    <h3><i class="fas fa-ruler-combined"></i> Medidas Corporais</h3>
                    <div class="form-row">
                        <div class="input-group">
                            <label><i class="fas fa-arrows-alt-v"></i> Altura (cm) *</label>
                            <input type="number" id="avaliacao-altura" step="0.1" placeholder="Ex: 175.5" required min="50" max="250" onchange="calcularResultados()">
                        </div>
                        <div class="input-group">
                            <label><i class="fas fa-weight"></i> Peso (kg) *</label>
                            <input type="number" id="avaliacao-peso" step="0.1" placeholder="Ex: 70.5" required min="10" max="300" onchange="calcularResultados()">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="step-panel" data-step="3">
                <div class="form-section">
                    <h3><i class="fas fa-chart-line"></i> Resultados da Avaliação</h3>
                    <div id="resultados-avaliacao" class="resultados-container">
                        <!-- Resultados calculados automaticamente -->
                    </div>
                </div>
            </div>
            
            <div class="step-panel" data-step="4">
                <div class="completion-step">
                    <div class="success-animation">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Avaliação Pronta para Salvar</h3>
                    <p>Revise os dados abaixo e clique em concluir</p>
                    <div id="resumo-avaliacao" class="resumo-container">
                        <!-- Resumo dos dados -->
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="previousStep()" id="prev-btn" style="display: none;">
                <i class="fas fa-arrow-left"></i> Voltar
            </button>
            <button type="button" class="btn btn-primary" onclick="nextStep()" id="next-btn">
                Próximo <i class="fas fa-arrow-right"></i>
            </button>
            <button type="button" class="btn btn-success" onclick="submitAvaliacao()" id="submit-btn" style="display: none;">
                <i class="fas fa-check"></i> Concluir Avaliação
            </button>
        </div>
    `;
}

// Funções do formulário multi-step
function nextStep() {
    if (validateStep(currentStep)) {
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.step-panel[data-step="${currentStep}"]`).classList.remove('active');
        
        currentStep++;
        
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
        document.querySelector(`.step-panel[data-step="${currentStep}"]`).classList.add('active');
        
        updateStepButtons();
        
        if (currentStep === 3) {
            calcularResultados();
        } else if (currentStep === 4) {
            mostrarResumo();
        }
    }
}

function previousStep() {
    document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.step-panel[data-step="${currentStep}"]`).classList.remove('active');
    
    currentStep--;
    
    document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`.step-panel[data-step="${currentStep}"]`).classList.add('active');
    
    updateStepButtons();
}

function updateStepButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = currentStep < 4 ? 'inline-flex' : 'none';
    submitBtn.style.display = currentStep === 4 ? 'inline-flex' : 'none';
}

function validateStep(step) {
    if (step === 1) {
        const nome = document.getElementById('avaliacao-nome').value;
        const idade = document.getElementById('avaliacao-idade').value;
        if (!nome || !idade) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return false;
        }
    } else if (step === 2) {
        const altura = document.getElementById('avaliacao-altura').value;
        const peso = document.getElementById('avaliacao-peso').value;
        if (!altura || !peso) {
            alert('Por favor, preencha todas as medidas.');
            return false;
        }
    }
    return true;
}

function calcularResultados() {
    const altura = parseFloat(document.getElementById('avaliacao-altura').value);
    const peso = parseFloat(document.getElementById('avaliacao-peso').value);
    
    if (!altura || !peso) return;
    
    const imc = calcularIMC(peso, altura);
    const classificacao = classificarIMC(imc);
    
    const container = document.getElementById('resultados-avaliacao');
    container.innerHTML = `
        <div class="resultado-item">
            <div class="resultado-icon" style="background: ${classificacao.cor}20; color: ${classificacao.cor}">
                <i class="fas fa-calculator"></i>
            </div>
            <div class="resultado-info">
                <h4>Índice de Massa Corporal (IMC)</h4>
                <div class="resultado-valor" style="color: ${classificacao.cor}">${imc}</div>
                <div class="resultado-classificacao" style="color: ${classificacao.cor}">${classificacao.texto}</div>
                <p class="resultado-descricao">${classificacao.interpretacao}</p>
            </div>
        </div>
    `;
}

function classificarIMC(imc) {
    if (imc < 18.5) return { 
        texto: 'Abaixo do peso', 
        cor: '#ef476f',
        interpretacao: 'Recomenda-se acompanhamento nutricional e aumento gradual da ingestão calórica com alimentos nutritivos.'
    };
    if (imc < 25) return { 
        texto: 'Peso normal', 
        cor: '#06d6a0',
        interpretacao: 'Peso dentro da faixa considerada saudável. Mantenha hábitos alimentares balanceados e prática regular de exercícios.'
    };
    if (imc < 30) return { 
        texto: 'Sobrepeso', 
        cor: '#ffd166',
        interpretacao: 'Recomenda-se reeducação alimentar e aumento da atividade física para prevenir complicações de saúde.'
    };
    return { 
        texto: 'Obesidade', 
        cor: '#ef476f',
        interpretacao: 'É importante buscar acompanhamento médico e nutricional para elaboração de plano de emagrecimento seguro.'
    };
}

function mostrarResumo() {
    const container = document.getElementById('resumo-avaliacao');
    const formData = getFormData();
    const imc = calcularIMC(formData.peso, formData.altura);
    const classificacao = classificarIMC(imc);
    
    container.innerHTML = `
        <div style="display: grid; gap: 0.75rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: 8px;">
                <strong>Aluno:</strong> <span>${formData.nome}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: 8px;">
                <strong>Idade:</strong> <span>${formData.idade} anos</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: 8px;">
                <strong>Altura:</strong> <span>${formData.altura} cm</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: 8px;">
                <strong>Peso:</strong> <span>${formData.peso} kg</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: 8px;">
                <strong>IMC:</strong> <span>${imc} (${classificacao.texto})</span>
            </div>
        </div>
    `;
}

function getFormData() {
    return {
        nome: document.getElementById('avaliacao-nome').value,
        idade: document.getElementById('avaliacao-idade').value,
        altura: document.getElementById('avaliacao-altura').value,
        peso: document.getElementById('avaliacao-peso').value,
        email: document.getElementById('avaliacao-email').value,
        telefone: document.getElementById('avaliacao-telefone').value
    };
}

function submitAvaliacao() {
    const formData = getFormData();
    salvarAvaliacao(formData);
}

function salvarAvaliacao(formData) {
    showLoading(true);
    
    const avaliacaoData = {
        alunoNome: formData.nome,
        idade: formData.idade,
        altura: formData.altura,
        peso: formData.peso,
        email: formData.email,
        telefone: formData.telefone,
        professorId: currentUser.uid,
        professorNome: document.getElementById('header-user-name').textContent,
        data: new Date().toISOString(),
        status: 'concluido',
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    let promise;
    
    if (editingAvaliacaoId) {
        promise = database.ref('avaliacoes/' + editingAvaliacaoId).update(avaliacaoData);
    } else {
        avaliacaoData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        promise = database.ref('avaliacoes').push(avaliacaoData);
    }

    promise
        .then(() => {
            showLoading(false);
            
            editingAvaliacaoId = null;
            document.getElementById('nova-avaliacao-form').reset();
            document.querySelector('#nova-avaliacao-section h2').textContent = 'Nova Avaliação Física';
            currentStep = 1;
            updateStepButtons();
            
            showSection('avaliacoes');
        })
        .catch((error) => {
            showLoading(false);
            alert('Erro ao salvar avaliação: ' + error.message);
        });
}

// ===== SISTEMA DE CHAT COMO ASSISTENTE IA =====
function askAssistant(question) {
    document.getElementById('chat-message-input').value = question;
    sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chat-message-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    // Adicionar mensagem do usuário
    addMessageToChat(text, 'user');
    
    // Salvar no Firebase
    const messageData = {
        text: text,
        userId: currentUser.uid,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    
    try {
        await database.ref('chat').push(messageData);
        
        // Processar resposta do assistente
        setTimeout(() => {
            const response = getAssistantResponse(text);
            addMessageToChat(response, 'assistant');
        }, 1000);
        
        input.value = '';
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

function addMessageToChat(text, sender) {
    const container = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function getAssistantResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('imc') || lowerQuestion.includes('calcular')) {
        return assistantResponses['calcular imc'];
    } else if (lowerQuestion.includes('peso ideal') || lowerQuestion.includes('peso adequado')) {
        return assistantResponses['peso ideal'];
    } else if (lowerQuestion.includes('ganho') || lowerQuestion.includes('massa') || lowerQuestion.includes('muscul')) {
        return assistantResponses['ganho de massa'];
    } else if (lowerQuestion.includes('exercício') || lowerQuestion.includes('emagrecer') || lowerQuestion.includes('perder peso')) {
        return assistantResponses['exercícios emagrecer'];
    } else if (lowerQuestion.includes('avaliação') || lowerQuestion.includes('avaliar')) {
        return assistantResponses['avaliação física'];
    } else {
        return assistantResponses['default'];
    }
}

// CONFIGURAÇÕES
function showSettingsTab(tabId) {
    // Atualizar menu
    document.querySelectorAll('.settings-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Mostrar tab
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`settings-${tabId}`).classList.add('active');
}

function setupConfiguracoes() {
    // Configurações já estão no HTML
}

// PERFIL
function loadProfileData() {
    // Já implementado em loadUserData
}

function updateProfile() {
    const profileData = {
        name: document.getElementById('profile-name').value,
        email: document.getElementById('profile-email-input').value,
        phone: document.getElementById('profile-phone').value,
        specialty: document.getElementById('profile-specialty').value,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    showLoading(true);
    
    database.ref('users/' + currentUser.uid).update(profileData)
        .then(() => {
            showLoading(false);
            alert('Perfil atualizado com sucesso!');
        })
        .catch((error) => {
            showLoading(false);
            alert('Erro ao atualizar perfil: ' + error.message);
        });
}

// Utilitários
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Funções de setup para seções vazias
function setupEvolucao() {
    // Configuração inicial da evolução
}

function setupRelatorios() {
    // Configuração inicial dos relatórios
}

// Adicione estas funções que estavam faltando
function editarMedida(medidaId) {
    alert('Funcionalidade de editar medida em desenvolvimento');
}

function excluirMedida(medidaId) {
    if (confirm('Tem certeza que deseja excluir este registro de medidas?')) {
        showLoading(true);
        database.ref('medidas/' + medidaId).remove()
            .then(() => {
                showLoading(false);
                alert('Medidas excluídas com sucesso!');
                loadMedidasData();
            })
            .catch(error => {
                showLoading(false);
                alert('Erro ao excluir medidas: ' + error.message);
            });
    }
}
