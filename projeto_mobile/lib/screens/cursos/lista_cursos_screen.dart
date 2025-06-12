import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../widgets/network_image_widget.dart';
import '../../components/Navbar_screen.dart';
import '../../components/sidebar_screen.dart';
import 'dart:convert';

class ListaCursosPage extends StatefulWidget {
  @override
  _ListaCursosPageState createState() => _ListaCursosPageState();
}

class _ListaCursosPageState extends State<ListaCursosPage> {
  final ApiService _apiService = ApiService();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<Map<String, dynamic>> cursos = [];
  List<Map<String, dynamic>> categorias = [];
  List<Map<String, dynamic>> areas = [];
  List<Map<String, dynamic>> areasFiltradas = [];
  List<Map<String, dynamic>> topicos = [];
  List<Map<String, dynamic>> topicosFiltrados = [];

  int currentPage = 1;
  int totalPages = 1;
  int totalCursos = 0;
  final int cursosPerPage = 12;

  String searchTerm = '';
  bool showFilters = false;
  bool isLoading = false;

  String categoriaId = '';
  String areaId = '';
  String topicoId = '';
  String tipoFiltro = 'todos';

  // Para sidebar e navbar
  Map<String, dynamic>? currentUser;
  bool isLoadingUser = true;
  bool hasConnectionError = false;

  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeScreen();
    _searchController.addListener(() {
      if (searchTerm != _searchController.text) {
        setState(() {
          searchTerm = _searchController.text;
        });
        _fetchCursos();
      }
    });
  }

  Future<void> _initializeScreen() async {
    // Verificar se a API está conectada
    final isConnected = await _apiService.testConnection();
    if (!isConnected) {
      debugPrint('⚠️ API não conectada, tentando reconectar...');
      await _apiService.reconnect();
    }

    // Carregar dados do usuário e iniciais
    await Future.wait([
      _loadUserData(),
      _loadInitialData(),
    ]);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      setState(() {
        hasConnectionError = false;
      });

      // Verificar se há token
      final token = _apiService.authToken;
      if (token != null) {
        // Buscar dados completos do usuário usando o método correto
        final userData = await _apiService.getCurrentUser();
        if (userData != null) {
          setState(() {
            currentUser = userData;
            isLoadingUser = false;
          });
        } else {
          // Se falhar ao obter dados, tentar método alternativo
          final response = await _apiService.get('/users/perfil');
          if (response.statusCode == 200) {
            final responseData = json.decode(response.body);
            setState(() {
              currentUser = responseData;
              isLoadingUser = false;
            });
          } else {
            setState(() {
              isLoadingUser = false;
              hasConnectionError = true;
            });
          }
        }
      } else {
        setState(() {
          isLoadingUser = false;
        });
      }
    } catch (error) {
      debugPrint('Erro ao carregar dados do usuário: $error');
      setState(() {
        isLoadingUser = false;
        hasConnectionError = true;
      });
    }
  }

  Future<void> _retryConnection() async {
    setState(() {
      isLoadingUser = true;
      hasConnectionError = false;
    });

    await _apiService.reconnect();
    await _initializeScreen();
  }

  void _toggleSidebar() {
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      _scaffoldKey.currentState?.closeDrawer();
    } else {
      _scaffoldKey.currentState?.openDrawer();
    }
  }

  Future<void> _loadInitialData() async {
    await Future.wait([
      _fetchCategorias(),
      _fetchAreas(),
      _fetchTopicos(),
      _fetchCursos(),
    ]);
  }

  Future<void> _fetchCategorias() async {
    try {
      final response = await _apiService.get('/categorias');

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToList(response);
        if (data != null) {
          setState(() {
            categorias = data.cast<Map<String, dynamic>>();
          });
        }
      }
    } catch (error) {
      debugPrint('Erro ao carregar categorias: $error');
    }
  }

  Future<void> _fetchAreas() async {
    try {
      final response = await _apiService.get('/areas');

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToList(response);
        if (data != null) {
          setState(() {
            areas = data.cast<Map<String, dynamic>>();
          });
        }
      }
    } catch (error) {
      debugPrint('Erro ao carregar áreas: $error');
    }
  }

  Future<void> _fetchTopicos() async {
    try {
      final response = await _apiService.get('/topicos-area');

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToList(response);
        if (data != null) {
          setState(() {
            topicos = data.cast<Map<String, dynamic>>();
          });
        }
      }
    } catch (error) {
      debugPrint('Erro ao carregar tópicos: $error');
    }
  }

  Future<void> _fetchCursos() async {
    setState(() {
      isLoading = true;
    });

    try {
      final queryParams = <String, String>{
        'page': currentPage.toString(),
        'limit': cursosPerPage.toString(),
      };

      if (searchTerm.isNotEmpty) queryParams['search'] = searchTerm;
      if (categoriaId.isNotEmpty) queryParams['categoria'] = categoriaId;
      if (areaId.isNotEmpty) queryParams['area'] = areaId;
      if (topicoId.isNotEmpty) queryParams['topico'] = topicoId;
      if (tipoFiltro != 'todos') queryParams['tipo'] = tipoFiltro;

      // Construir endpoint com query parameters
      String endpoint = '/cursos';
      if (queryParams.isNotEmpty) {
        final queryString = queryParams.entries
            .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
            .join('&');
        endpoint += '?$queryString';
      }

      final response = await _apiService.get(endpoint);

      if (response.statusCode == 200) {
        final data = _apiService.parseResponseToMap(response);
        if (data != null) {
          setState(() {
            cursos =
                (data['cursos'] as List? ?? []).cast<Map<String, dynamic>>();
            totalPages = data['totalPages'] ?? 1;
            totalCursos = data['total'] ?? 0;
          });
        }
      }
    } catch (error) {
      debugPrint('Erro ao carregar cursos: $error');
      if (mounted) {
        AppUtils.showError(context, 'Erro ao carregar cursos');
      }
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  void _filterAreas() {
    if (categoriaId.isNotEmpty) {
      setState(() {
        areasFiltradas = areas.where((area) {
          final areaCategoriaId = area['id_categoria']?.toString() ??
              area['categoria_id']?.toString() ??
              '';
          return areaCategoriaId == categoriaId;
        }).toList();
        areaId = '';
        topicoId = '';
      });
    } else {
      setState(() {
        areasFiltradas = [];
        areaId = '';
        topicoId = '';
      });
    }
  }

  void _filterTopicos() {
    if (areaId.isNotEmpty) {
      setState(() {
        topicosFiltrados = topicos.where((topico) {
          return topico['id_area']?.toString() == areaId;
        }).toList();
        topicoId = '';
      });
    } else {
      setState(() {
        topicosFiltrados = [];
        topicoId = '';
      });
    }
  }

  void _clearFilters() {
    setState(() {
      searchTerm = '';
      categoriaId = '';
      areaId = '';
      topicoId = '';
      tipoFiltro = 'todos';
      areasFiltradas = [];
      topicosFiltrados = [];
      currentPage = 1;
    });
    _searchController.clear();
    _fetchCursos();
  }

  void _navigateToCurso(Map<String, dynamic> curso) {
    final cursoId = curso['id_curso']?.toString() ?? curso['id']?.toString();

    if (cursoId != null && cursoId.isNotEmpty) {
      Navigator.pushNamed(
        context,
        '/curso',
        arguments: cursoId,
      );
    } else {
      AppUtils.showError(context, 'ID do curso não encontrado');
    }
  }

  String _getImageUrl(Map<String, dynamic> curso) {
    // Primeiro: verificar se tem imagem_path
    final imagePath = curso['imagem_path'] as String?;
    if (imagePath != null && imagePath.isNotEmpty) {
      return _apiService.getCursoImageUrl(imagePath);
    }

    // Segundo: tentar usar nome do curso como fallback
    final nomeCurso = curso['nome'] as String?;
    if (nomeCurso != null && nomeCurso.isNotEmpty) {
      final nomeCursoSlug = nomeCurso
          .toLowerCase()
          .replaceAll(' ', '-')
          .replaceAll(RegExp(r'[^\w-]+'), '');
      return _apiService.getCursoCapaUrl(nomeCursoSlug);
    }

    // Terceiro: usar dir_path se disponível
    final dirPath = curso['dir_path'] as String?;
    if (dirPath != null && dirPath.isNotEmpty) {
      return _apiService.getCursoImageUrl('$dirPath/capa.png');
    }

    // Fallback final: imagem padrão
    return _apiService.getCursoImageUrl(null);
  }

  Widget _buildSearchBar() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Pesquisar cursos...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
          ),
          SizedBox(width: 8),
          IconButton(
            onPressed: () {
              setState(() {
                showFilters = !showFilters;
              });
            },
            icon: Icon(Icons.filter_list),
            style: IconButton.styleFrom(
              backgroundColor: Colors.grey[100],
              padding: EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    if (!showFilters) return SizedBox.shrink();

    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Categoria
          DropdownButtonFormField<String>(
            value: categoriaId.isEmpty ? null : categoriaId,
            decoration: InputDecoration(
              labelText: 'Categoria',
              prefixIcon: Icon(Icons.folder),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
            ),
            items: [
              DropdownMenuItem(value: '', child: Text('Selecionar Categoria')),
              ...categorias.map((cat) => DropdownMenuItem(
                    value: cat['id_categoria'].toString(),
                    child: Text(cat['nome']),
                  )),
            ],
            onChanged: (value) {
              setState(() {
                categoriaId = value ?? '';
              });
              _filterAreas();
              _fetchCursos();
            },
          ),
          SizedBox(height: 12),

          // Área
          DropdownButtonFormField<String>(
            value: areaId.isEmpty ? null : areaId,
            decoration: InputDecoration(
              labelText: 'Área',
              prefixIcon: Icon(Icons.bookmark),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
            ),
            items: [
              DropdownMenuItem(value: '', child: Text('Selecionar Área')),
              ...areasFiltradas.map((area) => DropdownMenuItem(
                    value: area['id_area'].toString(),
                    child: Text(area['nome']),
                  )),
            ],
            onChanged: categoriaId.isEmpty
                ? null
                : (value) {
                    setState(() {
                      areaId = value ?? '';
                    });
                    _filterTopicos();
                    _fetchCursos();
                  },
          ),
          SizedBox(height: 12),

          // Tópico
          DropdownButtonFormField<String>(
            value: topicoId.isEmpty ? null : topicoId,
            decoration: InputDecoration(
              labelText: 'Tópico',
              prefixIcon: Icon(Icons.label),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
            ),
            items: [
              DropdownMenuItem(value: '', child: Text('Selecionar Tópico')),
              ...topicosFiltrados.map((topico) => DropdownMenuItem(
                    value: topico['id_topico'].toString(),
                    child: Text(topico['titulo']),
                  )),
            ],
            onChanged: areaId.isEmpty
                ? null
                : (value) {
                    setState(() {
                      topicoId = value ?? '';
                    });
                    _fetchCursos();
                  },
          ),
          SizedBox(height: 12),

          // Tipo de curso
          Text('Tipo de Curso', style: TextStyle(fontWeight: FontWeight.w500)),
          SizedBox(height: 8),
          Row(
            children: [
              _buildFilterChip('Todos', 'todos', Icons.list),
              SizedBox(width: 8),
              _buildFilterChip('Síncronos', 'sincrono', Icons.people),
              SizedBox(width: 8),
              _buildFilterChip('Assíncronos', 'assincrono', Icons.book),
            ],
          ),
          SizedBox(height: 12),

          // Botão limpar filtros
          if (searchTerm.isNotEmpty ||
              categoriaId.isNotEmpty ||
              areaId.isNotEmpty ||
              topicoId.isNotEmpty ||
              tipoFiltro != 'todos')
            Center(
              child: ElevatedButton.icon(
                onPressed: _clearFilters,
                icon: Icon(Icons.clear),
                label: Text('Limpar Filtros'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[100],
                  foregroundColor: Colors.red[700],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, IconData icon) {
    final isSelected = tipoFiltro == value;
    return FilterChip(
      selected: isSelected,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          SizedBox(width: 4),
          Text(label),
        ],
      ),
      onSelected: (selected) {
        setState(() {
          tipoFiltro = value;
        });
        _fetchCursos();
      },
      selectedColor: Colors.blue[100],
      checkmarkColor: Colors.blue[700],
    );
  }

  Widget _buildCursoCard(Map<String, dynamic> curso) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _navigateToCurso(curso),
        child: Container(
          height: 200,
          child: Stack(
            children: [
              // Imagem usando CursoImage
              Positioned.fill(
                child: CursoImage(
                  imageUrl: _getImageUrl(curso),
                  fallbackUrl: _apiService.getCursoImageUrl(null),
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                  borderRadius: BorderRadius.circular(8),
                  cursoNome: curso['nome'],
                  showLoadingText: false,
                ),
              ),
              // Overlay com informações
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.7),
                    ],
                  ),
                ),
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Spacer(),
                    Text(
                      curso['nome'] ?? '',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${_formatDate(curso['data_inicio'])} - ${_formatDate(curso['data_fim'])}',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      curso['tipo'] == 'sincrono'
                          ? '${curso['vagas'] ?? 0} vagas'
                          : 'Auto-estudo',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  Widget _buildPagination() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: currentPage > 1
                ? () {
                    setState(() {
                      currentPage--;
                    });
                    _fetchCursos();
                  }
                : null,
            icon: Icon(Icons.chevron_left),
            style: IconButton.styleFrom(
              backgroundColor:
                  currentPage > 1 ? Colors.blue[50] : Colors.grey[200],
              foregroundColor: currentPage > 1 ? Colors.blue : Colors.grey,
            ),
          ),
          SizedBox(width: 16),
          Text(
            '$currentPage / $totalPages',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(width: 16),
          IconButton(
            onPressed: currentPage < totalPages
                ? () {
                    setState(() {
                      currentPage++;
                    });
                    _fetchCursos();
                  }
                : null,
            icon: Icon(Icons.chevron_right),
            style: IconButton.styleFrom(
              backgroundColor:
                  currentPage < totalPages ? Colors.blue[50] : Colors.grey[200],
              foregroundColor:
                  currentPage < totalPages ? Colors.blue : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Mostrar loading enquanto carrega os dados do usuário
    if (isLoadingUser) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
              SizedBox(height: 16),
              Text(
                'A carregar dados...',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      );
    }

    // Mostrar erro de conectividade se existir
    if (hasConnectionError) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Cursos'),
          backgroundColor: Color(0xFFFF8000),
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.cloud_off,
                  size: 64,
                  color: Colors.grey[400],
                ),
                SizedBox(height: 16),
                Text(
                  'Problema de Conectividade',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Não foi possível conectar ao servidor.\nVerifique sua conexão e tente novamente.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _retryConnection,
                  icon: Icon(Icons.refresh),
                  label: Text('Tentar Novamente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFFFF8000),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      appBar: NavbarScreen(
        onToggleSidebar: _toggleSidebar,
        currentUser: currentUser,
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/cursos',
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilters(),
          Expanded(
            child: isLoading
                ? Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
                    ),
                  )
                : cursos.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_off,
                                size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'Nenhum curso encontrado',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                            SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _clearFilters,
                              child: Text('Limpar Filtros'),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        controller: _scrollController,
                        padding: EdgeInsets.all(16),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.8,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: cursos.length,
                        itemBuilder: (context, index) {
                          return _buildCursoCard(cursos[index]);
                        },
                      ),
          ),
          if (!isLoading && cursos.isNotEmpty) _buildPagination(),
        ],
      ),
    );
  }
}
