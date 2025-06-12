import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class DetalhesFormadorScreen extends StatefulWidget {
  final int formadorId;

  const DetalhesFormadorScreen({Key? key, required this.formadorId})
      : super(key: key);

  @override
  _DetalhesFormadorScreenState createState() => _DetalhesFormadorScreenState();
}

class _DetalhesFormadorScreenState extends State<DetalhesFormadorScreen> {
  final _apiService = ApiService();
  Map<String, dynamic>? _formador;
  List<dynamic> _cursos = [];
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;
  String _activeTab = 'todos';

  @override
  void initState() {
    super.initState();
    _loadFormadorData();
  }

  Future<void> _loadFormadorData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carregar dados do formador
      final formadorResponse =
          await _apiService.get('/formadores/${widget.formadorId}');

      if (formadorResponse.statusCode == 200) {
        final formadorData = _apiService.parseResponseToMap(formadorResponse);

        if (formadorData != null) {
          // Carregar cursos do formador
          final cursosResponse =
              await _apiService.get('/formadores/${widget.formadorId}/cursos');
          List<dynamic> cursosData = [];

          if (cursosResponse.statusCode == 200) {
            final cursosResult =
                _apiService.parseResponseToList(cursosResponse);
            cursosData = cursosResult ?? [];
          }

          setState(() {
            _currentUser = userData;
            _formador = formadorData;
            _cursos = formadorData['cursos_ministrados'] ?? cursosData;
            _isLoading = false;
          });
        } else {
          throw Exception('Dados do formador inválidos');
        }
      } else {
        throw Exception('Formador não encontrado');
      }
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar dados do formador: $e';
        _isLoading = false;
      });
    }
  }

  String _getProfileImageUrl() {
    if (_formador?['email'] != null) {
      return _apiService.getUserAvatarUrl(_formador!['email']);
    }
    return _apiService.defaultAvatarUrl;
  }

  String _getCoverImageUrl() {
    if (_formador?['email'] != null) {
      return _apiService.getUserCapaUrl(_formador!['email']);
    }
    return _apiService.defaultCapaUrl;
  }

  String _getCursoImageUrl(Map<String, dynamic> curso) {
    final imagePath = curso['imagem_path'];
    if (imagePath != null) {
      return _apiService.getCursoImageUrl(imagePath);
    }

    final nomeCurso = curso['nome']
        ?.toString()
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll(RegExp(r'[^\w-]+'), '');

    if (nomeCurso != null) {
      return _apiService.getCursoCapaUrl(nomeCurso);
    }

    return _apiService.getCursoImageUrl(null); // fallback
  }

  String _getStatusClass(String? estado) {
    if (estado == null) return 'pendente';

    final estadoLower = estado.toLowerCase();
    if (estadoLower == 'em_curso' || estadoLower == 'em curso') {
      return 'em-andamento';
    } else if (estadoLower == 'terminado') {
      return 'completo';
    } else if (estadoLower == 'planeado' ||
        estadoLower == 'planejado' ||
        estadoLower == 'agendado') {
      return 'pendente';
    }
    return 'pendente';
  }

  Color _getStatusColor(String? estado) {
    final statusClass = _getStatusClass(estado);
    switch (statusClass) {
      case 'em-andamento':
        return Colors.green;
      case 'completo':
        return Colors.blue;
      case 'pendente':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatStatusName(String? estado) {
    if (estado == null) return 'Agendado';

    final estadoLower = estado.toLowerCase();
    if (estadoLower == 'em_curso' || estadoLower == 'em curso') {
      return 'Em Curso';
    } else if (estadoLower == 'terminado') {
      return 'Terminado';
    } else if (estadoLower == 'planeado' || estadoLower == 'planejado') {
      return 'Agendado';
    }
    return estado;
  }

  List<dynamic> get _filteredCursos {
    if (_activeTab == 'ativos') {
      return _cursos
          .where((curso) =>
              curso['estado'] == 'em_curso' || curso['estado'] == 'Disponível')
          .toList();
    }
    return _cursos;
  }

  Widget _buildCoverSection() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        image: DecorationImage(
          image: NetworkImage(_getCoverImageUrl()),
          fit: BoxFit.cover,
          onError: (error, stackTrace) {
            print('Erro ao carregar imagem de capa: $error');
          },
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.7),
            ],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              bottom: 20,
              left: 20,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white,
                    child: CircleAvatar(
                      radius: 37,
                      backgroundImage: NetworkImage(_getProfileImageUrl()),
                      onBackgroundImageError: (error, stackTrace) {
                        print('Erro ao carregar avatar: $error');
                      },
                      child:
                          _getProfileImageUrl() == _apiService.defaultAvatarUrl
                              ? Text(
                                  _getInitials(_formador?['nome'] ?? 'F'),
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFFF8000),
                                  ),
                                )
                              : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formador?['nome'] ?? 'Nome do Formador',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF8000),
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
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Informações',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoItem(
              'Email', _formador?['email'] ?? 'Email não disponível'),
          if (_formador?['idade'] != null)
            _buildInfoItem('Idade', '${_formador!['idade']} anos'),
          if (_formador?['telefone'] != null)
            _buildInfoItem('Telefone', _formador!['telefone']),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDescriptionSection() {
    final biografia = _formador?['biografia'] ?? _formador?['descricao'];

    if (biografia == null || biografia.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Descrição',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nenhuma descrição disponível para este formador.',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Descrição',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            biografia,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursosSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Cursos Associados',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF8000).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_cursos.length}',
                  style: const TextStyle(
                    color: Color(0xFFFF8000),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Tabs
          Row(
            children: [
              _buildTabButton('Todos', 'todos', _cursos.length),
              const SizedBox(width: 8),
              _buildTabButton('Ativos', 'ativos', _filteredCursos.length),
            ],
          ),
          const SizedBox(height: 16),
          // Lista de cursos
          _filteredCursos.isEmpty
              ? Container(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    'Este formador não possui cursos ${_activeTab == 'ativos' ? 'ativos' : ''}.',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _filteredCursos.length,
                  itemBuilder: (context, index) {
                    return _buildCursoCard(_filteredCursos[index]);
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String title, String value, int count) {
    final isActive = _activeTab == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _activeTab = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFFF8000) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? const Color(0xFFFF8000) : Colors.grey.shade300,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isActive
                    ? Colors.white.withOpacity(0.3)
                    : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isActive ? Colors.white : Colors.grey.shade700,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCursoCard(Map<String, dynamic> curso) {
    final nome = curso['nome'] ?? curso['titulo'] ?? 'Curso';
    final categoria = curso['categoria_nome'] ?? curso['categoria'] ?? 'N/A';
    final area = curso['area_nome'] ?? curso['area'] ?? 'N/A';
    final estado = curso['estado'];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          final cursoId = curso['id_curso'] ?? curso['id'];
          if (cursoId != null) {
            // Navegar para detalhes do curso
            AppUtils.showInfo(
                context, 'Navegação para curso $nome em desenvolvimento');
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Imagem do curso
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                  ),
                  child: Image.network(
                    _getCursoImageUrl(curso),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey.shade300,
                        child: const Icon(
                          Icons.school,
                          color: Colors.grey,
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Informações do curso
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nome,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Categoria: $categoria',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      'Área: $area',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(estado).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getStatusColor(estado)),
                      ),
                      child: Text(
                        _formatStatusName(estado),
                        style: TextStyle(
                          color: _getStatusColor(estado),
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_formador?['nome'] ?? 'Formador'),
        backgroundColor: const Color(0xFFFF8000),
        foregroundColor: Colors.white,
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton(
                              onPressed: _loadFormadorData,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFFF8000),
                              ),
                              child: const Text(
                                'Tentar novamente',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey,
                              ),
                              child: const Text(
                                'Voltar',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )
              : _formador == null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.person_off,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Formador não encontrado',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFF8000),
                            ),
                            child: const Text(
                              'Voltar',
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      child: Column(
                        children: [
                          _buildCoverSection(),
                          _buildInfoSection(),
                          _buildDescriptionSection(),
                          _buildCursosSection(),
                        ],
                      ),
                    ),
    );
  }
}
