import 'package:flutter/material.dart';
import '../../utils/constants.dart';
import '../../services/api_service.dart';

class CustomSidebar extends StatefulWidget {
  @override
  _CustomSidebarState createState() => _CustomSidebarState();
}

class _CustomSidebarState extends State<CustomSidebar> {
  Map<String, dynamic>? _userInfo;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _carregarPerfil();
  }

  Future<void> _carregarPerfil() async {
    try {
      final userInfo = await ApiService().getUserProfile();
      setState(() {
        _userInfo = userInfo;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: Colors.white,
        child: Column(
          children: [
            // Cabeçalho do drawer
            _buildHeader(),

            // Menu de navegação
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildMenuItem(
                    icon: Icons.home,
                    title: 'Início',
                    route: '/home',
                  ),
                  _buildMenuItem(
                    icon: Icons.school,
                    title: 'Cursos',
                    route: '/cursos',
                  ),
                  _buildMenuItem(
                    icon: Icons.timeline,
                    title: 'Percurso Formativo',
                    route: '/percurso-formativo',
                  ),
                  _buildMenuItem(
                    icon: Icons.people,
                    title: 'Formadores',
                    route: '/formadores',
                  ),
                  _buildMenuItem(
                    icon: Icons.notifications,
                    title: 'Notificações',
                    route: '/notificacoes',
                  ),

                  // Seções condicionais baseadas no tipo de utilizador
                  if (_userInfo?['id_cargo'] == 2) ...[
                    Divider(),
                    _buildSectionHeader('Área do Formador'),
                    _buildMenuItem(
                      icon: Icons.dashboard,
                      title: 'Os Meus Cursos',
                      route: '/formador/cursos',
                    ),
                    _buildMenuItem(
                      icon: Icons.assignment,
                      title: 'Avaliar Trabalhos',
                      route: '/formador/avaliacoes',
                    ),
                  ],

                  if (_userInfo?['id_cargo'] == 1) ...[
                    Divider(),
                    _buildSectionHeader('Administração'),
                    _buildMenuItem(
                      icon: Icons.dashboard,
                      title: 'Dashboard Admin',
                      route: '/admin/dashboard',
                    ),
                    _buildMenuItem(
                      icon: Icons.people,
                      title: 'Utilizadores',
                      route: '/admin/usuarios',
                    ),
                    _buildMenuItem(
                      icon: Icons.school,
                      title: 'Gestão de Cursos',
                      route: '/admin/cursos',
                    ),
                    _buildMenuItem(
                      icon: Icons.category,
                      title: 'Categorias',
                      route: '/admin/categorias',
                    ),
                  ],

                  Divider(),
                  _buildMenuItem(
                    icon: Icons.person,
                    title: 'Perfil',
                    route: '/perfil',
                  ),
                  _buildMenuItem(
                    icon: Icons.settings,
                    title: 'Definições',
                    route: '/configuracoes',
                  ),
                ],
              ),
            ),

            // Rodapé
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: AppSpacing.md),

              // Avatar
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: CircleAvatar(
                  radius: 28,
                  backgroundImage: _userInfo != null
                      ? NetworkImage(
                          ApiService.userAvatar(_userInfo!['email'] ?? ''))
                      : null,
                  child: _userInfo == null
                      ? Icon(Icons.person, color: Colors.grey[600])
                      : null,
                ),
              ),

              SizedBox(height: AppSpacing.md),

              // Nome do utilizador
              if (_loading)
                Container(
                  width: 100,
                  height: 16,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                )
              else
                Text(
                  _userInfo?['nome'] ?? 'Utilizador',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

              SizedBox(height: AppSpacing.xs),

              // Cargo
              if (!_loading)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getCargoNome(_userInfo?['id_cargo']),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String route,
  }) {
    final isSelected = ModalRoute.of(context)?.settings.name == route;

    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppColors.primary.withOpacity(0.1),
      onTap: () {
        Navigator.pop(context);
        if (!isSelected) {
          Navigator.pushNamed(context, route);
        }
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.sm),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: Icon(Icons.logout, color: AppColors.error),
            title: Text(
              'Terminar Sessão',
              style: TextStyle(color: AppColors.error),
            ),
            onTap: _logout,
          ),
          SizedBox(height: AppSpacing.sm),
          Text(
            '${AppConstants.appName} v${AppConstants.appVersion}',
            style: AppTextStyles.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _getCargoNome(int? idCargo) {
    switch (idCargo) {
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

  void _logout() async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Terminar Sessão'),
        content: Text('Tem certeza que deseja terminar a sessão?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      await ApiService.logout();
      Navigator.pushNamedAndRemoveUntil(
        context,
        '/login',
        (route) => false,
      );
    }
  }
}
