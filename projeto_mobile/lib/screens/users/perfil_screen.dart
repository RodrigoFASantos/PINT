import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart'; // Para AppUtils e AuthManager

class PerfilScreen extends StatefulWidget {
  @override
  _PerfilScreenState createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  final _apiService = ApiService();
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    setState(() => _isLoading = true);

    try {
      final userData = await _apiService.getCurrentUser();
      setState(() {
        _userData = userData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      AppUtils.showError(context, 'Erro ao carregar dados do perfil: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        backgroundColor: const Color(0xFFFF8000),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => AppUtils.showInfo(
                context, 'Edição de perfil em desenvolvimento'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _userData == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      const Text('Erro ao carregar dados do perfil'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadUserData,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadUserData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        // Avatar e info principal
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(24.0),
                            child: Column(
                              children: [
                                // Avatar
                                Container(
                                  width: 100,
                                  height: 100,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFF8000),
                                    borderRadius: BorderRadius.circular(50),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFFFF8000)
                                            .withOpacity(0.3),
                                        blurRadius: 20,
                                        offset: const Offset(0, 5),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.person,
                                    size: 50,
                                    color: Colors.white,
                                  ),
                                ),

                                const SizedBox(height: 16),

                                // Nome do utilizador
                                Text(
                                  _userData!['nome'] ?? 'Nome não disponível',
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                  textAlign: TextAlign.center,
                                ),

                                const SizedBox(height: 8),

                                // Email
                                Text(
                                  _userData!['email'] ?? 'Email não disponível',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: Colors.grey.shade600,
                                      ),
                                  textAlign: TextAlign.center,
                                ),

                                const SizedBox(height: 8),

                                // Tipo de utilizador
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFF8000)
                                        .withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    _userData!['tipo_utilizador'] ??
                                        'Utilizador',
                                    style: const TextStyle(
                                      color: Color(0xFFFF8000),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Informações detalhadas
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Informações da Conta',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                                const SizedBox(height: 16),
                                _buildInfoRow(
                                    'Nome', _userData!['nome'] ?? 'N/A'),
                                _buildInfoRow(
                                    'Email', _userData!['email'] ?? 'N/A'),
                                _buildInfoRow('Tipo',
                                    _userData!['tipo_utilizador'] ?? 'N/A'),
                                _buildInfoRow(
                                    'Estado',
                                    _userData!['ativo'] == true
                                        ? 'Ativo'
                                        : 'Inativo'),
                                _buildInfoRow('Data de Registo',
                                    _userData!['data_registo'] ?? 'N/A'),
                                _buildInfoRow('Última Atualização',
                                    _userData!['updated_at'] ?? 'N/A'),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Estatísticas (se disponível)
                        if (_userData!['estatisticas'] != null)
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Estatísticas',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildStatCard(
                                          'Cursos',
                                          _userData!['total_cursos']
                                                  ?.toString() ??
                                              '0',
                                          Icons.school,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: _buildStatCard(
                                          'Certificados',
                                          _userData!['total_certificados']
                                                  ?.toString() ??
                                              '0',
                                          Icons.verified,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                        const SizedBox(height: 16),

                        // Ações
                        Card(
                          child: Column(
                            children: [
                              ListTile(
                                leading: const Icon(Icons.edit,
                                    color: Color(0xFFFF8000)),
                                title: const Text('Editar Perfil'),
                                trailing: const Icon(Icons.arrow_forward_ios,
                                    size: 16),
                                onTap: () => AppUtils.showInfo(context,
                                    'Edição de perfil em desenvolvimento'),
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: const Icon(Icons.notifications,
                                    color: Color(0xFFFF8000)),
                                title: const Text('Notificações'),
                                trailing: const Icon(Icons.arrow_forward_ios,
                                    size: 16),
                                onTap: () => AppUtils.showInfo(context,
                                    'Configurações de notificações em desenvolvimento'),
                              ),
                              const Divider(height: 1),
                              ListTile(
                                leading: const Icon(Icons.help,
                                    color: Color(0xFFFF8000)),
                                title: const Text('Ajuda'),
                                trailing: const Icon(Icons.arrow_forward_ios,
                                    size: 16),
                                onTap: () => AppUtils.showInfo(context,
                                    'Central de ajuda em desenvolvimento'),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Botão de logout
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _logout,
                            icon: const Icon(Icons.logout),
                            label: const Text('Terminar Sessão'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),

                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFF8000).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: const Color(0xFFFF8000)),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFFFF8000),
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terminar Sessão'),
        content: const Text('Tem certeza que quer sair da aplicação?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sair'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await AuthManager.clearAuth();
        AppUtils.showSuccess(context, 'Sessão terminada com sucesso');
        Navigator.pushReplacementNamed(context, '/login');
      } catch (e) {
        AppUtils.showError(context, 'Erro ao terminar sessão: $e');
      }
    }
  }
}
