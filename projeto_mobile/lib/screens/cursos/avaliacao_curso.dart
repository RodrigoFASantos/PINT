import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../services/api_service.dart';

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
  List<Map<String, dynamic>> avaliacoes = [];
  Map<String, dynamic>? minhaAvaliacao;
  bool loading = true;
  String? error;
  bool _isSubmitting = false;

  // Dados para criar/editar avaliação
  int _rating = 0;
  final TextEditingController _comentarioController = TextEditingController();

  // Para quizzes (cursos assíncronos)
  List<Map<String, dynamic>> quizzes = [];
  bool loadingQuizzes = true;

  final ApiService _apiService = ApiService();

  bool get isCursoAssincrono => widget.tipoCurso == 'assincrono';
  bool get isFormador => widget.userRole == 1 || widget.userRole == 2;

  @override
  void initState() {
    super.initState();
    _fetchAvaliacoes();
    if (isCursoAssincrono) {
      _fetchQuizzes();
    }
  }

  @override
  void dispose() {
    _comentarioController.dispose();
    super.dispose();
  }

  Future<void> _fetchAvaliacoes() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      // Buscar todas as avaliações do curso
      final response =
          await _apiService.get('/avaliacoes/curso/${widget.cursoId}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        List<Map<String, dynamic>> todasAvaliacoes = [];
        Map<String, dynamic>? avaliacaoUsuario;

        if (data is List) {
          todasAvaliacoes = data.cast<Map<String, dynamic>>();
        } else if (data is Map) {
          if (data.containsKey('avaliacoes')) {
            todasAvaliacoes =
                (data['avaliacoes'] as List).cast<Map<String, dynamic>>();
          }
          if (data.containsKey('minhaAvaliacao')) {
            avaliacaoUsuario = data['minhaAvaliacao'];
          }
        }

        // Separar minha avaliação das outras
        if (avaliacaoUsuario == null) {
          // Procurar minha avaliação na lista
          for (var avaliacao in todasAvaliacoes) {
            if (avaliacao['minha_avaliacao'] == true) {
              avaliacaoUsuario = avaliacao;
              todasAvaliacoes.remove(avaliacao);
              break;
            }
          }
        }

        setState(() {
          avaliacoes = todasAvaliacoes;
          minhaAvaliacao = avaliacaoUsuario;

          // Se tenho uma avaliação, preencher os campos
          if (minhaAvaliacao != null) {
            _rating = minhaAvaliacao!['rating'] ?? 0;
            _comentarioController.text = minhaAvaliacao!['comentario'] ?? '';
          }

          loading = false;
        });
      } else {
        setState(() {
          error = 'Erro ao carregar avaliações';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error =
            'Não foi possível carregar as avaliações. Tente novamente mais tarde.';
        loading = false;
      });
    }
  }

  Future<void> _fetchQuizzes() async {
    try {
      setState(() {
        loadingQuizzes = true;
      });

      final response =
          await _apiService.get('/quizzes/curso/${widget.cursoId}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data is List) {
          setState(() {
            quizzes = data.cast<Map<String, dynamic>>();
            loadingQuizzes = false;
          });
        } else {
          setState(() {
            quizzes = [];
            loadingQuizzes = false;
          });
        }
      } else {
        setState(() {
          quizzes = [];
          loadingQuizzes = false;
        });
      }
    } catch (e) {
      setState(() {
        quizzes = [];
        loadingQuizzes = false;
      });
    }
  }

  Future<void> _submitAvaliacao() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Por favor, selecione uma classificação'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final body = {
        'rating': _rating,
        'comentario': _comentarioController.text.trim(),
      };

      final response = minhaAvaliacao == null
          ? await _apiService.post('/avaliacoes/curso/${widget.cursoId}',
              body: body)
          : await _apiService.put(
              '/avaliacoes/${minhaAvaliacao!['id_avaliacao']}',
              body: body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              minhaAvaliacao == null
                  ? 'Avaliação enviada com sucesso!'
                  : 'Avaliação atualizada com sucesso!',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Recarregar avaliações
        await _fetchAvaliacoes();
      } else {
        throw Exception('Erro na resposta do servidor');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao enviar avaliação. Tente novamente.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Widget _buildRatingStars({
    required int currentRating,
    required Function(int) onRatingChanged,
    bool interactive = true,
    double size = 32,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starIndex = index + 1;
        return GestureDetector(
          onTap: interactive ? () => onRatingChanged(starIndex) : null,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 2),
            child: Icon(
              starIndex <= currentRating ? Icons.star : Icons.star_border,
              color: starIndex <= currentRating ? Colors.amber : Colors.grey,
              size: size,
            ),
          ),
        );
      }),
    );
  }

  Widget _buildQuizzesSection() {
    if (!isCursoAssincrono) return SizedBox.shrink();

    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(16),
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
          Row(
            children: [
              Icon(Icons.quiz, color: Colors.blue),
              SizedBox(width: 8),
              Text(
                'Quizzes de Avaliação',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          if (loadingQuizzes)
            Center(child: CircularProgressIndicator())
          else if (quizzes.isEmpty)
            Container(
              padding: EdgeInsets.all(24),
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
                    ),
                  ),
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
            Column(
              children: quizzes.map((quiz) => _buildQuizItem(quiz)).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildQuizItem(Map<String, dynamic> quiz) {
    final disponivel = quiz['disponivel'] ?? true;
    final concluido = quiz['concluido'] ?? false;
    final pontuacao = quiz['pontuacao'];

    return Card(
      margin: EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: concluido
                ? Colors.green
                : (disponivel ? Colors.blue : Colors.grey),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            concluido ? Icons.check : Icons.quiz,
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text(
          quiz['titulo'] ?? 'Quiz sem título',
          style: TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (quiz['descricao'] != null && quiz['descricao'].isNotEmpty)
              Text(quiz['descricao']),
            SizedBox(height: 4),
            Text(
              concluido
                  ? 'Concluído${pontuacao != null ? ' - Pontuação: $pontuacao' : ''}'
                  : disponivel
                      ? 'Disponível'
                      : 'Não disponível',
              style: TextStyle(
                color: concluido
                    ? Colors.green[700]
                    : (disponivel ? Colors.blue[700] : Colors.grey[600]),
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
        trailing: disponivel && !concluido
            ? Icon(Icons.play_arrow, color: Colors.blue)
            : concluido
                ? Icon(Icons.check_circle, color: Colors.green)
                : Icon(Icons.lock, color: Colors.grey),
        onTap: disponivel && !concluido
            ? () {
                // TODO: Navegar para o quiz
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Abrir quiz - Em desenvolvimento')),
                );
              }
            : null,
      ),
    );
  }

  Widget _buildMinhaAvaliacaoCard() {
    return Container(
      margin: EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                minhaAvaliacao == null ? 'Avaliar Curso' : 'Minha Avaliação',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),

              // Rating
              Text(
                'Classificação',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[700],
                ),
              ),
              SizedBox(height: 8),
              _buildRatingStars(
                currentRating: _rating,
                onRatingChanged: (rating) {
                  setState(() {
                    _rating = rating;
                  });
                },
              ),
              SizedBox(height: 16),

              // Comentário
              TextField(
                controller: _comentarioController,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: 'Comentário (opcional)',
                  hintText: 'Partilhe a sua opinião sobre o curso...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignLabelWithHint: true,
                ),
              ),
              SizedBox(height: 16),

              // Botão submeter
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitAvaliacao,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isSubmitting
                      ? SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send, color: Colors.white),
                            SizedBox(width: 8),
                            Text(
                              minhaAvaliacao == null
                                  ? 'Enviar Avaliação'
                                  : 'Atualizar Avaliação',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvaliacaoItem(Map<String, dynamic> avaliacao) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.blue[100],
                  child: Text(
                    (avaliacao['nome_usuario'] ?? 'U')[0].toUpperCase(),
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        avaliacao['nome_usuario'] ?? 'Usuário',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      SizedBox(height: 4),
                      _buildRatingStars(
                        currentRating: avaliacao['rating'] ?? 0,
                        onRatingChanged: (_) {},
                        interactive: false,
                        size: 16,
                      ),
                    ],
                  ),
                ),
                if (avaliacao['data_avaliacao'] != null)
                  Text(
                    _formatDate(avaliacao['data_avaliacao']),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
            if (avaliacao['comentario'] != null &&
                avaliacao['comentario'].isNotEmpty) ...[
              SizedBox(height: 12),
              Text(
                avaliacao['comentario'],
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.4,
                ),
              ),
            ],
          ],
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

  double _getMediaAvaliacoes() {
    if (avaliacoes.isEmpty) return 0;

    final soma = avaliacoes.fold<double>(
        0, (sum, avaliacao) => sum + (avaliacao['rating'] ?? 0));
    return soma / avaliacoes.length;
  }

  Widget _buildResumoAvaliacoes() {
    if (avaliacoes.isEmpty) return SizedBox.shrink();

    final media = _getMediaAvaliacoes();
    final totalAvaliacoes = avaliacoes.length;

    return Container(
      margin: EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              Text(
                'Resumo das Avaliações',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text(
                        media.toStringAsFixed(1),
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber[700],
                        ),
                      ),
                      _buildRatingStars(
                        currentRating: media.round(),
                        onRatingChanged: (_) {},
                        interactive: false,
                        size: 20,
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(
                        totalAvaliacoes.toString(),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[700],
                        ),
                      ),
                      Text(
                        totalAvaliacoes == 1 ? 'Avaliação' : 'Avaliações',
                        style: TextStyle(
                          fontSize: 14,
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
  }

  Widget _buildLoadingWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'A carregar avaliações...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
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
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.red[200]!),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              color: Colors.red,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.red[700],
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchAvaliacoes,
              child: Text('Tentar Novamente'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
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

    if (error != null) {
      return _buildErrorWidget();
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
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
              children: [
                Icon(Icons.star_outline, color: Colors.blue),
                SizedBox(width: 8),
                Text(
                  'Avaliação',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          // Seção de Quizzes (apenas para cursos assíncronos)
          if (isCursoAssincrono) _buildQuizzesSection(),

          // Separador visual (se houver quizzes)
          if (isCursoAssincrono)
            Container(
              height: 2,
              margin: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [Colors.grey[300]!, Colors.transparent],
                ),
              ),
            ),

          // Resumo das avaliações
          _buildResumoAvaliacoes(),

          // Minha avaliação
          _buildMinhaAvaliacaoCard(),

          // Lista de avaliações
          if (avaliacoes.isNotEmpty) ...[
            Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Todas as Avaliações',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            ...avaliacoes.map((avaliacao) => _buildAvaliacaoItem(avaliacao)),
            SizedBox(height: 16),
          ] else if (minhaAvaliacao == null) ...[
            Center(
              child: Container(
                padding: EdgeInsets.all(24),
                margin: EdgeInsets.all(16),
                child: Column(
                  children: [
                    Icon(
                      Icons.star_border,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Seja o primeiro a avaliar este curso!',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
