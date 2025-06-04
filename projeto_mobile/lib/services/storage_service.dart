import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  SharedPreferences? _prefs;

  // Inicializar SharedPreferences
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Garantir que SharedPreferences está inicializado
  Future<SharedPreferences> get prefs async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // Métodos para strings
  Future<void> setString(String key, String value) async {
    final preferences = await prefs;
    await preferences.setString(key, value);
  }

  Future<String?> getString(String key) async {
    final preferences = await prefs;
    return preferences.getString(key);
  }

  // Métodos para inteiros
  Future<void> setInt(String key, int value) async {
    final preferences = await prefs;
    await preferences.setInt(key, value);
  }

  Future<int?> getInt(String key) async {
    final preferences = await prefs;
    return preferences.getInt(key);
  }

  // Métodos para booleanos
  Future<void> setBool(String key, bool value) async {
    final preferences = await prefs;
    await preferences.setBool(key, value);
  }

  Future<bool?> getBool(String key) async {
    final preferences = await prefs;
    return preferences.getBool(key);
  }

  // Métodos para listas de strings
  Future<void> setStringList(String key, List<String> value) async {
    final preferences = await prefs;
    await preferences.setStringList(key, value);
  }

  Future<List<String>?> getStringList(String key) async {
    final preferences = await prefs;
    return preferences.getStringList(key);
  }

  // Métodos para objetos (JSON)
  Future<void> setObject(String key, Map<String, dynamic> value) async {
    final preferences = await prefs;
    await preferences.setString(key, json.encode(value));
  }

  Future<Map<String, dynamic>?> getObject(String key) async {
    final preferences = await prefs;
    final jsonString = preferences.getString(key);
    if (jsonString != null) {
      try {
        return json.decode(jsonString) as Map<String, dynamic>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Remover chave específica
  Future<void> remove(String key) async {
    final preferences = await prefs;
    await preferences.remove(key);
  }

  // Limpar todas as chaves
  Future<void> clear() async {
    final preferences = await prefs;
    await preferences.clear();
  }

  // Verificar se uma chave existe
  Future<bool> containsKey(String key) async {
    final preferences = await prefs;
    return preferences.containsKey(key);
  }

  // Obter todas as chaves
  Future<Set<String>> getAllKeys() async {
    final preferences = await prefs;
    return preferences.getKeys();
  }

  // Métodos específicos para autenticação
  Future<void> saveToken(String token) async {
    await setString('token', token);
  }

  Future<String?> getToken() async {
    return await getString('token');
  }

  Future<void> removeToken() async {
    await remove('token');
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await setObject('user', user);
  }

  Future<Map<String, dynamic>?> getUser() async {
    return await getObject('user');
  }

  Future<void> removeUser() async {
    await remove('user');
  }

  Future<void> saveEmail(String email) async {
    await setString('email', email);
  }

  Future<String?> getEmail() async {
    return await getString('email');
  }

  Future<void> removeEmail() async {
    await remove('email');
  }

  // Métodos para configurações
  Future<void> saveSettings(Map<String, dynamic> settings) async {
    await setObject('settings', settings);
  }

  Future<Map<String, dynamic>?> getSettings() async {
    return await getObject('settings');
  }

  // Métodos para cache
  Future<void> setCacheData(String key, Map<String, dynamic> data) async {
    final cacheData = {
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    await setObject('cache_$key', cacheData);
  }

  Future<Map<String, dynamic>?> getCacheData(String key,
      {int maxAgeMinutes = 60}) async {
    final cacheData = await getObject('cache_$key');
    if (cacheData != null) {
      final timestamp = cacheData['timestamp'] as int?;
      if (timestamp != null) {
        final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
        final now = DateTime.now();
        final age = now.difference(cacheTime).inMinutes;

        if (age <= maxAgeMinutes) {
          return cacheData['data'] as Map<String, dynamic>?;
        } else {
          // Cache expirou, remover
          await remove('cache_$key');
        }
      }
    }
    return null;
  }

  Future<void> clearCache() async {
    final preferences = await prefs;
    final keys = preferences.getKeys();
    for (final key in keys) {
      if (key.startsWith('cache_')) {
        await preferences.remove(key);
      }
    }
  }

  // Método para fazer logout completo
  Future<void> logout() async {
    await removeToken();
    await removeUser();
    await removeEmail();
    await clearCache();
  }
}
