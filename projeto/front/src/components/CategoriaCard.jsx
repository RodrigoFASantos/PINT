export default function CategoriaCard({ nome, imagem }) {
  return (
    <div
      className="card"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL || ''}${imagem})`,
      }}
    >
      <p className="tip">
        {nome}
      </p>
      <p className="second-text">Explora esta categoria</p>
    </div>
  );
}
