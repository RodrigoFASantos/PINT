import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../services/api_service.dart';
import './quiz_screen.dart';

class AvaliacaoCurso extends StatefulWidget {
  final String cursoId;
  final int? userRole;
  final int? formadorId;
  final String? tipoCurso;

  const AvaliacaoCurso({
    Key? key,
    required this.cursoId,
    this.userRole,
    this.formadorId,
    this.tipoCurso,
  }) : super(key: key);

  @override
  _AvaliacaoCursoState createState() => _AvaliacaoCursoState();
}

class _AvaliacaoCursoState extends State<AvaliacaoCurso> {
  // Para quizzes (cursos assíncronos)
  List<Map<String, dynamic>> quizzes = [];
  bool loadingQuizzes = true;

  // Para submissões (cursos síncronos)
  Map<String, dynamic>? topicoAvaliacao;
  List<int> expandedPastas = [];
  Map<int, List<Map<String, dynamic>>> submissoes = {};
  bool loadingTopicos = true;
  String? error;

  final ApiService _apiService = ApiService();

  bool get isCursoAssincrono => widget.tipoCurso == 'assincrono';
  // Corrigir: Se userRole for null, assumir que é formando (papel 3)
  bool get isFormador =>
      (widget.userRole ?? 3) == 1 || (widget.userRole ?? 3) == 2;
  bool get isFormando => (widget.userRole ?? 3) == 3;

  @override
  void initState() {
    super.initState();
    print('🎯 Inicializando avaliações para curso ${widget.cursoId}');
    print('📚 Tipo de curso: ${widget.tipoCurso}');
    print(
        '👤 Papel do utilizador: ${widget.userRole} (assumindo ${isFormando ? "Formando" : "Formador"})');
    _initializeData();
  }

  Future<void> _initializeData() async {
    if (isCursoAssincrono) {
      print('📋 Carregando quizzes para curso assíncrono');
      await _fetchQuizzes();
    } else {
      print('📋 Carregando tópicos para curso síncrono');
      await _fetchTopicos();
    }
  }

  // ========== QUIZZES (CURSOS ASSÍNCRONOS) ==========
  Future<void> _fetchQuizzes() async {
    if (!isCursoAssincrono) {
      print('⚠️ Tentativa de carregar quizzes para curso não assíncrono');
      return;
    }

    try {
      setState(() {
        loadingQuizzes = true;
        error = null;
      });

      print('🎯 Buscando quizzes para curso: ${widget.cursoId}');

      final response =
          await _apiService.get('/quiz?id_curso=${widget.cursoId}');

      print('📡 Status da resposta quizzes: ${response.statusCode}');
      print('📄 Corpo da resposta quizzes: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data != null && data['success'] == true && data['data'] != null) {
          final quizzesData = data['data'] as List;
          setState(() {
            quizzes = quizzesData.cast<Map<String, dynamic>>();
            loadingQuizzes = false;
          });
          print('✅ ${quizzes.length} quizzes carregados com sucesso');

          // Debug: Verificar estado dos quizzes
          for (var quiz in quizzes) {
            print(
                '🔍 Quiz: ${quiz['titulo']}, Estado: ${quiz['estado']}, Expirou: ${quiz['expirou']}, Ativo: ${quiz['ativo']}');
          }
        } else if (data is List) {
          setState(() {
            quizzes = data.cast<Map<String, dynamic>>();
            loadingQuizzes = false;
          });
          print('✅ ${quizzes.length} quizzes carregados (formato alternativo)');
        } else {
          setState(() {
            quizzes = [];
            loadingQuizzes = false;
          });
          print('⚠️ Nenhum quiz encontrado para o curso');
        }
      } else {
        setState(() {
          error = 'Erro ao carregar quizzes (${response.statusCode})';
          quizzes = [];
          loadingQuizzes = false;
        });
        print('❌ Erro HTTP: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao carregar quizzes: $e');
      setState(() {
        error = 'Não foi possível carregar os quizzes. Verifique a conexão.';
        quizzes = [];
        loadingQuizzes = false;
      });
    }
  }

