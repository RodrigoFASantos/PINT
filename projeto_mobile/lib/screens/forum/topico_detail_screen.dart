import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';
import 'chat_conversas_screen.dart';

class TopicoDetailScreen extends StatefulWidget {
  final int topicoId;

  const TopicoDetailScreen({Key? key, required this.topicoId})
      : super(key: key);

  @override
  State<TopicoDetailScreen> createState() => _TopicoDetailScreenState();
}

class _TopicoDetailScreenState extends State<TopicoDetailScreen> {
  final ApiService _apiService = ApiService();
  dynamic _topico;
  List<dynamic> _comentarios = [];
  bool _loading = true;
  int? _userId;

  @override
  void initState() {
    super.initState();
    _carregarDetalhes();
  }

  Future<void> _carregarDetalhes() async {
    try {
      final futures = await Future.wait([
        _apiService.get('/forum/topico/${widget.topicoId}'),
        _apiService.get('/forum/topico/${widget.topicoId}/comentarios'),
        _apiService.get('/users/perfil'),
      ]);

      setState(() {
        _topico = futures[0];
        _comentarios = futures[1] ?? [];
        _userId = futures[2]['id'];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _mostrarErro('Erro ao carregar detalhes: $e');
    }
  }

  void _mostrarErro(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensagem),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _navegarParaChat() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatConversasScreen(topicoId: widget.topicoId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Detalhes do Tópico'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_topico == null) {
      return const Center(
        child: Text('Tópico não encontrado'),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho do tópico
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.medium),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Breadcrumb
                Text(
                  '${_topico['categoria'] ?? 'Categoria'} > ${_topico['area'] ?? 'Área'}',
                  style: AppTextStyles.bodySmall,
                ),
                const SizedBox(height: AppSpacing.sm),

                // Título
                Text(
                  _topico['titulo'] ?? 'Tópico sem título',
                  style: AppTextStyles.headline1,
                ),
                const SizedBox(height: AppSpacing.sm),

                // Meta informações
                Row(
                  children: [
                    Text(
                      'Por: ${_topico['criador']?['nome'] ?? 'Utilizador'}',
                      style: AppTextStyles.labelLarge,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Text(
                      _formatarData(_topico['dataCriacao']),
                      style: AppTextStyles.labelLarge,
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.md),

          // Descrição do tópico
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.medium),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _topico['descricao'] ?? 'Sem descrição disponível',
                  style: AppTextStyles.bodyLarge,
                ),

                // Anexos
                if (_topico['anexos'] != null &&
                    (_topico['anexos'] as List).isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: AppSpacing.lg),
                      const Divider(),
                      const SizedBox(height: AppSpacing.md),
                      Text('Anexos:', style: AppTextStyles.headline4),
                      const SizedBox(height: AppSpacing.sm),
                      ...(_topico['anexos'] as List).map(
                        (anexo) => InkWell(
                          onTap: () => _abrirAnexo(anexo['url']),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.attachment,
                                    color: AppColors.primary),
                                const SizedBox(width: AppSpacing.sm),
                                Text(
                                  anexo['nome'] ?? 'Anexo',
                                  style: AppTextStyles.link,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.md),

          // Botão para ir para conversas
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _navegarParaChat,
              icon: const Icon(Icons.chat),
              label: const Text('Ver Conversas'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Comentários (se existirem)
          if (_comentarios.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.medium),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Comentários (${_comentarios.length})',
                    style: AppTextStyles.headline3,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _comentarios.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final comentario = _comentarios[index];
                      return _buildComentarioItem(comentario);
                    },
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildComentarioItem(Map<String, dynamic> comentario) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: comentario['autor']?['foto_perfil'] != null
                    ? NetworkImage(comentario['autor']['foto_perfil'])
                    : null,
                child: comentario['autor']?['foto_perfil'] == null
                    ? const Icon(Icons.person, size: 16)
                    : null,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comentario['autor']?['nome'] ?? 'Utilizador',
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
          Text(
            comentario['texto'] ?? '',
            style: AppTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }

  void _abrirAnexo(String? url) {
    if (url == null) return;
    // Implementar abertura de anexo
    // Pode usar url_launcher para abrir URLs
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data não disponível';
    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year} ${data.hour.toString().padLeft(2, '0')}:${data.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Data inválida';
    }
  }
}
