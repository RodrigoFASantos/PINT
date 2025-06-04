import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Estados principais
  List<dynamic> _inscricoes = [];
  List<dynamic> _cursosSugeridos = [];
  bool _loading = true;
  String? _error;

  // Estados para modal de primeira senha
  bool _showPasswordModal = false;
  int? _userId;

  // Animação de texto
  late AnimationController _textAnimationController;
  Timer? _typewriterTimer;
  int _currentTextIndex = 0;
  int _currentCharIndex = 0;
  String _displayText = '';
  bool _isDeleting = false;

  final List<String> _texts = [
    "Aprender aqui é mais fácil",
    "Aprender aqui é uma experiência nova",
    "Aprender aqui é simples",
    "Aprender aqui é eficaz",
    "Aprender aqui é divertido",
    "Aprender aqui é inovador"
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _checkAuthentication();
  }

  @override
  void dispose() {
    _textAnimationController.dispose();
    _typewriterTimer?.cancel();
    super.dispose();
  }

  void _initializeAnimations() {
    _textAnimationController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );
    _startTypewriterAnimation();
  }

  void _startTypewriterAnimation() {
    _typewriterTimer = Timer.periodic(Duration(milliseconds: 100), (timer) {
      setState(() {
        if (!_isDeleting &&
            _currentCharIndex < _texts[_currentTextIndex].length) {
          // Typing
          _currentCharIndex++;
          _displayText =
              _texts[_currentTextIndex].substring(0, _currentCharIndex);
        } else if (!_isDeleting &&
            _currentCharIndex == _texts[_currentTextIndex].length) {
          // Finished typing, wait before deleting
          timer.cancel();
          Timer(Duration(milliseconds: 1500), () {
            _isDeleting = true;
            _startTypewriterAnimation();
          });
        } else if (_isDeleting && _currentCharIndex > 0) {
          // Deleting
          _currentCharIndex--;
          _displayText =
              _texts[_currentTextIndex].substring(0, _currentCharIndex);
        } else if (_isDeleting && _currentCharIndex == 0) {
          // Finished deleting, move to next text
          _isDeleting = false;
          _currentTextIndex = (_currentTextIndex + 1) % _texts.length;
          timer.cancel();
          Timer(Duration(milliseconds: 300), () {
            _startTypewriterAnimation();
          });
        }
      });
    });
  }

  Future<void> _checkAuthentication() async {
    final token = await ApiService.getToken();
    if (token == null) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
      return;
    }

    await _checkFirstLogin();
  }

  Future<void> _checkFirstLogin() async {
    try {
      final userProfile = await ApiService().getUserProfile();
      final primeiroLogin = userProfile['primeiro_login'];
      final isPrimeiroLogin =
          primeiroLogin == 1 || primeiroLogin == '1' || primeiroLogin == true;

      // Extrair user ID para o modal
      _userId = userProfile['id_utilizador'];

      if (isPrimeiroLogin) {
        setState(() => _showPasswordModal = true);
      } else {
        await _buscarInscricoes();
      }
    } catch (e) {
      // Mesmo com erro, tentar buscar inscrições
      await _buscarInscricoes();
    }
  }

  Future<void> _buscarInscricoes() async {
    try {
      setState(() => _loading = true);

      final inscricoes = await ApiService().getMinhasInscricoes();
      final cursosSugeridos = await _buscarCursosSugeridos();

      setState(() {
        _inscricoes = inscricoes;
        _cursosSugeridos = cursosSugeridos;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Não foi possível carregar os cursos inscritos';
        _loading = false;
      });
    }
  }

  Future<List<dynamic>> _buscarCursosSugeridos() async {
    try {
      // Implementar lógica de cursos sugeridos
      final response = await ApiService.getCursos(limit: 6);
      return response.take(6).toList();
    } catch (e) {
      return [];
    }
  }

  String _getImageUrl(dynamic inscricao) {
    if (inscricao['imagem_path'] != null) {
      return '${ApiService.baseUrl}/${inscricao['imagem_path']}';
    }

    if (inscricao['nomeCurso'] != null) {
      return ApiService.cursoImagem(inscricao['nomeCurso']);
    }

    return ApiService.defaultAvatar; // Fallback image
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

  void _navigateToCourse(int cursoId) {
    Navigator.pushNamed(context, '/cursos/$cursoId');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      body: Stack(
        children: [
          // Conteúdo principal
          SingleChildScrollView(
            child: Column(
              children: [
                _buildBanner(),
                _buildContent(),
              ],
            ),
          ),

          // Modal de primeira senha
          if (_showPasswordModal) _buildPasswordModal(),
        ],
      ),
    );
  }

  Widget _buildBanner() {
    return Container(
      height: 300,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          // Overlay escuro
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.3),
                  Colors.black.withOpacity(0.6),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          // AppBar personalizada
          SafeArea(
            child: Padding(
              padding: EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.menu, color: Colors.white),
                    onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                  ),
                  Spacer(),
                  Text(
                    'Início',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Spacer(),
                  IconButton(
                    icon: Icon(Icons.refresh, color: Colors.white),
                    onPressed: _buscarInscricoes,
                  ),
                ],
              ),
            ),
          ),

          // Texto animado
          Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Texto principal com animação
                  Container(
                    height: 80,
                    child: Center(
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: _displayText,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                            ),
                            // Cursor piscante
                            TextSpan(
                              text: '|',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  SizedBox(height: AppSpacing.md),

                  // Subtítulo
                  Text(
                    'Não vale a pena estar a inventar a roda ou a descobrir a pólvora!',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 16,
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Seção de cursos inscritos
          _buildCoursesSection(
            title: 'Cursos Inscritos',
            courses: _inscricoes,
            isEnrolled: true,
          ),

          SizedBox(height: AppSpacing.xl),

          // Seção de cursos sugeridos
          _buildCoursesSection(
            title: 'Cursos Sugeridos para Você',
            courses: _cursosSugeridos,
            isEnrolled: false,
          ),
        ],
      ),
    );
  }

  Widget _buildCoursesSection({
    required String title,
    required List<dynamic> courses,
    required bool isEnrolled,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Título da seção
        Row(
          children: [
            Container(
              width: 4,
              height: 24,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(width: AppSpacing.sm),
            Text(
              title,
              style: AppTextStyles.headline2,
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // Conteúdo
        if (_loading)
          _buildLoadingState()
        else if (_error != null)
          _buildErrorState()
        else if (courses.isEmpty)
          _buildEmptyState(isEnrolled)
        else
          _buildCoursesGrid(courses, isEnrolled),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Container(
      height: 200,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: AppSpacing.md),
            Text('Carregando cursos...'),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: AppColors.error),
          SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              _error!,
              style: TextStyle(color: AppColors.error),
            ),
          ),
          TextButton(
            onPressed: _buscarInscricoes,
            child: Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isEnrolled) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Icon(
            isEnrolled ? Icons.school_outlined : Icons.explore,
            size: 64,
            color: Colors.grey[400],
          ),
          SizedBox(height: AppSpacing.md),
          Text(
            isEnrolled
                ? 'Você não está inscrito em nenhum curso.'
                : 'Nenhum curso sugerido disponível.',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 16,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          if (isEnrolled) ...[
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

  Widget _buildCoursesGrid(List<dynamic> courses, bool isEnrolled) {
    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: AppSpacing.md,
        mainAxisSpacing: AppSpacing.md,
      ),
      itemCount: courses.length,
      itemBuilder: (context, index) {
        final course = courses[index];
        return _buildCourseCard(course, isEnrolled);
      },
    );
  }

  Widget _buildCourseCard(dynamic course, bool isEnrolled) {
    final cursoId = course['cursoId'] ?? course['id'];
    final title = course['nomeCurso'] ?? course['nome'] ?? 'Sem título';
    final categoria = course['categoria'] ?? 'Categoria não especificada';
    final area = course['area'] ?? 'Área não especificada';
    final status = course['status'];

    return GestureDetector(
      onTap: () => _navigateToCourse(cursoId),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
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
            // Imagem do curso
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  color: Colors.grey[300],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    _getImageUrl(course),
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
            ),

            // Informações do curso
            Expanded(
              flex: 2,
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Categoria: $categoria',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Área: $area',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Spacer(),
                    if (isEnrolled && status != null)
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordModal() {
    return Container(
      color: Colors.black.withOpacity(0.5),
      child: Center(
        child: Container(
          margin: EdgeInsets.all(AppSpacing.lg),
          padding: EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.security,
                size: 64,
                color: AppColors.primary,
              ),
              SizedBox(height: AppSpacing.md),
              Text(
                'Primeiro Acesso',
                style: AppTextStyles.headline2,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppSpacing.sm),
              Text(
                'Para sua segurança, é necessário alterar a palavra-passe no primeiro acesso.',
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() => _showPasswordModal = false);
                        _buscarInscricoes();
                      },
                      child: Text('Mais tarde'),
                    ),
                  ),
                  SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // Navegar para tela de alteração de senha
                        setState(() => _showPasswordModal = false);
                        Navigator.pushNamed(context, '/alterar-senha');
                      },
                      child: Text('Alterar Agora'),
                    ),
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
