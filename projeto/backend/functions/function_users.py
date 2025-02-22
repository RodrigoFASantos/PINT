from database.connection import get_connection

def create_user(id_cargo, nome, idade, email, telefone, password):
    conn = get_connection()
    cur = conn.cursor()

    query = """
        INSERT INTO Utilizadores (id_cargo, nome, idade, email, telefone, password) 
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id_utilizador;
    """
    cur.execute(query, (id_cargo, nome, idade, email, telefone, password))
    user_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Utilizador criado com sucesso!", "id_utilizador": user_id}


def update_user(id_utilizador, nome=None, idade=None, email=None, telefone=None, password=None):
    conn = get_connection()
    cur = conn.cursor()

    query = "UPDATE Utilizador SET "
    values = []
    fields = []

    if nome:
        fields.append("nome = %s")
        values.append(nome)
    if idade:
        fields.append("idade = %s")
        values.append(idade)
    if email:
        fields.append("email = %s")
        values.append(email)
    if telefone:
        fields.append("telefone = %s")
        values.append(telefone)
    if password:
        fields.append("password = %s")
        values.append(password)

    if not fields:
        return {"message": "Nenhum campo para atualizar!"}

    query += ", ".join(fields) + " WHERE id_utilizador = %s"
    values.append(id_utilizador)

    cur.execute(query, values)
    conn.commit()

    cur.close()
    conn.close()

    return {"message": "Utilizador atualizado com sucesso!"}


def delete_user(id_utilizador):
    conn = get_connection()
    cur = conn.cursor()

    query = "DELETE FROM Utilizadores WHERE id_utilizador = %s"
    cur.execute(query, (id_utilizador,))

    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Utilizador apagado com sucesso!"}
