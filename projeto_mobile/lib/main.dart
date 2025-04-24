import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login.dart';
import 'screens/home.dart';
import 'screens/register.dart';
import 'screens/recoverpassword.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'The SoftSkills',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFFFF8000),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF8000),
          primary: const Color(0xFFFF8000),
        ),
        scaffoldBackgroundColor: const Color(0xFF1A1A1A),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Colors.white),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF8000),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ),
      ),
      // Definir rotas da aplicação
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginPage(),
        '/home': (context) => const HomePage(),
        '/register': (context) => const RegisterPage(),
        '/recover': (context) => const RecoverPasswordPage(),
      },
    );
  }
}

// Classes temporárias para evitar erros (você precisará implementá-las)
class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(child: Text('Página inicial', style: TextStyle(color: Colors.white))),
    );
  }
}

class RegisterPage extends StatelessWidget {
  const RegisterPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Criar Conta')),
      body: const Center(child: Text('Página de registro', style: TextStyle(color: Colors.white))),
    );
  }
}

class RecoverPasswordPage extends StatelessWidget {
  const RecoverPasswordPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recuperar Senha')),
      body: const Center(child: Text('Página de recuperação de senha', style: TextStyle(color: Colors.white))),
    );
  }
}