import 'package:flutter/material.dart';
import 'dart:convert';

import 'detalhes_curso.dart';
import 'conteudos_curso.dart';
import 'presencas_curso.dart';
import 'avaliacao_curso.dart';
import '../../services/api_service.dart';

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

  late TabController _tabController;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    // Inicializar com 4 tabs agora (Detalhes, Presenças, Conteúdos, Avaliação)
    _tabController = TabController(length: 4, vsync: this);
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

      // Obter dados do curso usando ApiService
      final cursoResponse = await _apiService.get('/cursos/${widget.cursoId}');

      if (cursoResponse.statusCode == 200) {
        final cursoData = json.decode(cursoResponse.body);

        // Verificar acesso ao curso
        final dataAtual = DateTime.now();
        final dataFimCurso = DateTime.parse(cursoData['data_fim']);
        final cursoTerminado = dataFimCurso.isBefore(dataAtual);

        // Se for curso assíncrono terminado e não for admin, negar acesso
        if (cursoData['tipo'] == 'assincrono' &&
            cursoTerminado &&
            userRole != 1) {
          setState(() {
            acessoNegado = true;
            loading = false;
          });
          return;
        }

        // Verificar inscrição do usuário usando ApiService
        bool userInscrito = false;
        try {
          final inscricaoResponse =
              await _apiService.get('/inscricoes/verificar/${widget.cursoId}');

          if (inscricaoResponse.statusCode == 200) {
            final inscricaoData = json.decode(inscricaoResponse.body);
            userInscrito = inscricaoData['inscrito'] ?? false;
          }
        } catch (e) {
          print('Erro ao verificar inscrição: $e');
        }

        setState(() {
          curso = cursoData;
          inscrito = userInscrito;
          loading = false;
          error = null;

          // Definir tab inicial baseado no status de inscrição
          // Se não inscrito: tab 0 (Detalhes)
          // Se inscrito: tab 2 (Conteúdos)
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (inscrito) {
              _tabController.animateTo(2); // Conteúdos
            } else {
              _tabController.animateTo(0); // Detalhes
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

  String _getImageUrl() {
    if (curso?['imagem_path'] != null && curso!['imagem_path'].isNotEmpty) {
      return '${_apiService.apiBase.replaceAll('/api', '')}/${curso!['imagem_path']}';
    }
    return 'assets/images/default_course.png';
  }

  Widget _buildErrorWidget() {
    return Scaffold(
      appBar: AppBar(
        title: Text('Erro'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
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
                    ? 'Este curso assíncrono já foi encerrado e apenas administradores podem aceder ao seu conteúdo.'
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
      appBar: AppBar(
        title: Text('Carregando...'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
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
                Icon(Icons.calendar_today, color: Colors.white70, size: 16),
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
                  curso?['tipo'] == 'sincrono' ? Icons.people : Icons.book,
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
          ],
        ),
      ),
    );
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
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              flexibleSpace: FlexibleSpaceBar(
                background: _buildCourseHeader(),
              ),
            ),
          ];
        },
        body: Column(
          children: [
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
                    icon: Icon(Icons.info_outline),
                    text: 'Detalhes',
                  ),
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
                  DetalhesCurso(
                    cursoId: widget.cursoId,
                    curso: curso!,
                    inscrito: inscrito,
                    userRole: userRole,
                    onInscricaoChanged: (novoEstado) {
                      setState(() {
                        inscrito = novoEstado;
                      });

                      // Se acabou de se inscrever, mudar para a tab de conteúdos
                      if (novoEstado) {
                        _tabController.animateTo(2);
                      }
                    },
                  ),
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
