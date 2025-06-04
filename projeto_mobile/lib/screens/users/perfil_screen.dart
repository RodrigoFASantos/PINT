import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class PerfilScreen extends StatefulWidget {
  @override
  _PerfilScreenState createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _nomeController = TextEditingController();
  final _emailController = TextEditingController();
  final _telefoneController = TextEditingController();
  final _biografiaController = TextEditingController();

  // Estados
  bool _loading = true;
  bool _editMode = false;
  bool _uploading = false;
  Map<String, dynamic>? _userProfile;
  String? _error;

  @override
  void initState() {
    super.initState();
    _carregarPerfil();
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _emailController.dispose();
    _telefoneController.dispose();
    _biografiaController.dispose();
    super.dispose();
  }

  Future<void> _carregarPerfil() async {
    try {
      setState(() => _loading = true);

      final profile = await ApiService().getUserProfile();

      setState(() {
        _userProfile = profile;
        _nomeController.text = profile['nome'] ?? '';
        _emailController.text = profile['email'] ?? '';
        _telefoneController.text = profile['telefone'] ?? '';
        _biografiaController.text = profile['biografia'] ?? '';
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar perfil: $e';
        _loading = false;
      });
    }
  }

  Future<void> _salvarPerfil() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      setState(() => _loading = true);

      final dadosAtualizados = {
        'nome': _nomeController.text,
        'telefone': _telefoneController.text,
        'biografia': _biografiaController.text,
      };

      await ApiService().updateUserProfile(dadosAtualizados);

      setState(() {
        _editMode = false;
        _loading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Perfil atualizado com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );

      await _carregarPerfil();
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao atualizar perfil: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _selecionarImagem() async {
    final picker = ImagePicker();

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.photo_library),
              title: Text('Galeria'),
              onTap: () {
                Navigator.pop(context);
                _uploadImagem(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: Icon(Icons.camera_alt),
              title: Text('Câmara'),
              onTap: () {
                Navigator.pop(context);
                _uploadImagem(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _uploadImagem(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: source);

      if (image == null) return;

      setState(() => _uploading = true);

      final file = File(image.path);
      final email = _userProfile?['email'] ?? '';

      await ApiService.uploadImagemPerfil(file, email);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Imagem atualizada com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );

      await _carregarPerfil();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao atualizar imagem: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() => _uploading = false);
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Perfil'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_error != null) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: CustomSidebar(),
        appBar: AppBar(
          title: Text('Perfil'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, color: AppColors.error, size: 64),
              SizedBox(height: AppSpacing.md),
              Text(_error!),
              SizedBox(height: AppSpacing.md),
              ElevatedButton(
                onPressed: _carregarPerfil,
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
        title: Text('Perfil'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_editMode ? Icons.close : Icons.edit),
            onPressed: () {
              setState(() {
                _editMode = !_editMode;
                if (!_editMode) {
                  // Cancelar edição - restaurar dados originais
                  _nomeController.text = _userProfile?['nome'] ?? '';
                  _telefoneController.text = _userProfile?['telefone'] ?? '';
                  _biografiaController.text = _userProfile?['biografia'] ?? '';
                }
              });
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppSpacing.md),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Cabeçalho com avatar
              Container(
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
                    // Avatar
                    GestureDetector(
                      onTap: _editMode ? _selecionarImagem : null,
                      child: Stack(
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: AppColors.primary, width: 3),
                            ),
                            child: ClipOval(
                              child: _uploading
                                  ? Container(
                                      color: Colors.grey[200],
                                      child: Center(
                                        child: CircularProgressIndicator(
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    )
                                  : Image.network(
                                      ApiService.userAvatar(
                                          _userProfile?['email'] ?? ''),
                                      fit: BoxFit.cover,
                                      errorBuilder:
                                          (context, error, stackTrace) {
                                        return Container(
                                          color: Colors.grey[300],
                                          child: Icon(
                                            Icons.person,
                                            size: 60,
                                            color: Colors.grey[600],
                                          ),
                                        );
                                      },
                                    ),
                            ),
                          ),
                          if (_editMode)
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    SizedBox(height: AppSpacing.md),

                    // Nome
                    Text(
                      _userProfile?['nome'] ?? 'Nome não disponível',
                      style: AppTextStyles.headline2,
                      textAlign: TextAlign.center,
                    ),

                    SizedBox(height: AppSpacing.sm),

                    // Email
                    Text(
                      _userProfile?['email'] ?? 'Email não disponível',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    SizedBox(height: AppSpacing.sm),

                    // Cargo
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _getCargoNome(_userProfile?['id_cargo']),
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(height: AppSpacing.lg),

              // Formulário de informações
              Container(
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

                    // Biografia
                    TextFormField(
                      controller: _biografiaController,
                      enabled: _editMode,
                      decoration: InputDecoration(
                        labelText: 'Biografia',
                        prefixIcon: Icon(Icons.description),
                        border: OutlineInputBorder(),
                        hintText: 'Conte-nos um pouco sobre você...',
                      ),
                      maxLines: 3,
                    ),

                    if (_editMode) ...[
                      SizedBox(height: AppSpacing.lg),

                      // Botões de ação
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _editMode = false;
                                  // Restaurar dados originais
                                  _nomeController.text =
                                      _userProfile?['nome'] ?? '';
                                  _telefoneController.text =
                                      _userProfile?['telefone'] ?? '';
                                  _biografiaController.text =
                                      _userProfile?['biografia'] ?? '';
                                });
                              },
                              child: Text('Cancelar'),
                            ),
                          ),
                          SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _salvarPerfil,
                              child: Text('Salvar'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
