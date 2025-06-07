import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/api_service.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Controladores de animação
  late AnimationController _logoAnimationController;
  late AnimationController _textAnimationController;
  late AnimationController _progressAnimationController;

  // Animações
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoRotationAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<double> _progressAnimation;

  // Estado da verificação
  String _statusMessage = 'A inicializar...';
  bool _hasError = false;
  double _progress = 0.0;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _startInitialization();
  }

  /// Configurar todas as animações
  void _setupAnimations() {
    // Animação do logo (escala e rotação)
    _logoAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _logoScaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoAnimationController,
      curve: Curves.elasticOut,
    ));

    _logoRotationAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoAnimationController,
      curve: Curves.easeInOut,
    ));

    // Animação do texto
    _textAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _textFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _textAnimationController,
      curve: Curves.easeIn,
    ));

    // Animação da barra de progresso
    _progressAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _progressAnimationController,
      curve: Curves.easeInOut,
    ));

    // Iniciar animações
    _logoAnimationController.forward();

    // Aguardar um pouco antes de mostrar o texto
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _textAnimationController.forward();
      }
    });
  }

  /// Atualizar progresso com animação
  void _updateProgress(double progress) {
    setState(() {
      _progress = progress;
    });
    _progressAnimationController.forward();
  }

  /// Atualizar mensagem de status
  void _updateStatus(String message) {
    if (mounted) {
      setState(() {
        _statusMessage = message;
        _hasError = false;
      });
    }
  }

  /// Mostrar erro
  void _showError(String message) {
    if (mounted) {
      setState(() {
        _statusMessage = message;
        _hasError = true;
      });
    }
  }

  /// Processo principal de inicialização
  Future<void> _startInitialization() async {
    try {
      await _performInitializationSteps();
    } catch (e) {
      debugPrint('❌ [SPLASH] Erro na inicialização: $e');
      _showError('Erro na inicialização');

      // Aguardar um pouco e tentar navegar para login
      await Future.delayed(const Duration(seconds: 2));
      _navigateToLogin();
    }
  }

  /// Executar todos os passos de inicialização
  Future<void> _performInitializationSteps() async {
    // Passo 1: Verificar conectividade
    _updateStatus('A verificar ligação...');
    _updateProgress(0.1);
    await _checkConnectivity();
    await Future.delayed(const Duration(milliseconds: 500));

    // Passo 2: Inicializar API Service
    _updateStatus('A configurar serviços...');
    _updateProgress(0.3);
    await _initializeApiService();
    await Future.delayed(const Duration(milliseconds: 500));

    // Passo 3: Verificar token guardado
    _updateStatus('A verificar autenticação...');
    _updateProgress(0.5);
    final hasValidToken = await _checkStoredToken();
    await Future.delayed(const Duration(milliseconds: 500));

    // Passo 4: Validar token (se existir)
    if (hasValidToken) {
      _updateStatus('A validar sessão...');
      _updateProgress(0.7);
      final isTokenValid = await _validateToken();
      await Future.delayed(const Duration(milliseconds: 500));

      if (isTokenValid) {
        _updateStatus('Sessão válida! A entrar...');
        _updateProgress(1.0);
        await Future.delayed(const Duration(milliseconds: 500));
        _navigateToHome();
        return;
      } else {
        _updateStatus('Sessão expirada');
        await _clearInvalidToken();
      }
    }

    // Passo 5: Ir para login
    _updateStatus('A carregar ecrã de entrada...');
    _updateProgress(1.0);
    await Future.delayed(const Duration(milliseconds: 500));
    _navigateToLogin();
  }

  /// Verificar conectividade de rede
  Future<void> _checkConnectivity() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();

      if (connectivityResult == ConnectivityResult.none) {
        _showError('Sem ligação à internet');
        await Future.delayed(const Duration(seconds: 2));
        // Continuar mesmo sem internet (pode ter dados em cache)
      }
    } catch (e) {
      debugPrint('⚠️ [SPLASH] Erro ao verificar conectividade: $e');
      // Continuar mesmo com erro
    }
  }

  /// Inicializar o API Service
  Future<void> _initializeApiService() async {
    try {
      await ApiService().initialize();

      // Testar conexão (opcional)
      final isConnected = await ApiService().testConnection();
      debugPrint(
          '🌐 [SPLASH] Conexão com API: ${isConnected ? 'OK' : 'FALHOU'}');

      if (!isConnected) {
        debugPrint('⚠️ [SPLASH] API não disponível, mas continuando...');
      }
    } catch (e) {
      debugPrint('❌ [SPLASH] Erro ao inicializar API: $e');
      throw Exception('Falha na inicialização da API');
    }
  }

  /// Verificar se existe token guardado
  Future<bool> _checkStoredToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token != null && token.isNotEmpty) {
        debugPrint('🔐 [SPLASH] Token encontrado');
        ApiService().setAuthToken(token);
        return true;
      } else {
        debugPrint('ℹ️ [SPLASH] Nenhum token encontrado');
        return false;
      }
    } catch (e) {
      debugPrint('❌ [SPLASH] Erro ao verificar token: $e');
      return false;
    }
  }

  /// Validar token com o servidor
  Future<bool> _validateToken() async {
    try {
      final userData = await ApiService().getCurrentUser();

      if (userData != null) {
        debugPrint('✅ [SPLASH] Token válido, utilizador: ${userData['email']}');

        // Opcional: Guardar dados do utilizador
        await _saveUserData(userData);
        return true;
      } else {
        debugPrint('❌ [SPLASH] Token inválido');
        return false;
      }
    } catch (e) {
      debugPrint('❌ [SPLASH] Erro ao validar token: $e');
      return false;
    }
  }

  /// Guardar dados do utilizador
  Future<void> _saveUserData(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_email', userData['email'] ?? '');
      await prefs.setString('user_name', userData['nome'] ?? '');
      await prefs.setString('user_type', userData['tipo_utilizador'] ?? '');
    } catch (e) {
      debugPrint('⚠️ [SPLASH] Erro ao guardar dados do utilizador: $e');
    }
  }

  /// Limpar token inválido
  Future<void> _clearInvalidToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_email');
      await prefs.remove('user_name');
      await prefs.remove('user_type');
      ApiService().clearAuthToken();
      debugPrint('🗑️ [SPLASH] Token inválido removido');
    } catch (e) {
      debugPrint('❌ [SPLASH] Erro ao limpar token: $e');
    }
  }

  /// Navegar para a tela de login
  void _navigateToLogin() {
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  /// Navegar para a tela principal
  void _navigateToHome() {
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  /// Tentar novamente a inicialização
  void _retry() {
    setState(() {
      _hasError = false;
      _progress = 0.0;
      _statusMessage = 'A tentar novamente...';
    });

    // Reiniciar animações
    _progressAnimationController.reset();

    _startInitialization();
  }

  @override
  void dispose() {
    _logoAnimationController.dispose();
    _textAnimationController.dispose();
    _progressAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Configurar barra de status
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A), // Fundo escuro
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF1A1A1A),
              const Color(0xFF1A1A1A).withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 2),

                // Logo animado
                AnimatedBuilder(
                  animation: _logoAnimationController,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _logoScaleAnimation.value,
                      child: Transform.rotate(
                        angle: _logoRotationAnimation.value * 0.1,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF8000),
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF8000).withOpacity(0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.school,
                            size: 64,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 32),

                // Título animado
                FadeTransition(
                  opacity: _textFadeAnimation,
                  child: Column(
                    children: [
                      const Text(
                        'SoftSkills',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Formação e partilha de conhecimento',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 16,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 1),

                // Área de status e progresso
                Column(
                  children: [
                    // Barra de progresso
                    Container(
                      width: double.infinity,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: AnimatedBuilder(
                        animation: _progressAnimation,
                        builder: (context, child) {
                          return FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: _progress * _progressAnimation.value,
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF8000),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Mensagem de status
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Text(
                        _statusMessage,
                        key: ValueKey(_statusMessage),
                        style: TextStyle(
                          color: _hasError
                              ? Colors.red[200]
                              : Colors.white.withOpacity(0.9),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    // Botão de retry (apenas se houver erro)
                    if (_hasError) ...[
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _retry,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8000),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Tentar Novamente'),
                      ),
                    ],
                  ],
                ),

                const Spacer(flex: 1),

                // Versão da app
                Text(
                  'Versão 1.0.0',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
