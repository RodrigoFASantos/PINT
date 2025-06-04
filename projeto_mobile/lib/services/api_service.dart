import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

/// Serviço principal para comunicação com a API
class ApiService {
  // URL base da API - CONFIGURADA PARA EMULADOR ANDROID
  static const String baseUrl = 'http://10.0.2.2:4000/api';

  // URL base da API para dispositivos físicos
  // static const String baseUrl = 'http://192.168.8.29:4000/api';

  // URLs para imagens padrão
  static const String defaultAvatar = '$baseUrl/uploads/AVATAR.png';
  static const String defaultCapa = '$baseUrl/uploads/CAPA.png';

  // Cliente HTTP reutilizável

  static final http.Client _client = http.Client();

  /// Singleton instance
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Formatar email para uso em URLs (@ -> _at_, . -> _)
  static String formatEmail(String email) {
    return email.replaceAll('@', '_at_').replaceAll('.', '_');
  }

  /// Obter timestamp para evitar cache
  static String get timestamp => '?t=${DateTime.now().millisecondsSinceEpoch}';

  /// URLs para imagens de utilizador
  static String userAvatar(String email) {
    if (email.isEmpty) return defaultAvatar;
    return '$baseUrl/uploads/users/${formatEmail(email)}/${email}_AVATAR.png$timestamp';
  }

  static String userCapa(String email) {
    if (email.isEmpty) return defaultCapa;
    return '$baseUrl/uploads/users/${formatEmail(email)}/${email}_CAPA.png$timestamp';
  }

  /// URL para imagem de curso
  static String cursoImagem(String nomeCurso) {
    if (nomeCurso.isEmpty) return defaultCapa;
    final slug = nomeCurso
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll(RegExp(r'[^\w-]'), '');
    return '$baseUrl/uploads/cursos/$slug/capa.png';
  }

