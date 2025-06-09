import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class ForumScreen extends StatefulWidget {
  @override
  _ForumScreenState createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> categorias = [];
  Map<int, bool> categoriasExpandidas = {};
  Map<int, List<dynamic>> categoriasTopicos = {};
  Map<int, bool> loadingTopicos = {};
  bool loading = true;
  int? userRole;
  String? erro;
  Map<String, dynamic>? currentUser;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    try {
      await _loadUserData();
      await _loadCategorias();
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar dados: $error';
        loading = false;
      });
    }
  }

  Future<void> _loadUserData() async {
    try {
      final response = await _apiService.get('/users/perfil');
      final data = _apiService.parseResponseToMap(response);

      if (data != null) {
        setState(() {
          currentUser = data;
          userRole = data['id_cargo'];
        });
        debugPrint(
            '🔧 [FORUM] Usuário carregado: ${currentUser?['nome']}, Role: $userRole');
      }
    } catch (error) {
      debugPrint('❌ [FORUM] Erro ao carregar usuário: $error');
    }
  }

  Future<void> _loadCategorias() async {
    try {
      final response = await _apiService.get('/categorias');
      final data = _apiService.parseResponseToList(response);

      if (data != null) {
        setState(() {
          categorias = data;
          // Inicializar todas as categorias como contraídas
          categoriasExpandidas = {};
          for (var categoria in categorias) {
            final catId = categoria['id_categoria'] ?? categoria['id'];
            categoriasExpandidas[catId] = false;
          }
          loading = false;
        });
        debugPrint('✅ [FORUM] ${categorias.length} categorias carregadas');
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar categorias: $error';
        loading = false;
      });
    }
  }

  Future<void> _toggleCategoria(int categoriaId) async {
    debugPrint('🔧 [FORUM] Categoria clicada: $categoriaId');

    setState(() {
      categoriasExpandidas[categoriaId] =
          !(categoriasExpandidas[categoriaId] ?? false);
    });

    // Se está expandindo e ainda não carregou os tópicos
    if (categoriasExpandidas[categoriaId]! &&
        !categoriasTopicos.containsKey(categoriaId)) {
      await _carregarTopicosCategoria(categoriaId);
    }
  }

  Future<void> _carregarTopicosCategoria(int categoriaId) async {
    try {
      setState(() {
        loadingTopicos[categoriaId] = true;
      });

      final response =
          await _apiService.get('/topicos-area/categoria/$categoriaId');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          categoriasTopicos[categoriaId] = data['data'];
          loadingTopicos[categoriaId] = false;
        });
        debugPrint(
            '✅ [FORUM] ${data['data'].length} tópicos carregados para categoria $categoriaId');
      }
    } catch (error) {
      setState(() {
        loadingTopicos[categoriaId] = false;
      });
      debugPrint(
          '❌ [FORUM] Erro ao carregar tópicos da categoria $categoriaId: $error');
    }
  }

  void _handleCriarTopico(Map<String, dynamic> categoria) {
    if (userRole == 1 || userRole == 2) {
      // Administrador ou Formador pode criar tópico
      _showCriarTopicoDialog(categoria);
    } else {
      // Outros usuários podem solicitar tópico
      _showSolicitarTopicoDialog(categoria);
    }
  }

  void _showCriarTopicoDialog(Map<String, dynamic> categoria) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Criar Tópico'),
        content:
            Text('Funcionalidade de criar tópico será implementada em breve.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showSolicitarTopicoDialog(Map<String, dynamic> categoria) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Solicitar Tópico'),
        content: Text(
            'Funcionalidade de solicitar tópico será implementada em breve.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }

  void _handleVerTopico(int topicoId) {
    debugPrint('🔧 [FORUM] Navegando para tópico: $topicoId');
    Navigator.pushNamed(context, '/forum/topico/$topicoId');
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data indisponível';

    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
    } catch (error) {
      return 'Data inválida';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Fórum de Partilha'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
              SizedBox(height: 16),
              Text('A carregar fórum de partilha...'),
            ],
          ),
        ),
      );
    }

    if (erro != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Fórum de Partilha'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Erro ao carregar fórum',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  erro!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    loading = true;
                    erro = null;
                  });
                  _initializeData();
                },
                icon: Icon(Icons.refresh),
                label: Text('Tentar Novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Fórum de Partilha'),
        backgroundColor: Color(0xFFFF8000),
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/forum',
      ),
      body: Container(
        color: Color(0xFFF5F7FB),
        child: Column(
          children: [
            // Header
            Container(
              padding: EdgeInsets.all(20),
              child: Text(
                'Fórum de Partilha de Conhecimento',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF333333),
                ),
                textAlign: TextAlign.center,
              ),
            ),

            // Lista de categorias
            Expanded(
              child: categorias.isEmpty
                  ? Center(
                      child: Text(
                        'Nenhuma categoria encontrada',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.all(16),
                      itemCount: categorias.length,
                      itemBuilder: (context, index) {
                        final categoria = categorias[index];
                        final categoriaId =
                            categoria['id_categoria'] ?? categoria['id'];
                        final isExpanded =
                            categoriasExpandidas[categoriaId] ?? false;
                        final topicos = categoriasTopicos[categoriaId] ?? [];
                        final isLoading = loadingTopicos[categoriaId] ?? false;

                        return Card(
                          margin: EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              // Header da categoria
                              Container(
                                padding: EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  border: Border(
                                    bottom:
                                        BorderSide(color: Colors.grey[200]!),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    // Botão expandir/colapsar
                                    Expanded(
                                      child: InkWell(
                                        onTap: () =>
                                            _toggleCategoria(categoriaId),
                                        child: Row(
                                          children: [
                                            Icon(
                                              isExpanded
                                                  ? Icons.keyboard_arrow_down
                                                  : Icons.keyboard_arrow_right,
                                              color: Color(0xFF5181B8),
                                            ),
                                            SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                categoria['nome'] ??
                                                    'Categoria',
                                                style: TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.w600,
                                                  color: Color(0xFF333333),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Botão criar/solicitar tópico
                                    ElevatedButton(
                                      onPressed: () =>
                                          _handleCriarTopico(categoria),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Color(0xFF5181B8),
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 8),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                      ),
                                      child: Text(
                                        userRole == 1 || userRole == 2
                                            ? 'Criar Tópico'
                                            : 'Solicitar Tópico',
                                        style: TextStyle(fontSize: 14),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Conteúdo da categoria (quando expandida)
                              if (isExpanded) ...[
                                Container(
                                  padding: EdgeInsets.all(16),
                                  color: Color(0xFFF8FAFD),
                                  child: isLoading
                                      ? Center(
                                          child: Padding(
                                            padding: EdgeInsets.all(20),
                                            child: CircularProgressIndicator(),
                                          ),
                                        )
                                      : topicos.isEmpty
                                          ? Center(
                                              child: Padding(
                                                padding: EdgeInsets.all(20),
                                                child: Text(
                                                  'Não há tópicos nesta categoria ainda.',
                                                  style: TextStyle(
                                                    fontStyle: FontStyle.italic,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ),
                                            )
                                          : _buildTopicosList(topicos),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopicosList(List<dynamic> topicos) {
    return Column(
      children: topicos.map<Widget>((topico) {
        return Card(
          margin: EdgeInsets.only(bottom: 12),
          elevation: 1,
          child: InkWell(
            onTap: () => _handleVerTopico(topico['id_topico']),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    topico['titulo'] ?? 'Sem título',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF5181B8),
                    ),
                  ),
                  if (topico['descricao'] != null) ...[
                    SizedBox(height: 8),
                    Text(
                      topico['descricao'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Por: ${topico['criador']?['nome'] ?? 'Usuário'}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[700],
                        ),
                      ),
                      Text(
                        _formatarData(topico['data_criacao']),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
