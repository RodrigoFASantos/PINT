import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';
import 'topicos_chat_screen.dart';

class ChatConversasScreen extends StatefulWidget {
  final int topicoId;

  const ChatConversasScreen({Key? key, required this.topicoId})
      : super(key: key);

  @override
  State<ChatConversasScreen> createState() => _ChatConversasScreenState();
}

class _ChatConversasScreenState extends State<ChatConversasScreen> {
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();

  dynamic _topico;
  List<dynamic> _temas = [];
  bool _loading = true;
  String _filtro = 'recentes';
  int _pagina = 1;
  int _totalPaginas = 1;
  dynamic _utilizador;
  Map<int, String> _avaliacoes = {};
  Set<int> _temasDenunciados = {};

  @override
  void initState() {
    super.initState();
    _carregarDados();
    _inicializarSocket();
  }

  @override
  void dispose() {
    _socketService.leaveTopic(widget.topicoId);
    super.dispose();
  }

  void _inicializarSocket() {
    _socketService.joinTopic(widget.topicoId);

    _socketService.on('novoTema', (tema) {
      setState(() {
        _temas.insert(0, tema);
      });
    });

    _socketService.on('temaAvaliado', (data) {
      _atualizarAvaliacaoTema(data);
    });

    _socketService.on('temaExcluido', (data) {
      setState(() {
        _temas.removeWhere((tema) => tema['id_tema'] == data['id_tema']);
      });
    });
  }

  Future<void> _carregarDados() async {
    try {
      final futures = await Future.wait([
        _apiService.get('/users/perfil'),
        _apiService.get('/topicos-area/${widget.topicoId}'),
        _apiService.get('/forum-tema/topico/${widget.topicoId}/temas', params: {
          'filtro': _filtro,
          'page': _pagina.toString(),
          'limit': '10'
        }),
        _apiService.get('/denuncias/usuario/denuncias-temas'),
      ]);

      setState(() {
        _utilizador = futures[0];
        _topico = futures[1]['data'];

        final temasResponse = futures[2];
        _temas = temasResponse['data'] ?? [];
        _totalPaginas = temasResponse['pagination']?['totalPages'] ?? 1;

        final denunciasData = futures[3]['data'] ?? [];
        _temasDenunciados = Set<int>.from(denunciasData);

        // Marcar temas denunciados
        _temas = _temas.map((tema) {
          tema['foi_denunciado'] = _temasDenunciados.contains(tema['id_tema']);
          return tema;
        }).toList();

        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _mostrarErro('Erro ao carregar dados: $e');
    }
  }

  void _atualizarAvaliacaoTema(Map<String, dynamic> data) {
    setState(() {
      final index =
          _temas.indexWhere((tema) => tema['id_tema'] == data['id_tema']);
      if (index != -1) {
        _temas[index]['likes'] = data['likes'];
        _temas[index]['dislikes'] = data['dislikes'];
      }
    });
  }

  Future<void> _avaliarTema(int temaId, String tipo) async {
    try {
      // Atualizar estado local para feedback imediato
      setState(() {
        final index = _temas.indexWhere((tema) => tema['id_tema'] == temaId);
        if (index != -1) {
          final tema = _temas[index];
          final jaAvaliado = _avaliacoes[temaId] == tipo;
          final tipoAnterior = _avaliacoes[temaId];

          if (jaAvaliado) {
            _avaliacoes.remove(temaId);
            if (tipo == 'like') {
              tema['likes'] = (tema['likes'] ?? 0) - 1;
            } else {
              tema['dislikes'] = (tema['dislikes'] ?? 0) - 1;
            }
          } else {
            _avaliacoes[temaId] = tipo;
            if (tipo == 'like') {
              tema['likes'] = (tema['likes'] ?? 0) + 1;
              if (tipoAnterior == 'dislike') {
                tema['dislikes'] = (tema['dislikes'] ?? 0) - 1;
              }
            } else {
              tema['dislikes'] = (tema['dislikes'] ?? 0) + 1;
              if (tipoAnterior == 'like') {
                tema['likes'] = (tema['likes'] ?? 0) - 1;
              }
            }
          }
        }
      });

      await _apiService
          .post('/forum-tema/tema/$temaId/avaliar', {'tipo': tipo});
    } catch (e) {
      _mostrarErro('Erro ao avaliar tema: $e');
    }
  }

  Future<void> _denunciarTema(int temaId) async {
    final motivo = await _mostrarDialogoMotivo();
    if (motivo == null || motivo.isEmpty) return;

    try {
      setState(() {
        _temasDenunciados.add(temaId);
        final index = _temas.indexWhere((tema) => tema['id_tema'] == temaId);
        if (index != -1) {
          _temas[index]['foi_denunciado'] = true;
        }
      });

      await _apiService.post('/denuncias/forum-tema/denunciar', {
        'id_tema': temaId,
        'motivo': motivo,
      });

      _mostrarSucesso(
          'Tema denunciado com sucesso. Obrigado pela sua contribuição.');
    } catch (e) {
      setState(() {
        _temasDenunciados.remove(temaId);
        final index = _temas.indexWhere((tema) => tema['id_tema'] == temaId);
        if (index != -1) {
          _temas[index]['foi_denunciado'] = false;
        }
      });
      _mostrarErro('Erro ao denunciar tema: $e');
    }
  }

  Future<void> _apagarTema(int temaId) async {
    final confirmacao = await _mostrarDialogoConfirmacao(
      'Tem certeza de que deseja apagar este tema? Esta ação não pode ser desfeita.',
    );

    if (!confirmacao) return;

    try {
      await _apiService.delete('/forum-tema/tema/$temaId');

      setState(() {
        _temas.removeWhere((tema) => tema['id_tema'] == temaId);
      });

      _mostrarSucesso('Tema apagado com sucesso!');
    } catch (e) {
      _mostrarErro('Erro ao apagar tema: $e');
    }
  }

  void _navegarParaTema(int temaId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TopicosChatScreen(
          topicoId: widget.topicoId,
          temaId: temaId,
        ),
      ),
    );
  }

