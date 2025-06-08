import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../components/sidebar_screen.dart';

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

  Widget _buildBanner() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFFF8000),
            const Color(0xFFFF6600),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Imagem de fundo (opcional)
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
            ),
          ),
          // Texto sobreposto
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Aprender aqui é mais fácil',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    shadows: [
                      Shadow(
                        offset: Offset(1, 1),
                        blurRadius: 3,
                        color: Colors.black.withOpacity(0.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Não vale a pena estar a inventar a roda ou a descobrir a pólvora!',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 16,
                    shadows: [
                      Shadow(
                        offset: Offset(1, 1),
                        blurRadius: 2,
                        color: Colors.black.withOpacity(0.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursoCard(Map<String, dynamic> curso) {
    final nomeCurso = curso['nomeCurso'] ?? curso['nome'] ?? 'Curso sem nome';
    final categoria = curso['categoria'] ?? 'Não especificada';
    final area = curso['area'] ?? 'Não especificada';
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
        onTap: () => _showCursoDetails(curso),
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
    final categoria = curso['categoria'] ?? 'Não especificada';
    final area = curso['area'] ?? 'Não especificada';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _showCursoSugeridoDetails(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Ícone do curso
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.school_outlined,
                  color: Colors.grey.shade600,
                  size: 20,
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
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$categoria • $area',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 14,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCursoDetails(Map<String, dynamic> curso) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nomeCurso'] ?? curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: ${curso['categoria'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Área: ${curso['area'] ?? 'N/A'}'),
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
              AppUtils.showInfo(context, 'Acesso ao curso em desenvolvimento');
            },
            child: const Text('Ver Curso'),
          ),
        ],
      ),
    );
  }

  void _showCursoSugeridoDetails(Map<String, dynamic> curso) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: ${curso['categoria'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Área: ${curso['area'] ?? 'N/A'}'),
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
              AppUtils.showInfo(context, 'Inscrição em desenvolvimento');
            },
            child: const Text('Inscrever-me'),
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
      appBar: AppBar(
        title: const Text('Início'),
        backgroundColor: const Color(0xFFFF8000),
        elevation: 0,
      ),
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
                        // Banner
                        _buildBanner(),

                        const SizedBox(height: 24),

                        // Seção de Cursos Inscritos
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Cursos Inscritos',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade800,
                                ),
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
                              const SizedBox(height: 16),

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
