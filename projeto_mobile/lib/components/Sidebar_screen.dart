import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart'; // Para AppUtils

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
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildGeneralSection(),
                    if (userRole == 3) _buildFormandoSection(),
                    if (userRole == 2) _buildFormadorSection(),
                    if (userRole == 1) _buildAdminSection(),
                    _buildConfiguracoesSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
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
      child: SafeArea(
        child: Container(
          height: 180, // Altura reduzida
          child: Column(
            children: [
              // Botão de fechar
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ),

              const Spacer(),

              // Avatar e informações do utilizador
              if (widget.currentUser != null) ...[
                CircleAvatar(
                  radius: 30, // Reduzido de 35 para 30
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 27, // Reduzido proporcionalmente
                    backgroundColor: const Color(0xFFFF8000),
                    child: Text(
                      _getUserInitials(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20, // Reduzido de 24 para 20
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8), // Reduzido de 12 para 8
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    widget.currentUser!['nome'] ?? 'Utilizador',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16, // Reduzido de 18 para 16
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 2), // Reduzido de 4 para 2
                Text(
                  _getUserRole(),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 13, // Reduzido de 14 para 13
                  ),
                  textAlign: TextAlign.center,
                ),
              ] else ...[
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, size: 35, color: Color(0xFFFF8000)),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Utilizador',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],

              const SizedBox(height: 16), // Reduzido de 20 para 16
            ],
          ),
        ),
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

  Widget _buildFormandoSection() {
    return _buildSection(
      'Formando',
      [
        // Por enquanto vazio como no React
      ],
    );
  }

  Widget _buildFormadorSection() {
    return _buildSection(
      'Formador',
      [
        _buildMenuItem('Cursos Lecionados', Icons.school, '/area-formador'),
      ],
    );
  }

  Widget _buildAdminSection() {
    return _buildSection(
      'Administração',
      [
        _buildMenuItem('Dashboard', Icons.dashboard, '/admin/dashboard'),
        _buildMenuItem('Gerir Cursos', Icons.book_outlined, '/admin/cursos'),
        _buildMenuItem('Gerir Utilizadores', Icons.people, '/admin/usuarios'),
        _buildMenuItem('Gerenciar Denúncias', Icons.flag, '/admin/denuncias'),
        _buildMenuItem('Percurso Formandos', Icons.trending_up,
            '/admin/percurso-formandos'),
        _buildMenuItem('Gerir Categorias', Icons.category, '/admin/categorias'),
        _buildMenuItem('Gerir Áreas', Icons.business, '/admin/areas'),
        _buildMenuItem('Gerir Tópicos', Icons.topic, '/admin/topicos'),
        _buildMenuItem('Criar Curso', Icons.add_circle, '/admin/criar-curso'),
        _buildMenuItem(
            'Criar Utilizador', Icons.person_add, '/admin/criar-usuario'),
      ],
    );
  }

  Widget _buildConfiguracoesSection() {
    return _buildSection(
      'Configurações',
      [
        _buildMenuItem('Meu Percurso', Icons.timeline, '/percurso-formativo'),
        _buildMenuItem('Perfil', Icons.person_outline, '/perfil'),
        _buildMenuItem('Definições', Icons.settings, '/definicoes'),
        _buildMenuItem('Ajuda', Icons.help_outline, null, onTap: _showHelp),
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
    // Lógica melhorada para detectar rota ativa
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
        '/definicoes': ['/definicoes'],
      };

      // Verificar se a rota atual corresponde a alguma das rotas mapeadas
      if (routeMapping.containsKey(route)) {
        isActive = routeMapping[route]!.contains(widget.currentRoute);
      } else {
        // Para rotas admin e outras, verificar se a rota atual começa com a rota do menu
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
      '/definicoes': ['/definicoes'],
    };

    if (routeMapping.containsKey(route)) {
      return routeMapping[route]!.contains(widget.currentRoute);
    }

    return widget.currentRoute == route ||
        (route != '/' && widget.currentRoute.startsWith(route));
  }

  void _showHelp() {
    Navigator.pop(context); // Fechar sidebar

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ajuda'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Como posso ajudar?'),
            SizedBox(height: 16),
            Text('• Para suporte técnico, contacte o administrador'),
            Text('• Para dúvidas sobre cursos, consulte a secção Cursos'),
            Text('• Para gerir o seu perfil, aceda às Configurações'),
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
}
