import 'package:flutter/material.dart';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class TopicosChatScreen extends StatefulWidget {
  final int topicoId;
  final int temaId;

  const TopicosChatScreen({
    Key? key,
    required this.topicoId,
    required this.temaId,
  }) : super(key: key);

  @override
  State<TopicosChatScreen> createState() => _TopicosChatScreenState();
}

class _TopicosChatScreenState extends State<TopicosChatScreen> {
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _comentarioController = TextEditingController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<dynamic> _comentarios = [];
  dynamic _topico;
  dynamic _tema;
  dynamic _usuario;
  bool _loading = true;
  String? _erro;

  // Anexos
  File? _anexoFile;
  String? _anexoTipo;
  String? _anexoPreview;

  // Avaliações
  Map<int, String> _avaliacoes = {};

  @override
  void initState() {
    super.initState();
    _carregarDados();
    _inicializarSocket();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _comentarioController.dispose();
    _socketService.leaveTema(widget.temaId);
    super.dispose();
  }

  void _inicializarSocket() {
    _socketService.joinTema(widget.temaId);

    _socketService.on('novoComentario', (comentario) {
      setState(() {
        _comentarios.add(comentario);
      });
      _rolarParaFinal();
    });
  }

  Future<void> _carregarDados() async {
    try {
      final futures = await Future.wait([
        _apiService.getUserProfile(),
        _apiService.getTopico(widget.topicoId),
        _apiService.getTema(widget.temaId),
        _apiService.getComentariosTema(widget.temaId),
      ]);

      setState(() {
        _usuario = futures[0];
        _topico = futures[1]['data'];
        _tema = futures[2]['data'];
        _comentarios = futures[3]['data'] ?? [];
        _loading = false;
      });

      _rolarParaFinal();
    } catch (e) {
      setState(() {
        _erro = 'Erro ao carregar dados: $e';
        _loading = false;
      });
    }
  }

  void _rolarParaFinal() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _selecionarAnexo() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text('Foto'),
              onTap: () {
                Navigator.pop(context);
                _selecionarImagem(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Câmara'),
              onTap: () {
                Navigator.pop(context);
                _selecionarImagem(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text('Ficheiro'),
              onTap: () {
                Navigator.pop(context);
                _selecionarFicheiro();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selecionarImagem(ImageSource source) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: source);

    if (image != null) {
      setState(() {
        _anexoFile = File(image.path);
        _anexoTipo = 'imagem';
        _anexoPreview = image.path;
      });
    }
  }

  Future<void> _selecionarFicheiro() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'mp4', 'avi', 'mov'],
    );

    if (result != null) {
      final file = File(result.files.single.path!);
      final extension = result.files.single.extension?.toLowerCase();

      setState(() {
        _anexoFile = file;
        _anexoPreview = result.files.single.name;

        if (['mp4', 'avi', 'mov'].contains(extension)) {
          _anexoTipo = 'video';
        } else {
          _anexoTipo = 'file';
        }
      });
    }
  }

  void _cancelarAnexo() {
    setState(() {
      _anexoFile = null;
      _anexoTipo = null;
      _anexoPreview = null;
    });
  }

  Future<void> _enviarComentario() async {
    final texto = _comentarioController.text.trim();

    if (texto.isEmpty && _anexoFile == null) {
      _mostrarErro('É necessário fornecer texto ou anexo para o comentário');
      return;
    }

    try {
      Map<String, dynamic> data = {'texto': texto};

      final response = await _apiService.criarComentario(
        widget.temaId,
        data,
        anexo: _anexoFile,
      );

      // Se o socket não estiver funcionando, adicionar manualmente
      if (!_socketService.isConnected) {
        setState(() {
          _comentarios.add(response['data']);
        });
        _rolarParaFinal();
      }

      // Limpar campos
      _comentarioController.clear();
      _cancelarAnexo();
    } catch (e) {
      _mostrarErro('Não foi possível enviar o comentário: $e');
    }
  }