  Future<String?> _mostrarDialogoMotivo() async {
    final controller = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Denunciar Tema'),
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

  Future<bool> _mostrarDialogoConfirmacao(String mensagem) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Confirmação'),
            content: Text(mensagem),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Confirmar'),
              ),
            ],
          ),
        ) ??
        false;
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

  void _mostrarModalCriarTema() {
    showDialog(
      context: context,
      builder: (context) => _CriarTemaModal(
        topicoId: widget.topicoId,
        onSuccess: (novoTema) {
          setState(() {
            _temas.insert(0, novoTema);
          });
        },
      ),
    );
  }

  bool _podeApagarTema(dynamic tema) {
    if (_utilizador == null) return false;
    return _utilizador['id_cargo'] == 1 ||
        _utilizador['id_utilizador'] == tema['utilizador']?['id_utilizador'];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Conversas do Tópico'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(),
    );
  }

  Widget _buildContent() {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
      ),
      child: Column(
        children: [
          // Cabeçalho do tópico
          if (_topico != null) _buildTopicoHeader(),

          const SizedBox(height: AppSpacing.lg),

          // Filtros e botão criar tema
          _buildFiltrosEAcoes(),

          const SizedBox(height: AppSpacing.md),

          // Lista de temas
          Expanded(child: _buildTemasList()),

          // Paginação
          if (_totalPaginas > 1) _buildPaginacao(),
        ],
      ),
    );
  }

  Widget _buildTopicoHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Categoria: ${_topico['categoria']?['nome'] ?? 'Não disponível'}',
            style: AppTextStyles.labelLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            _topico['titulo'] ?? '',
            style: AppTextStyles.headline2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            _topico['descricao'] ?? '',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Data: ${_formatarData(_topico['data_criacao'])}',
            style: AppTextStyles.labelMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildFiltrosEAcoes() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Filtros
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              _buildFiltroButton('Recentes', 'recentes'),
              _buildFiltroButton('Likes', 'likes'),
              _buildFiltroButton('Deslikes', 'dislikes'),
              _buildFiltroButton('Mais Comentados', 'comentarios'),
            ],
          ),

          const SizedBox(height: AppSpacing.md),

          // Botão criar tema
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _mostrarModalCriarTema,
              icon: const Icon(Icons.add),
              label: const Text('Criar Tema'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltroButton(String texto, String valor) {
    final isActive = _filtro == valor;

    return ElevatedButton(
      onPressed: () {
        setState(() {
          _filtro = valor;
          _pagina = 1;
        });
        _carregarDados();
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: isActive ? AppColors.primary : Colors.white,
        foregroundColor: isActive ? Colors.white : AppColors.textPrimary,
        elevation: isActive ? 2 : 0,
        side: BorderSide(color: AppColors.border),
      ),
      child: Text(texto),
    );
  }

  Widget _buildTemasList() {
    if (_temas.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
            SizedBox(height: AppSpacing.md),
            Text('Ainda não existem temas neste tópico.'),
            SizedBox(height: AppSpacing.sm),
            Text('Seja o primeiro a criar um tema!'),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: _temas.length,
      separatorBuilder: (context, index) =>
          const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        final tema = _temas[index];
        return _buildTemaCard(tema);
      },
    );
  }

  Widget _buildTemaCard(dynamic tema) {
    final temaId = tema['id_tema'];
    final isAutor =
        _utilizador?['id_utilizador'] == tema['utilizador']?['id_utilizador'];

    return InkWell(
      onTap: () => _navegarParaTema(temaId),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(
            color: tema['foi_denunciado'] ? AppColors.error : AppColors.border,
            width: tema['foi_denunciado'] ? 2 : 1,
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
            // Cabeçalho do tema
            Row(
              children: [
                // Avatar e info do utilizador
                CircleAvatar(
                  radius: 16,
                  backgroundImage: tema['utilizador']?['foto_perfil'] != null
                      ? NetworkImage(
                          _getAvatarUrl(tema['utilizador']['foto_perfil']))
                      : null,
                  child: tema['utilizador']?['foto_perfil'] == null
                      ? const Icon(Icons.person, size: 16)
                      : null,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tema['utilizador']?['nome'] ?? 'Utilizador',
                        style: AppTextStyles.labelLarge,
                      ),
                      Text(
                        _formatarData(tema['data_criacao']),
                        style: AppTextStyles.labelSmall,
                      ),
                    ],
                  ),
                ),

                // Botão apagar (se permitido)
                if (_podeApagarTema(tema))
                  IconButton(
                    onPressed: () => _apagarTema(temaId),
                    icon: const Icon(Icons.delete, color: AppColors.error),
                    tooltip: 'Apagar tema',
                  ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // Conteúdo do tema
            if (tema['titulo'] != null)
              Text(
                tema['titulo'],
                style: AppTextStyles.headline4,
              ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              tema['texto'] ?? '',
              style: AppTextStyles.bodyMedium,
            ),

            // Anexo (se existir)
            if (tema['anexo_url'] != null) _buildAnexo(tema),

            const SizedBox(height: AppSpacing.md),

            // Ações do tema
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Like/Dislike
                Row(
                  children: [
                    _buildAcaoButton(
                      icon: Icons.thumb_up,
                      count: tema['likes'] ?? 0,
                      isActive: _avaliacoes[temaId] == 'like',
                      onPressed: () => _avaliarTema(temaId, 'like'),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildAcaoButton(
                      icon: Icons.thumb_down,
                      count: tema['dislikes'] ?? 0,
                      isActive: _avaliacoes[temaId] == 'dislike',
                      onPressed: () => _avaliarTema(temaId, 'dislike'),
                    ),
                  ],
                ),

                // Comentários
                ElevatedButton.icon(
                  onPressed: () => _navegarParaTema(temaId),
                  icon: const Icon(Icons.comment),
                  label: Text('Comentários (${tema['comentarios'] ?? 0})'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.background,
                    foregroundColor: AppColors.textPrimary,
                  ),
                ),

                // Denunciar
                IconButton(
                  onPressed: tema['foi_denunciado']
                      ? null
                      : () => _denunciarTema(temaId),
                  icon: Icon(
                    Icons.flag,
                    color: tema['foi_denunciado']
                        ? AppColors.error
                        : AppColors.textSecondary,
                  ),
                  tooltip:
                      tema['foi_denunciado'] ? 'Já denunciado' : 'Denunciar',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAcaoButton({
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
              size: 16,
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

  Widget _buildAnexo(dynamic tema) {
    final anexoUrl = tema['anexo_url'];
    final tipoAnexo = tema['tipo_anexo'];

    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.sm),
      child: tipoAnexo == 'imagem'
          ? Image.network(
              _getNormalizedUrl(anexoUrl),
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  const Icon(Icons.broken_image),
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
                      tema['anexo_nome'] ?? 'Anexo',
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPaginacao() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _pagina > 1
                ? () {
                    setState(() => _pagina--);
                    _carregarDados();
                  }
                : null,
            icon: const Icon(Icons.chevron_left),
          ),
          Text('Página $_pagina de $_totalPaginas'),
          IconButton(
            onPressed: _pagina < _totalPaginas
                ? () {
                    setState(() => _pagina++);
                    _carregarDados();
                  }
                : null,
            icon: const Icon(Icons.chevron_right),
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

// Modal para criar tema
class _CriarTemaModal extends StatefulWidget {
  final int topicoId;
  final Function(dynamic) onSuccess;

  const _CriarTemaModal({
    required this.topicoId,
    required this.onSuccess,
  });

  @override
  State<_CriarTemaModal> createState() => _CriarTemaModalState();
}

class _CriarTemaModalState extends State<_CriarTemaModal> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _textoController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _loading = false;

  @override
  void dispose() {
    _tituloController.dispose();
    _textoController.dispose();
    super.dispose();
  }

  Future<void> _criarTema() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final response = await _apiService.postFormData('/forum-tema/tema', {
        'id_topico': widget.topicoId.toString(),
        'titulo': _tituloController.text,
        'texto': _textoController.text,
      });

      widget.onSuccess(response['data']);
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tema criado com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao criar tema: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.xl),
      ),
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Criar Novo Tema', style: AppTextStyles.headline3),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              TextFormField(
                controller: _tituloController,
                decoration: const InputDecoration(
                  labelText: 'Título do Tema (opcional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _textoController,
                decoration: const InputDecoration(
                  labelText: 'Texto do Tema',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'O texto é obrigatório';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _loading ? null : () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  ElevatedButton(
                    onPressed: _loading ? null : _criarTema,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Criar Tema'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