  // ========== TÓPICOS E SUBMISSÕES (CURSOS SÍNCRONOS) ==========
  Future<void> _fetchTopicos() async {
    if (isCursoAssincrono) {
      print('⚠️ Tentativa de carregar tópicos para curso assíncrono');
      return;
    }

    try {
      setState(() {
        loadingTopicos = true;
        error = null;
      });

      print('🎯 Buscando tópicos para curso síncrono: ${widget.cursoId}');
      final response =
          await _apiService.get('/topicos-curso/curso/${widget.cursoId}');

      print('📡 Status da resposta tópicos: ${response.statusCode}');
      print('📄 Corpo da resposta tópicos: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data is List) {
          final topicos = data.cast<Map<String, dynamic>>();
          final topicoAvaliacao = topicos.firstWhere(
            (topico) => topico['nome']?.toString().toLowerCase() == 'avaliação',
            orElse: () => {},
          );

          if (topicoAvaliacao.isNotEmpty) {
            setState(() {
              this.topicoAvaliacao = topicoAvaliacao;
              loadingTopicos = false;
            });
            print(
                '✅ Tópico de avaliação encontrado: ${topicoAvaliacao['nome']}');
          } else {
            setState(() {
              this.topicoAvaliacao = null;
              loadingTopicos = false;
            });
            print('⚠️ Nenhum tópico de avaliação encontrado');
          }
        } else {
          setState(() {
            topicoAvaliacao = null;
            loadingTopicos = false;
          });
          print('⚠️ Resposta não é uma lista de tópicos');
        }
      } else {
        setState(() {
          error = 'Erro ao carregar tópicos (${response.statusCode})';
          loadingTopicos = false;
        });
        print('❌ Erro HTTP: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao carregar tópicos: $e');
      setState(() {
        error = 'Não foi possível carregar os tópicos. Verifique a conexão.';
        loadingTopicos = false;
      });
    }
  }

  Future<void> _fetchSubmissoesDaPasta(int pastaId) async {
    try {
      print('🎯 Buscando submissões para pasta: $pastaId');

      final params = {
        'id_curso': widget.cursoId,
        'id_pasta': pastaId.toString(),
      };

      if (!isFormador) {
        print('👤 Utilizador é formando - buscando apenas suas submissões');
      } else {
        print('👨‍🏫 Utilizador é formador - buscando todas as submissões');
      }

      final uri = Uri.parse('${_apiService.apiBase}/avaliacoes/submissoes')
          .replace(queryParameters: params);

      print('🌐 URI completa: $uri');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (_apiService.authToken != null)
            'Authorization': 'Bearer ${_apiService.authToken}',
        },
      );

