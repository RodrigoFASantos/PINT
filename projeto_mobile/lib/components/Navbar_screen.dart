import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NavbarScreen extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onToggleSidebar;
  final Map<String, dynamic>? currentUser;
  final int notificacoesNaoLidas;

  const NavbarScreen({
    Key? key,
    this.onToggleSidebar,
    this.currentUser,
    this.notificacoesNaoLidas = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFFFF8000),
      elevation: 2,
      leading: IconButton(
        icon: const Icon(Icons.menu, color: Colors.white),
        onPressed: onToggleSidebar ?? () => Scaffold.of(context).openDrawer(),
        tooltip: 'Menu',
      ),
      title: const Text(
        'EduGest',
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
      actions: [
        // Botão de notificações
        IconButton(
          icon: Stack(
            children: [
              const Icon(Icons.notifications, color: Colors.white),
              if (notificacoesNaoLidas > 0)
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
                      notificacoesNaoLidas > 99
                          ? '99+'
                          : '$notificacoesNaoLidas',
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
          IconButton(
            icon: const Icon(Icons.person, color: Colors.white),
            onPressed: () => _navigateToPerfil(context),
            tooltip: 'Perfil',
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

  // Obter imagem do avatar (implementar quando disponível)
  ImageProvider? _getUserAvatarImage() {
    // Por enquanto retornamos null para usar as iniciais
    // No futuro, implementar lógica similar ao React:
    // if (currentUser?['foto_perfil'] == 'AVATAR.png') return defaultAvatar;
    // return NetworkImage(ApiService().getUserAvatarUrl(currentUser['email']));
    return null;
  }

  void _navigateToNotifications(BuildContext context) {
    Navigator.pushNamed(context, '/notificacoes');
  }

  void _navigateToPerfil(BuildContext context) {
    Navigator.pushNamed(context, '/perfil');
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
