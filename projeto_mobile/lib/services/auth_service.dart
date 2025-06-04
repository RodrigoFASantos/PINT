import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  bool _isAuthenticated = false;
  Map<String, dynamic>? _currentUser;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get currentUser => _currentUser;

  Future<bool> login(String email, String password) async {
    try {
      final response = await ApiService.login(email, password);

      if (response['token'] != null) {
        await _saveToken(response['token']);
        await _saveUser(response['user']);

        _isAuthenticated = true;
        _currentUser = response['user'];

        notifyListeners(); // ✅ ADICIONADO - Notificar listeners sobre mudança de estado
        return true;
      }
      return false;
    } catch (e) {
      throw Exception('Erro no login: $e');
    }
  }

  Future<void> logout() async {
    await ApiService.logout();

    _isAuthenticated = false;
    _currentUser = null;

    notifyListeners(); // ✅ ADICIONADO - Notificar listeners sobre mudança de estado
  }

  Future<bool> isLoggedIn() async {
    final token = await ApiService.getToken();
    final isLoggedIn = token != null && token.isNotEmpty;

    if (isLoggedIn != _isAuthenticated) {
      _isAuthenticated = isLoggedIn;
      if (isLoggedIn) {
        // Carregar dados do usuário se estiver logado
        try {
          _currentUser = await getCurrentUser();
        } catch (e) {
          // Se falhar ao carregar usuário, considerar não autenticado
          _isAuthenticated = false;
          _currentUser = null;
        }
      } else {
        _currentUser = null;
      }
      notifyListeners(); // ✅ ADICIONADO - Notificar listeners sobre mudança de estado
    }

    return _isAuthenticated;
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    if (_currentUser != null) return _currentUser;

    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString != null) {
        _currentUser = json.decode(userString);
        return _currentUser;
      }
    } catch (e) {
      // Se falhar ao recuperar do storage, tentar da API
      try {
        _currentUser = await ApiService().getUserProfile();
        await _saveUser(_currentUser!);
        return _currentUser;
      } catch (e) {
        // Se falhar completamente, retornar null
        return null;
      }
    }
    return null;
  }

  Future<void> _saveToken(String token) async {
    await ApiService.saveToken(token);
  }

  Future<void> _saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', json.encode(user));
    _currentUser = user;
  }

  Future<String?> getToken() async {
    return await ApiService.getToken();
  }

  // ✅ ADICIONADO - Método para atualizar dados do usuário
  Future<void> updateUserData(Map<String, dynamic> userData) async {
    _currentUser = userData;
    await _saveUser(userData);
    notifyListeners();
  }
}
