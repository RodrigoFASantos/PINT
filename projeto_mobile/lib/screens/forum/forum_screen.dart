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

  // Diálogo para criar tópico (Admins/Formadores)
  void _showCriarTopicoDialog(Map<String, dynamic> categoria) {
    final TextEditingController tituloController = TextEditingController();
    final TextEditingController descricaoController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.add_circle, color: Color(0xFF5181B8)),
              SizedBox(width: 8),
              Text('Criar Novo Tópico'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Categoria
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.folder, color: Color(0xFF5181B8), size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Categoria: ${categoria['nome']}',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 16),

                // Título
                Text(
                  'Título do Tópico:',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: tituloController,
                  decoration: InputDecoration(
                    hintText: 'Digite o título do tópico',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: Icon(Icons.title, color: Color(0xFF5181B8)),
                  ),
                  maxLength: 100,
                ),
                SizedBox(height: 16),

                // Descrição
                Text(
                  'Descrição (opcional):',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: descricaoController,
                  decoration: InputDecoration(
                    hintText: 'Digite uma descrição para o tópico',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon:
                        Icon(Icons.description, color: Color(0xFF5181B8)),
                  ),
                  maxLines: 3,
                  maxLength: 500,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isLoading ? null : () => Navigator.pop(context),
              child: Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      final titulo = tituloController.text.trim();
                      if (titulo.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('O título do tópico é obrigatório'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }

                      setDialogState(() {
                        isLoading = true;
                      });

                      try {
                        final result = await _apiService.criarTopico(
                          idCategoria:
                              categoria['id_categoria'] ?? categoria['id'],
                          titulo: titulo,
                          descricao: descricaoController.text.trim().isNotEmpty
                              ? descricaoController.text.trim()
                              : null,
                        );

                        Navigator.pop(context);

                        if (result != null && result['success'] == true) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result['message'] ??
                                  'Tópico criado com sucesso!'),
                              backgroundColor: Colors.green,
                            ),
                          );
                          // Recarregar tópicos da categoria
                          await _carregarTopicosCategoria(
                              categoria['id_categoria'] ?? categoria['id']);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  result?['message'] ?? 'Erro ao criar tópico'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      } catch (error) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Erro ao criar tópico: $error'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF5181B8),
              ),
              child: isLoading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text('Criar Tópico'),
            ),
          ],
        ),
      ),
    );
  }

  // Diálogo para solicitar tópico (Formandos)
  void _showSolicitarTopicoDialog(Map<String, dynamic> categoria) {
    final TextEditingController tituloController = TextEditingController();
    final TextEditingController descricaoController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.request_page, color: Color(0xFFFF8000)),
              SizedBox(width: 8),
              Text('Solicitar Novo Tópico'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info sobre solicitação
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue[200]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info, color: Colors.blue, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Sua solicitação será enviada para o administrador para aprovação.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 16),

                // Categoria
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.folder, color: Color(0xFFFF8000), size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Categoria: ${categoria['nome']}',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 16),

                // Título
                Text(
                  'Título do Tópico:',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: tituloController,
                  decoration: InputDecoration(
                    hintText: 'Digite o título do tópico',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: Icon(Icons.title, color: Color(0xFFFF8000)),
                  ),
                  maxLength: 100,
                ),
                SizedBox(height: 16),

                // Descrição
                Text(
                  'Descrição (opcional):',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: descricaoController,
                  decoration: InputDecoration(
                    hintText: 'Descreva brevemente o que gostaria de discutir',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon:
                        Icon(Icons.description, color: Color(0xFFFF8000)),
                  ),
                  maxLines: 3,
                  maxLength: 500,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isLoading ? null : () => Navigator.pop(context),
              child: Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      final titulo = tituloController.text.trim();
                      if (titulo.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('O título do tópico é obrigatório'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }

                      setDialogState(() {
                        isLoading = true;
                      });

                      try {
                        final result = await _apiService.solicitarTopico(
                          idCategoria:
                              categoria['id_categoria'] ?? categoria['id'],
                          titulo: titulo,
                          descricao: descricaoController.text.trim().isNotEmpty
                              ? descricaoController.text.trim()
                              : null,
                        );

                        Navigator.pop(context);

                        if (result != null && result['success'] == true) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result['message'] ??
                                  'Solicitação enviada com sucesso!'),
                              backgroundColor: Colors.green,
                              duration: Duration(seconds: 4),
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(result?['message'] ??
                                  'Erro ao enviar solicitação'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      } catch (error) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Erro ao enviar solicitação: $error'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFFF8000),
              ),
              child: isLoading
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text('Enviar Solicitação'),
            ),
          ],
        ),
      ),
    );
  }

  // Navegar diretamente para as conversas do tópico
  void _handleVerTopico(int topicoId) {
    debugPrint(
        '🔧 [FORUM] Navegando diretamente para conversas do tópico: $topicoId');
    Navigator.pushNamed(context, '/forum/topico/$topicoId/conversas');
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
          title: Text('Fórum'),
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
              Text('A carregar fórum...'),
            ],
          ),
        ),
      );
    }

    if (erro != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Fórum'),
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
        title: Text('Fórum'),
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
                                    ElevatedButton.icon(
                                      onPressed: () =>
                                          _handleCriarTopico(categoria),
                                      icon: Icon(
                                        userRole == 1 || userRole == 2
                                            ? Icons.add
                                            : Icons.request_page,
                                        size: 18,
                                      ),
                                      label: Text(
                                        userRole == 1 || userRole == 2
                                            ? 'Criar Tópico'
                                            : 'Solicitar Tópico',
                                        style: TextStyle(fontSize: 13),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            userRole == 1 || userRole == 2
                                                ? Color(0xFF5181B8)
                                                : Color(0xFFFF8000),
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 12, vertical: 8),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
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
                  // Visual mais claro para indicar que vai direto para chat
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          topico['titulo'] ?? 'Sem título',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF5181B8),
                          ),
                        ),
                      ),
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Color(0xFF4CAF50).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.chat,
                                size: 14, color: Color(0xFF4CAF50)),
                            SizedBox(width: 4),
                            Text(
                              'Chat',
                              style: TextStyle(
                                fontSize: 10,
                                color: Color(0xFF4CAF50),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
                      Row(
                        children: [
                          Icon(Icons.access_time,
                              size: 12, color: Colors.grey[600]),
                          SizedBox(width: 4),
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
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