  Future<void> _avaliarComentario(int comentarioId, String tipo) async {
    try {
      // Atualizar estado local para feedback imediato
      setState(() {
        final index =
            _comentarios.indexWhere((c) => c['id_comentario'] == comentarioId);

        if (index != -1) {
          final comentario = _comentarios[index];
          final jaAvaliado = _avaliacoes[comentarioId] == tipo;
          final tipoAnterior = _avaliacoes[comentarioId];

          if (jaAvaliado) {
            _avaliacoes.remove(comentarioId);
            if (tipo == 'like') {
              comentario['likes'] = (comentario['likes'] ?? 0) - 1;
            } else {
              comentario['dislikes'] = (comentario['dislikes'] ?? 0) - 1;
            }
          } else {
            _avaliacoes[comentarioId] = tipo;
            if (tipo == 'like') {
              comentario['likes'] = (comentario['likes'] ?? 0) + 1;
              if (tipoAnterior == 'dislike') {
                comentario['dislikes'] = (comentario['dislikes'] ?? 0) - 1;
              }
            } else {
              comentario['dislikes'] = (comentario['dislikes'] ?? 0) + 1;
              if (tipoAnterior == 'like') {
                comentario['likes'] = (comentario['likes'] ?? 0) - 1;
              }
            }
          }
        }
      });

      await _apiService.avaliarComentario(comentarioId, tipo);
    } catch (e) {
      _mostrarErro('Erro ao avaliar comentário: $e');
    }
  }

  Future<void> _denunciarComentario(int comentarioId) async {
    final motivo = await _mostrarDialogoMotivo();
    if (motivo == null || motivo.isEmpty) return;

    try {
      await _apiService.denunciarComentario(comentarioId, motivo);

      setState(() {
        final index =
            _comentarios.indexWhere((c) => c['id_comentario'] == comentarioId);
        if (index != -1) {
          _comentarios[index]['foi_denunciado'] = true;
        }
      });

      _mostrarSucesso(
          'Comentário denunciado com sucesso. Obrigado pela sua contribuição.');
    } catch (e) {
      _mostrarErro('Erro ao denunciar comentário: $e');
    }
  }

