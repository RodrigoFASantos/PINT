import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';
import 'detalhes_formador_screen.dart';

class ListaFormadoresScreen extends StatefulWidget {
  @override
  _ListaFormadoresScreenState createState() => _ListaFormadoresScreenState();
}

class _ListaFormadoresScreenState extends State<ListaFormadoresScreen> {
  final _apiService = ApiService();
  List<dynamic> _formadores = [];
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  final int _formadoresPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadFormadores();
  }

  Future<void> _loadFormadores({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
      });
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carregar formadores com paginação
      final response = await _apiService
          .get('/formadores?page=$_currentPage&limit=$_formadoresPerPage');

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToMap(response);
        if (data != null) {
          setState(() {
            _currentUser = userData;
            _formadores = data['formadores'] ?? [];
            _totalPages = data['totalPages'] ?? 1;
            _isLoading = false;
          });
        } else {
          throw Exception('Dados inválidos recebidos do servidor');
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
    }
  }

  void _goToPreviousPage() {
    if (_currentPage > 1) {
      setState(() {
        _currentPage--;
      });
      _loadFormadores();
    }
  }

  void _goToNextPage() {
    if (_currentPage < _totalPages) {
      setState(() {
        _currentPage++;
      });
      _loadFormadores();
    }
  }

  void _navigateToFormadorDetails(Map<String, dynamic> formador) {
    final formadorId = formador['id_utilizador'] ?? formador['id'];
    if (formadorId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => DetalhesFormadorScreen(formadorId: formadorId),
        ),
      );
    } else {
      AppUtils.showError(context, 'ID do formador não encontrado');
    }
  }

  String _getProfileImageUrl(Map<String, dynamic> formador) {
    final email = formador['email'];
    if (email != null) {
      return _apiService.getUserAvatarUrl(email);
    }
    return _apiService.defaultAvatarUrl;
  }

  String _getCoverImageUrl(Map<String, dynamic> formador) {
    final email = formador['email'];
    if (email != null) {
      return _apiService.getUserCapaUrl(email);
    }
    return _apiService.defaultCapaUrl;
  }

  Widget _buildFormadorCard(Map<String, dynamic> formador) {
    final nome = formador['nome'] ?? 'Nome não disponível';
    final email = formador['email'] ?? 'Email não disponível';
    final coverImageUrl = _getCoverImageUrl(formador);
    final profileImageUrl = _getProfileImageUrl(formador);

    return Card(
      margin: const EdgeInsets.all(8),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: InkWell(
        onTap: () => _navigateToFormadorDetails(formador),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: 180,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            image: DecorationImage(
              image: NetworkImage(coverImageUrl),
              fit: BoxFit.cover,
              onError: (error, stackTrace) {
                // Em caso de erro, usar uma cor padrão
                print('Erro ao carregar imagem de capa: $error');
              },
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.8),
                ],
                stops: const [0.3, 1.0],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundImage: NetworkImage(profileImageUrl),
                    backgroundColor: const Color(0xFFFF8000),
                    onBackgroundImageError: (error, stackTrace) {
                      print('Erro ao carregar avatar: $error');
                    },
                    child: profileImageUrl == _apiService.defaultAvatarUrl
                        ? Text(
                            _getInitials(nome),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    nome,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    email,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'F';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  Widget _buildPagination() {
    if (_totalPages <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _currentPage > 1 ? _goToPreviousPage : null,
            icon: const Icon(Icons.chevron_left),
            style: IconButton.styleFrom(
              backgroundColor: _currentPage > 1
                  ? const Color(0xFF3182CE)
                  : Colors.grey.shade300,
              foregroundColor:
                  _currentPage > 1 ? Colors.white : Colors.grey.shade600,
              shape: const CircleBorder(),
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '$_currentPage / $_totalPages',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey,
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            onPressed: _currentPage < _totalPages ? _goToNextPage : null,
            icon: const Icon(Icons.chevron_right),
            style: IconButton.styleFrom(
              backgroundColor: _currentPage < _totalPages
                  ? const Color(0xFF3182CE)
                  : Colors.grey.shade300,
              foregroundColor: _currentPage < _totalPages
                  ? Colors.white
                  : Colors.grey.shade600,
              shape: const CircleBorder(),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Formadores'),
        backgroundColor: const Color(0xFFFF8000),
        foregroundColor: Colors.white,
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/formadores',
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
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
                                onPressed: () => _loadFormadores(refresh: true),
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
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _loadFormadores(refresh: true),
                            color: const Color(0xFFFF8000),
                            child: GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.85,
                                crossAxisSpacing: 8,
                                mainAxisSpacing: 8,
                              ),
                              itemCount: _formadores.length,
                              itemBuilder: (context, index) {
                                return _buildFormadorCard(_formadores[index]);
                              },
                            ),
                          ),
          ),
          _buildPagination(),
        ],
      ),
    );
  }
}
