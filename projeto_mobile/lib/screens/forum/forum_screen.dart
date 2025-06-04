import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class ForumScreen extends StatefulWidget {
  const ForumScreen({Key? key}) : super(key: key);

  @override
  State<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final ApiService _apiService = ApiService();

  List<dynamic> _categorias = [];
  Map<int, bool> _categoriasExpandidas = {};
  Map<int, List<dynamic>> _categoriasTopicos = {};
  Map<int, bool> _loadingTopicos = {};
  bool _loading = true;
  int? _userRole;

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    try {
      final categoriasResponse = await ApiService.getCategorias();
      final userResponse = await _apiService.getUserProfile();

      setState(() {
        _categorias = categoriasResponse;
        _userRole = userResponse['id_cargo'];

        // Inicializar estado das categorias
        for (var categoria in _categorias) {
          final catId = categoria['id_categoria'] ?? categoria['id'];
          _categoriasExpandidas[catId] = false;
        }

        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _mostrarErro('Erro ao carregar dados: $e');
    }
  }

  Future<void> _toggleCategoria(int categoriaId) async {
    setState(() {
      _categoriasExpandidas[categoriaId] =
          !(_categoriasExpandidas[categoriaId] ?? false);
    });

    if (_categoriasExpandidas[categoriaId]! &&
        _categoriasTopicos[categoriaId] == null) {
      await _carregarTopicosCategoria(categoriaId);
    }
  }

  Future<void> _carregarTopicosCategoria(int categoriaId) async {
    setState(() {
      _loadingTopicos[categoriaId] = true;
    });

    try {
      final response =
          await _apiService.get('/topicos-area/categoria/$categoriaId');
      setState(() {
        _categoriasTopicos[categoriaId] = response['data'] ?? [];
        _loadingTopicos[categoriaId] = false;
      });
    } catch (e) {
      setState(() {
        _loadingTopicos[categoriaId] = false;
      });
      _mostrarErro('Erro ao carregar tópicos: $e');
    }
  }

  void _criarTopico(dynamic categoria) {
    if (_userRole == 1 || _userRole == 2) {
      _mostrarModalCriarTopico(categoria);
    } else {
      _mostrarModalSolicitarTopico(categoria);
    }
  }

  void _mostrarModalCriarTopico(dynamic categoria) {
    showDialog(
      context: context,
      builder: (context) => _CriarTopicoModal(
        categoria: categoria,
        onSuccess: (novoTopico) {
          _carregarTopicosCategoria(
              categoria['id_categoria'] ?? categoria['id']);
        },
      ),
    );
  }

  void _mostrarModalSolicitarTopico(dynamic categoria) {
    showDialog(
      context: context,
      builder: (context) => _SolicitarTopicoModal(
        categoria: categoria,
        onSuccess: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Solicitação enviada com sucesso! O administrador irá analisar o seu pedido.'),
              backgroundColor: AppColors.success,
            ),
          );
        },
      ),
    );
  }

  void _navegarParaTopico(int topicoId) {
    Navigator.pushNamed(context, '/forum/topico/$topicoId');
  }

  void _mostrarErro(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensagem),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Fórum'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _carregarDados,
          ),
        ],
      ),
      backgroundColor: AppColors.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildForumContent(),
    );
  }

  Widget _buildForumContent() {
    if (_categorias.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.forum, size: 64, color: Colors.grey),
            SizedBox(height: AppSpacing.md),
            Text(
              'Nenhuma categoria de fórum disponível',
              style: AppTextStyles.bodyLarge,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppSpacing.md),
            ElevatedButton(
              onPressed: _carregarDados,
              child: Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Fórum de Partilha de Conhecimento',
                  style: AppTextStyles.headline1,
                ),
                SizedBox(height: AppSpacing.sm),
                Text(
                  'Explore tópicos, partilhe conhecimento e conecte-se com outros utilizadores.',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Lista de categorias
          ListView.separated(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: _categorias.length,
            separatorBuilder: (context, index) =>
                const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final categoria = _categorias[index];
              final categoriaId = categoria['id_categoria'] ?? categoria['id'];

              return _buildCategoriaItem(categoria, categoriaId);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriaItem(dynamic categoria, int categoriaId) {
    final isExpanded = _categoriasExpandidas[categoriaId] ?? false;
    final topicos = _categoriasTopicos[categoriaId] ?? [];
    final isLoading = _loadingTopicos[categoriaId] ?? false;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          // Cabeçalho da categoria
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _toggleCategoria(categoriaId),
                    child: Row(
                      children: [
                        Icon(
                          isExpanded
                              ? Icons.keyboard_arrow_down
                              : Icons.keyboard_arrow_right,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                categoria['nome'] ?? 'Categoria sem nome',
                                style: AppTextStyles.headline3,
                              ),
                              if (categoria['descricao'] != null) ...[
                                SizedBox(height: 4),
                                Text(
                                  categoria['descricao'],
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: Colors.grey[600],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => _criarTopico(categoria),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                  ),
                  child: Text(
                    _userRole == 1 || _userRole == 2
                        ? 'Criar Tópico'
                        : 'Solicitar Tópico',
                    style: AppTextStyles.button.copyWith(fontSize: 14),
                  ),
                ),
              ],
            ),
          ),

          // Conteúdo da categoria (tópicos)
          if (isExpanded) _buildCategoriaContent(topicos, isLoading),
        ],
      ),
    );
  }

  Widget _buildCategoriaContent(List<dynamic> topicos, bool isLoading) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius:
            BorderRadius.vertical(bottom: Radius.circular(AppRadius.medium)),
      ),
      child: isLoading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.lg),
                child: CircularProgressIndicator(),
              ),
            )
          : topicos.isEmpty
              ? Container(
                  padding: EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    children: [
                      Icon(Icons.topic, size: 48, color: Colors.grey[400]),
                      SizedBox(height: AppSpacing.sm),
                      Text(
                        'Não há tópicos nesta categoria ainda.',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.grey[600],
                          fontStyle: FontStyle.italic,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: AppSpacing.sm),
                      Text(
                        'Seja o primeiro a criar um tópico!',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: Colors.grey[500],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:
                        MediaQuery.of(context).size.width > 600 ? 2 : 1,
                    crossAxisSpacing: AppSpacing.md,
                    mainAxisSpacing: AppSpacing.md,
                    childAspectRatio:
                        MediaQuery.of(context).size.width > 600 ? 2.5 : 3,
                  ),
                  itemCount: topicos.length,
                  itemBuilder: (context, index) {
                    final topico = topicos[index];
                    return _buildTopicoCard(topico);
                  },
                ),
    );
  }

  Widget _buildTopicoCard(dynamic topico) {
    return InkWell(
      onTap: () => _navegarParaTopico(topico['id_topico']),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              topico['titulo'] ?? 'Tópico sem título',
              style: AppTextStyles.headline4.copyWith(color: AppColors.primary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.sm),
            Expanded(
              child: Text(
                topico['descricao'] ?? 'Sem descrição',
                style: AppTextStyles.bodyMedium,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Por: ${topico['criador']?['nome'] ?? 'Utilizador'}',
                    style: AppTextStyles.labelMedium,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  _formatarData(topico['data_criacao']),
                  style: AppTextStyles.labelMedium,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data indisponível';
    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
    } catch (e) {
      return 'Data inválida';
    }
  }
}

// Modal para criar tópico
class _CriarTopicoModal extends StatefulWidget {
  final dynamic categoria;
  final Function(dynamic) onSuccess;

  const _CriarTopicoModal({
    required this.categoria,
    required this.onSuccess,
  });

  @override
  State<_CriarTopicoModal> createState() => _CriarTopicoModalState();
}

class _CriarTopicoModalState extends State<_CriarTopicoModal> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _descricaoController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _loading = false;

  @override
  void dispose() {
    _tituloController.dispose();
    _descricaoController.dispose();
    super.dispose();
  }

  Future<void> _criarTopico() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final response = await _apiService.post('/topicos-area', {
        'id_categoria':
            widget.categoria['id_categoria'] ?? widget.categoria['id'],
        'titulo': _tituloController.text,
        'descricao': _descricaoController.text,
      });

      widget.onSuccess(response['data']);
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tópico criado com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao criar tópico: $e'),
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
                  Text('Criar Novo Tópico', style: AppTextStyles.headline3),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.small),
                ),
                child: Text(
                  'Categoria: ${widget.categoria['nome']}',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _tituloController,
                decoration: const InputDecoration(
                  labelText: 'Título do Tópico',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'O título é obrigatório';
                  }
                  if (value.trim().length < 5) {
                    return 'O título deve ter pelo menos 5 caracteres';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descricaoController,
                decoration: const InputDecoration(
                  labelText: 'Descrição',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                  hintText: 'Descreva o seu tópico...',
                ),
                maxLines: 4,
                validator: (value) {
                  if (value != null &&
                      value.trim().isNotEmpty &&
                      value.trim().length < 10) {
                    return 'A descrição deve ter pelo menos 10 caracteres';
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
                    onPressed: _loading ? null : _criarTopico,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Criar Tópico'),
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

// Modal para solicitar tópico
class _SolicitarTopicoModal extends StatefulWidget {
  final dynamic categoria;
  final VoidCallback onSuccess;

  const _SolicitarTopicoModal({
    required this.categoria,
    required this.onSuccess,
  });

  @override
  State<_SolicitarTopicoModal> createState() => _SolicitarTopicoModalState();
}

class _SolicitarTopicoModalState extends State<_SolicitarTopicoModal> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _justificacaoController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _loading = false;

  @override
  void dispose() {
    _tituloController.dispose();
    _descricaoController.dispose();
    _justificacaoController.dispose();
    super.dispose();
  }

  Future<void> _solicitarTopico() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      await _apiService.post('/topicos-area/solicitar', {
        'id_categoria':
            widget.categoria['id_categoria'] ?? widget.categoria['id'],
        'titulo': _tituloController.text,
        'descricao': _descricaoController.text,
        'justificacao': _justificacaoController.text,
      });

      widget.onSuccess();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao solicitar tópico: $e'),
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
                  Text('Solicitar Novo Tópico', style: AppTextStyles.headline3),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.small),
                  border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Text(
                      'Categoria: ${widget.categoria['nome']}',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.warning,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'A sua solicitação será analisada por um administrador.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: Colors.grey[600],
                        fontStyle: FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _tituloController,
                decoration: const InputDecoration(
                  labelText: 'Título do Tópico',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.title),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'O título é obrigatório';
                  }
                  if (value.trim().length < 5) {
                    return 'O título deve ter pelo menos 5 caracteres';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descricaoController,
                decoration: const InputDecoration(
                  labelText: 'Descrição (opcional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.description),
                  hintText: 'Descreva o tópico proposto...',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _justificacaoController,
                decoration: const InputDecoration(
                  labelText: 'Justificação',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.comment),
                  hintText: 'Por que este tópico é importante?',
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'A justificação é obrigatória';
                  }
                  if (value.trim().length < 20) {
                    return 'A justificação deve ter pelo menos 20 caracteres';
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
                    onPressed: _loading ? null : _solicitarTopico,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.warning,
                      foregroundColor: Colors.white,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Enviar Solicitação'),
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
