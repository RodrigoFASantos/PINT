import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class AreaFormadorScreen extends StatefulWidget {
  @override
  _AreaFormadorScreenState createState() => _AreaFormadorScreenState();
}

class _AreaFormadorScreenState extends State<AreaFormadorScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late TabController _tabController;

  Map<String, dynamic>? _formadorProfile;
  List<dynamic> _meusCursos = [];
  List<dynamic> _avaliacoesPendentes = [];
  Map<String, dynamic> _estatisticas = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _carregarDados();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _carregarDados() async {
    try {
      setState(() => _loading = true);

      // ✅ CORRIGIDO - Carregar dados na ordem correta
      final formadorProfile = await ApiService.getFormadorProfile();
      final meusCursos = await _carregarMeusCursos();
      final avaliacoesPendentes = await _carregarAvaliacoesPendentes();

      // Carregar estatísticas depois dos cursos estarem disponíveis
      final estatisticas = _calcularEstatisticas(meusCursos);

      setState(() {
        _formadorProfile = formadorProfile;
        _meusCursos = meusCursos;
        _avaliacoesPendentes = avaliacoesPendentes;
        _estatisticas = estatisticas;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar dados da área do formador';
        _loading = false;
      });
    }
  }

  Map<String, dynamic> _calcularEstatisticas(List<dynamic> cursos) {
    try {
      final totalAlunos = cursos.fold<int>(0, (sum, curso) {
        final inscritos = curso['inscritos'];
        if (inscritos is num) {
          return sum + inscritos.toInt();
        }
        return sum;
      });

      final cursosAtivos =
          cursos.where((c) => c['estado'] == 'Em curso').length;

      return {
        'totalCursos': cursos.length,
        'totalAlunos': totalAlunos,
        'avaliacaoMedia': 4.5,
        'cursosAtivos': cursosAtivos,
      };
    } catch (e) {
      return {
        'totalCursos': 0,
        'totalAlunos': 0,
        'avaliacaoMedia': 0.0,
        'cursosAtivos': 0,
      };
    }
  }

  Future<List<dynamic>> _carregarMeusCursos() async {
    try {
      // Simulando endpoint específico para cursos do formador
      final todosCursos = await ApiService.getCursos();

      // Filtrar cursos onde o formador atual está associado
      final userProfile = await ApiService().getUserProfile();
      final formadorId = userProfile['id_utilizador'];

      return todosCursos.where((curso) {
        final formadorCurso = curso['formador'];
        if (formadorCurso != null) {
          final id = formadorCurso['id_utilizador'] ?? formadorCurso['id'];
          return id == formadorId;
        }
        return false;
      }).toList();
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> _carregarAvaliacoesPendentes() async {
    try {
      // Simulando endpoint para avaliações pendentes
      // Na implementação real, seria algo como ApiService().getAvaliacoesPendentes()
      return [];
    } catch (e) {
      return [];
    }
  }

  void _abrirCurso(int cursoId) {
    Navigator.pushNamed(context, '/cursos/$cursoId');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Área do Formador'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _carregarDados,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(icon: Icon(Icons.dashboard), text: 'Dashboard'),
            Tab(icon: Icon(Icons.school), text: 'Meus Cursos'),
            Tab(icon: Icon(Icons.assignment), text: 'Avaliações'),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _carregarDados,
        child: _loading
            ? Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? _buildErrorState()
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildDashboard(),
                      _buildMeusCursos(),
                      _buildAvaliacoes(),
                    ],
                  ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, color: AppColors.error, size: 64),
          SizedBox(height: AppSpacing.md),
          Text(_error!),
          SizedBox(height: AppSpacing.md),
          ElevatedButton(
            onPressed: _carregarDados,
            child: Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Boas-vindas
          _buildWelcomeCard(),

          SizedBox(height: AppSpacing.lg),

          // Estatísticas
          _buildEstatisticasGrid(),

          SizedBox(height: AppSpacing.lg),

          // Resumo de atividades
          _buildResumoAtividades(),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard() {
    final nome = _formadorProfile?['nome'] ?? 'Formador';

    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadius.large),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bem-vindo, $nome!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: AppSpacing.sm),
                Text(
                  'Aqui pode gerir os seus cursos e acompanhar o progresso dos alunos.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.school,
            size: 60,
            color: Colors.white.withOpacity(0.3),
          ),
        ],
      ),
    );
  }

  Widget _buildEstatisticasGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: AppSpacing.md,
      mainAxisSpacing: AppSpacing.md,
      childAspectRatio: 1.2,
      children: [
        _buildEstatisticaCard(
          'Total de Cursos',
          (_estatisticas['totalCursos'] ?? 0).toString(),
          Icons.school,
          AppColors.primary,
        ),
        _buildEstatisticaCard(
          'Total de Alunos',
          _estatisticas['totalAlunos']?.toString() ?? '0',
          Icons.people,
          AppColors.success,
        ),
        _buildEstatisticaCard(
          'Avaliação Média',
          _estatisticas['avaliacaoMedia']?.toStringAsFixed(1) ?? '0.0',
          Icons.star,
          AppColors.warning,
        ),
        _buildEstatisticaCard(
          'Cursos Ativos',
          _estatisticas['cursosAtivos']?.toString() ?? '0',
          Icons.play_circle,
          AppColors.statusEmCurso,
        ),
      ],
    );
  }

  Widget _buildEstatisticaCard(
      String titulo, String valor, IconData icone, Color cor) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icone, color: cor, size: 40),
          SizedBox(height: AppSpacing.md),
          Text(
            valor,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: cor,
            ),
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            titulo,
            style: AppTextStyles.labelMedium
                .copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildResumoAtividades() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Atividades Recentes',
            style: AppTextStyles.headline3,
          ),
          SizedBox(height: AppSpacing.lg),
          if (_avaliacoesPendentes.isNotEmpty) ...[
            _buildAtividadeItem(
              Icons.assignment,
              'Avaliações Pendentes',
              '${_avaliacoesPendentes.length} trabalhos para avaliar',
              AppColors.warning,
              () => _tabController.animateTo(2),
            ),
            SizedBox(height: AppSpacing.md),
          ],
          _buildAtividadeItem(
            Icons.people,
            'Novos Alunos',
            'Verificar inscrições recentes',
            AppColors.success,
            () => _tabController.animateTo(1),
          ),
          SizedBox(height: AppSpacing.md),
          _buildAtividadeItem(
            Icons.analytics,
            'Relatórios',
            'Ver estatísticas detalhadas',
            AppColors.info,
            () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Funcionalidade em desenvolvimento')),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAtividadeItem(
    IconData icone,
    String titulo,
    String descricao,
    Color cor,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.medium),
      child: Container(
        padding: EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: cor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.medium),
          border: Border.all(color: cor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icone, color: cor, size: 30),
            SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titulo,
                    style: AppTextStyles.headline4.copyWith(color: cor),
                  ),
                  SizedBox(height: 2),
                  Text(
                    descricao,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: cor),
          ],
        ),
      ),
    );
  }

  Widget _buildMeusCursos() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho
          Row(
            children: [
              Text(
                'Meus Cursos',
                style: AppTextStyles.headline2,
              ),
              Spacer(),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(
                  '${_meusCursos.length} curso${_meusCursos.length != 1 ? 's' : ''}',
                  style: AppTextStyles.labelMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),

          SizedBox(height: AppSpacing.lg),

          // Lista de cursos
          if (_meusCursos.isEmpty)
            _buildEmptyState()
          else
            ListView.separated(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: _meusCursos.length,
              separatorBuilder: (context, index) =>
                  SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                final curso = _meusCursos[index];
                return _buildCursoCard(curso);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
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
      child: Column(
        children: [
          Icon(
            Icons.school_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            'Você ainda não tem cursos atribuídos.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: Colors.grey[600],
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            'Entre em contacto com a administração para obter cursos.',
            style: AppTextStyles.bodySmall.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCursoCard(dynamic curso) {
    final nome = curso['nome'] ?? 'Curso sem nome';
    final categoria =
        curso['categoria']?['nome'] ?? 'Categoria não especificada';
    final estado = curso['estado'] ?? 'Disponível';
    final inscritos = curso['inscritos'] ?? 0;
    final vagas = curso['vagas_total'] ?? 0;
    final cursoId = curso['id_curso'] ?? curso['id'];

    return Container(
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
        onTap: () => _abrirCurso(cursoId),
        borderRadius: BorderRadius.circular(AppRadius.large),
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Imagem do curso
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.medium),
                      color: Colors.grey[300],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.medium),
                      child: Image.network(
                        ApiService.cursoImagem(nome),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[300],
                            child: Icon(
                              Icons.school,
                              color: Colors.grey[600],
                              size: 40,
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  SizedBox(width: AppSpacing.md),

                  // Informações do curso
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nome,
                          style: AppTextStyles.headline4,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: AppSpacing.xs),
                        Text(
                          categoria,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(estado).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                estado,
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: _getStatusColor(estado),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            Spacer(),
                            Text(
                              '$inscritos/$vagas alunos',
                              style: AppTextStyles.labelMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvaliacoes() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Avaliações Pendentes',
            style: AppTextStyles.headline2,
          ),
          SizedBox(height: AppSpacing.lg),
          if (_avaliacoesPendentes.isEmpty)
            Container(
              padding: EdgeInsets.all(AppSpacing.xl),
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
              child: Column(
                children: [
                  Icon(
                    Icons.assignment_turned_in,
                    size: 64,
                    color: Colors.green[400],
                  ),
                  SizedBox(height: AppSpacing.md),
                  Text(
                    'Parabéns!',
                    style: AppTextStyles.headline3.copyWith(
                      color: Colors.green[600],
                    ),
                  ),
                  SizedBox(height: AppSpacing.sm),
                  Text(
                    'Não há avaliações pendentes no momento.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Text('Lista de avaliações pendentes aparecerá aqui.'),
        ],
      ),
    );
  }

  Color _getStatusColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'disponível':
        return AppColors.statusDisponivel;
      case 'em curso':
        return AppColors.statusEmCurso;
      case 'terminado':
        return AppColors.statusTerminado;
      case 'lotado':
        return AppColors.statusLotado;
      default:
        return AppColors.primary;
    }
  }
}
