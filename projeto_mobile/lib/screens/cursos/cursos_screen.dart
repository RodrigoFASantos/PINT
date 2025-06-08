import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart'; // Para AppUtils
import '../../components/sidebar_screen.dart';

class CursosScreen extends StatefulWidget {
  @override
  _CursosScreenState createState() => _CursosScreenState();
}

class _CursosScreenState extends State<CursosScreen> {
  final _apiService = ApiService();
  List<dynamic>? _cursos;
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  bool _isInitializing = true;
  String? _connectionError;

  @override
  void initState() {
    super.initState();
    _initializeAndLoadCursos();
  }

  /// Inicializa o ApiService e carrega os cursos
  Future<void> _initializeAndLoadCursos() async {
    setState(() {
      _isInitializing = true;
      _isLoading = true;
      _connectionError = null;
    });

    try {
      // Garantir que o ApiService está inicializado
      debugPrint('🎓 [CURSOS] Verificando inicialização do ApiService...');

      // Se o ApiService ainda não foi inicializado globalmente, inicializar agora
      if (_apiService.apiBase.isEmpty) {
        debugPrint('🎓 [CURSOS] ApiService não inicializado, inicializando...');
        await _apiService.initialize();
      }

      setState(() {
        _isInitializing = false;
      });

      debugPrint('🎓 [CURSOS] ApiService inicializado: ${_apiService.apiBase}');

      // Verificar se a conexão está ativa
      final isAlive = await _apiService.isConnectionAlive();
      if (!isAlive) {
        debugPrint('🎓 [CURSOS] Conexão inativa, tentando reconectar...');
        await _apiService.reconnect();
      }

      // Agora carregar os cursos
      await _loadCursos();
    } catch (e) {
      debugPrint('❌ [CURSOS] Erro na inicialização: $e');
      setState(() {
        _isInitializing = false;
        _isLoading = false;
        _connectionError = 'Erro de conexão: ${e.toString()}';
      });
    }
  }

  /// Carrega a lista de cursos
  Future<void> _loadCursos() async {
    if (_isInitializing) {
      debugPrint('🎓 [CURSOS] Ainda a inicializar, aguardando...');
      return;
    }

    setState(() {
      _isLoading = true;
      _connectionError = null;
    });

    try {
      debugPrint('🎓 [CURSOS] Carregando cursos de: ${_apiService.apiBase}');

      // Carregar dados do utilizador atual e cursos em paralelo
      final futures = await Future.wait([
        _apiService.getCurrentUser(),
        _apiService.getCursos(),
      ]);

      final userData = futures[0] as Map<String, dynamic>?;
      final cursos = futures[1] as List<dynamic>?;

      if (mounted) {
        setState(() {
          _currentUser = userData;
          _cursos = cursos;
          _isLoading = false;
        });
        debugPrint('🎓 [CURSOS] ${cursos?.length ?? 0} cursos carregados');
      }
    } catch (e) {
      debugPrint('❌ [CURSOS] Erro ao carregar: $e');

      if (mounted) {
        setState(() {
          _isLoading = false;
          _connectionError = _getErrorMessage(e);
        });
      }
    }
  }

  /// Converte exceções em mensagens amigáveis
  String _getErrorMessage(dynamic error) {
    final errorStr = error.toString().toLowerCase();

    if (errorStr.contains('connection refused') ||
        errorStr.contains('network unreachable')) {
      return 'Não foi possível conectar ao servidor.\nVerifica a tua conexão de rede.';
    } else if (errorStr.contains('timeout')) {
      return 'O servidor demorou muito a responder.\nTenta novamente.';
    } else if (errorStr.contains('host lookup failed')) {
      return 'Servidor não encontrado.\nVerifica as configurações de rede.';
    } else {
      return 'Erro inesperado: ${error.toString()}';
    }
  }

  /// Widget para mostrar estado de erro com opção de retry
  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.cloud_off,
              size: 64,
              color: Colors.red.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Problema de Conexão',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _connectionError ?? 'Erro desconhecido',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.red.shade600,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: _initializeAndLoadCursos,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tentar Novamente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF8000),
                  ),
                ),
                const SizedBox(width: 16),
                OutlinedButton.icon(
                  onPressed: () => _showConnectionInfo(),
                  icon: const Icon(Icons.info_outline),
                  label: const Text('Info Conexão'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Mostra informações de conexão
  void _showConnectionInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Informações de Conexão'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('URL da API: ${_apiService.apiBase}'),
            const SizedBox(height: 8),
            Text('Erro: $_connectionError'),
            const SizedBox(height: 16),
            const Text(
              'Dicas:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const Text('• Verifica se o servidor está a correr'),
            const Text('• Confirma se estás na mesma rede Wi-Fi'),
            const Text('• Tenta recarregar a página'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// Widget para estado de inicialização
  Widget _buildInitializingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
          ),
          SizedBox(height: 16),
          Text(
            'Inicializando conexão...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Detectando melhor servidor disponível',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget para estado vazio
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.school_outlined,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          const Text(
            'Nenhum curso encontrado',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Não há cursos disponíveis no momento',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadCursos,
            icon: const Icon(Icons.refresh),
            label: const Text('Recarregar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
            ),
          ),
        ],
      ),
    );
  }

  /// Widget para card de curso
  Widget _buildCursoCard(Map<String, dynamic> curso) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: const Color(0xFFFF8000),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(
            Icons.school,
            color: Colors.white,
            size: 30,
          ),
        ),
        title: Text(
          curso['nome'] ?? 'Sem nome',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              curso['descricao'] ?? 'Sem descrição',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF8000).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    curso['categoria'] ?? 'Geral',
                    style: const TextStyle(
                      color: Color(0xFFFF8000),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const Spacer(),
                if (curso['data_criacao'] != null) ...[
                  Icon(
                    Icons.schedule,
                    size: 14,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(curso['data_criacao']),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () => _showCursoDetails(curso),
      ),
    );
  }

  /// Formatar data
  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  /// Mostrar detalhes do curso
  void _showCursoDetails(Map<String, dynamic> curso) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Descrição: ${curso['descricao'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Categoria: ${curso['categoria'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Data de criação: ${_formatDate(curso['data_criacao'])}'),
            const SizedBox(height: 8),
            Text('ID: ${curso['id_curso'] ?? 'N/A'}'),
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
              AppUtils.showInfo(
                  context, 'Funcionalidade de inscrição em desenvolvimento');
            },
            child: const Text('Inscrever-me'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cursos'),
        backgroundColor: const Color(0xFFFF8000),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: _showConnectionInfo,
          ),
        ],
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/cursos',
      ),
      body: _isInitializing
          ? _buildInitializingState()
          : _connectionError != null
              ? _buildErrorState()
              : _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
                      ),
                    )
                  : _cursos == null || _cursos!.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadCursos,
                          color: const Color(0xFFFF8000),
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _cursos!.length,
                            itemBuilder: (context, index) {
                              final curso = _cursos![index];
                              return _buildCursoCard(
                                  curso as Map<String, dynamic>);
                            },
                          ),
                        ),
    );
  }
}
