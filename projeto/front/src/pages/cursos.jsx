import { useEffect, useState } from "react";
import CategoriaCard from "../components/CategoriaCard";

export default function CursosPage() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch("http://localhost:4000/categorias");
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };
    fetchCategorias();
  }, []);

  return (
    <div className="p-6 min-h-screen flex flex-col bg-white">
      <div className="overflow-y-auto flex-1">
        <div className="cards grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
          {categorias.map((cat) => (
            <CategoriaCard
              key={cat.id_categoria}
              nome={cat.nome}
              imagem={cat.imagem}
              icone={cat.icone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
