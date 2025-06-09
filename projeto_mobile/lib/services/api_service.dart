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

  // URLs possíveis do teu servidor
  static const String _localIp = '192.168.8.29:4000'; // IP na rede local
  static const String _publicIp = '188.82.118.49:4000'; // IP público
  static const String _localhost = 'localhost:4000'; // Para emulador

  // Headers padrão para todas as requisições
  Map<String, String> get _defaultHeaders => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  /// Getter público para o token (necessário para usar nas requisições customizadas)
  String? get authToken => _authToken;

  /// Inicializa o serviço API com detecção automática da URL base
  Future<void> initialize({String? customApiUrl}) async {
    if (customApiUrl != null) {
      _apiBase = customApiUrl;
      debugPrint('🌐 [API] URL customizada definida: $_apiBase');
      return;
    }

    _apiBase = await _detectBestApiBase();
    debugPrint('🌐 [API] =================================');
    debugPrint('🌐 [API] URL Base FINAL detectada: $_apiBase');
    debugPrint('🌐 [API] =================================');
  }

  /// Detecção inteligente da melhor URL da API
  Future<String> _detectBestApiBase() async {
    debugPrint('🔍 [API] Iniciando detecção inteligente da URL...');

    // 1. Verificar variável de ambiente primeiro
    const envApiUrl = String.fromEnvironment('API_URL');
    if (envApiUrl.isNotEmpty) {
      debugPrint('✅ [API] Usando variável de ambiente: $envApiUrl');
      return envApiUrl;
    }

    // 2. URLs de teste baseadas no ambiente e conectividade
    final List<String> possibleUrls = await _buildPossibleUrls();

    // 3. Testar cada URL para ver qual responde mais rápido
    final workingUrl = await _findWorkingUrl(possibleUrls);

    if (workingUrl != null) {
      return workingUrl;
    }

    // 4. Fallback baseado no ambiente
    final fallbackUrl = _getFallbackUrl();
    debugPrint('⚠️ [API] Nenhuma URL respondeu, usando fallback: $fallbackUrl');
    return fallbackUrl;
  }

  /// Constrói lista de URLs possíveis baseada no ambiente
  Future<List<String>> _buildPossibleUrls() async {
    final List<String> urls = [];

    if (kDebugMode) {
      debugPrint('🔍 [API] Modo debug - testando URLs de desenvolvimento...');

      // Para emulador Android
      urls.add('http://10.0.2.2:4000/api');

      // Para emulador iOS
      urls.add('http://127.0.0.1:4000/api');
      urls.add('http://$_localhost/api');

      // IP local (mesma rede Wi-Fi)
      urls.add('http://$_localIp/api');

      // IP público (rede externa)
      urls.add('http://$_publicIp/api');

      // Tentar detectar IP local dinâmico
      final detectedIp = await _getLocalNetworkIp();
      if (detectedIp != null) {
        urls.add('http://$detectedIp:4000/api');
      }
    } else {
      debugPrint('🔍 [API] Modo produção - usando URLs de produção...');
      // Em produção, priorizar IP público e HTTPS
      urls.add('https://$_publicIp/api');
      urls.add('http://$_publicIp/api');
      // Aqui poderias adicionar o teu domínio se tiveres um
      // urls.add('https://meudominio.com/api');
    }

    debugPrint('🔍 [API] URLs a testar: ${urls.length}');
    return urls;
  }

  /// Encontra a primeira URL que responde
  Future<String?> _findWorkingUrl(List<String> urls) async {
    debugPrint('🔍 [API] Testando conectividade...');

    // Testar URLs em paralelo para ser mais rápido
    final futures = urls.map((url) => _testUrlWithTimeout(url));
    final results = await Future.wait(futures);

    // Encontrar a primeira que funcionou
    for (int i = 0; i < urls.length; i++) {
      if (results[i]) {
        debugPrint('✅ [API] URL funcionando encontrada: ${urls[i]}');
        return urls[i];
      }
    }

    return null;
  }

  /// Testa uma URL com timeout e retry
  Future<bool> _testUrlWithTimeout(String url) async {
    try {
      debugPrint('🔍 [API] Testando: $url');

      final response = await http.get(
        Uri.parse(url.replaceAll('/api', '/api')), // Testar endpoint da API
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 2)); // Timeout curto para ser rápido

      final isWorking = response.statusCode == 200;
      debugPrint(
          '${isWorking ? '✅' : '❌'} [API] $url - Status: ${response.statusCode}');
      return isWorking;
    } catch (e) {
      debugPrint(
          '❌ [API] Falha ao testar $url: ${e.toString().split('\n').first}');
      return false;
    }
  }

  /// Tenta detectar o IP da rede local atual
  Future<String?> _getLocalNetworkIp() async {
    try {
      final interfaces = await NetworkInterface.list();
      for (var interface in interfaces) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 &&
              !addr.isLoopback &&
              _isPrivateIp(addr.address)) {
            debugPrint('🔍 [API] IP local detectado: ${addr.address}');
            return addr.address;
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ [API] Erro ao detectar IP local: $e');
    }
    return null;
  }

  /// Verifica se um IP é privado (rede local)
  bool _isPrivateIp(String ip) {
    return ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.');
  }

  /// URL de fallback baseada no ambiente
  String _getFallbackUrl() {
    if (kDebugMode) {
      return 'http://$_localIp/api'; // Tentar IP local primeiro
    } else {
      return 'http://$_publicIp/api'; // Em produção usar IP público
    }
  }

  /// Força reconexão (útil quando mudas de rede)
  Future<void> reconnect() async {
    debugPrint('🔄 [API] Forçando reconexão...');
    _apiBase = await _detectBestApiBase();
  }

  /// Verifica se a conexão atual ainda funciona
  Future<bool> isConnectionAlive() async {
    try {
      final response = await http
          .get(
            Uri.parse('$_apiBase'),
            headers: _defaultHeaders,
          )
          .timeout(const Duration(seconds: 3));

      return response.statusCode == 200;
    } catch (e) {
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
  // MÉTODOS HTTP COM RETRY AUTOMÁTICO
  // ===========================================

  /// Requisição GET com retry em caso de falha de rede
  Future<http.Response> get(String endpoint,
      {Map<String, String>? headers, bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('📡 [GET] $url');

      final response =
          await http.get(url, headers: {..._defaultHeaders, ...?headers});
      _logResponse('GET', endpoint, response);
      return response;
    }, autoRetry);
  }

  /// Requisição POST com retry
  Future<http.Response> post(String endpoint,
      {Object? body,
      Map<String, String>? headers,
      bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('📡 [POST] $url');

      final response = await http.post(
        url,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null,
      );
      _logResponse('POST', endpoint, response);
      return response;
    }, autoRetry);
  }

  /// Executa uma requisição com retry automático em caso de falha de rede
  Future<http.Response> _executeWithRetry(
      Future<http.Response> Function() request, bool autoRetry) async {
    try {
      return await request();
    } catch (e) {
      if (autoRetry && _isNetworkError(e)) {
        debugPrint('🔄 [API] Erro de rede detectado, tentando reconectar...');
        await reconnect();
        return await request(); // Retry uma vez
      }
      rethrow;
    }
  }

  /// Verifica se é um erro de rede
  bool _isNetworkError(dynamic error) {
    return error is SocketException ||
        error is HttpException ||
        error.toString().contains('Connection refused') ||
        error.toString().contains('Network unreachable');
  }

  /// PUT, PATCH, DELETE methods...
  Future<http.Response> put(String endpoint,
      {Object? body, Map<String, String>? headers}) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [PUT] $url');
    final response = await http.put(url,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null);
    _logResponse('PUT', endpoint, response);
    return response;
  }

  Future<http.Response> patch(String endpoint,
      {Object? body, Map<String, String>? headers}) async {
    final url = Uri.parse('$_apiBase$endpoint');
    debugPrint('📡 [PATCH] $url');
    final response = await http.patch(url,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null);
    _logResponse('PATCH', endpoint, response);
    return response;
  }

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
  // MÉTODOS AUXILIARES
  // ===========================================

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
  // MÉTODOS PARA IMAGENS - CORRIGIDOS
  // ===========================================

  String _formatEmailForUrl(String email) {
    if (email.isEmpty) return '';
    return email.replaceAll('@', '_at_').replaceAll('.', '_');
  }

  // MUDANÇA: Usar mesmo padrão da web - através da API
  String get defaultAvatarUrl => '$_apiBase/uploads/AVATAR.png';
  String get defaultCapaUrl => '$_apiBase/uploads/CAPA.png';

  String getUserAvatarUrl(String email) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final formattedEmail = _formatEmailForUrl(email);
    return '$_apiBase/uploads/users/$formattedEmail/${email}_AVATAR.png?t=$timestamp';
  }

  String getUserCapaUrl(String email) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final formattedEmail = _formatEmailForUrl(email);
    return '$_apiBase/uploads/users/$formattedEmail/${email}_CAPA.png?t=$timestamp';
  }

  String getCursoCapaUrl(String nomeCurso) {
    return '$_apiBase/uploads/cursos/$nomeCurso/capa.png';
  }

  // Método genérico para imagem de curso com path
  String getCursoImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return '$_apiBase/uploads/default_course.png';
    }
    // Se o path já começa com 'uploads/', usar diretamente
    if (imagePath.startsWith('uploads/')) {
      return '$_apiBase/$imagePath';
    }
    // Caso contrário, assumir que é um path relativo
    return '$_apiBase/uploads/$imagePath';
  }

  // ===========================================
  // MÉTODOS ESPECÍFICOS DA API
  // ===========================================

  /// Teste de conectividade com a API
  Future<bool> testConnection() async {
    try {
      final response = await get('/');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ [API] Erro no teste de conexão: $e');
      return false;
    }
  }

  /// Método de login
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      debugPrint('🔐 [LOGIN] Iniciando login para: $email');
      final response = await post('/auth/login',
          body: {'email': email, 'password': password});

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true && data['token'] != null) {
          setAuthToken(data['token']);
          return data;
        }
      }
      return {'success': false, 'message': 'Erro no login'};
    } catch (e) {
      debugPrint('❌ [API] Erro no login: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  /// Logout
  Future<void> logout() async {
    clearAuthToken();
  }

  /// Obter utilizador atual
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await get('/users/perfil');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter utilizador atual: $e');
      return null;
    }
  }

  /// Obter lista de cursos
  Future<List<dynamic>?> getCursos() async {
    try {
      debugPrint('📚 [API] A obter lista de cursos...');
      final response = await get('/cursos');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response); // Usar parseResponseToMap
        if (data != null && data['cursos'] != null) {
          debugPrint('✅ [API] ${data['cursos'].length ?? 0} cursos obtidos');
          return data['cursos'] as List<dynamic>; // Extrair a lista de cursos
        }
        debugPrint('❌ [API] Resposta não contém campo "cursos"');
        return [];
      } else {
        debugPrint('❌ [API] Erro ao obter cursos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao obter cursos: $e');
      return null;
    }
  }

  /// Obter inscrições do utilizador atual (formato completo)
  Future<List<dynamic>?> getMinhasInscricoes() async {
    try {
      debugPrint('📚 [API] A obter minhas inscrições...');
      final response =
          await get('/inscricoes/minhas-inscricoes'); // URL CORRETA

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data =
            parseResponseToList(response); // Backend retorna lista direta
        debugPrint('✅ [API] ${data?.length ?? 0} inscrições obtidas');
        return data;
      } else {
        debugPrint(
            '❌ [API] Erro ao obter minhas inscrições: ${response.statusCode}');
        debugPrint('📄 Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao obter minhas inscrições: $e');
      return null;
    }
  }

  /// Obter cursos em que o utilizador está inscrito
  Future<List<dynamic>?> getMeusCursos() async {
    try {
      debugPrint('📚 [API] A obter meus cursos...');
      final response = await get('/inscricoes/minhas');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('✅ [API] ${data?.length ?? 0} inscrições obtidas');
        return data;
      } else {
        debugPrint('❌ [API] Erro ao obter meus cursos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao obter meus cursos: $e');
      return null;
    }
  }

  /// Obter detalhes completos dos cursos inscritos
  Future<List<dynamic>?> getMeusCursosCompletos() async {
    try {
      debugPrint('📚 [API] A obter meus cursos completos...');
      final response = await get('/inscricoes/meus-cursos-completos');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('✅ [API] ${data?.length ?? 0} cursos completos obtidos');
        return data;
      } else {
        debugPrint(
            '❌ [API] Erro ao obter cursos completos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao obter cursos completos: $e');
      return null;
    }
  }

  /// Obter detalhes de um curso específico
  Future<Map<String, dynamic>?> getCurso(int cursoId) async {
    try {
      debugPrint('📚 [API] A obter curso ID: $cursoId');
      final response = await get('/cursos/$cursoId');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter curso $cursoId: $e');
      return null;
    }
  }

  /// Obter categorias de cursos
  Future<List<dynamic>?> getCategorias() async {
    try {
      debugPrint('📂 [API] A obter categorias...');
      final response = await get('/categorias');
      return parseResponseToList(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao obter categorias: $e');
      return null;
    }
  }

  /// Inscrever-se num curso
  Future<Map<String, dynamic>?> inscreverNoCurso(int cursoId) async {
    try {
      debugPrint('📝 [API] A inscrever no curso ID: $cursoId');
      final response = await post('/inscricoes', body: {
        'id_curso': cursoId,
      });
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('❌ [API] Erro ao inscrever no curso $cursoId: $e');
      return null;
    }
  }

  /// Endpoint de health check para testar conectividade
  Future<Map<String, dynamic>?> healthCheck() async {
    try {
      final response = await get('/');
      if (response.statusCode == 200) {
        return {'status': 'ok', 'timestamp': DateTime.now().toIso8601String()};
      }
      return null;
    } catch (e) {
      debugPrint('❌ [API] Health check falhou: $e');
      return null;
    }
  }
}
