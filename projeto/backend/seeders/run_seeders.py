import psycopg2
import os
from dotenv import load_dotenv
from Cargos import Cargos
from Utilizadores import Utilizadores

load_dotenv()

def criar_tabelas(conn):
    """ Garante que as tabelas Cargos e Utilizadores existem na base de dados """
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS Cargos (
        ID_Cargo SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL UNIQUE
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS Utilizadores (
        id_utilizador SERIAL PRIMARY KEY,
        id_cargo INT REFERENCES Cargos(ID_Cargo),
        Nome VARCHAR(255) NOT NULL,
        Idade INT CHECK (Idade >= 18),
        Email VARCHAR(255) UNIQUE NOT NULL,
        Telefone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL
    );
    """)
    
    conn.commit()
    cur.close()
    print("Tabelas verificadas e criadas (se necessário).")

def run_seeders():
    """ Roda os seeders para popular a base de dados """
    print("Iniciando seeders...")

    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )

    criar_tabelas(conn)  # Criar as tabelas se não existirem
    Cargos(conn)  # Roda o seeder de Cargos
    Utilizadores(conn)  # Roda o seeder de Utilizadores
    
    conn.close()
    print("Seeders concluídos!")

if __name__ == "__main__":
    run_seeders()