      print('📡 Status submissões: ${response.statusCode}');
      print('📄 Corpo submissões: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        setState(() {
          submissoes[pastaId] =
              data is List ? data.cast<Map<String, dynamic>>() : [];
        });

        print(
            '✅ ${submissoes[pastaId]?.length ?? 0} submissões carregadas para pasta $pastaId');
      } else {
        setState(() {
          submissoes[pastaId] = [];
        });
        print('❌ Erro ao carregar submissões: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao carregar submissões da pasta $pastaId: $e');
      setState(() {
        submissoes[pastaId] = [];
      });
    }
  }

  // ========== UI HELPERS ==========
  String _formatDate(String? dateString) {
    if (dateString == null) return 'Sem data';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} às ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }

  bool _isDataLimiteExpirada(String? dataLimite) {
    if (dataLimite == null) return false;
    try {
      final limite = DateTime.parse(dataLimite);
      return DateTime.now().isAfter(limite);
    } catch (e) {
      return false;
    }
  }

  bool _isSubmissaoAtrasada(
      Map<String, dynamic> submissao, Map<String, dynamic> pasta) {
    final dataLimite = pasta['data_limite'];
    final dataSubmissao =
        submissao['data_entrega'] ?? submissao['data_submissao'];

    if (dataLimite == null || dataSubmissao == null) return false;

    try {
      final limite = DateTime.parse(dataLimite);
      final entrega = DateTime.parse(dataSubmissao);
      return entrega.isAfter(limite);
    } catch (e) {
      return false;
    }
  }

  Color _getQuizStatusColor(Map<String, dynamic> quiz) {
    final estado = quiz['estado'] ?? '';
    switch (estado) {
      case 'concluido':
        return Colors.green;
      case 'expirado':
        return Colors.red;
      case 'disponivel':
      default:
        return Colors.blue;
    }
  }

  String _getQuizStatusText(Map<String, dynamic> quiz) {
    final estado = quiz['estado'] ?? '';
    final resposta = quiz['resposta_utilizador'];

    if (resposta != null && resposta['completo'] == true) {
      final nota = resposta['nota'];
      return 'Concluído${nota != null ? ' - ${nota}/10' : ''}';
    }

    switch (estado) {
      case 'expirado':
        return 'Expirado';
      case 'disponivel':
        return 'Disponível';
      default:
        return 'Não disponível';
    }
  }

  bool _canStartQuiz(Map<String, dynamic> quiz) {
    final estado = quiz['estado'] ?? '';
    final resposta = quiz['resposta_utilizador'];
    final ativo = quiz['ativo'] ?? false;
    final expirou = quiz['expirou'] ?? false;

    print('🔍 Verificando se pode iniciar quiz:');
    print('  - Estado: $estado');
    print('  - Ativo: $ativo');
    print('  - Expirou: $expirou');
    print(
        '  - Resposta completa: ${resposta != null && resposta['completo'] == true}');

    bool canStart = ativo &&
        !expirou &&
        estado == 'disponivel' &&
        (resposta == null || resposta['completo'] != true);

    print('  - Pode iniciar: $canStart');
    return canStart;
  }

  // ========== UI WIDGETS ==========
  Widget _buildQuizzesSection() {
    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header da seção
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.quiz, color: Colors.blue[700], size: 24),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Quizzes de Avaliação',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[700],
                    ),
                  ),
                ),
                if (loadingQuizzes)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),

          // Conteúdo
          if (loadingQuizzes)
            Container(
              padding: EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text(
                      'A carregar quizzes...',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            )
          else if (quizzes.isEmpty)
            Container(
              padding: EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(
                    Icons.quiz_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Nenhum quiz disponível',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Os quizzes aparecerão aqui quando forem criados pelo formador.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
            )
          else
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: quizzes.map((quiz) => _buildQuizItem(quiz)).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuizItem(Map<String, dynamic> quiz) {
    final statusColor = _getQuizStatusColor(quiz);
    final statusText = _getQuizStatusText(quiz);
    final canStart = _canStartQuiz(quiz);

    final titulo = quiz['titulo'] ?? 'Quiz sem título';
    final descricao = quiz['descricao'];
    final perguntas = quiz['perguntas']?.length ?? 0;
    final tempoLimite = quiz['tempo_limite'];
    final ativo = quiz['ativo'] ?? true;

    print('🎨 Renderizando quiz: $titulo');
    print('   - Pode iniciar: $canStart');
    print('   - Status: $statusText');

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do quiz
          Container(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: statusColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        statusText.contains('Concluído')
                            ? Icons.check
                            : Icons.quiz,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            titulo,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: Colors.grey[800],
                            ),
                          ),
                          if (descricao != null && descricao.isNotEmpty) ...[
                            SizedBox(height: 4),
                            Text(
                              descricao,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                SizedBox(height: 12),

                // Informações do quiz
                Row(
                  children: [
                    if (perguntas > 0) ...[
                      Icon(Icons.help_outline,
                          size: 16, color: Colors.grey[600]),
                      SizedBox(width: 4),
                      Text(
                        '$perguntas pergunta${perguntas != 1 ? 's' : ''}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    if (perguntas > 0 &&
                        tempoLimite != null &&
                        tempoLimite > 0) ...[
                      SizedBox(width: 16),
                      Icon(Icons.timer, size: 16, color: Colors.grey[600]),
                      SizedBox(width: 4),
                      Text(
                        '${tempoLimite}min',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),

                SizedBox(height: 12),

                // Status do quiz
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            statusText.contains('Concluído')
                                ? Icons.check_circle
                                : statusText.contains('Expirado')
                                    ? Icons.lock
                                    : Icons.play_arrow,
                            size: 14,
                            color: statusColor,
                          ),
                          SizedBox(width: 4),
                          Text(
                            statusText,
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Botão de ação - CORRIGIDO: Mostrar para formandos sempre que puderem iniciar
          if (canStart && isFormando)
            Container(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    print(
                        '🎯 Botão de iniciar quiz pressionado: ${quiz['titulo']}');
                    _showQuizDialog(quiz);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.play_arrow, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Iniciar Quiz',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Debug widget para mostrar informações do quiz
          if (canStart && !isFormando)
            Container(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange[200]!),
                ),
                child: Text(
                  'Apenas formandos podem fazer quizzes',
                  style: TextStyle(
                    color: Colors.orange[700],
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _iniciarQuiz(Map<String, dynamic> quiz) {
    final quizId = quiz['id_quiz']?.toString();

    if (quizId == null) {
      print('❌ ID do quiz não encontrado');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro: ID do quiz não encontrado'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    print('🎯 Navegando para quiz: $quizId');

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QuizScreen(
          quizId: quizId,
          cursoId: widget.cursoId,
        ),
      ),
    ).then((result) {
      print('🔄 Voltou da tela do quiz, recarregando dados...');
      _fetchQuizzes();
    });
  }

  void _showQuizDialog(Map<String, dynamic> quiz) {
    print('📋 Mostrando diálogo do quiz: ${quiz['titulo']}');

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(Icons.quiz, color: Colors.blue),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Iniciar Quiz',
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                quiz['titulo'] ?? 'Quiz',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              if (quiz['descricao'] != null &&
                  quiz['descricao'].isNotEmpty) ...[
                SizedBox(height: 8),
                Text(
                  quiz['descricao'],
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
              SizedBox(height: 16),
              if (quiz['perguntas']?.length != null &&
                  quiz['perguntas'].length > 0)
                Row(
                  children: [
                    Icon(Icons.help_outline, size: 16, color: Colors.grey[600]),
                    SizedBox(width: 4),
                    Text('${quiz['perguntas'].length} perguntas'),
                  ],
                ),
              if (quiz['tempo_limite'] != null && quiz['tempo_limite'] > 0) ...[
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.timer, size: 16, color: Colors.grey[600]),
                    SizedBox(width: 4),
                    Text('Tempo limite: ${quiz['tempo_limite']} minutos'),
                  ],
                ),
              ],
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ao iniciar, você será direcionado para a tela do quiz.',
                        style: TextStyle(
                          color: Colors.blue[700],
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                print('❌ Cancelando diálogo do quiz');
                Navigator.of(context).pop();
              },
              child: Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                print('✅ Confirmando iniciar quiz');
                Navigator.of(context).pop();
                _iniciarQuiz(quiz);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text('Iniciar'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSubmissoesSection() {
    if (loadingTopicos) {
      return Container(
        padding: EdgeInsets.all(32),
        child: Center(
          child: Column(
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'A carregar avaliações...',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      );
    }

    if (topicoAvaliacao == null) {
      return Container(
        margin: EdgeInsets.all(16),
        padding: EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Column(
          children: [
            Icon(
              Icons.folder_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'Nenhum tópico de avaliação criado',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'O formador ainda não criou nenhum tópico de avaliação para este curso.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    final pastas = topicoAvaliacao!['pastas'] as List? ?? [];

    if (pastas.isEmpty) {
      return Container(
        margin: EdgeInsets.all(16),
        padding: EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Column(
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'Sem avaliações disponíveis',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Não há pastas de avaliação no tópico.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Header da seção
        Container(
          margin: EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.orange[50],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.assignment, color: Colors.orange[700], size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Avaliações do Curso',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange[700],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Lista de pastas
        ...pastas.map<Widget>((pasta) => _buildPastaItem(pasta)).toList(),

        SizedBox(height: 16),
      ],
    );
  }

  Widget _buildPastaItem(Map<String, dynamic> pasta) {
    final pastaId = pasta['id_pasta'] as int;
    final isExpanded = expandedPastas.contains(pastaId);
    final dataLimite = pasta['data_limite'];
    final isExpirada = _isDataLimiteExpirada(dataLimite);

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isExpirada ? Colors.red[200]! : Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header da pasta
          InkWell(
            onTap: () {
              setState(() {
                if (isExpanded) {
                  expandedPastas.remove(pastaId);
                } else {
                  expandedPastas.add(pastaId);
                  _fetchSubmissoesDaPasta(pastaId);
                }
              });
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(
                        isExpanded
                            ? Icons.keyboard_arrow_down
                            : Icons.keyboard_arrow_right,
                        color: Colors.grey[600],
                        size: 24,
                      ),
                      SizedBox(width: 8),
                      Icon(
                        Icons.folder,
                        color: isExpirada ? Colors.red : Colors.orange,
                        size: 24,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          pasta['nome'] ?? 'Pasta sem nome',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: Colors.grey[800],
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (dataLimite != null) ...[
                    SizedBox(height: 12),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isExpirada ? Colors.red[50] : Colors.orange[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isExpirada
                              ? Colors.red[200]!
                              : Colors.orange[200]!,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isExpirada ? Icons.warning : Icons.schedule,
                            size: 16,
                            color: isExpirada
                                ? Colors.red[700]
                                : Colors.orange[700],
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isExpirada
                                  ? 'Prazo expirado em ${_formatDate(dataLimite)}'
                                  : 'Prazo: ${_formatDate(dataLimite)}',
                              style: TextStyle(
                                fontSize: 14,
                                color: isExpirada
                                    ? Colors.red[700]
                                    : Colors.orange[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Conteúdo expandido
          if (isExpanded) ...[
            Divider(height: 1, color: Colors.grey[200]),
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Conteúdos da pasta
                  _buildConteudosSection(pasta),

                  SizedBox(height: 16),

                  // Submissões baseadas no tipo de utilizador
                  if (!isFormador)
                    _buildMinhasSubmissoesSection(pastaId)
                  else
                    _buildSubmissoesFormandosSection(pastaId),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConteudosSection(Map<String, dynamic> pasta) {
    final conteudos = pasta['conteudos'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.description, size: 16, color: Colors.blue[700]),
            SizedBox(width: 8),
            Text(
              'Materiais de Apoio',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: Colors.blue[700],
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        if (conteudos.isEmpty)
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.grey[400], size: 16),
                SizedBox(width: 8),
                Text(
                  'Sem materiais disponíveis',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
              ],
            ),
          )
        else
          ...conteudos
              .map<Widget>((conteudo) => Container(
                    margin: EdgeInsets.only(bottom: 8),
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue[100]!),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          conteudo['tipo'] == 'video'
                              ? Icons.video_file
                              : Icons.description,
                          size: 20,
                          color: Colors.blue[700],
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            conteudo['titulo'] ??
                                conteudo['arquivo_path']?.split('/').last ??
                                'Ficheiro sem nome',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Visualização de conteúdo em desenvolvimento'),
                                backgroundColor: Colors.blue,
                              ),
                            );
                          },
                          icon: Icon(Icons.open_in_new,
                              size: 16, color: Colors.blue[700]),
                        ),
                      ],
                    ),
                  ))
              .toList(),
      ],
    );
  }

  Widget _buildMinhasSubmissoesSection(int pastaId) {
    final minhasSubmissoes = submissoes[pastaId] ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.upload_file, size: 16, color: Colors.green[700]),
            SizedBox(width: 8),
            Text(
              'Minhas Submissões',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: Colors.green[700],
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        if (minhasSubmissoes.isEmpty)
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.amber[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.amber[200]!),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(Icons.upload_file, color: Colors.amber[700], size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Nenhuma submissão enviada',
                      style: TextStyle(
                        color: Colors.amber[700],
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Text(
                  'Envie seus trabalhos através da plataforma web.',
                  style: TextStyle(
                    color: Colors.amber[600],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          )
        else
          ...minhasSubmissoes
              .map<Widget>(
                  (submissao) => _buildSubmissaoItem(submissao, pastaId))
              .toList(),
      ],
    );
  }

  Widget _buildSubmissoesFormandosSection(int pastaId) {
    final submissoesFormandos = submissoes[pastaId] ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.group, size: 16, color: Colors.purple[700]),
            SizedBox(width: 8),
            Text(
              'Submissões dos Formandos',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: Colors.purple[700],
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        if (submissoesFormandos.isEmpty)
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.grey[400], size: 16),
                SizedBox(width: 8),
                Text(
                  'Nenhuma submissão recebida',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
              ],
            ),
          )
        else
          ...submissoesFormandos
              .map<Widget>((submissao) =>
                  _buildSubmissaoFormandoItem(submissao, pastaId))
              .toList(),
      ],
    );
  }

  Widget _buildSubmissaoItem(Map<String, dynamic> submissao, int pastaId) {
    final pasta = topicoAvaliacao?['pastas']?.firstWhere(
          (p) => p['id_pasta'] == pastaId,
          orElse: () => {},
        ) ??
        {};

    final atrasada = _isSubmissaoAtrasada(submissao, pasta);

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: atrasada ? Colors.red[50] : Colors.green[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: atrasada ? Colors.red[200]! : Colors.green[200]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: atrasada ? Colors.red[700] : Colors.green[700],
                size: 20,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  submissao['nome_ficheiro'] ??
                      submissao['ficheiro_path']?.split('/').last ??
                      'Ficheiro',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                    color: Colors.grey[800],
                  ),
                ),
              ),
              if (atrasada)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Atrasada',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          SizedBox(height: 8),
          Text(
            'Enviado em ${_formatDate(submissao['data_submissao'] ?? submissao['data_entrega'])}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmissaoFormandoItem(
      Map<String, dynamic> submissao, int pastaId) {
    final pasta = topicoAvaliacao?['pastas']?.firstWhere(
          (p) => p['id_pasta'] == pastaId,
          orElse: () => {},
        ) ??
        {};

    final atrasada = _isSubmissaoAtrasada(submissao, pasta);
    final nomeFormando = submissao['utilizador']?['nome'] ??
        submissao['nome_formando'] ??
        'Formando';

    return Container(
      margin: EdgeInsets.only(bottom: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border:
            Border.all(color: atrasada ? Colors.red[200]! : Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.blue[100],
                child: Text(
                  nomeFormando.substring(0, 1).toUpperCase(),
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nomeFormando,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: Colors.grey[800],
                      ),
                    ),
                    Text(
                      _formatDate(submissao['data_submissao'] ??
                          submissao['data_entrega']),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              if (atrasada)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Atrasada',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              SizedBox(width: 8),
              IconButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content:
                          Text('Visualização de submissão em desenvolvimento'),
                      backgroundColor: Colors.blue,
                    ),
                  );
                },
                icon: Icon(Icons.visibility, size: 20, color: Colors.blue),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Container(
        padding: EdgeInsets.all(24),
        margin: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red[200]!),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              color: Colors.red[700],
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Erro ao Carregar',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red[700],
              ),
            ),
            SizedBox(height: 8),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.red[600],
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeData,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                foregroundColor: Colors.white,
              ),
              child: Text('Tentar Novamente'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (error != null) {
      return _buildErrorWidget();
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          // Conteúdo baseado no tipo de curso
          if (isCursoAssincrono)
            _buildQuizzesSection()
          else
            _buildSubmissoesSection(),
        ],
      ),
    );
  }
}
