import React, { useState } from "react";
import "../styles/criarUtilizador.css";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormadorModal from '../components/formadorModal';


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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nome || !email || !password) {
      setMessage("Todos os campos são obrigatórios!");
      return;
    }

    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    const userData = { nome, email, password };

    try {
      const response = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      // Verifica se a resposta do servidor é um JSON válido
      const text = await response.text();
      console.log("Resposta do servidor:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error("A resposta do servidor não é um JSON válido.");
      }

      if (response.ok) {
        setMessage("Utilizador criado com sucesso!");
      } else {
        setMessage(data.message || "Erro desconhecido.");
      }
    } catch (error) {
      console.error("Erro ao registar:", error);
      setMessage("Erro no servidor. Tenta novamente.");
    }
  };

  return (
    <div className="register-container">
      <Navbar toggleSidebar={toggleSidebar} />
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
          <div className="folder">
            <div className="top"></div>
            <div className="bottom"></div>
          </div>
        </label>

        <div className="inputs">
          <div className="row">
              <input type="text" name="nome" placeholder="Nome do Utilizador" value={formData.nome} onChange={handleChange} required />
              <select name="cargo" value={formData.cargo} onChange={handleChange} required>
                <option disabled value="">Cargo do Utilizador</option>
                <option value="formador">Formador</option>
                <option value="formando">Formando</option>
              </select>
              <input type="number" name="idade" placeholder="Idade" value={formData.idade} onChange={handleChange} required />
              <input type="number" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} required />
            </div>
          <div className="row">
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required/>
          </div>
          <div className="row">
              <input type="text" name="morada" placeholder="Morada" value={formData.morada} onChange={handleChange} required />
              <input type="text" name="codigo_postal" placeholder="Codigo Postal" value={formData.codigo_postal} onChange={handleChange} required />
          </div>
          <div className="row">
              <button
                type="button"
                className="select-categoria-button"
                onClick={() => {
                  console.log("Aberto");
                  setModalAberto(true);
                }}
              >
                Categoria {formData.id_categoria && `(ID: ${formData.id_categoria})`}
              </button>
              <button
                type="button"
                className="select-area-button"
                onClick={() => {
                  console.log("Aberto");
                  setModalAberto(true);
                }}
              >
                Área {formData.id_area && `(ID: ${formData.id_area})`}
              </button>
          </div>
            
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
