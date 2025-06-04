import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/storage_service.dart';
import 'utils/constants.dart';
import 'screens/rotas/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar serviços
  await StorageService().init();

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ✅ CORRIGIDO - AuthService agora estende ChangeNotifier
        ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,

        // Temas
        theme: AppTheme.lightTheme,

        // Rotas
        routes: AppRouter.routes,
        onGenerateRoute:
            AppRouter.onGenerateRoute, // ✅ ADICIONADO - Para rotas dinâmicas
        initialRoute: '/',

        // ✅ REMOVIDO - home: AuthWrapper() para evitar conflito com rota '/'
      ),
    );
  }
}

// ✅ AuthWrapper simplificado para verificação inicial de autenticação
class AuthWrapper extends StatefulWidget {
  @override
  _AuthWrapperState createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndRedirect();
  }

  Future<void> _checkAuthAndRedirect() async {
    try {
      // ✅ Usar Provider.of para acessar AuthService
      final authService = Provider.of<AuthService>(context, listen: false);
      final isLoggedIn = await authService.isLoggedIn();

      // ✅ Aguardar um frame para garantir que o contexto está disponível
      await Future.delayed(Duration.zero);

      if (mounted) {
        if (isLoggedIn) {
          Navigator.pushReplacementNamed(context, '/home');
        } else {
          Navigator.pushReplacementNamed(context, '/login');
        }
      }
    } catch (e) {
      print('Erro ao verificar autenticação: $e');
      // ✅ Em caso de erro, redirecionar para login
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // ✅ Tela de loading durante verificação
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school,
              size: 80,
              color: Colors.white,
            ),
            SizedBox(height: AppSpacing.lg),
            Text(
              AppConstants.appName,
              style: AppTextStyles.headline1.copyWith(
                color: Colors.white,
              ),
            ),
            SizedBox(height: AppSpacing.xl),
            CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 3,
            ),
            SizedBox(height: AppSpacing.md),
            Text(
              'A inicializar...',
              style: AppTextStyles.bodyLarge.copyWith(
                color: Colors.white.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
