import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()  # Carregar variáveis do .env

def Cargos(conn):
    cur = conn.cursor()
    cargos = [
        (1, 'Administrador'),
        (2, 'Professor'),
        (3, 'Estudante')
    ]

    cur.executemany("INSERT INTO Cargos (ID_Cargo, descricao) VALUES (%s, %s) ON CONFLICT (ID_Cargo) DO NOTHING", cargos)
    
    conn.commit()
    cur.close()
    print("Cargos inseridos com sucesso!")

if __name__ == "__main__":
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )
    Cargos(conn)
    conn.close()
