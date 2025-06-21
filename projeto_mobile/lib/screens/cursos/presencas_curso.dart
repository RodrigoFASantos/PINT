import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/api_service.dart';

class PresencasCurso extends StatefulWidget {
  final String cursoId;
  final int? userRole;
  final bool inscrito;

  const PresencasCurso({
    Key? key,
    required this.cursoId,
    this.userRole,
    required this.inscrito,
  }) : super(key: key);

  @override
  _PresencasCursoState createState() => _PresencasCursoState();
}

class _PresencasCursoState extends State<PresencasCurso> {
  List<Map<String, dynamic>> presencas = [];
  Map<String, bool> minhasPresencas = {};
  bool loading = true;
  String? error;

  // Para marcar presença (formando)
  bool showMarcarModal = false;
  String codigoMarcar = '';

  // Para ver lista de formandos (formadores)
  bool showListaFormandosModal = false;
  Map<String, dynamic>? presencaSelecionada;
  List<Map<String, dynamic>> formandosLista = [];
  bool loadingFormandos = false;

  // Controller para o TextField
  late TextEditingController _codigoMarcarController;

  // Dados do usuário atual
  Map<String, dynamic>? currentUser;

  final ApiService _apiService = ApiService();

  // Verificar se é formador (cargos 1=admin ou 2=formador) ou formando (cargo 3)
  bool get isFormador => widget.userRole == 1 || widget.userRole == 2;
  bool get isFormando => widget.userRole == 3;

  @override
  void initState() {
    super.initState();
    // Inicializar o controller
    _codigoMarcarController = TextEditingController();
    _getCurrentUser();
  }

