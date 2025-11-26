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

// Variáveis globais
let alunoEditando = null;
let avaliacaoEditando = null;

// Sistema de abas
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'alunos') {
        carregarAlunos();
    } else if (tabName === 'avaliacao') {
        carregarSelectAlunos();
        carregarAvaliacoes();
    }
}

// CHAT
function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    const messagesDiv = document.getElementById('messages');
    
    messagesDiv.innerHTML += `
        <div class="message user">
            <strong>Você:</strong> ${message}
        </div>
    `;
    
    let resposta = gerarResposta(message);
    
    setTimeout(() => {
        messagesDiv.innerHTML += `
            <div class="message bot">
                <strong>Assistente:</strong> ${resposta}
            </div>
        `;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 500);
    
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function gerarResposta(mensagem) {
    const msg = mensagem.toLowerCase();
    
    if (msg.includes('oi') || msg.includes('olá')) {
        return 'Olá! Em que posso ajudar? 🤗';
    } else if (msg.includes('excluir') || msg.includes('deletar')) {
        return 'Para excluir, clique no botão "Excluir" nos cards dos alunos ou avaliações. 🗑️';
    } else if (msg.includes('editar')) {
        return 'Clique em "Editar" para modificar os dados. ✏️';
    } else {
        return 'Posso ajudar com cadastro, edição e exclusão de alunos e avaliações! 💪';
    }
}

// GERENCIAMENTO DE ALUNOS - REALTIME DATABASE
async function salvarAluno(event) {
    event.preventDefault();
    
    const alunoData = {
        nome: document.getElementById('nome').value,
        idade: parseInt(document.getElementById('idade').value),
        peso: parseFloat(document.getElementById('peso').value),
        altura: parseFloat(document.getElementById('altura').value),
        objetivo: document.getElementById('objetivo').value,
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    try {
        if (alunoEditando) {
            // Editar aluno existente
            await database.ref('alunos/' + alunoEditando).update(alunoData);
            showAlert('✅ Aluno atualizado com sucesso!', 'success');
        } else {
            // Cadastrar novo aluno
            const novoAlunoRef = database.ref('alunos').push();
            await novoAlunoRef.set(alunoData);
            showAlert('✅ Aluno cadastrado com sucesso!', 'success');
        }
        
        cancelarEdicao();
        carregarAlunos();
    } catch (error) {
        showAlert('❌ Erro ao salvar aluno: ' + error.message, 'error');
    }
}

function editarAluno(alunoId) {
    database.ref('alunos/' + alunoId).once('value').then(snapshot => {
        if (snapshot.exists()) {
            const aluno = snapshot.val();
            alunoEditando = alunoId;
            
            document.getElementById('alunoId').value = alunoId;
            document.getElementById('nome').value = aluno.nome;
            document.getElementById('idade').value = aluno.idade;
            document.getElementById('peso').value = aluno.peso;
            document.getElementById('altura').value = aluno.altura;
            document.getElementById('objetivo').value = aluno.objetivo;
            
            document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editar Aluno';
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Atualizar Aluno';
            document.getElementById('cancel-btn').style.display = 'block';
            
            document.getElementById('alunoForm').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function cancelarEdicao() {
    alunoEditando = null;
    document.getElementById('alunoForm').reset();
    document.getElementById('alunoId').value = '';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar Novo Aluno';
    document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Cadastrar Aluno';
    document.getElementById('cancel-btn').style.display = 'none';
}

function excluirAluno(alunoId, alunoNome) {
    showConfirmModal(
        `Tem certeza que deseja excluir o aluno "<strong>${alunoNome}</strong>"?`,
        async () => {
            try {
                // Excluir aluno e suas avaliações
                await database.ref('alunos/' + alunoId).remove();
                
                // Excluir avaliações do aluno
                const avaliacoesSnapshot = await database.ref('avaliacoes').orderByChild('alunoId').equalTo(alunoId).once('value');
                const updates = {};
                avaliacoesSnapshot.forEach(childSnapshot => {
                    updates['avaliacoes/' + childSnapshot.key] = null;
                });
                
                await database.ref().update(updates);
                
                showAlert('✅ Aluno excluído com sucesso!', 'success');
                carregarAlunos();
                carregarSelectAlunos();
            } catch (error) {
                showAlert('❌ Erro ao excluir aluno: ' + error.message, 'error');
            }
        }
    );
}

function carregarAlunos() {
    database.ref('alunos').on('value', (snapshot) => {
        const lista = document.getElementById('listaAlunos');
        const alunos = snapshot.val();
        
        if (!alunos) {
            lista.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Nenhum aluno cadastrado ainda.</p>
                </div>
            `;
            return;
        }
        
        lista.innerHTML = '';
        Object.keys(alunos).forEach(alunoId => {
            const aluno = alunos[alunoId];
            const objetivoClass = `objetivo-${aluno.objetivo}`;
            const objetivoIcon = {
                'emagrecimento': '🏃‍♂️',
                'musculacao': '💪', 
                'condicionamento': '⚡',
                'reabilitacao': '❤️'
            }[aluno.objetivo] || '🎯';
            
            lista.innerHTML += `
                <div class="aluno-card ${alunoEditando === alunoId ? 'editing' : ''}">
                    <h4>${aluno.nome}</h4>
                    <div class="aluno-info">
                        <div><strong>Idade:</strong> ${aluno.idade} anos</div>
                        <div><strong>Peso:</strong> ${aluno.peso} kg</div>
                        <div><strong>Altura:</strong> ${aluno.altura} m</div>
                        <div class="objetivo-badge ${objetivoClass}">
                            ${objetivoIcon} ${aluno.objetivo}
                        </div>
                    </div>
                    <div class="aluno-actions">
                        <button class="btn-warning" onclick="editarAluno('${alunoId}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-danger" onclick="excluirAluno('${alunoId}', '${aluno.nome}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        });
    });
}

// AVALIAÇÕES - REALTIME DATABASE
async function fazerAvaliacao(event) {
    event.preventDefault();
    
    const avaliacaoData = {
        alunoId: document.getElementById('alunoAvaliacao').value,
        pesoAtual: parseFloat(document.getElementById('pesoAtual').value),
        alturaAtual: parseFloat(document.getElementById('alturaAtual').value),
        gordura: document.getElementById('gordura').value || 0,
        musculo: document.getElementById('musculo').value || 0,
        data: new Date().toISOString(),
        imc: calcularIMCValor()
    };
    
    try {
        if (avaliacaoEditando) {
            await database.ref('avaliacoes/' + avaliacaoEditando).update(avaliacaoData);
            showAlert('✅ Avaliação atualizada com sucesso!', 'success');
        } else {
            const novaAvaliacaoRef = database.ref('avaliacoes').push();
            await novaAvaliacaoRef.set(avaliacaoData);
            showAlert('✅ Avaliação salva com sucesso!', 'success');
        }
        
        limparFormAvaliacao();
        carregarAvaliacoes();
    } catch (error) {
        showAlert('❌ Erro ao salvar avaliação: ' + error.message, 'error');
    }
}

function editarAvaliacao(avaliacaoId) {
    database.ref('avaliacoes/' + avaliacaoId).once('value').then(snapshot => {
        if (snapshot.exists()) {
            const av = snapshot.val();
            avaliacaoEditando = avaliacaoId;
            
            document.getElementById('alunoAvaliacao').value = av.alunoId;
            document.getElementById('pesoAtual').value = av.pesoAtual;
            document.getElementById('alturaAtual').value = av.alturaAtual;
            document.getElementById('gordura').value = av.gordura;
            document.getElementById('musculo').value = av.musculo;
            
            calcularIMC();
            showAlert('✏️ Modo edição ativado.', 'warning');
        }
    });
}

function excluirAvaliacao(avaliacaoId, alunoNome) {
    showConfirmModal(
        `Excluir avaliação de <strong>${alunoNome}</strong>?`,
        async () => {
            try {
                await database.ref('avaliacoes/' + avaliacaoId).remove();
                showAlert('✅ Avaliação excluída!', 'success');
                carregarAvaliacoes();
            } catch (error) {
                showAlert('❌ Erro ao excluir avaliação.', 'error');
            }
        }
    );
}

function limparFormAvaliacao() {
    avaliacaoEditando = null;
    document.getElementById('avaliacaoForm').reset();
    document.getElementById('resultadoIMC').style.display = 'none';
}

// FUNÇÕES AUXILIARES
function carregarSelectAlunos() {
    database.ref('alunos').on('value', (snapshot) => {
        const alunos = snapshot.val();
        const select = document.getElementById('alunoAvaliacao');
        const filtro = document.getElementById('filtroAluno');
        
        select.innerHTML = '<option value="">Selecione o aluno</option>';
        filtro.innerHTML = '<option value="">Todos os alunos</option>';
        
        if (alunos) {
            Object.keys(alunos).forEach(alunoId => {
                const aluno = alunos[alunoId];
                const option = `<option value="${alunoId}">${aluno.nome}</option>`;
                select.innerHTML += option;
                filtro.innerHTML += option;
            });
        }
    });
}

function carregarAvaliacoes() {
    const filtroAlunoId = document.getElementById('filtroAluno').value;
    let query = database.ref('avaliacoes').orderByChild('data');
    
    database.ref('alunos').once('value').then(alunosSnapshot => {
        const alunos = alunosSnapshot.val() || {};
        
        database.ref('avaliacoes').orderByChild('data').once('value').then(snapshot => {
            const historico = document.getElementById('historicoAvaliacoes');
            const avaliacoes = snapshot.val();
            
            if (!avaliacoes) {
                historico.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>Nenhuma avaliação encontrada.</p>
                    </div>
                `;
                return;
            }
            
            historico.innerHTML = '';
            Object.keys(avaliacoes)
                .sort((a, b) => new Date(avaliacoes[b].data) - new Date(avaliacoes[a].data))
                .slice(0, 20)
                .forEach(avaliacaoId => {
                    const av = avaliacoes[avaliacaoId];
                    
                    if (filtroAlunoId && av.alunoId !== filtroAlunoId) return;
                    
                    const aluno = alunos[av.alunoId];
                    const alunoNome = aluno ? aluno.nome : 'Aluno não encontrado';
                    
                    historico.innerHTML += `
                        <div class="avaliacao-card">
                            <div class="avaliacao-header">
                                <h4>${alunoNome}</h4>
                                <div class="avaliacao-data">
                                    ${new Date(av.data).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div class="avaliacao-dados">
                                <div class="dado-item">
                                    <strong>Peso</strong>
                                    <span>${av.pesoAtual} kg</span>
                                </div>
                                <div class="dado-item">
                                    <strong>Altura</strong>
                                    <span>${av.alturaAtual} m</span>
                                </div>
                                <div class="dado-item">
                                    <strong>IMC</strong>
                                    <span>${av.imc.toFixed(2)}</span>
                                </div>
                                <div class="dado-item">
                                    <strong>Gordura</strong>
                                    <span>${av.gordura}%</span>
                                </div>
                            </div>
                            <div class="avaliacao-actions">
                                <button class="btn-warning" onclick="editarAvaliacao('${avaliacaoId}')">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn-danger" onclick="excluirAvaliacao('${avaliacaoId}', '${alunoNome}')">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            </div>
                        </div>
                    `;
                });
        });
    });
}

// MODAL E ALERTAS (mantém igual)
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    
    messageElement.innerHTML = message;
    modal.classList.add('show');
    
    const cleanUp = () => {
        modal.classList.remove('show');
        confirmYes.onclick = null;
        confirmNo.onclick = null;
    };
    
    confirmYes.onclick = () => {
        onConfirm();
        cleanUp();
    };
    
    confirmNo.onclick = cleanUp;
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// CÁLCULO DE IMC (mantém igual)
function calcularIMC() {
    const peso = parseFloat(document.getElementById('pesoAtual').value) || 0;
    const altura = parseFloat(document.getElementById('alturaAtual').value) || 0;
    const resultado = document.getElementById('resultadoIMC');
    const imcValue = document.getElementById('imcValue');
    
    if (peso > 0 && altura > 0) {
        const imc = peso / (altura * altura);
        const classificacao = classificarIMC(imc);
        const imcColor = getIMCColor(imc);
        
        resultado.style.display = 'block';
        imcValue.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px; color: ${imcColor}">${imc.toFixed(2)}</div>
            <div style="color: ${imcColor}; font-weight: bold; font-size: 1.1rem;">${classificacao}</div>
        `;
    } else {
        resultado.style.display = 'none';
    }
}

function calcularIMCValor() {
    const peso = parseFloat(document.getElementById('pesoAtual').value) || 0;
    const altura = parseFloat(document.getElementById('alturaAtual').value) || 0;
    return peso > 0 && altura > 0 ? peso / (altura * altura) : 0;
}

function classificarIMC(imc) {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade Grau I';
    if (imc < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
}

function getIMCColor(imc) {
    if (imc < 18.5) return '#3498db';
    if (imc < 25) return '#27ae60';
    if (imc < 30) return '#f39c12';
    return '#e74c3c';
}

// INICIALIZAÇÃO
window.onload = function() {
    carregarAlunos();
    carregarSelectAlunos();
    carregarAvaliacoes();
    
    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
    
    const style = document.createElement('style');
    style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);
};
