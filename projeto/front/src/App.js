import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Páginas
import Login from './pages/login';
import ConfirmAccount from './pages/confirmAccount'; // Nova página
import Home from './pages/home';
import Cursos from './pages/cursos';
import CriarCurso from './pages/criarCurso';
import DetalhesCurso from './pages/detalhesCurso';
import PerfilUser from './pages/perfilUser';
import PercursoFormativo from './pages/percursoFormativo';
import AreaProfessor from './pages/areaProfessor';
import ForumPartilha from './pages/forumPartilha';
import CriarUtilizador from './pages/criarUtilizador';
import AdminDashboard from './pages/adminDashboard';
import GerenciarUtilizadores from './pages/gerenciarUtilizadores';
import GerenciarCursos from './pages/gerenciarCursos';
import QuizPage from './pages/quizPage';
import Formadores from './pages/formadores';
import EditarCurso from './pages/editarCurso';
import GerenciarInscricoes from './pages/gerenciarInscricoes';
import DetalhesFormadores from './pages/detalhesFormadores';
import Topicos_Chat from './components/Topicos_Chat'; 

// Componentes
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {

  useEffect(() => {
  }, []);

  return (
    <div id="appRoot">

      <AuthProvider>

        <Router>

          <Routes>

            {/* Rotas públicas */}
            <Route path="/login" element={
              <React.Fragment>
                <Login />
              </React.Fragment>
            } />
            
            {/* Rota de confirmação de conta */}
            <Route path="/confirm-account" element={
              <React.Fragment>
                <ConfirmAccount />
              </React.Fragment>
            } />

            {/* Rotas protegidas - disponíveis para todos os perfis */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cursos"
              element={
                <ProtectedRoute>
                  <Cursos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/formadores"
              element={
                <ProtectedRoute>
                  <Formadores />
                </ProtectedRoute>
              }
              />

            <Route
              path="/CriarCurso"
              element={
                <ProtectedRoute roles={[1,2]}>
                  <CriarCurso />
                </ProtectedRoute>
              }
            />

            <Route
              path="/formadores/:id"
              element={
                <ProtectedRoute>
                  <DetalhesFormadores />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cursos/:id"
              element={
                <ProtectedRoute>
                  <DetalhesCurso />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <ForumPartilha />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forum/topico/:topicoId"
              element={
                <ProtectedRoute>
                  <Topicos_Chat />
                </ProtectedRoute>
              }
            />

            {/* Rotas para formandos */}
            <Route
              path="/percurso-formativo"
              element={
                <ProtectedRoute roles={[3]}>
                  <PercursoFormativo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />

            {/* Rotas para formadores */}
            <Route
              path="/area-professor"
              element={
                <ProtectedRoute roles={[1,2]}>
                  <AreaProfessor />
                </ProtectedRoute>
              }
            />

            {/* Rotas para administradores/gestores */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={[1]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute roles={[1]}>
                  <GerenciarUtilizadores />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/cursos"
              element={
                <ProtectedRoute roles={[1]}>
                  <GerenciarCursos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/criar-curso"
              element={
                <ProtectedRoute roles={[1]}>
                  <CriarCurso />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/criar-usuario"
              element={
                <ProtectedRoute roles={[1]}>
                  <CriarUtilizador />
                </ProtectedRoute>
              }
            />
            
            <Route path="/admin/cursos/:id/editar" element={<ProtectedRoute adminOnly><EditarCurso /></ProtectedRoute>} />
            <Route path="/admin/cursos/:id/inscricoes" element={<ProtectedRoute adminOnly><GerenciarInscricoes /></ProtectedRoute>} />

            {/* Redirecionar para a página inicial por padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
};

export default App;