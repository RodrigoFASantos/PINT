import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // URL base da API - substituir pelo seu endpoint real
  final String baseUrl = 'https://seuapi.com/api';
  
  // Método para fazer login
  Future<bool> login(String email, String password) async {
    try {
      // No ambiente real, você faria uma requisição HTTP para sua API
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Salvar o token no armazenamento local
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        
        return true;
      } else {
        // Tratar erros específicos de acordo com a sua API
        return false;
      }
    } catch (e) {
      print('Erro ao fazer login: $e');
      return false;
    }
  }
  
  // Método para verificar se o usuário está logado
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return token != null;
  }
  
  // Método para logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }
  
  // Método para recuperar o token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }
}