  @override
  void dispose() {
    // Fazer dispose do controller
    _codigoMarcarController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentUser() async {
    try {
      currentUser = await _apiService.getCurrentUser();
      _refreshData();
    } catch (e) {
      print('Erro ao obter usuário atual: $e');
      setState(() {
        error = 'Erro ao obter dados do usuário';
        loading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    if (!widget.inscrito && !isFormador) {
      setState(() {
        error = 'É necessário estar inscrito no curso para ver as presenças.';
        loading = false;
      });
      return;
    }

    try {
      setState(() {
        loading = true;
        error = null;
      });

      // Buscar presenças do curso
      final response =
          await _apiService.get('/presencas/curso/${widget.cursoId}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        List<Map<String, dynamic>> allPresencas = [];

        if (data is List) {
          allPresencas = data.cast<Map<String, dynamic>>();
        }

        // Para formandos, mostrar todas as presenças (com diferentes status)
        // Para formadores, mostrar todas as presenças
        setState(() {
          presencas = allPresencas;
        });

        // Se for formando, buscar suas presenças
        if (isFormando && currentUser != null) {
          try {
            final minhasPresencasResponse = await _apiService.get(
                '/presencas/formando/${widget.cursoId}/${currentUser!['id_utilizador']}');

            if (minhasPresencasResponse.statusCode == 200) {
              final minhasPresencasData =
                  json.decode(minhasPresencasResponse.body);
              Map<String, bool> presencasMap = {};

              if (minhasPresencasData is List) {
                for (var p in minhasPresencasData) {
                  presencasMap[p['id_curso_presenca'].toString()] =
                      p['presenca'] ?? false;
                }
              }

              setState(() {
                minhasPresencas = presencasMap;
              });
            }
          } catch (e) {
            print('Erro ao buscar presenças do formando: $e');
          }
        }

        setState(() {
          loading = false;
        });
      } else {
        setState(() {
          error = 'Falha ao carregar presenças';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Erro ao carregar presenças: $e';
        loading = false;
      });
    }
  }

  // Determinar o status da presença para formandos
  String _getStatusPresenca(Map<String, dynamic> presenca) {
    final presencaId = presenca['id_curso_presenca'].toString();
    final jaPresente = minhasPresencas[presencaId] ?? false;

    if (jaPresente) {
      return 'Presente';
    }

    // Verificar se ainda está dentro da validade
    try {
      final dataHoraFim =
          DateTime.parse('${presenca['data_fim']}T${presenca['hora_fim']}');
      final agora = DateTime.now();

      if (dataHoraFim.isAfter(agora)) {
        return 'Registar';
      } else {
        return 'Ausente';
      }
    } catch (e) {
      return 'Ausente';
    }
  }

  // Determinar a cor do status
  Color _getCorStatus(String status) {
    switch (status) {
      case 'Presente':
        return Colors.green;
      case 'Registar':
        return Colors.orange;
      case 'Ausente':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  // Verificar se a presença pode ser marcada (está válida e não foi marcada)
  bool _podeMarcarPresenca(Map<String, dynamic> presenca) {
    return _getStatusPresenca(presenca) == 'Registar';
  }

  // Abrir modal para marcar presença específica
  void _abrirModalMarcarPresenca(Map<String, dynamic> presenca) {
    setState(() {
      presencaSelecionada = presenca;
      showMarcarModal = true;
      codigoMarcar = '';
      _codigoMarcarController.clear();
    });
  }

  // Marcar presença
  Future<void> _marcarPresenca() async {
    if (_codigoMarcarController.text.isEmpty) {
      _showError('Código inválido');
      return;
    }

    if (currentUser == null) {
      _showError('Código inválido');
      return;
    }

    try {
      setState(() {
        loading = true;
      });

      final body = {
        'id_curso': widget.cursoId,
        'id_utilizador': currentUser!['id_utilizador'],
        'codigo': _codigoMarcarController.text,
      };

      final response = await _apiService.post('/presencas/marcar', body: body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Fechar modal primeiro
        setState(() {
          showMarcarModal = false;
          presencaSelecionada = null;
          _codigoMarcarController.clear();
        });

        _showSuccess('Presença marcada com sucesso!');
        // Atualizar dados completos
        await _refreshData();
      } else {
        _showError('Código inválido');
      }
    } catch (e) {
      _showError('Código inválido');
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  Future<void> _fetchFormandosPresenca(String presencaId) async {
    try {
      setState(() {
        loadingFormandos = true;
      });

      final response =
          await _apiService.get('/presencas/formandos/$presencaId');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          formandosLista = (data as List).cast<Map<String, dynamic>>();
          loadingFormandos = false;
        });
      } else {
        setState(() {
          formandosLista = [];
          loadingFormandos = false;
        });
        _showError('Erro ao carregar lista de formandos');
      }
    } catch (e) {
      setState(() {
        formandosLista = [];
        loadingFormandos = false;
      });
      _showError('Erro ao carregar formandos: $e');
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

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
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
            'A carregar presenças...',
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
              onPressed: _refreshData,
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

  Widget _buildEmptyWidget() {
    return Center(
      child: Container(
        padding: EdgeInsets.all(24),
        margin: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.check_circle_outline,
              color: Colors.grey[400],
              size: 64,
            ),
            SizedBox(height: 16),
            Text(
              'Nenhuma presença registada',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Este curso ainda não possui presenças registadas.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
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

    return Stack(
      children: [
        // Conteúdo principal
        Column(
          children: [
            // Header com ações
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
                  Icon(Icons.check_circle_outline, color: Colors.blue),
                  SizedBox(width: 8),
                  Text(
                    'Presenças',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Spacer(),
                  IconButton(
                    onPressed: _refreshData,
                    icon: Icon(Icons.refresh),
                    tooltip: 'Atualizar',
                  ),
                ],
              ),
            ),

            // Lista de presenças
            Expanded(
              child: presencas.isEmpty
                  ? _buildEmptyWidget()
                  : RefreshIndicator(
                      onRefresh: _refreshData,
                      child: ListView.builder(
                        padding: EdgeInsets.all(16),
                        itemCount: presencas.length,
                        itemBuilder: (context, index) {
                          final presenca = presencas[index];
                          final presencaId =
                              presenca['id_curso_presenca'].toString();

                          // Para formandos, determinar status e cor
                          String statusText = '';
                          Color statusColor = Colors.grey;
                          Color cardColor = Colors.white;
                          bool podeClicar = false;

                          if (isFormando) {
                            statusText = _getStatusPresenca(presenca);
                            statusColor = _getCorStatus(statusText);
                            podeClicar = _podeMarcarPresenca(presenca);

                            // Definir cor do card baseada no status
                            switch (statusText) {
                              case 'Presente':
                                cardColor = Colors.green[50]!;
                                break;
                              case 'Registar':
                                cardColor = Colors.orange[50]!;
                                break;
                              case 'Ausente':
                                cardColor = Colors.red[50]!;
                                break;
                            }
                          }

                          return Card(
                            margin: EdgeInsets.only(bottom: 8),
                            color: cardColor,
                            child: ListTile(
                              onTap: (isFormando && podeClicar)
                                  ? () => _abrirModalMarcarPresenca(presenca)
                                  : null,
                              leading: Container(
                                padding: EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isFormando ? statusColor : Colors.blue,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isFormando
                                      ? (statusText == 'Presente'
                                          ? Icons.check
                                          : statusText == 'Registar'
                                              ? Icons.access_time
                                              : Icons.close)
                                      : Icons.people,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              title: Text(
                                '${_formatDate(presenca['data_inicio'])} ${presenca['hora_inicio']} - ${_formatDate(presenca['data_fim'])} ${presenca['hora_fim']}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (isFormador)
                                    Text('Código: ${presenca['codigo']}'),
                                  Text(
                                    isFormando
                                        ? statusText
                                        : '${presenca['presentes'] ?? 0} presentes / ${presenca['total'] ?? 0} inscritos',
                                    style: TextStyle(
                                      color: isFormando
                                          ? statusColor
                                          : Colors.grey[600],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Botão para formadores verem lista
                                  if (isFormador)
                                    IconButton(
                                      onPressed: () {
                                        setState(() {
                                          presencaSelecionada = presenca;
                                          showListaFormandosModal = true;
                                        });
                                        _fetchFormandosPresenca(presencaId);
                                      },
                                      icon: Icon(Icons.people_outline),
                                      tooltip: 'Ver formandos',
                                    ),
                                  // Indicador clicável para formandos
                                  if (isFormando && podeClicar)
                                    Icon(
                                      Icons.touch_app,
                                      color: Colors.orange,
                                      size: 20,
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),

        // Modal marcar presença (formandos)
        if (showMarcarModal && presencaSelecionada != null)
          Container(
            color: Colors.black54,
            child: Center(
              child: Container(
                margin: EdgeInsets.all(16),
                padding: EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Marcar Presença',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Spacer(),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              showMarcarModal = false;
                              presencaSelecionada = null;
                            });
                          },
                          icon: Icon(Icons.close),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${_formatDate(presencaSelecionada!['data_inicio'])} ${presencaSelecionada!['hora_inicio']} - ${_formatDate(presencaSelecionada!['data_fim'])} ${presencaSelecionada!['hora_fim']}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _codigoMarcarController,
                      decoration: InputDecoration(
                        labelText: 'Código de Presença',
                        border: OutlineInputBorder(),
                        hintText: 'Insira o código fornecido pelo formador',
                      ),
                      autofocus: true,
                      onSubmitted: (_) => _marcarPresenca(),
                    ),
                    SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                showMarcarModal = false;
                                presencaSelecionada = null;
                              });
                            },
                            child: Text('Cancelar'),
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: loading ? null : _marcarPresenca,
                            child: Text(loading ? 'Processando...' : 'Marcar'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

        // Modal lista formandos (para formadores)
        if (showListaFormandosModal && presencaSelecionada != null)
          Container(
            color: Colors.black54,
            child: Center(
              child: Container(
                margin: EdgeInsets.all(16),
                padding: EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.8,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Formandos - ${_formatDate(presencaSelecionada!['data_inicio'])} ${presencaSelecionada!['hora_inicio']}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              showListaFormandosModal = false;
                              presencaSelecionada = null;
                              formandosLista = [];
                            });
                          },
                          icon: Icon(Icons.close),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    Expanded(
                      child: loadingFormandos
                          ? Center(child: CircularProgressIndicator())
                          : formandosLista.isEmpty
                              ? Center(
                                  child: Text(
                                    'Nenhum formando inscrito neste curso.',
                                    style: TextStyle(color: Colors.grey[600]),
                                  ),
                                )
                              : ListView.builder(
                                  itemCount: formandosLista.length,
                                  itemBuilder: (context, index) {
                                    final formando = formandosLista[index];
                                    final presente =
                                        formando['presenca'] ?? false;

                                    return Card(
                                      color: presente
                                          ? Colors.green[50]
                                          : Colors.red[50],
                                      child: ListTile(
                                        leading: Container(
                                          padding: EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: presente
                                                ? Colors.green
                                                : Colors.red,
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          child: Icon(
                                            presente
                                                ? Icons.check
                                                : Icons.close,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                        ),
                                        title: Text(
                                          formando['nome'] ??
                                              'Nome não disponível',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        subtitle: Text(
                                          formando['email'] ??
                                              'Email não disponível',
                                        ),
                                        trailing: Text(
                                          presente ? 'Presente' : 'Ausente',
                                          style: TextStyle(
                                            color: presente
                                                ? Colors.green[700]
                                                : Colors.red[700],
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                    ),
                    SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            showListaFormandosModal = false;
                            presencaSelecionada = null;
                            formandosLista = [];
                          });
                        },
                        child: Text('Fechar'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
