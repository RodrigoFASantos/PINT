import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/notificacoes_provider.dart';
import '../screens/notificacoes_screen.dart';
import '../main.dart';

class SidebarScreen extends StatefulWidget {
  final Map<String, dynamic>? currentUser;
  final String currentRoute;

  const SidebarScreen({
    Key? key,
    this.currentUser,
    this.currentRoute = '/',
  }) : super(key: key);

  @override
  _SidebarScreenState createState() => _SidebarScreenState();
}

class _SidebarScreenState extends State<SidebarScreen> {
  int? userRole;
  final _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    if (widget.currentUser != null) {
      userRole = widget.currentUser!['id_cargo'];
    }
    debugPrint('🔧 [SIDEBAR] Rota atual: ${widget.currentRoute}');
    debugPrint('🔧 [SIDEBAR] Papel do utilizador: $userRole');
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: Colors.white,
        child: Column(
          children: [
            // Conteúdo da sidebar
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildUserSection(),
                    _buildGeneralSection(),
                    _buildPessoalSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Secção do utilizador (avatar grande + informações)
  Widget _buildUserSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Avatar grande
          if (widget.currentUser != null) ...[
            _buildUserAvatar(),
            const SizedBox(height: 12),
            Text(
              widget.currentUser!['nome'] ?? 'Utilizador',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              _getUserRole(),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ] else ...[
            const CircleAvatar(
              radius: 40,
              backgroundColor: Color(0xFFFF8000),
              child: Icon(Icons.person, size: 40, color: Colors.white),
            ),
            const SizedBox(height: 12),
            const Text(
              'Utilizador',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Divider(height: 1, thickness: 1),
        ],
      ),
    );
  }

  Widget _buildGeneralSection() {
    return _buildSection(
      'Geral',
      [
        _buildMenuItem('Home', Icons.home, '/home'),
        _buildMenuItem('Cursos', Icons.book, '/cursos'),
        _buildMenuItem('Formadores', Icons.person, '/formadores'),
        _buildMenuItem('Chats', Icons.chat, '/forum'),
      ],
    );
  }

  Widget _buildPessoalSection() {
    return _buildSection(
      'Pessoal',
      [
        _buildMenuItem('Meu Percurso', Icons.timeline, '/percurso-formativo'),
        _buildMenuItem('Perfil', Icons.person_outline, '/perfil'),
      ],
    );
  }

  Widget _buildSection(String title, List<Widget> items) {
    if (items.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        ...items,
        const Divider(height: 1, thickness: 1),
      ],
    );
  }

  Widget _buildMenuItem(
    String title,
    IconData icon,
    String? route, {
    VoidCallback? onTap,
  }) {
    // Detectar rota ativa
    bool isActive = false;

    if (route != null) {
      // Mapeamento de rotas especiais
      final routeMapping = {
        '/home': ['/', '/home'],
        '/percurso-formativo': ['/percurso-formativo'],
        '/perfil': ['/perfil'],
        '/cursos': ['/cursos'],
        '/formadores': ['/formadores'],
        '/forum': ['/forum'],
        '/meus-cursos': ['/meus-cursos'],
        '/certificados': ['/certificados'],
      };

      // Verificar se a rota atual corresponde a alguma das rotas mapeadas
      if (routeMapping.containsKey(route)) {
        isActive = routeMapping[route]!.contains(widget.currentRoute);
      } else {
        // Para outras rotas, verificar se a rota atual começa com a rota do menu
        isActive = widget.currentRoute == route ||
            (route != '/' && widget.currentRoute.startsWith(route));
      }
    }

    debugPrint(
        '🔧 [SIDEBAR] Menu: $title, Rota: $route, Atual: ${widget.currentRoute}, Ativo: $isActive');

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFFF8000).withOpacity(0.1) : null,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        dense: true,
        leading: Icon(
          icon,
          color: isActive ? const Color(0xFFFF8000) : Colors.grey.shade600,
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isActive ? const Color(0xFFFF8000) : Colors.grey.shade800,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            fontSize: 15,
          ),
        ),
        trailing: isActive
            ? Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: const Color(0xFFFF8000),
                  borderRadius: BorderRadius.circular(2),
                ),
              )
            : null,
        onTap: onTap ?? () => _navigate(route),
      ),
    );
  }

  // Métodos de navegação e utilitários

  void _navigate(String? route) {
    if (route == null) return;

    Navigator.pop(context); // Fechar sidebar

    // Navegar para a rota se não for a atual
    if (!_isCurrentRoute(route)) {
      debugPrint('🔧 [SIDEBAR] Navegando para: $route');

      if (route == '/home' || route == '/') {
        Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
      } else {
        Navigator.pushNamed(context, route);
      }
    } else {
      debugPrint('🔧 [SIDEBAR] Já na rota: $route');
    }
  }

  bool _isCurrentRoute(String route) {
    // Mapeamento de rotas especiais para verificação
    final routeMapping = {
      '/home': ['/', '/home'],
      '/percurso-formativo': ['/percurso-formativo'],
      '/perfil': ['/perfil'],
      '/cursos': ['/cursos'],
      '/formadores': ['/formadores'],
      '/forum': ['/forum'],
      '/meus-cursos': ['/meus-cursos'],
      '/certificados': ['/certificados'],
    };

    if (routeMapping.containsKey(route)) {
      return routeMapping[route]!.contains(widget.currentRoute);
    }

    return widget.currentRoute == route ||
        (route != '/' && widget.currentRoute.startsWith(route));
  }

  String _getUserInitials() {
    if (widget.currentUser == null || widget.currentUser!['nome'] == null) {
      return 'U';
    }

    final name = widget.currentUser!['nome'] as String;
    final parts = name.trim().split(' ');

    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();

    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  String _getUserRole() {
    switch (userRole) {
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

  // Método para obter URL da imagem do avatar (grande)
  String? _getAvatarUrl() {
    if (widget.currentUser == null) return null;

    final email = widget.currentUser!['email'] as String?;
    final fotoPerfilPath = widget.currentUser!['foto_perfil'] as String?;

    if (email == null || email.isEmpty) return null;

    // Se a foto_perfil é o padrão ou está vazia, não usar imagem
    if (fotoPerfilPath == null ||
        fotoPerfilPath.isEmpty ||
        fotoPerfilPath == 'AVATAR.png') {
      return null;
    }

    return _apiService.getUserAvatarUrl(email);
  }

  // Widget para o avatar grande com imagem ou iniciais
  Widget _buildUserAvatar() {
    final avatarUrl = _getAvatarUrl();

    return CircleAvatar(
      radius: 40,
      backgroundColor: Colors.white,
      child: avatarUrl != null
          ? CircleAvatar(
              radius: 37,
              backgroundColor: const Color(0xFFFF8000),
              child: ClipOval(
                child: Image.network(
                  avatarUrl,
                  width: 74,
                  height: 74,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    debugPrint('Erro ao carregar avatar na sidebar: $error');
                    // Fallback para iniciais quando a imagem falha
                    return Container(
                      width: 74,
                      height: 74,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFF8000),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          _getUserInitials(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  },
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    // Mostrar iniciais enquanto carrega
                    return Container(
                      width: 74,
                      height: 74,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFF8000),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          _getUserInitials(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            )
          : CircleAvatar(
              radius: 37,
              backgroundColor: const Color(0xFFFF8000),
              child: Text(
                _getUserInitials(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
    );
  }
}
