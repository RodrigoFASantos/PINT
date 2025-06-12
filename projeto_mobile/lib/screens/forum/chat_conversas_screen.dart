import 'package:flutter/material.dart';
import 'dart:io';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';
import '../../screens/forum/criar_tema_modal.dart';

class ChatConversasScreen extends StatefulWidget {
  final String topicoId;

  const ChatConversasScreen({Key? key, required this.topicoId})
      : super(key: key);

  @override
  _ChatConversasScreenState createState() => _ChatConversasScreenState();
}

class _ChatConversasScreenState extends State<ChatConversasScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? topico;
  List<dynamic> temas = [];
  Map<String, dynamic>? currentUser;
  bool loading = true;
  String filtro = 'recentes'; // 'recentes', 'likes', 'dislikes', 'comentarios'
  String? erro;
  int pagina = 1;
  int totalPaginas = 1;
  Map<int, String> avaliacoes = {}; // Para controlar likes/dislikes do usuário
  List<int> temasDenunciados = [];

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    try {
      await _loadUserData();
      await _loadTopico();
      await _loadTemas();
      await _loadTemasDenunciados();
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
            '🔧 [CHAT_CONVERSAS] Usuário carregado: ${currentUser?['nome']}');
      }
    } catch (error) {
      debugPrint('❌ [CHAT_CONVERSAS] Erro ao carregar usuário: $error');
    }
  }

  Future<void> _loadTopico() async {
    try {
      debugPrint(
          '🔧 [CHAT_CONVERSAS] Carregando tópico ID: ${widget.topicoId}');

      final response =
          await _apiService.get('/topicos-area/${widget.topicoId}');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          topico = data['data'];
        });
        debugPrint('✅ [CHAT_CONVERSAS] Tópico carregado: ${topico?['titulo']}');
      }
    } catch (error) {
      debugPrint('❌ [CHAT_CONVERSAS] Erro ao carregar tópico: $error');
    }
  }

  Future<void> _loadTemas() async {
    try {
      debugPrint(
          '🔧 [CHAT_CONVERSAS] Carregando temas para tópico: ${widget.topicoId}');

      final response = await _apiService.get(
          '/forum-tema/topico/${widget.topicoId}/temas?filtro=$filtro&page=$pagina&limit=10');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          temas = data['data'];
          if (data['pagination'] != null) {
            totalPaginas = data['pagination']['totalPages'] ?? 1;
          }
          loading = false;
        });

        debugPrint('✅ [CHAT_CONVERSAS] ${temas.length} temas carregados');

        // Marcar temas denunciados
        _marcarTemasDenunciados();
      } else {
        setState(() {
          temas = [];
          loading = false;
        });
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar temas: $error';
        loading = false;
      });
      debugPrint('❌ [CHAT_CONVERSAS] Erro ao carregar temas: $error');
    }
  }

  Future<void> _loadTemasDenunciados() async {
    try {
      final response =
          await _apiService.get('/denuncias/usuario/denuncias-temas');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          temasDenunciados = List<int>.from(data['data']);
        });
        debugPrint(
            '✅ [CHAT_CONVERSAS] ${temasDenunciados.length} temas denunciados pelo usuário');
      }
    } catch (error) {
      debugPrint(
          '❌ [CHAT_CONVERSAS] Erro ao carregar temas denunciados: $error');
    }
  }

  void _marcarTemasDenunciados() {
    if (temasDenunciados.isNotEmpty) {
      setState(() {
        for (int i = 0; i < temas.length; i++) {
          final temaId = temas[i]['id_tema'];
          if (temasDenunciados.contains(temaId)) {
            temas[i]['foi_denunciado'] = true;
          }
        }
      });
    }
  }

  Future<void> _changeFiltro(String novoFiltro) async {
    if (novoFiltro != filtro) {
      setState(() {
        filtro = novoFiltro;
        pagina = 1;
        loading = true;
      });
      await _loadTemas();
    }
  }

  Future<void> _changePagina(int novaPagina) async {
    if (novaPagina != pagina && novaPagina >= 1 && novaPagina <= totalPaginas) {
      setState(() {
        pagina = novaPagina;
        loading = true;
      });
      await _loadTemas();
    }
  }

  Future<void> _avaliarTema(int temaId, String tipo) async {
    try {
      debugPrint('🔧 [CHAT_CONVERSAS] Avaliando tema $temaId como $tipo');

      // Atualizar estado local para feedback imediato
      setState(() {
        final jaAvaliado = avaliacoes[temaId] == tipo;

        for (int i = 0; i < temas.length; i++) {
          if (temas[i]['id_tema'] == temaId) {
            if (jaAvaliado) {
              // Remover avaliação (toggle off)
              avaliacoes.remove(temaId);
              temas[i][tipo == 'like' ? 'likes' : 'dislikes'] =
                  (temas[i][tipo == 'like' ? 'likes' : 'dislikes'] ?? 1) - 1;
            } else {
              // Adicionar nova avaliação ou trocar tipo
              final tipoAnterior = avaliacoes[temaId];
              avaliacoes[temaId] = tipo;

              if (tipoAnterior != null) {
                // Remover avaliação anterior
                temas[i][tipoAnterior == 'like' ? 'likes' : 'dislikes'] =
                    (temas[i][tipoAnterior == 'like' ? 'likes' : 'dislikes'] ??
                            1) -
                        1;
              }

              // Adicionar nova avaliação
              temas[i][tipo == 'like' ? 'likes' : 'dislikes'] =
                  (temas[i][tipo == 'like' ? 'likes' : 'dislikes'] ?? 0) + 1;
            }
            break;
          }
        }
      });

      // Fazer requisição para o servidor
      final response =
          await _apiService.post('/forum-tema/tema/$temaId/avaliar', body: {
        'tipo': tipo,
      });

      final data = _apiService.parseResponseToMap(response);
      if (data != null && data['data'] != null) {
        final serverData = data['data'];
        // Atualizar com dados do servidor
        setState(() {
          for (int i = 0; i < temas.length; i++) {
            if (temas[i]['id_tema'] == temaId) {
              temas[i]['likes'] = serverData['likes'];
              temas[i]['dislikes'] = serverData['dislikes'];
              break;
            }
          }
        });
      }
    } catch (error) {
      debugPrint('❌ [CHAT_CONVERSAS] Erro ao avaliar tema: $error');
      AppUtils.showError(context, 'Erro ao avaliar tema: $error');
    }
  }

  Future<void> _denunciarTema(int temaId) async {
    // Verificar se já foi denunciado
    if (temasDenunciados.contains(temaId)) {
      AppUtils.showInfo(context, 'Já denunciou este tema anteriormente.');
      return;
    }

    // Solicitar motivo da denúncia
    final motivo = await _showMotivoDialog();
    if (motivo == null || motivo.isEmpty) return;

    try {
      debugPrint('🔧 [CHAT_CONVERSAS] Denunciando tema $temaId');

      // Atualizar estado local imediatamente
      setState(() {
        temasDenunciados.add(temaId);
        for (int i = 0; i < temas.length; i++) {
          if (temas[i]['id_tema'] == temaId) {
            temas[i]['foi_denunciado'] = true;
            break;
          }
        }
      });

      final response =
          await _apiService.post('/forum-tema/tema/$temaId/denunciar', body: {
        'motivo': motivo,
      });

      final data = _apiService.parseResponseToMap(response);
      if (data != null && data['success'] == true) {
        AppUtils.showSuccess(context,
            'Tema denunciado com sucesso. Obrigado pela sua contribuição.');
      }
    } catch (error) {
      // Reverter estado em caso de erro
      setState(() {
        temasDenunciados.remove(temaId);
        for (int i = 0; i < temas.length; i++) {
          if (temas[i]['id_tema'] == temaId) {
            temas[i]['foi_denunciado'] = false;
            break;
          }
        }
      });

      debugPrint('❌ [CHAT_CONVERSAS] Erro ao denunciar tema: $error');
      AppUtils.showError(context, 'Erro ao denunciar tema: $error');
    }
  }

  Future<String?> _showMotivoDialog() async {
    String motivo = '';

    return await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Denunciar Tema'),
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

  void _navegarParaTema(int temaId) {
    debugPrint('🔧 [CHAT_CONVERSAS] Navegando para tema: $temaId');
    Navigator.pushNamed(
        context, '/forum/topico/${widget.topicoId}/tema/$temaId');
  }

  void _showCriarTemaDialog() {
    showCriarTemaModal(
      context: context,
      topicoId: widget.topicoId,
      onSuccess: (novoTema) {
        setState(() {
          temas.insert(0, novoTema);
        });
        AppUtils.showSuccess(context, 'Tema criado com sucesso!');
      },
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
          title: Text('Conversas'),
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
              Text('A carregar tópico...'),
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
                'Erro ao carregar conversas',
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
        title: Text('Conversas'),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
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
            // Header do tópico
            if (topico != null) _buildTopicoHeader(),

            // Filtros e botão criar tema
            _buildFiltrosContainer(),

            // Lista de temas
            Expanded(
              child: temas.isEmpty ? _buildEmptyState() : _buildTemasList(),
            ),

            // Paginação
            if (totalPaginas > 1) _buildPaginacao(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopicoHeader() {
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
        children: [
          Text(
            'Categoria: ${topico!['categoria']?['nome'] ?? 'Não disponível'}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            topico!['titulo'] ?? 'Sem título',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF333333),
            ),
            textAlign: TextAlign.center,
          ),
          if (topico!['descricao'] != null) ...[
            SizedBox(height: 8),
            Text(
              topico!['descricao'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
          SizedBox(height: 8),
          Text(
            'Data: ${_formatarData(topico!['data_criacao'])}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltrosContainer() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
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
        children: [
          // Filtros
          Row(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFiltroButton('Recentes', 'recentes'),
                      SizedBox(width: 8),
                      _buildFiltroButton('Likes', 'likes'),
                      SizedBox(width: 8),
                      _buildFiltroButton('Deslikes', 'dislikes'),
                      SizedBox(width: 8),
                      _buildFiltroButton('Mais Comentados', 'comentarios'),
                    ],
                  ),
                ),
              ),
            ],
          ),

          SizedBox(height: 12),

          // Botão criar tema
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showCriarTemaDialog,
              icon: Icon(Icons.add),
              label: Text('Criar Tema'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF4CAF50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltroButton(String label, String value) {
    final isActive = filtro == value;

    return ElevatedButton(
      onPressed: () => _changeFiltro(value),
      style: ElevatedButton.styleFrom(
        backgroundColor: isActive ? Color(0xFF4A90E2) : Color(0xFFF5F5F5),
        foregroundColor: isActive ? Colors.white : Colors.grey[700],
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      child: Text(label, style: TextStyle(fontSize: 14)),
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
            'Ainda não existem temas neste tópico.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Seja o primeiro a criar um tema!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTemasList() {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: 16),
      itemCount: temas.length,
      itemBuilder: (context, index) {
        final tema = temas[index];
        return _buildTemaCard(tema);
      },
    );
  }

  Widget _buildTemaCard(Map<String, dynamic> tema) {
    final temaId = tema['id_tema'];
    final foiDenunciado = tema['foi_denunciado'] == true;

    // ✅ CORRIGIDO: Verificar se existe anexo único (não lista de anexos)
    final anexoUrl = tema['anexo_url'];
    final anexoNome = tema['anexo_nome'];
    final tipoAnexo = tema['tipo_anexo'];

    final temAnexo = anexoUrl != null && anexoUrl.isNotEmpty;

    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: foiDenunciado
            ? BorderSide(color: Colors.red, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => _navegarParaTema(temaId),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header do tema
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: Color(0xFFFF8000),
                    child: Text(
                      (tema['utilizador']?['nome'] ?? 'U')[0].toUpperCase(),
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tema['utilizador']?['nome'] ?? 'Utilizador',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          _formatarData(tema['data_criacao']),
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

              // Conteúdo do tema
              if (tema['titulo'] != null) ...[
                Text(
                  tema['titulo'],
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF333333),
                  ),
                ),
                SizedBox(height: 8),
              ],

              if (tema['texto'] != null) ...[
                Text(
                  tema['texto'],
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF444444),
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 8),
              ],

              // ✅ ANEXO ÚNICO DO TEMA - CORRIGIDO PARA MOSTRAR IMAGENS
              if (temAnexo) ...[
                _buildAnexoTema(
                    anexoUrl!, anexoNome ?? 'Anexo', tipoAnexo ?? 'arquivo'),
                SizedBox(height: 8),
              ],

              // Ações
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      _buildAcaoButton(
                        icon: Icons.thumb_up,
                        count: tema['likes'] ?? 0,
                        isActive: avaliacoes[temaId] == 'like',
                        onPressed: () => _avaliarTema(temaId, 'like'),
                      ),
                      SizedBox(width: 12),
                      _buildAcaoButton(
                        icon: Icons.thumb_down,
                        count: tema['dislikes'] ?? 0,
                        isActive: avaliacoes[temaId] == 'dislike',
                        onPressed: () => _avaliarTema(temaId, 'dislike'),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      _buildAcaoButton(
                        icon: Icons.comment,
                        count: tema['comentarios'] ?? 0,
                        onPressed: () => _navegarParaTema(temaId),
                      ),
                      SizedBox(width: 8),
                      // Indicador de anexo
                      if (temAnexo)
                        Container(
                          padding:
                              EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Color(0xFF4A90E2).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.attach_file,
                            size: 12,
                            color: Color(0xFF4A90E2),
                          ),
                        ),
                      SizedBox(width: 8),
                      IconButton(
                        onPressed:
                            foiDenunciado ? null : () => _denunciarTema(temaId),
                        icon: Icon(
                          Icons.flag,
                          color: foiDenunciado ? Colors.red : Colors.grey[600],
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ✅ NOVO WIDGET PARA MOSTRAR ANEXO DO TEMA
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
                      SizedBox(height: 4),
                      Text(fullUrl,
                          style:
                              TextStyle(color: Colors.grey[500], fontSize: 10)),
                    ],
                  ),
                ),
              ),
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  height: 200,
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
                          SizedBox(height: 8),
                          Text(imageUrl,
                              style: TextStyle(
                                  color: Colors.grey[400], fontSize: 12)),
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

  // ✅ FUNÇÃO AUXILIAR PARA OBTER ÍCONE DO TIPO DE ANEXO
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

  Widget _buildAcaoButton({
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
              size: 16,
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

  Widget _buildPaginacao() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: pagina > 1 ? () => _changePagina(pagina - 1) : null,
            icon: Icon(Icons.chevron_left),
          ),
          Text(
            'Página $pagina de $totalPaginas',
            style: TextStyle(fontSize: 14),
          ),
          IconButton(
            onPressed:
                pagina < totalPaginas ? () => _changePagina(pagina + 1) : null,
            icon: Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
