import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { IMAGES } from "../api";
import "./css/cursos.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function FormadoresPage() {
  const [formadores, setFormadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiTested, setApiTested] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Dados de demonstração apenas para teste de renderização
  const dadosExemplo = [
    { id_utilizador: 1, nome: "João Silva", email: "joao.silva@exemplo.com" },
    { id_utilizador: 2, nome: "Maria Santos", email: "maria.santos@exemplo.com" },
    { id_utilizador: 3, nome: "Carlos Oliveira", email: "carlos.oliveira@exemplo.com" }
  ];

  useEffect(() => {
    const testarEndpoints = async () => {
      setLoading(true);
      setError(null);
      
      // Lista de endpoints possíveis para tentar
      const endpointsPossiveis = [
        "/formadores",
        "/utilizadores/formadores", 
        "/users/formadores",
        "/users?id_cargo=2",
        "/utilizadores?id_cargo=2"
      ];
      
      let formadoresEncontrados = false;
      
      for (const endpoint of endpointsPossiveis) {
        try {
          const url = `${API_BASE}${endpoint}`;
          console.log(`Tentando endpoint: ${url}`);
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Resposta de ${endpoint}:`, data);
            
            // Verificar se a resposta contém dados úteis
            const temDados = Array.isArray(data) ? data.length > 0 : 
                            Array.isArray(data.data) ? data.data.length > 0 :
                            Array.isArray(data.formadores) ? data.formadores.length > 0 :
                            Array.isArray(data.users) ? data.users.length > 0 : false;
            
            if (temDados) {
              console.log(`✅ Endpoint válido encontrado: ${endpoint}`);
              
              // Extrair os dados da resposta
              const formadoresData = Array.isArray(data) ? data : 
                                     Array.isArray(data.data) ? data.data :
                                     Array.isArray(data.formadores) ? data.formadores :
                                     data.users;
              
              setFormadores(formadoresData);
              formadoresEncontrados = true;
              break;
            } else {
              console.log(`⚠️ Endpoint respondeu, mas sem dados: ${endpoint}`);
            }
          } else {
            console.log(`❌ Endpoint não disponível (${response.status}): ${endpoint}`);
          }
        } catch (error) {
          console.error(`Erro ao acessar ${endpoint}:`, error);
        }
      }
      
      if (!formadoresEncontrados) {
        console.log("Nenhum endpoint válido encontrado. Usando dados de exemplo.");
        setFormadores(dadosExemplo);
        setError("Não foi possível conectar a nenhum endpoint válido para formadores.");
      }
      
      setLoading(false);
      setApiTested(true);
    };

    testarEndpoints();
  }, []);

  const handleFormadorClick = (formadorId) => {
    navigate(`/formadores/${formadorId}`);
  };

  // Função para obter o URL da imagem
  const getImageUrl = (formador) => {
    if (!formador || !formador.nome) return '/placeholder-formador.jpg';
    
    if (formador.foto_perfil) {
      return formador.foto_perfil;
    }
    
    const nomeFormadorSlug = formador.nome
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    
    // Usar a função de URLs de imagens, se disponível
    if (IMAGES && typeof IMAGES.FORMADOR === 'function') {
      return IMAGES.FORMADOR(nomeFormadorSlug);
    }
    
    return '/placeholder-formador.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white p-6">
        <Navbar toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600">Testando conexão com a API...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6 mt-20 text-center">Formadores</h1>
      
      {error && (
        <div className="bg-yellow-100 p-4 mb-6 rounded-md">
          <p className="text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-700 mt-1">Mostrando dados de exemplo para fins de demonstração.</p>
          <p className="text-sm text-yellow-700 mt-1">Verifique o console para detalhes sobre os endpoints testados.</p>
        </div>
      )}
      
      {apiTested && !error && (
        <div className="bg-green-100 p-4 mb-6 rounded-md">
          <p className="text-green-800">✅ Conexão com API estabelecida com sucesso!</p>
          <p className="text-sm text-green-700 mt-1">Mostrando dados reais dos formadores.</p>
        </div>
      )}

      {/* Lista de formadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {formadores.length > 0 ? (
          formadores.map((formador, index) => (
            <div
              key={formador.id_utilizador || formador.id || index}
              onClick={() => handleFormadorClick(formador.id_utilizador || formador.id)}
              className="cursor-pointer relative overflow-hidden rounded-lg shadow-md h-48 transition-transform transform hover:scale-105"
              style={{
                backgroundImage: `url(${getImageUrl(formador)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                <h3 className="text-white text-xl font-semibold text-center px-4">
                  {formador.nome || formador.name}
                </h3>
                <p className="text-white text-sm mt-2">
                  {formador.email}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-600 text-lg">Nenhum formador disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}