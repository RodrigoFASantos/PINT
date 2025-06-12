import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // ✅ ADICIONADO
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:mime/mime.dart'; // ✅ ADICIONADO
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class TopicosChatScreen extends StatefulWidget {
  final String topicoId;
  final String temaId;

  const TopicosChatScreen({
    Key? key,
    required this.topicoId,
    required this.temaId,
  }) : super(key: key);

  @override
  _TopicosChatScreenState createState() => _TopicosChatScreenState();
}

class _TopicosChatScreenState extends State<TopicosChatScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _comentarioController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  Map<String, dynamic>? topico;
  Map<String, dynamic>? tema;
  List<dynamic> comentarios = [];
  Map<String, dynamic>? currentUser;
  bool loading = true;
  String? erro;
  Map<int, String> avaliacoes = {}; // Para controlar likes/dislikes do usuário
  File? _anexo;
  String? _anexoTipo; // 'imagem', 'video', 'arquivo'
  String? _anexoMimeType; // ✅ ADICIONADO para armazenar MIME type

  // 🚀 WEBSOCKET PARA TEMPO REAL
  IO.Socket? socket;

  @override
  void initState() {
    super.initState();
    _initializeData();
    _initializeSocket();
  }

  @override
  void dispose() {
    _comentarioController.dispose();
    _scrollController.dispose();
    _disconnectSocket();
    super.dispose();
  }

  // ✅ NOVA FUNÇÃO: Detectar Content-Type baseado na extensão
  String _detectContentType(String filePath, String? originalMimeType) {
    // Primeiro, tentar usar o MIME type original se disponível e válido
    if (originalMimeType != null &&
        originalMimeType != 'application/octet-stream' &&
        originalMimeType.isNotEmpty) {
      return originalMimeType;
    }

    // Se não tiver MIME type válido, detectar pela extensão
    final mimeType = lookupMimeType(filePath);
    if (mimeType != null) {
      return mimeType;
    }

    // Fallback baseado na extensão manual
    final extension = filePath.toLowerCase().split('.').last;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/quicktime';
      case 'webm':
        return 'video/webm';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  // INICIALIZAR WEBSOCKET
  void _initializeSocket() {
    try {
      final apiBase = _apiService.apiBase.split('/api')[0];
      debugPrint('🔌 [TOPICOS_CHAT] Conectando ao WebSocket: $apiBase');

      socket = IO.io(apiBase, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
      });

      socket?.onConnect((_) {
        debugPrint('✅ [TOPICOS_CHAT] Conectado ao WebSocket');
        // Entrar no canal do tema específico
        socket?.emit('joinTema', widget.temaId);
        debugPrint(
            '🔧 [TOPICOS_CHAT] Entrou no canal do tema: ${widget.temaId}');
      });

      socket?.onDisconnect((_) {
        debugPrint('❌ [TOPICOS_CHAT] Desconectado do WebSocket');
      });

      // 📨 ESCUTAR NOVOS COMENTÁRIOS
      socket?.on('novoComentario', (data) {
        debugPrint('📨 [TOPICOS_CHAT] Novo comentário recebido: $data');
        if (mounted && data != null) {
          setState(() {
            comentarios.add(data);
          });

          // Auto-scroll para o final
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients) {
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            }
          });
        }
      });

      // 📨 ESCUTAR ATUALIZAÇÕES DE COMENTÁRIOS (likes/dislikes)
      socket?.on('comentarioAtualizado', (data) {
        debugPrint('📨 [TOPICOS_CHAT] Comentário atualizado: $data');
        if (mounted && data != null) {
          _atualizarComentarioLocal(data);
        }
      });

      socket?.onError((error) {
        debugPrint('❌ [TOPICOS_CHAT] Erro no socket: $error');
      });
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao inicializar socket: $error');
    }
  }

  // DESCONECTAR WEBSOCKET
  void _disconnectSocket() {
    if (socket != null) {
      debugPrint('🔌 [TOPICOS_CHAT] Desconectando...');
      socket?.emit('leaveTema', widget.temaId);
      socket?.disconnect();
      socket = null;
    }
  }

  // ATUALIZAR COMENTÁRIO LOCAL COM DADOS DO WEBSOCKET
  void _atualizarComentarioLocal(Map<String, dynamic> dadosAtualizados) {
    if (!mounted) return;

    setState(() {
      for (int i = 0; i < comentarios.length; i++) {
        if (comentarios[i]['id_comentario'] ==
            dadosAtualizados['id_comentario']) {
          if (dadosAtualizados.containsKey('likes')) {
            comentarios[i]['likes'] = dadosAtualizados['likes'];
          }
          if (dadosAtualizados.containsKey('dislikes')) {
            comentarios[i]['dislikes'] = dadosAtualizados['dislikes'];
          }
          break;
        }
      }
    });
  }

  Future<void> _initializeData() async {
    try {
      await _loadUserData();
      await _loadTopico();
      await _loadTema();
      await _loadComentarios();

      // Scroll para o final após carregar
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar dados: $error';
        loading = false;
      });
    }
  }

  Future<void> _loadUserData() async {
    try {
      final response = await _apiService.get('/users/perfil');
      final data = _apiService.parseResponseToMap(response);

      if (data != null) {
        setState(() {
          currentUser = data;
        });
        debugPrint(
            '🔧 [TOPICOS_CHAT] Usuário carregado: ${currentUser?['nome']}');
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar usuário: $error');
    }
  }

  Future<void> _loadTopico() async {
    try {
      debugPrint('🔧 [TOPICOS_CHAT] Carregando tópico ID: ${widget.topicoId}');

      final response =
          await _apiService.get('/topicos-area/${widget.topicoId}');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          topico = data['data'];
        });
        debugPrint('✅ [TOPICOS_CHAT] Tópico carregado: ${topico?['titulo']}');
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar tópico: $error');
    }
  }

  Future<void> _loadTema() async {
    try {
      debugPrint('🔧 [TOPICOS_CHAT] Carregando tema ID: ${widget.temaId}');

      final response =
          await _apiService.get('/forum-tema/tema/${widget.temaId}');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          tema = data['data'];
        });
        debugPrint('✅ [TOPICOS_CHAT] Tema carregado: ${tema?['titulo']}');
      } else {
        setState(() {
          erro = 'Tema não encontrado';
          loading = false;
        });
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar tema: $error';
        loading = false;
      });
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar tema: $error');
    }
  }

  Future<void> _loadComentarios() async {
    try {
      debugPrint(
          '🔧 [TOPICOS_CHAT] Carregando comentários para tema: ${widget.temaId}');

      final response = await _apiService
          .get('/forum-tema/tema/${widget.temaId}/comentarios');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          comentarios = data['data'];
          loading = false;
        });
        debugPrint(
            '✅ [TOPICOS_CHAT] ${comentarios.length} comentários carregados');
      } else {
        setState(() {
          comentarios = [];
          loading = false;
        });
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar comentários: $error';
        loading = false;
      });
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar comentários: $error');
    }
  }

  Future<void> _enviarComentario() async {
    if ((_comentarioController.text.trim().isEmpty && _anexo == null) ||
        currentUser == null) {
      AppUtils.showError(
          context, 'É necessário fornecer texto ou anexo para o comentário');
      return;
    }

    try {
      debugPrint('🔧 [TOPICOS_CHAT] Enviando comentário');

      // 🚀 IMPLEMENTAÇÃO CORRIGIDA COM CONTENT-TYPE
      Map<String, String> headers = {
        'Authorization': 'Bearer ${await _getAuthToken()}',
      };

      var request = http.MultipartRequest(
        'POST',
        Uri.parse(
            '${_apiService.apiBase}/forum-tema/tema/${widget.temaId}/comentario'),
      );

      // Adicionar texto
      request.fields['texto'] = _comentarioController.text;

      // ✅ CORRIGIDO: Usar nome de campo 'anexo' com CONTENT-TYPE correto
      if (_anexo != null) {
        var stream = http.ByteStream(_anexo!.openRead());
        var length = await _anexo!.length();

        // ✅ DETECTAR E DEFINIR CONTENT-TYPE CORRETO
        final contentType = _detectContentType(_anexo!.path, _anexoMimeType);

        debugPrint('📎 [UPLOAD] Comentário - Arquivo: ${_anexo!.path}');
        debugPrint('📎 [UPLOAD] Content-Type detectado: $contentType');
        debugPrint('📎 [UPLOAD] Tamanho: $length bytes');

        var multipartFile = http.MultipartFile(
          'anexo', // ✅ Campo correto
          stream,
          length,
          filename: 'anexo_${DateTime.now().millisecondsSinceEpoch}',
          contentType:
              MediaType.parse(contentType), // ✅ CONTENT-TYPE ADICIONADO
        );
        request.files.add(multipartFile);
      }

      // Adicionar headers
      request.headers.addAll(headers);

      debugPrint('📁 [TOPICOS_CHAT] Campo do anexo: anexo (singular)');

      // Enviar requisição
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      debugPrint('📡 [TOPICOS_CHAT] Status: ${response.statusCode}');
      debugPrint('📡 [TOPICOS_CHAT] Response: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data != null && data['data'] != null) {
          // O comentário será adicionado via WebSocket
          // Mas adicionar localmente caso socket não funcione
          if (socket == null || !socket!.connected) {
            setState(() {
              comentarios.add(data['data']);
            });
          }

          setState(() {
            _comentarioController.clear();
            _anexo = null;
            _anexoTipo = null;
            _anexoMimeType = null; // ✅ LIMPAR MIME TYPE
          });

          // Auto-scroll
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients) {
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            }
          });

          debugPrint('✅ [TOPICOS_CHAT] Comentário enviado com sucesso');
        } else {
          throw Exception('Resposta inválida do servidor');
        }
      } else {
        throw Exception('Erro HTTP: ${response.statusCode}');
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao enviar comentário: $error');
      AppUtils.showError(
          context, 'Não foi possível enviar o comentário: $error');
    }
  }

  Future<String?> _getAuthToken() async {
    // Obter token de autenticação do SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> _avaliarComentario(int comentarioId, String tipo) async {
    try {
      debugPrint(
          '🔧 [TOPICOS_CHAT] Avaliando comentário $comentarioId como $tipo');

      // Atualizar estado local para feedback imediato
      setState(() {
        final jaAvaliado = avaliacoes[comentarioId] == tipo;

        for (int i = 0; i < comentarios.length; i++) {
          if (comentarios[i]['id_comentario'] == comentarioId) {
            if (jaAvaliado) {
              // Remover avaliação (toggle off)
              avaliacoes.remove(comentarioId);
              comentarios[i][tipo == 'like' ? 'likes' : 'dislikes'] =
                  (comentarios[i][tipo == 'like' ? 'likes' : 'dislikes'] ?? 1) -
                      1;
            } else {
              // Adicionar nova avaliação ou trocar tipo
              final tipoAnterior = avaliacoes[comentarioId];
              avaliacoes[comentarioId] = tipo;

              if (tipoAnterior != null) {
                // Remover avaliação anterior
                comentarios[i][tipoAnterior == 'like' ? 'likes' : 'dislikes'] =
                    (comentarios[i][tipoAnterior == 'like'
                                ? 'likes'
                                : 'dislikes'] ??
                            1) -
                        1;
              }

              // Adicionar nova avaliação
              comentarios[i][tipo == 'like' ? 'likes' : 'dislikes'] =
                  (comentarios[i][tipo == 'like' ? 'likes' : 'dislikes'] ?? 0) +
                      1;
            }
            break;
          }
        }
      });

      // Fazer requisição para o servidor
      final response = await _apiService
          .post('/forum-tema/comentario/$comentarioId/avaliar', body: {
        'tipo': tipo,
      });

      final data = _apiService.parseResponseToMap(response);
      if (data != null && data['data'] != null) {
        final serverData = data['data'];
        // Atualizar com dados do servidor
        setState(() {
          for (int i = 0; i < comentarios.length; i++) {
            if (comentarios[i]['id_comentario'] == comentarioId) {
              comentarios[i]['likes'] = serverData['likes'];
              comentarios[i]['dislikes'] = serverData['dislikes'];
              break;
            }
          }
        });
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao avaliar comentário: $error');
      AppUtils.showError(context, 'Erro ao avaliar comentário: $error');
    }
  }

  Future<void> _denunciarComentario(int comentarioId) async {
    final motivo = await _showMotivoDialog();
    if (motivo == null || motivo.isEmpty) return;

    try {
      debugPrint('🔧 [TOPICOS_CHAT] Denunciando comentário $comentarioId');

      final response = await _apiService
          .post('/forum-tema/comentario/$comentarioId/denunciar', body: {
        'motivo': motivo,
      });

      final data = _apiService.parseResponseToMap(response);
      if (data != null) {
        // Marcar comentário como denunciado localmente
        setState(() {
          for (int i = 0; i < comentarios.length; i++) {
            if (comentarios[i]['id_comentario'] == comentarioId) {
              comentarios[i]['foi_denunciado'] = true;
              break;
            }
          }
        });

        AppUtils.showSuccess(context,
            'Comentário denunciado com sucesso. Obrigado pela sua contribuição.');
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao denunciar comentário: $error');
      AppUtils.showError(context, 'Erro ao denunciar comentário: $error');
    }
  }

  Future<String?> _showMotivoDialog() async {
    String motivo = '';

    return await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Denunciar Comentário'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Por favor, informe o motivo da denúncia:'),
            SizedBox(height: 16),
            TextField(
              onChanged: (value) => motivo = value,
              decoration: InputDecoration(
                hintText: 'Motivo da denúncia...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, motivo),
            child: Text('Denunciar'),
          ),
        ],
      ),
    );
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data indisponível';

    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year} às ${data.hour.toString().padLeft(2, '0')}:${data.minute.toString().padLeft(2, '0')}';
    } catch (error) {
      return 'Data inválida';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Chat'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
              SizedBox(height: 16),
              Text('Carregando comentários...'),
            ],
          ),
        ),
      );
    }

    if (erro != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Erro'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Erro ao carregar chat',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  erro!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    loading = true;
                    erro = null;
                  });
                  _initializeData();
                },
                icon: Icon(Icons.refresh),
                label: Text('Tentar Novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Chat'),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
          tooltip: 'Voltar',
        ),
        actions: [
          // 🔌 Indicador de status do WebSocket
          Container(
            margin: EdgeInsets.only(right: 16),
            child: Center(
              child: Icon(
                socket?.connected == true ? Icons.wifi : Icons.wifi_off,
                color: socket?.connected == true ? Colors.green : Colors.red,
                size: 20,
              ),
            ),
          ),
        ],
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/forum',
      ),
      body: Container(
        color: Color(0xFFF5F7FB),
        child: Column(
          children: [
            // Header do tema
            if (tema != null) _buildTemaHeader(),

            // Lista de comentários
            Expanded(
              child: comentarios.isEmpty
                  ? _buildEmptyState()
                  : _buildComentariosList(),
            ),

            // Input para novo comentário
            _buildComentarioInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildTemaHeader() {
    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (tema!['titulo'] != null) ...[
            Text(
              tema!['titulo'],
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF333333),
              ),
            ),
            SizedBox(height: 8),
          ],

          if (tema!['texto'] != null) ...[
            Text(
              tema!['texto'],
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF666666),
              ),
            ),
            SizedBox(height: 12),
          ],

          // ✅ ANEXO ÚNICO DO TEMA (CORRIGIDO)
          if (tema!['anexo_url'] != null && tema!['anexo_url'].isNotEmpty) ...[
            Text(
              'Anexo do tema:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF333333),
              ),
            ),
            SizedBox(height: 8),
            _buildAnexoTema(
              tema!['anexo_url'],
              tema!['anexo_nome'] ?? 'Anexo',
              tema!['tipo_anexo'] ?? 'arquivo',
            ),
            SizedBox(height: 12),
          ],

          // Meta informações
          Row(
            children: [
              Text(
                'Por: ${tema!['utilizador']?['nome'] ?? 'Não disponível'}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(width: 16),
              Text(
                'Data: ${_formatarData(tema!['data_criacao'])}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),

          SizedBox(height: 8),

          // Estatísticas
          Row(
            children: [
              _buildStatChip(Icons.thumb_up, tema!['likes'] ?? 0),
              SizedBox(width: 8),
              _buildStatChip(Icons.thumb_down, tema!['dislikes'] ?? 0),
              SizedBox(width: 8),
              _buildStatChip(Icons.comment, tema!['comentarios'] ?? 0),
            ],
          ),
        ],
      ),
    );
  }

  // ✅ WIDGET PARA MOSTRAR ANEXO DO TEMA
  Widget _buildAnexoTema(String anexoUrl, String anexoNome, String tipoAnexo) {
    // Construir URL completa
    final fullUrl = anexoUrl.startsWith('http')
        ? anexoUrl
        : '${_apiService.apiBase.replaceAll('/api', '')}/$anexoUrl';

    if (tipoAnexo == 'imagem') {
      return InkWell(
        onTap: () => _showImageDialog(fullUrl, anexoNome),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              fullUrl,
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                height: 200,
                color: Colors.grey[200],
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image,
                          color: Colors.grey[400], size: 32),
                      SizedBox(height: 8),
                      Text('Erro ao carregar imagem',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    } else {
      return Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(
              tipoAnexo == 'video' ? Icons.video_file : Icons.insert_drive_file,
              color: Color(0xFF4A90E2),
              size: 24,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                anexoNome,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(Icons.download, color: Colors.grey[600], size: 20),
          ],
        ),
      );
    }
  }

  Widget _buildStatChip(IconData icon, int value) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Color(0xFFF0F2F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          SizedBox(width: 4),
          Text(
            value.toString(),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            'Nenhum comentário ainda.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Seja o primeiro a comentar!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComentariosList() {
    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.symmetric(horizontal: 16),
      itemCount: comentarios.length,
      itemBuilder: (context, index) {
        final comentario = comentarios[index];
        return _buildComentarioCard(comentario, index);
      },
    );
  }

  Widget _buildComentarioCard(Map<String, dynamic> comentario, int index) {
    final comentarioId = comentario['id_comentario'];
    final isAutor = comentario['id_utilizador'] ==
        (currentUser?['id_utilizador'] ?? currentUser?['id']);
    final foiDenunciado = comentario['foi_denunciado'] == true;

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: 18,
            backgroundColor: Color(0xFFFF8000),
            child: Text(
              (comentario['utilizador']?['nome'] ?? 'U')[0].toUpperCase(),
              style: TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),

          SizedBox(width: 12),

          // Conteúdo do comentário
          Expanded(
            child: Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isAutor ? Color(0xFFE3EFFD) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: foiDenunciado
                    ? Border.all(color: Colors.red, width: 2)
                    : null,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header do comentário
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          comentario['utilizador']?['nome'] ?? 'Usuário',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF333333),
                          ),
                        ),
                      ),
                      Text(
                        _formatarData(comentario['data_criacao']),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: 8),

                  // Texto do comentário
                  if (comentario['texto'] != null &&
                      comentario['texto'].isNotEmpty) ...[
                    Text(
                      comentario['texto'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF444444),
                      ),
                    ),
                    SizedBox(height: 8),
                  ],

                  // ✅ ANEXO ÚNICO DO COMENTÁRIO (CORRIGIDO)
                  if (comentario['anexo_url'] != null &&
                      comentario['anexo_url'].isNotEmpty) ...[
                    _buildAnexoComentario(
                      comentario['anexo_url'],
                      comentario['anexo_nome'] ?? 'Anexo',
                      comentario['tipo_anexo'] ?? 'arquivo',
                    ),
                    SizedBox(height: 8),
                  ],

                  // Ações do comentário
                  Row(
                    children: [
                      _buildComentarioAcao(
                        icon: Icons.thumb_up,
                        count: comentario['likes'] ?? 0,
                        isActive: avaliacoes[comentarioId] == 'like',
                        onPressed: () =>
                            _avaliarComentario(comentarioId, 'like'),
                      ),
                      SizedBox(width: 12),
                      _buildComentarioAcao(
                        icon: Icons.thumb_down,
                        count: comentario['dislikes'] ?? 0,
                        isActive: avaliacoes[comentarioId] == 'dislike',
                        onPressed: () =>
                            _avaliarComentario(comentarioId, 'dislike'),
                      ),
                      Spacer(),
                      // Indicador de anexo
                      if (comentario['anexo_url'] != null &&
                          comentario['anexo_url'].isNotEmpty)
                        Container(
                          margin: EdgeInsets.only(right: 8),
                          child: Icon(
                            Icons.attach_file,
                            size: 14,
                            color: Color(0xFF4A90E2),
                          ),
                        ),
                      IconButton(
                        onPressed: foiDenunciado
                            ? null
                            : () => _denunciarComentario(comentarioId),
                        icon: Icon(
                          Icons.flag,
                          color: foiDenunciado ? Colors.red : Colors.grey[600],
                          size: 16,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ✅ WIDGET PARA MOSTRAR ANEXO DO COMENTÁRIO
  Widget _buildAnexoComentario(
      String anexoUrl, String anexoNome, String tipoAnexo) {
    // Construir URL completa
    final fullUrl = anexoUrl.startsWith('http')
        ? anexoUrl
        : '${_apiService.apiBase.replaceAll('/api', '')}/$anexoUrl';

    if (tipoAnexo == 'imagem') {
      return InkWell(
        onTap: () => _showImageDialog(fullUrl, anexoNome),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              fullUrl,
              height: 150,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                height: 150,
                color: Colors.grey[200],
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image,
                          color: Colors.grey[400], size: 24),
                      SizedBox(height: 4),
                      Text('Erro ao carregar imagem',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    } else {
      return Container(
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              tipoAnexo == 'video' ? Icons.video_file : Icons.insert_drive_file,
              color: Color(0xFF4A90E2),
              size: 16,
            ),
            SizedBox(width: 6),
            Flexible(
              child: Text(
                anexoNome,
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF4A90E2),
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      );
    }
  }

  // ✅ FUNÇÃO PARA MOSTRAR IMAGEM EM FULLSCREEN
  void _showImageDialog(String imageUrl, String imageName) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        child: Container(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppBar(
                title: Text(imageName, style: TextStyle(color: Colors.white)),
                backgroundColor: Colors.black,
                iconTheme: IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: InteractiveViewer(
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.broken_image,
                              color: Colors.white, size: 64),
                          SizedBox(height: 16),
                          Text('Erro ao carregar imagem',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComentarioAcao({
    required IconData icon,
    required int count,
    bool isActive = false,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? Color(0xFF4A90E2).withOpacity(0.1) : null,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? Color(0xFF4A90E2) : Colors.grey[600],
            ),
            SizedBox(width: 4),
            Text(
              count.toString(),
              style: TextStyle(
                fontSize: 12,
                color: isActive ? Color(0xFF4A90E2) : Colors.grey[600],
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComentarioInput() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          // Preview do anexo
          if (_anexo != null) ...[
            Container(
              margin: EdgeInsets.only(bottom: 12),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  // Preview do anexo
                  if (_anexoTipo == 'imagem') ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        _anexo!,
                        height: 60,
                        width: 60,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ] else ...[
                    Container(
                      height: 60,
                      width: 60,
                      decoration: BoxDecoration(
                        color: Color(0xFF4A90E2).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _anexoTipo == 'video'
                            ? Icons.video_file
                            : Icons.insert_drive_file,
                        color: Color(0xFF4A90E2),
                        size: 30,
                      ),
                    ),
                  ],

                  SizedBox(width: 12),

                  // Info do arquivo
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Anexo selecionado',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          _anexoTipo == 'imagem'
                              ? 'Imagem'
                              : _anexoTipo == 'video'
                                  ? 'Vídeo'
                                  : 'Documento',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        // ✅ MOSTRAR MIME TYPE PARA DEBUG
                        if (_anexoMimeType != null) ...[
                          SizedBox(height: 2),
                          Text(
                            'Tipo: $_anexoMimeType',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[500],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Botão remover
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _anexo = null;
                        _anexoTipo = null;
                        _anexoMimeType = null; // ✅ LIMPAR MIME TYPE
                      });
                    },
                    icon: Icon(Icons.close, size: 20),
                    color: Colors.red,
                  ),
                ],
              ),
            ),
          ],

          // Input principal
          Row(
            children: [
              // Campo de texto
              Expanded(
                child: TextField(
                  controller: _comentarioController,
                  decoration: InputDecoration(
                    hintText: 'Escreva um comentário...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide(color: Color(0xFFFF8000)),
                    ),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  maxLines: null,
                  keyboardType: TextInputType.multiline,
                  textInputAction: TextInputAction.newline,
                ),
              ),

              SizedBox(width: 8),

              // Botão anexar
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFE0E6ED),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: IconButton(
                  onPressed: _mostrarOpcoesAnexo,
                  icon: Icon(Icons.attach_file),
                  color: Color(0xFF5181B8),
                  iconSize: 24,
                ),
              ),

              SizedBox(width: 8),

              // Botão enviar
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFF8000),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: IconButton(
                  onPressed: _enviarComentario,
                  icon: Icon(Icons.send),
                  color: Colors.white,
                  iconSize: 24,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _mostrarOpcoesAnexo() {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Adicionar Anexo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),
            ListTile(
              leading: Icon(Icons.camera_alt, color: Color(0xFF4A90E2)),
              title: Text('Tirar Foto'),
              onTap: () {
                Navigator.pop(context);
                _tirarFoto();
              },
            ),
            ListTile(
              leading: Icon(Icons.photo_library, color: Color(0xFF4A90E2)),
              title: Text('Galeria'),
              onTap: () {
                Navigator.pop(context);
                _selecionarImagem();
              },
            ),
            ListTile(
              leading: Icon(Icons.attach_file, color: Color(0xFF4A90E2)),
              title: Text('Arquivo'),
              onTap: () {
                Navigator.pop(context);
                _selecionarArquivo();
              },
            ),
            SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Future<void> _selecionarImagem() async {
    try {
      final ImagePicker imagePicker = ImagePicker();
      final XFile? image = await imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _anexo = File(image.path);
          _anexoTipo = 'imagem';
          _anexoMimeType = _detectContentType(
              image.path, image.mimeType); // ✅ ARMAZENAR MIME TYPE
        });

        debugPrint('📎 [IMAGEM] Selecionada: ${image.name}');
        debugPrint('📎 [IMAGEM] MIME Type: $_anexoMimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao selecionar imagem: $error');
    }
  }

  Future<void> _tirarFoto() async {
    try {
      final ImagePicker imagePicker = ImagePicker();
      final XFile? image = await imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _anexo = File(image.path);
          _anexoTipo = 'imagem';
          _anexoMimeType = _detectContentType(
              image.path, image.mimeType); // ✅ ARMAZENAR MIME TYPE
        });

        debugPrint('📎 [FOTO] Tirada: ${image.name}');
        debugPrint('📎 [FOTO] MIME Type: $_anexoMimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao tirar foto: $error');
    }
  }

  Future<void> _selecionarArquivo() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'mp4', 'avi', 'mov'],
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final extension = result.files.single.extension?.toLowerCase();

        setState(() {
          _anexo = file;
          _anexoMimeType =
              _detectContentType(file.path, null); // ✅ ARMAZENAR MIME TYPE

          if (['mp4', 'avi', 'mov'].contains(extension)) {
            _anexoTipo = 'video';
          } else {
            _anexoTipo = 'arquivo';
          }
        });

        debugPrint('📎 [ARQUIVO] Selecionado: ${result.files.single.name}');
        debugPrint('📎 [ARQUIVO] MIME Type: $_anexoMimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao selecionar arquivo: $error');
    }
  }
}
