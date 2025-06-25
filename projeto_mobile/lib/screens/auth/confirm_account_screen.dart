import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';

class ConfirmAccountScreen extends StatefulWidget {
  final String? token;

  const ConfirmAccountScreen({Key? key, this.token}) : super(key: key);

  @override
  _ConfirmAccountScreenState createState() => _ConfirmAccountScreenState();
}

class _ConfirmAccountScreenState extends State<ConfirmAccountScreen> {
  final _apiService = ApiService();

  // Estados possíveis: loading, success, error
  String _status = 'loading';
  String _message = '';
  String? _email;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();

    // Verificar se o token foi fornecido
    if (widget.token == null || widget.token!.isEmpty) {
      setState(() {
        _status = 'error';
        _message = 'Link inválido. Nenhum token de confirmação encontrado.';
      });
      return;
    }

    // Iniciar o processo de confirmação da conta
    _confirmAccount(widget.token!);
  }

  // Processar confirmação da conta com o token fornecido
  Future<void> _confirmAccount(String token) async {
    try {
      setState(() => _status = 'loading');

      debugPrint('A confirmar conta com token...');

      final result = await _apiService.confirmAccount(token);

      debugPrint('Resultado da confirmação: $result');

      // Extrair o email do token para permitir reenvio se necessário
      _email = _apiService.extractEmailFromToken(token);

      if (result != null && result['success'] == true) {
        setState(() {
          _status = 'success';
          _message = result['message'] ?? 'Conta confirmada com sucesso!';
        });

        // Se recebeu um token de autenticação, guardar os dados
        if (result['token'] != null) {
          final userData = result['user'] as Map<String, dynamic>?;

          if (userData != null) {
            await AuthManager.saveAuthData(
              token: result['token'],
              email: userData['email'] ?? _email ?? '',
              name: userData['nome'],
              userType: userData['cargo'],
            );
          }

          // Redirecionar para a página inicial após 3 segundos
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              Navigator.pushReplacementNamed(context, '/home');
            }
          });
        }
      } else {
        setState(() {
          _status = 'error';
          _message = result?['message'] ??
              'Erro ao confirmar a conta. O link pode ter expirado ou ser inválido.';
        });
      }
    } catch (e) {
      debugPrint('Erro ao confirmar conta: $e');
      setState(() {
        _status = 'error';
        _message =
            'Erro ao confirmar a conta. O link pode ter expirado ou ser inválido.';
      });
    }
  }

  // Processar reenvio do email de confirmação
  Future<void> _handleResendConfirmation() async {
    if (_email == null || _email!.isEmpty || _isResending) return;

    setState(() => _isResending = true);

    try {
      final result = await _apiService.resendConfirmation(_email!);

      if (result != null && result['success'] == true) {
        AppUtils.showSuccess(context,
            result['message'] ?? 'Email de confirmação reenviado com sucesso!');
      } else {
        AppUtils.showError(context,
            result?['message'] ?? 'Erro ao reenviar o email de confirmação.');
      }
    } catch (e) {
      AppUtils.showError(
          context, 'Erro ao reenviar o email de confirmação. Tente novamente.');
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  // Construir conteúdo baseado no estado atual
  Widget _buildContent() {
    switch (_status) {
      case 'loading':
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
            ),
            const SizedBox(height: 24),
            const Text(
              'A confirmar a conta...',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        );

      case 'success':
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Ícone de sucesso
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.circular(40),
              ),
              child: const Icon(
                Icons.check,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Conta confirmada com sucesso!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              _message,
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'Será redirecionado para a página inicial em alguns segundos...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
            ),
          ],
        );

      case 'error':
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Ícone de erro
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(40),
              ),
              child: const Icon(
                Icons.error,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Erro na confirmação',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              _message,
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Botão para reenviar confirmação se tivermos email
            if (_email != null && _email!.isNotEmpty) ...[
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isResending ? null : _handleResendConfirmation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF8000),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isResending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Reenviar email de confirmação',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Botão para voltar ao login
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/login'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF8000),
                  side: const BorderSide(color: Color(0xFFFF8000)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Voltar para o Login',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        );

      default:
        return Container();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
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

              // Subtítulo
              const Text(
                'Confirmação de Conta',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 48),

              // Cartão principal com o conteúdo
              Expanded(
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                    side: const BorderSide(color: Color(0xFFFF8000), width: 2),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: _buildContent(),
                  ),
                ),
              ),

              const SizedBox(height: 16),

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
    );
  }
}
