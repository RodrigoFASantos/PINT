/**
 * Componente principal da aplicação
 * 
 * Define todas as rotas da aplicação e integra os providers de contexto
 * necessários para autenticação e notificações.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';

// Importações das páginas de autenticação
import Login from './pages/auth/login';
import ConfirmAccount from './pages/auth/confirmAccount';
import RedefinirSenha from './pages/auth/Redefinir_Senha';

// Importações das páginas principais
import Home from './pages/home';

// Importações das páginas de cursos
import ListaCursos from './pages/cursos/Lista_Cursos';
import CriarCurso from './pages/cursos/Criar_Curso';
import CursoPagina from './pages/cursos/Pagina_Curso';
import EditarCurso from './pages/cursos/Editar_Curso';
import Certificado from './components/cursos/Certificado';
import AvaliarTrabalhos from './pages/cursos/Avaliar_Trabalhos';

// Importações das páginas de utilizadores
import PerfilUser from './pages/users/Perfil_Utilizador';
import PercursoFormativo from './pages/users/Percurso_Formativo';
import AreaProfessor from './pages/users/Area_Formador';
import CriarUtilizador from './pages/users/Criar_Utilizador';
import DetalhesUtilizador from './pages/users/Detalhes_Utilizador';
import EditarUtilizador from './pages/users/Editar_Utilizador';
import Formadores from './pages/users/Lista_Formadores';
import DetalhesFormadores from './pages/users/Detalhes_Formadores';

// Importações das páginas do fórum
import ForumPartilha from './pages/forum/Forum';
import ChatConversas from './pages/forum/Chat_Conversas';
import TopicosChatComponent from './components/forum/Topicos_Chat';

// Importações das páginas de gestão (admin)
import AdminDashboard from './pages/gestao/Admin_Dashboard';
import GerirUtilizadores from './pages/gestao/gerir_Utilizadores';
import GerirInscricoes from './pages/gestao/gerir_Inscricoes';
import GerirCategoria from './pages/gestao/gerir_Categoria';
import GerirArea from './pages/gestao/gerir_Area';
import GerirTopicos from './pages/gestao/gerir_Topicos';
import GerirCursos from './pages/gestao/gerir_Cursos';
import GerirDenuncias from './pages/gestao/gerir_Denuncias.jsx';
import PercursoFormandos from './pages/gestao/Percurso_Formandos';

// Importações das páginas de avaliações
import QuizPage from './pages/cursos/QuizPage';

// Importações das páginas de notificações
import Notificacoes from './pages/Notificacoes';

// Importações de componentes
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Componente principal da aplicação
 * 
 * Configura:
 * - Providers de contexto (Autenticação e Notificações)
 * - Roteamento da aplicação
 * - Configurações de toast notifications
 * - Proteção de rotas baseada em perfis de utilizador
 * 
 * Perfis de utilizador:
 * - 1: Administrador (acesso total)
 * - 2: Formador (acesso a funcionalidades de ensino)
 * - 3: Formando (acesso básico)
 */
