import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

                console.log("Parâmetros iniciais:", { bypassMode, cursoId, utilizadorId });
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
                    // Modo normal - carregar dados da avaliação
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

                setCarregando(false);
            } catch (error) {
                console.error('Erro ao carregar dados do certificado:', error);
                setErro('Erro ao carregar dados do certificado');
                setCarregando(false);
            }
        };

        carregarDados();
        
        console.log("=== DADOS FINAIS PARA RENDERIZAÇÃO DO CERTIFICADO ===");
        console.log({
            utilizador: utilizador,
            curso: curso,
            formador: formador,
            certificado: certificado,
            trabalhos: trabalhos.length
        });
    }, [avaliacaoId, navigate, searchParams]);

    // Função para gerar o PDF do certificado e salvar na pasta do usuário
    const gerarPDF = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = utilizador?.id_utilizador || sessionStorage.getItem('certificado_utilizadorId');
            const cursoId = curso?.id || sessionStorage.getItem('certificado_cursoId');
            
            if (!userId || !cursoId) {
                alert('Dados insuficientes para gerar o certificado');
                return false;
            }
            
            const response = await axios.post(`${API_BASE}/certificados/gerar-e-salvar`, {
                userId,
                cursoId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.success) {
                console.log('Certificado gerado com sucesso em:', response.data.path);
                alert('Certificado salvo com sucesso na sua pasta de utilizador!');
                return true;
            } else {
                throw new Error('Erro ao gerar certificado');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar certificado. Por favor, tente novamente.');
            return false;
        }
    };

    // Função para imprimir o certificado
    const imprimirCertificado = () => {
        if (gerarPDF()) {
            // A maioria dos navegadores abrirá automaticamente o diálogo de impressão 
            // quando o PDF for aberto. Se necessário, você pode implementar uma 
            // funcionalidade de impressão direta aqui.
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
                <button
                    className="btn-gerar-pdf"
                    onClick={gerarPDF}
                >
                    <i className="fas fa-file-pdf"></i> Gerar PDF
                </button>

                <button
                    className="btn-imprimir"
                    onClick={imprimirCertificado}
                >
                    <i className="fas fa-print"></i> Imprimir
                </button>
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