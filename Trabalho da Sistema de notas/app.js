// Sistema de cadastro de notas em front-end puro.
// Dados são salvos em localStorage e a sessão atual em sessionStorage.
const STORAGE_KEY = 'sistema_notas_local';

const defaultData = {
  users: [
    { name: 'Professor Exemplo', email: 'prof@teste.com', password: '123', role: 'professor' },
    { name: 'Aluno Exemplo', email: 'aluno@teste.com', password: '123', role: 'aluno' }
  ],
  students: [
    { name: 'Aluno Exemplo', email: 'aluno@teste.com', final_grade: '8.5' }
  ]
};

function readStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return JSON.parse(JSON.stringify(defaultData));
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.warn('Erro ao ler o armazenamento local. Reiniciando.');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentUser() {
  const keys = ['usuario_atual', 'usuarioLogado'];

  for (const key of keys) {
    const item = sessionStorage.getItem(key);
    if (!item) continue;

    try {
      const user = JSON.parse(item);
      if (!user || typeof user !== 'object') continue;

      return {
        ...user,
        name: user.name || user.nome || 'Aluno',
        nome: user.nome || user.name || 'Aluno'
      };
    } catch (error) {
      sessionStorage.removeItem(key);
    }
  }

  return null;
}

function setCurrentUser(user) {
  const normalizedUser = {
    ...user,
    name: user.name || user.nome || 'Aluno',
    nome: user.nome || user.name || 'Aluno'
  };

  sessionStorage.setItem('usuario_atual', JSON.stringify(normalizedUser));
  sessionStorage.setItem('usuarioLogado', JSON.stringify(normalizedUser));
}

function logoutUser() {
  sessionStorage.removeItem('usuario_atual');
  sessionStorage.removeItem('usuarioLogado');
  window.location.href = 'telaInicial.html';
}

function loginUser(role) {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  const data = readStorage();
  const user = data.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.role === role && item.password === senha);

  if (!user) {
    alert('Usuário ou senha incorretos.');
    return false;
  }

  setCurrentUser({ name: user.name, email: user.email, role: user.role });

  if (role === 'aluno') {
    window.location.href = 'aluno_dashboard.html';
  } else {
    window.location.href = 'professor_dashboard.html';
  }

  return true;
}

function registerUser(role) {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!name || !email || !password) {
    alert('Preencha todos os campos.');
    return false;
  }

  const data = readStorage();
  const exists = data.users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    alert('Este e-mail já está cadastrado.');
    return false;
  }

  data.users.push({ name, email, password, role });

  if (role === 'aluno') {
    data.students.push({ name, email, final_grade: 'Ainda não lançada' });
  }

  saveStorage(data);
  alert('Cadastro realizado com sucesso!');

  if (role === 'aluno') {
    window.location.href = 'Login_Aluno.html';
  } else {
    window.location.href = 'Login_Professor.html';
  }

  return true;
}

function renderProfessorDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'professor') {
    window.location.href = 'Login_Professor.html';
    return;
  }

  const data = readStorage();
  const list = document.getElementById('alunosLista');
  const total = document.getElementById('totalAlunos');

  if (total) {
    total.textContent = String(data.students.length);
  }

  if (!list) return;

  if (!data.students.length) {
    list.innerHTML = '<p class="empty">Nenhum aluno cadastrado.</p>';
    return;
  }

  list.innerHTML = data.students.map((student) => `
    <div class="student-item">
      <div class="student-info">
        <div class="student-name">${student.name}</div>
        <div class="student-email">${student.email}</div>
      </div>
      <div class="student-actions">
        <input type="text" id="grade-${student.email}" value="${student.final_grade}" placeholder="Nota final">
        <button class="btn btn-primary" data-email="${student.email}">Salvar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('button[data-email]').forEach((button) => {
    button.addEventListener('click', () => {
      const email = button.dataset.email;
      const input = document.getElementById(`grade-${email}`);
      const value = (input && input.value.trim()) || 'Ainda não lançada';
      const dataNow = readStorage();

      dataNow.students = dataNow.students.map((student) => {
        if (student.email === email) {
          student.final_grade = value;
        }
        return student;
      });

      saveStorage(dataNow);
      renderProfessorDashboard();
    });
  });
}

function renderAlunoDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'aluno') {
    window.location.href = 'Login_Aluno.html';
    return;
  }

  const data = readStorage();
  const student = data.students.find((item) => item.email.toLowerCase() === user.email.toLowerCase());

  const nome = document.getElementById('alunoNome');
  const nota = document.getElementById('alunoNota');

  if (nome) nome.textContent = user.name;
  if (nota) nota.textContent = student ? student.final_grade : 'Ainda não lançada';
}

function renderProfessorNotesPage() {
  const user = getCurrentUser();
  if (!user || user.role !== 'professor') {
    window.location.href = 'Login_Professor.html';
    return;
  }

  const data = readStorage();
  const form = document.getElementById('notesForm');
  const studentList = document.getElementById('studentsList');
  const summary = document.getElementById('notesSummary');

  if (summary) {
    summary.textContent = `Alunos cadastrados: ${data.students.length}`;
  }

  if (!form || !studentList) return;

  if (form.dataset.bound !== 'true') {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = document.getElementById('studentName').value.trim();
      const email = document.getElementById('studentEmail').value.trim();
      const grade = document.getElementById('studentGrade').value.trim();

      if (!name || !email || !grade) {
        alert('Preencha nome, e-mail e nota final.');
        return;
      }

      const current = readStorage();
      const userIndex = current.users.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        current.users.push({ name, email, password: 'aluno123', role: 'aluno' });
      } else {
        current.users[userIndex].name = name;
      }

      const studentIndex = current.students.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());

      if (studentIndex === -1) {
        current.students.push({ name, email, final_grade: grade });
      } else {
        current.students[studentIndex].name = name;
        current.students[studentIndex].final_grade = grade;
      }

      saveStorage(current);
      form.reset();
      renderProfessorNotesPage();
      alert('Nota salva com sucesso!');
    });

    form.dataset.bound = 'true';
  }

  if (!data.students.length) {
    studentList.innerHTML = '<p class="empty">Nenhum aluno cadastrado ainda.</p>';
    return;
  }

  studentList.innerHTML = data.students.map((student) => `
    <div class="student-item">
      <div class="student-info">
        <div class="student-name">${student.name}</div>
        <div class="student-email">${student.email}</div>
      </div>
      <div class="grade-badge">${student.final_grade || 'Sem nota'}</div>
    </div>
  `).join('');
}

function bindLoginForms() {
  const loginAlunoForm = document.getElementById('loginAlunoForm');
  if (loginAlunoForm) {
    loginAlunoForm.addEventListener('submit', (event) => {
      event.preventDefault();
      loginUser('aluno');
    });
  }

  const loginProfessorForm = document.getElementById('loginProfessorForm');
  if (loginProfessorForm) {
    loginProfessorForm.addEventListener('submit', (event) => {
      event.preventDefault();
      loginUser('professor');
    });
  }
}

function bindRegisterForms() {
  const formAluno = document.getElementById('formAluno');
  if (formAluno) {
    formAluno.addEventListener('submit', (event) => {
      event.preventDefault();
      registerUser('aluno');
    });
  }

  const formProfessor = document.getElementById('formProfessor');
  if (formProfessor) {
    formProfessor.addEventListener('submit', (event) => {
      event.preventDefault();
      registerUser('professor');
    });
  }
}

function bindLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', logoutUser);
  });
}

function bindProfessorNotesPage() {
  const page = document.body.dataset.page;
  if (page === 'professor-notes') {
    renderProfessorNotesPage();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindLoginForms();
  bindRegisterForms();
  bindLogoutButtons();
  bindProfessorNotesPage();

  if (document.body.dataset.page === 'professor-dashboard') {
    renderProfessorDashboard();
  }

  if (document.body.dataset.page === 'aluno-dashboard') {
    renderAlunoDashboard();
  }

  if (document.body.dataset.page === 'professor-notes') {
    renderProfessorNotesPage();
  }
});
