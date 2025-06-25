import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../api';
import fallbackCurso from '../images/default_image.png';
import '../pages/css/home.css';

const api = axios.create({
    baseURL: API_BASE,
});

function Cursos_Sugeridos() {
    const navigate = useNavigate(); // <===== AQUI
    const [cursosSugeridos, setCursosSugeridos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const buscarCursosSugeridos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado. Faça login novamente.');
            }

            const response = await api.get('/cursos/sugeridos', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCursosSugeridos(response.data);
        } catch (error) {
            console.error('Erro a buscar cursos sugeridos:', error);
            setError('Falha ao carregar os cursos sugeridos. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        buscarCursosSugeridos();
    }, [buscarCursosSugeridos]);

    const getImageUrl = (curso) => {
        if (curso.imagem_path) {
            return `${API_BASE}/${curso.imagem_path}`;
        }

        if (curso.nome) {
            const nomeCursoSlug = curso.nome
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "");
            return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
        }

        return fallbackCurso;
    };

    const redirecionarParaDetalheCurso = (cursoId) => {
        navigate(`/cursos/${cursoId}`);
    };

    if (loading) {
        return (
            <div className="cursos-loading">
                <div className="loading-spinner"></div>
                <p>A carregar cursos sugeridos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cursos-error">
                <p className="error-message">{error}</p>
                <button onClick={buscarCursosSugeridos} className="btn-retry">
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (cursosSugeridos.length === 0) {
        return (
            <div className="no-cursos">
                <p>Sem cursos sugeridos de momento.</p>
            </div>
        );
    }

    return (
        <>
            {cursosSugeridos.map((curso) => (
                <div
                    key={curso.id_curso}
                    className="cartao-curso"
                    onClick={() => redirecionarParaDetalheCurso(curso.id_curso)}
                >
                    <div className="curso-imagem-container">
                        <img
                            src={getImageUrl(curso)}
                            alt={curso.nome}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackCurso;
                            }}
                        />
                    </div>
                    <div className="curso-info">
                        <p className="curso-titulo">{curso.nome}</p>
                        <p className="curso-detalhe">Tipo: {curso.tipo}</p>
                        <p className="curso-detalhe">Vagas: {curso.vagas ?? "N/A"}</p>
                        <div className={`status-badge status-${curso.status ? curso.status.toLowerCase().replace(/\s+/g, '-') : 'agendado'}`}>
                            {curso.status || 'Agendado'}
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export default Cursos_Sugeridos;