  /// Obter token de autenticação
  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('token');
    } catch (e) {
      return null;
    }
  }

  /// Salvar token de autenticação
  static Future<void> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token);
    } catch (e) {
      // Ignorar erro de salvamento
    }
  }

  /// Remover token (logout)
  static Future<void> removeToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
    } catch (e) {
      // Ignorar erro de remoção
    }
  }

  /// Obter email do utilizador atual
  static Future<String?> getUserEmail() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('email');
    } catch (e) {
      return null;
    }
  }

  /// Headers padrão para requisições
  static Future<Map<String, String>> _getHeaders(
      {bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  /// Headers para upload de ficheiros
  static Future<Map<String, String>> _getUploadHeaders() async {
    final headers = <String, String>{};

    final token = await getToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  /// Processar resposta HTTP
  static dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isNotEmpty) {
        try {
          return json.decode(response.body);
        } catch (e) {
          return response.body;
        }
      }
      return null;
    } else {
      String errorMessage = 'Erro HTTP ${response.statusCode}';

      try {
        final errorData = json.decode(response.body);
        errorMessage = errorData['message'] ?? errorMessage;
      } catch (e) {
        // Se não conseguir fazer parse do JSON, usar mensagem padrão
      }

      throw Exception(errorMessage);
    }
  }

  // =====================================
  // MÉTODOS HTTP BÁSICOS
  // =====================================

  /// Método GET genérico
  Future<dynamic> get(String endpoint, {Map<String, String>? params}) async {
    try {
      String url = '$baseUrl$endpoint';
      if (params != null && params.isNotEmpty) {
        url += '?' + Uri(queryParameters: params).query;
      }

      final response = await _client.get(
        Uri.parse(url),
        headers: await _getHeaders(),
      );

      return _processResponse(response);
    } catch (e) {
      throw Exception('Erro na requisição GET: $e');
    }
  }

  /// Método POST genérico
  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _getHeaders(),
        body: json.encode(data),
      );

      return _processResponse(response);
    } catch (e) {
      throw Exception('Erro na requisição POST: $e');
    }
  }

  /// Método PUT genérico
  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await _client.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _getHeaders(),
        body: json.encode(data),
      );

      return _processResponse(response);
    } catch (e) {
      throw Exception('Erro na requisição PUT: $e');
    }
  }

  /// Método DELETE genérico
  Future<dynamic> delete(String endpoint) async {
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _getHeaders(),
      );

      return _processResponse(response);
    } catch (e) {
      throw Exception('Erro na requisição DELETE: $e');
    }
  }

  /// Método POST com FormData (para uploads)
  Future<dynamic> postFormData(
    String endpoint,
    Map<String, String> fields, {
    Map<String, File>? files,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl$endpoint'),
      );

      request.headers.addAll(await _getUploadHeaders());
      request.fields.addAll(fields);

      if (files != null) {
        for (final entry in files.entries) {
          request.files.add(
            await http.MultipartFile.fromPath(entry.key, entry.value.path),
          );
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _processResponse(response);
    } catch (e) {
      throw Exception('Erro na requisição POST FormData: $e');
    }
  }

  // =====================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =====================================

  /// Login do utilizador
  static Future<Map<String, dynamic>> login(
      String email, String password) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: await _getHeaders(includeAuth: false),
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );

    final data = _processResponse(response);

    // Salvar token e email
    if (data['token'] != null) {
      await saveToken(data['token']);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('email', email);
    }

    return data;
  }

  /// Logout do utilizador
  static Future<void> logout() async {
    await removeToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // =====================================
  // MÉTODOS DE PERFIL
  // =====================================

  /// Obter perfil do utilizador atual
  Future<Map<String, dynamic>> getUserProfile() async {
    return await get('/users/perfil');
  }

  /// Atualizar perfil do utilizador
  Future<Map<String, dynamic>> updateUserProfile(
      Map<String, dynamic> data) async {
    return await put('/users/perfil', data);
  }

  /// Upload de imagem de perfil
  static Future<Map<String, dynamic>> uploadImagemPerfil(
      File file, String email) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/users/img/perfil'),
    );

    request.headers.addAll(await _getUploadHeaders());
    request.fields['email'] = email;
    request.files.add(await http.MultipartFile.fromPath('imagem', file.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    return _processResponse(response);
  }

  /// Upload de imagem de capa
  static Future<Map<String, dynamic>> uploadImagemCapa(
      File file, String email) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/users/img/capa'),
    );

    request.headers.addAll(await _getUploadHeaders());
    request.fields['email'] = email;
    request.files.add(await http.MultipartFile.fromPath('imagem', file.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    return _processResponse(response);
  }

  // =====================================
  // MÉTODOS DE FORMADORES
  // =====================================

  /// Obter lista de formadores
  Future<Map<String, dynamic>> getFormadores(
      {int page = 1, int limit = 10}) async {
    return await get('/formadores', params: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  /// Obter detalhes de um formador
  static Future<Map<String, dynamic>> getFormador(int id) async {
    final instance = ApiService();
    return await instance.get('/formadores/$id');
  }

  /// Obter perfil do formador atual
  static Future<Map<String, dynamic>> getFormadorProfile() async {
    final instance = ApiService();
    return await instance.get('/formadores/profile');
  }

  // =====================================
  // MÉTODOS DE CURSOS
  // =====================================

  /// Obter lista de cursos
  static Future<List<dynamic>> getCursos({int? page, int? limit}) async {
    final instance = ApiService();
    final params = <String, String>{};
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();

    final response = await instance.get('/cursos', params: params);
    return response is List ? response : [];
  }

  /// Obter detalhes de um curso
  Future<Map<String, dynamic>> getCurso(int id) async {
    return await get('/cursos/$id');
  }

  // =====================================
  // MÉTODOS DE INSCRIÇÕES
  // =====================================

  /// Obter minhas inscrições
  Future<List<dynamic>> getMinhasInscricoes() async {
    final response = await get('/inscricoes/minhas-inscricoes');
    return response is List ? response : [];
  }

  /// Verificar se está inscrito num curso
  Future<bool> verificarInscricao(int cursoId) async {
    try {
      final response = await get('/inscricoes/verificar/$cursoId');
      return response['inscrito'] ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Inscrever-se num curso
  Future<Map<String, dynamic>> inscreverCurso(int cursoId) async {
    return await post('/inscricoes', {'cursoId': cursoId});
  }

  // =====================================
  // MÉTODOS DE CATEGORIAS
  // =====================================

  /// Obter todas as categorias
  static Future<List<dynamic>> getCategorias() async {
    final instance = ApiService();
    final response = await instance.get('/categorias');
    return response is List ? response : [];
  }

  // =====================================
  // MÉTODOS ADMINISTRATIVOS
  // =====================================

  /// Obter utilizador por ID (apenas para admins)
  static Future<Map<String, dynamic>> getUtilizador(int id) async {
    final instance = ApiService();
    return await instance.get('/users/$id');
  }

  /// Obter lista de utilizadores (apenas para admins)
  Future<Map<String, dynamic>> getUtilizadores(
      {int page = 1, int limit = 10}) async {
    return await get('/users', params: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  /// Atualizar utilizador (apenas para admins)
  static Future<Map<String, dynamic>> updateUtilizador(
      int id, Map<String, dynamic> data) async {
    final instance = ApiService();
    return await instance.put('/users/$id', data);
  }

  /// Criar utilizador (apenas para admins)
  Future<Map<String, dynamic>> createUtilizador(
      Map<String, dynamic> data) async {
    return await post('/users', data);
  }

  /// Eliminar utilizador (apenas para admins)
  Future<void> deleteUtilizador(int id) async {
    await delete('/users/$id');
  }

  // =====================================
  // MÉTODOS DE NOTIFICAÇÕES
  // =====================================

  /// Obter notificações do utilizador
  static Future<List<dynamic>> getNotificacoes() async {
    final instance = ApiService();
    final response = await instance.get('/notificacoes');
    return response is List ? response : [];
  }

  /// Marcar notificação como lida
  static Future<void> marcarNotificacaoLida(int id) async {
    final instance = ApiService();
    await instance.put('/notificacoes/$id/lida', {});
  }

  // =====================================
  // MÉTODOS UTILITÁRIOS
  // =====================================

  /// Normalizar URL de anexo/imagem
  static String normalizeUrl(String? url) {
    if (url == null || url.isEmpty) return defaultAvatar;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return '$baseUrl$url';
    return '$baseUrl/$url';
  }

  /// Obter URL de avatar do utilizador
  static String getAvatarUrl(String? fotoPerfil, String? email) {
    if (fotoPerfil != null && fotoPerfil.isNotEmpty) {
      return normalizeUrl(fotoPerfil);
    }
    if (email != null && email.isNotEmpty) {
      return userAvatar(email);
    }
    return defaultAvatar;
  }

// =====================================
// MÉTODOS DE FÓRUM
// =====================================

  /// Obter tópicos por categoria
  Future<Map<String, dynamic>> getTopicosPorCategoria(int categoriaId) async {
    return await get('/topicos-area/categoria/$categoriaId');
  }

  /// Obter detalhes de um tópico
  Future<Map<String, dynamic>> getTopico(int topicoId) async {
    return await get('/topicos-area/$topicoId');
  }

  /// Criar tópico
  Future<Map<String, dynamic>> criarTopico(Map<String, dynamic> data) async {
    return await post('/topicos-area', data);
  }

  /// Solicitar tópico
  Future<Map<String, dynamic>> solicitarTopico(
      Map<String, dynamic> data) async {
    return await post('/topicos-area/solicitar', data);
  }

  /// Obter tema específico
  Future<Map<String, dynamic>> getTema(int temaId) async {
    return await get('/forum-tema/tema/$temaId');
  }

  /// Obter temas de um tópico
  Future<Map<String, dynamic>> getTemasTopico(
    int topicoId, {
    String filtro = 'recentes',
    int page = 1,
    int limit = 10,
  }) async {
    return await get('/forum-tema/topico/$topicoId/temas', params: {
      'filtro': filtro,
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  /// Criar tema
  Future<Map<String, dynamic>> criarTema(
      int topicoId, Map<String, dynamic> data) async {
    return await postFormData('/forum-tema/tema', {
      'id_topico': topicoId.toString(),
      ...data.map((key, value) => MapEntry(key, value.toString())),
    });
  }

  /// Avaliar tema
  Future<Map<String, dynamic>> avaliarTema(int temaId, String tipo) async {
    return await post('/forum-tema/tema/$temaId/avaliar', {'tipo': tipo});
  }

  /// Denunciar tema
  Future<Map<String, dynamic>> denunciarTema(int temaId, String motivo) async {
    return await post('/denuncias/forum-tema/denunciar', {
      'id_tema': temaId,
      'motivo': motivo,
    });
  }

  /// Apagar tema
  Future<void> apagarTema(int temaId) async {
    await delete('/forum-tema/tema/$temaId');
  }

  /// Obter comentários de um tema
  Future<Map<String, dynamic>> getComentariosTema(int temaId) async {
    return await get('/forum-tema/tema/$temaId/comentarios');
  }

  /// Criar comentário
  Future<Map<String, dynamic>> criarComentario(
      int temaId, Map<String, dynamic> data,
      {File? anexo}) async {
    Map<String, String> fields =
        data.map((key, value) => MapEntry(key, value.toString()));

    return await postFormData(
      '/forum-tema/tema/$temaId/comentario',
      fields,
      files: anexo != null ? {'anexo': anexo} : null,
    );
  }

  /// Avaliar comentário
  Future<Map<String, dynamic>> avaliarComentario(
      int comentarioId, String tipo) async {
    return await post(
        '/forum/comentario/$comentarioId/avaliar', {'tipo': tipo});
  }

  /// Denunciar comentário
  Future<Map<String, dynamic>> denunciarComentario(
      int comentarioId, String motivo) async {
    return await post(
        '/forum/comentario/$comentarioId/denunciar', {'motivo': motivo});
  }

  /// Obter denúncias do utilizador
  Future<Map<String, dynamic>> getDenunciasUtilizador() async {
    return await get('/denuncias/usuario/denuncias-temas');
  }

  /// Obter comentários de um tópico (método alternativo)
  Future<List<dynamic>> getComentariosTopico(int topicoId) async {
    final response = await get('/forum/topico/$topicoId/comentarios');
    return response is List ? response : [];
  }

  /// Obter detalhes do tópico para fórum
  Future<Map<String, dynamic>> getTopicoForum(int topicoId) async {
    return await get('/forum/topico/$topicoId');
  }

// =====================================
// MÉTODOS DE CONFIRMAÇÃO DE CONTA
// =====================================

  /// Confirmar conta com token
  Future<Map<String, dynamic>> confirmAccount(String token) async {
    return await post('/auth/confirm-account', {'token': token});
  }

  /// Reenviar email de confirmação
  Future<Map<String, dynamic>> resendConfirmation(String email) async {
    return await post('/auth/resend-confirmation', {'email': email});
  }

  // =====================================
  // TRATAMENTO DE ERROS
  // =====================================

  /// Verificar se o erro é de autenticação
  static bool isAuthError(Exception e) {
    return e.toString().contains('401') ||
        e.toString().contains('Unauthorized');
  }

  /// Verificar se o erro é de permissão
  static bool isPermissionError(Exception e) {
    return e.toString().contains('403') || e.toString().contains('Forbidden');
  }

  /// Verificar se o erro é de conectividade
  static bool isNetworkError(Exception e) {
    return e.toString().contains('SocketException') ||
        e.toString().contains('Connection') ||
        e.toString().contains('timeout');
  }

  /// Obter mensagem de erro amigável
  static String getFriendlyErrorMessage(Exception e) {
    final errorStr = e.toString();

    if (isNetworkError(e)) {
      return 'Erro de conectividade. Verifique a sua ligação à internet.';
    } else if (isAuthError(e)) {
      return 'Sessão expirada. Por favor, faça login novamente.';
    } else if (isPermissionError(e)) {
      return 'Não tem permissão para realizar esta ação.';
    } else if (errorStr.contains('404')) {
      return 'Recurso não encontrado.';
    } else if (errorStr.contains('500')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    } else {
      return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }

  /// Cleanup dos recursos
  static void dispose() {
    _client.close();
  }
}
