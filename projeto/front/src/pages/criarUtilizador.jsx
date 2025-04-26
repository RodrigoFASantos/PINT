import React, { useState } from "react";
import "./css/criarUtilizador.css";
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../components/formadorModal';
import imagePreview from '../images/user.png';

function CriarUser() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [modalAberto, setModalAberto] = useState(false);
  const [users, setUsers] = useState([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cargo: '',
    tipo: '',
    vagas: '',
    data_inicio: '',
    data_fim: '',
    id_formador: '',
    id_area: '',
    imagem: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'idade') {
      const idade = Math.min(99, Math.max(1, Number(value))); 
      setFormData({ ...formData, idade });
      return;
    }
  
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
    <div className="register-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <form className='form-register' onSubmit={handleSubmit} encType="multipart/form-data">
        <label className="custom-file-upload">
          <input
            type="file"
            name="imagem"
            accept="image/*"
            onChange={handleChange}
            required
          />
          <img className="image" src={imagePreview} alt="Pré-visualização" style={{
            animation: "float 2.5s infinite ease-in-out",
            transition: "transform 0.3s ease"
          }} />
        </label>

        <div className="inputs">
          <div className="row">
            <input type="text" name="nome" placeholder="Nome do Utilizador" value={formData.nome} onChange={handleChange} required />
            <select name="cargo" value={formData.cargo} onChange={handleChange} required>
              <option disabled value="">Cargo do Utilizador</option>
              <option value="formador">Formador</option>
              <option value="formando">Formando</option>
            </select>
            <input type="number" name="idade" placeholder="Idade" value={formData.idade} onChange={handleChange} required min="1" max="99" />
            <input type="number" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="row">
            <input type="text" name="morada" placeholder="Morada" value={formData.morada} onChange={handleChange} required />
            <input type="text" name="codigo_postal" placeholder="Codigo Postal" value={formData.codigo_postal} onChange={handleChange} required />
          </div>
          {formData.cargo === "formador" && (
            <div className="row">
              <button
                type="button"
                className="select-categoria-button"
                onClick={() => setModalAberto(true)}
              >
                Categoria {formData.id_categoria && `(ID: ${formData.id_categoria})`}
              </button>
              <button
                type="button"
                className="select-area-button"
                onClick={() => setModalAberto(true)}
              >
                Área {formData.id_area && `(ID: ${formData.id_area})`}
              </button>
              <button
                type="button"
                className="select-cursos-button"
                onClick={() => setModalAberto(true)}
              >
                Cursos {formData.id_curso && `(ID: ${formData.id_curso})`}
              </button>
            </div>
          )}

          <button type="submit">Criar Conta</button>
        </div>
      </form>
      <FormadorModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        setFormador={(id) => setFormData({ ...formData, id_formador: id })}
        users={users}
      />

      {message && <p>{message}</p>}
    </div>
  );
}

export default CriarUser;
