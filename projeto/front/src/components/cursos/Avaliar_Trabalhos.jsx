import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE from '../../api';
import Sidebar from "../Sidebar";
import ApagarCertificadoModal from './Apagar_Certificado_Modal';
import './css/Avaliar_Trabalhos.css';

const Avaliar_Trabalhos = () => {
  const { cursoId, pastaId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [submissoes, setSubmissoes] = useState([]);
  const [notas, setNotas] = useState({});
  const [saving, setSaving] = useState({});

  const [formandos, setFormandos] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedFormando, setSelectedFormando] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificadoExiste, setCertificadoExiste] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [certificadoUrl, setCertificadoUrl] = useState('');
  // Novo estado para armazenar a média das notas e detalhes do curso
  const [notaMedia, setNotaMedia] = useState(null);
  const [cursoDuracao, setCursoDuracao] = useState(null);
  const [cursoInfo, setCursoInfo] = useState(null);

  // Carregar formandos ao iniciar
  useEffect(() => {
    carregarFormandos();
    carregarInfoCurso();
  }, [cursoId]);

  // Nova função para carregar informações do curso
  const carregarInfoCurso = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setCursoInfo(response.data);
        setCursoDuracao(response.data.duracao);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do curso:', error);
    }
  };

  // Nova função para calcular a média das notas
  const calcularNotaMedia = () => {
    const notasArray = Object.values(notas).filter(nota => nota !== '').map(Number);
    if (notasArray.length > 0) {
      const media = notasArray.reduce((sum, nota) => sum + nota, 0) / notasArray.length;
      setNotaMedia(media.toFixed(2));
      return media.toFixed(2);
    } else {
      setNotaMedia(null);
      return null;
    }
  };

  // Atualizar a média sempre que as notas mudarem
  useEffect(() => {
    calcularNotaMedia();
  }, [notas]);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFormando) return;
    try {
      const token = localStorage.getItem('token');

      // Get the course information to find its name
      // Assuming you have the cursoId available in your component
      const courseResponse = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!courseResponse.data || !courseResponse.data.nome) {
        throw new Error('Não foi possível obter as informações do curso');
      }

      // Format the course name the same way it's done in the backend
      const cursoNomeFormatado = courseResponse.data.nome.replace(/\s+/g, '_');
      const fileName = `certificado_${cursoNomeFormatado}.pdf`;

      const response = await axios.delete(
        `${API_BASE}/certificados/eliminar-ficheiro`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { id_utilizador: selectedFormando, nome_ficheiro: fileName }
        }
      );

      if (response.data.success) {
        setCertificadoExiste(false);
      } else {
        throw new Error(response.data.message || 'Erro ao apagar certificado');
      }
    } catch (error) {
      console.error(error);
      alert('Não foi possível apagar o certificado.');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  // Função simplificada e otimizada para carregar formandos
  const carregarFormandos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Rota principal para inscrições do curso
      const response = await axios.get(
        `${API_BASE}/inscricoes/curso/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && Array.isArray(response.data)) {
        console.log('Inscrições encontradas:', response.data.length);

        // Extrair formandos únicos das inscrições
        const formandosMap = new Map();

        response.data.forEach(inscricao => {
          if (inscricao.utilizador && !formandosMap.has(inscricao.utilizador.id_utilizador)) {
            formandosMap.set(inscricao.utilizador.id_utilizador, {
              id_utilizador: inscricao.utilizador.id_utilizador,
              nome: inscricao.utilizador.nome,
              email: inscricao.utilizador.email
            });
          }
        });

        const formandosList = Array.from(formandosMap.values());
        console.log('Formandos extraídos:', formandosList.length);

        setFormandos(formandosList);

        // Extrair emails
        const emailList = formandosList
          .filter(formando => formando.email)
          .map(formando => ({
            id: formando.id_utilizador,
            email: formando.email,
            nome: formando.nome
          }));

        setEmails(emailList);

        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Não foi possível obter inscrições, tentando método alternativo:', error);
      await carregarFormandosAlternativo();
    }
  };

  // Função alternativa caso a principal falhe
  const carregarFormandosAlternativo = async () => {
    try {
      const token = localStorage.getItem('token');

      // Tentar obter todos os formandos
      const response = await axios.get(
        `${API_BASE}/users/formandos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && Array.isArray(response.data)) {
        console.log('Formandos encontrados:', response.data.length);

        setFormandos(response.data);

        // Extrair emails
        const emailList = response.data
          .filter(formando => formando.email)
          .map(formando => ({
            id: formando.id_utilizador,
            email: formando.email,
            nome: formando.nome
          }));

        setEmails(emailList);

        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Erro ao carregar formandos:', error);
      setError('Não foi possível carregar a lista de formandos. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  // Função simplificada para carregar submissões
  const carregarSubmissoes = async (formandoId) => {
    if (!formandoId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Usar a rota correta para submissões
      const url = `${API_BASE}/avaliar/submissoes`;

      const params = {
        id_curso: cursoId,
        id_utilizador: formandoId
      };

      // Adicionar id_pasta se fornecido
      if (pastaId) {
        params.id_pasta = pastaId;
      }

      console.log(`Buscando submissões: ${url} com parâmetros:`, params);

      const response = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      // Verificar se temos dados
      if (response.data && Array.isArray(response.data)) {
        console.log(`Encontradas ${response.data.length} submissões`, response.data);

        // Mapear notas corretamente, verificando os diferentes formatos possíveis
        const initial = {};
        response.data.forEach(item => {
          // Importante: Obter o ID correto independente do formato
          const id = item.id || item.id_trabalho;
          
          // Verificar todos os lugares possíveis onde a nota pode estar
          let nota = '';
          
          // Verificar diretamente no item
          if (item.nota !== undefined && item.nota !== null) {
            nota = item.nota.toString();
          } else if (item.avaliacao !== undefined && item.avaliacao !== null) {
            // IMPORTANTE: Verifica também o campo 'avaliacao'
            nota = item.avaliacao.toString();
          } 
          // Verificar no objeto trabalho (se existir)
          else if (item.trabalho && item.trabalho.nota !== undefined && item.trabalho.nota !== null) {
            nota = item.trabalho.nota.toString();
          } else if (item.trabalho && item.trabalho.avaliacao !== undefined && item.trabalho.avaliacao !== null) {
            // IMPORTANTE: Verifica também o campo 'avaliacao' no objeto trabalho
            nota = item.trabalho.avaliacao.toString();
          }
          
          // Se o estado é "Avaliado" mas não tem nota, isso é uma inconsistência
          if (!nota && item.estado === 'Avaliado') {
            console.warn(`Inconsistência: Item ID ${id} está marcado como Avaliado mas não tem nota detectável`);
          }

          console.log(`Inicializando nota para trabalho ID ${id}: ${nota}`);
          initial[id] = nota;
          
          // Correção do estado baseado na nota
          if (nota && nota !== '' && item.estado !== 'Avaliado') {
            // Se temos nota mas o estado não é 'Avaliado', corrigimos o estado
            console.log(`Corrigindo estado para item ${id} de "${item.estado}" para "Avaliado"`);
            item.estado = 'Avaliado';
          }
        });

        console.log('Notas inicializadas:', initial);
        setNotas(initial);
        setSubmissoes(response.data);
        
        // Calcular média das notas após carregar as submissões
        setTimeout(() => {
          calcularNotaMedia();
        }, 0);

        setLoading(false);
        return;
      } else {
        console.log('Formato de resposta inesperado ou vazio, tentando backup');
        throw new Error('Formato de resposta inesperado');
      }
    } catch (error) {
      console.error('Erro detalhado ao carregar submissões:', error);
      
      // Mostrar erro específico para facilitar debug
      let mensagemErro = `Erro ao carregar submissões: ${error.message}`;
      if (error.response) {
        console.error('Resposta do servidor:', error.response.data);
        console.error('Status:', error.response.status);
        mensagemErro = `Erro ${error.response.status}: ${error.response.data?.message || 'Erro no servidor'}`;
      }
      
      console.log('Tentando método alternativo (backup) para buscar submissões');

      // Tentar backup com a API de trabalhos
      try {
        const token = localStorage.getItem('token');
        const backupUrl = `${API_BASE}/trabalhos`;
        const params = {
          id_curso: cursoId,
          id_utilizador: formandoId
        };

        console.log(`Tentando backup: ${backupUrl} com parâmetros:`, params);

        const response = await axios.get(backupUrl, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data)) {
          console.log(`Backup encontrou ${response.data.length} submissões:`, response.data);

          // Mapear notas corretamente, verificando também o campo avaliacao
          const initial = {};
          response.data.forEach(item => {
            const id = item.id || item.id_trabalho;
            
            // Verificar tanto nota quanto avaliacao, dando prioridade à nota
            let nota = '';
            if (item.nota !== undefined && item.nota !== null) {
              nota = item.nota.toString();
            } else if (item.avaliacao !== undefined && item.avaliacao !== null) {
              nota = item.avaliacao.toString();
            }
            
            console.log(`Inicializando nota para trabalho ID ${id}: ${nota}`);
            initial[id] = nota;
            
            // Correção do estado baseado na nota
            if (nota && nota !== '' && item.estado !== 'Avaliado') {
              console.log(`Corrigindo estado para item ${id} de "${item.estado}" para "Avaliado"`);
              item.estado = 'Avaliado';
            }
          });

          console.log('Notas inicializadas via backup:', initial);
          setNotas(initial);
          setSubmissoes(response.data);
          
          // Calcular média das notas após carregar as submissões
          setTimeout(() => {
            calcularNotaMedia();
          }, 0);

          setLoading(false);
          return;
        } else {
          throw new Error('Backup não retornou dados válidos');
        }
      } catch (backupError) {
        console.error('Falha também no backup:', backupError);
        setError(`${mensagemErro}. O sistema de backup também falhou.`);
        setLoading(false);
      }
    }
  };

  // Ao selecionar um formando, preenche o email automaticamente e carrega as submissões
  const handleFormandoChange = (event) => {
    const formandoId = event.target.value;
    setSelectedFormando(formandoId);

    if (formandoId) {
      // Encontra o formando correspondente ao ID selecionado
      const formando = formandos.find(f => String(f.id_utilizador) === String(formandoId));

      if (formando && formando.email) {
        setSelectedEmail(formando.email);
      } else {
        setSelectedEmail('');
      }

      // Inicialmente assume que não há certificado até que a verificação seja concluída
      setCertificadoExiste(false);

      // Carrega as submissões automaticamente
      carregarSubmissoes(formandoId);

      // Verifica se o certificado existe - isso irá atualizar o estado quando concluído
      verificarCertificadoExistente(formandoId);
    } else {
      setSelectedEmail('');
      setSubmissoes([]);
      setCertificadoExiste(false);
      setNotaMedia(null);
    }
  };

  // Ao selecionar um email, preenche o formando automaticamente e carrega as submissões
  const handleEmailChange = (event) => {
    const email = event.target.value;
    setSelectedEmail(email);

    if (email) {
      // Encontra o formando correspondente ao email selecionado
      const emailObj = emails.find(e => e.email === email);

      if (emailObj) {
        const formandoId = String(emailObj.id);
        setSelectedFormando(formandoId);

        // Carrega as submissões automaticamente
        carregarSubmissoes(formandoId);
      }
    } else {
      setCertificadoExiste(false);
      setSelectedFormando('');
      setSubmissoes([]);
      setNotaMedia(null);
    }
  };

  // Ao alterar nota no campo - validando o intervalo 0-20
  const handleNotaChange = (id, value) => {
    // Converter para número para validação
    const numValue = Number(value);

    // Se o valor for um número válido e estiver dentro do intervalo 0-20, atualize o estado
    // Se estiver vazio, permitir (para poder limpar o campo)
    if (value === '' || (numValue >= 0 && numValue <= 20)) {
      setNotas(prev => ({ ...prev, [id]: value }));
      
      // Atualizamos a média sempre que uma nota é alterada
      setTimeout(() => {
        calcularNotaMedia();
      }, 0);
    }
  };

  // Salvar nota de uma submissão - Simplificado e melhorado
  const handleSave = async (id) => {
    // Verificar se a nota está no intervalo válido
    const notaValue = notas[id];
    const numValue = Number(notaValue);

    // Validação antes de salvar
    if (notaValue !== '' && (isNaN(numValue) || numValue < 0 || numValue > 20)) {
      alert('A nota deve ser um valor entre 0 e 20.');
      return;
    }

    setSaving(prev => ({ ...prev, [id]: true }));

    try {
      const token = localStorage.getItem('token');

      console.log(`Salvando nota ${notaValue} para o trabalho ID ${id}`);

      // Tentar salvar usando a rota de avaliações de submissões
      const response = await axios.put(
        `${API_BASE}/avaliar/submissoes/${id}/nota`,
        { nota: notaValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`Resposta ao salvar nota:`, response.data);

      // Atualizar o estado global da submissão após salvar com sucesso
      setSubmissoes(prev => prev.map(item => {
        const itemId = item.id || item.id_trabalho;
        if (itemId === id) {
          // Se o item tiver um objeto trabalho, atualiza a nota nesse objeto
          if (item.trabalho) {
            return {
              ...item,
              trabalho: {
                ...item.trabalho,
                nota: notaValue,
                avaliacao: notaValue, // IMPORTANTE: Atualizar também o campo avaliacao
                estado: 'Avaliado'
              }
            };
          }
          // Caso contrário, atualiza diretamente no item
          return {
            ...item,
            nota: notaValue,
            avaliacao: notaValue, // IMPORTANTE: Atualizar também o campo avaliacao
            estado: 'Avaliado'
          };
        }
        return item;
      }));

      // Recalcular a média após salvar uma nota
      calcularNotaMedia();

    } catch (error) {
      console.error('Erro com a primeira rota, tentando alternativa:', error);

      try {
        // Tentar rota alternativa de trabalhos
        const token = localStorage.getItem('token');

        const response = await axios.put(
          `${API_BASE}/trabalhos/${id}`,
          { nota: notaValue, avaliacao: notaValue }, // IMPORTANTE: Enviar também o campo avaliacao
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(`Resposta da rota alternativa:`, response.data);

        // Atualizar o estado global da submissão após salvar com sucesso
        setSubmissoes(prev => prev.map(item => {
          const itemId = item.id || item.id_trabalho;
          if (itemId === id) {
            return {
              ...item,
              nota: notaValue,
              avaliacao: notaValue, // IMPORTANTE: Atualizar também o campo avaliacao
              estado: 'Avaliado'
            };
          }
          return item;
        }));

        // Recalcular a média após salvar uma nota
        calcularNotaMedia();

      } catch (altError) {
        console.error('Erro ao salvar nota:', altError);
        alert('Não foi possível salvar a nota. Tente novamente.');
      }
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const verificarCertificadoExistente = async (formandoId) => {
    if (!formandoId || !cursoId) return;

    try {
      const token = localStorage.getItem('token');
      const courseResponse = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!courseResponse.data || !courseResponse.data.nome) {
        return false;
      }

      // Get email for file path construction
      const formando = formandos.find(f => String(f.id_utilizador) === String(formandoId));
      if (!formando || !formando.email) {
        return false;
      }

      const emailFormatado = formando.email.replace(/@/g, '_at_').replace(/\./g, '_');
      const cursoNome = courseResponse.data.nome.replace(/\s+/g, '_');
      const filePath = `/uploads/users/${emailFormatado}/certificados/certificado_${cursoNome}.pdf`;

      // Check if the file exists by making a HEAD request
      try {
        await axios.head(`${API_BASE}${filePath}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // If we get here, the file exists
        setCertificadoUrl(`${API_BASE}${filePath}`);
        setCertificadoExiste(true);

        console.log(`Certificado encontrado para formando ID ${formandoId}: ${filePath}`);
        return true;
      } catch (error) {
        // File doesn't exist
        setCertificadoExiste(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar certificado existente:', error);
      return false;
    }
  };

  // Gerar certificado
const handleGerarCertificado = async () => {
    if (!selectedFormando) {
      alert('Selecione um formando para gerar o certificado');
      return;
    }

    // Verificar se há notas para calcular média
    if (!notaMedia) {
      const confirmar = window.confirm('Não há média de notas calculada. Deseja gerar o certificado mesmo assim?');
      if (!confirmar) {
        return;
      }
    }

    try {
      setLoading(true); // Mostrar indicador de carregamento

      // Manter o código que salva dados no sessionStorage
      const token = localStorage.getItem('token');
      const courseResponse = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Armazenar dados do curso
      if (courseResponse.data) {
        sessionStorage.setItem('certificado_cursoId', cursoId);
        sessionStorage.setItem('certificado_curso_nome', courseResponse.data.nome);
        sessionStorage.setItem('certificado_curso_duracao', courseResponse.data.duracao || 0);

        const categoria = typeof courseResponse.data.categoria === 'object'
          ? courseResponse.data.categoria.nome
          : courseResponse.data.categoria;
        sessionStorage.setItem('certificado_curso_categoria', categoria || 'N/A');

        const area = typeof courseResponse.data.area === 'object'
          ? courseResponse.data.area.nome
          : courseResponse.data.area;
        sessionStorage.setItem('certificado_curso_area', area || 'N/A');

        if (courseResponse.data.id_formador) {
          const formadorResponse = await axios.get(
            `${API_BASE}/formadores/${courseResponse.data.id_formador}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (formadorResponse.data) {
            sessionStorage.setItem('certificado_formador', formadorResponse.data.nome);
          }
        }
      }

      // Armazenar dados do formando
      const formando = formandos.find(f => f.id_utilizador === selectedFormando);
      if (formando) {
        sessionStorage.setItem('certificado_utilizadorId', selectedFormando);
        sessionStorage.setItem('certificado_nome', formando.nome);
        sessionStorage.setItem('certificado_email', formando.email);
      }

      // Usar a nota média calculada ou calcular novamente
      const notaFinal = notaMedia || calcularNotaMedia();
      if (notaFinal) {
        sessionStorage.setItem('certificado_nota', notaFinal);
      }

      // Registrar certificado no backend
      const registrarResponse = await axios.post(`${API_BASE}/certificados/registrar`, {
        userId: selectedFormando,
        cursoId: cursoId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!registrarResponse.data.success) {
        throw new Error("Erro ao registrar certificado");
      }

      // 1. Primeiro, criar o diretório para certificados
      await axios.post(`${API_BASE}/certificados/criar-diretorio`,
        { id_utilizador: selectedFormando },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Agora, gerar e salvar o certificado usando a função SalvarCertificado no backend
      const gerarESalvarResponse = await axios.post(
        `${API_BASE}/certificados/gerar-e-salvar`,
        {
          userId: selectedFormando,
          cursoId: cursoId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (gerarESalvarResponse.data && gerarESalvarResponse.data.path) {
        // Armazenar o URL para acessar o certificado
        setCertificadoUrl(`${API_BASE}${gerarESalvarResponse.data.path}`);
        // Marcar certificado como existente
        setCertificadoExiste(true);
        setTimeout(() => {
          console.log("Certificate URL:", `${API_BASE}${gerarESalvarResponse.data.path}`);
          console.log("Certificate exists state:", certificadoExiste);
        }, 0);
        alert('Certificado gerado e salvo com sucesso!');
        console.log("Certificate URL:", `${API_BASE}${gerarESalvarResponse.data.path}`);
        console.log("Certificate exists state:", certificadoExiste);
      } else {
        throw new Error("Falha ao salvar o certificado");
      }

    } catch (error) {
      console.error('Erro ao processar certificado:', error);
      alert('Não foi possível gerar o certificado. Tente novamente.');
    } finally {
      setLoading(false);
    }
};

  // Adicione a função para abrir o certificado
const handleVerCertificado = () => {
    // Cria o certificado temporário e obtém o ID
    const tempCertId = `temp_${Date.now()}`;
    
    try {
        window.open(`/certificado/${tempCertId}?bypass=true&cursoId=${cursoId}&utilizadorId=${selectedFormando}`, '_blank');
    } catch (error) {
        alert('Não foi possível abrir o certificado. Por favor, tente novamente.');
        console.error('Erro ao abrir certificado:', error);
    }
};

  // Apagar o certificado
  const handleApagarCertificado = async () => {
    if (!selectedFormando) {
      alert('Selecione um formando para apagar o certificado');
      return;
    }

    // Confirmação antes de apagar
    setIsDeleteModalOpen(true);

    try {
      const token = localStorage.getItem('token');

      // Obter o nome formatado do curso para o nome do arquivo
      const formando = formandos.find(f => String(f.id_utilizador) === String(selectedFormando));
      const fileName = `certificado_${formando?.nome.replace(/\s+/g, '_')}.pdf`;

      const response = await axios.delete(
        `${API_BASE}/certificados/eliminar-ficheiro`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            id_utilizador: selectedFormando,
            nome_ficheiro: fileName
          }
        }
      );

      if (response.data.success) {
        setCertificadoExiste(false);
      } else {
        throw new Error(response.data.message || 'Erro ao apagar certificado');
      }
    } catch (error) {
      console.error('Erro ao apagar certificado:', error);
      alert('Não foi possível apagar o certificado.');
    }
  };



  // Download do trabalho
  const handleDownload = (ficheiro_path, nome_ficheiro) => {
    if (!ficheiro_path) return;

    // Verificar se o caminho já contém "submissoes"
    let path = ficheiro_path;
    if (path.includes('/teste/') && !path.includes('/submissoes/')) {
      // Inserir "submissoes/" no caminho
      const parts = path.split('/teste/');
      path = `${parts[0]}/teste/submissoes/${parts[1]}`;
    }

    const downloadUrl = `${API_BASE}/${path}`;

    // Criando um link temporário para download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', nome_ficheiro || 'trabalho');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="avaliar-trabalhos-container">
        <h2>Avaliar Trabalhos</h2>
        <div className="loading-message">
          <div className="spinner"></div>
          <p>A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="avaliar-trabalhos-container">
        <h2>Avaliar Trabalhos</h2>

        {/* Mensagem de erro */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Filtros */}
        {formandos.length > 0 && (
          <div className="filtros-container">
            <div className="filtro-grupo">
              <label htmlFor="formando">Formando:</label>
              <select
                id="formando"
                value={selectedFormando}
                onChange={handleFormandoChange}
              >
                <option value="">Selecione um formando</option>
                {formandos.map(formando => (
                  <option key={formando.id_utilizador} value={formando.id_utilizador}>
                    {formando.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-grupo">
              <label htmlFor="email">Email:</label>
              <select
                id="email"
                value={selectedEmail}
                onChange={handleEmailChange}
              >
                <option value="">Selecione um email</option>
                {emails.map(email => (
                  <option key={email.id} value={email.email}>
                    {email.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Informação do curso e média de notas */}
            {selectedFormando && (
              <div className="info-certificado">
                <div className="info-curso">
                  <strong>Curso:</strong> {cursoInfo?.nome || 'N/A'}
                  <span className="separador">|</span>
                  <strong>Duração:</strong> {cursoDuracao || 0} horas
                </div>
                <div className="info-nota">
                  <strong>Nota Média:</strong> {notaMedia ? `${notaMedia}/20` : 'Sem notas'}
                </div>
              </div>
            )}

            <div className="filtro-acoes">
              {certificadoExiste ? (
                <>
                  <button className="btn-apagar-certificado" onClick={handleDeleteClick} disabled={!selectedFormando}>
                    Apagar Certificado
                  </button>
                  <button className="btn-ver-certificado" onClick={handleVerCertificado} disabled={!selectedFormando}>
                    <i className="fas fa-eye"></i> Ver Certificado
                  </button>
                </>
              ) : (
                <button className="btn-gerar-certificado" onClick={handleGerarCertificado} disabled={!selectedFormando || loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : null}
                  {loading ? " Gerando..." : "Gerar Certificado"}
                </button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>A carregar dados...</p>
          </div>
        )}
        {/* Modal de confirmação */}
        <ApagarCertificadoModal
          isOpen={isDeleteModalOpen}
          message="Tem certeza que deseja apagar o certificado deste formando?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />


        {/* Tabela de submissões */}
        {submissoes.length > 0 ? (
          <table className="tabela-avaliar">
            <thead>
              <tr>
                <th>Pasta</th>
                <th>Submissão</th>
                <th>Data de Submissão</th>
                <th>Data Limite</th>
                <th>Estado</th>
                <th>Nota</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissoes.map(item => {
                return (
                  <tr key={item.id || item.id_trabalho || `trabalho-${item.ficheiro_path}`}>
                    <td>
                      {item.pasta ? item.pasta.nome : 
                       (item.nome_pasta || 
                        (item.id_pasta ? `Pasta ID: ${item.id_pasta}` : 'N/A'))}
                    </td>
                    <td>
                      {item.ficheiro_path ? (
                        <a
                          href={`${API_BASE}/${item.ficheiro_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.nome_ficheiro || item.ficheiro_path.split('/').pop() || 'Ver Ficheiro'}
                        </a>
                      ) : (
                        'Sem submissão'
                      )}
                    </td>
                    <td>{item.data_submissao || item.data_entrega ? new Date(item.data_submissao || item.data_entrega).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {item.data_limite ? 
                       new Date(item.data_limite).toLocaleDateString() : 
                       (item.limite ? new Date(item.limite).toLocaleDateString() : 'N/A')}
                    </td>
                    <td>{item.estado || (item.trabalho && item.trabalho.estado) || 'Pendente'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="any"
                        value={notas[item.id || item.id_trabalho] || ''}
                        onChange={e => handleNotaChange(item.id || item.id_trabalho, e.target.value)}
                        onKeyPress={e => {
                          // Impedir a entrada de valores não numéricos
                          if (!/[\d\.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </td>
                    <td className="acoes-coluna">
                      <button
                        className="btn-download"
                        onClick={() => handleDownload(item.ficheiro_path, item.nome_ficheiro)}
                        disabled={!item.ficheiro_path}
                        title="Descarregar ficheiro"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        className="btn-salvar-nota"
                        onClick={() => handleSave(item.id || item.id_trabalho)}
                        disabled={saving[item.id || item.id_trabalho]}
                        title="Guardar nota"
                      >
                        {saving[item.id || item.id_trabalho] ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-save"></i>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          selectedFormando && !loading ? (
            <div className="info-message">
              Nenhuma submissão encontrada para este formando. Verifique se ele já submeteu trabalhos.
            </div>
          ) : (
            <div className="info-message">Selecione um formando para ver suas submissões.</div>
          )
        )}
      </div>

    </div>
  );
};

export default Avaliar_Trabalhos;