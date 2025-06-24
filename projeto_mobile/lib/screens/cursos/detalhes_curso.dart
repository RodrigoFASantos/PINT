import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../services/api_service.dart';
import '../../widgets/network_image_widget.dart';

class DetalhesCurso extends StatefulWidget {
  final String cursoId;
  final Map<String, dynamic> curso;
  final bool inscrito;
  final int? userRole;
  final bool mostrarDetalhes;
  final Function(bool)? onInscricaoChanged;

  const DetalhesCurso({
    Key? key,
    required this.cursoId,
    required this.curso,
    required this.inscrito,
    this.userRole,
    required this.mostrarDetalhes,
    this.onInscricaoChanged,
  }) : super(key: key);

  @override
  _DetalhesCursoState createState() => _DetalhesCursoState();
}

class _DetalhesCursoState extends State<DetalhesCurso> {
  bool _isLoading = false;
  Map<String, dynamic>? formadorData;
  Map<String, dynamic>? categoriaData;
  Map<String, dynamic>? areaData;
  Map<String, dynamic>? topicoAreaData;
  List<Map<String, dynamic>> topicos = [];

  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    print('=== DETALHES CURSO INICIADO ===');
    print('Curso ID: ${widget.cursoId}');
    print('ID da área: ${widget.curso['id_area']}');
    print('ID da categoria: ${widget.curso['id_categoria']}');
    print('ID do formador: ${widget.curso['id_formador']}');
    print('ID do tópico área: ${widget.curso['id_topico_area']}');
    print('===========================');
    _loadAdditionalData();
  }

  Future<void> _loadAdditionalData() async {
    print('🔄 Iniciando carregamento de dados adicionais...');

    try {
      // Carregar dados do formador
      await _loadFormadorData();

      // Carregar dados da categoria
      await _loadCategoriaData();

      // Carregar dados da área
      await _loadAreaData();

      // Carregar dados do tópico de área
      await _loadTopicoAreaData();

      // Carregar tópicos do curso
      await _loadTopicosData();

      if (mounted) {
        setState(() {
          print('✅ Todos os dados carregados e UI atualizada');
        });
      }
    } catch (e) {
      print('❌ Erro geral ao carregar dados: $e');
      if (mounted) {
        setState(() {});
      }
    }
  }

  Future<void> _loadFormadorData() async {
    if (widget.curso['id_formador'] != null) {
      try {
        print('👨‍🏫 Carregando formador ID: ${widget.curso['id_formador']}');
        final response =
            await _apiService.get('/users/${widget.curso['id_formador']}');
        if (response.statusCode == 200) {
          formadorData = json.decode(response.body);
          print('✅ Formador carregado: ${formadorData?['nome']}');
        } else {
          print('❌ Erro ao carregar formador: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ Exceção ao carregar formador: $e');
      }
    }
  }

  Future<void> _loadCategoriaData() async {
    if (widget.curso['id_categoria'] != null) {
      try {
        print('📂 Carregando categoria ID: ${widget.curso['id_categoria']}');
        final response = await _apiService
            .get('/categorias/${widget.curso['id_categoria']}');
        if (response.statusCode == 200) {
          categoriaData = json.decode(response.body);
          print('✅ Categoria carregada: ${categoriaData?['nome']}');
        } else {
          print('❌ Erro ao carregar categoria: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ Exceção ao carregar categoria: $e');
      }
    }
  }

  Future<void> _loadAreaData() async {
    if (widget.curso['id_area'] != null) {
      try {
        print('🎯 Carregando área ID: ${widget.curso['id_area']}');
        final response =
            await _apiService.get('/areas/${widget.curso['id_area']}');
        print('📡 Status da resposta da área: ${response.statusCode}');
        print('📡 Body da resposta da área: ${response.body}');

        if (response.statusCode == 200) {
          areaData = json.decode(response.body);
          print('✅ Área carregada: ${areaData?['nome']}');
        } else {
          print('❌ Erro ao carregar área: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ Exceção ao carregar área: $e');
      }
    } else {
      print('⚠️ ID da área não encontrado no curso');
    }
  }

  Future<void> _loadTopicoAreaData() async {
    if (widget.curso['id_topico_area'] != null) {
      try {
        print(
            '🏷️ Carregando tópico de área ID: ${widget.curso['id_topico_area']}');
        final response = await _apiService
            .get('/cursos/topico-area/${widget.curso['id_topico_area']}');
        if (response.statusCode == 200) {
          topicoAreaData = json.decode(response.body);
          print('✅ Tópico de área carregado: ${topicoAreaData?['titulo']}');
        } else {
          print('❌ Erro ao carregar tópico de área: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ Exceção ao carregar tópico de área: $e');
      }
    }
  }

  Future<void> _loadTopicosData() async {
    try {
      print('📚 Carregando tópicos do curso...');
      final response =
          await _apiService.get('/cursos/${widget.cursoId}/topicos');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          topicos = data.cast<Map<String, dynamic>>();
          print('✅ ${topicos.length} tópicos carregados');
        }
      } else {
        print('❌ Erro ao carregar tópicos: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Exceção ao carregar tópicos: $e');
    }
  }

  Future<void> _handleInscricao() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      http.Response response;

      if (widget.inscrito) {
        // Cancelar inscrição - primeiro precisamos obter o ID da inscrição
        print('🔄 Procurando ID da inscrição para cancelar...');
        final verificacaoResponse =
            await _apiService.get('/inscricoes/verificar/${widget.cursoId}');

        if (verificacaoResponse.statusCode == 200) {
          final verificacaoData = json.decode(verificacaoResponse.body);
          if (verificacaoData['inscricao'] != null &&
              verificacaoData['inscricao']['id'] != null) {
            final inscricaoId = verificacaoData['inscricao']['id'];
            print('📝 ID da inscrição encontrado: $inscricaoId');

            // Cancelar usando o ID correto
            response = await _apiService.patch(
                '/inscricoes/cancelar-inscricao/$inscricaoId',
                body: {'motivo_cancelamento': 'Cancelamento pelo utilizador'});
          } else {
            throw Exception('ID da inscrição não encontrado');
          }
        } else {
          throw Exception('Erro ao verificar inscrição');
        }
      } else {
        // Inscrever - usar a rota correta com dados no body
        print('📝 Criando nova inscrição...');

        // Obter o utilizador atual para extrair o ID
        final userResponse = await _apiService.get('/users/perfil');
        if (userResponse.statusCode != 200) {
          throw Exception('Erro ao obter dados do utilizador');
        }

        final userData = json.decode(userResponse.body);
        final userId = userData['id_utilizador'];

        print('👤 ID do utilizador: $userId');
        print('📚 ID do curso: ${widget.cursoId}');

        // Criar inscrição com a rota e dados corretos
        response = await _apiService.post('/inscricoes', body: {
          'id_utilizador': userId,
          'id_curso': int.parse(widget.cursoId),
        });
      }

      print('📡 Status da resposta: ${response.statusCode}');
      print('📡 Body da resposta: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final newState = !widget.inscrito;
        widget.onInscricaoChanged?.call(newState);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                newState
                    ? 'Inscrito com sucesso!'
                    : 'Inscrição cancelada com sucesso!',
              ),
              backgroundColor: newState ? Colors.green : Colors.orange,
            ),
          );
        }
      } else {
        // Tentar extrair mensagem de erro da resposta
        String errorMessage = 'Erro ao processar inscrição';
        try {
          final errorData = json.decode(response.body);
          errorMessage = errorData['message'] ?? errorMessage;
        } catch (e) {
          print('❌ Erro ao fazer parse da resposta de erro: $e');
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('❌ Erro ao processar inscrição: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao processar inscrição: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
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

  // Função para formatar o estado do curso para exibição
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

  // Função para obter a cor do estado do curso
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

  bool _canEnroll() {
    if (widget.inscrito) return true;

    try {
      final now = DateTime.now();
      final dataFim = DateTime.parse(widget.curso['data_fim']);

      if (dataFim.isBefore(now)) return false;

      if (widget.curso['tipo'] == 'sincrono') {
        final vagas = widget.curso['vagas'] ?? 0;
        final inscritos = widget.curso['total_inscritos'] ?? 0;
        return inscritos < vagas;
      }

      return true;
    } catch (e) {
      print('❌ Erro ao verificar possibilidade de inscrição: $e');
      return false;
    }
  }

  String _getImageUrl() {
    final imagePath = widget.curso['imagem_path'] as String?;
    if (imagePath != null && imagePath.isNotEmpty) {
      return _apiService.getCursoImageUrl(imagePath);
    }

    final nomeCurso = widget.curso['nome'] as String?;
    if (nomeCurso != null && nomeCurso.isNotEmpty) {
      final nomeCursoSlug = nomeCurso
          .toLowerCase()
          .replaceAll(' ', '-')
          .replaceAll(RegExp(r'[^\w-]+'), '');
      return _apiService.getCursoCapaUrl(nomeCursoSlug);
    }

    final dirPath = widget.curso['dir_path'] as String?;
    if (dirPath != null && dirPath.isNotEmpty) {
      return _apiService.getCursoImageUrl('$dirPath/capa.png');
    }

    return _apiService.getCursoImageUrl(null);
  }

  Widget _buildCursoHeader() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 8), // Reduzido
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
        children: [
          // Header com imagem apenas quando NÃO expandido
          if (!widget.mostrarDetalhes)
            Container(
              height: 160, // Reduzido de 200 para 160
              decoration: BoxDecoration(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
                child: CursoImage(
                  imageUrl: _getImageUrl(),
                  fallbackUrl: _apiService.getCursoImageUrl(null),
                  width: double.infinity,
                  height: 160, // Ajustado
                  fit: BoxFit.cover,
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      Colors.blue.withOpacity(0.8),
                      Colors.blue.withOpacity(0.6),
                    ],
                  ),
                  cursoNome: widget.curso['nome'],
                  showLoadingText: false,
                ),
              ),
            ),

          // Detalhes expandidos
          if (widget.mostrarDetalhes) _buildDetalhesExpandidos(),
        ],
      ),
    );
  }

  Widget _buildDetalhesExpandidos() {
    return Container(
      padding: EdgeInsets.all(16), // Reduzido de 20 para 16
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Primeira linha: Formador, Vagas, Duração
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.person,
                  'Formador',
                  formadorData?['nome'] ?? 'Carregando...',
                  formadorData?['email'] ?? '',
                ),
              ),
              SizedBox(width: 8), // Reduzido
              Expanded(
                child: _buildInfoCard(
                  Icons.people,
                  'Vagas',
                  widget.curso['tipo'] == 'sincrono' &&
                          widget.curso['vagas'] != null
                      ? '${widget.curso['vagas']}'
                      : 'Sem limite',
                  widget.curso['tipo'] == 'sincrono'
                      ? 'Síncrono'
                      : 'Assíncrono',
                ),
              ),
              SizedBox(width: 8), // Reduzido
              Expanded(
                child: _buildInfoCard(
                  Icons.schedule,
                  'Duração',
                  '${widget.curso['duracao'] ?? 0}h',
                  '',
                ),
              ),
            ],
          ),
          SizedBox(height: 12), // Reduzido

          // Segunda linha: Categoria, Área, Tópico
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.category,
                  'Categoria',
                  categoriaData?['nome'] ?? 'Carregando...',
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  Icons.bookmark,
                  'Área',
                  areaData?['nome'] ?? 'Carregando...',
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  Icons.topic,
                  'Tópico',
                  topicoAreaData?['titulo'] ?? 'Carregando...',
                  '',
                ),
              ),
            ],
          ),
          SizedBox(height: 12),

          // Terceira linha: Datas
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.calendar_today,
                  'Início',
                  _formatDate(widget.curso['data_inicio']),
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  Icons.calendar_today,
                  'Fim',
                  _formatDate(widget.curso['data_fim']),
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(child: Container()), // Espaço vazio
            ],
          ),
          SizedBox(height: 12),

          // Descrição completa
          if (widget.curso['descricao'] != null &&
              widget.curso['descricao'].toString().isNotEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(12), // Reduzido de 16 para 12
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.description,
                          color: Colors.grey[600], size: 16),
                      SizedBox(width: 6), // Reduzido
                      Text(
                        'Descrição',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6), // Reduzido
                  Text(
                    widget.curso['descricao'].toString(),
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.4, // Reduzido de 1.5 para 1.4
                    ),
                    maxLines: 4, // Limitado para evitar muito texto
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          SizedBox(height: 16), // Reduzido

          // Botão de inscrição
          _buildActionButton(),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
      IconData icon, String label, String value, String subtitle) {
    return Container(
      padding: EdgeInsets.all(10), // Reduzido de 12 para 10
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.grey[600], size: 14), // Reduzido
              SizedBox(width: 4), // Reduzido
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11, // Reduzido
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 4), // Reduzido
          Text(
            value,
            style: TextStyle(
              fontSize: 13, // Reduzido
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (subtitle.isNotEmpty) ...[
            SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11, // Reduzido
                color: Colors.grey[600],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton() {
    final canEnroll = _canEnroll();

    try {
      final now = DateTime.now();
      final dataFim = DateTime.parse(widget.curso['data_fim']);
      final cursoTerminado = dataFim.isBefore(now);

      if (cursoTerminado && !widget.inscrito) {
        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(12), // Reduzido
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Row(
            children: [
              Icon(Icons.event_busy, color: Colors.grey, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Este curso já terminou',
                  style: TextStyle(
                    fontSize: 14, // Reduzido
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
        );
      }

      if (widget.curso['tipo'] == 'sincrono' &&
          !canEnroll &&
          !widget.inscrito) {
        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(12), // Reduzido
          decoration: BoxDecoration(
            color: Colors.orange[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.orange[200]!),
          ),
          child: Row(
            children: [
              Icon(Icons.people, color: Colors.orange, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Não há vagas disponíveis',
                  style: TextStyle(
                    fontSize: 14, // Reduzido
                    color: Colors.orange[700],
                  ),
                ),
              ),
            ],
          ),
        );
      }

      return SizedBox(
        width: double.infinity,
        height: 45, // Reduzido de 50 para 45
        child: ElevatedButton(
          onPressed: _isLoading ? null : _handleInscricao,
          style: ElevatedButton.styleFrom(
            backgroundColor: widget.inscrito ? Colors.red : Colors.green,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _isLoading
              ? SizedBox(
                  height: 18, // Reduzido
                  width: 18, // Reduzido
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      widget.inscrito ? Icons.cancel : Icons.add_circle,
                      color: Colors.white,
                      size: 20, // Reduzido
                    ),
                    SizedBox(width: 6), // Reduzido
                    Text(
                      widget.inscrito ? 'Cancelar Inscrição' : 'Inscrever-se',
                      style: TextStyle(
                        fontSize: 14, // Reduzido
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
        ),
      );
    } catch (e) {
      print('❌ Erro ao construir botão de ação: $e');
      return Container(
        width: double.infinity,
        padding: EdgeInsets.all(12), // Reduzido
        decoration: BoxDecoration(
          color: Colors.red[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.red[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.error, color: Colors.red, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Erro ao carregar informações do curso',
                style: TextStyle(
                  fontSize: 14, // Reduzido
                  color: Colors.red[700],
                ),
              ),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          physics: ClampingScrollPhysics(), // Melhora a performance do scroll
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight, // Garante altura mínima
            ),
            child: IntrinsicHeight(
              // Permite que o conteúdo se ajuste naturalmente
              child: Column(
                children: [
                  _buildCursoHeader(),
                  SizedBox(
                      height: 8), // Espaço extra no final para evitar overflow
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
