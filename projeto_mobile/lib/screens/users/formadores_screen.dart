import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';
import '../../components/navbar_screen.dart';

class FormadoresScreen extends StatefulWidget {
  @override
  _FormadoresScreenState createState() => _FormadoresScreenState();
}

class _FormadoresScreenState extends State<FormadoresScreen> {
  final _apiService = ApiService();
  List<dynamic> _formadores = [];
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFormadores();
  }

  Future<void> _loadFormadores() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carregar formadores da API
      final response = await _apiService.get('/formadores');

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToMap(response);
        if (data != null && data['formadores'] != null) {
          setState(() {
            _currentUser = userData;
            _formadores = data['formadores'];
            _isLoading = false;
          });
        } else {
          throw Exception('Formato de dados inválido recebido do servidor');
        }
      } else {
        throw Exception(
            'Erro ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar formadores: $e';
        _isLoading = false;
      });
      print('Erro ao carregar formadores: $e');
    }
  }

  Widget _buildFormadorCard(Map<String, dynamic> formador) {
    final nome = formador['nome'] ?? 'Nome não disponível';
    final email = formador['email'] ?? 'Email não disponível';
    final idade = formador['idade'];
    final telefone = formador['telefone'];
    final biografia = formador['biografia'];

    // Obter categorias e áreas se existirem
    final categorias = formador['categorias_formador'] as List<dynamic>? ?? [];
    final areas = formador['areas_formador'] as List<dynamic>? ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _showFormadorDetails(formador),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar do formador
              CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFFFF8000),
                backgroundImage: _getFormadorImage(formador),
                onBackgroundImageError: (error, stackTrace) {
                  print('Erro ao carregar imagem do formador: $error');
                },
                child: _getFormadorImage(formador) == null
                    ? Text(
                        _getInitials(nome),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              // Informações do formador
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nome,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                    if (idade != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Idade: $idade anos',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                    if (categorias.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        children: categorias.take(2).map((categoria) {
                          return Chip(
                            label: Text(
                              categoria['nome'] ?? 'Categoria',
                              style: const TextStyle(fontSize: 10),
                            ),
                            backgroundColor:
                                const Color(0xFFFF8000).withOpacity(0.1),
                            side: const BorderSide(color: Color(0xFFFF8000)),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  NetworkImage? _getFormadorImage(Map<String, dynamic> formador) {
    final email = formador['email'];
    if (email != null) {
      return NetworkImage(_apiService.getUserAvatarUrl(email));
    }
    return null;
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'F';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  void _showFormadorDetails(Map<String, dynamic> formador) {
    final nome = formador['nome'] ?? 'Formador';
    final email = formador['email'] ?? 'N/A';
    final telefone = formador['telefone'] ?? 'N/A';
    final idade = formador['idade'];
    final biografia = formador['biografia'] ?? 'Sem biografia disponível';

    final categorias = formador['categorias_formador'] as List<dynamic>? ?? [];
    final areas = formador['areas_formador'] as List<dynamic>? ?? [];

    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400, maxHeight: 600),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Cabeçalho
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFFF8000),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Stack(
                  children: [
                    // Botão X para fechar
                    Positioned(
                      top: -8,
                      right: -8,
                      child: IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 24,
                        ),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ),
                    // Conteúdo do cabeçalho
                    Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.white,
                          backgroundImage: _getFormadorImage(formador),
                          child: _getFormadorImage(formador) == null
                              ? Text(
                                  _getInitials(nome),
                                  style: const TextStyle(
                                    color: Color(0xFFFF8000),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 20,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          nome,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Formador',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Conteúdo
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailItem('Email', email, Icons.email),
                      if (telefone != 'N/A')
                        _buildDetailItem('Telefone', telefone, Icons.phone),
                      if (idade != null)
                        _buildDetailItem('Idade', '$idade anos', Icons.cake),
                      if (biografia != 'Sem biografia disponível') ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Biografia',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          biografia,
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            height: 1.4,
                          ),
                        ),
                      ],
                      if (categorias.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Categorias',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: categorias.map((categoria) {
                            return Chip(
                              label: Text(categoria['nome'] ?? 'Categoria'),
                              backgroundColor:
                                  const Color(0xFFFF8000).withOpacity(0.1),
                              side: const BorderSide(color: Color(0xFFFF8000)),
                            );
                          }).toList(),
                        ),
                      ],
                      if (areas.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Áreas de Especialização',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: areas.map((area) {
                            return Chip(
                              label: Text(area['nome'] ?? 'Área'),
                              backgroundColor: Colors.blue.withOpacity(0.1),
                              side: const BorderSide(color: Colors.blue),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: const Color(0xFFFF8000),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Usar NavbarScreen em vez de AppBar
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: _currentUser,
        ),
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/formadores',
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red.shade300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadFormadores,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF8000),
                          ),
                          child: const Text(
                            'Tentar novamente',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _formadores.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.person_outline,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Nenhum formador encontrado',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Não há formadores registados no sistema',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadFormadores,
                      color: const Color(0xFFFF8000),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _formadores.length,
                        itemBuilder: (context, index) {
                          final formador = _formadores[index];
                          return _buildFormadorCard(
                              formador as Map<String, dynamic>);
                        },
                      ),
                    ),
    );
  }
}
