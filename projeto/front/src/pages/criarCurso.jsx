import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './css/criarCurso.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../components/formadorModal';

const CriarCurso = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [modalAberto, setModalAberto] = useState(false);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    vagas: '',
    data_inicio: '',
    data_fim: '',
    id_formador: '',
    id_area: '',
    imagem: null,
  });

 
useEffect(() => {
  axios.get('http://localhost:4000/api/formadores')
    .then(res => {
      console.log("Formadores carregados:", res.data);
      setUsers(res.data);
    })
    .catch(err => {
      console.error("Erro ao carregar formadores:", err);
    });
}, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imagem') {
      setFormData({ ...formData, imagem: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    for (let key in formData) {
      data.append(key, formData[key]);
    }

    try {
      await axios.post('http://localhost:4000/api/cursos', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Curso criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar curso!');
    }
  };

  return (
    <div className="form-container">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <form className='form' onSubmit={handleSubmit} encType="multipart/form-data">
        <label className="custom-file-upload">
          <input
            type="file"
            name="imagem"
            accept="image/*"
            onChange={handleChange}
            required
          />
          <div className="folder">
            <div className="top"></div>
            <div className="bottom"></div>
          </div>
        </label>

        <div className="inputs">
          <div className="row">
            <input type="text" name="nome" placeholder="Nome do Curso" value={formData.nome} onChange={handleChange} required />
            <select name="tipo" value={formData.tipo} onChange={handleChange} required>
              <option disabled value="">Tipo Curso</option>
              <option value="sincrono">Síncrono</option>
              <option value="assincrono">Assíncrono</option>
            </select>
            <input type="text" name="categoria" placeholder="Categoria" onChange={handleChange} />
            <input type="number" name="id_area" placeholder="Área" value={formData.id_area} onChange={handleChange} required />
          </div>

          <div className="row">

            <button
              type="button"
              className="select-formador-button"
              onClick={() => {
                console.log("Aberto");
                setModalAberto(true);
              }}
            >
              Formador {formData.id_formador && `(ID: ${formData.id_formador})`}
            </button>



            <input type="number" name="vagas" placeholder="Vagas" value={formData.vagas} onChange={handleChange} />
          </div>

          <div className="row">
            <input type="date" name="data_inicio" value={formData.data_inicio} onChange={handleChange} required />
            <input type="date" name="data_fim" value={formData.data_fim} onChange={handleChange} required />
          </div>

          <textarea name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange}></textarea>
          <button type="submit">Criar Curso</button>
        </div>
      </form>

      <FormadorModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        setFormador={(id) => setFormData({ ...formData, id_formador: id })}
        users={users}
      />

      <ToastContainer />
    </div>
  );
};

export default CriarCurso;
