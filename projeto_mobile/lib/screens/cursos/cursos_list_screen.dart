import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class CursosListScreen extends StatefulWidget {
  @override
  _CursosListScreenState createState() => _CursosListScreenState();
}

class _CursosListScreenState extends State<CursosListScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<dynamic> _cursos = [];
  List<dynamic> _categorias = [];
  bool _loading = true;
  String? _error;
  String? _categoriaSelected;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _carregarDados() async {
    try {
      setState(() => _loading = true);

      final cursosResponse = await ApiService.getCursos();
      final categoriasResponse = await ApiService.getCategorias();

      setState(() {
        _cursos = cursosResponse;
        _categorias = categoriasResponse;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar cursos';
        _loading = false;
      });
    }
  }

  List<dynamic> get _cursosFiltrados {
    List<dynamic> filtered = _cursos;

    // Filtrar por categoria
    if (_categoriaSelected != null) {
      filtered = filtered
          .where((curso) => curso['categoria']?['nome'] == _categoriaSelected)
          .toList();
    }

    // Filtrar por pesquisa
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((curso) {
        final nome = curso['nome']?.toLowerCase() ?? '';
        final categoria = curso['categoria']?['nome']?.toLowerCase() ?? '';
        final area = curso['area']?['nome']?.toLowerCase() ?? '';
        final query = _searchQuery.toLowerCase();

        return nome.contains(query) ||
            categoria.contains(query) ||
            area.contains(query);
      }).toList();
    }

    return filtered;
  }

  void _abrirCurso(Map<String, dynamic> curso) {
    Navigator.pushNamed(context, '/cursos/${curso['id_curso'] ?? curso['id']}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Text('Cursos Disponíveis'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _carregarDados,
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de pesquisa e filtros
          Container(
            padding: EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Campo de pesquisa
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Pesquisar cursos...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                  },
                ),

                SizedBox(height: 12),

                // Filtro por categoria
                Row(
                  children: [
                    Icon(Icons.filter_list, color: Colors.grey[600]),
                    SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _categoriaSelected,
                        decoration: InputDecoration(
                          labelText: 'Filtrar por categoria',
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: [
                          DropdownMenuItem<String>(
                            value: null,
                            child: Text('Todas as categorias'),
                          ),
                          ..._categorias
                              .map((categoria) => DropdownMenuItem<String>(
                                    value: categoria['nome'],
                                    child: Text(categoria['nome'] ?? ''),
                                  )),
                        ],
                        onChanged: (value) {
                          setState(() => _categoriaSelected = value);
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Lista de cursos
          Expanded(
            child: _loading
                ? Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error, color: Colors.red, size: 48),
                            SizedBox(height: 16),
                            Text(_error!),
                            SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _carregarDados,
                              child: Text('Tentar novamente'),
                            ),
                          ],
                        ),
                      )
                    : _cursosFiltrados.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_off,
                                    size: 64, color: Colors.grey),
                                SizedBox(height: 16),
                                Text(
                                  _searchQuery.isNotEmpty ||
                                          _categoriaSelected != null
                                      ? 'Nenhum curso encontrado com os filtros aplicados.'
                                      : 'Nenhum curso disponível no momento.',
                                  style: TextStyle(
                                      fontSize: 16, color: Colors.grey[600]),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _carregarDados,
                            child: GridView.builder(
                              padding: EdgeInsets.all(16),
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.75,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: _cursosFiltrados.length,
                              itemBuilder: (context, index) {
                                final curso = _cursosFiltrados[index];
                                return _buildCursoCard(curso);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursoCard(Map<String, dynamic> curso) {
    final estado = curso['estado'] ?? 'Disponível';

    return GestureDetector(
      onTap: () => _abrirCurso(curso),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagem do curso
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  color: Colors.grey[300],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        ApiService.cursoImagem(curso['nome'] ?? ''),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[300],
                            child: Icon(
                              Icons.school,
                              color: Colors.grey[600],
                              size: 40,
                            ),
                          );
                        },
                      ),

                      // Badge de estado
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding:
                              EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(estado),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            estado,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Informações do curso
            Expanded(
              flex: 2,
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      curso['nome'] ?? 'Sem nome',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    SizedBox(height: 4),

                    Text(
                      curso['categoria']?['nome'] ?? 'N/A',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    if (curso['area']?['nome'] != null)
                      Text(
                        curso['area']['nome'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),

                    Spacer(),

                    // Informações adicionais
                    if (curso['formador']?['nome'] != null)
                      Row(
                        children: [
                          Icon(Icons.person, size: 14, color: Colors.grey[500]),
                          SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              curso['formador']['nome'],
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[600],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                    if (curso['vagas_disponiveis'] != null)
                      Row(
                        children: [
                          Icon(Icons.people, size: 14, color: Colors.grey[500]),
                          SizedBox(width: 4),
                          Text(
                            '${curso['vagas_disponiveis']} vagas',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'disponível':
        return AppColors.statusDisponivel;
      case 'em curso':
        return AppColors.statusEmCurso;
      case 'terminado':
        return AppColors.statusTerminado;
      case 'lotado':
        return AppColors.statusLotado;
      default:
        return AppColors.primary;
    }
  }
}
