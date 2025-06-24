import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late String _apiBase;
  String? _authToken;

  // URLs possíveis do servidor
  static const String _localIp = '192.168.8.29:4000';
  static const String _publicIp = '188.82.118.49:4000';
  static const String _localhost = 'localhost:4000';

  // Headers padrão para todas as requisições
  Map<String, String> get _defaultHeaders => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  // Getter público para o token
  String? get authToken => _authToken;

  // Inicializa o serviço API com detecção automática da URL base
  Future<void> initialize({String? customApiUrl}) async {
    if (customApiUrl != null) {
      _apiBase = customApiUrl;
      debugPrint('URL customizada definida: $_apiBase');
      return;
    }

    _apiBase = await _detectBestApiBase();
    debugPrint('URL Base FINAL detectada: $_apiBase');
  }

  // Detecção inteligente da melhor URL da API
  Future<String> _detectBestApiBase() async {
    debugPrint('Iniciando detecção inteligente da URL...');

    // Verificar variável de ambiente primeiro
    const envApiUrl = String.fromEnvironment('API_URL');
    if (envApiUrl.isNotEmpty) {
      debugPrint('Usando variável de ambiente: $envApiUrl');
      return envApiUrl;
    }

    // URLs de teste baseadas no ambiente e conectividade
    final List<String> possibleUrls = await _buildPossibleUrls();

    // Testar cada URL para ver qual responde mais rápido
    final workingUrl = await _findWorkingUrl(possibleUrls);

    if (workingUrl != null) {
      return workingUrl;
    }

    // Fallback baseado no ambiente
    final fallbackUrl = _getFallbackUrl();
    debugPrint('Nenhuma URL respondeu, usando fallback: $fallbackUrl');
    return fallbackUrl;
  }

  // Constrói lista de URLs possíveis baseada no ambiente
  Future<List<String>> _buildPossibleUrls() async {
    final List<String> urls = [];

    if (kDebugMode) {
      debugPrint('Modo debug - testando URLs de desenvolvimento...');

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
      debugPrint('Modo produção - usando URLs de produção...');
      // Em produção, priorizar IP público e HTTPS
      urls.add('https://$_publicIp/api');
      urls.add('http://$_publicIp/api');
    }

    debugPrint('URLs a testar: ${urls.length}');
    return urls;
  }

  // Encontra a primeira URL que responde
  Future<String?> _findWorkingUrl(List<String> urls) async {
    debugPrint('Testando conectividade...');

    // Testar URLs em paralelo para ser mais rápido
    final futures = urls.map((url) => _testUrlWithTimeout(url));
    final results = await Future.wait(futures);

    // Encontrar a primeira que funcionou
    for (int i = 0; i < urls.length; i++) {
      if (results[i]) {
        debugPrint('URL funcionando encontrada: ${urls[i]}');
        return urls[i];
      }
    }

    return null;
  }

  // Testa uma URL com timeout e retry
  Future<bool> _testUrlWithTimeout(String url) async {
    try {
      debugPrint('Testando: $url');

      final response = await http.get(
        Uri.parse(url.replaceAll('/api', '/api')),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 2));

      final isWorking = response.statusCode == 200;
      debugPrint('$url - Status: ${response.statusCode}');
      return isWorking;
    } catch (e) {
      debugPrint('Falha ao testar $url: ${e.toString().split('\n').first}');
      return false;
    }
  }

  // Tenta detectar o IP da rede local atual
  Future<String?> _getLocalNetworkIp() async {
    try {
      final interfaces = await NetworkInterface.list();
      for (var interface in interfaces) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 &&
              !addr.isLoopback &&
              _isPrivateIp(addr.address)) {
            debugPrint('IP local detectado: ${addr.address}');
            return addr.address;
          }
        }
      }
    } catch (e) {
      debugPrint('Erro ao detectar IP local: $e');
    }
    return null;
  }

  // Verifica se um IP é privado (rede local)
  bool _isPrivateIp(String ip) {
    return ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.');
  }

  // URL de fallback baseada no ambiente
  String _getFallbackUrl() {
    if (kDebugMode) {
      return 'http://$_localIp/api';
    } else {
      return 'http://$_publicIp/api';
    }
  }

  // Força reconexão (útil quando mudas de rede)
  Future<void> reconnect() async {
    debugPrint('Forçando reconexão...');
    _apiBase = await _detectBestApiBase();
  }

  // Verifica se a conexão atual ainda funciona
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

  // Define o token de autenticação
  void setAuthToken(String? token) {
    _authToken = token;
    debugPrint('Token definido');
  }

  // Remove o token de autenticação
  void clearAuthToken() {
    _authToken = null;
    debugPrint('Token removido');
  }

  // Getter para a URL base da API
  String get apiBase => _apiBase;

  // MÉTODOS HTTP COM RETRY AUTOMÁTICO

  // Requisição GET com retry em caso de falha de rede
  Future<http.Response> get(String endpoint,
      {Map<String, String>? headers, bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('GET: $url');

      final response =
          await http.get(url, headers: {..._defaultHeaders, ...?headers});
      _logResponse('GET', endpoint, response);
      return response;
    }, autoRetry);
  }

  // Requisição POST com retry
  Future<http.Response> post(String endpoint,
      {Object? body,
      Map<String, String>? headers,
      bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('POST: $url');

      final response = await http.post(
        url,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null,
      );
      _logResponse('POST', endpoint, response);
      return response;
    }, autoRetry);
  }

  // Requisição PATCH com retry
  Future<http.Response> patch(String endpoint,
      {Object? body,
      Map<String, String>? headers,
      bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('PATCH: $url');

      final response = await http.patch(
        url,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null,
      );
      _logResponse('PATCH', endpoint, response);
      return response;
    }, autoRetry);
  }

  // Requisição PUT
  Future<http.Response> put(String endpoint,
      {Object? body,
      Map<String, String>? headers,
      bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('PUT: $url');
      final response = await http.put(url,
          headers: {..._defaultHeaders, ...?headers},
          body: body != null ? jsonEncode(body) : null);
      _logResponse('PUT', endpoint, response);
      return response;
    }, autoRetry);
  }

  // Requisição DELETE
  Future<http.Response> delete(String endpoint,
      {Map<String, String>? headers, bool autoRetry = true}) async {
    return _executeWithRetry(() async {
      final url = Uri.parse('$_apiBase$endpoint');
      debugPrint('DELETE: $url');
      final response =
          await http.delete(url, headers: {..._defaultHeaders, ...?headers});
      _logResponse('DELETE', endpoint, response);
      return response;
    }, autoRetry);
  }

  // Executa uma requisição with retry automático em caso de falha de rede
  Future<http.Response> _executeWithRetry(
      Future<http.Response> Function() request, bool autoRetry) async {
    try {
      return await request();
    } catch (e) {
      if (autoRetry && _isNetworkError(e)) {
        debugPrint('Erro de rede detectado, tentando reconectar...');
        await reconnect();
        return await request();
      }
      rethrow;
    }
  }

  // Verifica se é um erro de rede
  bool _isNetworkError(dynamic error) {
    return error is SocketException ||
        error is HttpException ||
        error.toString().contains('Connection refused') ||
        error.toString().contains('Network unreachable');
  }

  // Log das respostas HTTP
  void _logResponse(String method, String endpoint, http.Response response) {
    final status = response.statusCode;
    final emoji = status >= 200 && status < 300 ? '✅' : '❌';
    debugPrint('$emoji [$method] $endpoint - Status: $status');

    if (kDebugMode && response.statusCode >= 400) {
      debugPrint('Response body: ${response.body}');
    }
  }

  // MÉTODOS AUXILIARES

  Map<String, dynamic>? parseResponseToMap(http.Response response) {
    try {
      // ✅ NOVO: Sempre tentar fazer parse, independente do status code
      final responseBody = response.body;
      if (responseBody.isEmpty) {
        debugPrint('⚠️ [API] Response body vazio');
        return null;
      }

      final parsed = jsonDecode(responseBody) as Map<String, dynamic>;

      // ✅ DEBUG: Log da resposta parseada
      if (kDebugMode && response.statusCode >= 400) {
        debugPrint('📋 [API] Response parseada (erro): $parsed');
      }

      return parsed;
    } catch (e) {
      debugPrint('❌ [API] Erro ao fazer parse da resposta: $e');
      debugPrint('📝 [API] Response body original: ${response.body}');
      return null;
    }
  }

  String extractErrorMessage(http.Response response) {
    try {
      final data = parseResponseToMap(response);
      if (data != null) {
        // Tentar diferentes campos que podem conter a mensagem
        if (data['message'] != null) {
          String message = data['message'];
          // Se também tem detalhes, adicionar
          if (data['detalhes'] != null) {
            message += '\n${data['detalhes']}';
          }
          return message;
        }

        if (data['error'] != null) {
          return data['error'];
        }

        if (data['detalhes'] != null) {
          return data['detalhes'];
        }
      }

      // Fallback: mensagem baseada no status code
      switch (response.statusCode) {
        case 400:
          return 'Dados inválidos';
        case 401:
          return 'Não autorizado';
        case 403:
          return 'Acesso negado';
        case 404:
          return 'Não encontrado';
        case 500:
          return 'Erro interno do servidor';
        default:
          return 'Erro desconhecido (${response.statusCode})';
      }
    } catch (e) {
      return 'Erro ao processar resposta';
    }
  }

  List<dynamic>? parseResponseToList(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return jsonDecode(response.body) as List<dynamic>;
      } catch (e) {
        debugPrint('Erro ao fazer parse da resposta: $e');
        return null;
      }
    }
    return null;
  }

  // ✅ CORRIGIDO: MÉTODOS PARA COMENTÁRIOS DO FÓRUM

  // ✅ MÉTODO CORRIGIDO: Obter comentários de um tema específico - RETORNA LISTA DIRETAMENTE
  Future<List<dynamic>?> getComentariosTema(String temaId) async {
    try {
      debugPrint('🔧 [API] Carregando comentários para tema: $temaId');

      // ✅ USAR O ENDPOINT CORRETO QUE FUNCIONA NA WEB
      final response = await get('/forum-tema/tema/$temaId/comentarios');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        if (data != null) {
          debugPrint('✅ [API] Comentários carregados com sucesso');
          debugPrint('✅ [API] Estrutura dos dados: ${data.keys}');

          // ✅ RETORNAR DIRETAMENTE A LISTA DE COMENTÁRIOS
          if (data['success'] == true && data['data'] != null) {
            final comentarios = data['data'] as List<dynamic>;
            debugPrint('✅ [API] ${comentarios.length} comentários encontrados');
            return comentarios;
          } else if (data['data'] != null) {
            // Formato alternativo - tentar interpretar como lista
            final comentarios = data['data'] as List<dynamic>? ?? [];
            debugPrint(
                '✅ [API] ${comentarios.length} comentários encontrados (formato alternativo)');
            return comentarios;
          } else {
            debugPrint('⚠️ [API] Resposta válida mas sem dados de comentários');
            return [];
          }
        }
        debugPrint('⚠️ [API] Resposta não contém dados de comentários');
        return [];
      } else {
        debugPrint(
            '❌ [API] Erro ao carregar comentários: ${response.statusCode}');
        debugPrint('❌ [API] Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao carregar comentários: $e');
      return null;
    }
  }

  // ✅ NOVO: Método para criar comentário no tema
  Future<Map<String, dynamic>?> criarComentarioTema({
    required String temaId,
    required String texto,
    File? anexo,
  }) async {
    try {
      debugPrint('🔧 [API] Criando comentário para tema: $temaId');

      // Este método será usado pelo comentario_form.dart
      // que já faz a requisição multipart diretamente

      final response = await post('/forum-tema/tema/$temaId/comentario', body: {
        'texto': texto,
      });

      final data = parseResponseToMap(response);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ [API] Comentário criado com sucesso');
        return data ??
            {'success': true, 'message': 'Comentário criado com sucesso'};
      } else {
        debugPrint('❌ [API] Erro ao criar comentário: ${response.statusCode}');
        return data ??
            {'success': false, 'message': 'Erro ao criar comentário'};
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao criar comentário: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  // MÉTODOS PARA DENÚNCIAS DE TEMAS (mantendo apenas temas)

  // Denunciar um tema do fórum
  Future<Map<String, dynamic>?> denunciarTema({
    required int idTema,
    required String motivo,
    String? descricao,
  }) async {
    try {
      debugPrint('🚩 [API] Denunciando tema ID: $idTema');
      final response = await post('/denuncias/forum-tema/denunciar', body: {
        'id_tema': idTema,
        'motivo': motivo,
        if (descricao != null) 'descricao': descricao,
      });

      final data = parseResponseToMap(response);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ [API] Tema denunciado com sucesso');
        return data ??
            {'success': true, 'message': 'Tema denunciado com sucesso'};
      } else {
        debugPrint('❌ [API] Erro ao denunciar tema: ${response.statusCode}');
        return data ?? {'success': false, 'message': 'Erro ao denunciar tema'};
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao denunciar tema: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  // Obter temas já denunciados pelo utilizador atual
  Future<List<int>?> getTemasDenunciados() async {
    try {
      debugPrint('🚩 [API] Obtendo temas denunciados pelo utilizador...');
      final response = await get('/denuncias/usuario/denuncias-temas');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        if (data != null && data['data'] != null) {
          final temasDenunciados = List<int>.from(data['data']);
          debugPrint(
              '✅ [API] Temas denunciados encontrados: ${temasDenunciados.length}');
          return temasDenunciados;
        }
        return [];
      } else {
        debugPrint(
            '❌ [API] Erro ao obter temas denunciados: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao obter temas denunciados: $e');
      return null;
    }
  }

  // Verificar se um tema específico foi denunciado pelo utilizador
  Future<bool> temaDenunciado(int idTema) async {
    try {
      final temasDenunciados = await getTemasDenunciados();
      if (temasDenunciados != null) {
        return temasDenunciados.contains(idTema);
      }
      return false;
    } catch (e) {
      debugPrint('❌ [API] Erro ao verificar se tema foi denunciado: $e');
      return false;
    }
  }

  // MÉTODOS PARA PRESENÇAS

  // ✅ CORRIGIDO: Marcar presença com melhor tratamento de timezone
  Future<Map<String, dynamic>?> marcarPresenca({
    required String idCurso,
    required int idUtilizador,
    required String codigo,
  }) async {
    try {
      debugPrint('🔧 [API] === MARCANDO PRESENÇA ===');
      debugPrint('🔧 [API] Curso: $idCurso');
      debugPrint('🔧 [API] Utilizador: $idUtilizador');
      debugPrint('🔧 [API] Código: "$codigo"');

      // ✅ NOVO: Incluir informação de timezone do cliente
      final agora = DateTime.now();
      final agoraUtc = agora.toUtc();
      final timezoneOffset = agora.timeZoneOffset.inMinutes;

      debugPrint('🌍 [API] Hora local: $agora');
      debugPrint('🌍 [API] Hora UTC: $agoraUtc');
      debugPrint('🌍 [API] Timezone offset: $timezoneOffset minutos');

      final body = {
        'id_curso': idCurso,
        'id_utilizador': idUtilizador,
        'codigo': codigo,
        // ✅ ENVIAR INFO DE TIMEZONE PARA O BACKEND
        'client_time': agora.toIso8601String(),
        'client_time_utc': agoraUtc.toIso8601String(),
        'timezone_offset_minutes': timezoneOffset,
      };

      final response = await post('/presencas/marcar', body: body);

      debugPrint('✅ [API] Status da resposta: ${response.statusCode}');
      debugPrint('✅ [API] Body da resposta: ${response.body}');

      // ✅ CORRIGIDO: Verificar se é sucesso (200-299)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ [API] Presença marcada com sucesso!');

        // ✅ IMPORTANTE: Para sucesso, sempre retornar success: true
        Map<String, dynamic>? responseData;
        try {
          responseData = parseResponseToMap(response);
        } catch (e) {
          debugPrint('⚠️ [API] Erro ao fazer parse (mas foi sucesso): $e');
        }

        // ✅ GARANTIR que sempre retorna success: true para códigos de sucesso
        return {
          'success': true,
          'message': 'Presença marcada com sucesso!',
          'data': responseData, // Dados originais do backend
          'status_code': response.statusCode,
        };
      } else {
        // ✅ ERRO: Extrair mensagem específica
        debugPrint('❌ [API] Erro ao marcar presença: ${response.statusCode}');

        Map<String, dynamic>? responseData;
        try {
          responseData = parseResponseToMap(response);
        } catch (e) {
          debugPrint('⚠️ [API] Erro ao fazer parse do erro: $e');
        }

        String errorMessage = 'Erro ao marcar presença';
        String? detalhes;

        if (responseData != null) {
          // Extrair mensagem específica do backend
          if (responseData['message'] != null) {
            errorMessage = responseData['message'];
          }
          if (responseData['detalhes'] != null) {
            detalhes = responseData['detalhes'];
          }

          debugPrint('📋 [API] Mensagem de erro: $errorMessage');
          if (detalhes != null) {
            debugPrint('📋 [API] Detalhes: $detalhes');
          }
        } else {
          // ✅ FALLBACK: Tentar parse manual da resposta
          try {
            final Map<String, dynamic> errorData = jsonDecode(response.body);
            errorMessage = errorData['message'] ?? errorMessage;
            detalhes = errorData['detalhes'];
          } catch (e) {
            // ✅ ÚLTIMO RECURSO: Mensagem baseada no status
            switch (response.statusCode) {
              case 400:
                errorMessage = 'Dados inválidos ou código incorreto';
                break;
              case 401:
                errorMessage = 'Não autorizado - faça login novamente';
                break;
              case 403:
                errorMessage = 'Acesso negado';
                break;
              case 404:
                errorMessage = 'Presença não encontrada';
                break;
              case 500:
                errorMessage = 'Erro interno do servidor';
                break;
            }
          }
        }

        return {
          'success': false,
          'message': errorMessage,
          'detalhes': detalhes,
          'status_code': response.statusCode,
          'raw_response': response.body,
        };
      }
    } catch (e) {
      debugPrint('❌ [API] Exceção ao marcar presença: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'detalhes': 'Verifique a sua ligação à internet e tente novamente',
        'error': e.toString()
      };
    }
  }

  // ✅ NOVO: Função auxiliar para normalizar data/hora recebida do servidor
  DateTime? parseServerDateTime(String? dateString, String? timeString) {
    if (dateString == null || timeString == null) return null;

    try {
      debugPrint('🕒 [API] Parsing server datetime: $dateString $timeString');

      // Normalizar formato de hora (adicionar segundos se necessário)
      String normalizedTime = timeString;
      if (!timeString.contains(':')) {
        normalizedTime = '$timeString:00:00';
      } else if (timeString.split(':').length == 2) {
        normalizedTime = '$timeString:00';
      }

      // Assumir que o servidor está em UTC e converter para local
      final utcDateTime = DateTime.parse('${dateString}T${normalizedTime}Z');
      final localDateTime = utcDateTime.toLocal();

      debugPrint('🕒 [API] Parsed UTC: $utcDateTime');
      debugPrint('🕒 [API] Converted local: $localDateTime');

      return localDateTime;
    } catch (e) {
      debugPrint('❌ [API] Erro ao fazer parse da data/hora: $e');

      // Fallback: tentar assumir que já está em local time
      try {
        return DateTime.parse('${dateString}T$timeString');
      } catch (e2) {
        debugPrint('❌ [API] Fallback também falhou: $e2');
        return null;
      }
    }
  }

  // MÉTODOS PARA NOTIFICAÇÕES

  // Obter todas as notificações do utilizador autenticado
  Future<List<dynamic>?> getNotificacoes() async {
    try {
      debugPrint('Obtendo notificações...');
      final response = await get('/notificacoes');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('Notificações obtidas: ${data?.length ?? 0}');
        return data ?? [];
      } else {
        debugPrint('Erro ao obter notificações: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter notificações: $e');
      return null;
    }
  }

  // Obter contagem de notificações não lidas
  Future<int> getNotificacoesNaoLidasContagem() async {
    try {
      debugPrint('Obtendo contagem de notificações não lidas...');
      final response = await get('/notificacoes/nao-lidas/contagem');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        final count = data?['count'] ?? 0;
        debugPrint('Notificações não lidas: $count');
        return count;
      } else {
        debugPrint('Erro ao obter contagem: ${response.statusCode}');
        return 0;
      }
    } catch (e) {
      debugPrint('Exceção ao obter contagem: $e');
      return 0;
    }
  }

  // Marcar uma notificação como lida
  Future<Map<String, dynamic>?> marcarNotificacaoComoLida(
      int idNotificacao) async {
    try {
      debugPrint('Marcando notificação $idNotificacao como lida...');
      final response = await put('/notificacoes/$idNotificacao/lida');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        debugPrint('Notificação marcada como lida');
        return data ??
            {'success': true, 'message': 'Notificação marcada como lida'};
      } else {
        debugPrint('Erro ao marcar como lida: ${response.statusCode}');
        return {'success': false, 'message': 'Erro ao marcar notificação'};
      }
    } catch (e) {
      debugPrint('Exceção ao marcar como lida: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  // Marcar todas as notificações como lidas
  Future<Map<String, dynamic>?> marcarTodasNotificacoesComoLidas() async {
    try {
      debugPrint('Marcando todas as notificações como lidas...');
      final response = await put('/notificacoes/marcar-todas-como-lidas');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        debugPrint('Todas as notificações marcadas como lidas');
        return data ??
            {
              'success': true,
              'message': 'Todas as notificações marcadas como lidas'
            };
      } else {
        debugPrint('Erro ao marcar todas como lidas: ${response.statusCode}');
        return {'success': false, 'message': 'Erro ao marcar notificações'};
      }
    } catch (e) {
      debugPrint('Exceção ao marcar todas como lidas: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  // MÉTODOS AUXILIARES PARA NOTIFICAÇÕES

  // Obter cor baseada no tipo de notificação
  Color getNotificacaoColor(String tipo) {
    switch (tipo) {
      case 'curso_adicionado':
        return Colors.blue;
      case 'formador_alterado':
      case 'formador_criado':
        return Colors.orange;
      case 'admin_criado':
        return Colors.purple;
      case 'data_curso_alterada':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  // Formatar data relativa
  String formatRelativeTime(String? dateString) {
    if (dateString == null || dateString.isEmpty) return 'data desconhecida';

    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inSeconds < 60) return 'há poucos segundos';
      if (diff.inMinutes < 60)
        return 'há ${diff.inMinutes} minuto${diff.inMinutes > 1 ? 's' : ''}';
      if (diff.inHours < 24)
        return 'há ${diff.inHours} hora${diff.inHours > 1 ? 's' : ''}';
      if (diff.inDays < 30)
        return 'há ${diff.inDays} dia${diff.inDays > 1 ? 's' : ''}';
      final meses = (diff.inDays / 30).floor();
      return 'há $meses mês${meses > 1 ? 'es' : ''}';
    } catch (e) {
      debugPrint('Erro ao formatar data: $e, $dateString');
      return 'data inválida';
    }
  }

  // MÉTODOS PARA FORMADORES

  // Obter lista de formadores com paginação
  Future<Map<String, dynamic>?> getFormadores(
      {int page = 1, int limit = 10}) async {
    try {
      debugPrint('Obtendo lista de formadores (página $page)...');
      final response = await get('/formadores?page=$page&limit=$limit');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        if (data != null) {
          debugPrint('Formadores obtidos: ${data['formadores']?.length ?? 0}');
          return data;
        }
        debugPrint('Resposta não contém dados de formadores');
        return null;
      } else {
        debugPrint('Erro ao obter formadores: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter formadores: $e');
      return null;
    }
  }

  // Obter todos os formadores (sem paginação)
  Future<List<dynamic>?> getAllFormadores() async {
    try {
      debugPrint('Obtendo todos os formadores...');
      final response = await get('/formadores');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        if (data != null && data['formadores'] != null) {
          debugPrint('Formadores obtidos: ${data['formadores'].length}');
          return data['formadores'] as List<dynamic>;
        }
        debugPrint('Resposta não contém campo formadores');
        return [];
      } else {
        debugPrint('Erro ao obter todos os formadores: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter todos os formadores: $e');
      return null;
    }
  }

  // MÉTODOS PARA IMAGENS

  String _formatEmailForUrl(String email) {
    if (email.isEmpty) return '';
    return email.replaceAll('@', '_at_').replaceAll('.', '_');
  }

  // Usar mesmo padrão da web - através da API
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

  // MÉTODOS ESPECÍFICOS DA API

  // Teste de conectividade com a API
  Future<bool> testConnection() async {
    try {
      final response = await get('/');
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Erro no teste de conexão: $e');
      return false;
    }
  }

  // Método de login
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      debugPrint('Iniciando login para: $email');
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
      debugPrint('Erro no login: $e');
      return {
        'success': false,
        'message': 'Erro de conexão',
        'error': e.toString()
      };
    }
  }

  // Logout
  Future<void> logout() async {
    clearAuthToken();
  }

  // Obter utilizador atual
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await get('/users/perfil');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('Erro ao obter utilizador atual: $e');
      return null;
    }
  }

  // Obter lista de cursos
  Future<List<dynamic>?> getCursos() async {
    try {
      debugPrint('Obtendo lista de cursos...');
      final response = await get('/cursos');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToMap(response);
        if (data != null && data['cursos'] != null) {
          debugPrint('Cursos obtidos: ${data['cursos'].length ?? 0}');
          return data['cursos'] as List<dynamic>;
        }
        debugPrint('Resposta não contém campo cursos');
        return [];
      } else {
        debugPrint('Erro ao obter cursos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter cursos: $e');
      return null;
    }
  }

  // Obter inscrições do utilizador atual (formato completo)
  Future<List<dynamic>?> getMinhasInscricoes() async {
    try {
      debugPrint('Obtendo minhas inscrições...');
      final response = await get('/inscricoes/minhas-inscricoes');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('Inscrições obtidas: ${data?.length ?? 0}');
        return data;
      } else {
        debugPrint('Erro ao obter minhas inscrições: ${response.statusCode}');
        debugPrint('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter minhas inscrições: $e');
      return null;
    }
  }

  // Obter cursos em que o utilizador está inscrito
  Future<List<dynamic>?> getMeusCursos() async {
    try {
      debugPrint('Obtendo meus cursos...');
      final response = await get('/inscricoes/minhas');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('Inscrições obtidas: ${data?.length ?? 0}');
        return data;
      } else {
        debugPrint('Erro ao obter meus cursos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter meus cursos: $e');
      return null;
    }
  }

  // Obter detalhes completos dos cursos inscritos
  Future<List<dynamic>?> getMeusCursosCompletos() async {
    try {
      debugPrint('Obtendo meus cursos completos...');
      final response = await get('/inscricoes/meus-cursos-completos');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = parseResponseToList(response);
        debugPrint('Cursos completos obtidos: ${data?.length ?? 0}');
        return data;
      } else {
        debugPrint('Erro ao obter cursos completos: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Exceção ao obter cursos completos: $e');
      return null;
    }
  }

  // Obter detalhes de um curso específico
  Future<Map<String, dynamic>?> getCurso(int cursoId) async {
    try {
      debugPrint('Obtendo curso ID: $cursoId');
      final response = await get('/cursos/$cursoId');
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('Erro ao obter curso $cursoId: $e');
      return null;
    }
  }

  // Obter categorias de cursos
  Future<List<dynamic>?> getCategorias() async {
    try {
      debugPrint('Obtendo categorias...');
      final response = await get('/categorias');
      return parseResponseToList(response);
    } catch (e) {
      debugPrint('Erro ao obter categorias: $e');
      return null;
    }
  }

  // Inscrever-se num curso
  Future<Map<String, dynamic>?> inscreverNoCurso(int cursoId) async {
    try {
      debugPrint('Inscrevendo no curso ID: $cursoId');

      // Obter o utilizador atual para extrair o ID
      final currentUser = await getCurrentUser();
      if (currentUser == null) {
        debugPrint('Erro: Utilizador não autenticado');
        return {'success': false, 'message': 'Utilizador não autenticado'};
      }

      final userId = currentUser['id_utilizador'];
      debugPrint('ID do utilizador: $userId');

      final response = await post('/inscricoes', body: {
        'id_utilizador': userId,
        'id_curso': cursoId,
      });
      return parseResponseToMap(response);
    } catch (e) {
      debugPrint('Erro ao inscrever no curso $cursoId: $e');
      return {
        'success': false,
        'message': 'Erro ao processar inscrição',
        'error': e.toString()
      };
    }
  }

  // Endpoint de health check para testar conectividade
  Future<Map<String, dynamic>?> healthCheck() async {
    try {
      final response = await get('/');
      if (response.statusCode == 200) {
        return {'status': 'ok', 'timestamp': DateTime.now().toIso8601String()};
      }
      return null;
    } catch (e) {
      debugPrint('Health check falhou: $e');
      return null;
    }
  }

  // Obter ícone baseado no tipo de notificação
  String getNotificacaoIcon(String tipo) {
    switch (tipo) {
      case 'curso_adicionado':
        return '📚'; // Ícone de livro/curso
      case 'formador_alterado':
      case 'formador_criado':
        return '👨‍🏫'; // Ícone de professor
      case 'admin_criado':
        return '⚙️'; // Ícone de administração
      case 'data_curso_alterada':
        return '📅'; // Ícone de calendário
      case 'inscricao_confirmada':
        return '✅'; // Ícone de confirmação
      case 'curso_cancelado':
        return '❌'; // Ícone de cancelamento
      case 'lembrete':
        return '🔔'; // Ícone de sino
      case 'avaliacao':
        return '⭐'; // Ícone de estrela
      case 'certificado':
        return '🏆'; // Ícone de troféu
      case 'forum':
        return '💬'; // Ícone de conversa
      case 'sistema':
        return 'ℹ️'; // Ícone de informação
      default:
        return '📢'; // Ícone padrão de notificação
    }
  }
}
