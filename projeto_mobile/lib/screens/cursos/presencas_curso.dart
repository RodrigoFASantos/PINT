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
  bool temPresencaAtiva = false;

  // Para criar presença (formador)
  bool showCriarModal = false;
  String codigo = '';
  DateTime? dataInicio;
  TimeOfDay? horaInicio;
  DateTime? dataFim;
  TimeOfDay? horaFim;

  // Para marcar presença (formando)
  bool showMarcarModal = false;
  String codigoMarcar = '';

  // Para ver lista de formandos
  bool showListaFormandosModal = false;
  Map<String, dynamic>? presencaSelecionada;
  List<Map<String, dynamic>> formandosLista = [];
  bool loadingFormandos = false;

  final ApiService _apiService = ApiService();

  // Verificar se é formador (cargos 1=admin ou 2=formador) ou formando (cargo 3)
  bool get isFormador => widget.userRole == 1 || widget.userRole == 2;
  bool get isFormando => widget.userRole == 3;

  @override
  void initState() {
    super.initState();
    _refreshData();
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

        // Filtrar presenças para formandos - só mostrar aquelas cuja data/hora de início já passou
        if (isFormando) {
          final agora = DateTime.now();
          allPresencas = allPresencas.where((presenca) {
            try {
              final dataHoraInicio = DateTime.parse(
                  '${presenca['data_inicio']}T${presenca['hora_inicio']}');
              return dataHoraInicio.isBefore(agora) ||
                  dataHoraInicio.isAtSameMomentAs(agora);
            } catch (e) {
              return false;
            }
          }).toList();
        }

        // Verificar se existe presença ativa
        final agora = DateTime.now();
        bool presencaAtiva = false;

        for (var presenca in allPresencas) {
          try {
            final dataHoraFim = DateTime.parse(
                '${presenca['data_fim']}T${presenca['hora_fim']}');
            if (dataHoraFim.isAfter(agora)) {
              presencaAtiva = true;
              break;
            }
          } catch (e) {
            // Ignorar erros de parsing
          }
        }

        // Se for formando, buscar suas presenças
        if (isFormando) {
          try {
            final minhasPresencasResponse = await _apiService
                .get('/presencas/formando/${widget.cursoId}/me');

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
          presencas = allPresencas;
          temPresencaAtiva = presencaAtiva;
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

  Future<void> _criarPresenca() async {
    if (codigo.isEmpty ||
        dataInicio == null ||
        horaInicio == null ||
        dataFim == null ||
        horaFim == null) {
      _showError('Preencha todos os campos');
      return;
    }

    // Validar que data/hora fim > data/hora início
    final inicio = DateTime(
      dataInicio!.year,
      dataInicio!.month,
      dataInicio!.day,
      horaInicio!.hour,
      horaInicio!.minute,
    );

    final fim = DateTime(
      dataFim!.year,
      dataFim!.month,
      dataFim!.day,
      horaFim!.hour,
      horaFim!.minute,
    );

    if (fim.isBefore(inicio) || fim.isAtSameMomentAs(inicio)) {
      _showError('A data/hora de fim deve ser posterior à data/hora de início');
      return;
    }

    try {
      setState(() {
        loading = true;
      });

      final body = {
        'id_curso': widget.cursoId,
        'data_inicio':
            '${dataInicio!.year}-${dataInicio!.month.toString().padLeft(2, '0')}-${dataInicio!.day.toString().padLeft(2, '0')}',
        'hora_inicio':
            '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}',
        'data_fim':
            '${dataFim!.year}-${dataFim!.month.toString().padLeft(2, '0')}-${dataFim!.day.toString().padLeft(2, '0')}',
        'hora_fim':
            '${horaFim!.hour.toString().padLeft(2, '0')}:${horaFim!.minute.toString().padLeft(2, '0')}',
        'codigo': codigo,
      };

      final response = await _apiService.post('/presencas/criar', body: body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          showCriarModal = false;
          codigo = '';
          dataInicio = null;
          horaInicio = null;
          dataFim = null;
          horaFim = null;
        });

        _showSuccess('Presença criada com sucesso!');
        await _refreshData();
      } else {
        final errorData = json.decode(response.body);
        _showError(errorData['message'] ?? 'Erro ao criar presença');
      }
    } catch (e) {
      _showError('Erro ao criar presença: $e');
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  Future<void> _marcarPresenca() async {
    if (codigoMarcar.isEmpty) {
      _showError('Preencha o código de presença');
      return;
    }

    try {
      setState(() {
        loading = true;
      });

      final body = {
        'id_curso': widget.cursoId,
        'codigo': codigoMarcar,
      };

      final response = await _apiService.post('/presencas/marcar', body: body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          showMarcarModal = false;
          codigoMarcar = '';
        });

        _showSuccess('Presença marcada com sucesso!');
        await _refreshData();
      } else {
        _showError('Código de presença inválido ou expirado');
      }
    } catch (e) {
      _showError('Erro ao marcar presença: $e');
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

  String _gerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return String.fromCharCodes(Iterable.generate(
        6,
        (_) => chars.codeUnitAt(
            (DateTime.now().millisecondsSinceEpoch) % chars.length)));
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
                  if (isFormador)
                    ElevatedButton.icon(
                      onPressed: temPresencaAtiva
                          ? null
                          : () {
                              setState(() {
                                showCriarModal = true;
                                // Definir valores padrão
                                final agora = DateTime.now();
                                dataInicio = agora;
                                dataFim = agora;
                                horaInicio = TimeOfDay.fromDateTime(agora);
                                horaFim = TimeOfDay.fromDateTime(
                                    agora.add(Duration(hours: 2)));
                                codigo = _gerarCodigo();
                              });
                            },
                      icon: Icon(Icons.add),
                      label: Text('Criar Presença'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            temPresencaAtiva ? Colors.grey : Colors.green,
                      ),
                    ),
                  if (isFormando)
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          showMarcarModal = true;
                          codigoMarcar = '';
                        });
                      },
                      icon: Icon(Icons.check),
                      label: Text('Marcar Presença'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                      ),
                    ),
                  SizedBox(width: 8),
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
                          final jaPresente =
                              minhasPresencas[presencaId] ?? false;

                          return Card(
                            margin: EdgeInsets.only(bottom: 8),
                            color: isFormando
                                ? (jaPresente
                                    ? Colors.green[50]
                                    : Colors.red[50])
                                : null,
                            child: ListTile(
                              leading: Container(
                                padding: EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isFormando
                                      ? (jaPresente ? Colors.green : Colors.red)
                                      : Colors.blue,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isFormando
                                      ? (jaPresente ? Icons.check : Icons.close)
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
                                        ? (jaPresente ? 'Presente' : 'Ausente')
                                        : '${presenca['presentes'] ?? 0} presentes / ${presenca['total'] ?? 0} inscritos',
                                    style: TextStyle(
                                      color: isFormando
                                          ? (jaPresente
                                              ? Colors.green[700]
                                              : Colors.red[700])
                                          : Colors.grey[600],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: isFormador
                                  ? IconButton(
                                      onPressed: () {
                                        setState(() {
                                          presencaSelecionada = presenca;
                                          showListaFormandosModal = true;
                                        });
                                        _fetchFormandosPresenca(presencaId);
                                      },
                                      icon: Icon(Icons.people_outline),
                                      tooltip: 'Ver formandos',
                                    )
                                  : null,
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),

        // Modais
        // Modal criar presença
        if (showCriarModal)
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
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Criar Nova Presença',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Spacer(),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                showCriarModal = false;
                              });
                            },
                            icon: Icon(Icons.close),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),

                      // Código
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                labelText: 'Código',
                                border: OutlineInputBorder(),
                              ),
                              controller: TextEditingController(text: codigo),
                              onChanged: (value) {
                                setState(() {
                                  codigo = value;
                                });
                              },
                            ),
                          ),
                          SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              setState(() {
                                codigo = _gerarCodigo();
                              });
                            },
                            child: Text('Gerar'),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),

                      // Data início
                      InkWell(
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: dataInicio ?? DateTime.now(),
                            firstDate:
                                DateTime.now().subtract(Duration(days: 30)),
                            lastDate: DateTime.now().add(Duration(days: 365)),
                          );
                          if (date != null) {
                            setState(() {
                              dataInicio = date;
                            });
                          }
                        },
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Data de Início',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            dataInicio != null
                                ? '${dataInicio!.day}/${dataInicio!.month}/${dataInicio!.year}'
                                : 'Selecionar data',
                          ),
                        ),
                      ),
                      SizedBox(height: 16),

                      // Hora início
                      InkWell(
                        onTap: () async {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: horaInicio ?? TimeOfDay.now(),
                          );
                          if (time != null) {
                            setState(() {
                              horaInicio = time;
                            });
                          }
                        },
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Hora de Início',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            horaInicio != null
                                ? '${horaInicio!.hour.toString().padLeft(2, '0')}:${horaInicio!.minute.toString().padLeft(2, '0')}'
                                : 'Selecionar hora',
                          ),
                        ),
                      ),
                      SizedBox(height: 16),

                      // Data fim
                      InkWell(
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: dataFim ?? DateTime.now(),
                            firstDate:
                                DateTime.now().subtract(Duration(days: 30)),
                            lastDate: DateTime.now().add(Duration(days: 365)),
                          );
                          if (date != null) {
                            setState(() {
                              dataFim = date;
                            });
                          }
                        },
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Data de Fim',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            dataFim != null
                                ? '${dataFim!.day}/${dataFim!.month}/${dataFim!.year}'
                                : 'Selecionar data',
                          ),
                        ),
                      ),
                      SizedBox(height: 16),

                      // Hora fim
                      InkWell(
                        onTap: () async {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: horaFim ?? TimeOfDay.now(),
                          );
                          if (time != null) {
                            setState(() {
                              horaFim = time;
                            });
                          }
                        },
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Hora de Fim',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            horaFim != null
                                ? '${horaFim!.hour.toString().padLeft(2, '0')}:${horaFim!.minute.toString().padLeft(2, '0')}'
                                : 'Selecionar hora',
                          ),
                        ),
                      ),
                      SizedBox(height: 24),

                      // Botões
                      Row(
                        children: [
                          Expanded(
                            child: TextButton(
                              onPressed: () {
                                setState(() {
                                  showCriarModal = false;
                                });
                              },
                              child: Text('Cancelar'),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _criarPresenca,
                              child: Text('Criar'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
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
          ),

        // Modal marcar presença
        if (showMarcarModal)
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
                            });
                          },
                          icon: Icon(Icons.close),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    TextField(
                      decoration: InputDecoration(
                        labelText: 'Código de Presença',
                        border: OutlineInputBorder(),
                      ),
                      controller: TextEditingController(text: codigoMarcar),
                      onChanged: (value) {
                        setState(() {
                          codigoMarcar = value;
                        });
                      },
                      textCapitalization: TextCapitalization.characters,
                    ),
                    SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                showMarcarModal = false;
                              });
                            },
                            child: Text('Cancelar'),
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _marcarPresenca,
                            child: Text('Marcar'),
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

        // Modal lista formandos
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
