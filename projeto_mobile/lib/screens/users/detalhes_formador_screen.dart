import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class FormadorDetailScreen extends StatefulWidget {
  final int formadorId;

  const FormadorDetailScreen({Key? key, required this.formadorId})
      : super(key: key);

  @override
  _FormadorDetailScreenState createState() => _FormadorDetailScreenState();
}

class _FormadorDetailScreenState extends State<FormadorDetailScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  Map<String, dynamic>? _formador;
  List<dynamic> _cursos = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    try {
      setState(() => _loading = true);

      final formador = await ApiService.getFormador(widget.formadorId);

      // Carregar cursos do formador (simulando endpoint)
      final cursos = await _carregarCursosFormador();

      setState(() {
        _formador = formador['data'] ?? formador;
        _cursos = cursos;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar detalhes do formador';
        _loading = false;
      });
    }
  }

  Future<List<dynamic>> _carregarCursosFormador() async {
    try {
      // Simulando endpoint de cursos do formador
      final todosCursos = await ApiService.getCursos();

      // Filtrar cursos onde o formador está associado
      return todosCursos.where((curso) {
        final formadorCurso = curso['formador'];
        if (formadorCurso != null) {
          final formadorId =
              formadorCurso['id_utilizador'] ?? formadorCurso['id'];
          return formadorId == widget.formadorId;
        }
        return false;
      }).toList();
    } catch (e) {
      return [];
    }
  }

  void _abrirCurso(int cursoId) {
    Navigator.pushNamed(context, '/cursos/$cursoId');
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Data não disponível';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Detalhes do Formador'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_error != null || _formador == null) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Detalhes do Formador'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, color: AppColors.error, size: 64),
              SizedBox(height: AppSpacing.md),
              Text(_error ?? 'Formador não encontrado'),
              SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: _carregarDados,
                child: Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      body: CustomScrollView(
        slivers: [
          // AppBar com informações do formador
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildFormadorHeader(),
            ),
          ),

          // Conteúdo
          SliverToBoxAdapter(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildFormadorHeader() {
    final nome = _formador!['nome'] ?? 'Nome não disponível';
    final email = _formador!['email'] ?? '';
    final especialidade =
        _formador!['especialidade'] ?? 'Especialidade não especificada';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Avatar
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: ClipOval(
                  child: Image.network(
                    ApiService.userAvatar(email),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.white,
                        child: Icon(
                          Icons.person,
                          size: 60,
                          color: Colors.grey[600],
                        ),
                      );
                    },
                  ),
                ),
              ),

              SizedBox(height: AppSpacing.md),

              // Nome
              Text(
                nome,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),

              SizedBox(height: AppSpacing.sm),

              // Especialidade
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  especialidade,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Informações pessoais
          _buildInformacoesPessoais(),

          SizedBox(height: AppSpacing.lg),

          // Biografia
          if (_formador!['biografia'] != null &&
              _formador!['biografia'].isNotEmpty)
            _buildBiografia(),

          if (_formador!['biografia'] != null &&
              _formador!['biografia'].isNotEmpty)
            SizedBox(height: AppSpacing.lg),

          // Cursos do formador
          _buildCursosFormador(),
        ],
      ),
    );
  }

  Widget _buildInformacoesPessoais() {
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
            'Informações de Contacto',
            style: AppTextStyles.headline3,
          ),

          SizedBox(height: AppSpacing.lg),

          // Email
          _buildInfoRow(
            Icons.email,
            'Email',
            _formador!['email'] ?? 'Não disponível',
          ),

          if (_formador!['telefone'] != null &&
              _formador!['telefone'].isNotEmpty) ...[
            SizedBox(height: AppSpacing.md),
            _buildInfoRow(
              Icons.phone,
              'Telefone',
              _formador!['telefone'],
            ),
          ],

          SizedBox(height: AppSpacing.md),

          _buildInfoRow(
            Icons.school,
            'Especialidade',
            _formador!['especialidade'] ?? 'Não especificada',
          ),

          if (_formador!['data_criacao'] != null) ...[
            SizedBox(height: AppSpacing.md),
            _buildInfoRow(
              Icons.calendar_today,
              'Membro desde',
              _formatDate(_formador!['data_criacao']),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          color: AppColors.primary,
          size: 20,
        ),
        SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.labelMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: 2),
              Text(
                value,
                style: AppTextStyles.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBiografia() {
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
            'Sobre o Formador',
            style: AppTextStyles.headline3,
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            _formador!['biografia'],
            style: AppTextStyles.bodyMedium.copyWith(
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursosFormador() {
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
          Row(
            children: [
              Text(
                'Cursos Ministrados',
                style: AppTextStyles.headline3,
              ),
              Spacer(),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(
                  '${_cursos.length} curso${_cursos.length != 1 ? 's' : ''}',
                  style: AppTextStyles.labelMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.lg),
          if (_cursos.isEmpty)
            Container(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: Column(
                children: [
                  Icon(
                    Icons.school_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  SizedBox(height: AppSpacing.md),
                  Text(
                    'Este formador ainda não tem cursos associados.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: _cursos.length,
              separatorBuilder: (context, index) =>
                  SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                final curso = _cursos[index];
                return _buildCursoCard(curso);
              },
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
    final cursoId = curso['id_curso'] ?? curso['id'];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: AppColors.border),
      ),
      child: InkWell(
        onTap: () => _abrirCurso(cursoId),
        borderRadius: BorderRadius.circular(AppRadius.medium),
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Imagem do curso
              Container(
                width: 60,
                height: 60,
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
                          size: 30,
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      categoria,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    SizedBox(height: AppSpacing.xs),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
        ),
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
