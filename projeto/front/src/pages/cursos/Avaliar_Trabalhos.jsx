import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE from '../../api';
import Sidebar from "../../components/Sidebar";
import ApagarCertificadoModal from '../../components/cursos/Apagar_Certificado_Modal';
import './css/Avaliar_Trabalhos.css';

const Avaliar_Trabalhos = ({ hideSidebar = false }) => {
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

  // Estados existentes
  const [notaMedia, setNotaMedia] = useState(null);
  const [cursoDuracao, setCursoDuracao] = useState(null);
  const [cursoInfo, setCursoInfo] = useState(null);

  // Estados para suporte a quizzes
  const [tipoCurso, setTipoCurso] = useState(null);
  const [dadosQuizzes, setDadosQuizzes] = useState([]);

  // Carregar formandos ao iniciar
  useEffect(() => {
    carregarFormandos();
    carregarInfoCurso();
  }, [cursoId]);

  // Carregar informações do curso e detectar tipo
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
        setTipoCurso(response.data.tipo);

        console.log(`Tipo de curso detectado: ${response.data.tipo}`);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do curso:', error);
    }
  };

  // Calcular média das notas (funciona para ambos os tipos)
  const calcularNotaMedia = () => {
    if (tipoCurso === 'assincrono') {
      // Para cursos assíncronos, usar dados dos quizzes
      const formandoSelecionado = dadosQuizzes.find(f => String(f.formando.id_utilizador) === String(selectedFormando));
      if (formandoSelecionado && formandoSelecionado.media > 0) {
        setNotaMedia(formandoSelecionado.media.toFixed(2));
        return formandoSelecionado.media.toFixed(2);
      } else {
        setNotaMedia(null);
        return null;
      }
    } else {
      // Para cursos síncronos, usar lógica original
      const notasArray = Object.values(notas).filter(nota => nota !== '').map(Number);
      if (notasArray.length > 0) {
        const media = notasArray.reduce((sum, nota) => sum + nota, 0) / notasArray.length;
        setNotaMedia(media.toFixed(2));
        return media.toFixed(2);
      } else {
        setNotaMedia(null);
        return null;
      }
    }
  };

  // Atualizar a média sempre que as notas mudarem ou dados de quizzes mudarem
  useEffect(() => {
    calcularNotaMedia();
  }, [notas, dadosQuizzes, selectedFormando, tipoCurso]);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFormando) return;
    try {
      const token = localStorage.getItem('token');

      const courseResponse = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!courseResponse.data || !courseResponse.data.nome) {
        throw new Error('Não foi possível obter as informações do curso');
      }

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
              email: inscricao.utilizador.email,
              id_inscricao: inscricao.id_inscricao // Guardar o ID da inscrição
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

  // Carregar dados de quizzes para cursos assíncronos
  const carregarDadosQuizzes = async () => {
    if (!cursoId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      console.log(`Carregando dados de quizzes para curso ${cursoId}`);

      const response = await axios.get(
        `${API_BASE}/quiz/notas-curso/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        console.log(`Dados de quizzes carregados:`, response.data.data);
        setDadosQuizzes(response.data.data);
      } else {
        console.log('Nenhum dado de quiz encontrado');
        setDadosQuizzes([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados de quizzes:', error);
      setError('Não foi possível carregar os dados dos quizzes. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  // Carregar submissões ou dados de quizzes baseado no tipo de curso
  const carregarSubmissoes = async (formandoId) => {
    if (!formandoId) {
      return;
    }

    // Se for curso assíncrono, carregar dados de quizzes
    if (tipoCurso === 'assincrono') {
      await carregarDadosQuizzes();
      return;
    }

    // Lógica original para cursos síncronos
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
          // Obter o ID correto independente do formato
          const id = item.id || item.id_trabalho;

          // Verificar todos os lugares possíveis onde a nota pode estar
          let nota = '';

          // Verificar diretamente no item
          if (item.nota !== undefined && item.nota !== null) {
            nota = item.nota.toString();
          } else if (item.avaliacao !== undefined && item.avaliacao !== null) {
            //  Verifica também o campo 'avaliacao'
            nota = item.avaliacao.toString();
          }
          // Verificar no objeto trabalho (se existir)
          else if (item.trabalho && item.trabalho.nota !== undefined && item.trabalho.nota !== null) {
            nota = item.trabalho.nota.toString();
          } else if (item.trabalho && item.trabalho.avaliacao !== undefined && item.trabalho.avaliacao !== null) {
            //  Verifica também o campo 'avaliacao' no objeto trabalho
            nota = item.trabalho.avaliacao.toString();
          }

          // Se o estado é "Avaliado" mas não tem nota, isso é uma inconsistência
          if (!nota && item.estado === 'Avaliado') {
            console.warn(`Inconsistência: Item ID ${id} está marcado como Avaliado mas não tem nota detectável`);
          }

          console.log(`Inicializando nota para trabalho ID ${id}: ${nota}`);
          initial[id] = nota;

          // Estado baseado na nota
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

            // Estado baseado na nota
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
      setDadosQuizzes([]);
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
      setDadosQuizzes([]);
      setNotaMedia(null);
    }
  };

  // Ao alterar nota no campo - validando o intervalo 0-20 (APENAS PARA CURSOS SÍNCRONOS)
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

  // Salvar nota de uma submissão (APENAS PARA CURSOS SÍNCRONOS)
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
                avaliacao: notaValue,
                estado: 'Avaliado'
              }
            };
          }
          // Caso contrário, atualiza diretamente no item
          return {
            ...item,
            nota: notaValue,
            avaliacao: notaValue,
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
          { nota: notaValue, avaliacao: notaValue },
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
              avaliacao: notaValue,
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
      const fullUrl = `${API_BASE}${filePath}`;

      // Check if the file exists by making a HEAD request
      try {
        await axios.head(fullUrl, { headers: { Authorization: `Bearer ${token}` } });

        // If we get here, the file exists
        console.log(`Certificado encontrado para formando ID ${formandoId}: ${filePath}`);

        // Salvar o URL completo para acesso direto
        setCertificadoUrl(fullUrl);
        setCertificadoExiste(true);

        return true;
      } catch (error) {
        // File doesn't exist
        setCertificadoExiste(false);
        setCertificadoUrl('');
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar certificado existente:', error);
      setCertificadoExiste(false);
      setCertificadoUrl('');
      return false;
    }
  };

  // Gerar certificado
  const handleGerarCertificado = async () => {
    if (!selectedFormando) {
      alert('Selecione um formando para gerar o certificado');
      return;
    }

    // Para cursos assíncronos, verificar se há média de quizzes
    if (tipoCurso === 'assincrono') {
      const formandoSelecionado = dadosQuizzes.find(f => String(f.formando.id_utilizador) === String(selectedFormando));
      if (!formandoSelecionado || formandoSelecionado.media <= 0) {
        alert('O formando não completou quizzes suficientes para gerar o certificado.');
        return;
      }
    } else {
      // Para cursos síncronos, verificar se há notas
      if (!notaMedia) {
        const confirmar = window.confirm('Não há média de notas calculada. Deseja gerar o certificado mesmo assim?');
        if (!confirmar) {
          return;
        }
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Flag para controlar se devemos continuar mesmo com erro na verificação
      let continuarProcesso = false;

      try {
        // Tentar verificar as horas do formador
        const verificacaoResponse = await axios.get(
          `${API_BASE}/certificados/verificar-horas-formador/${cursoId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Se tudo ok e a verificação foi bem-sucedida
        if (verificacaoResponse.data.success) {
          if (verificacaoResponse.data.horasConcluidas) {
            // Formador completou as horas, pode prosseguir
            continuarProcesso = true;
          } else {
            // Formador não completou horas, exibir mensagem e perguntar se quer prosseguir
            const mensagem = `Atenção: O formador completou apenas ${verificacaoResponse.data.horasRegistradas} de ${verificacaoResponse.data.horasTotaisCurso} horas necessárias.\n\nDeseja gerar o certificado mesmo assim?`;
            continuarProcesso = window.confirm(mensagem);
          }
        } else {
          // Resposta com sucesso=false, exibir mensagem e perguntar se quer prosseguir
          const mensagem = `Aviso: Não foi possível verificar as horas do formador.\n\nDeseja gerar o certificado mesmo assim?`;
          continuarProcesso = window.confirm(mensagem);
        }
      } catch (verificacaoError) {
        console.error('Erro ao verificar horas do formador:', verificacaoError);
        // Em caso de erro na verificação, perguntar se deseja continuar
        const mensagem = `Aviso: Não foi possível verificar as horas do formador devido a um erro no sistema.\n\nDeseja gerar o certificado mesmo assim?`;
        continuarProcesso = window.confirm(mensagem);
      }

      // Se não estiver autorizado a continuar, encerra a função
      if (!continuarProcesso) {
        setLoading(false);
        return;
      }

      // Obter dados do formando selecionado
      const formandoSelecionado = formandos.find(f => String(f.id_utilizador) === String(selectedFormando));

      if (!formandoSelecionado) {
        throw new Error("Dados do formando não encontrados");
      }

      console.log("Dados do formando selecionado:", formandoSelecionado);

      // Obter dados do curso
      const courseResponse = await axios.get(
        `${API_BASE}/cursos/${cursoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Armazenar dados do curso no sessionStorage com validação
      if (courseResponse.data) {
        sessionStorage.setItem('certificado_cursoId', cursoId);
        sessionStorage.setItem('certificado_curso_nome', courseResponse.data.nome || '');
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
            sessionStorage.setItem('certificado_formador', formadorResponse.data.nome || '');
          }
        }
      }

      // Armazenar dados do formando no sessionStorage
      sessionStorage.setItem('certificado_utilizadorId', selectedFormando);
      sessionStorage.setItem('certificado_nome', formandoSelecionado.nome || '');
      sessionStorage.setItem('certificado_email', formandoSelecionado.email || '');

      // Usar a nota média calculada ou calcular novamente
      const notaFinal = notaMedia || calcularNotaMedia() || 0;
      sessionStorage.setItem('certificado_nota', notaFinal);

      console.log("Dados para geração do certificado:");
      console.log({
        userId: selectedFormando,
        cursoId: cursoId,
        formandoNome: formandoSelecionado.nome,
        formandoEmail: formandoSelecionado.email,
        nota: notaFinal
      });

      // Registrar certificado no backend
      const registrarResponse = await axios.post(`${API_BASE}/certificados/registar`, {
        userId: selectedFormando,
        cursoId: cursoId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!registrarResponse.data.success) {
        throw new Error("Erro ao registrar certificado");
      }

      // 1. Primeiro, criar o diretório para certificados para o FORMANDO
      await axios.post(`${API_BASE}/certificados/criar-diretorio`,
        { id_utilizador: selectedFormando },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Agora, gerar o PDF diretamente no frontend com jsPDF e enviar para o backend
      const jsPDF = await import('jspdf').then(module => module.default);

      // Criar o documento PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Definir fonte e estilo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);

      // Título do certificado
      doc.text('CERTIFICADO', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

      // Subtítulo
      doc.setFontSize(14);
      doc.text('de Conclusão de Curso', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

      // Linha decorativa
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(40, 45, doc.internal.pageSize.getWidth() - 40, 45);

      // Texto principal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const startY = 70;
      doc.text(`Certificamos que`, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });

      // Nome do aluno
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${formandoSelecionado.nome}`, doc.internal.pageSize.getWidth() / 2, startY + 10, { align: 'center' });

      // Texto de conclusão
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`concluiu com aproveitamento o curso:`, doc.internal.pageSize.getWidth() / 2, startY + 20, { align: 'center' });

      // Nome do curso
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`${courseResponse.data.nome}`, doc.internal.pageSize.getWidth() / 2, startY + 35, { align: 'center' });

      // Detalhes da formação
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      // Determinar categoria e área
      let categoria = 'N/A';
      let area = 'N/A';

      if (courseResponse.data.categoria) {
        categoria = typeof courseResponse.data.categoria === 'object'
          ? courseResponse.data.categoria.nome
          : courseResponse.data.categoria;
      }

      if (courseResponse.data.area) {
        area = typeof courseResponse.data.area === 'object'
          ? courseResponse.data.area.nome
          : courseResponse.data.area;
      }

      doc.text(`Categoria: ${categoria}`, doc.internal.pageSize.getWidth() / 2, startY + 50, { align: 'center' });
      doc.text(`Área: ${area}`, doc.internal.pageSize.getWidth() / 2, startY + 60, { align: 'center' });

      // Duração e nota
      doc.text(`Duração: ${courseResponse.data.duracao || 0} horas`, doc.internal.pageSize.getWidth() / 2, startY + 70, { align: 'center' });

      // Mostrar nota sobre 10 para cursos assíncronos, sobre 20 para síncronos
      const notaMaxima = tipoCurso === 'assincrono' ? 10 : 20;
      doc.text(`Nota Final: ${notaFinal || 0}/${notaMaxima}`, doc.internal.pageSize.getWidth() / 2, startY + 80, { align: 'center' });

      // Datas do certificado 
      // Data de fim do curso
      let dataFimCurso = 'N/A';
      if (courseResponse.data.data_fim) {
        dataFimCurso = new Date(courseResponse.data.data_fim).toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }

      // Data de criação do certificado (data atual)
      const dataGeracao = new Date().toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Espaçamento para as datas
      const espacamentoFinal = startY + 95;

      // Linha separadora antes das datas
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(80, espacamentoFinal - 5, doc.internal.pageSize.getWidth() - 80, espacamentoFinal - 5);

      // Configurar estilo para as datas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80); // Cor mais suave para as datas

      // Data de conclusão do curso
      doc.text(`Curso concluído em: ${dataFimCurso}`, doc.internal.pageSize.getWidth() / 2, espacamentoFinal + 5, { align: 'center' });

      // Data de emissão do certificado
      doc.text(`Certificado emitido em: ${dataGeracao}`, doc.internal.pageSize.getWidth() / 2, espacamentoFinal + 15, { align: 'center' });

      // Obter o PDF como array buffer
      const pdfBuffer = doc.output('arraybuffer');

      // Formatar o nome do curso para o nome do arquivo
      const cursoNomeFormatado = courseResponse.data.nome.replace(/\s+/g, '_');

      // Criar um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('pdfCertificado', new Blob([pdfBuffer], { type: 'application/pdf' }));
      formData.append('id_utilizador', selectedFormando);
      formData.append('id_curso', cursoId);

      // Enviar o PDF para o servidor usando a rota existente
      const gerarESalvarResponse = await axios.post(
        `${API_BASE}/certificados/salvar-do-frontend`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (gerarESalvarResponse.data && gerarESalvarResponse.data.path) {
        // Armazenar o URL para acessar o certificado
        const certificadoUrlGerado = `${API_BASE}${gerarESalvarResponse.data.path}`;
        setCertificadoUrl(certificadoUrlGerado);

        // Marcar certificado como existente
        setCertificadoExiste(true);

        console.log("Certificado gerado com sucesso:", certificadoUrlGerado);

        //  Agora vamos criar/atualizar a entrada na tabela avaliacoes
        try {
          // Primeiro, buscar o ID da inscrição
          let inscricaoId = formandoSelecionado.id_inscricao;
          
          // Se não temos o ID da inscrição armazenado, buscar
          if (!inscricaoId) {
            const inscricoesResponse = await axios.get(
              `${API_BASE}/inscricoes/curso/${cursoId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const inscricao = inscricoesResponse.data.find(
              insc => String(insc.id_utilizador) === String(selectedFormando)
            );

            if (inscricao) {
              inscricaoId = inscricao.id_inscricao;
            }
          }

          if (inscricaoId) {
            // Verificar se já existe uma avaliação
            try {
              const avaliacoesResponse = await axios.get(
                `${API_BASE}/avaliacoes`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const avaliacaoExistente = avaliacoesResponse.data.find(
                av => av.id_inscricao === inscricaoId
              );

              if (avaliacaoExistente) {
                // Atualizar avaliação existente
                await axios.put(
                  `${API_BASE}/avaliacoes/${avaliacaoExistente.id_avaliacao}`,
                  {
                    nota: parseFloat(notaFinal) || 0,
                    certificado: true,
                    horas_totais: parseInt(courseResponse.data.duracao) || 0,
                    horas_presenca: parseInt(courseResponse.data.duracao) || 0, // Assumindo presença total
                    url_certificado: gerarESalvarResponse.data.path
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log("Avaliação atualizada com sucesso!");
              } else {
                // Criar nova avaliação
                await axios.post(
                  `${API_BASE}/avaliacoes`,
                  {
                    id_inscricao: inscricaoId,
                    nota: parseFloat(notaFinal) || 0,
                    certificado: true,
                    horas_totais: parseInt(courseResponse.data.duracao) || 0,
                    horas_presenca: parseInt(courseResponse.data.duracao) || 0, // Assumindo presença total
                    url_certificado: gerarESalvarResponse.data.path
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log("Avaliação criada com sucesso!");
              }
            } catch (avaliacaoError) {
              console.error("Erro ao verificar/criar avaliação:", avaliacaoError);
              // Não vamos falhar o processo inteiro por causa disso
            }
          }
        } catch (inscricaoError) {
          console.error("Erro ao buscar inscrição:", inscricaoError);
          // Não vamos falhar o processo inteiro por causa disso
        }

        alert('Certificado gerado e salvo com sucesso!'); 
      } else {
        throw new Error("Falha ao salvar o certificado");
      }

    } catch (error) {
      console.error('Erro ao processar certificado:', error);

      // Melhoramos a mensagem de erro para informar o motivo específico
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Não foi possível gerar o certificado: ${error.response.data.message}`);
      } else {
        alert(`Não foi possível gerar o certificado: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Abrir o certificado
  const handleVerCertificado = () => {
    try {
      // Buscar o formando selecionado pelos dados
      const formando = formandos.find(f => String(f.id_utilizador) === String(selectedFormando));

      if (!formando || !formando.email) {
        alert('Email do formando não encontrado. Impossível visualizar o certificado.');
        return;
      }

      //  usar o email do FORMANDO, não do formador logado
      const emailFormatado = formando.email.replace(/@/g, '_at_').replace(/\./g, '_');

      // Obter o nome do curso formatado
      const cursoNomeFormatado = cursoInfo?.nome?.replace(/\s+/g, '_') || 'curso';

      // Usar certificadoUrl se disponível, ou construir URL
      if (certificadoUrl && certificadoUrl.includes('.pdf')) {
        console.log("Abrindo certificado com URL armazenado:", certificadoUrl);
        window.open(certificadoUrl, '_blank');
      } else {
        // Construir URL direta para o PDF
        const pdfUrl = `${API_BASE}/uploads/users/${emailFormatado}/certificados/certificado_${cursoNomeFormatado}.pdf`;

        console.log("URL do certificado construída:", pdfUrl);
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir certificado:', error);
      alert('Não foi possível abrir o certificado. Por favor, tente novamente.');
    }
  };

  // Download do trabalho (APENAS PARA CURSOS SÍNCRONOS)
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

  // Renderizar tabela de quizzes para cursos assíncronos
  const renderTabelaQuizzes = () => {
    const formandoSelecionado = dadosQuizzes.find(f => String(f.formando.id_utilizador) === String(selectedFormando));

    if (!formandoSelecionado) {
      return (
        <div className="info-message">
          <div className="aviso-info">
            <i className="fas fa-info-circle"></i>
            <span>Nenhum quiz encontrado para este formando no curso.</span>
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h3>
            <i className="fas fa-question-circle"></i>
            Resultados dos Quizzes
          </h3>
          <div className="quiz-stats">
            <div className="stat-item">
              <span className="stat-label">Total de Quizzes:</span>
              <span className="stat-value">{formandoSelecionado.total_quizzes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Concluídos:</span>
              <span className="stat-value">{formandoSelecionado.quizzes_completos}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Média Final:</span>
              <span className="stat-value destaque">{formandoSelecionado.media.toFixed(1)}/10</span>
            </div>
          </div>
        </div>

        <table className="tabela-avaliar tabela-quizzes">
          <thead>
            <tr>
              <th><i className="fas fa-quiz"></i> Quiz</th>
              <th><i className="fas fa-star"></i> Nota</th>
              <th><i className="fas fa-calendar"></i> Data de Conclusão</th>
              <th><i className="fas fa-check-circle"></i> Estado</th>
            </tr>
          </thead>
          <tbody>
            {formandoSelecionado.quizzes.map(quiz => (
              <tr key={quiz.id_quiz} className="quiz-row">
                <td>
                  <div className="quiz-info">
                    <i className="fas fa-file-alt"></i>
                    <span className="quiz-titulo">{quiz.titulo}</span>
                  </div>
                </td>
                <td>
                  <div className="nota-display">
                    <span className="nota-valor">{quiz.nota.toFixed(1)}</span>
                    <span className="nota-max">/10</span>
                  </div>
                </td>
                <td>
                  <div className="data-conclusao">
                    {quiz.data_conclusao ? (
                      <>
                        <i className="fas fa-calendar-check"></i>
                        {new Date(quiz.data_conclusao).toLocaleDateString('pt-PT')}
                      </>
                    ) : (
                      <span className="sem-data">N/A</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="badge-concluido">
                    <i className="fas fa-check"></i>
                    Concluído
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Progresso dos quizzes */}
        {formandoSelecionado.quizzes_completos < formandoSelecionado.total_quizzes && (
          <div className="quiz-progresso">
            <div className="progresso-info">
              <i className="fas fa-exclamation-triangle"></i>
              <span>
                O formando completou {formandoSelecionado.quizzes_completos} de {formandoSelecionado.total_quizzes} quizzes disponíveis.
              </span>
            </div>
            <div className="progresso-bar">
              <div 
                className="progresso-fill" 
                style={{ 
                  width: `${(formandoSelecionado.quizzes_completos / formandoSelecionado.total_quizzes) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="avaliar-trabalhos-container">
        <h2>Avaliar {tipoCurso === 'assincrono' ? 'Quizzes' : 'Trabalhos'}</h2>
        <div className="loading-message">
          <div className="spinner"></div>
          <p>A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!hideSidebar && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}

      <div className="avaliar-trabalhos-container">
        <h2>
          <i className={`fas ${tipoCurso === 'assincrono' ? 'fa-question-circle' : 'fa-tasks'}`}></i>
          Avaliar {tipoCurso === 'assincrono' ? 'Quizzes' : 'Trabalhos'}
        </h2>

        {/* Mensagem de erro */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {/* Filtros */}
        {formandos.length > 0 && (
          <div className="filtros-container">
            <div className="filtro-grupo">
              <label htmlFor="formando">
                <i className="fas fa-user"></i>
                Formando:
              </label>
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
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email:
              </label>
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
                  <div className="info-item">
                    <i className="fas fa-graduation-cap"></i>
                    <strong>Curso:</strong> {cursoInfo?.nome || 'N/A'}
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <strong>Duração:</strong> {cursoDuracao || 0} horas
                  </div>
                  <div className="info-item">
                    <i className="fas fa-cog"></i>
                    <strong>Tipo:</strong> {tipoCurso === 'assincrono' ? 'Assíncrono' : 'Síncrono'}
                  </div>
                </div>
                <div className="info-nota">
                  <i className="fas fa-star"></i>
                  <strong>Nota Média:</strong> 
                  {notaMedia ? (
                    <span className="nota-destaque">
                      {notaMedia}/{tipoCurso === 'assincrono' ? '10' : '20'}
                    </span>
                  ) : (
                    <span className="sem-notas">Sem notas</span>
                  )}
                </div>
              </div>
            )}

            <div className="filtro-acoes">
              {certificadoExiste ? (
                <>
                  <button 
                    className="btn-apagar-certificado" 
                    onClick={handleDeleteClick} 
                    disabled={!selectedFormando}
                  >
                    <i className="fas fa-trash"></i>
                    Apagar Certificado
                  </button>
                  <button 
                    className="btn-ver-certificado" 
                    onClick={handleVerCertificado} 
                    disabled={!selectedFormando}
                  >
                    <i className="fas fa-eye"></i>
                    Ver Certificado
                  </button>
                </>
              ) : (
                <button 
                  className="btn-gerar-certificado" 
                  onClick={handleGerarCertificado} 
                  disabled={!selectedFormando || loading}
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-certificate"></i>}
                  {loading ? " Gerando..." : "Gerar Certificado"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmação */}
        <ApagarCertificadoModal
          isOpen={isDeleteModalOpen}
          message="Tem certeza que deseja apagar o certificado deste formando?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        {/* RENDERIZAÇÃO CONDICIONAL: Tabela de quizzes vs trabalhos */}
        {selectedFormando && !loading && (
          <>
            {tipoCurso === 'assincrono' ? (
              // Tabela de quizzes para cursos assíncronos
              renderTabelaQuizzes()
            ) : (
              // Tabela de submissões para cursos síncronos (lógica original)
              submissoes.length > 0 ? (
                <table className="tabela-avaliar">
                  <thead>
                    <tr>
                      <th><i className="fas fa-folder"></i> Pasta</th>
                      <th><i className="fas fa-file"></i> Submissão</th>
                      <th><i className="fas fa-calendar"></i> Data de Submissão</th>
                      <th><i className="fas fa-calendar-times"></i> Data Limite</th>
                      <th><i className="fas fa-info-circle"></i> Estado</th>
                      <th><i className="fas fa-star"></i> Nota</th>
                      <th><i className="fas fa-cogs"></i> Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissoes.map(item => {
                      return (
                        <tr key={item.id || item.id_trabalho || `trabalho-${item.ficheiro_path}`}>
                          <td>
                            <div className="pasta-info">
                              <i className="fas fa-folder-open"></i>
                              {item.pasta ? item.pasta.nome :
                                (item.nome_pasta ||
                                  (item.id_pasta ? `Pasta ID: ${item.id_pasta}` : 'N/A'))}
                            </div>
                          </td>
                          <td>
                            {item.ficheiro_path ? (
                              <a
                                href={`${API_BASE}/${item.ficheiro_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ficheiro-link"
                              >
                                <i className="fas fa-external-link-alt"></i>
                                {item.nome_ficheiro || item.ficheiro_path.split('/').pop() || 'Ver Ficheiro'}
                              </a>
                            ) : (
                              <span className="sem-submissao">
                                <i className="fas fa-exclamation-triangle"></i>
                                Sem submissão
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="data-info">
                              {item.data_submissao || item.data_entrega ? (
                                <>
                                  <i className="fas fa-calendar-check"></i>
                                  {new Date(item.data_submissao || item.data_entrega).toLocaleDateString()}
                                </>
                              ) : (
                                <span className="sem-data">N/A</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="data-info">
                              {item.data_limite ? (
                                <>
                                  <i className="fas fa-calendar-times"></i>
                                  {new Date(item.data_limite).toLocaleDateString()}
                                </>
                              ) : (
                                item.limite ? (
                                  <>
                                    <i className="fas fa-calendar-times"></i>
                                    {new Date(item.limite).toLocaleDateString()}
                                  </>
                                ) : (
                                  <span className="sem-data">N/A</span>
                                )
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge-estado ${item.estado?.toLowerCase() || 'pendente'}`}>
                              {item.estado || (item.trabalho && item.trabalho.estado) || 'Pendente'}
                            </span>
                          </td>
                          <td>
                            <div className="nota-input-container">
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
                                placeholder="0-20"
                                className="nota-input"
                              />
                            </div>
                          </td>
                          <td className="acoes-coluna">
                            <div className="acoes-buttons">
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="info-message">
                  <div className="aviso-info">
                    <i className="fas fa-info-circle"></i>
                    <span>Nenhuma submissão encontrada para este formando. Verifique se ele já submeteu trabalhos.</span>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* Mensagem quando nenhum formando está selecionado */}
        {!selectedFormando && !loading && (
          <div className="info-message selecione-formando">
            <div className="icone-grande">
              <i className={`fas ${tipoCurso === 'assincrono' ? 'fa-question-circle' : 'fa-user-plus'}`}></i>
            </div>
            <h3>Selecione um Formando</h3>
            <p>
              Escolha um formando da lista acima para ver {tipoCurso === 'assincrono' ? 'os resultados dos quizzes' : 'as submissões de trabalhos'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Avaliar_Trabalhos;