  Future<String?> _mostrarDialogoMotivo() async {
    final controller = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Denunciar Comentário'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Motivo da denúncia',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Denunciar'),
          ),
        ],
      ),
    );
  }

  void _mostrarErro(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensagem), backgroundColor: AppColors.error),
    );
  }

  void _mostrarSucesso(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensagem), backgroundColor: AppColors.success),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          title: Text('Chat do Tema'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_erro != null) {
      return Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          title: Text('Chat do Tema'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Ocorreu um erro', style: AppTextStyles.headline3),
              const SizedBox(height: AppSpacing.sm),
              Text(_erro!, style: AppTextStyles.bodyMedium),
              const SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Voltar'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(), // ✅ CORRIGIDO
      appBar: AppBar(
        title: Text('Chat do Tema'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      backgroundColor: AppColors.background,
      body: _buildChatContent(),
    );
  }

  Widget _buildChatContent() {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Cabeçalho do chat
          if (_tema != null) _buildChatHeader(),

          // Lista de comentários
          Expanded(child: _buildComentariosList()),

          // Área de input
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildChatHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppRadius.large),
          topRight: Radius.circular(AppRadius.large),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            _tema['titulo'] ?? 'Tema sem título',
            style: AppTextStyles.headline2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            _tema['texto'] ?? 'Sem descrição',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),

          // Anexo do tema
          if (_tema['anexo_url'] != null) _buildAnexo(_tema),

          const SizedBox(height: AppSpacing.md),

          // Meta informações
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Text(
                'Por: ${_tema['utilizador']?['nome'] ?? 'Não disponível'}',
                style: AppTextStyles.labelMedium,
              ),
              Text(
                'Data: ${_formatarData(_tema['data_criacao'])}',
                style: AppTextStyles.labelMedium,
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.sm),

          // Estatísticas do tema
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildEstatistica(Icons.thumb_up, _tema['likes'] ?? 0),
              _buildEstatistica(Icons.thumb_down, _tema['dislikes'] ?? 0),
              _buildEstatistica(Icons.comment, _tema['comentarios'] ?? 0),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEstatistica(IconData icon, int valor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          valor.toString(),
          style: AppTextStyles.labelSmall,
        ),
      ],
    );
  }

  Widget _buildComentariosList() {
    if (_comentarios.isEmpty) {
      return const Center(
        child: Text(
          'Nenhum comentário ainda. Seja o primeiro a comentar!',
          style: AppTextStyles.bodyMedium,
          textAlign: TextAlign.center,
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView.separated(
        controller: _scrollController,
        itemCount: _comentarios.length,
        separatorBuilder: (context, index) =>
            const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          final comentario = _comentarios[index];
          return _buildComentarioCard(comentario);
        },
      ),
    );
  }

  Widget _buildComentarioCard(dynamic comentario) {
    final comentarioId = comentario['id_comentario'];
    final isAutor = comentario['id_utilizador'] ==
        (_usuario?['id_utilizador'] ?? _usuario?['id']);

    return Container(
      margin: EdgeInsets.only(
        left: isAutor ? 50 : 0,
        right: isAutor ? 0 : 50,
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isAutor ? AppColors.primary.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(
            color: comentario['foi_denunciado']
                ? AppColors.error
                : AppColors.border,
            width: comentario['foi_denunciado'] ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cabeçalho do comentário
            Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundImage:
                      comentario['utilizador']?['foto_perfil'] != null
                          ? NetworkImage(_getAvatarUrl(
                              comentario['utilizador']['foto_perfil']))
                          : null,
                  child: comentario['utilizador']?['foto_perfil'] == null
                      ? const Icon(Icons.person, size: 14)
                      : null,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        comentario['utilizador']?['nome'] ?? 'Utilizador',
                        style: AppTextStyles.labelLarge,
                      ),
                      Text(
                        _formatarData(comentario['data_criacao']),
                        style: AppTextStyles.labelSmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.sm),

            // Conteúdo do comentário
            if (comentario['texto'] != null && comentario['texto'].isNotEmpty)
              Text(
                comentario['texto'],
                style: AppTextStyles.bodyMedium,
              ),

            // Anexo do comentário
            if (comentario['anexo_url'] != null) _buildAnexo(comentario),

            const SizedBox(height: AppSpacing.sm),

            // Ações do comentário
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _buildAcaoComentario(
                      icon: Icons.thumb_up,
                      count: comentario['likes'] ?? 0,
                      isActive: _avaliacoes[comentarioId] == 'like',
                      onPressed: () => _avaliarComentario(comentarioId, 'like'),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildAcaoComentario(
                      icon: Icons.thumb_down,
                      count: comentario['dislikes'] ?? 0,
                      isActive: _avaliacoes[comentarioId] == 'dislike',
                      onPressed: () =>
                          _avaliarComentario(comentarioId, 'dislike'),
                    ),
                  ],
                ),
                if (!comentario['foi_denunciado'])
                  IconButton(
                    onPressed: () => _denunciarComentario(comentarioId),
                    icon: const Icon(Icons.flag, size: 16),
                    color: AppColors.textSecondary,
                    tooltip: 'Denunciar',
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAcaoComentario({
    required IconData icon,
    required int count,
    required bool isActive,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: 4,
        ),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withOpacity(0.1) : null,
          borderRadius: BorderRadius.circular(AppRadius.small),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              count.toString(),
              style: AppTextStyles.labelSmall.copyWith(
                color: isActive ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnexo(dynamic item) {
    final anexoUrl = item['anexo_url'];
    final tipoAnexo = item['tipo_anexo'];

    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.sm),
      child: tipoAnexo == 'imagem'
          ? ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.medium),
              child: Image.network(
                _getNormalizedUrl(anexoUrl),
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) =>
                    const Icon(Icons.broken_image, size: 50),
              ),
            )
          : Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(AppRadius.small),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Icon(
                    tipoAnexo == 'video' ? Icons.video_file : Icons.attach_file,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      item['anexo_nome'] ?? 'Anexo',
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppRadius.large),
          bottomRight: Radius.circular(AppRadius.large),
        ),
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          // Preview do anexo
          if (_anexoFile != null) _buildAnexoPreview(),

          // Input de texto e botões
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _comentarioController,
                  decoration: const InputDecoration(
                    hintText: 'Escreva um comentário...',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                  ),
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _enviarComentario(),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),

              // Botão anexo
              IconButton(
                onPressed: _selecionarAnexo,
                icon: const Icon(Icons.attach_file),
                tooltip: 'Anexar ficheiro',
              ),

              // Botão enviar
              IconButton(
                onPressed: _enviarComentario,
                icon: const Icon(Icons.send),
                color: AppColors.primary,
                tooltip: 'Enviar comentário',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnexoPreview() {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(AppRadius.small),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          if (_anexoTipo == 'imagem')
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.small),
              child: Image.file(
                _anexoFile!,
                width: 50,
                height: 50,
                fit: BoxFit.cover,
              ),
            )
          else
            Icon(
              _anexoTipo == 'video' ? Icons.video_file : Icons.attach_file,
              color: AppColors.primary,
            ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              _anexoPreview ?? 'Anexo',
              style: AppTextStyles.bodyMedium,
            ),
          ),
          IconButton(
            onPressed: _cancelarAnexo,
            icon: const Icon(Icons.close, color: AppColors.error),
            tooltip: 'Remover anexo',
          ),
        ],
      ),
    );
  }

  String _getAvatarUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    return '${ApiService.baseUrl.split('/api')[0]}/$url';
  }

  String _getNormalizedUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    return '${ApiService.baseUrl.split('/api')[0]}/$url';
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data indisponível';
    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year} ${data.hour.toString().padLeft(2, '0')}:${data.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Data inválida';
    }
  }
}
