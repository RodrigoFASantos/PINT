import 'package:flutter/material.dart';
import 'dart:convert';

import 'detalhes_curso.dart';
import 'conteudos_curso.dart';
import 'presencas_curso.dart';
import 'avaliacao_curso.dart';
import '../../services/api_service.dart';
import '../../components/sidebar_screen.dart';
import '../../components/navbar_screen.dart';

class PaginaCursoPage extends StatefulWidget {
  final String cursoId;

  const PaginaCursoPage({Key? key, required this.cursoId}) : super(key: key);

  @override
  _PaginaCursoPageState createState() => _PaginaCursoPageState();
}

class _PaginaCursoPageState extends State<PaginaCursoPage>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? curso;
  bool inscrito = false;
  bool loading = true;
  String? error;
  bool acessoNegado = false;
  int? userRole;
  Map<String, dynamic>? currentUser;

  // Estado para controlar a exibição dos detalhes - CORRIGIDO
  bool _mostrarDetalhes = true; // Por padrão sempre mostrar

  late TabController _tabController;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchCursoDetails();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchCursoDetails() async {
    try {
      setState(() {
        loading = true;
      });

      // Obter dados do utilizador atual primeiro
      try {
        final userResponse = await _apiService.get('/users/perfil');
        if (userResponse.statusCode == 200) {
          final userData = json.decode(userResponse.body);
          userRole = userData['id_cargo'];
          currentUser = userData; // ✅ GUARDAR dados do usuário
          print(
              '👤 Utilizador carregado: ${userData['nome']} (Cargo: $userRole)');
        } else {
          print(
              '⚠️ Erro ao obter dados do utilizador: ${userResponse.statusCode}');
        }
      } catch (e) {
        print('❌ Erro ao obter dados do utilizador: $e');
      }

      // Obter dados do curso usando ApiService
      final cursoResponse = await _apiService.get('/cursos/${widget.cursoId}');

      if (cursoResponse.statusCode == 200) {
        final cursoData = json.decode(cursoResponse.body);
        print('📚 Curso carregado: ${cursoData['nome']}');

        // Verificar inscrição do usuário
        bool userInscrito = false;
        try {
          print('🔍 Verificando inscrição para curso ${widget.cursoId}...');
          final inscricaoResponse =
              await _apiService.get('/inscricoes/verificar/${widget.cursoId}');

          if (inscricaoResponse.statusCode == 200) {
            final inscricaoData = json.decode(inscricaoResponse.body);
            userInscrito = inscricaoData['inscrito'] ?? false;
            print(
                '📝 Estado da inscrição: ${userInscrito ? "Inscrito" : "Não inscrito"}');
          } else {
            print(
                '❌ Erro ao verificar inscrição: ${inscricaoResponse.statusCode}');
          }
        } catch (e) {
          print('❌ Erro ao verificar inscrição: $e');
        }

        // Verificar acesso ao curso
        final dataAtual = DateTime.now();
        final dataFimCurso = DateTime.parse(cursoData['data_fim']);
        final cursoTerminado = dataFimCurso.isBefore(dataAtual);

        // Verificação de acesso para cursos terminados
        if (cursoTerminado && userRole != 1) {
          if (cursoData['tipo'] == 'assincrono') {
            // Curso assíncrono terminado: apenas admins
            setState(() {
              acessoNegado = true;
              loading = false;
            });
            return;
          } else if (cursoData['tipo'] == 'sincrono' && !userInscrito) {
            // Curso síncrono terminado: apenas admins ou inscritos
            setState(() {
              acessoNegado = true;
              loading = false;
            });
            return;
          }
        }

        setState(() {
          curso = cursoData;
          inscrito = userInscrito;
          loading = false;
          error = null;

          // CORRIGIDO: Definir estado inicial dos detalhes
          // Sempre mostrar detalhes por padrão, usuário pode ocultar se quiser
          _mostrarDetalhes = true;

          // Definir tab inicial baseado no status de inscrição
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (inscrito) {
              _tabController.animateTo(1); // Conteúdos (índice 1)
            } else {
              _tabController.animateTo(0); // Presenças (índice 0)
            }
          });
        });
      } else {
        setState(() {
          error = 'Erro ao carregar o curso';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Erro ao carregar detalhes do curso: $e';
        loading = false;
      });
    }
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

  String _formatEstadoParaExibicao(String? estado) {
    if (estado == null) return 'Indisponível';

    const estadosMap = {
      'planeado': 'Planeado',
      'em_curso': 'Em Curso',
      'terminado': 'Terminado',
      'inativo': 'Inativo'
    };

    final estadoNormalizado = estado.toLowerCase().replaceAll(' ', '_');
    return estadosMap[estadoNormalizado] ?? estado;
  }

  Color _getEstadoColor(String? estado) {
    if (estado == null) return Colors.grey;

    const estadoCores = {
      'planeado': Colors.amber,
      'em_curso': Colors.green,
      'terminado': Colors.red,
      'inativo': Colors.grey
    };

    final estadoNormalizado = estado.toLowerCase().replaceAll(' ', '_');
    return estadoCores[estadoNormalizado] ?? Colors.grey;
  }

  String _getImageUrl() {
    if (curso?['imagem_path'] != null && curso!['imagem_path'].isNotEmpty) {
      return '${_apiService.apiBase.replaceAll('/api', '')}/${curso!['imagem_path']}';
    }
    return 'assets/images/default_course.png';
  }

  String _getAccessDeniedMessage() {
    if (curso != null) {
      final dataAtual = DateTime.now();
      final dataFimCurso = DateTime.parse(curso!['data_fim']);
      final cursoTerminado = dataFimCurso.isBefore(dataAtual);

      if (cursoTerminado) {
        if (curso!['tipo'] == 'assincrono') {
          return 'Este curso assíncrono já foi encerrado e apenas administradores podem aceder ao seu conteúdo.';
        } else {
          return 'Este curso síncrono já foi encerrado. Apenas administradores e alunos que estavam inscritos podem aceder ao seu conteúdo.';
        }
      }
    }

    return 'Não tem permissão para aceder a este curso.';
  }

  Widget _buildErrorWidget() {
    return Scaffold(
      // ✅ CORRIGIDO: NavbarScreen no erro
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: currentUser,
        ),
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/cursos',
      ),
      body: Center(
        child: Container(
          padding: EdgeInsets.all(24),
          margin: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 1,
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              SizedBox(height: 16),
              Text(
                acessoNegado ? 'Acesso Negado' : 'Erro ao carregar o curso',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.red,
                ),
              ),
              SizedBox(height: 8),
              Text(
                acessoNegado
                    ? _getAccessDeniedMessage()
                    : error ?? 'Curso não encontrado',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Voltar para lista de cursos'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return Scaffold(
      // ✅ CORRIGIDO: NavbarScreen no loading
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: currentUser,
        ),
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/cursos',
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'A carregar detalhes do curso...',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseHeader() {
    final status = _formatEstadoParaExibicao(curso?['estado']);
    final statusColor = _getEstadoColor(curso?['estado']);

    return Container(
      height: 200,
      decoration: BoxDecoration(
        image: DecorationImage(
          image: NetworkImage(_getImageUrl()),
          fit: BoxFit.cover,
          onError: (exception, stackTrace) {
            // Fallback para imagem padrão
          },
        ),
      ),
      child: Container(
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
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Título do curso
                      Text(
                        curso?['nome'] ?? '',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.calendar_today,
                              color: Colors.white70, size: 16),
                          SizedBox(width: 8),
                          Text(
                            '${_formatDate(curso?['data_inicio'])} - ${_formatDate(curso?['data_fim'])}',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            curso?['tipo'] == 'sincrono'
                                ? Icons.people
                                : Icons.book,
                            color: Colors.white70,
                            size: 16,
                          ),
                          SizedBox(width: 8),
                          Text(
                            curso?['tipo'] == 'sincrono'
                                ? '${curso?['vagas'] ?? 0} vagas'
                                : 'Auto-estudo',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      // ✅ Estado do curso por baixo das vagas
                      SizedBox(height: 4),
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // BOTÃO DE DETALHES
                Container(
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    onPressed: () {
                      setState(() {
                        _mostrarDetalhes = !_mostrarDetalhes;
                      });
                    },
                    icon: Icon(
                      _mostrarDetalhes ? Icons.expand_less : Icons.info_outline,
                      color: Colors.white,
                      size: 28,
                    ),
                    tooltip: _mostrarDetalhes
                        ? 'Ocultar detalhes'
                        : 'Mostrar detalhes',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _onInscricaoChanged(bool novoEstado) {
    setState(() {
      inscrito = novoEstado;

      // Se acabou de se inscrever, mudar para conteúdos (manter detalhes visíveis)
      if (novoEstado) {
        _tabController.animateTo(1); // Conteúdos (índice 1)
      } else {
        // Se cancelou inscrição, ir para presenças
        _tabController.animateTo(0); // Presenças (índice 0)
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return _buildLoadingWidget();
    }

    if (acessoNegado || error != null || curso == null) {
      return _buildErrorWidget();
    }

    return Scaffold(
      // ✅ NavbarScreen no topo
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: currentUser,
        ),
      ),
      // ✅ SidebarScreen como drawer
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/cursos',
      ),
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              // ✅ Sem seta de volta
              automaticallyImplyLeading: false,
              flexibleSpace: FlexibleSpaceBar(
                background: _buildCourseHeader(),
              ),
            ),
          ];
        },
        body: Column(
          children: [
            // SEMPRE mostrar detalhes quando solicitado
            AnimatedContainer(
              duration: Duration(milliseconds: 300),
              height: _mostrarDetalhes ? null : 0,
              child: _mostrarDetalhes
                  ? Container(
                      color: Colors.white,
                      child: DetalhesCurso(
                        cursoId: widget.cursoId,
                        curso: curso!,
                        inscrito: inscrito,
                        userRole: userRole,
                        mostrarDetalhes: _mostrarDetalhes,
                        onInscricaoChanged: _onInscricaoChanged,
                        // ✅ REMOVIDO: hideCancel (já não existe)
                      ),
                    )
                  : Container(),
            ),

            Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                labelColor: Colors.blue,
                unselectedLabelColor: Colors.grey,
                indicatorColor: Colors.blue,
                isScrollable: true,
                tabs: [
                  Tab(
                    icon: Icon(Icons.check_circle_outline),
                    text: 'Presenças',
                  ),
                  Tab(
                    icon: Icon(Icons.library_books),
                    text: 'Conteúdos',
                  ),
                  Tab(
                    icon: Icon(Icons.star_outline),
                    text: 'Avaliação',
                  ),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  PresencasCurso(
                    cursoId: widget.cursoId,
                    userRole: userRole,
                    inscrito: inscrito,
                  ),
                  ConteudosCurso(
                    cursoId: widget.cursoId,
                    inscrito: inscrito,
                  ),
                  AvaliacaoCurso(
                    cursoId: widget.cursoId,
                    userRole: userRole,
                    formadorId: curso?['id_formador'],
                    tipoCurso: curso?['tipo'],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
