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
import ListaCursos from './pages/cursos/Lista_Cursos';
import CriarCurso from './pages/cursos/Criar_Curso';
import CursoPagina from './pages/cursos/Pagina_Curso';
import EditarCurso from './pages/cursos/Editar_Curso';
import AvaliarTrabalhos from './components/cursos/Avaliar_Trabalhos';
import Certificado from './components/cursos/Certificado';

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
import ChatConversas from './pages/forum/Chat_Conversas';
import TopicosChatComponent from './components/forum/Topicos_Chat';

// Páginas de Gestão
import AdminDashboard from './pages/gestao/Admin_Dashboard';
import GerirUtilizadores from './pages/gestao/gerir_Utilizadores';
import GerirInscricoes from './pages/gestao/gerir_Inscricoes';
import GerirCategoria from './pages/gestao/gerir_Categoria';
import GerirArea from './pages/gestao/gerir_Area';
import GerirTopicos from './pages/gestao/gerir_Topicos';
import GerirCursos from './pages/gestao/gerir_Cursos';

// Páginas de Avaliações
import QuizPage from './pages/cursos/QuizPage';

// Páginas de Notificações
import Notificacoes from './pages/Notificacoes';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';

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
                      <ListaCursos />
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

              {/* Nova estrutura de 3 níveis para o fórum */}
              <Route
                path="/forum/topico/:topicoId"
                element={
                  <RouteWrapper path="/forum/topico/:topicoId">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <ChatConversas />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/forum/topico/:topicoId/tema/:temaId"
                element={
                  <RouteWrapper path="/forum/topico/:topicoId/tema/:temaId">
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

              {/* Demais rotas... */}
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
                path="/area-formador"
                element={
                  <RouteWrapper path="/area-formador">
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
                      <GerirUtilizadores />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/categorias"
                element={
                  <RouteWrapper path="/admin/categorias">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerirCategoria />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/areas"
                element={
                  <RouteWrapper path="/admin/areas">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerirArea />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/topicos"
                element={
                  <RouteWrapper path="/admin/topicos">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerirTopicos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/admin/cursos"
                element={
                  <RouteWrapper path="/admin/cursos">
                    <ProtectedRoute allowedRoles={[1]}>
                      <GerirCursos />
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
                path="/curso/:cursoId/avaliacao/:pastaId/submissoes"
                element={
                  <RouteWrapper path="/curso/:cursoId/avaliacao/:pastaId/submissoes">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <AvaliarTrabalhos />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/certificado"
                element={
                  <RouteWrapper path="/certificado">
                    <ProtectedRoute allowedRoles={[1, 2, 3]}>
                      <Certificado />
                    </ProtectedRoute>
                  </RouteWrapper>
                }
              />

              <Route
                path="/cursos/:id/inscricoes"
                element={
                  <RouteWrapper path="/cursos/:id/inscricoes">
                    <ProtectedRoute allowedRoles={[1, 2]}>
                      <GerirInscricoes />
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