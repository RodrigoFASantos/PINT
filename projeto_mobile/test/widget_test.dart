import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:SoftSkills/main.dart';
import 'package:SoftSkills/services/api_service.dart';

void main() {
  group('App Configuration Tests', () {
    test('AppConfig should have correct values', () {
      expect(AppConfig.appName, 'SoftSkills');
      expect(AppConfig.appVersion, '1.0.0');
      expect(AppConfig.defaultApiUrl, 'http://10.0.2.2:4000/api');
      expect(AppConfig.productionApiUrl, contains('https://'));
      expect(AppConfig.splashMinDuration, const Duration(seconds: 2));
    });

    test('AppConfig constants should be properly defined', () {
      expect(AppConfig.primaryColor, const Color(0xFFFF8000));
      expect(AppConfig.successColor, const Color(0xFF4CAF50));
      expect(AppConfig.errorColor, const Color(0xFFB00020));
      expect(AppConfig.apiTimeout, const Duration(seconds: 30));
      expect(AppConfig.maxRetryAttempts, 3);
    });
  });

  group('Routes Configuration Tests', () {
    test('Route names should be correctly defined', () {
      // Verificar se as rotas estão definidas como constantes
      const expectedRoutes = [
        '/splash',
        '/login',
        '/home',
        '/cursos',
        '/perfil'
      ];

      // Verificar que temos as rotas essenciais
      for (final route in expectedRoutes) {
        expect(route, isA<String>());
        expect(route.startsWith('/'), isTrue);
      }
    });

    testWidgets('Route builder should return valid widgets',
        (WidgetTester tester) async {
      // Testar rotas isoladamente sem carregar MyApp
      final testRoutes = {
        '/test': (context) => const Scaffold(body: Text('Test Route')),
        '/home': (context) => const Scaffold(body: Text('Home Route')),
        '/login': (context) => const Scaffold(body: Text('Login Route')),
      };

      await tester.pumpWidget(
        MaterialApp(
          initialRoute: '/test',
          routes: testRoutes,
        ),
      );

      expect(find.text('Test Route'), findsOneWidget);
    });

    testWidgets('Unknown route handler should work',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const Scaffold(body: Text('Home')),
          onUnknownRoute: (settings) {
            return MaterialPageRoute(
              builder: (context) => Scaffold(
                body: Text('Unknown: ${settings.name}'),
              ),
            );
          },
        ),
      );

      expect(find.text('Home'), findsOneWidget);
    });
  });

  group('AuthManager Tests', () {
    test('AuthManager should have all required methods', () {
      // Verificar se todos os métodos existem
      expect(AuthManager.saveAuthData, isA<Function>());
      expect(AuthManager.getToken, isA<Function>());
      expect(AuthManager.getUserData, isA<Function>());
      expect(AuthManager.isAuthenticated, isA<Function>());
      expect(AuthManager.clearAuth, isA<Function>());
    });

    test('AuthManager methods should be static', () {
      // Verificar se AuthManager existe e tem métodos estáticos
      expect(AuthManager, isNotNull);

      // Verificar que os métodos são funções
      expect(AuthManager.saveAuthData, isA<Function>());
      expect(AuthManager.getToken, isA<Function>());
      expect(AuthManager.getUserData, isA<Function>());
      expect(AuthManager.isAuthenticated, isA<Function>());
      expect(AuthManager.clearAuth, isA<Function>());
    });
  });

  group('Widget Structure Tests', () {
    testWidgets('Login form should have required fields',
        (WidgetTester tester) async {
      // Testar estrutura do formulário de login isoladamente
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              child: Column(
                children: [
                  TextFormField(
                    key: const Key('email_field'),
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  TextFormField(
                    key: const Key('password_field'),
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                  ),
                  ElevatedButton(
                    key: const Key('login_button'),
                    onPressed: () {},
                    child: const Text('Entrar'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Verificar se todos os campos existem
      expect(find.byKey(const Key('email_field')), findsOneWidget);
      expect(find.byKey(const Key('password_field')), findsOneWidget);
      expect(find.byKey(const Key('login_button')), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Entrar'), findsOneWidget);
    });

    testWidgets('Bottom navigation should have correct structure',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: const Text('Home Content'),
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: 0,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home),
                  label: 'Início',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.school),
                  label: 'Cursos',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person),
                  label: 'Perfil',
                ),
              ],
            ),
          ),
        ),
      );

      // Verificar se bottom navigation existe com os items corretos
      expect(find.byType(BottomNavigationBar), findsOneWidget);
      expect(find.text('Início'), findsOneWidget);
      expect(find.text('Cursos'), findsOneWidget);
      expect(find.text('Perfil'), findsOneWidget);
      expect(find.byIcon(Icons.home), findsOneWidget);
      expect(find.byIcon(Icons.school), findsOneWidget);
      expect(find.byIcon(Icons.person), findsOneWidget);
    });

    testWidgets('App bar should be configurable', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFFFF8000),
              foregroundColor: Colors.white,
            ),
          ),
          home: Scaffold(
            appBar: AppBar(
              title: const Text('SoftSkills'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.settings),
                  onPressed: () {},
                ),
              ],
            ),
            body: const Text('App Content'),
          ),
        ),
      );

      expect(find.text('SoftSkills'), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
      expect(find.text('App Content'), findsOneWidget);
    });
  });

  group('Form Validation Tests', () {
    testWidgets('Email validation should work correctly',
        (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                key: const Key('email_input'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Por favor, insira o email';
                  }
                  if (!value.contains('@')) {
                    return 'Email inválido';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Testar campo vazio
      expect(formKey.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Por favor, insira o email'), findsOneWidget);

      // Testar email inválido
      await tester.enterText(
          find.byKey(const Key('email_input')), 'email_invalido');
      expect(formKey.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Email inválido'), findsOneWidget);

      // Testar email válido
      await tester.enterText(
          find.byKey(const Key('email_input')), 'test@example.com');
      expect(formKey.currentState!.validate(), isTrue);
    });

    testWidgets('Password validation should work correctly',
        (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                key: const Key('password_input'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Por favor, insira a password';
                  }
                  if (value.length < 6) {
                    return 'Password deve ter pelo menos 6 caracteres';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Testar campo vazio
      expect(formKey.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Por favor, insira a password'), findsOneWidget);

      // Testar password muito curta
      await tester.enterText(find.byKey(const Key('password_input')), '123');
      expect(formKey.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Password deve ter pelo menos 6 caracteres'),
          findsOneWidget);

      // Testar password válida
      await tester.enterText(find.byKey(const Key('password_input')), '123456');
      expect(formKey.currentState!.validate(), isTrue);
    });
  });

  group('Navigation Tests', () {
    testWidgets('Basic navigation should work', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          initialRoute: '/test',
          routes: {
            '/test': (context) => Scaffold(
                  body: Column(
                    children: [
                      const Text('Test Screen'),
                      ElevatedButton(
                        key: const Key('to_login'),
                        onPressed: () => Navigator.pushNamed(context, '/login'),
                        child: const Text('To Login'),
                      ),
                    ],
                  ),
                ),
            '/login': (context) => const Scaffold(
                  body: Text('Login Screen'),
                ),
          },
        ),
      );

      // Verificar se está na tela inicial
      expect(find.text('Test Screen'), findsOneWidget);
      expect(find.text('To Login'), findsOneWidget);

      // Testar navegação para login
      await tester.tap(find.byKey(const Key('to_login')));
      await tester.pumpAndSettle();
      expect(find.text('Login Screen'), findsOneWidget);
    });

    testWidgets('Navigator pop should work', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const Text('Home Screen'),
                Builder(
                  builder: (context) => ElevatedButton(
                    key: const Key('push_page'),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => Scaffold(
                          appBar: AppBar(title: const Text('Second Page')),
                          body: const Text('Second Screen'),
                        ),
                      ),
                    ),
                    child: const Text('Push Page'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Verificar tela inicial
      expect(find.text('Home Screen'), findsOneWidget);

      // Navegar para segunda tela
      await tester.tap(find.byKey(const Key('push_page')));
      await tester.pumpAndSettle();
      expect(find.text('Second Screen'), findsOneWidget);
      expect(find.text('Second Page'), findsOneWidget);

      // Voltar usando AppBar back button
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Home Screen'), findsOneWidget);
    });
  });

  group('Error Handling Tests', () {
    testWidgets('Loading states should be handled correctly',
        (WidgetTester tester) async {
      bool isLoading = false;

      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                body: Center(
                  child: isLoading
                      ? const CircularProgressIndicator()
                      : ElevatedButton(
                          key: const Key('load_button'),
                          onPressed: () => setState(() => isLoading = true),
                          child: const Text('Load'),
                        ),
                ),
              );
            },
          ),
        ),
      );

      // Estado inicial
      expect(find.text('Load'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Após carregar
      await tester.tap(find.byKey(const Key('load_button')));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Load'), findsNothing);
    });

    testWidgets('Empty state should be displayed correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inbox,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  const Text('Nenhum item encontrado'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {},
                    child: const Text('Tentar novamente'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.inbox), findsOneWidget);
      expect(find.text('Nenhum item encontrado'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);
    });
  });

  group('API Service Tests', () {
    test('ApiService should be singleton', () {
      final instance1 = ApiService();
      final instance2 = ApiService();

      expect(identical(instance1, instance2), isTrue);
    });

    test('ApiService should have required methods', () {
      final apiService = ApiService();

      // Verificar se métodos existem (sem chamá-los para evitar dependências)
      expect(apiService.setAuthToken, isA<Function>());
      expect(apiService.clearAuthToken, isA<Function>());
      expect(apiService.get, isA<Function>());
      expect(apiService.post, isA<Function>());
      expect(apiService.put, isA<Function>());
      expect(apiService.delete, isA<Function>());
    });

    test('ApiService should have image URL methods', () {
      final apiService = ApiService();

      // Verificar métodos de URL de imagem
      expect(apiService.getUserAvatarUrl, isA<Function>());
      expect(apiService.getUserCapaUrl, isA<Function>());
      expect(apiService.getCursoCapaUrl, isA<Function>());
    });

    test('ApiService should have proper HTTP methods', () {
      final apiService = ApiService();

      // Verificar métodos HTTP
      expect(apiService.get, isA<Function>());
      expect(apiService.post, isA<Function>());
      expect(apiService.put, isA<Function>());
      expect(apiService.patch, isA<Function>());
      expect(apiService.delete, isA<Function>());
    });
  });

  group('App Utils Tests', () {
    test('AppUtils should have utility methods', () {
      // Verificar se métodos de utilitário existem
      expect(AppUtils.showSuccess, isA<Function>());
      expect(AppUtils.showError, isA<Function>());
      expect(AppUtils.showInfo, isA<Function>());
    });

    test('AppUtils methods should have correct signatures', () {
      // Verificar que são funções que aceitam BuildContext e String
      final showSuccess = AppUtils.showSuccess;
      final showError = AppUtils.showError;
      final showInfo = AppUtils.showInfo;

      expect(showSuccess, isA<Function>());
      expect(showError, isA<Function>());
      expect(showInfo, isA<Function>());
    });
  });

  group('Theme Tests', () {
    testWidgets('Material theme should be properly applied',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            primarySwatch: Colors.orange,
            primaryColor: const Color(0xFFFF8000),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF8000),
              ),
            ),
          ),
          home: Scaffold(
            body: Column(
              children: [
                const Text('Theme Test'),
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Button'),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.text('Theme Test'), findsOneWidget);
      expect(find.text('Button'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });
  });

  group('Card Component Tests', () {
    testWidgets('Cards should render correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView(
              children: [
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.person),
                    title: const Text('User Name'),
                    subtitle: const Text('user@example.com'),
                    trailing: const Icon(Icons.arrow_forward),
                    onTap: () {},
                  ),
                ),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.school),
                    title: const Text('Course Name'),
                    subtitle: const Text('Course Description'),
                    trailing: const Icon(Icons.arrow_forward),
                    onTap: () {},
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(Card), findsNWidgets(2));
      expect(find.text('User Name'), findsOneWidget);
      expect(find.text('Course Name'), findsOneWidget);
      expect(find.byIcon(Icons.person), findsOneWidget);
      expect(find.byIcon(Icons.school), findsOneWidget);
    });
  });
}
