import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import { toast } from 'react-toastify';
import './css/Criar_Quiz_Modal.css'; // Reutilizar os mesmos estilos

const EditarQuizModal = ({ isOpen, onClose, quizId, onSuccess }) => {
    const [quizData, setQuizData] = useState({
        titulo: '',
        descricao: '',
        tempo_limite: '',
        ativo: true
    });

    const [perguntas, setPerguntas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [carregandoDados, setCarregandoDados] = useState(false);

    // Limpar dados quando o modal fechar
    useEffect(() => {
        if (!isOpen) {
            setQuizData({
                titulo: '',
                descricao: '',
                tempo_limite: '',
                ativo: true
            });
            setPerguntas([]);
        }
    }, [isOpen]);

    // Carregar dados do quiz quando o modal abrir
    useEffect(() => {
        if (isOpen && quizId) {
            carregarDadosQuiz();
        }
    }, [isOpen, quizId]);

    const carregarDadosQuiz = async () => {
        try {
            setCarregandoDados(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const quiz = response.data.success ? response.data.data : response.data;
            console.log('Quiz carregado para edição:', quiz);

            setQuizData({
                titulo: quiz.titulo || '',
                descricao: quiz.descricao || '',
                tempo_limite: quiz.tempo_limite || '',
                ativo: quiz.ativo !== undefined ? quiz.ativo : true
            });

            // Converter dados das perguntas para o formato esperado
            const perguntasFormatadas = quiz.perguntas?.map((pergunta, index) => {
                const perguntaFormatada = {
                    id_pergunta: pergunta.id || pergunta.id_pergunta,
                    pergunta: pergunta.texto || pergunta.pergunta,
                    tipo: pergunta.tipo || 'multipla_escolha',
                    pontos: pergunta.pontos || 4, // Padrão 4 pontos
                    ordem: pergunta.ordem || index + 1,
                    opcoes: []
                };

                // Processar opções
                if (pergunta.opcoes && pergunta.opcoes.length > 0) {
                    perguntaFormatada.opcoes = pergunta.opcoes.map((opcao, opcaoIndex) => ({
                        id_opcao: opcao.id_opcao,
                        texto: opcao.texto || '',
                        correta: opcao.correta || false,
                        ordem: opcao.ordem || opcaoIndex + 1
                    }));
                } else {
                    // Criar opções padrão baseado no tipo
                    if (pergunta.tipo === 'verdadeiro_falso') {
                        perguntaFormatada.opcoes = [
                            { texto: '', correta: false, ordem: 1 },
                            { texto: '', correta: false, ordem: 2 }
                        ];
                    } else {
                        perguntaFormatada.opcoes = [
                            { texto: '', correta: false, ordem: 1 },
                            { texto: '', correta: false, ordem: 2 },
                            { texto: '', correta: false, ordem: 3 },
                            { texto: '', correta: false, ordem: 4 }
                        ];
                    }
                }

                return perguntaFormatada;
            }) || [];

            setPerguntas(perguntasFormatadas);
        } catch (error) {
            console.error('Erro ao carregar dados do quiz:', error);
            toast.error('Erro ao carregar dados do quiz');
            onClose();
        } finally {
            setCarregandoDados(false);
        }
    };

    const handleQuizDataChange = (e) => {
        const { name, value, type, checked } = e.target;
        setQuizData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePerguntaChange = (perguntaIndex, field, value) => {
        setPerguntas(prev => {
            const novasPerguntas = [...prev];
            const perguntaAtual = { ...novasPerguntas[perguntaIndex] };
            
            if (field === 'tipo') {
                perguntaAtual.tipo = value;
                
                // Ajustar opções baseado no tipo
                if (value === 'verdadeiro_falso') {
                    // Verdadeiro/falso: mínimo 2 opções
                    if (perguntaAtual.opcoes.length < 2) {
                        perguntaAtual.opcoes = [
                            { texto: '', correta: false, ordem: 1 },
                            { texto: '', correta: false, ordem: 2 }
                        ];
                    }
                } else if (value === 'multipla_escolha') {
                    // Se mudando para múltipla escolha e não tem opções suficientes
                    if (perguntaAtual.opcoes.length < 4) {
                        perguntaAtual.opcoes = [
                            { texto: '', correta: false, ordem: 1 },
                            { texto: '', correta: false, ordem: 2 },
                            { texto: '', correta: false, ordem: 3 },
                            { texto: '', correta: false, ordem: 4 }
                        ];
                    }
                }
            } else {
                perguntaAtual[field] = value;
            }
            
            novasPerguntas[perguntaIndex] = perguntaAtual;
            return novasPerguntas;
        });
    };

    const handleOpcaoChange = (perguntaIndex, opcaoIndex, field, value) => {
        setPerguntas(prev => {
            const novasPerguntas = [...prev];
            const novasOpcoes = [...novasPerguntas[perguntaIndex].opcoes];

            if (field === 'correta') {
                // Ambos os tipos agora permitem múltiplas respostas corretas (checkboxes)
                novasOpcoes[opcaoIndex].correta = value;
            } else {
                novasOpcoes[opcaoIndex] = {
                    ...novasOpcoes[opcaoIndex],
                    [field]: value
                };
            }

            novasPerguntas[perguntaIndex].opcoes = novasOpcoes;
            return novasPerguntas;
        });
    };

    const adicionarPergunta = () => {
        setPerguntas(prev => [
            ...prev,
            {
                pergunta: '',
                tipo: 'multipla_escolha',
                pontos: 4, // Padrão 4 pontos
                ordem: prev.length + 1,
                opcoes: [
                    { texto: '', correta: false },
                    { texto: '', correta: false },
                    { texto: '', correta: false },
                    { texto: '', correta: false }
                ]
            }
        ]);
    };

    const removerPergunta = (index) => {
        if (perguntas.length > 1) {
            setPerguntas(prev => prev.filter((_, i) => i !== index));
        }
    };

    const adicionarOpcao = (perguntaIndex) => {
        setPerguntas(prev => {
            const novasPerguntas = [...prev];
            novasPerguntas[perguntaIndex].opcoes.push({ 
                texto: '', 
                correta: false,
                ordem: novasPerguntas[perguntaIndex].opcoes.length + 1
            });
            return novasPerguntas;
        });
    };

    const removerOpcao = (perguntaIndex, opcaoIndex) => {
        setPerguntas(prev => {
            const novasPerguntas = [...prev];
            const pergunta = novasPerguntas[perguntaIndex];
            
            // Permitir remover opções (mínimo 2)
            if (pergunta.opcoes.length > 2) {
                pergunta.opcoes = pergunta.opcoes.filter((_, i) => i !== opcaoIndex);
                // Reajustar ordens
                pergunta.opcoes.forEach((opcao, index) => {
                    opcao.ordem = index + 1;
                });
            }
            return novasPerguntas;
        });
    };

    const validarFormulario = () => {
        if (!quizData.titulo.trim()) {
            toast.error('Título do quiz é obrigatório');
            return false;
        }

        for (let i = 0; i < perguntas.length; i++) {
            const pergunta = perguntas[i];

            if (!pergunta.pergunta.trim()) {
                toast.error(`Pergunta ${i + 1} é obrigatória`);
                return false;
            }

            const opcoes = pergunta.opcoes.filter(op => op.texto && op.texto.trim());
            const opcoesCorretas = pergunta.opcoes.filter(op => op.correta);

            if (opcoes.length < 2) {
                toast.error(`Pergunta ${i + 1} deve ter pelo menos 2 opções preenchidas`);
                return false;
            }
            
            if (opcoesCorretas.length === 0) {
                toast.error(`Pergunta ${i + 1} deve ter pelo menos uma resposta marcada como correta`);
                return false;
            }
        }

        return true;
    };

    const atualizarQuiz = async () => {
        if (!validarFormulario()) return;

        try {
            setCarregando(true);
            const token = localStorage.getItem('token');

            // Preparar dados para envio
            const dadosCompletos = {
                ...quizData,
                titulo: quizData.titulo.trim(),
                descricao: quizData.descricao.trim(),
                tempo_limite: quizData.tempo_limite ? parseInt(quizData.tempo_limite) : null,
                perguntas: perguntas.map((pergunta, index) => ({
                    id_pergunta: pergunta.id_pergunta || null,
                    pergunta: pergunta.pergunta.trim(),
                    tipo: pergunta.tipo,
                    pontos: pergunta.pontos || 4, // Garantir 4 pontos padrão
                    ordem: index + 1,
                    opcoes: pergunta.opcoes.filter(op => {
                        return op.texto && op.texto.trim();
                    }).map((opcao, opcaoIndex) => ({
                        id_opcao: opcao.id_opcao || null,
                        texto: opcao.texto.trim(),
                        correta: opcao.correta,
                        ordem: opcaoIndex + 1
                    }))
                }))
            };

            console.log('Enviando dados para atualização:', dadosCompletos);

            const response = await axios.put(`${API_BASE}/quiz/${quizId}/completo`, dadosCompletos, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Quiz atualizado com sucesso!');
                onSuccess && onSuccess(response.data.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Erro ao atualizar quiz');
            }
        } catch (error) {
            console.error('Erro ao atualizar quiz:', error);
            
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => toast.error(err));
            } else {
                const errorMessage = error.response?.data?.message || 'Erro ao atualizar quiz';
                toast.error(errorMessage);
            }
        } finally {
            setCarregando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-quiz">
                <div className="modal-header">
                    <h2>Editar Quiz Completo</h2>
                    <button className="btn-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {carregandoDados ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>A carregar dados do quiz...</p>
                        </div>
                    ) : (
                        <>
                            {/* Dados do Quiz */}
                            <div className="quiz-config">
                                <h3>Configuração do Quiz</h3>

                                <div className="form-group">
                                    <label>Título *</label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={quizData.titulo}
                                        onChange={handleQuizDataChange}
                                        placeholder="Título do quiz"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea
                                        name="descricao"
                                        value={quizData.descricao}
                                        onChange={handleQuizDataChange}
                                        placeholder="Descrição do quiz"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tempo Limite (minutos)</label>
                                        <input
                                            type="number"
                                            name="tempo_limite"
                                            value={quizData.tempo_limite}
                                            onChange={handleQuizDataChange}
                                            placeholder="0 = sem limite"
                                            min="0"
                                        />
                                        <small className="form-text">
                                            ⚠️ Alterar o tempo limite reiniciará o contador a partir de agora.
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="ativo"
                                                checked={quizData.ativo}
                                                onChange={handleQuizDataChange}
                                            />
                                            Quiz ativo
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Perguntas */}
                            <div className="perguntas-section">
                                <div className="section-header">
                                    <h3>Perguntas</h3>
                                    <button className="btn-add-pergunta" onClick={adicionarPergunta}>
                                        <i className="fas fa-plus"></i> Adicionar Pergunta
                                    </button>
                                </div>

                                {perguntas.map((pergunta, perguntaIndex) => (
                                    <div key={perguntaIndex} className="pergunta-item">
                                        <div className="pergunta-header">
                                            <h4>Pergunta {perguntaIndex + 1}</h4>
                                            {perguntas.length > 1 && (
                                                <button
                                                    className="btn-remove-pergunta"
                                                    onClick={() => removerPergunta(perguntaIndex)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Texto da Pergunta *</label>
                                            <textarea
                                                value={pergunta.pergunta}
                                                onChange={(e) => handlePerguntaChange(perguntaIndex, 'pergunta', e.target.value)}
                                                placeholder="Digite a pergunta"
                                                rows="2"
                                                required
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Tipo</label>
                                                <select
                                                    value={pergunta.tipo}
                                                    onChange={(e) => handlePerguntaChange(perguntaIndex, 'tipo', e.target.value)}
                                                >
                                                    <option value="multipla_escolha">Múltipla Escolha</option>
                                                    <option value="verdadeiro_falso">Verdadeiro/Falso</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Pontos</label>
                                                <input
                                                    type="number"
                                                    value={pergunta.pontos}
                                                    onChange={(e) => handlePerguntaChange(perguntaIndex, 'pontos', parseInt(e.target.value) || 4)}
                                                    min="1"
                                                />
                                                <small className="form-text">
                                                    Padrão: 4 pontos. Pontuação será proporcional às respostas corretas.
                                                </small>
                                            </div>
                                        </div>

                                        <div className="opcoes-section">
                                            <div className="opcoes-header">
                                                <label>Opções</label>
                                                <button
                                                    className="btn-add-opcao"
                                                    onClick={() => adicionarOpcao(perguntaIndex)}
                                                >
                                                    <i className="fas fa-plus"></i> Adicionar Opção
                                                </button>
                                            </div>

                                            {pergunta.opcoes.map((opcao, opcaoIndex) => (
                                                <div key={opcaoIndex} className="opcao-item">
                                                    <input
                                                        type="text"
                                                        value={opcao.texto}
                                                        onChange={(e) => handleOpcaoChange(perguntaIndex, opcaoIndex, 'texto', e.target.value)}
                                                        placeholder={`Opção ${opcaoIndex + 1}`}
                                                    />

                                                    <label className="checkbox-correta">
                                                        <input
                                                            type="checkbox"
                                                            checked={opcao.correta}
                                                            onChange={(e) => handleOpcaoChange(perguntaIndex, opcaoIndex, 'correta', e.target.checked)}
                                                        />
                                                        {pergunta.tipo === 'verdadeiro_falso' ? 'Verdadeira' : 'Correta'}
                                                    </label>

                                                    {pergunta.opcoes.length > 2 && (
                                                        <button
                                                            className="btn-remove-opcao"
                                                            onClick={() => removerOpcao(perguntaIndex, opcaoIndex)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            <small className="opcoes-info">
                                                Marque todas as opções que são corretas. Podem existir múltiplas respostas corretas.
                                                A pontuação será proporcional ao número de respostas corretas selecionadas.
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={carregando || carregandoDados}>
                        Cancelar
                    </button>
                    <button
                        className="btn-create"
                        onClick={atualizarQuiz}
                        disabled={carregando || carregandoDados}
                    >
                        {carregando ? 'A atualizar...' : 'Atualizar Quiz Completo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditarQuizModal;