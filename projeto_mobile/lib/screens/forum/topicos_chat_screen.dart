import 'package:flutter/material.dart';
import 'dart:io';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';
import '../../screens/forum/comentario_form.dart';

class TopicosChatScreen extends StatefulWidget {
  final String topicoId;
  final String temaId;

  const TopicosChatScreen(
      {Key? key, required this.topicoId, required this.temaId})
      : super(key: key);

  @override
  _TopicosChatScreenState createState() => _TopicosChatScreenState();
}

class _TopicosChatScreenState extends State<TopicosChatScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? tema;
  Map<String, dynamic>? topico;
  List<dynamic> comentarios = [];
  Map<String, dynamic>? currentUser;
  bool loading = true;
  String? erro;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  // Inicializa todos os dados necessários
  Future<void> _initializeData() async {
    try {
      await _loadUserData();
      await _loadTopico();
      await _loadTema();
      await _loadComentarios();
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar dados: $error';
        loading = false;
      });
    }
  }

  // Carrega dados do usuário atual
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

  // Carrega dados do tópico
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

  // Carrega dados do tema específico
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
      }
    } catch (error) {
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar tema: $error');
    }
  }

  // ✅ CORRIGIDO: Usar o método correto para carregar comentários de tema
  Future<void> _loadComentarios() async {
    try {
      debugPrint(
          '🔧 [TOPICOS_CHAT] Carregando comentários para tema: ${widget.temaId}');

      // ✅ USAR O MÉTODO CORRETO DO API_SERVICE - AGORA RETORNA List<dynamic>? DIRETAMENTE
      final comentariosData =
          await _apiService.getComentariosTema(widget.temaId);

      if (comentariosData != null) {
        setState(() {
          comentarios = comentariosData; // ✅ Agora é diretamente uma lista
          loading = false;
        });

        debugPrint(
            '✅ [TOPICOS_CHAT] ${comentarios.length} comentários carregados');
      } else {
        setState(() {
          comentarios = [];
          loading = false;
        });
        debugPrint(
            'ℹ️ [TOPICOS_CHAT] Nenhum comentário encontrado para o tema');
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar comentários: $error';
        loading = false;
      });
      debugPrint('❌ [TOPICOS_CHAT] Erro ao carregar comentários: $error');
    }
  }

  // ✅ CORRIGIDO: Função melhorada para adicionar novo comentário
  void _onNovoComentario(Map<String, dynamic> novoComentario) {
    setState(() {
      // Adicionar o novo comentário no final da lista (mais recente)
      comentarios.add(novoComentario);
    });

    // Scroll automático para o final da lista (opcional)
    // Se você tiver um ScrollController, pode implementar isso

    final texto = novoComentario['texto']?.toString() ?? 'sem texto';
    final textoPreview =
        texto.length > 30 ? '${texto.substring(0, 30)}...' : texto;

    debugPrint('✅ [TOPICOS_CHAT] Novo comentário adicionado: $textoPreview');
  }

  // Volta para a tela de conversas do tópico
  void _voltarParaConversas() {
    debugPrint('🔧 [TOPICOS_CHAT] Voltando para conversas do tópico');
    Navigator.pushReplacementNamed(
        context, '/forum/topico/${widget.topicoId}/conversas');
  }

  // Formata data para exibição amigável
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
    // Tela de carregamento
    if (loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Chat'),
          backgroundColor: Color(0xFFFF8000),
          leading: IconButton(
            icon: Icon(Icons.arrow_back),
            onPressed: _voltarParaConversas,
            tooltip: 'Voltar às Conversas',
          ),
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
              Text('A carregar chat...'),
            ],
          ),
        ),
      );
    }

    // Tela de erro
    if (erro != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Erro'),
          backgroundColor: Color(0xFFFF8000),
          leading: IconButton(
            icon: Icon(Icons.arrow_back),
            onPressed: _voltarParaConversas,
            tooltip: 'Voltar às Conversas',
          ),
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
              SizedBox(height: 12),
              TextButton.icon(
                onPressed: _voltarParaConversas,
                icon: Icon(Icons.arrow_back),
                label: Text('Voltar às Conversas'),
              ),
            ],
          ),
        ),
      );
    }

    // Tela principal do chat
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chat', style: TextStyle(fontSize: 18)),
            if (tema != null)
              Text(
                tema!['titulo'] ?? 'Tema',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              ),
          ],
        ),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: _voltarParaConversas,
          tooltip: 'Voltar às Conversas',
        ),
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

            // Formulário para novo comentário
            NovoComentarioForm(
              temaId: widget.temaId,
              onSuccess: _onNovoComentario,
              placeholder: 'Digite sua mensagem...',
            ),
          ],
        ),
      ),
    );
  }

  // Constrói header com informações do tema
  Widget _buildTemaHeader() {
    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(16),
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
          // Título do tema
          Text(
            tema!['titulo'] ?? 'Sem título',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF333333),
            ),
          ),

          // Descrição se existir
          if (tema!['texto'] != null) ...[
            SizedBox(height: 8),
            Text(
              tema!['texto'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          SizedBox(height: 12),

          // Informações do autor e data
          Row(
            children: [
              Icon(Icons.person, size: 14, color: Colors.grey[500]),
              SizedBox(width: 4),
              Text(
                tema!['utilizador']?['nome'] ?? 'Utilizador',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(width: 16),
              Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
              SizedBox(width: 4),
              Text(
                _formatarData(tema!['data_criacao']),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Estado vazio quando não há comentários
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            'Ainda não há comentários neste tema.',
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

  // Lista de comentários
  Widget _buildComentariosList() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: 16),
      itemCount: comentarios.length,
      itemBuilder: (context, index) {
        final comentario = comentarios[index];
        return _buildComentarioCard(comentario);
      },
    );
  }

  // Card individual de comentário
  Widget _buildComentarioCard(Map<String, dynamic> comentario) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cabeçalho do comentário
            Row(
              children: [
                // Avatar do usuário
                CircleAvatar(
                  radius: 16,
                  backgroundColor: Color(0xFFFF8000),
                  child: Text(
                    (comentario['utilizador']?['nome'] ?? 'U')[0].toUpperCase(),
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
                SizedBox(width: 8),

                // Nome e data
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        comentario['utilizador']?['nome'] ?? 'Utilizador',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        _formatarData(comentario['data_criacao']),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            SizedBox(height: 12),

            // Conteúdo do comentário
            if (comentario['texto'] != null) ...[
              Text(
                comentario['texto'],
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF444444),
                ),
              ),
              SizedBox(height: 8),
            ],

            // Anexo se existir
            if (comentario['anexo_url'] != null) ...[
              _buildAnexoComentario(
                comentario['anexo_url'],
                comentario['anexo_nome'] ?? 'Anexo',
                comentario['tipo_anexo'] ?? 'arquivo',
              ),
              SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }

  // Widget para exibir anexo do comentário
  Widget _buildAnexoComentario(
      String anexoUrl, String anexoNome, String tipoAnexo) {
    // Constrói URL completa
    final fullUrl = anexoUrl.startsWith('http')
        ? anexoUrl
        : '${_apiService.apiBase.replaceAll('/api', '')}/$anexoUrl';

    if (tipoAnexo == 'imagem') {
      // Exibe imagem com possibilidade de ampliar
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
                          color: Colors.grey[400], size: 32),
                      SizedBox(height: 8),
                      Text('Erro ao carregar imagem',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                ),
              ),
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  height: 150,
                  child: Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                          : null,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      );
    } else {
      // Exibe ícone para outros tipos de arquivo
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
              _getIconForType(tipoAnexo),
              size: 16,
              color: Color(0xFF4A90E2),
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

  // Exibe imagem em tela cheia
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

  // Retorna ícone apropriado para tipo de arquivo
  IconData _getIconForType(String? tipo) {
    switch (tipo?.toLowerCase()) {
      case 'imagem':
        return Icons.image;
      case 'video':
        return Icons.video_file;
      case 'arquivo':
      default:
        return Icons.insert_drive_file;
    }
  }
}
