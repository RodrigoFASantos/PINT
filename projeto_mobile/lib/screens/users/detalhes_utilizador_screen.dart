import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class DetalhesUtilizadorScreen extends StatefulWidget {
  final int utilizadorId;

  const DetalhesUtilizadorScreen({Key? key, required this.utilizadorId})
      : super(key: key);

  @override
  _DetalhesUtilizadorScreenState createState() =>
      _DetalhesUtilizadorScreenState();
}

class _DetalhesUtilizadorScreenState extends State<DetalhesUtilizadorScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final _formKey = GlobalKey<FormState>();

  // Controllers para edição
  final _nomeController = TextEditingController();
  final _emailController = TextEditingController();
  final _telefoneController = TextEditingController();
  final _biografiaController = TextEditingController();

  Map<String, dynamic>? _utilizador;
  List<dynamic> _inscricoes = [];
  bool _loading = true;
  bool _editMode = false;
  bool _saving = false;
  String? _error;
  int? _cargoSelecionado;

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _emailController.dispose();
    _telefoneController.dispose();
    _biografiaController.dispose();
    super.dispose();
  }

  Future<void> _carregarDados() async {
    try {
      setState(() => _loading = true);

      final utilizador = await ApiService.getUtilizador(widget.utilizadorId);

      // Carregar inscrições do utilizador (simulado)
      final inscricoes = await _carregarInscricoesUtilizador();

      setState(() {
        _utilizador = utilizador['data'] ?? utilizador;
        _inscricoes = inscricoes;

        // Preencher controllers
        _nomeController.text = _utilizador!['nome'] ?? '';
        _emailController.text = _utilizador!['email'] ?? '';
        _telefoneController.text = _utilizador!['telefone'] ?? '';
        _biografiaController.text = _utilizador!['biografia'] ?? '';
        _cargoSelecionado = _utilizador!['id_cargo'];

        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar detalhes do utilizador';
        _loading = false;
      });
    }
  }

  Future<List<dynamic>> _carregarInscricoesUtilizador() async {
    try {
      // Na implementação real, seria um endpoint específico
      // Por agora, simulamos uma lista vazia
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> _salvarAlteracoes() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    try {
      final dadosAtualizados = {
        'nome': _nomeController.text.trim(),
        'telefone': _telefoneController.text.trim(),
        'biografia': _biografiaController.text.trim(),
        'id_cargo': _cargoSelecionado,
      };

      await ApiService.updateUtilizador(widget.utilizadorId, dadosAtualizados);

      setState(() {
        _editMode = false;
        _saving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Utilizador atualizado com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );

      await _carregarDados();
    } catch (e) {
      setState(() => _saving = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao atualizar utilizador: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _eliminarUtilizador() async {
    final confirmacao = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirmar Eliminação'),
        content: Text(
          'Tem certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmacao == true) {
      try {
        await ApiService().deleteUtilizador(widget.utilizadorId);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Utilizador eliminado com sucesso'),
            backgroundColor: AppColors.success,
          ),
        );

        Navigator.pop(context);
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao eliminar utilizador: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _getCargoNome(int? idCargo) {
    switch (idCargo) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Formador';
      case 3:
        return 'Formando';
      default:
        return 'Utilizador';
    }
  }

  Color _getCargoColor(int? idCargo) {
    switch (idCargo) {
      case 1:
        return Colors.purple;
      case 2:
        return Colors.blue;
      case 3:
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Data não disponível';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Detalhes do Utilizador'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_error != null || _utilizador == null) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Detalhes do Utilizador'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, color: AppColors.error, size: 64),
              SizedBox(height: AppSpacing.md),
              Text(_error ?? 'Utilizador não encontrado'),
              SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: _carregarDados,
                child: Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Detalhes do Utilizador'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (!_editMode) ...[
            IconButton(
              icon: Icon(Icons.edit),
              onPressed: () => setState(() => _editMode = true),
              tooltip: 'Editar utilizador',
            ),
            PopupMenuButton(
              icon: Icon(Icons.more_vert),
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: AppColors.error),
                      SizedBox(width: AppSpacing.sm),
                      Text('Eliminar'),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                if (value == 'delete') {
                  _eliminarUtilizador();
                }
              },
            ),
          ] else ...[
            IconButton(
              icon: Icon(Icons.close),
              onPressed: () {
                setState(() {
                  _editMode = false;
                  // Restaurar dados originais
                  _nomeController.text = _utilizador!['nome'] ?? '';
                  _telefoneController.text = _utilizador!['telefone'] ?? '';
                  _biografiaController.text = _utilizador!['biografia'] ?? '';
                  _cargoSelecionado = _utilizador!['id_cargo'];
                });
              },
              tooltip: 'Cancelar edição',
            ),
            IconButton(
              icon: _saving
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Icon(Icons.save),
              onPressed: _saving ? null : _salvarAlteracoes,
              tooltip: 'Salvar alterações',
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppSpacing.md),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Cabeçalho com informações principais
              _buildHeader(),

              SizedBox(height: AppSpacing.lg),

              // Informações pessoais
              _buildInformacoesPessoais(),

              SizedBox(height: AppSpacing.lg),

              // Inscrições e atividade
              _buildAtividadeUtilizador(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final nome = _utilizador!['nome'] ?? 'Nome não disponível';
    final email = _utilizador!['email'] ?? '';
    final cargo = _utilizador!['id_cargo'];
    final ativo = _utilizador!['ativo'] ?? true;

    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                child: ClipOval(
                  child: Image.network(
                    ApiService.userAvatar(email),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[300],
                        child: Icon(
                          Icons.person,
                          size: 40,
                          color: Colors.grey[600],
                        ),
                      );
                    },
                  ),
                ),
              ),

              SizedBox(width: AppSpacing.md),

              // Informações básicas
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nome,
                      style: AppTextStyles.headline2,
                    ),
                    SizedBox(height: AppSpacing.xs),
                    Text(
                      email,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        // Cargo
                        Container(
                          padding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _getCargoColor(cargo).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _getCargoNome(cargo),
                            style: AppTextStyles.labelMedium.copyWith(
                              color: _getCargoColor(cargo),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                        SizedBox(width: AppSpacing.sm),

                        // Status ativo/inativo
                        Container(
                          padding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: ativo
                                ? AppColors.success.withOpacity(0.1)
                                : AppColors.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            ativo ? 'Ativo' : 'Inativo',
                            style: AppTextStyles.labelMedium.copyWith(
                              color:
                                  ativo ? AppColors.success : AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInformacoesPessoais() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
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
          Text(
            'Informações Pessoais',
            style: AppTextStyles.headline3,
          ),

          SizedBox(height: AppSpacing.lg),

          // Nome
          TextFormField(
            controller: _nomeController,
            enabled: _editMode,
            decoration: InputDecoration(
              labelText: 'Nome',
              prefixIcon: Icon(Icons.person),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'O nome é obrigatório';
              }
              return null;
            },
          ),

          SizedBox(height: AppSpacing.md),

          // Email (apenas leitura)
          TextFormField(
            controller: _emailController,
            enabled: false,
            decoration: InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email),
              border: OutlineInputBorder(),
              helperText: 'O email não pode ser alterado',
            ),
          ),

          SizedBox(height: AppSpacing.md),

          // Telefone
          TextFormField(
            controller: _telefoneController,
            enabled: _editMode,
            decoration: InputDecoration(
              labelText: 'Telefone',
              prefixIcon: Icon(Icons.phone),
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.phone,
          ),

          SizedBox(height: AppSpacing.md),

          // Cargo (apenas admin pode alterar)
          if (_editMode)
            DropdownButtonFormField<int>(
              value: _cargoSelecionado,
              decoration: InputDecoration(
                labelText: 'Cargo',
                prefixIcon: Icon(Icons.work),
                border: OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem(value: 1, child: Text('Administrador')),
                DropdownMenuItem(value: 2, child: Text('Formador')),
                DropdownMenuItem(value: 3, child: Text('Formando')),
              ],
              onChanged: (value) {
                setState(() => _cargoSelecionado = value);
              },
            )
          else
            TextFormField(
              initialValue: _getCargoNome(_cargoSelecionado),
              enabled: false,
              decoration: InputDecoration(
                labelText: 'Cargo',
                prefixIcon: Icon(Icons.work),
                border: OutlineInputBorder(),
              ),
            ),

          SizedBox(height: AppSpacing.md),

          // Biografia
          TextFormField(
            controller: _biografiaController,
            enabled: _editMode,
            decoration: InputDecoration(
              labelText: 'Biografia',
              prefixIcon: Icon(Icons.description),
              border: OutlineInputBorder(),
              hintText: 'Informações adicionais sobre o utilizador...',
            ),
            maxLines: 3,
          ),

          if (!_editMode) ...[
            SizedBox(height: AppSpacing.lg),

            // Informações adicionais (apenas visualização)
            _buildInfoRow(
              'Data de Criação',
              _formatDate(_utilizador!['data_criacao']),
              Icons.calendar_today,
            ),

            if (_utilizador!['ultimo_login'] != null) ...[
              SizedBox(height: AppSpacing.md),
              _buildInfoRow(
                'Último Login',
                _formatDate(_utilizador!['ultimo_login']),
                Icons.login,
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.labelMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                value,
                style: AppTextStyles.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAtividadeUtilizador() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.large),
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
          Text(
            'Atividade e Inscrições',
            style: AppTextStyles.headline3,
          ),

          SizedBox(height: AppSpacing.lg),

          // Estatísticas rápidas
          Row(
            children: [
              Expanded(
                child: _buildEstatisticaCard(
                  'Cursos Inscritos',
                  _inscricoes.length.toString(),
                  Icons.school,
                  AppColors.primary,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildEstatisticaCard(
                  'Cursos Concluídos',
                  _inscricoes
                      .where((i) => i['status'] == 'Concluído')
                      .length
                      .toString(),
                  Icons.check_circle,
                  AppColors.success,
                ),
              ),
            ],
          ),

          SizedBox(height: AppSpacing.lg),

          // Lista de inscrições
          if (_inscricoes.isEmpty)
            Container(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  Icon(
                    Icons.school_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  SizedBox(height: AppSpacing.md),
                  Text(
                    'Este utilizador ainda não se inscreveu em nenhum curso.',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Text('Lista de inscrições aparecerá aqui quando implementada.'),
        ],
      ),
    );
  }

  Widget _buildEstatisticaCard(
      String titulo, String valor, IconData icone, Color cor) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: cor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: cor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icone, color: cor, size: 30),
          SizedBox(height: AppSpacing.sm),
          Text(
            valor,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: cor,
            ),
          ),
          SizedBox(height: AppSpacing.xs),
          Text(
            titulo,
            style: AppTextStyles.labelSmall.copyWith(color: cor),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
