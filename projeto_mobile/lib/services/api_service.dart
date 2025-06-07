import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late String _apiBase;
  String? _authToken;

  // Headers padrão para todas as requisições
  Map<String, String> get _defaultHeaders => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  /// Inicializa o serviço API com detecção automática da URL base
  Future<void> initialize({String? customApiUrl}) async {
    if (customApiUrl != null) {
      _apiBase = customApiUrl;
      debugPrint('🌐 [API] URL customizada definida: $_apiBase');
      return;
    }

    _apiBase = await _detectApiBase();
    debugPrint('🌐 [API] =================================');
    debugPrint('🌐 [API] URL Base FINAL detectada: $_apiBase');
    debugPrint('🌐 [API] =================================');
  }

  /// Detecção automática da URL da API baseada no ambiente
  Future<String> _detectApiBase() async {
    debugPrint('🔍 [API DEBUG] Iniciando detecção da URL base...');

    // 1. Verificar variável de ambiente (se definida no build)
    const envApiUrl = String.fromEnvironment('API_URL');
    if (envApiUrl.isNotEmpty) {
      debugPrint('✅ [API DEBUG] Usando variável de ambiente: $envApiUrl');
      return envApiUrl;
    }

    // 2. URLs de teste baseadas no ambiente
    final List<String> possibleUrls = [];

    if (kDebugMode) {
      // Em desenvolvimento, testar várias possibilidades
      debugPrint(
          '🔍 [API DEBUG] Modo debug detectado, testando URLs locais...');

      // Para emulador Android (10.0.2.2 mapeia para localhost do host)
      possibleUrls.add('http://10.0.2.2:4000/api');

      // Para emulador iOS e dispositivos físicos na mesma rede
      possibleUrls.add('http://localhost:4000/api');
      possibleUrls.add('http://127.0.0.1:4000/api');

      // Tentar detectar IP local da máquina (para dispositivos físicos)
      final localIp = await _getLocalIpAddress();
      if (localIp != null) {
        possibleUrls.add('http://$localIp:4000/api');
      }
    } else {
      // Em produção, usar o domínio/IP de produção
      debugPrint('🔍 [API DEBUG] Modo produção, usando URL de produção...');
      // Substitui pelo teu domínio/IP de produção
      possibleUrls.add('https://teu-dominio.com:4000/api');
      possibleUrls.add('http://teu-servidor-ip:4000/api');
    }

    // Testar cada URL para ver qual responde
    for (final url in possibleUrls) {
      debugPrint('🔍 [API DEBUG] Testando URL: $url');
      if (await _testConnection(url)) {
        debugPrint('✅ [API DEBUG] URL funcionando: $url');
        return url;
      }
    }

    // Fallback padrão
    final fallbackUrl = kDebugMode
        ? 'http://10.0.2.2:4000/api'
        : 'https://teu-dominio.com:4000/api';

    debugPrint(
        '⚠️ [API DEBUG] Nenhuma URL respondeu, usando fallback: $fallbackUrl');
    return fallbackUrl;
  }

  /// Tenta obter o IP local da máquina
  Future<String?> _getLocalIpAddress() async {
    try {
      for (var interface in await NetworkInterface.list()) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            if (addr.address.startsWith('192.168.') ||
                addr.address.startsWith('10.') ||
                addr.address.startsWith('172.')) {
              debugPrint('🔍 [API DEBUG] IP local detectado: ${addr.address}');
              return addr.address;
            }
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ [API DEBUG] Erro ao detectar IP local: $e');
    }
    return null;
  }

  /// Testa se uma URL está respondendo
  Future<bool> _testConnection(String url) async {
    try {
      final response = await http.get(
        Uri.parse(url.replaceAll('/api', '/api')), // Testa a rota raiz da API
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 3));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ [API DEBUG] Falha ao testar $url: $e');
      return false;
    }
  }

  /// Define o token de autenticação
  void setAuthToken(String? token) {
    _authToken = token;
    debugPrint('🔐 [API] Token ${token != null ? 'definido' : 'removido'}');
  }

  /// Remove o token de autenticação
  void clearAuthToken() {
    _authToken = null;
    debugPrint('🔐 [API] Token removido');
  }

  /// Getter para a URL base da API
  String get apiBase => _apiBase;

  // ===========================================
  // MÉTODOS HTTP GENÉRICOS
  // ===========================================

  /// Requisição GET
  Future<http.Response> get(String endpoint,
      {Map<String, String>? headers}) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [GET] $url');

    final response =
        await http.get(url, headers: {..._defaultHeaders, ...?headers});
    _logResponse('GET', endpoint, response);
    return response;
  }

  /// Requisição POST
  Future<http.Response> post(
    String endpoint, {
    Object? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [POST] $url');

    final response = await http.post(
      url,
      headers: {..._defaultHeaders, ...?headers},
      body: body != null ? jsonEncode(body) : null,
    );
    _logResponse('POST', endpoint, response);
    return response;
  }

  /// Requisição PUT
  Future<http.Response> put(
    String endpoint, {
    Object? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [PUT] $url');

    final response = await http.put(
      url,
      headers: {..._defaultHeaders, ...?headers},
      body: body != null ? jsonEncode(body) : null,
    );
    _logResponse('PUT', endpoint, response);
    return response;
  }

  /// Requisição PATCH
  Future<http.Response> patch(
    String endpoint, {
    Object? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [PATCH] $url');

    final response = await http.patch(
      url,
      headers: {..._defaultHeaders, ...?headers},
      body: body != null ? jsonEncode(body) : null,
    );
    _logResponse('PATCH', endpoint, response);
    return response;
  }

  /// Requisição DELETE
  Future<http.Response> delete(String endpoint,
      {Map<String, String>? headers}) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [DELETE] $url');

    final response =
        await http.delete(url, headers: {..._defaultHeaders, ...?headers});
    _logResponse('DELETE', endpoint, response);
    return response;
  }

  /// Log das respostas HTTP
  void _logResponse(String method, String endpoint, http.Response response) {
    final status = response.statusCode;
    final emoji = status >= 200 && status < 300 ? '✅' : '❌';
    debugPrint('$emoji [$method] $endpoint - Status: $status');

    if (kDebugMode && response.statusCode >= 400) {
      debugPrint('📄 Response body: ${response.body}');
    }
  }

  // ===========================================
  // MÉTODOS AUXILIARES PARA PARSING
  // ===========================================

  /// Parse response para Map
  Map<String, dynamic>? parseResponseToMap(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } catch (e) {
        debugPrint('❌ [API] Erro ao fazer parse da resposta: $e');
        return null;
      }
    }
    return null;
  }

  /// Parse response para List
  List<dynamic>? parseResponseToList(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return jsonDecode(response.body) as List<dynamic>;
      } catch (e) {
        debugPrint('❌ [API] Erro ao fazer parse da resposta: $e');
        return null;
      }
    }
    return null;
  }

  // ===========================================
  // CONFIGURAÇÕES DE IMAGENS (similar ao api.js)
  // ===========================================

  /// Formatar email para URL (mesmo método do api.js)
  String _formatEmailForUrl(String email) {
    if (email.isEmpty) return '';
    return email.replaceAll('@', '_at_').replaceAll('.', '_');
  }

  /// URLs para imagens padrão
  String get defaultAvatarUrl =>
      '${_apiBase.replaceAll('/api', '')}/uploads/AVATAR.png';
  String get defaultCapaUrl =>
      '${_apiBase.replaceAll('/api', '')}/uploads/CAPA.png';

  /// URL para avatar do utilizador
  String getUserAvatarUrl(String email) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final formattedEmail = _formatEmailForUrl(email);
    return '${_apiBase.replaceAll('/api', '')}/uploads/users/$formattedEmail/${email}_AVATAR.png?t=$timestamp';
  }

  /// URL para capa do utilizador
  String getUserCapaUrl(String email) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final formattedEmail = _formatEmailForUrl(email);
    return '${_apiBase.replaceAll('/api', '')}/uploads/users/$formattedEmail/${email}_CAPA.png?t=$timestamp';
  }

  /// URL para capa do curso
  String getCursoCapaUrl(String nomeCurso) {
    return '${_apiBase.replaceAll('/api', '')}/uploads/cursos/$nomeCurso/capa.png';
  }

  // ===========================================
  // MÉTODOS ESPECÍFICOS DA API (exemplos)
  // ===========================================

  /// Teste de conexão com a API
  Future<bool> testConnection() async {
    try {
      final response = await get('');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ [API] Erro no teste de conexão: $e');
      return false;
    }
  }

  /// Login do utilizador
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await post('/auth/login', body: {
        'email': email,
        'password': password,
      });

      final data = parseResponseToMap(response);
      if (data != null && data['token'] != null) {
        setAuthToken(data['token']);
      }
      return data;
    } catch (e) {
      debugPrint('❌ [API] Erro no login: $e');
      return null;
    }
  }

  /// Logout do utilizador
  Future<void> logout() async {
    clearAuthToken();
  }

  /// Obter dados do utilizador atual
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await get('/users/me');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter utilizador atual: $e');
      return null;
    }
  }

  /// Obter estatísticas do dashboard
  Future<Map<String, dynamic>?> getDashboardStats() async {
    try {
      final response = await get('/dashboard/estatisticas');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter estatísticas: $e');
      return null;
    }
  }

  /// Obter lista de cursos
  Future<List<dynamic>?> getCursos() async {
    try {
      final response = await get('/cursos');
      return parseResponseToList(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter cursos: $e');
      return null;
    }
  }

  /// Upload de ficheiro (exemplo básico)
  Future<http.Response> uploadFile(
      String endpoint, String filePath, String fieldName) async {
    final request =
        http.MultipartRequest('POST', Uri.parse('$_apiBase$endpoint'));

    // Adicionar headers de autenticação
    if (_authToken != null) {
      request.headers['Authorization'] = 'Bearer $_authToken';
    }

    // Adicionar ficheiro
    request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));

    debugPrint('📡 [UPLOAD] $_apiBase$endpoint');

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    _logResponse('UPLOAD', endpoint, response);
    return response;
  }
}

// ===========================================
// CLASSE AUXILIAR PARA EXCEÇÕES DA API
// ===========================================

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic response;

  ApiException(this.message, {this.statusCode, this.response});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

// ===========================================
// EXTENSÕES ÚTEIS
// ===========================================

extension ApiResponseExtension on http.Response {
  /// Verifica se a resposta foi bem-sucedida
  bool get isSuccess => statusCode >= 200 && statusCode < 300;

  /// Obtém os dados da resposta como Map
  Map<String, dynamic>? get dataAsMap {
    if (isSuccess) {
      try {
        return jsonDecode(body) as Map<String, dynamic>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /// Obtém os dados da resposta como List
  List<dynamic>? get dataAsList {
    if (isSuccess) {
      try {
        return jsonDecode(body) as List<dynamic>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
