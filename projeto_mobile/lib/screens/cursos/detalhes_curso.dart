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
  bool _dadosCarregados = false;
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
    print('Mostrar detalhes: ${widget.mostrarDetalhes}');
    print('Curso data: ${widget.curso}');
    print('===========================');

    // Sempre carregar dados básicos
    _loadAdditionalData();
  }

  Future<void> _loadAdditionalData() async {
    if (_dadosCarregados) return;

    print('🔄 Iniciando carregamento de dados adicionais...');

    try {
      // Carregar dados em paralelo para ser mais rápido
      await Future.wait([
        _loadFormadorData(),
        _loadCategoriaData(),
        _loadAreaData(),
        _loadTopicoAreaData(),
        _loadTopicosData(),
      ]);

      if (mounted) {
        setState(() {
          _dadosCarregados = true;
          print('✅ Todos os dados carregados e UI atualizada');
        });
      }
    } catch (e) {
      print('❌ Erro geral ao carregar dados: $e');
      if (mounted) {
        setState(() {
          _dadosCarregados = true; // Marcar como carregado mesmo com erro
        });
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
          // Usar dados do curso se disponível
          if (widget.curso['formador'] != null) {
            formadorData = widget.curso['formador'];
          }
        }
      } catch (e) {
        print('❌ Exceção ao carregar formador: $e');
        // Fallback para dados do curso
        if (widget.curso['formador'] != null) {
          formadorData = widget.curso['formador'];
        }
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
          // Usar dados do curso se disponível
          if (widget.curso['categoria'] != null) {
            categoriaData = widget.curso['categoria'];
          }
        }
      } catch (e) {
        print('❌ Exceção ao carregar categoria: $e');
        // Fallback para dados do curso
        if (widget.curso['categoria'] != null) {
          categoriaData = widget.curso['categoria'];
        }
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

        if (response.statusCode == 200) {
          areaData = json.decode(response.body);
          print('✅ Área carregada: ${areaData?['nome']}');
        } else {
          print('❌ Erro ao carregar área: ${response.statusCode}');
          // Usar dados do curso se disponível
          if (widget.curso['area'] != null) {
            areaData = widget.curso['area'];
          }
        }
      } catch (e) {
        print('❌ Exceção ao carregar área: $e');
        // Fallback para dados do curso
        if (widget.curso['area'] != null) {
          areaData = widget.curso['area'];
        }
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
          // Fallback se disponível no curso
          if (widget.curso['Topico_Area'] != null) {
            topicoAreaData = widget.curso['Topico_Area'];
          }
        }
      } catch (e) {
        print('❌ Exceção ao carregar tópico de área: $e');
        // Fallback para dados do curso
        if (widget.curso['Topico_Area'] != null) {
          topicoAreaData = widget.curso['Topico_Area'];
        }
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
        // Usar dados do curso se disponível
        if (widget.curso['topicos'] != null) {
          topicos = List<Map<String, dynamic>>.from(widget.curso['topicos']);
        }
      }
    } catch (e) {
      print('❌ Exceção ao carregar tópicos: $e');
      // Fallback para dados do curso
      if (widget.curso['topicos'] != null) {
        topicos = List<Map<String, dynamic>>.from(widget.curso['topicos']);
      }
    }
  }

  // ✅ REMOVIDO COMPLETAMENTE: Toda a lógica de cancelar inscrição foi removida
  // Agora só permite INSCREVER (nunca cancelar)
  Future<void> _handleInscricao() async {
    if (_isLoading) return;

    // ✅ NOVO: Se já está inscrito, não fazer nada
    if (widget.inscrito) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Já está inscrito neste curso!'),
          backgroundColor: Colors.blue,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // ✅ APENAS INSCREVER (nunca cancelar)
      print('📝 Criando nova inscrição...');

      final userResponse = await _apiService.get('/users/perfil');
      if (userResponse.statusCode != 200) {
        throw Exception('Erro ao obter dados do utilizador');
      }

      final userData = json.decode(userResponse.body);
      final userId = userData['id_utilizador'];

      print('👤 ID do utilizador: $userId');
      print('📚 ID do curso: ${widget.cursoId}');

      final response = await _apiService.post('/inscricoes', body: {
        'id_utilizador': userId,
        'id_curso': int.parse(widget.cursoId),
      });

      print('📡 Status da resposta: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        // ✅ SUCESSO: Chamar callback para atualizar o estado
        widget.onInscricaoChanged?.call(true);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Inscrito com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
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

  bool _canEnroll() {
    if (widget.inscrito)
      return false; // ✅ Já inscrito, não pode inscrever novamente

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

  // Helper para obter dados com fallback
  String _getFormadorNome() {
    return formadorData?['nome'] ??
        widget.curso['formador']?['nome'] ??
        'Não definido';
  }

  String _getFormadorEmail() {
    return formadorData?['email'] ?? widget.curso['formador']?['email'] ?? '';
  }

  String _getCategoriaNome() {
    return categoriaData?['nome'] ??
        widget.curso['categoria']?['nome'] ??
        'Não definida';
  }

  String _getAreaNome() {
    return areaData?['nome'] ?? widget.curso['area']?['nome'] ?? 'Não definida';
  }

  String _getTopicoAreaTitulo() {
    return topicoAreaData?['titulo'] ??
        widget.curso['Topico_Area']?['titulo'] ??
        'Não definido';
  }

  Widget _buildInfoCard(
      IconData icon, String label, String value, String subtitle) {
    return Container(
      padding: EdgeInsets.all(12),
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
              Icon(icon, color: Colors.grey[600], size: 16),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
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
                fontSize: 11,
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

  // ✅ COMPLETAMENTE REFORMULADO: Botão sem opção de cancelar
  Widget _buildActionButton() {
    final canEnroll = _canEnroll();

    try {
      final now = DateTime.now();
      final dataFim = DateTime.parse(widget.curso['data_fim']);
      final cursoTerminado = dataFim.isBefore(now);

      // ✅ Se já está inscrito, mostrar indicador de sucesso (SEM botão de cancelar)
      if (widget.inscrito) {
        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.green[200]!),
          ),
          child: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Inscrito neste curso',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.green[700],
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Acesso garantido aos conteúdos',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }

      // Se o curso terminou e não está inscrito
      if (cursoTerminado) {
        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(12),
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
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
        );
      }

      // Se não há vagas
      if (widget.curso['tipo'] == 'sincrono' && !canEnroll) {
        return Container(
          width: double.infinity,
          padding: EdgeInsets.all(12),
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
                    fontSize: 14,
                    color: Colors.orange[700],
                  ),
                ),
              ),
            ],
          ),
        );
      }

      // ✅ APENAS botão de INSCREVER (nunca cancelar)
      return SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _handleInscricao,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _isLoading
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
                    Icon(
                      Icons.add_circle,
                      color: Colors.white,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Inscrever-se',
                      style: TextStyle(
                        fontSize: 16,
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
        padding: EdgeInsets.all(12),
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
                  fontSize: 14,
                  color: Colors.red[700],
                ),
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildDetalhesExpandidos() {
    return Container(
      padding: EdgeInsets.all(16),
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
                  _getFormadorNome(),
                  _getFormadorEmail(),
                ),
              ),
              SizedBox(width: 8),
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
              SizedBox(width: 8),
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
          SizedBox(height: 12),

          // Segunda linha: Categoria, Área, Tópico
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.category,
                  'Categoria',
                  _getCategoriaNome(),
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  Icons.bookmark,
                  'Área',
                  _getAreaNome(),
                  '',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _buildInfoCard(
                  Icons.topic,
                  'Tópico',
                  _getTopicoAreaTitulo(),
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
              padding: EdgeInsets.all(12),
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
                      SizedBox(width: 6),
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
                  SizedBox(height: 6),
                  Text(
                    widget.curso['descricao'].toString(),
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          SizedBox(height: 16),

          // ✅ Botão de ação (SEM cancelar inscrição)
          _buildActionButton(),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    print(
        '🏗️ Building DetalhesCurso - mostrarDetalhes: ${widget.mostrarDetalhes}');

    // SEMPRE mostrar algum conteúdo
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
          // SEMPRE mostrar os detalhes expandidos
          _buildDetalhesExpandidos(),
        ],
      ),
    );
  }
}
