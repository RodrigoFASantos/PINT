from flask import Flask, request, jsonify
from database.connection import get_connection

app = Flask(__name__)

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_connection()
    cur = conn.cursor()

    # Atualizado para refletir a nova tabela "Utilizadores"
    query = "SELECT id_utilizador, nome, password FROM Utilizadores WHERE email = %s"
    cur.execute(query, (email,))
    user = cur.fetchone()

    cur.close()
    conn.close()

    if user:
        if password == user[2]:  # Verifica se a senha coincide (sem encriptação por agora)
            return jsonify({"id_utilizador": user[0], "nome": user[1], "message": "Login bem-sucedido!"}), 200
        else:
            return jsonify({"message": "Credenciais inválidas!"}), 401
    else:
        return jsonify({"message": "Utilizador não encontrado!"}), 404

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4000)
