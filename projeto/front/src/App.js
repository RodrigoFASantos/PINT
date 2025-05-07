import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';

// Páginas
import Login from './pages/login';
import ConfirmAccount from './pages/confirmAccount';
import Home from './pages/home';
import Cursos from './pages/cursos';
import CriarCurso from './pages/criarCurso';
import DetalhesCurso from './pages/detalhesCurso';
import PerfilUser from './pages/perfilUser';
import PercursoFormativo from './pages/percursoFormativo';
import AreaProfessor from './pages/areaProfessor';
import ForumPartilha from './pages/forumPartilha';
import CriarUtilizador from './pages/criarUtilizador';
import DetalhesUtilizador from './pages/detalhesUtilizador';
import EditarUtilizador from './pages/editarUtilizador';
import AdminDashboard from './pages/adminDashboard';
import GerenciarUtilizadores from './pages/gerenciarUtilizadores';
import GerenciarCursos from './pages/gerenciarCursos';
import QuizPage from './pages/quizPage';
import Formadores from './pages/formadores';
import EditarCurso from './pages/editarCurso';
import GerenciarInscricoes from './pages/gerenciarInscricoes';
import DetalhesFormadores from './pages/detalhesFormadores';
import TopicosChatComponent from './components/Topicos_Chat';
import Notificacoes from './pages/Notificacoes';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';

// Wrapper para adicionar logs em rotas
const RouteWrapper = ({ path, children }) => {
  React.useEffect(() => {
    console.log(`[DEBUG] Navegando para rota: ${path}`);
  }, [path]);

  return children;
};

const App = () => {
  return (
    <div id="appRoot">
      <AuthProvider>
        <NotificacoesProvider>
          <Router>
            <ToastContainer 
              position="top-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={
                <RouteWrapper path="/login">
                  <Login />
                </RouteWrapper>
              } />
              <Route path="/confirm-account" element={
                <RouteWrapper path="/confirm-account">
                  <ConfirmAccount />
                </RouteWrapper>
              } />

              {/* Rotas protegidas - disponíveis para todos os perfis */}
              <Route
                path="/"
                element={
                  <RouteWrapper path="/">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <Home />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/perfil"
                element={
                  <RouteWrapper path="/perfil">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <PerfilUser />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/cursos"
                element={
                  <RouteWrapper path="/cursos">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <Cursos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/formadores"
                element={
                  <RouteWrapper path="/formadores">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <Formadores />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/CriarCurso"
                element={
                  <RouteWrapper path="/CriarCurso">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <CriarCurso />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/formadores/:id"
                element={
                  <RouteWrapper path="/formadores/:id">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <DetalhesFormadores />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/cursos/:id"
                element={
                  <RouteWrapper path="/cursos/:id">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <DetalhesCurso />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/forum"
                element={
                  <RouteWrapper path="/forum">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <ForumPartilha />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/forum/topico/:topicoId"
                element={
                  <RouteWrapper path="/forum/topico/:topicoId">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <TopicosChatComponent />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              {/* Rota para a página de notificações */}
              <Route
                path="/notificacoes"
                element={
                  <RouteWrapper path="/notificacoes">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <Notificacoes />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              {/* Rotas para formandos */}
              <Route
                path="/percurso-formativo"
                element={
                  <RouteWrapper path="/percurso-formativo">
                    <ProtectedRoute allowedRoles={[3]}>
                      <PercursoFormativo />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/quiz/:id"
                element={
                  <RouteWrapper path="/quiz/:id">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <QuizPage />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              {/* Rotas para formadores */}
              <Route
                path="/area-professor"
                element={
                  <RouteWrapper path="/area-professor">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <AreaProfessor />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              {/* Rotas para administradores/gestores */}
              <Route
                path="/admin/dashboard"
                element={
                  <RouteWrapper path="/admin/dashboard">
                    <ProtectedRoute allowedRoles={[1]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/usuarios"
                element={
                  <RouteWrapper path="/admin/usuarios">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerenciarUtilizadores />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/cursos"
                element={
                  <RouteWrapper path="/admin/cursos">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerenciarCursos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/criar-curso"
                element={
                  <RouteWrapper path="/admin/criar-curso">
                    <ProtectedRoute allowedRoles={[1]}>
                      <CriarCurso />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/criar-usuario"
                element={
                  <RouteWrapper path="/admin/criar-usuario">
                    <ProtectedRoute allowedRoles={[1]}>
                      <CriarUtilizador />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/cursos/:id/editar"
                element={
                  <RouteWrapper path="/admin/cursos/:id/editar">
                    <ProtectedRoute allowedRoles={[1]}>
                      <EditarCurso />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/cursos/:id/inscricoes"
                element={
                  <RouteWrapper path="/cursos/:id/inscricoes">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <GerenciarInscricoes />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/users/:id"
                element={
                  <RouteWrapper path="/admin/users/:id">
                    <ProtectedRoute allowedRoles={[1]}>
                      <DetalhesUtilizador />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/users/:id/editar"
                element={
                  <RouteWrapper path="/admin/users/:id/editar">
                    <ProtectedRoute allowedRoles={[1]}>
                      <EditarUtilizador />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              {/* Redirecionar para a página inicial por padrão */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificacoesProvider>
      </AuthProvider>
    </div>
  );
};

export default App;