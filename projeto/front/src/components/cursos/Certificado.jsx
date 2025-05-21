import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';
import './css/Certificado.css';

const Certificado = () => {
    const { avaliacaoId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [certificado, setCertificado] = useState(null);
    const [curso, setCurso] = useState(null);
    const [utilizador, setUtilizador] = useState(null);
    const [formador, setFormador] = useState(null);
    const [trabalhos, setTrabalhos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [certificadoPath, setCertificadoPath] = useState(null);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                console.log("=== INÍCIO DO CARREGAMENTO DE DADOS DO CERTIFICADO ===");
                setCarregando(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    setErro('Autenticação necessária');
                    navigate('/login');
                    return;
                }

                // Verificar se estamos usando um bypass para certificado temporário
                const bypassMode = searchParams.get('bypass') === 'true';
                const cursoId = searchParams.get('cursoId') || sessionStorage.getItem('certificado_cursoId');
                const utilizadorId = searchParams.get('utilizadorId') || sessionStorage.getItem('certificado_utilizadorId');

                // Verificar se temos dados passados pela URL
                const certDataEncoded = searchParams.get('certData');

                console.log("Parâmetros iniciais:", { bypassMode, cursoId, utilizadorId, temCertData: !!certDataEncoded });
                console.log("Dados do sessionStorage:");
                console.log({
                    curso_id: sessionStorage.getItem('certificado_cursoId'),
                    curso_nome: sessionStorage.getItem('certificado_curso_nome'),
                    curso_duracao: sessionStorage.getItem('certificado_curso_duracao'),
                    categoria: sessionStorage.getItem('certificado_curso_categoria'),
                    area: sessionStorage.getItem('certificado_curso_area'),
                    formador: sessionStorage.getItem('certificado_formador'),
                    aluno_id: sessionStorage.getItem('certificado_utilizadorId'),
                    aluno_nome: sessionStorage.getItem('certificado_nome'),
                    aluno_email: sessionStorage.getItem('certificado_email'),
                    nota_final: sessionStorage.getItem('certificado_nota')
                });

                // Primeiro, verificar se temos dados codificados na URL
                if (bypassMode && certDataEncoded) {
                    try {
                        console.log('Tentando usar dados da URL (certData)');
                        const certData = JSON.parse(decodeURIComponent(certDataEncoded));

                        // Usar os dados decodificados
                        setCurso({
                            nome: certData.cursoNome || 'Nome do Curso',
                            categoria: certData.cursoCategoria || 'Categoria',
                            area: certData.cursoArea || 'Área',
                            duracao: certData.cursoDuracao || 0
                        });

                        setUtilizador({
                            nome: certData.nome || 'Nome do Aluno',
                            email: certData.email || 'email@example.com'
                        });

                        setCertificado({
                            id_avaliacao: `temp_${Date.now()}`,
                            nota: certData.nota || 10,
                            certificado: true
                        });

                        console.log('Dados encontrados e processados via URL:', certData);

                        // Adicionar também ao sessionStorage desta aba
                        Object.entries(certData).forEach(([key, value]) => {
                            if (value) sessionStorage.setItem(`certificado_${key}`, value);
                        });

                        setCarregando(false);
                        return; // Não precisamos continuar, temos tudo o que precisamos
                    } catch (error) {
                        console.error('Erro ao decodificar dados do certificado da URL:', error);
                        // Continuar com o fluxo normal, tentando outros métodos
                    }
                }

                if (bypassMode) {
                    console.log('Usando modo bypass para certificado temporário');

                    // Criando um certificado temporário com dados do sessionStorage
                    setCertificado({
                        id_avaliacao: `temp_${Date.now()}`,
                        nota: sessionStorage.getItem('certificado_nota') || 10,
                        certificado: true
                    });

                    // Não temos dados completos da avaliação, pular para obter dados do curso
                } else if (avaliacaoId) {
                    // Código original para carregar avaliação...
                    try {
                        const avaliacaoResponse = await axios.get(`${API_BASE}/avaliacoes/${avaliacaoId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (!avaliacaoResponse.data) {
                            // Se não encontrar avaliação mas temos os IDs necessários, continuar em modo bypass
                            if (cursoId && utilizadorId) {
                                console.log('Avaliação não encontrada, usando dados alternativos');
                            } else {
                                setErro('Avaliação não encontrada');
                                setCarregando(false);
                                return;
                            }
                        } else {
                            setCertificado(avaliacaoResponse.data);
                        }
                    } catch (error) {
                        console.error('Erro ao carregar avaliação:', error);

                        // Se temos os IDs necessários, continuar mesmo sem avaliação
                        if (cursoId && utilizadorId) {
                            console.log('Erro ao carregar avaliação, continuando com dados alternativos');
                            setCertificado({
                                id_avaliacao: `temp_${Date.now()}`,
                                nota: sessionStorage.getItem('certificado_nota') || 10,
                                certificado: true
                            });
                        } else {
                            setErro('Erro ao carregar dados da avaliação. Por favor, tente novamente.');
                            setCarregando(false);
                            return;
                        }
                    }
                } else if (!cursoId || !utilizadorId) {
                    setErro('Não foi possível identificar o curso ou utilizador');
                    setCarregando(false);
                    return;
                } else {
                    // Caso em que temos cursoId e utilizadorId mas não avaliacaoId
                    setCertificado({
                        id_avaliacao: `temp_${Date.now()}`,
                        nota: sessionStorage.getItem('certificado_nota') || 10,
                        certificado: true
                    });
                }

                // Precisamos garantir que temos cursoId e utilizadorId para continuar
                if (!cursoId || !utilizadorId) {
                    setErro('Não foi possível identificar o curso ou utilizador');
                    setCarregando(false);
                    return;
                }

                // Resto do código permanece igual...
                // 3. Carregar dados do curso
                try {
                    const cursoResponse = await axios.get(`${API_BASE}/cursos/${cursoId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (cursoResponse.data) {
                        setCurso(cursoResponse.data);

                        // 5. Carregar dados do formador
                        try {
                            if (cursoResponse.data.id_formador) {
                                const formadorResponse = await axios.get(`${API_BASE}/formadores/${cursoResponse.data.id_formador}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });

                                if (formadorResponse.data) {
                                    setFormador(formadorResponse.data);
                                }
                            } else {
                                console.warn('ID do formador não disponível no curso');
                            }
                        } catch (error) {
                            console.warn('Erro ao carregar formador, continuando sem dados do formador:', error);
                        }
                    } else {
                        // Se não conseguirmos carregar o curso, usar dados do sessionStorage se disponíveis
                        setCurso({
                            nome: sessionStorage.getItem('certificado_curso_nome') || 'Nome do Curso',
                            categoria: sessionStorage.getItem('certificado_curso_categoria') || 'Categoria',
                            area: sessionStorage.getItem('certificado_curso_area') || 'Área',
                            formador: sessionStorage.getItem('certificado_formador') || 'Formador',
                            duracao: sessionStorage.getItem('certificado_curso_duracao') || 0
                        });
                        console.log("Dados do curso definidos via fallback:", {
                            nome: sessionStorage.getItem('certificado_curso_nome') || 'Nome do Curso',
                            categoria: sessionStorage.getItem('certificado_curso_categoria') || 'Categoria',
                            area: sessionStorage.getItem('certificado_curso_area') || 'Área',
                            formador: sessionStorage.getItem('certificado_formador') || 'Formador',
                            duracao: sessionStorage.getItem('certificado_curso_duracao') || 0
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar curso:', error);
                    // Usar dados mínimos do sessionStorage
                    setCurso({
                        nome: sessionStorage.getItem('certificado_curso_nome') || 'Nome do Curso',
                        categoria: sessionStorage.getItem('certificado_curso_categoria') || 'Categoria',
                        area: sessionStorage.getItem('certificado_curso_area') || 'Área',
                        duracao: sessionStorage.getItem('certificado_curso_duracao') || 0
                    });
                }

                // 4. Carregar dados do utilizador (aluno)
                try {
                    const utilizadorResponse = await axios.get(`${API_BASE}/users/${utilizadorId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (utilizadorResponse.data) {
                        console.log('Dados do utilizador:', utilizadorResponse.data);
                        setUtilizador(utilizadorResponse.data);
                    } else {
                        // Usar dados do sessionStorage se disponíveis
                        setUtilizador({
                            nome: sessionStorage.getItem('certificado_nome') || 'Nome do Aluno',
                            email: sessionStorage.getItem('certificado_email') || 'email@example.com'
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar utilizador:', error);
                    // Usar dados mínimos
                    setUtilizador({
                        nome: sessionStorage.getItem('certificado_nome') || 'Nome do Aluno',
                        email: sessionStorage.getItem('certificado_email') || 'email@example.com'
                    });
                }

                // 6. Carregar trabalhos e notas do aluno (opcional)
                try {
                    const trabalhosResponse = await axios.get(`${API_BASE}/trabalhos`, {
                        params: {
                            id_curso: cursoId,
                            id_utilizador: utilizadorId
                        },
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (trabalhosResponse.data && trabalhosResponse.data.length > 0) {
                        setTrabalhos(trabalhosResponse.data);
                    }
                } catch (error) {
                    console.warn('Erro ao carregar trabalhos, continuando sem dados de trabalhos:', error);
                }

                // Verificar se o certificado já existe
                verificarCertificadoExistente(utilizadorId, cursoId);

                setCarregando(false);
            } catch (error) {
                console.error('Erro ao carregar dados do certificado:', error);
                setErro('Erro ao carregar dados do certificado');
                setCarregando(false);
            }
        };

        carregarDados();
    }, [avaliacaoId, navigate, searchParams]);

    // Função para verificar se o certificado já existe
    const verificarCertificadoExistente = async (userId, cursoId) => {
        try {
            const token = localStorage.getItem('token');
            
            // Usar IDs fornecidos ou recuperar do state/sessionStorage
            const userIdToUse = userId || utilizador?.id_utilizador || sessionStorage.getItem('certificado_utilizadorId');
            const cursoIdToUse = cursoId || curso?.id || sessionStorage.getItem('certificado_cursoId');
            
            if (!userIdToUse || !cursoIdToUse) return;

            // Obter o email formatado para construir o caminho
            let email;
            if (utilizador?.email) {
                email = utilizador.email;
            } else {
                email = sessionStorage.getItem('certificado_email');
                if (!email) {
                    // Tentar buscar o email a partir do ID do utilizador
                    try {
                        const userResponse = await axios.get(`${API_BASE}/users/${userIdToUse}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (userResponse.data && userResponse.data.email) {
                            email = userResponse.data.email;
                        }
                    } catch (error) {
                        console.error('Erro ao buscar email do utilizador:', error);
                        return;
                    }
                }
            }
            
            if (!email) return;

            // Obter o nome do curso formatado
            let cursoNome;
            if (curso?.nome) {
                cursoNome = curso.nome.replace(/\s+/g, '_');
            } else {
                cursoNome = sessionStorage.getItem('certificado_curso_nome');
                if (cursoNome) {
                    cursoNome = cursoNome.replace(/\s+/g, '_');
                } else {
                    // Tentar buscar o nome do curso a partir do ID
                    try {
                        const cursoResponse = await axios.get(`${API_BASE}/cursos/${cursoIdToUse}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (cursoResponse.data && cursoResponse.data.nome) {
                            cursoNome = cursoResponse.data.nome.replace(/\s+/g, '_');
                        }
                    } catch (error) {
                        console.error('Erro ao buscar nome do curso:', error);
                        return;
                    }
                }
            }
            
            if (!cursoNome) {
                cursoNome = 'curso';
            }

            const emailFormatado = email.replace(/@/g, '_at_').replace(/\./g, '_');
            const path = `/uploads/users/${emailFormatado}/certificados/certificado_${cursoNome}.pdf`;

            try {
                // Tentar acessar o arquivo para ver se existe
                await axios.head(`${API_BASE}${path}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Se chegou aqui, o arquivo existe
                setCertificadoPath(path);
            } catch (error) {
                // Arquivo não existe, deixar certificadoPath como null
                setCertificadoPath(null);
            }
        } catch (error) {
            console.error('Erro ao verificar certificado existente:', error);
        }
    };

    // Função para imprimir o certificado
    const imprimirCertificado = () => {
        if (certificadoPath) {
            // Abrir o certificado em uma nova aba para impressão
            const printWindow = window.open(`${API_BASE}${certificadoPath}`, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    printWindow.print();
                });
            }
        } else {
            alert('Certificado não encontrado. Verifique se foi gerado corretamente.');
        }
    };

    if (carregando) {
        return (
            <div className="certificado-loading">
                <div className="loading-spinner"></div>
                <p>A carregar dados do certificado...</p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="certificado-erro">
                <p className="erro-mensagem">{erro}</p>
                <button onClick={() => navigate(-1)} className="btn-voltar">
                    Voltar
                </button>
            </div>
        );
    }

    // Determinar os valores corretos para exibição
    const cursoDuracao = curso?.duracao || sessionStorage.getItem('certificado_curso_duracao') || 0;
    const notaFinal = certificado?.nota || sessionStorage.getItem('certificado_nota') || 0;

    return (
        <div className="certificado-container">
            <div className="certificado-header">
                <h2>Certificado de Conclusão</h2>
                <button
                    className="btn-voltar"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-arrow-left"></i> Voltar
                </button>
            </div>

            <div className="certificado-preview">
                <div className="certificado-documento">
                    <div className="certificado-titulo">CERTIFICADO</div>
                    <div className="certificado-subtitulo">de Conclusão de Curso</div>

                    <div className="certificado-conteudo">
                        <p>
                            Certificamos que <strong>{utilizador?.nome}</strong> concluiu com aproveitamento o curso:
                        </p>

                        <h3 className="certificado-nome-curso">{curso?.nome}</h3>

                        <div className="certificado-detalhes">
                            <p><span>Categoria:</span> {
                                curso?.categoria ?
                                    (typeof curso.categoria === 'object' ?
                                        curso.categoria.nome || 'N/A' :
                                        curso.categoria) :
                                    'N/A'
                            }</p>
                            <p><span>Área:</span> {
                                curso?.area ?
                                    (typeof curso.area === 'object' ?
                                        curso.area.nome || 'N/A' :
                                        curso.area) :
                                    'N/A'
                            }</p>
                            <p><span>Formador:</span> {formador?.nome || 'N/A'}</p>
                            <p><span>Email:</span> {utilizador?.email || 'N/A'}</p>
                            <p><span>Duração:</span> {cursoDuracao} horas</p>
                            <p><span>Nota Final:</span> {notaFinal}/20</p>
                        </div>

                        <div className="certificado-data">
                            {new Date().toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>

                        <div className="certificado-assinaturas">
                            <div className="assinatura">
                                <div className="assinatura-linha"></div>
                                <p>Formador</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="certificado-actions">
                {certificadoPath ? (
                    <div className="certificado-sucesso">
                        <p>Certificado encontrado!</p>
                        <button
                            className="btn-visualizar"
                            onClick={() => window.open(`${API_BASE}${certificadoPath}`, '_blank')}
                        >
                            <i className="fas fa-eye"></i> Visualizar
                        </button>
                        <button
                            className="btn-download"
                            onClick={() => window.location.href = `${API_BASE}${certificadoPath}?download=true`}
                        >
                            <i className="fas fa-download"></i> Download
                        </button>
                        <button
                            className="btn-imprimir"
                            onClick={imprimirCertificado}
                        >
                            <i className="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                ) : (
                    <div className="certificado-nao-encontrado">
                        <p>O certificado ainda não foi gerado. Por favor, volte à página de avaliação de trabalhos para gerar o certificado.</p>
                        <button 
                            className="btn-voltar"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left"></i> Voltar
                        </button>
                    </div>
                )}
            </div>

            {trabalhos.length > 0 && (
                <div className="certificado-trabalhos">
                    <h3>Trabalhos Realizados</h3>

                    <table className="tabela-trabalhos">
                        <thead>
                            <tr>
                                <th>Trabalho</th>
                                <th>Data de Entrega</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trabalhos.map((trabalho, index) => (
                                <tr key={index}>
                                    <td>{trabalho.nome_ficheiro || trabalho.ficheiro_path.split('/').pop() || 'Sem nome'}</td>
                                    <td>
                                        {trabalho.data_entrega
                                            ? new Date(trabalho.data_entrega).toLocaleDateString('pt-PT')
                                            : 'N/A'}
                                    </td>
                                    <td>{trabalho.nota || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Certificado;