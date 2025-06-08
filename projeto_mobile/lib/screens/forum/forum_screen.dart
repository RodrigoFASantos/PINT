import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class ForumScreen extends StatefulWidget {
  @override
  _ForumScreenState createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen>
    with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  late TabController _tabController;

  // Dados simulados para o fórum
  List<Map<String, dynamic>> _topicos = [];
  List<Map<String, dynamic>> _chatsDirectos = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadForumData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadForumData() async {
    setState(() => _isLoading = true);

    try {
      final userData = await _apiService.getCurrentUser();

      // TODO: Implementar endpoints para tópicos e chats
      // final topicos = await _apiService.getTopicos();
      // final chats = await _apiService.getChatsDirectos();

      // Dados simulados
      _topicos = [
        {
          'id': 1,
          'titulo': 'Dúvidas sobre o Curso de Flutter',
          'autor': 'João Silva',
          'categoria': 'Tecnologia',
          'ultimaResposta': DateTime.now().subtract(Duration(hours: 2)),
          'respostas': 15,
          'visualizacoes': 84,
        },
        {
          'id': 2,
          'titulo': 'Melhores práticas de UI/UX',
          'autor': 'Maria Santos',
          'categoria': 'Design',
          'ultimaResposta': DateTime.now().subtract(Duration(hours: 5)),
          'respostas': 8,
          'visualizacoes': 42,
        },
        {
          'id': 3,
          'titulo': 'Como otimizar performance de apps',
          'autor': 'Pedro Costa',
          'categoria': 'Desenvolvimento',
          'ultimaResposta': DateTime.now().subtract(Duration(days: 1)),
          'respostas': 23,
          'visualizacoes': 156,
        },
      ];

      _chatsDirectos = [
        {
          'id': 1,
          'nome': 'Maria Santos',
          'ultimaMensagem': 'Obrigada pela ajuda com o projeto!',
          'horario': DateTime.now().subtract(Duration(minutes: 30)),
          'naoLidas': 2,
        },
        {
          'id': 2,
          'nome': 'Pedro Costa',
          'ultimaMensagem': 'Vamos marcar uma reunião?',
          'horario': DateTime.now().subtract(Duration(hours: 3)),
          'naoLidas': 0,
        },
        {
          'id': 3,
          'nome': 'Ana Oliveira',
          'ultimaMensagem': 'O documento está pronto',
          'horario': DateTime.now().subtract(Duration(days: 1)),
          'naoLidas': 1,
        },
      ];

      setState(() {
        _currentUser = userData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      AppUtils.showError(context, 'Erro ao carregar dados: $e');
    }
  }

  Widget _buildTopicosTab() {
    return Column(
      children: [
        // Botão para criar novo tópico
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _criarNovoTopico,
              icon: const Icon(Icons.add),
              label: const Text('Criar Novo Tópico'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF8000),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ),

        // Lista de tópicos
        Expanded(
          child: ListView.builder(
            itemCount: _topicos.length,
            itemBuilder: (context, index) {
              final topico = _topicos[index];
              return _buildTopicoCard(topico);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTopicoCard(Map<String, dynamic> topico) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () => _abrirTopico(topico),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF8000).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      topico['categoria'],
                      style: const TextStyle(
                        color: Color(0xFFFF8000),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    _formatTimeAgo(topico['ultimaResposta']),
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                topico['titulo'],
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.person,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    topico['autor'],
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${topico['respostas']}',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.visibility,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${topico['visualizacoes']}',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatsTab() {
    return Column(
      children: [
        // Botão para novo chat
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _iniciarNovoChat,
              icon: const Icon(Icons.chat),
              label: const Text('Iniciar Novo Chat'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF8000),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ),

        // Lista de chats
        Expanded(
          child: ListView.builder(
            itemCount: _chatsDirectos.length,
            itemBuilder: (context, index) {
              final chat = _chatsDirectos[index];
              return _buildChatCard(chat);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildChatCard(Map<String, dynamic> chat) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFFF8000),
          child: Text(
            _getInitials(chat['nome']),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          chat['nome'],
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          chat['ultimaMensagem'],
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _formatTimeAgo(chat['horario']),
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 12,
              ),
            ),
            if (chat['naoLidas'] > 0) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Color(0xFFFF8000),
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 20,
                  minHeight: 20,
                ),
                child: Text(
                  '${chat['naoLidas']}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ],
        ),
        onTap: () => _abrirChat(chat),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }

  void _criarNovoTopico() {
    AppUtils.showInfo(context, 'Criar novo tópico - Em desenvolvimento');
  }

  void _abrirTopico(Map<String, dynamic> topico) {
    AppUtils.showInfo(
        context, 'Abrir tópico "${topico['titulo']}" - Em desenvolvimento');
  }

  void _iniciarNovoChat() {
    AppUtils.showInfo(context, 'Iniciar novo chat - Em desenvolvimento');
  }

  void _abrirChat(Map<String, dynamic> chat) {
    AppUtils.showInfo(
        context, 'Abrir chat com "${chat['nome']}" - Em desenvolvimento');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Forum & Chats'),
        backgroundColor: const Color(0xFFFF8000),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Tópicos', icon: Icon(Icons.forum)),
            Tab(text: 'Chats', icon: Icon(Icons.chat)),
          ],
        ),
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/forum',
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTopicosTab(),
          _buildChatsTab(),
        ],
      ),
    );
  }
}
