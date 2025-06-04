import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class FormadoresListScreen extends StatefulWidget {
  @override
  _FormadoresListScreenState createState() => _FormadoresListScreenState();
}

class _FormadoresListScreenState extends State<FormadoresListScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _formadores = [];
  bool _loading = true;
  String? _error;
  String _searchQuery = '';
  int _currentPage = 1;
  int _totalPages = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _carregarFormadores();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _carregarFormadores({bool reset = false}) async {
    if (reset) {
      setState(() {
        _currentPage = 1;
        _formadores.clear();
        _hasMore = true;
      });
    }

    try {
      setState(() => _loading = true);

      final response = await ApiService().getFormadores(
        page: _currentPage,
        limit: 10,
      );

      setState(() {
        if (reset) {
          _formadores = response['data'] ?? [];
        } else {
          _formadores.addAll(response['data'] ?? []);
        }

        _totalPages = response['pagination']?['totalPages'] ?? 1;
        _hasMore = _currentPage < _totalPages;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar formadores';
        _loading = false;
      });
    }
  }

  Future<void> _carregarMais() async {
    if (!_hasMore || _loading) return;

    setState(() => _currentPage++);
    await _carregarFormadores();
  }

  List<dynamic> get _formadoresFiltrados {
    if (_searchQuery.isEmpty) return _formadores;

    return _formadores.where((formador) {
      final nome = formador['nome']?.toLowerCase() ?? '';
      final email = formador['email']?.toLowerCase() ?? '';
      final especialidade = formador['especialidade']?.toLowerCase() ?? '';
      final query = _searchQuery.toLowerCase();

      return nome.contains(query) ||
          email.contains(query) ||
          especialidade.contains(query);
    }).toList();
  }

  void _abrirFormador(int formadorId) {
    Navigator.pushNamed(context, '/formadores/$formadorId');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Formadores'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => _carregarFormadores(reset: true),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _carregarFormadores(reset: true),
        child: Column(
          children: [
            // Barra de pesquisa
            _buildSearchBar(),

            // Lista de formadores
            Expanded(child: _buildContent()),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Pesquisar formadores...',
          prefixIcon: Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        onChanged: (value) {
          setState(() => _searchQuery = value);
        },
      ),
    );
  }

  Widget _buildContent() {
    if (_loading && _formadores.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: AppSpacing.md),
            Text('Carregando formadores...'),
          ],
        ),
      );
    }

    if (_error != null && _formadores.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: AppColors.error, size: 64),
            SizedBox(height: AppSpacing.md),
            Text(_error!),
            SizedBox(height: AppSpacing.md),
            ElevatedButton(
              onPressed: () => _carregarFormadores(reset: true),
              child: Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }

    final formadoresFiltrados = _formadoresFiltrados;

    if (formadoresFiltrados.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: Colors.grey[400],
            ),
            SizedBox(height: AppSpacing.md),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Nenhum formador encontrado para "$_searchQuery".'
                  : 'Nenhum formador disponível no momento.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification scrollInfo) {
        if (!_loading &&
            _hasMore &&
            scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent) {
          _carregarMais();
        }
        return false;
      },
      child: ListView.builder(
        padding: EdgeInsets.all(AppSpacing.md),
        itemCount: formadoresFiltrados.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == formadoresFiltrados.length) {
            // Loading indicator para paginação
            return Container(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            );
          }

          final formador = formadoresFiltrados[index];
          return _buildFormadorCard(formador);
        },
      ),
    );
  }

  Widget _buildFormadorCard(dynamic formador) {
    final nome = formador['nome'] ?? 'Nome não disponível';
    final email = formador['email'] ?? '';
    final especialidade =
        formador['especialidade'] ?? 'Especialidade não especificada';
    final biografia = formador['biografia'] ?? '';
    final formadorId = formador['id_utilizador'] ?? formador['id'];

    return Container(
      margin: EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _abrirFormador(formadorId),
        borderRadius: BorderRadius.circular(AppRadius.large),
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                child: ClipOval(
                  child: Image.network(
                    ApiService.userAvatar(email),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[300],
                        child: Icon(
                          Icons.person,
                          size: 40,
                          color: Colors.grey[600],
                        ),
                      );
                    },
                  ),
                ),
              ),

              SizedBox(width: AppSpacing.md),

              // Informações
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nome
                    Text(
                      nome,
                      style: AppTextStyles.headline4,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    SizedBox(height: AppSpacing.xs),

                    // Especialidade
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        especialidade,
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    SizedBox(height: AppSpacing.sm),

                    // Email
                    if (email.isNotEmpty) ...[
                      Row(
                        children: [
                          Icon(
                            Icons.email,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              email,
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: AppSpacing.xs),
                    ],

                    // Biografia (se disponível)
                    if (biografia.isNotEmpty)
                      Text(
                        biografia,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              // Seta
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
