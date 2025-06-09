import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../services/api_service.dart';

class DetalhesCurso extends StatefulWidget {
  final String cursoId;
  final Map<String, dynamic> curso;
  final bool inscrito;
  final int? userRole;
  final Function(bool)? onInscricaoChanged;

  const DetalhesCurso({
    Key? key,
    required this.cursoId,
    required this.curso,
    required this.inscrito,
    this.userRole,
    this.onInscricaoChanged,
  }) : super(key: key);

  @override
  _DetalhesCursoState createState() => _DetalhesCursoState();
}

class _DetalhesCursoState extends State<DetalhesCurso> {
  bool _isLoading = false;
  bool _mostrarDetalhes = true;
  Map<String, dynamic>? formadorData;
  Map<String, dynamic>? categoriaData;
  Map<String, dynamic>? areaData;
  Map<String, dynamic>? topicoAreaData;
  List<Map<String, dynamic>> topicos = [];

  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    // Se não estiver inscrito, mostrar detalhes por padrão
    // Se estiver inscrito, não mostrar detalhes por padrão
    _mostrarDetalhes = !widget.inscrito;
    _loadAdditionalData();
  }

  Future<void> _loadAdditionalData() async {
    try {
      // Carregar dados do formador
      if (widget.curso['id_formador'] != null) {
        try {
          final response =
              await _apiService.get('/users/${widget.curso['id_formador']}');
          if (response.statusCode == 200) {
            formadorData = json.decode(response.body);
          }
        } catch (e) {
          print('Erro ao carregar formador: $e');
        }
      }

      // Carregar dados da categoria
      if (widget.curso['id_categoria'] != null) {
        try {
          final response = await _apiService
              .get('/categorias/${widget.curso['id_categoria']}');
          if (response.statusCode == 200) {
            categoriaData = json.decode(response.body);
          }
        } catch (e) {
          print('Erro ao carregar categoria: $e');
        }
      }

      // Carregar dados da área
      if (widget.curso['id_area'] != null) {
        try {
          final response =
              await _apiService.get('/areas/${widget.curso['id_area']}');
          if (response.statusCode == 200) {
            areaData = json.decode(response.body);
          }
        } catch (e) {
          print('Erro ao carregar área: $e');
        }
      }

      // Carregar dados do tópico de área
      if (widget.curso['id_topico_area'] != null) {
        try {
          final response = await _apiService
              .get('/cursos/topico-area/${widget.curso['id_topico_area']}');
          if (response.statusCode == 200) {
            topicoAreaData = json.decode(response.body);
          }
        } catch (e) {
          print('Erro ao carregar tópico de área: $e');
        }
      }

      // Carregar tópicos do curso
      try {
        final response =
            await _apiService.get('/cursos/${widget.cursoId}/topicos');
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data is List) {
            topicos = data.cast<Map<String, dynamic>>();
          }
        }
      } catch (e) {
        print('Erro ao carregar tópicos: $e');
      }

      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('Erro geral ao carregar dados adicionais: $e');
    }
  }

  Future<void> _handleInscricao() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = widget.inscrito
          ? await _apiService.post('/inscricoes/cancelar/${widget.cursoId}')
          : await _apiService.post('/inscricoes/inscrever/${widget.cursoId}');

      if (response.statusCode == 200) {
        final newState = !widget.inscrito;
        widget.onInscricaoChanged?.call(newState);

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

        // Se acabou de se inscrever, esconder detalhes
        if (newState) {
          setState(() {
            _mostrarDetalhes = false;
          });
        }
      } else {
        throw Exception('Erro na resposta do servidor');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao processar inscrição. Tente novamente.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
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

  bool _canEnroll() {
    if (widget.inscrito) return true; // Pode cancelar inscrição

    final now = DateTime.now();
    final dataInicio = DateTime.parse(widget.curso['data_inicio']);
    final dataFim = DateTime.parse(widget.curso['data_fim']);

    // Não pode se inscrever se o curso já terminou
    if (dataFim.isBefore(now)) return false;

    // Para cursos síncronos, verificar se ainda há vagas
    if (widget.curso['tipo'] == 'sincrono') {
      final vagas = widget.curso['vagas'] ?? 0;
      final inscritos = widget.curso['total_inscritos'] ?? 0;
      return inscritos < vagas;
    }

    // Para cursos assíncronos, sempre pode se inscrever (se não terminou)
    return true;
  }

  Widget _buildCursoHeader() {
    final status = _formatEstadoParaExibicao(widget.curso['estado']);
    final statusColor = _getEstadoColor(widget.curso['estado']);

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
        children: [
          // Header com título e status
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Colors.blue.withOpacity(0.8),
                  Colors.blue.withOpacity(0.6),
                ],
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.curso['nome'] ?? '',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
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
                SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.curso['descricao'] ??
                            'Sem descrição disponível.',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          _mostrarDetalhes = !_mostrarDetalhes;
                        });
                      },
                      icon: Icon(
                        _mostrarDetalhes
                            ? Icons.expand_less
                            : Icons.info_outline,
                        color: Colors.white,
                        size: 28,
                      ),
                      tooltip: _mostrarDetalhes
                          ? 'Ocultar detalhes'
                          : 'Mostrar detalhes',
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Detalhes expandidos
          if (_mostrarDetalhes) _buildDetalhesExpandidos(),
        ],
      ),
    );
  }

  Widget _buildDetalhesExpandidos() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
      ),
      child: Column(
        children: [
          // Informações básicas - 3 colunas
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.person,
                  'Formador',
                  formadorData?['nome'] ?? 'Não atribuído',
                  formadorData?['email'] ?? '',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _buildInfoCard(
                  Icons.event_available,
                  'Estado',
                  _formatEstadoParaExibicao(widget.curso['estado']),
                  '',
                ),
              ),
              SizedBox(width: 10),
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
            ],
          ),
          SizedBox(height: 15),

          // Categoria, área e tópico - 3 colunas
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.category,
                  'Categoria',
                  categoriaData?['nome'] ?? 'Não atribuída',
                  '',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _buildInfoCard(
                  Icons.bookmark,
                  'Área',
                  areaData?['nome'] ?? 'Não atribuída',
                  '',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _buildInfoCard(
                  Icons.topic,
                  'Tópico de Área',
                  topicoAreaData?['titulo'] ?? 'Não disponível',
                  '',
                ),
              ),
            ],
          ),
          SizedBox(height: 15),

          // Duração e datas - 3 colunas
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  Icons.schedule,
                  'Duração',
                  '${widget.curso['duracao'] ?? 0}h',
                  '',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _buildInfoCard(
                  Icons.calendar_today,
                  'Início',
                  _formatDate(widget.curso['data_inicio']),
                  '',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _buildInfoCard(
                  Icons.calendar_today,
                  'Fim',
                  _formatDate(widget.curso['data_fim']),
                  '',
                ),
              ),
            ],
          ),
          SizedBox(height: 15),

          // Descrição completa
          if (widget.curso['descricao'] != null &&
              widget.curso['descricao'].isNotEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(16),
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
                      SizedBox(width: 8),
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
                  SizedBox(height: 8),
                  Text(
                    widget.curso['descricao'],
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          SizedBox(height: 20),

          // Botão de inscrição
          _buildActionButton(),

          // Botões de administrador (se aplicável)
          if (widget.userRole == 1) ...[
            SizedBox(height: 15),
            _buildAdminButtons(),
          ],
        ],
      ),
    );
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
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton() {
    final canEnroll = _canEnroll();
    final now = DateTime.now();
    final dataFim = DateTime.parse(widget.curso['data_fim']);
    final cursoTerminado = dataFim.isBefore(now);

    if (cursoTerminado && !widget.inscrito) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Icon(Icons.event_busy, color: Colors.grey),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Este curso já terminou',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (widget.curso['tipo'] == 'sincrono' && !canEnroll && !widget.inscrito) {
      return Container(
        width: double.infinity,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.people, color: Colors.orange),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Não há vagas disponíveis',
                style: TextStyle(
                  fontSize: 16,
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
      height: 50,
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
                    widget.inscrito ? Icons.cancel : Icons.add_circle,
                    color: Colors.white,
                  ),
                  SizedBox(width: 8),
                  Text(
                    widget.inscrito ? 'Cancelar Inscrição' : 'Inscrever-se',
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
  }

  Widget _buildAdminButtons() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        ElevatedButton.icon(
          onPressed: () {
            // TODO: Navegar para editar curso
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Editar curso - Em desenvolvimento')),
            );
          },
          icon: Icon(Icons.edit, size: 16),
          label: Text('Editar'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () {
            // TODO: Navegar para inscrições
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Gerir inscrições - Em desenvolvimento')),
            );
          },
          icon: Icon(Icons.people, size: 16),
          label: Text('Inscrições'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () {
            // TODO: Navegar para avaliações
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Gerir avaliações - Em desenvolvimento')),
            );
          },
          icon: Icon(Icons.star, size: 16),
          label: Text('Avaliações'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.purple,
            foregroundColor: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () {
            _showDeleteConfirmation();
          },
          icon: Icon(Icons.delete, size: 16),
          label: Text('Excluir'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Confirmar Exclusão'),
          content: Text(
            'Tem certeza que deseja excluir este curso? Esta ação irá remover o curso e todas as inscrições associadas.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // TODO: Implementar exclusão do curso
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text('Exclusão de curso - Em desenvolvimento')),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: Text('Excluir', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildCursoHeader(),
        ],
      ),
    );
  }
}
