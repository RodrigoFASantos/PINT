import psycopg2
import os
from dotenv import load_dotenv
from faker import Faker
import re  # Para remover caracteres não numéricos

load_dotenv()  # Carregar variáveis do .env
fake = Faker()

def generate_phone():
    """Gera um número de telefone com exatamente 9 dígitos numéricos."""
    return re.sub(r'\D', '', fake.phone_number())[:9]  # Remove tudo que não for número e mantém só 9 dígitos

def Utilizadores(conn, quantidade=10):
    cur = conn.cursor()

    utilizadores = []
    for i in range(1, quantidade + 1):
        utilizadores.append((
            i,                     # id_utilizador
            fake.random_int(1, 3),  # id_cargo (associado aleatoriamente)
            fake.name(),            # Nome
            fake.random_int(18, 60),# Idade
            fake.email(),           # Email
            generate_phone(),       # Telefone (Apenas 9 números)
            fake.password(length=12)# Senha aleatória de 12 caracteres
        ))

    cur.executemany("""
        INSERT INTO Utilizadores (id_utilizador, id_cargo, Nome, Idade, Email, Telefone, password) 
        VALUES (%s, %s, %s, %s, %s, %s, %s) 
        ON CONFLICT (id_utilizador) DO NOTHING
    """, utilizadores)
    
    conn.commit()
    cur.close()
    print("Utilizadores inseridos com sucesso!")

if __name__ == "__main__":
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )
    Utilizadores(conn)
    conn.close()
