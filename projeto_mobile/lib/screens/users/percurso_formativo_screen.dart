import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class PercursoFormativoScreen extends StatefulWidget {
  @override
  _PercursoFormativoScreenState createState() =>
      _PercursoFormativoScreenState();
}

class _PercursoFormativoScreenState extends State<PercursoFormativoScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<dynamic> _inscricoes = [];
  bool _loading = true;
  String? _error;
  String _filtro = 'todos'; // todos, concluidos, em_andamento, agendados

  @override
  void initState() {
    super.initState();
    _carregarPercurso();
  }

  Future<void> _carregarPercurso() async {
    try {
      setState(() => _loading = true);

      final inscricoes = await ApiService().getMinhasInscricoes();

      setState(() {
        _inscricoes = inscricoes;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar percurso formativo';
        _loading = false;
      });
    }
  }

  List<dynamic> get _inscricoesFiltradas {
    if (_filtro == 'todos') return _inscricoes;

    return _inscricoes.where((inscricao) {
      final status = inscricao['status']?.toLowerCase() ?? '';

      switch (_filtro) {
        case 'concluidos':
          return status == 'concluído';
        case 'em_andamento':
          return status == 'em andamento';
        case 'agendados':
          return status == 'agendado';
        default:
          return true;
      }
    }).toList();
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'concluído':
        return AppColors.success;
      case 'em andamento':
        return AppColors.statusEmCurso;
      case 'agendado':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'concluído':
        return Icons.check_circle;
      case 'em andamento':
        return Icons.play_circle;
      case 'agendado':
        return Icons.schedule;
      default:
        return Icons.school;
    }
  }

  String _getProgressoTexto(dynamic inscricao) {
    final progresso = inscricao['progresso'];
    if (progresso != null) {
      return '${progresso.round()}% concluído';
    }

    final status = inscricao['status']?.toLowerCase();
    switch (status) {
      case 'concluído':
        return '100% concluído';
      case 'em andamento':
        return 'Em progresso';
      case 'agendado':
        return 'Aguardando início';
      default:
        return 'Status desconhecido';
    }
  }

  Map<String, int> get _estatisticas {
    final total = _inscricoes.length;
    final concluidos = _inscricoes
        .where((i) => i['status']?.toLowerCase() == 'concluído')
        .length;
    final emAndamento = _inscricoes
        .where((i) => i['status']?.toLowerCase() == 'em andamento')
        .length;
    final agendados = _inscricoes
        .where((i) => i['status']?.toLowerCase() == 'agendado')
        .length;

    return {
      'total': total,
      'concluidos': concluidos,
      'em_andamento': emAndamento,
      'agendados': agendados,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Percurso Formativo'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _carregarPercurso,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _carregarPercurso,
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: AppSpacing.md),
            Text('Carregando percurso formativo...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: AppColors.error, size: 64),
            SizedBox(height: AppSpacing.md),
            Text(_error!),
            SizedBox(height: AppSpacing.md),
            ElevatedButton(
              onPressed: _carregarPercurso,
              child: Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Estatísticas
          _buildEstatisticas(),

          SizedBox(height: AppSpacing.lg),

          // Filtros
          _buildFiltros(),

          SizedBox(height: AppSpacing.lg),

          // Lista de cursos
          _buildListaCursos(),
        ],
      ),
    );
  }

  Widget _buildEstatisticas() {
    final stats = _estatisticas;

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
            'Resumo do Percurso',
            style: AppTextStyles.headline3,
          ),
          SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _buildEstatisticaCard(
                  'Total de Cursos',
                  stats['total']!,
                  Icons.school,
                  AppColors.primary,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildEstatisticaCard(
                  'Concluídos',
                  stats['concluidos']!,
                  Icons.check_circle,
                  AppColors.success,
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _buildEstatisticaCard(
                  'Em Andamento',
                  stats['em_andamento']!,
                  Icons.play_circle,
                  AppColors.statusEmCurso,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildEstatisticaCard(
                  'Agendados',
                  stats['agendados']!,
                  Icons.schedule,
                  AppColors.warning,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEstatisticaCard(
      String titulo, int valor, IconData icone, Color cor) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: cor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icone, color: cor, size: 30),
          SizedBox(height: AppSpacing.sm),
          Text(
            valor.toString(),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: cor,
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            titulo,
            style: AppTextStyles.labelMedium.copyWith(color: cor),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFiltros() {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filtrar Cursos',
            style: AppTextStyles.headline4,
          ),
          SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              _buildFiltroChip('Todos', 'todos', _inscricoes.length),
              _buildFiltroChip(
                  'Concluídos', 'concluidos', _estatisticas['concluidos']!),
              _buildFiltroChip('Em Andamento', 'em_andamento',
                  _estatisticas['em_andamento']!),
              _buildFiltroChip(
                  'Agendados', 'agendados', _estatisticas['agendados']!),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFiltroChip(String label, String value, int count) {
    final isSelected = _filtro == value;

    return FilterChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filtro = value);
      },
      selectedColor: AppColors.primary.withOpacity(0.2),
      checkmarkColor: AppColors.primary,
    );
  }

  Widget _buildListaCursos() {
    final cursosFiltrados = _inscricoesFiltradas;

    if (cursosFiltrados.isEmpty) {
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
              Icons.search_off,
              size: 64,
              color: Colors.grey[400],
            ),
            SizedBox(height: AppSpacing.md),
            Text(
              _filtro == 'todos'
                  ? 'Você ainda não se inscreveu em nenhum curso.'
                  : 'Nenhum curso encontrado para este filtro.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            if (_filtro == 'todos') ...[
              SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/cursos'),
                child: Text('Explorar Cursos'),
              ),
            ],
          ],
        ),
      );
    }

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.all(AppSpacing.md),
            child: Text(
              'Seus Cursos (${cursosFiltrados.length})',
              style: AppTextStyles.headline3,
            ),
          ),
          ListView.separated(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: cursosFiltrados.length,
            separatorBuilder: (context, index) => Divider(height: 1),
            itemBuilder: (context, index) {
              final inscricao = cursosFiltrados[index];
              return _buildCursoItem(inscricao);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCursoItem(dynamic inscricao) {
    final status = inscricao['status'];
    final nomeCurso = inscricao['nomeCurso'] ?? 'Curso sem nome';
    final categoria = inscricao['categoria'] ?? 'Categoria não especificada';
    final dataInscricao = inscricao['dataInscricao'];
    final cursoId = inscricao['cursoId'];

    return ListTile(
      contentPadding: EdgeInsets.all(AppSpacing.md),
      leading: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.medium),
          color: Colors.grey[300],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.medium),
          child: Image.network(
            ApiService.cursoImagem(nomeCurso),
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: Colors.grey[300],
                child: Icon(
                  Icons.school,
                  color: Colors.grey[600],
                  size: 30,
                ),
              );
            },
          ),
        ),
      ),
      title: Text(
        nomeCurso,
        style: AppTextStyles.headline4,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            categoria,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          if (dataInscricao != null) ...[
            SizedBox(height: 4),
            Text(
              'Inscrito em: ${_formatDate(dataInscricao)}',
              style: AppTextStyles.labelSmall,
            ),
          ],
          SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Icon(
                _getStatusIcon(status),
                size: 16,
                color: _getStatusColor(status),
              ),
              SizedBox(width: 4),
              Text(
                _getProgressoTexto(inscricao),
                style: AppTextStyles.labelMedium.copyWith(
                  color: _getStatusColor(status),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
      trailing: Icon(Icons.arrow_forward_ios, size: 16),
      onTap: () {
        if (cursoId != null) {
          Navigator.pushNamed(context, '/cursos/$cursoId');
        }
      },
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
