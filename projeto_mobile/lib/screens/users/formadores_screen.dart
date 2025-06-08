import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class FormadoresScreen extends StatefulWidget {
  @override
  _FormadoresScreenState createState() => _FormadoresScreenState();
}

class _FormadoresScreenState extends State<FormadoresScreen> {
  final _apiService = ApiService();
  List<dynamic>? _formadores;
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFormadores();
  }

  Future<void> _loadFormadores() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();
      
      // TODO: Implementar endpoint para obter formadores
      // final formadores = await _apiService.getFormadores();
      
      setState(() {
        _currentUser = userData;
        _formadores = []; // Por enquanto lista vazia
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar formadores: $e';
        _isLoading = false;
      });
    }
  }

  Widget _buildFormadorCard(Map<String, dynamic> formador) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          radius: 30,
          backgroundColor: const Color(0xFFFF8000),
          child: Text(
            _getInitials(formador['nome'] ?? 'F'),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          formador['nome'] ?? 'Nome não disponível',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              formador['email'] ?? 'Email não disponível',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            if (formador['especialidades'] != null)
              Text(
                'Especialidades: ${formador['especialidades'].join(', ')}',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () => _showFormadorDetails(formador),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'F';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  void _showFormadorDetails(Map<String, dynamic> formador) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(formador['nome'] ?? 'Formador'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Email: ${formador['email'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            Text('Telefone: ${formador['telefone'] ?? 'N/A'}'),
            const SizedBox(height: 8),
            if (formador['especialidades'] != null) ...[
              const Text('Especialidades:'),
              ...formador['especialidades']
                  .map<Widget>((esp) => Text('• $esp'))
                  .toList(),
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
              AppUtils.showInfo(context, 'Contacto em desenvolvimento');
            },
            child: const Text('Contactar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Formadores'),
        backgroundColor: const Color(0xFFFF8000),
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/formadores',
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
                        onPressed: _loadFormadores,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : _formadores == null || _formadores!.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.person_outline,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Nenhum formador encontrado',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Funcionalidade em desenvolvimento',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadFormadores,
                      color: const Color(0xFFFF8000),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _formadores!.length,
                        itemBuilder: (context, index) {
                          final formador = _formadores![index];
                          return _buildFormadorCard(
                              formador as Map<String, dynamic>);
                        },
                      ),
                    ),
    );
  }
}