import 'package:flutter/material.dart';
import '../../services/api_service.dart'; // ✅ ADICIONADO - Para usar os métodos de confirmação
import '../../utils/constants.dart';

class ConfirmAccountScreen extends StatefulWidget {
  final String? token; // ✅ ADICIONADO - Parâmetro token

  const ConfirmAccountScreen({Key? key, this.token})
      : super(key: key); // ✅ CORRIGIDO - Construtor com token

  @override
  _ConfirmAccountScreenState createState() => _ConfirmAccountScreenState();
}

class _ConfirmAccountScreenState extends State<ConfirmAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _codigoController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    // ✅ ADICIONADO - Se tiver token na URL, tentar confirmar automaticamente
    if (widget.token != null && widget.token!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _confirmarComToken(widget.token!);
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codigoController.dispose();
    super.dispose();
  }

  // ✅ ADICIONADO - Método para confirmar com token da URL
  Future<void> _confirmarComToken(String token) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final response = await ApiService().confirmAccount(token);

      setState(() {
        _successMessage = 'Conta confirmada com sucesso!';
      });

      // Navegar para login após confirmação
      Future.delayed(Duration(seconds: 2), () {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/login',
          (route) => false,
        );
      });
    } catch (e) {
      setState(() {
        _errorMessage =
            'Token inválido ou expirado. Use o formulário abaixo para confirmar manualmente.';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmarConta() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      // ✅ CORRIGIDO - Usar API real em vez de simulação
      final response =
          await ApiService().confirmAccount(_codigoController.text);

      setState(() {
        _successMessage = 'Conta confirmada com sucesso!';
      });

      // Navegar para login após confirmação
      Future.delayed(Duration(seconds: 2), () {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/login',
          (route) => false,
        );
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Código de confirmação inválido. Tente novamente.';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _reenviarCodigo() async {
    if (_emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Por favor, insira o email'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // ✅ CORRIGIDO - Usar API real em vez de simulação
      await ApiService().resendConfirmation(_emailController.text);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Código reenviado com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao reenviar código'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Card(
              elevation: 12,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
                side: BorderSide(color: AppColors.cardBorder, width: 2),
              ),
              child: Container(
                padding: EdgeInsets.all(AppSpacing.xl),
                constraints: BoxConstraints(maxWidth: 400),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Ícone e título
                      Icon(
                        Icons.verified_user,
                        size: 64,
                        color: AppColors.primary,
                      ),
                      SizedBox(height: AppSpacing.md),
                      Text(
                        'Confirmar Conta',
                        style: AppTextStyles.headline2.copyWith(
                          color: AppColors.primary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: AppSpacing.sm),
                      Text(
                        widget.token != null
                            ? 'Confirmando conta automaticamente...'
                            : 'Insira o código de confirmação enviado para o seu email',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      SizedBox(height: AppSpacing.xl),

                      // Mostrar formulário apenas se não tiver token ou se der erro
                      if (widget.token == null || _errorMessage != null) ...[
                        // Campo Email
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Por favor, insira o email';
                            }
                            if (!RegExp(AppConstants.emailPattern)
                                .hasMatch(value)) {
                              return 'Email inválido';
                            }
                            return null;
                          },
                        ),

                        SizedBox(height: AppSpacing.md),

                        // Campo Código de Confirmação
                        TextFormField(
                          controller: _codigoController,
                          keyboardType: TextInputType.text,
                          decoration: InputDecoration(
                            labelText: 'Código de Confirmação',
                            prefixIcon: Icon(Icons.security),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            hintText: 'Cole o token aqui',
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Por favor, insira o código/token';
                            }
                            return null;
                          },
                        ),

                        SizedBox(height: AppSpacing.sm),
                      ],

                      // Mensagens de erro/sucesso
                      if (_errorMessage != null)
                        Container(
                          margin: EdgeInsets.only(bottom: AppSpacing.sm),
                          padding: EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: AppColors.error.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error,
                                  color: AppColors.error, size: 20),
                              SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyle(color: AppColors.error),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (_successMessage != null)
                        Container(
                          margin: EdgeInsets.only(bottom: AppSpacing.sm),
                          padding: EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: AppColors.success.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle,
                                  color: AppColors.success, size: 20),
                              SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  _successMessage!,
                                  style: TextStyle(color: AppColors.success),
                                ),
                              ),
                            ],
                          ),
                        ),

                      SizedBox(height: AppSpacing.lg),

                      // Mostrar botão confirmar apenas se não tiver token ou se der erro
                      if (widget.token == null || _errorMessage != null) ...[
                        // Botão Confirmar
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _confirmarConta,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: _isLoading
                                ? SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Text(
                                    'Confirmar Conta',
                                    style: AppTextStyles.button,
                                  ),
                          ),
                        ),

                        SizedBox(height: AppSpacing.md),

                        // Link para reenviar código
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Não recebeu o código? ',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                            TextButton(
                              onPressed: _isLoading ? null : _reenviarCodigo,
                              child: Text(
                                'Reenviar',
                                style: TextStyle(color: AppColors.primary),
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: AppSpacing.md),
                      ],

                      // Link para voltar ao login
                      TextButton(
                        onPressed: () => Navigator.pushNamed(context, '/login'),
                        child: Text(
                          'Voltar ao Login',
                          style: TextStyle(color: AppColors.primary),
                        ),
                      ),

                      // Mostrar informação sobre teste apenas se não tiver token
                      if (widget.token == null) ...[
                        SizedBox(height: AppSpacing.lg),

                        // Informação sobre o código
                        Container(
                          padding: EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.info.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: AppColors.info.withOpacity(0.3)),
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.info,
                                      color: AppColors.info, size: 20),
                                  SizedBox(width: AppSpacing.sm),
                                  Expanded(
                                    child: Text(
                                      'Código de teste: 123456',
                                      style: TextStyle(
                                        color: AppColors.info,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: AppSpacing.xs),
                              Text(
                                'Para fins de demonstração, use o código acima.',
                                style: TextStyle(
                                  color: AppColors.info,
                                  fontSize: 12,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
