import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart'; // Para AppUtils e AuthManager
import '../../components/sidebar_screen.dart';
import '../../widgets/network_image_widget.dart';

class PerfilScreen extends StatefulWidget {
  @override
  _PerfilScreenState createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen>
    with TickerProviderStateMixin {
  final _apiService = ApiService();
  Map<String, dynamic>? _userData;
  Map<String, dynamic>? _formadorData;
  bool _isLoading = true;
  bool _isFormador = false;
  bool _isAdmin = false;
  bool _isEditing = false;
  String _activeTab = 'ministrados'; // 'ministrados' ou 'inscritos'
  late TabController _tabController;

  // Controladores para edição
  final _nomeController = TextEditingController();
  final _emailController = TextEditingController();
  final _telefoneController = TextEditingController();
  final _idadeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadUserData();
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _emailController.dispose();
    _telefoneController.dispose();
    _idadeController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    setState(() => _isLoading = true);

    try {
      final userData = await _apiService.getCurrentUser();

      if (userData != null) {
        setState(() {
          _userData = userData;
          _isFormador = userData['id_cargo'] == 2;
          _isAdmin = userData['id_cargo'] == 1;

          // Preencher controladores
          _nomeController.text = userData['nome'] ?? '';
          _emailController.text = userData['email'] ?? '';
          _telefoneController.text = userData['telefone'] ?? '';
          _idadeController.text = userData['idade']?.toString() ?? '';
        });

        // Se for formador, buscar dados específicos
        if (_isFormador) {
          await _loadFormadorData();
        }
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
      AppUtils.showError(context, 'Erro ao carregar dados do perfil: $e');
    }
  }

  Future<void> _loadFormadorData() async {
    try {
      // Aqui  pode implementar uma chamada específica para dados de formador
      // Por enquanto, vamos simular com dados fictícios
      setState(() {
        _formadorData = {
          'categorias': [
            {
              'id': 1,
              'nome': 'Tecnologia',
              'areas': [
                {'nome': 'Programação'},
                {'nome': 'Bases de Dados'}
              ]
            }
          ],
          'cursosMinistrados': [],
          'cursosInscritos': []
        };
      });
    } catch (e) {
      print('Erro ao carregar dados do formador: $e');
    }
  }

  Future<void> _updateProfile() async {
    try {
      final updateData = {
        'nome': _nomeController.text,
        'email': _emailController.text,
        'telefone': _telefoneController.text,
        'idade': int.tryParse(_idadeController.text) ?? 0,
      };

      // Aqui implementaria a chamada à API para atualizar o perfil
      // await _apiService.updateProfile(updateData);

      AppUtils.showSuccess(context, 'Perfil atualizado com sucesso!');
      setState(() => _isEditing = false);
      await _loadUserData();
    } catch (e) {
      AppUtils.showError(context, 'Erro ao atualizar perfil: $e');
    }
  }

  //  Métodos para obter URLs das imagens usando o ApiService
  String _getAvatarUrl() {
    if (_userData == null) return _apiService.defaultAvatarUrl;

    final email = _userData!['email'] as String?;
    final fotoPerfilPath = _userData!['foto_perfil'] as String?;

    if (email == null || email.isEmpty) return _apiService.defaultAvatarUrl;

    // Se a foto_perfil é o padrão ou está vazia, usar imagem padrão
    if (fotoPerfilPath == null ||
        fotoPerfilPath.isEmpty ||
        fotoPerfilPath == 'AVATAR.png') {
      return _apiService.defaultAvatarUrl;
    }

    return _apiService.getUserAvatarUrl(email);
  }

  String _getCapaUrl() {
    if (_userData == null) return _apiService.defaultCapaUrl;

    final email = _userData!['email'] as String?;
    final fotoCapaPath = _userData!['foto_capa'] as String?;

    if (email == null || email.isEmpty) return _apiService.defaultCapaUrl;

    // Se a foto_capa é o padrão ou está vazia, usar imagem padrão
    if (fotoCapaPath == null ||
        fotoCapaPath.isEmpty ||
        fotoCapaPath == 'CAPA.png') {
      return _apiService.defaultCapaUrl;
    }

    return _apiService.getUserCapaUrl(email);
  }

  Widget _buildProfileHeader() {
    return Container(
      height: 200,
      child: Stack(
        children: [
          // Imagem de capa usando CustomNetworkImage
          Container(
            height: 150,
            width: double.infinity,
            child: CustomNetworkImage(
              imageUrl: _getCapaUrl(),
              fallbackUrl: _apiService.defaultCapaUrl,
              width: double.infinity,
              height: 150,
              fit: BoxFit.cover,
              errorWidget: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFFF8000), Color(0xFFFF6600)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.landscape,
                    size: 48,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
              ),
            ),
          ),

          // Botão de editar
          Positioned(
            top: 16,
            right: 16,
            child: IconButton(
              onPressed: () => setState(() => _isEditing = !_isEditing),
              icon: Icon(
                _isEditing ? Icons.close : Icons.edit,
                color: Colors.white,
              ),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withOpacity(0.3),
              ),
            ),
          ),

          // Avatar usando AvatarImage
          Positioned(
            bottom: 0,
            left: 20,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: AvatarImage(
                imageUrl: _getAvatarUrl(),
                fallbackUrl: _apiService.defaultAvatarUrl,
                radius: 46, // 50 - 4 (border width)
                backgroundColor: Color(0xFFFF8000),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInfo() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _userData!['nome'] ?? 'Nome não disponível',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Color(0xFFFF8000).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _userData!['cargo']?['descricao'] ?? 'Utilizador',
                        style: TextStyle(
                          color: Color(0xFFFF8000),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Dados do perfil
          if (_isEditing) ...[
            _buildEditForm(),
          ] else ...[
            _buildProfileData(),
          ],
        ],
      ),
    );
  }

  Widget _buildEditForm() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _nomeController,
                decoration: InputDecoration(
                  labelText: 'Nome',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _telefoneController,
                decoration: InputDecoration(
                  labelText: 'Telefone',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _idadeController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Idade',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        Row(
          children: [
            ElevatedButton.icon(
              onPressed: _updateProfile,
              icon: Icon(Icons.check),
              label: Text('Guardar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
            SizedBox(width: 16),
            ElevatedButton.icon(
              onPressed: () => setState(() => _isEditing = false),
              icon: Icon(Icons.close),
              label: Text('Cancelar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildProfileData() {
    return Column(
      children: [
        _buildInfoRow('Nome:', _userData!['nome'] ?? 'N/A'),
        _buildInfoRow('Email:', _userData!['email'] ?? 'N/A'),
        _buildInfoRow('Telefone:', _userData!['telefone'] ?? 'N/A'),
        _buildInfoRow('Idade:', _userData!['idade']?.toString() ?? 'N/A'),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormadorSection() {
    if (!_isFormador || _formadorData == null) return SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Especializações
        Card(
          margin: EdgeInsets.all(16),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Especializações',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 12),
                if (_formadorData!['categorias']?.isNotEmpty == true)
                  ...(_formadorData!['categorias'] as List)
                      .map(
                        (categoria) => Padding(
                          padding: EdgeInsets.symmetric(vertical: 4),
                          child: Text(
                            '${categoria['nome']}: ${categoria['areas']?.map((area) => area['nome']).join(', ') ?? 'Nenhuma área específica'}',
                            style: TextStyle(fontSize: 14),
                          ),
                        ),
                      )
                      .toList()
                else
                  Text(
                    'Nenhuma categoria ou área associada.',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Cursos do formador
        Card(
          margin: EdgeInsets.all(16),
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                labelColor: Color(0xFFFF8000),
                unselectedLabelColor: Colors.grey,
                indicatorColor: Color(0xFFFF8000),
                tabs: [
                  Tab(text: 'Cursos Administrados'),
                  Tab(text: 'Cursos Inscritos'),
                ],
              ),
              Container(
                height: 300,
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildCursosMinistrados(),
                    _buildCursosInscritos(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCursosMinistrados() {
    final cursos = _formadorData!['cursosMinistrados'] as List? ?? [];

    if (cursos.isEmpty) {
      return Center(
        child: Text(
          ' não está a ministrar nenhum curso atualmente.',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontStyle: FontStyle.italic,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: cursos.length,
      itemBuilder: (context, index) {
        final curso = cursos[index];
        return Card(
          child: ListTile(
            title: Text(curso['nome'] ?? 'Curso'),
            subtitle: Text('${curso['categoria']} • ${curso['area']}'),
            trailing: Text(curso['tipo'] ?? ''),
          ),
        );
      },
    );
  }

  Widget _buildCursosInscritos() {
    final cursos = _formadorData!['cursosInscritos'] as List? ?? [];

    if (cursos.isEmpty) {
      return Center(
        child: Text(
          ' não está inscrito em nenhum curso atualmente.',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontStyle: FontStyle.italic,
          ),
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: cursos.length,
      itemBuilder: (context, index) {
        final curso = cursos[index];
        return Card(
          child: ListTile(
            title: Text(curso['nome'] ?? 'Curso'),
            subtitle: Text('${curso['categoria']} • ${curso['area']}'),
            trailing: Text(_formatDate(curso['dataInscricao'])),
          ),
        );
      },
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terminar Sessão'),
        content: const Text('Tem certeza que quer sair da aplicação?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sair'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await AuthManager.clearAuth();
        AppUtils.showSuccess(context, 'Sessão terminada com sucesso');
        Navigator.pushReplacementNamed(context, '/login');
      } catch (e) {
        AppUtils.showError(context, 'Erro ao terminar sessão: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Perfil'),
          backgroundColor: const Color(0xFFFF8000),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
              SizedBox(height: 16),
              Text('A carregar perfil...'),
            ],
          ),
        ),
      );
    }

    if (_userData == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Perfil'),
          backgroundColor: const Color(0xFFFF8000),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.shade300,
              ),
              const SizedBox(height: 16),
              const Text('Erro ao carregar dados do perfil'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadUserData,
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        backgroundColor: const Color(0xFFFF8000),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      drawer: SidebarScreen(
        currentUser: _userData,
        currentRoute: '/perfil',
      ),
      body: RefreshIndicator(
        onRefresh: _loadUserData,
        color: Color(0xFFFF8000),
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              _buildProfileHeader(),
              _buildProfileInfo(),
              if (_isFormador) _buildFormadorSection(),

              // Botão de logout
              Padding(
                padding: EdgeInsets.all(20),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _logout,
                    icon: Icon(Icons.logout),
                    label: Text('Terminar Sessão'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 16),
                    ),
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
