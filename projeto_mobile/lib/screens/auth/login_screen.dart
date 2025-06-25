import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Controladores e chaves do formulário
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _resendEmailController = TextEditingController();
  final _forgotEmailController = TextEditingController();
  final _apiService = ApiService();

  // Estados principais
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Estados para controlo de diferentes formulários
  bool _showResendForm = false;
  bool _showForgotForm = false;

  // Estados para reenvio de confirmação
  bool _resendLoading = false;
  String _resendMessage = '';
  String _resendError = '';

  // Estados para recuperação de senha
  bool _forgotLoading = false;
  String _forgotMessage = '';
  String _forgotError = '';

  @override
  void dispose() {
    // Limpar controladores quando o widget é destruído
    _emailController.dispose();
    _passwordController.dispose();
    _resendEmailController.dispose();
    _forgotEmailController.dispose();
    super.dispose();
  }

  // Processar tentativa de login
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      debugPrint('A iniciar login...');

      final result = await _apiService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      debugPrint('Resultado do login recebido: $result');

      if (result != null) {
        if (result['success'] == true) {
          debugPrint('Login bem-sucedido!');

          final userData = result['user'] as Map<String, dynamic>?;
          final token = result['token'] as String?;

          if (token != null && userData != null) {
            // Guardar dados de autenticação
            await AuthManager.saveAuthData(
              token: token,
              email: userData['email'] ?? _emailController.text.trim(),
              name: userData['nome'],
              userType: userData['cargo'],
            );

            AppUtils.showSuccess(context, 'Login realizado com sucesso!');
            Navigator.pushReplacementNamed(context, '/home');
          } else {
            AppUtils.showError(context, 'Dados de resposta incompletos');
          }
        } else {
          final message = result['message'] ?? 'Erro no login';
          AppUtils.showError(context, message);
        }
      } else {
        AppUtils.showError(context, 'Erro de comunicação com o servidor');
      }
    } catch (e) {
      debugPrint('Erro de exceção no login: $e');
      AppUtils.showError(context, 'Erro de ligação: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Processar reenvio de email de confirmação
  Future<void> _handleResendConfirmation() async {
    if (_resendEmailController.text.trim().isEmpty) {
      setState(() => _resendError = 'Por favor, insira um email válido');
      return;
    }

    final email = _resendEmailController.text.trim();
    if (!email.contains('@')) {
      setState(() => _resendError = 'Email inválido');
      return;
    }

    setState(() {
      _resendLoading = true;
      _resendError = '';
      _resendMessage = '';
    });

    try {
      final result = await _apiService.resendConfirmation(email);

      if (result != null && result['success'] == true) {
        setState(() {
          _resendMessage =
              'Email de confirmação reenviado com sucesso! Verifique a caixa de entrada.';
        });

        // Voltar para login após 5 segundos
        Future.delayed(Duration(seconds: 5), () {
          if (mounted) {
            _backToLogin();
          }
        });
      } else {
        setState(() {
          _resendError = result?['message'] ??
              'Erro ao reenviar confirmação. Este email pode não estar registado ou já foi confirmado.';
        });
      }
    } catch (e) {
      setState(() {
        _resendError = 'Erro de ligação. Tente novamente.';
      });
    } finally {
      if (mounted) {
        setState(() => _resendLoading = false);
      }
    }
  }

  // Processar pedido de recuperação de senha
  Future<void> _handleForgotPassword() async {
    if (_forgotEmailController.text.trim().isEmpty) {
      setState(() => _forgotError = 'Por favor, insira um email válido');
      return;
    }

    final email = _forgotEmailController.text.trim();
    if (!email.contains('@')) {
      setState(() => _forgotError = 'Email inválido');
      return;
    }

    setState(() {
      _forgotLoading = true;
      _forgotError = '';
      _forgotMessage = '';
    });

    try {
      final result = await _apiService.forgotPassword(email);

      if (result != null && result['success'] == true) {
        setState(() {
          _forgotMessage =
              'Email de recuperação enviado com sucesso! Verifique a caixa de entrada e siga as instruções para redefinir a senha.';
        });

        // Voltar para login após 5 segundos
        Future.delayed(Duration(seconds: 5), () {
          if (mounted) {
            _backToLogin();
          }
        });
      } else {
        setState(() {
          _forgotError = result?['message'] ??
              'Erro ao enviar email de recuperação. Verifique se o email está correto e tente novamente.';
        });
      }
    } catch (e) {
      setState(() {
        _forgotError = 'Erro de ligação. Tente novamente.';
      });
    } finally {
      if (mounted) {
        setState(() => _forgotLoading = false);
      }
    }
  }

  // Alternar para formulário de reenvio
  void _toggleResendForm() {
    setState(() {
      _showResendForm = !_showResendForm;
      _showForgotForm = false;
      _resendEmailController.clear();
      _resendMessage = '';
      _resendError = '';
    });
  }

  // Alternar para formulário de recuperação de senha
  void _toggleForgotForm() {
    setState(() {
      _showForgotForm = !_showForgotForm;
      _showResendForm = false;
      _forgotEmailController.clear();
      _forgotMessage = '';
      _forgotError = '';
    });
  }

  // Voltar para o formulário de login principal
  void _backToLogin() {
    setState(() {
      _showResendForm = false;
      _showForgotForm = false;
      _resendEmailController.clear();
      _forgotEmailController.clear();
      _resendMessage = '';
      _resendError = '';
      _forgotMessage = '';
      _forgotError = '';
    });
  }

  // Construir formulário principal de login
  Widget _buildLoginForm() {
    return Column(
      children: [
        const Text(
          'Entrar',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 24),

        // Campo de Email
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(5)),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
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
        const SizedBox(height: 16),

        // Campo de Password
        TextFormField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock),
            suffixIcon: IconButton(
              icon: Icon(
                  _obscurePassword ? Icons.visibility : Icons.visibility_off),
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
            ),
            border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(5)),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
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
        const SizedBox(height: 24),

        // Botão de Login
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _login,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Entrar',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 16),

        // Links para outras funcionalidades
        Column(
          children: [
            TextButton(
              onPressed: _toggleForgotForm,
              child: const Text(
                'Esqueci a senha!',
                style: TextStyle(color: Color(0xFFFF8000)),
              ),
            ),
            TextButton(
              onPressed: _toggleResendForm,
              child: const Text(
                'Não recebeu o email de confirmação?',
                style: TextStyle(color: Color(0xFFFF8000)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Construir formulário de reenvio de confirmação
  Widget _buildResendForm() {
    return Column(
      children: [
        const Text(
          'Reenviar email de confirmação',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),

        // Mensagem de sucesso
        if (_resendMessage.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.green[50],
              border: Border.all(color: Colors.green),
              borderRadius: BorderRadius.circular(5),
            ),
            child: Text(
              _resendMessage,
              style: const TextStyle(color: Colors.green),
              textAlign: TextAlign.center,
            ),
          ),

        // Mensagem de erro
        if (_resendError.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red),
              borderRadius: BorderRadius.circular(5),
            ),
            child: Text(
              _resendError,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),

        // Campo de email
        TextFormField(
          controller: _resendEmailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Digite o seu email',
            prefixIcon: Icon(Icons.email),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(5)),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 16),

        // Botão de envio
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _resendLoading ? null : _handleResendConfirmation,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            child: _resendLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Enviar',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 16),

        // Botão para voltar
        TextButton(
          onPressed: _backToLogin,
          child: const Text(
            'Voltar para o Login',
            style: TextStyle(color: Color(0xFFFF8000)),
          ),
        ),
      ],
    );
  }

  // Construir formulário de recuperação de senha
  Widget _buildForgotForm() {
    return Column(
      children: [
        const Text(
          'Recuperar senha',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),

        // Mensagem de sucesso
        if (_forgotMessage.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.green[50],
              border: Border.all(color: Colors.green),
              borderRadius: BorderRadius.circular(5),
            ),
            child: Text(
              _forgotMessage,
              style: const TextStyle(color: Colors.green),
              textAlign: TextAlign.center,
            ),
          ),

        // Mensagem de erro
        if (_forgotError.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red),
              borderRadius: BorderRadius.circular(5),
            ),
            child: Text(
              _forgotError,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ),

        // Campo de email
        TextFormField(
          controller: _forgotEmailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Digite o seu email',
            prefixIcon: Icon(Icons.email),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(5)),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 16),

        // Botão de envio
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _forgotLoading ? null : _handleForgotPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            child: _forgotLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Enviar',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 16),

        // Botão para voltar
        TextButton(
          onPressed: _backToLogin,
          child: const Text(
            'Voltar para o Login',
            style: TextStyle(color: Color(0xFFFF8000)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),

                // Logo da aplicação
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF8000),
                    borderRadius: BorderRadius.circular(20),
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
                    size: 60,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 32),

                // Nome da aplicação
                const Text(
                  'SoftSkills',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                // Slogan da aplicação
                const Text(
                  'Formação e partilha de conhecimento',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 48),

                // Cartão principal com formulários
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                    side: const BorderSide(color: Color(0xFFFF8000), width: 2),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: _showResendForm
                        ? _buildResendForm()
                        : _showForgotForm
                            ? _buildForgotForm()
                            : _buildLoginForm(),
                  ),
                ),

                const SizedBox(height: 32),

                // Informação da ligação
                Center(
                  child: Text(
                    'A conectar a: ${_apiService.apiBase}',
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 12,
                    ),
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
