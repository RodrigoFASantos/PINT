import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart'; // Para AppUtils
import 'cursos/cursos_screen.dart';
import 'users/perfil_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final _apiService = ApiService();

  // Criar as telas direto aqui (sem DashboardScreen)
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      _buildHomeTab(), // Tab principal com info básica
      CursosScreen(),
      PerfilScreen(),
    ];
  }

  /// Criar tab principal (substitui o Dashboard)
  Widget _buildHomeTab() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SoftSkills'),
        backgroundColor: const Color(0xFFFF8000),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saudação
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF8000),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Icon(
                        Icons.person,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bem-vindo!',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const Text('Sistema de Formação'),
                          Text(
                            'Explore os cursos disponíveis',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Acesso rápido
            Text(
              'Acesso Rápido',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),

            // Grid com opções
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildQuickAccessCard(
                  'Cursos',
                  Icons.school,
                  Colors.blue,
                  () => setState(() => _currentIndex = 1),
                ),
                _buildQuickAccessCard(
                  'Perfil',
                  Icons.person,
                  Colors.green,
                  () => setState(() => _currentIndex = 2),
                ),
                _buildQuickAccessCard(
                  'Notificações',
                  Icons.notifications,
                  Colors.orange,
                  () => AppUtils.showInfo(context, 'Em desenvolvimento'),
                ),
                _buildQuickAccessCard(
                  'Configurações',
                  Icons.settings,
                  Colors.purple,
                  () => AppUtils.showInfo(context, 'Em desenvolvimento'),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Informações do sistema
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Informações do Sistema',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    _buildInfoRow('Versão', '1.0.0'),
                    _buildInfoRow('API', _apiService.apiBase),
                    _buildInfoRow('Estado', 'Conectado'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAccessCard(
      String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFFFF8000),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school),
            label: 'Cursos',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}
