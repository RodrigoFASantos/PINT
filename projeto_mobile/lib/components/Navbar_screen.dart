import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/notificacoes_provider.dart';
import '../screens/notificacoes_screen.dart';

class NavbarScreen extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onToggleSidebar;
  final Map<String, dynamic>? currentUser;

  const NavbarScreen({
    Key? key,
    this.onToggleSidebar,
    this.currentUser,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFFFF8000),
      elevation: 2,
      // ✅ CORRIGIDO: Usar Builder para garantir contexto correto
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: onToggleSidebar ?? () => Scaffold.of(context).openDrawer(),
          tooltip: 'Menu',
        ),
      ),
      title: const Text(
        'EduGest',
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
      // ✅ Garantir que a navbar ocupa toda a largura
      titleSpacing: 0,
      centerTitle: true,
      actions: [
        // Botão de notificações com badge - PRIORIDADE
        Consumer<NotificacoesProvider>(
          builder: (context, notificacoesProvider, child) {
            return Container(
              margin: const EdgeInsets.only(right: 8),
              child: IconButton(
                icon: Stack(
                  children: [
                    const Icon(
                      Icons.notifications,
                      color: Colors.white,
                      size: 26,
                    ),
                    if (notificacoesProvider.notificacoesNaoLidas > 0)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            notificacoesProvider.notificacoesNaoLidas > 99
                                ? '99+'
                                : '${notificacoesProvider.notificacoesNaoLidas}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () => _navigateToNotifications(context),
                tooltip: 'Notificações',
              ),
            );
          },
        ),

        // Avatar do utilizador
        if (currentUser != null) ...[
          GestureDetector(
            onTap: () => _navigateToPerfil(context),
            child: Container(
              margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
              child: CircleAvatar(
                radius: 20,
                backgroundColor: Colors.white,
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFFF8000),
                  backgroundImage: _getUserAvatarImage(),
                  child: _getUserAvatarImage() == null
                      ? Text(
                          _getUserInitials(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        )
                      : null,
                ),
              ),
            ),
          ),
        ] else ...[
          // Se não há utilizador logado, mostrar ícone genérico
          Container(
            margin: const EdgeInsets.only(right: 16),
            child: IconButton(
              icon: const Icon(Icons.person, color: Colors.white),
              onPressed: () => _navigateToPerfil(context),
              tooltip: 'Perfil',
            ),
          ),
        ],
      ],
    );
  }

  // Obter iniciais do nome do utilizador
  String _getUserInitials() {
    if (currentUser == null || currentUser!['nome'] == null) {
      return 'U';
    }

    final name = currentUser!['nome'] as String;
    final parts = name.trim().split(' ');

    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();

    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  // Obter imagem do avatar
  ImageProvider? _getUserAvatarImage() {
    if (currentUser == null || currentUser!['email'] == null) {
      return null;
    }

    final email = currentUser!['email'] as String;
    final fotoPerfil = currentUser!['foto_perfil'] as String?;

    // Se for a imagem padrão, retorna null para usar as iniciais
    if (fotoPerfil == 'AVATAR.png' || fotoPerfil == null) {
      return null;
    }

    // Usar o ApiService para obter a URL correta
    final apiService = ApiService();
    return NetworkImage(apiService.getUserAvatarUrl(email));
  }

  // Navegar para as notificações
  void _navigateToNotifications(BuildContext context) {
    // Garantir que navega para a rota correta
    Navigator.pushNamed(context, '/notificacoes').catchError((error) {
      // Se a rota nomeada falhar, tentar navegação direta
      debugPrint('Erro na navegação por rota nomeada: $error');
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const NotificacoesScreen(),
        ),
      );
    });
  }

  // Navegar para o perfil
  void _navigateToPerfil(BuildContext context) {
    Navigator.pushNamed(context, '/perfil').catchError((error) {
      debugPrint('Erro na navegação para perfil: $error');
      // Aqui você pode adicionar uma navegação alternativa se necessário
    });
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