const App = () => {
  return (
    <div id="appRoot">
      {/* Provider de autenticação - gere estado de login/logout */}
      <AuthProvider>
        {/* Provider de notificações - gere sistema de notificações */}
        <NotificacoesProvider>
          <Router>
            {/* Configuração das notificações toast */}
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
              {/* === ROTAS PÚBLICAS === */}
              {/* Página de login */}
              <Route path="/login" element={<Login />} />
              
              {/* Confirmação de conta após registo */}
              <Route path="/confirm-account" element={<ConfirmAccount />} />
              
              {/* Redefinição de palavra-passe */}
              <Route path="/reset-password" element={<RedefinirSenha />} />

              {/* === ROTAS PROTEGIDAS - ACESSO GERAL === */}
              {/* Página inicial - acessível a todos os perfis */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* Perfil do utilizador */}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <PerfilUser />
                  </ProtectedRoute>
                }
              />

              {/* Lista de cursos disponíveis */}
              <Route
                path="/cursos"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <ListaCursos />
                  </ProtectedRoute>
                }
              />

              {/* Lista de formadores */}
              <Route
                path="/formadores"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <Formadores />
                  </ProtectedRoute>
                }
              />

              {/* Detalhes de um formador específico */}
              <Route
                path="/formadores/:id"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <DetalhesFormadores />
                  </ProtectedRoute>
                }
              />

              {/* Página de um curso específico */}
              <Route
                path="/cursos/:id"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <CursoPagina />
                  </ProtectedRoute>
                }
              />

              {/* === FÓRUM === */}
              {/* Página principal do fórum */}
              <Route
                path="/forum"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <ForumPartilha />
                  </ProtectedRoute>
                }
              />

              {/* Chat de um tópico específico */}
              <Route
                path="/forum/topico/:topicoId"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <ChatConversas />
                  </ProtectedRoute>
                }
              />

              {/* Conversação de um tema específico dentro de um tópico */}
              <Route
                path="/forum/topico/:topicoId/tema/:temaId"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <TopicosChatComponent />
                  </ProtectedRoute>
                }
              />

              {/* Página de notificações */}
              <Route
                path="/notificacoes"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <Notificacoes />
                  </ProtectedRoute>
                }
              />

              {/* Página de quiz/avaliação */}
              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <QuizPage />
                  </ProtectedRoute>
                }
              />

              {/* === ROTAS ESPECÍFICAS PARA FORMANDOS === */}
              {/* Percurso formativo do formando */}
              <Route
                path="/percurso-formativo"
                element={
                  <ProtectedRoute allowedRoles={[3]}>
                    <PercursoFormativo />
                  </ProtectedRoute>
                }
              />

              {/* === ROTAS PARA FORMADORES E ADMINS === */}
              {/* Criação de novos cursos */}
              <Route
                path="/Criar_Curso"
                element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <CriarCurso />
                  </ProtectedRoute>
                }
              />

              {/* Área do formador */}
              <Route
                path="/area-formador"
                element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <AreaProfessor />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de inscrições de um curso */}
              <Route
                path="/cursos/:id/inscricoes"
                element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <GerirInscricoes />
                  </ProtectedRoute>
                }
              />

              {/* Avaliação de trabalhos de um curso */}
              <Route
                path="/curso/:cursoId/avaliar-trabalhos" 
                element={
                  <ProtectedRoute allowedRoles={[1, 2]}>
                    <AvaliarTrabalhos />
                  </ProtectedRoute>
                }
              />

              {/* Página de certificado */}
              <Route
                path="/certificado"
                element={
                  <ProtectedRoute allowedRoles={[1, 2, 3]}>
                    <Certificado />
                  </ProtectedRoute>
                }
              />

              {/* === ROTAS ADMINISTRATIVAS === */}
              {/* Dashboard do administrador */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de utilizadores */}
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirUtilizadores />
                  </ProtectedRoute>
                }
              />

              {/* Percurso de formandos (visão administrativa) */}
              <Route
                path="/admin/percurso-formandos"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <PercursoFormandos />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de categorias */}
              <Route
                path="/admin/categorias"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirCategoria />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de áreas */}
              <Route
                path="/admin/areas"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirArea />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de tópicos do fórum */}
              <Route
                path="/admin/topicos"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirTopicos />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de cursos */}
              <Route
                path="/admin/cursos"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirCursos />
                  </ProtectedRoute>
                }
              />

              {/* Gestão de denúncias */}
              <Route
                path="/admin/denuncias"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <GerirDenuncias />
                  </ProtectedRoute>
                }
              />

              {/* Criação de curso (área admin) */}
              <Route
                path="/admin/criar-curso"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <CriarCurso />
                  </ProtectedRoute>
                }
              />

              {/* Criação de utilizador */}
              <Route
                path="/admin/criar-usuario"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <CriarUtilizador />
                  </ProtectedRoute>
                }
              />

              {/* Edição de curso */}
              <Route
                path="/admin/cursos/:id/editar"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <EditarCurso />
                  </ProtectedRoute>
                }
              />

              {/* Detalhes de utilizador */}
              <Route
                path="/admin/users/:id"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <DetalhesUtilizador />
                  </ProtectedRoute>
                }
              />

              {/* Edição de utilizador */}
              <Route
                path="/admin/users/:id/editar"
                element={
                  <ProtectedRoute allowedRoles={[1]}>
                    <EditarUtilizador />
                  </ProtectedRoute>
                }
              />

              {/* Rota padrão - redireciona para a página inicial */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificacoesProvider>
      </AuthProvider>
    </div>
  );
};

export default App;