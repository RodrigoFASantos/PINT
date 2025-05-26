import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import { toast } from 'react-toastify';
import './css/Criar_Quiz_Modal.css';

const CriarQuizModal = ({ isOpen, onClose, cursoId, onSuccess }) => {
    const [quizData, setQuizData] = useState({
        titulo: '',
        descricao: '',
        tempo_limite: '',
        ativo: true
    });

    const [perguntas, setPerguntas] = useState([
        {
            pergunta: '',
            tipo: 'multipla_escolha',
            pontos: 4, // CORREÇÃO: Padrão 4 pontos
            opcoes: [
                { texto: '', correta: false },
                { texto: '', correta: false },
                { texto: '', correta: false },
                { texto: '', correta: false }
            ]
        }
    ]);

    const [carregando, setCarregando] = useState(false);

    if (!isOpen) return null;

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
                    // Múltipla escolha: 4 opções por padrão se não tiver opções suficientes
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
                pontos: 4, // CORREÇÃO: Padrão 4 pontos
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

    const criarQuiz = async () => {
        if (!validarFormulario()) return;

        try {
            setCarregando(true);
            const token = localStorage.getItem('token');

            const dadosQuiz = {
                ...quizData,
                id_curso: cursoId,
                tempo_limite: quizData.tempo_limite ? parseInt(quizData.tempo_limite) : null,
                perguntas: perguntas.map((pergunta, index) => ({
                    ...pergunta,
                    ordem: index + 1,
                    opcoes: pergunta.opcoes.filter(op => {
                        return op.texto && op.texto.trim();
                    }).map((opcao, opcaoIndex) => ({
                        ...opcao,
                        ordem: opcaoIndex + 1
                    }))
                }))
            };

            console.log('Enviando dados do quiz:', dadosQuiz);

            const response = await axios.post(`${API_BASE}/quiz`, dadosQuiz, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Quiz criado com sucesso!');
                
                // Reset form
                setQuizData({
                    titulo: '',
                    descricao: '',
                    tempo_limite: '',
                    ativo: true
                });
                setPerguntas([{
                    pergunta: '',
                    tipo: 'multipla_escolha',
                    pontos: 4, // CORREÇÃO: Padrão 4 pontos
                    opcoes: [
                        { texto: '', correta: false },
                        { texto: '', correta: false },
                        { texto: '', correta: false },
                        { texto: '', correta: false }
                    ]
                }]);
                
                onSuccess && onSuccess(response.data.data);
                onClose();
            } else {
                toast.error(response.data.message || 'Erro ao criar quiz');
            }
        } catch (error) {
            console.error('Erro ao criar quiz:', error);
            
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => toast.error(err));
            } else {
                const errorMessage = error.response?.data?.message || 'Erro ao criar quiz';
                toast.error(errorMessage);
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-quiz">
                <div className="modal-header">
                    <h2>Criar Quiz</h2>
                    <button className="btn-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
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
                                    Se definir um tempo limite, o quiz expirará automaticamente após esse período.
                                    O tempo começa a contar quando o quiz é criado.
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
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={carregando}>
                        Cancelar
                    </button>
                    <button className="btn-create" onClick={criarQuiz} disabled={carregando}>
                        {carregando ? 'A criar...' : 'Criar Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CriarQuizModal;