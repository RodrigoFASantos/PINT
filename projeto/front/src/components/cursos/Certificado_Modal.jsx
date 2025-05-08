import React, { useRef } from 'react';
import './css/Certificado_Modal.css';

const CertificadoModal = ({ curso, onClose }) => {
  const certificadoRef = useRef();
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="certificado-overlay">
      <div className="certificado-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="certificado-actions">
          <button className="print-btn" onClick={handlePrint}>
            Imprimir Certificado
          </button>
        </div>
        
        <div className="certificado-container" ref={certificadoRef}>
          <div className="certificado">
            <div className="certificado-header">
              <h1>Certificado</h1>
              <div className="logo">Softinsa</div>
            </div>
            
            <div className="certificado-content">
              <p className="intro-text">
                Certificamos que
              </p>
              
              <p className="nome">
                {localStorage.getItem('nomeUsuario')}
              </p>
              
              <p className="conclusao-text">
                concluiu com êxito o curso de
              </p>
              
              <p className="curso-nome">
                {curso.titulo}
              </p>
              
              <p className="detalhes">
                com carga horária de {curso.horasCurso} horas,
                realizado no período de {new Date(curso.dataInicio).toLocaleDateString()} 
                a {new Date(curso.dataFim).toLocaleDateString()}.
              </p>
              
              {curso.notaFinal !== undefined && (
                <p className="nota">
                  Nota final: {curso.notaFinal}/20
                </p>
              )}
            </div>
            
            <div className="certificado-footer">
              <div className="data">
                Lisboa, {new Date().toLocaleDateString()}
              </div>
              
              <div className="assinaturas">
                <div className="assinatura">
                  <div className="linha"></div>
                  <p>Diretor de Formação</p>
                </div>
                
                <div className="assinatura">
                  <div className="linha"></div>
                  <p>{curso.formador?.nome || "Responsável pelo Curso"}</p>
                </div>
              </div>
              
              <div className="certificado-id">
                ID do Certificado: {curso.id}-{Math.floor(Math.random() * 10000)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoModal;