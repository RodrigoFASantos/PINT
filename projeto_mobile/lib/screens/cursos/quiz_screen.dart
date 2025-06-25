import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../../services/api_service.dart';

class QuizScreen extends StatefulWidget {
  final String quizId;
  final String? cursoId;

  const QuizScreen({
    Key? key,
    required this.quizId,
    this.cursoId,
  }) : super(key: key);

  @override
  _QuizScreenState createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final ApiService _apiService = ApiService();

  // Estados do quiz
  Map<String, dynamic>? quiz;
  Map<int, List<int>> respostas = {};
  bool loading = true;
  bool enviando = false;
  Map<String, dynamic>? resultado;
  int? tempoRestante;
  bool quizIniciado = false;
  String? idResposta;
  String? error;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    print('🎯 Inicializando QuizScreen para quiz: ${widget.quizId}');
    _fetchQuizDetails();
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchQuizDetails() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      print('🎯 Buscando detalhes do quiz: ${widget.quizId}');

      final response =
          await _apiService.get('/quiz/${widget.quizId}?formato=quiz');

      print('📡 Status resposta quiz: ${response.statusCode}');
      print('📄 Corpo resposta quiz: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // Verificar estrutura da resposta
        Map<String, dynamic> quizData = data;
        if (data['data'] != null) {
          quizData = data['data'];
        }

        setState(() {
          quiz = quizData;
          loading = false;
        });

        // Inicializar respostas
        if (quizData['perguntas'] != null) {
          final respostasIniciais = <int, List<int>>{};
          for (var pergunta in quizData['perguntas']) {
            respostasIniciais[pergunta['id']] = [];
          }
          setState(() {
            respostas = respostasIniciais;
          });
          print(
              '✅ Respostas inicializadas para ${quizData['perguntas'].length} perguntas');
        }

        print('✅ Quiz carregado: ${quizData['titulo']}');
      } else if (response.statusCode == 400) {
        // Quiz expirado ou outro erro específico
        final data = json.decode(response.body);
        setState(() {
          error = data['message'] ?? 'Quiz não disponível';
          loading = false;
        });
      } else {
        setState(() {
          error = 'Erro ao carregar quiz (${response.statusCode})';
          loading = false;
        });
      }
    } catch (e) {
      print('❌ Erro ao carregar quiz: $e');
      setState(() {
        error = 'Não foi possível carregar o quiz. Tente novamente.';
        loading = false;
      });
    }
  }

  Future<void> _iniciarQuiz() async {
    try {
      print('🎯 Iniciando quiz: ${widget.quizId}');

      final response = await _apiService.post('/quiz/${widget.quizId}/iniciar');

      print('📡 Status iniciar quiz: ${response.statusCode}');
      print('📄 Corpo resposta iniciar: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        Map<String, dynamic> responseData = data;
        if (data['data'] != null) {
          responseData = data['data'];
        }

        setState(() {
          idResposta = responseData['id_resposta']?.toString();
          quizIniciado = true;
        });

        // Iniciar temporizador se houver tempo limite
        if (quiz!['tempo_limite'] != null) {
          _iniciarTemporizador(quiz!['tempo_limite']);
        }

        print('✅ Quiz iniciado com sucesso, ID resposta: $idResposta');
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao iniciar quiz');
      }
    } catch (e) {
      print('❌ Erro ao iniciar quiz: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao iniciar quiz: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _iniciarTemporizador(int minutos) {
    setState(() {
      tempoRestante = minutos * 60; // Converter para segundos
    });

    print(
        '⏰ Iniciando temporizador: $minutos minutos (${tempoRestante} segundos)');

    timer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        if (tempoRestante! > 0) {
          tempoRestante = tempoRestante! - 1;
        } else {
          timer.cancel();
          print('⏰ Tempo esgotado, submetendo automaticamente');
          _submeterQuiz(); // Submeter automaticamente quando o tempo acabar
        }
      });
    });
  }

  String _formatarTempo(int segundos) {
    final minutos = segundos ~/ 60;
    final secs = segundos % 60;
    return '${minutos.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _handleRespostaChange(int perguntaId, int opcaoIndex, bool checked) {
    setState(() {
      if (checked) {
        // Adicionar se não estiver selecionado
        if (!respostas[perguntaId]!.contains(opcaoIndex)) {
          respostas[perguntaId]!.add(opcaoIndex);
        }
      } else {
        // Remover se estiver selecionado
        respostas[perguntaId]!.remove(opcaoIndex);
      }
    });

    print(
        '📝 Resposta atualizada - Pergunta $perguntaId: ${respostas[perguntaId]}');
  }

  bool _validarRespostas() {
    // Verificar se todas as perguntas têm pelo menos uma resposta
    for (var perguntaId in respostas.keys) {
      if (respostas[perguntaId]!.isEmpty) {
        return false;
      }
    }
    return true;
  }

  Future<void> _submeterQuiz() async {
    if (enviando) return;

    // Validar se todas as perguntas foram respondidas
    if (!_validarRespostas()) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Atenção'),
          content: Text(
              'Por favor, responda a todas as perguntas antes de submeter o quiz.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    setState(() {
      enviando = true;
    });

    try {
      timer?.cancel(); // Parar o temporizador

      print('🎯 Submetendo quiz: ${widget.quizId}');
      print('📝 Respostas originais: $respostas');

      // Converter chaves de int para String para serialização JSON
      final respostasParaEnvio = <String, List<int>>{};
      respostas.forEach((perguntaId, opcoesSelecionadas) {
        respostasParaEnvio[perguntaId.toString()] = opcoesSelecionadas;
      });

      print('📝 Respostas convertidas: $respostasParaEnvio');

      final response = await _apiService.post(
        '/quiz/${widget.quizId}/submeter',
        body: {'respostas': respostasParaEnvio},
      );

      print('📡 Status submeter quiz: ${response.statusCode}');
      print('📄 Corpo resposta submeter: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        Map<String, dynamic> resultadoData = data;
        if (data['data'] != null) {
          resultadoData = data['data'];
        }

        setState(() {
          resultado = resultadoData;
          enviando = false;
        });

        print('✅ Quiz submetido com sucesso');
        print('📊 Resultado: ${resultadoData['nota']}/10');
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao submeter quiz');
      }
    } catch (e) {
      print('❌ Erro ao submeter quiz: $e');
      setState(() {
        enviando = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao submeter quiz: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _voltarAoCurso() {
    if (widget.cursoId != null) {
      Navigator.pushReplacementNamed(
        context,
        '/curso',
        arguments: widget.cursoId,
      );
    } else {
      Navigator.pop(context);
    }
  }

  Widget _buildIntroducao() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Título
          Text(
            quiz!['titulo'] ?? 'Quiz',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),

          SizedBox(height: 16),

          // Descrição
          if (quiz!['descricao'] != null && quiz!['descricao'].isNotEmpty)
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Text(
                quiz!['descricao'],
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
            ),

          SizedBox(height: 24),

          // Informações do quiz
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
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
                Text(
                  'Informações do Quiz',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                SizedBox(height: 16),
                _buildInfoItem(
                  'Total de perguntas',
                  '${quiz!['perguntas']?.length ?? 0}',
                  Icons.quiz,
                ),
                if (quiz!['tempo_limite'] != null)
                  _buildInfoItem(
                    'Tempo limite',
                    '${quiz!['tempo_limite']} minutos',
                    Icons.timer,
                  ),
                _buildInfoItem(
                  'Curso',
                  quiz!['curso']?['nome'] ?? 'Curso não especificado',
                  Icons.school,
                ),
              ],
            ),
          ),

          SizedBox(height: 24),

          // Instruções
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info, color: Colors.orange[700], size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Instruções',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange[700],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12),
                ...[
                  'Leia atentamente cada pergunta antes de responder.',
                  'Pode selecionar múltiplas respostas para cada pergunta.',
                  'Responda todas as perguntas antes de enviar.',
                  if (quiz!['tempo_limite'] != null)
                    'Você terá ${quiz!['tempo_limite']} minutos para completar o quiz.',
                  'Após iniciar, não será possível pausar o quiz.',
                ].map((instrucao) => Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('• ',
                              style: TextStyle(
                                  color: Colors.orange[700], fontSize: 16)),
                          Expanded(
                            child: Text(
                              instrucao,
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),

          SizedBox(height: 32),

          // Botão Iniciar
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _iniciarQuiz,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.play_arrow, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    'Iniciar Quiz',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value, IconData icon) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          SizedBox(width: 12),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizEmAndamento() {
    return Column(
      children: [
        // Header com timer
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 1,
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  quiz!['titulo'] ?? 'Quiz',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
              ),
              if (tempoRestante != null) ...[
                SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Tempo restante:',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      _formatarTempo(tempoRestante!),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: tempoRestante! < 60 ? Colors.red : Colors.orange,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),

        // Lista de perguntas
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.all(16),
            itemCount: quiz!['perguntas']?.length ?? 0,
            itemBuilder: (context, index) {
              final pergunta = quiz!['perguntas'][index];
              return _buildPerguntaCard(pergunta, index);
            },
          ),
        ),

        // Botão de submeter
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 1,
                blurRadius: 4,
                offset: Offset(0, -2),
              ),
            ],
          ),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: enviando ? null : _submeterQuiz,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: enviando
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        SizedBox(width: 12),
                        Text(
                          'A enviar...',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    )
                  : Text(
                      'Finalizar Quiz',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPerguntaCard(Map<String, dynamic> pergunta, int index) {
    final perguntaId = pergunta['id'];
    final opcoesSelecionadas = respostas[perguntaId] ?? [];

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
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
          // Header da pergunta
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pergunta ${index + 1}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${pergunta['pontos'] ?? 4} pontos',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.orange[700],
                  ),
                ),
              ),
            ],
          ),

          SizedBox(height: 8),

          // Indicador de múltiplas respostas
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Pode selecionar múltiplas respostas',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Colors.green[700],
              ),
            ),
          ),

          SizedBox(height: 12),

          // Texto da pergunta
          Text(
            pergunta['texto'] ?? '',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[800],
              height: 1.4,
            ),
          ),

          SizedBox(height: 16),

          // Opções
          ...List.generate(
            pergunta['opcoes']?.length ?? 0,
            (opcaoIndex) {
              final opcao = pergunta['opcoes'][opcaoIndex];
              final isSelected = opcoesSelecionadas.contains(opcaoIndex);

              return Container(
                margin: EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: () => _handleRespostaChange(
                      perguntaId, opcaoIndex, !isSelected),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.blue[50] : Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? Colors.blue : Colors.grey[300]!,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.blue : Colors.white,
                            border: Border.all(
                              color:
                                  isSelected ? Colors.blue : Colors.grey[400]!,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: isSelected
                              ? Icon(
                                  Icons.check,
                                  size: 14,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            opcao ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[800],
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildResultado() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do resultado
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.blue[400]!, Colors.blue[600]!],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  'Resultado do Quiz',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  quiz!['titulo'] ?? 'Quiz',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'Sua nota: ${resultado!['nota'] ?? 0}/10',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: 20),

          // Estatísticas
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Pontos',
                  '${resultado!['pontos_obtidos'] ?? 0}/${resultado!['pontos_totais'] ?? 0}',
                  Icons.stars,
                  Colors.orange,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Percentagem',
                  '${resultado!['percentagem'] ?? 0}%',
                  Icons.percent,
                  Colors.green,
                ),
              ),
            ],
          ),

          SizedBox(height: 20),

          // Feedback
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: (resultado!['percentagem'] ?? 0) >= 70
                  ? Colors.green[50]
                  : Colors.red[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: (resultado!['percentagem'] ?? 0) >= 70
                    ? Colors.green[200]!
                    : Colors.red[200]!,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  (resultado!['percentagem'] ?? 0) >= 70
                      ? Icons.check_circle
                      : Icons.cancel,
                  color: (resultado!['percentagem'] ?? 0) >= 70
                      ? Colors.green[700]
                      : Colors.red[700],
                  size: 24,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    (resultado!['percentagem'] ?? 0) >= 70
                        ? 'Parabéns! Obteve uma classificação satisfatória.'
                        : 'Precisa melhorar. Estude mais os conteúdos do curso.',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: (resultado!['percentagem'] ?? 0) >= 70
                          ? Colors.green[700]
                          : Colors.red[700],
                    ),
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: 24),

          // Botão voltar ao curso
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _voltarAoCurso,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    'Voltar ao Curso',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
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
        children: [
          Icon(icon, color: color, size: 24),
          SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Quiz'),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            if (quizIniciado && resultado == null) {
              // Mostrar confirmação se o quiz estiver em andamento
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text('Sair do Quiz'),
                  content: Text(
                      'Tem certeza que deseja sair? Seu progresso será perdido.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Cancelar'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      child: Text('Sair'),
                    ),
                  ],
                ),
              );
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: loading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    valueColor:
                        AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
                  ),
                  SizedBox(height: 16),
                  Text('A carregar quiz...'),
                ],
              ),
            )
          : error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red,
                      ),
                      SizedBox(height: 16),
                      Text(
                        error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.red),
                      ),
                      SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchQuizDetails,
                        child: Text('Tentar Novamente'),
                      ),
                    ],
                  ),
                )
              : quiz == null
                  ? Center(child: Text('Quiz não encontrado'))
                  : resultado != null
                      ? _buildResultado()
                      : quizIniciado
                          ? _buildQuizEmAndamento()
                          : _buildIntroducao(),
    );
  }
}
