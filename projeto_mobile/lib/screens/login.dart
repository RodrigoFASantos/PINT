import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  
  bool _lembrar = false;
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  Future<void> _checkToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    if (token != null) {
      // Se já estiver logado, redirecionar para a tela inicial
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushReplacementNamed(context, '/home');
      });
    }
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      try {
        // Simular requisição de login
        await Future.delayed(const Duration(seconds: 2));
        
        // Substituir essa parte pela sua API real de login
        bool success = await _loginAPI(
          _emailController.text,
          _passwordController.text,
        );

        if (success) {
          // Salvar token (exemplo)
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', 'exemplo-token-123456');
          
          if (_lembrar) {
            // Salvar credenciais se a opção "lembrar" estiver marcada
            await prefs.setString('savedEmail', _emailController.text);
          }
          
          // Definir flag para atualização
          await prefs.setBool('needsRefresh', true);
          
          // Navegar para home
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/home');
          }
        } else {
          setState(() {
            _errorMessage = "Credenciais inválidas";
            _isLoading = false;
          });
        }
      } catch (e) {
        setState(() {
          _errorMessage = "Erro ao fazer login: ${e.toString()}";
          _isLoading = false;
        });
      }
    }
  }

  // Simulação da API de login - substituir pela implementação real
  Future<bool> _loginAPI(String email, String password) async {
    // Implementar chamada real para a API
    return email.contains('@') && password.length >= 6;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A1A),
                border: Border.all(
                  color: const Color(0xFFFF8000),
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(15),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x80FF8000),
                    blurRadius: 10,
                    offset: Offset(0, 0),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              width: double.infinity,
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Logo
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Image.asset(
                        'assets/images/Logo_Login.png',
                        width: double.infinity,
                      ),
                    ),
                    
                    // Mensagem de erro
                    if (_errorMessage != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFEEEE),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    
                    // Campo de email
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        hintText: 'Email',
                        border: OutlineInputBorder(
                          borderSide: BorderSide.none,
                          borderRadius: BorderRadius.all(Radius.circular(5)),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Por favor, insira seu email';
                        }
                        if (!value.contains('@')) {
                          return 'Por favor, insira um email válido';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    
                    // Campo de senha
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        hintText: 'Senha',
                        border: OutlineInputBorder(
                          borderSide: BorderSide.none,
                          borderRadius: BorderRadius.all(Radius.circular(5)),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Por favor, insira sua senha';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    
                    // Checkbox para "Lembrar"
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            height: 24,
                            width: 24,
                            child: Checkbox(
                              value: _lembrar,
                              onChanged: (value) {
                                setState(() {
                                  _lembrar = value ?? false;
                                });
                              },
                              activeColor: const Color(0xFFFF8000),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Lembrar',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    
                    // Botão de login
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8000),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                        child: _isLoading 
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Entrar',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    
                    // Links para criar conta e recuperar senha
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register');
                      },
                      child: const Text(
                        'Criar conta',
                        style: TextStyle(
                          color: Color(0xFFFF8000),
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/recover');
                      },
                      child: const Text(
                        'Esqueci a senha!',
                        style: TextStyle(
                          color: Color(0xFFFF8000),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}