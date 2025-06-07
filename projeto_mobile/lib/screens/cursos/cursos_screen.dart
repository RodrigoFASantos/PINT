import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart'; // Para AppUtils

class CursosScreen extends StatefulWidget {
  @override
  _CursosScreenState createState() => _CursosScreenState();
}

class _CursosScreenState extends State<CursosScreen> {
  final _apiService = ApiService();
  List<dynamic>? _cursos;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCursos();
  }

  Future<void> _loadCursos() async {
    setState(() => _isLoading = true);

    try {
      final cursos = await _apiService.getCursos();
      setState(() {
        _cursos = cursos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      AppUtils.showError(context, 'Erro ao carregar cursos: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cursos'),
        backgroundColor: const Color(0xFFFF8000),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCursos,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _cursos == null || _cursos!.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.school_outlined,
                        size: 64,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      const Text('Nenhum curso encontrado'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadCursos,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadCursos,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _cursos!.length,
                    itemBuilder: (context, index) {
                      final curso = _cursos![index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
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
                                      color: const Color(0xFFFF8000)
                                          .withOpacity(0.1),
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
                                ],
                              ),
                            ],
                          ),
                          trailing:
                              const Icon(Icons.arrow_forward_ios, size: 16),
                          onTap: () => AppUtils.showInfo(context,
                              'Detalhes do curso "${curso['nome']}" em desenvolvimento'),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadCursos,
        backgroundColor: const Color(0xFFFF8000),
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
