import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';

// Páginas de Autenticação
import Login from './pages/auth/login';
import ConfirmAccount from './pages/auth/confirmAccount';

// Páginas Principais
import Home from './pages/home';

// Páginas de Cursos
import Lista_Cursos from './pages/cursos/Lista_Cursos';
import Criar_Curso from './pages/cursos/Criar_Curso';
import CursoPagina from './pages/cursos/Pagina_Curso';
import Editar_Curso from './pages/cursos/Editar_Curso';
import Detalhes_Curso from './components/cursos/Detalhes_Curso';

// Páginas de Utilizadores
import PerfilUser from './pages/users/Perfil_Utilizador';
import PercursoFormativo from './pages/users/Percurso_Formativo';
import AreaProfessor from './pages/users/Area_Formador';
import CriarUtilizador from './pages/users/Criar_Utilizador';
import DetalhesUtilizador from './pages/users/Detalhes_Utilizador';
import EditarUtilizador from './pages/users/Editar_Utilizador';
import Formadores from './pages/users/Lista_Formadores';
import DetalhesFormadores from './pages/users/Detalhes_Formadores';

// Páginas do Fórum
import ForumPartilha from './pages/forum/Forum';

// Páginas de Gestão
import AdminDashboard from './pages/gestao/Admin_Dashboard';
import Gerir_Inscricoes from './pages/gestao/gerir_Inscricoes';
import Gerir_Utilizadores from './pages/gestao/gerir_Utilizadores';
import Gerir_Topicos from './pages/gestao/gerir_Topicos';
import Gerir_Cursos from './pages/gestao/gerir_Cursos';

// Páginas de Avaliações
import QuizPage from './pages/cursos/QuizPage';

// Páginas de Notificações
import Notificacoes from './pages/Notificacoes';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';
import TopicosChatComponent from './components/forum/Topicos_Chat';

// Wrapper para adicionar logs em rotas
const RouteWrapper = ({ path, children }) => {
  React.useEffect(() => {
    console.log(`[DEBUG] A navegar para a rota: ${path}`);
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
                      <Lista_Cursos />
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
                path="/Criar_Curso"
                element={
                  <RouteWrapper path="/Criar_Curso">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <Criar_Curso />
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
                      <CursoPagina />
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
                      <Gerir_Utilizadores />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />


              <Route
                path="/admin/topicos"
                element={
                  <RouteWrapper path="/admin/topicos">
                    <ProtectedRoute allowedRoles={[1]}>
                      <Gerir_Topicos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />



              

              <Route
                path="/admin/cursos"
                element={
                  <RouteWrapper path="/admin/cursos">
                    <ProtectedRoute allowedRoles={[1]}>
                      <Gerir_Cursos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/criar-curso"
                element={
                  <RouteWrapper path="/admin/criar-curso">
                    <ProtectedRoute allowedRoles={[1]}>
                      <Criar_Curso />
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
                      <Editar_Curso />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/cursos/:id/inscricoes"
                element={
                  <RouteWrapper path="/cursos/:id/inscricoes">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <Gerir_Inscricoes />
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

              {/* Direcionar para a página inicial por predefinição */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificacoesProvider>
      </AuthProvider>
    </div>
  );
};

export default App;