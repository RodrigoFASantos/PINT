import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Importar os serviços e telas
import 'services/api_service.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/cursos/cursos_screen.dart';
import 'screens/users/perfil_screen.dart';
import 'screens/users/percurso_formativo_screen.dart';
import 'screens/users/formadores_screen.dart';
import 'screens/forum/forum_screen.dart';

void main() async {
  // Garantir que o Flutter está inicializado
  WidgetsFlutterBinding.ensureInitialized();

  // Configurar orientação da tela
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Configurar barra de status
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  debugPrint('🚀 [MAIN] Iniciando aplicação...');

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SoftSkills',
      debugShowCheckedModeBanner: false,

      // Tema claro
      theme: ThemeData(
        primarySwatch: Colors.orange,
        primaryColor: const Color(0xFFFF8000), // Laranja da tua marca
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),

        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFF8000),
          foregroundColor: Colors.white,
          elevation: 2,
          centerTitle: true,
          systemOverlayStyle: SystemUiOverlayStyle.light,
        ),

        cardTheme: CardTheme(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF8000),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            elevation: 2,
          ),
        ),

        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFFF8000), width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Colors.red, width: 2),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          fillColor: Colors.grey.shade50,
          filled: true,
        ),

        snackBarTheme: SnackBarThemeData(
          backgroundColor: Colors.grey.shade800,
          contentTextStyle: const TextStyle(color: Colors.white),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      ),

      // Modo de tema
      themeMode: ThemeMode.system,

      // Rota inicial
      initialRoute: '/splash',

      // Rotas da aplicação
      routes: {
        '/splash': (context) => SplashScreen(),
        '/login': (context) => LoginScreen(),
        '/home': (context) => HomeScreen(),
        '/cursos': (context) => CursosScreen(),
        '/perfil': (context) => PerfilScreen(),
        '/percurso-formativo': (context) => PercursoFormativoScreen(),
        '/formadores': (context) => FormadoresScreen(),
        '/forum': (context) => ForumScreen(),
        // Rotas não implementadas ainda retornam uma página de "em desenvolvimento"
        '/area-formador': (context) =>
            _buildNotImplementedPage(context, 'Área do Formador'),
        '/admin/dashboard': (context) =>
            _buildNotImplementedPage(context, 'Dashboard Admin'),
        '/admin/cursos': (context) =>
            _buildNotImplementedPage(context, 'Gerir Cursos'),
        '/admin/usuarios': (context) =>
            _buildNotImplementedPage(context, 'Gerir Utilizadores'),
        '/admin/denuncias': (context) =>
            _buildNotImplementedPage(context, 'Gerenciar Denúncias'),
        '/admin/percurso-formandos': (context) =>
            _buildNotImplementedPage(context, 'Percurso Formandos'),
        '/admin/categorias': (context) =>
            _buildNotImplementedPage(context, 'Gerir Categorias'),
        '/admin/areas': (context) =>
            _buildNotImplementedPage(context, 'Gerir Áreas'),
        '/admin/topicos': (context) =>
            _buildNotImplementedPage(context, 'Gerir Tópicos'),
        '/admin/criar-curso': (context) =>
            _buildNotImplementedPage(context, 'Criar Curso'),
        '/admin/criar-usuario': (context) =>
            _buildNotImplementedPage(context, 'Criar Utilizador'),
      },

      // Rota para páginas não encontradas
      onUnknownRoute: (settings) {
        return MaterialPageRoute(
          builder: (context) => Scaffold(
            appBar: AppBar(
              title: const Text('Página não encontrada'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/home'),
              ),
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Página não encontrada',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'A rota "${settings.name}" não existe.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () =>
                        Navigator.pushReplacementNamed(context, '/home'),
                    icon: const Icon(Icons.home),
                    label: const Text('Voltar ao Início'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Widget para páginas não implementadas
  static Widget _buildNotImplementedPage(
      BuildContext context, String pageName) {
    return Scaffold(
      appBar: AppBar(
        title: Text(pageName),
        backgroundColor: const Color(0xFFFF8000),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.construction,
              size: 64,
              color: Colors.orange.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Em Desenvolvimento',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.orange.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'A página "$pageName" ainda está em desenvolvimento.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
              icon: const Icon(Icons.home),
              label: const Text('Voltar ao Início'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF8000),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ===========================================
// CLASSES AUXILIARES (mantidas iguais)
// ===========================================

/// Configurações globais da aplicação
class AppConfig {
  static const String appName = 'SoftSkills';
  static const String appVersion = '1.0.0';
  static const String appDescription =
      'Formação e partilha de conhecimento interno';

  // Cores
  static const Color primaryColor = Color(0xFFFF8000);
  static const Color secondaryColor = Color(0xFFE67300);
  static const Color errorColor = Color(0xFFB00020);
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFF8000);

  // Configurações
  static const Duration splashMinDuration = Duration(seconds: 2);
  static const Duration apiTimeout = Duration(seconds: 30);
  static const int maxRetryAttempts = 3;

  // URLs (podem ser configuradas por ambiente)
  static const String defaultApiUrl = 'http://10.0.2.2:4000/api';
  static const String productionApiUrl = 'https://teu-dominio.com:4000/api';
}

/// Gestor de autenticação
class AuthManager {
  static const String _tokenKey = 'auth_token';
  static const String _userEmailKey = 'user_email';
  static const String _userNameKey = 'user_name';
  static const String _userTypeKey = 'user_type';

  /// Guardar dados de autenticação
  static Future<void> saveAuthData({
    required String token,
    required String email,
    String? name,
    String? userType,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userEmailKey, email);
    if (name != null) await prefs.setString(_userNameKey, name);
    if (userType != null) await prefs.setString(_userTypeKey, userType);

    // Configurar no ApiService
    ApiService().setAuthToken(token);

    debugPrint('✅ [AUTH] Dados de autenticação guardados para: $email');
  }

  /// Obter token guardado
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Obter dados do utilizador guardados
  static Future<Map<String, String?>> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'email': prefs.getString(_userEmailKey),
      'name': prefs.getString(_userNameKey),
      'userType': prefs.getString(_userTypeKey),
    };
  }

  /// Verificar se está autenticado
  static Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Limpar todos os dados de autenticação
  static Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userTypeKey);

    // Limpar do ApiService
    ApiService().clearAuthToken();

    debugPrint('🗑️ [AUTH] Dados de autenticação limpos');
  }
}

/// Utilitários globais
class AppUtils {
  /// Mostrar snackbar de sucesso
  static void showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppConfig.successColor,
      ),
    );
  }

  /// Mostrar snackbar de erro
  static void showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppConfig.errorColor,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  /// Mostrar snackbar de informação
  static void showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppConfig.primaryColor,
      ),
    );
  }
}
