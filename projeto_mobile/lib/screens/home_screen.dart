import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../components/sidebar_screen.dart';
import '../components/navbar_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _apiService = ApiService();
  List<dynamic>? _inscricoes;
  List<dynamic>? _cursosSugeridos;
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carregar inscrições do utilizador
      final inscricoes = await _apiService.getMinhasInscricoes();

      // Carregar cursos sugeridos (todos os cursos disponíveis)
      final cursosSugeridos = await _apiService.getCursos();

      if (mounted) {
        setState(() {
          _currentUser = userData;
          _inscricoes = inscricoes ?? [];
          _cursosSugeridos = cursosSugeridos ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Erro ao carregar dados: $e';
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildCursoCard(Map<String, dynamic> curso) {
    final nomeCurso = curso['nomeCurso'] ?? curso['nome'] ?? 'Curso sem nome';

    // Extrair apenas o nome da categoria (caso seja objeto)
    String categoria = 'Não especificada';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrair apenas o nome da área (caso seja objeto)
    String area = 'Não especificada';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    final status = curso['status'] ?? 'Inscrito';

    // Determinar cor do status
    Color statusColor;
    switch (status.toLowerCase()) {
      case 'concluído':
        statusColor = Colors.green;
        break;
      case 'em andamento':
        statusColor = Colors.orange;
        break;
      case 'agendado':
        statusColor = Colors.blue;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _navigateToCurso(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Ícone do curso
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF8000),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.school,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomeCurso,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Categoria: $categoria',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Área: $area',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCursoSugeridoCard(Map<String, dynamic> curso) {
    final nomeCurso = curso['nome'] ?? 'Curso sem nome';

    // Extrair apenas o nome da categoria (caso seja objeto)
    String categoria = 'Não especificada';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrair apenas o nome da área (caso seja objeto)
    String area = 'Não especificada';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _navigateToCurso(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Ícone do curso
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.school_outlined,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomeCurso,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Categoria: $categoria',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Área: $area',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Badge "Disponível" para cursos sugeridos
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Text(
                  'Disponível',
                  style: TextStyle(
                    color: Colors.blue,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Navegar para página individual do curso
  void _navigateToCurso(Map<String, dynamic> curso) {
    // Tentar obter o ID do curso de diferentes campos possíveis
    final cursoId = curso['id_curso']?.toString() ??
        curso['id']?.toString() ??
        curso['cursoId']?.toString();

    if (cursoId != null && cursoId.isNotEmpty) {
      Navigator.pushNamed(
        context,
        '/curso',
        arguments: cursoId,
      );
    } else {
      AppUtils.showError(context, 'ID do curso não encontrado');
    }
  }

  void _showCursoDetails(Map<String, dynamic> curso) {
    // Extrair apenas o nome da categoria (caso seja objeto)
    String categoria = 'N/A';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrair apenas o nome da área (caso seja objeto)
    String area = 'N/A';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nomeCurso'] ?? curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: $categoria'),
            const SizedBox(height: 8),
            Text('Área: $area'),
            const SizedBox(height: 8),
            Text('Status: ${curso['status'] ?? 'N/A'}'),
            if (curso['dataInicio'] != null) ...[
              const SizedBox(height: 8),
              Text('Data Início: ${_formatDate(curso['dataInicio'])}'),
            ],
            if (curso['dataFim'] != null) ...[
              const SizedBox(height: 8),
              Text('Data Fim: ${_formatDate(curso['dataFim'])}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToCurso(curso);
            },
            child: const Text('Ver Curso'),
          ),
        ],
      ),
    );
  }

  void _showCursoSugeridoDetails(Map<String, dynamic> curso) {
    // Extrair apenas o nome da categoria (caso seja objeto)
    String categoria = 'N/A';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrair apenas o nome da área (caso seja objeto)
    String area = 'N/A';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: $categoria'),
            const SizedBox(height: 8),
            Text('Área: $area'),
            if (curso['descricao'] != null) ...[
              const SizedBox(height: 8),
              Text('Descrição: ${curso['descricao']}'),
            ],
            if (curso['vagas'] != null) ...[
              const SizedBox(height: 8),
              Text('Vagas: ${curso['vagas']}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToCurso(curso);
            },
            child: const Text('Ver Curso'),
          ),
        ],
      ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Navbar sempre visível no topo
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: _currentUser,
        ),
      ),

      // SidebarScreen como Drawer (sem NavbarScreen integrada)
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/home',
      ),

      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade300,
                      ),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadHomeData,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadHomeData,
                  color: const Color(0xFFFF8000),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Seção de Cursos Inscritos
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Cursos Inscritos',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey.shade800,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              if (_inscricoes == null || _inscricoes!.isEmpty)
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.school_outlined,
                                        size: 48,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Você não está inscrito em nenhum curso.',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 16,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 12),
                                      ElevatedButton(
                                        onPressed: () => Navigator.pushNamed(
                                            context, '/cursos'),
                                        child: const Text('Explorar Cursos'),
                                      ),
                                    ],
                                  ),
                                )
                              else
                                ...(_inscricoes!
                                    .map((curso) => _buildCursoCard(
                                        curso as Map<String, dynamic>))
                                    .toList()),

                              const SizedBox(height: 32),

                              // Seção de Cursos Sugeridos
                              Text(
                                'Cursos Sugeridos para Você',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade800,
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Botão "Ver todos" com design
                              if (_cursosSugeridos != null &&
                                  _cursosSugeridos!.isNotEmpty)
                                Container(
                                  width: double.infinity,
                                  margin: const EdgeInsets.only(bottom: 16),
                                  child: ElevatedButton.icon(
                                    onPressed: () =>
                                        Navigator.pushNamed(context, '/cursos'),
                                    icon: const Icon(
                                      Icons.explore_outlined,
                                      size: 18,
                                    ),
                                    label: const Text(
                                      'Ver todos os cursos',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFFF8000),
                                      foregroundColor: Colors.white,
                                      elevation: 2,
                                      shadowColor: const Color(0xFFFF8000)
                                          .withOpacity(0.3),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                        vertical: 12,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(25),
                                      ),
                                    ),
                                  ),
                                ),

                              if (_cursosSugeridos == null ||
                                  _cursosSugeridos!.isEmpty)
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.explore_outlined,
                                        size: 48,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Nenhum curso disponível no momento.',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 16,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                )
                              else
                                ..._cursosSugeridos!
                                    .take(5)
                                    .map((curso) => _buildCursoSugeridoCard(
                                        curso as Map<String, dynamic>))
                                    .toList(),

                              const SizedBox(height: 24),
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
