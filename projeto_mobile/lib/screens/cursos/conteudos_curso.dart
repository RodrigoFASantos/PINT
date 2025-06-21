import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';

class ConteudosCurso extends StatefulWidget {
  final String cursoId;
  final bool inscrito;

  const ConteudosCurso({
    Key? key,
    required this.cursoId,
    required this.inscrito,
  }) : super(key: key);

  @override
  _ConteudosCursoState createState() => _ConteudosCursoState();
}

class _ConteudosCursoState extends State<ConteudosCurso> {
  List<Map<String, dynamic>> topicos = [];
  Set<String> expandedTopicos = {};
  Set<String> expandedPastas = {};
  bool loading = true;
  String? error;
  Map<String, dynamic>? cursoInfo;
  int? userRole;

  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _getUserRole();
    _fetchTopicos();
  }

  void _getUserRole() {
    try {
      // TODO: Implementar obtenção do userRole do token ou contexto
      // Por agora, assumir que é usuário normal (3)
      userRole = 3;
    } catch (e) {
      userRole = 3; // Assumir usuário normal por padrão
    }
  }

  bool get podeAcederConteudos {
    // Se é admin ou formador, sempre pode aceder
    if (userRole == 1 || userRole == 2) return true;

    // Se não está inscrito, não pode aceder
    if (!widget.inscrito) return false;

    // Se não tem informações do curso ainda, não pode aceder
    if (cursoInfo == null) return false;

    // Verificar se o curso terminou
    try {
      final dataAtual = DateTime.now();
      final dataFimCurso = DateTime.parse(cursoInfo!['data_fim']);
      final cursoTerminado = dataFimCurso.isBefore(dataAtual);

      // Se o curso não terminou, pode aceder (já está inscrito)
      if (!cursoTerminado) return true;

      // Se o curso terminou e é assíncrono, não pode aceder (exceto admin)
      if (cursoInfo!['tipo'] == 'assincrono') return false;

      // Se o curso terminou e é síncrono, pode aceder se estava inscrito
      if (cursoInfo!['tipo'] == 'sincrono') return true;
    } catch (e) {
      print('Erro ao verificar datas do curso: $e');
    }

    return false;
  }

  String get mensagemBloqueio {
    if (cursoInfo == null) return "A carregar informações do curso...";

    if (!widget.inscrito) {
      return "Precisa de estar inscrito no curso para aceder a este conteúdo.";
    }

    try {
      final dataAtual = DateTime.now();
      final dataFimCurso = DateTime.parse(cursoInfo!['data_fim']);
      final cursoTerminado = dataFimCurso.isBefore(dataAtual);

      if (cursoTerminado && cursoInfo!['tipo'] == 'assincrono') {
        return "Este curso assíncrono já terminou e os conteúdos não estão mais disponíveis.";
      }
    } catch (e) {
      print('Erro ao verificar datas: $e');
    }

    return "Não tem permissão para aceder a este conteúdo.";
  }

  Future<void> _fetchTopicos() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      // Primeiro carregar dados do curso
      final cursoResponse = await _apiService.get('/cursos/${widget.cursoId}');
      if (cursoResponse.statusCode == 200) {
        cursoInfo = json.decode(cursoResponse.body);
      }

      // Carregar tópicos e conteúdos do curso
      final response =
          await _apiService.get('/topicos-curso/curso/${widget.cursoId}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data is List) {
          // Filtrar tópicos de avaliação para não exibi-los na seção de conteúdos
          final topicosFiltrados = (data as List<dynamic>)
              .cast<Map<String, dynamic>>()
              .where((topico) => topico['nome']?.toLowerCase() != 'avaliação')
              .map((topico) => {
                    ...topico,
                    'expanded': false,
                    'pastas': (topico['pastas'] as List<dynamic>?)
                            ?.cast<Map<String, dynamic>>()
                            .map((pasta) => {
                                  ...pasta,
                                  'expanded': false,
                                })
                            .toList() ??
                        [],
                  })
              .toList();

          setState(() {
            topicos = topicosFiltrados;
            loading = false;
          });
        } else {
          setState(() {
            topicos = [];
            loading = false;
          });
        }
      } else {
        setState(() {
          error = 'Erro ao carregar conteúdos';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error =
            'Não foi possível carregar o conteúdo do curso. Tente novamente mais tarde.';
        loading = false;
      });
    }
  }

  void _toggleTopico(String topicoId) {
    setState(() {
      if (expandedTopicos.contains(topicoId)) {
        expandedTopicos.remove(topicoId);
      } else {
        expandedTopicos.add(topicoId);
      }
    });
  }

  void _togglePasta(String pastaId) {
    setState(() {
      if (expandedPastas.contains(pastaId)) {
        expandedPastas.remove(pastaId);
      } else {
        expandedPastas.add(pastaId);
      }
    });
  }

  IconData _getTipoConteudoIcon(String? tipo) {
    switch (tipo?.toLowerCase()) {
      case 'link':
        return Icons.link;
      case 'video':
        return Icons.play_circle_outline;
      case 'ficheiro':
      case 'arquivo':
      case 'file':
        return Icons.attach_file;
      default:
        return Icons.description;
    }
  }

  Color _getTipoConteudoColor(String? tipo) {
    switch (tipo?.toLowerCase()) {
      case 'link':
        return Colors.blue;
      case 'video':
        return Colors.red;
      case 'ficheiro':
      case 'arquivo':
      case 'file':
        return Colors.grey[600]!;
      default:
        return Colors.grey;
    }
  }

  bool _isFileType(String? tipo) {
    final tipoLower = tipo?.toLowerCase();
    return tipoLower == 'file' ||
        tipoLower == 'ficheiro' ||
        tipoLower == 'arquivo';
  }

  bool _isVideoType(String? tipo) {
    return tipo?.toLowerCase() == 'video';
  }

  bool _isLinkType(String? tipo) {
    return tipo?.toLowerCase() == 'link';
  }

  Future<void> _handleConteudoClick(Map<String, dynamic> conteudo) async {
    print(
        'Clique no conteúdo: ${conteudo['titulo']} - Tipo: ${conteudo['tipo']}');

    if (!podeAcederConteudos) {
      print('Acesso negado aos conteúdos');
      _showAccessDeniedDialog();
      return;
    }

    final tipo = conteudo['tipo']?.toLowerCase();
    print('Tipo normalizado: $tipo');

    try {
      if (_isLinkType(tipo)) {
        // Para links, abrir diretamente
        if (conteudo['url'] != null) {
          print('Abrindo link: ${conteudo['url']}');
          await _openUrl(conteudo['url'], 'link');
        } else {
          _showErrorSnackBar('URL do link não encontrada');
        }
      } else if (_isVideoType(tipo) || _isFileType(tipo)) {
        // Para vídeos e arquivos, mostrar modal
        print('Abrindo modal para ${_isVideoType(tipo) ? 'vídeo' : 'arquivo'}');
        _showContentModal(conteudo);
      } else {
        print('Tipo de conteúdo não suportado: $tipo');
        _showErrorSnackBar('Tipo de conteúdo não suportado');
      }
    } catch (e) {
      print('Erro ao abrir conteúdo: $e');
      _showErrorSnackBar('Erro ao abrir conteúdo: $e');
    }
  }

  void _showContentModal(Map<String, dynamic> conteudo) {
    final tipo = conteudo['tipo']?.toLowerCase();
    final isVideo = _isVideoType(tipo);
    final isFile = _isFileType(tipo);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Container(
            padding: EdgeInsets.all(20),
            constraints: BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Cabeçalho
                Row(
                  children: [
                    Icon(
                      isVideo ? Icons.play_circle_outline : Icons.attach_file,
                      color: isVideo ? Colors.red : Colors.blue,
                      size: 24,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        conteudo['titulo'] ?? (isVideo ? 'Vídeo' : 'Arquivo'),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: Icon(Icons.close),
                    ),
                  ],
                ),

                SizedBox(height: 20),

                // Descrição (se existir)
                if (conteudo['descricao'] != null &&
                    conteudo['descricao'].isNotEmpty) ...[
                  Text(
                    conteudo['descricao'],
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 20),
                ],

                // Botão de ação
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openConteudo(conteudo),
                    icon: Icon(
                        isVideo ? Icons.play_arrow : Icons.open_in_browser),
                    label: Text(isVideo ? 'Abrir Vídeo' : 'Abrir Arquivo'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isVideo ? Colors.red : Colors.blue,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _openConteudo(Map<String, dynamic> conteudo) async {
    try {
      final tipo = conteudo['tipo']?.toLowerCase();
      String? urlToOpen;

      if (_isVideoType(tipo)) {
        // Para vídeos: verificar se tem URL direta ou arquivo_path
        if (conteudo['url'] != null && conteudo['url'].toString().isNotEmpty) {
          // Vídeo com URL externa (ex: YouTube, Vimeo)
          urlToOpen = conteudo['url'];
          print('Abrindo vídeo com URL: $urlToOpen');
        } else if (conteudo['arquivo_path'] != null) {
          // Vídeo uploadado como arquivo
          urlToOpen =
              '${_apiService.apiBase.replaceAll('/api', '')}/${conteudo['arquivo_path']}';
          print('Abrindo vídeo uploadado: $urlToOpen');
        }
      } else if (_isFileType(tipo)) {
        // Para arquivos: sempre usar arquivo_path
        if (conteudo['arquivo_path'] != null) {
          urlToOpen =
              '${_apiService.apiBase.replaceAll('/api', '')}/${conteudo['arquivo_path']}';
          print('Abrindo arquivo: $urlToOpen');
        }
      }

      if (urlToOpen != null) {
        await _openUrl(urlToOpen, tipo);
        Navigator.of(context).pop(); // Fechar modal
      } else {
        _showErrorSnackBar('URL ou caminho do conteúdo não encontrado');
      }
    } catch (e) {
      print('Erro ao abrir conteúdo: $e');
      _showErrorSnackBar('Erro ao abrir conteúdo: $e');
    }
  }

  Future<void> _openUrl(String url, String tipo) async {
    try {
      final uri = Uri.parse(url);
      print('Tentando abrir URL: $url');

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_getSuccessMessage(tipo)),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        _showErrorSnackBar('Não foi possível abrir o ${_getTipoLabel(tipo)}');
      }
    } catch (e) {
      print('Erro ao abrir URL $url: $e');
      _showErrorSnackBar('Erro ao abrir ${_getTipoLabel(tipo)}: $e');
    }
  }

  String _getTipoLabel(String? tipo) {
    switch (tipo?.toLowerCase()) {
      case 'video':
        return 'vídeo';
      case 'link':
        return 'link';
      case 'file':
      case 'arquivo':
      case 'ficheiro':
        return 'arquivo';
      default:
        return 'conteúdo';
    }
  }

  String _getSuccessMessage(String? tipo) {
    switch (tipo?.toLowerCase()) {
      case 'video':
        return 'Vídeo aberto no navegador';
      case 'link':
        return 'Link aberto no navegador';
      case 'file':
      case 'arquivo':
      case 'ficheiro':
        return 'Arquivo aberto no navegador';
      default:
        return 'Conteúdo aberto no navegador';
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showAccessDeniedDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Acesso Restrito'),
          content: Text(mensagemBloqueio),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('OK'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTopicoItem(Map<String, dynamic> topico) {
    final topicoId = topico['id_topico'].toString();
    final isExpanded = expandedTopicos.contains(topicoId);
    final pastas = topico['pastas'] as List<dynamic>? ?? [];

    return Container(
      margin: EdgeInsets.only(bottom: 8),
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
          // Header do tópico
          InkWell(
            onTap: () => _toggleTopico(topicoId),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.chevron_right,
                    color: Colors.grey[600],
                  ),
                  SizedBox(width: 12),
                  Icon(
                    Icons.folder,
                    color: Colors.amber[700],
                    size: 24,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      topico['nome'] ?? 'Tópico sem nome',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[800],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Conteúdo expandido do tópico
          if (isExpanded) ...[
            Container(
              padding: EdgeInsets.only(left: 16, right: 16, bottom: 16),
              child: Column(
                children: [
                  if (pastas.isNotEmpty)
                    ...pastas.map((pasta) => _buildPastaItem(pasta)).toList()
                  else
                    Container(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Icon(
                            Icons.folder_open,
                            size: 48,
                            color: Colors.grey[400],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Sem pastas neste tópico',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPastaItem(Map<String, dynamic> pasta) {
    final pastaId = pasta['id_pasta'].toString();
    final isExpanded = expandedPastas.contains(pastaId);
    final conteudos = pasta['conteudos'] as List<dynamic>? ?? [];

    return Container(
      margin: EdgeInsets.only(bottom: 8, left: 20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          // Header da pasta
          InkWell(
            onTap: () => _togglePasta(pastaId),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.chevron_right,
                    color: Colors.grey[600],
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Icon(
                    Icons.folder,
                    color: Colors.orange[600],
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      pasta['nome'] ?? 'Pasta sem nome',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[700],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Conteúdos da pasta
          if (isExpanded) ...[
            Container(
              padding: EdgeInsets.only(left: 12, right: 12, bottom: 12),
              child: Column(
                children: [
                  if (conteudos.isNotEmpty)
                    ...conteudos
                        .map((conteudo) => _buildConteudoItem(conteudo))
                        .toList()
                  else
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Icon(
                            Icons.description,
                            size: 32,
                            color: Colors.grey[400],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Pasta vazia',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConteudoItem(Map<String, dynamic> conteudo) {
    final tipo = conteudo['tipo']?.toLowerCase();
    final icon = _getTipoConteudoIcon(tipo);
    final color = _getTipoConteudoColor(tipo);
    final temAcesso = podeAcederConteudos;

    return Container(
      margin: EdgeInsets.only(bottom: 4, left: 20),
      child: Card(
        elevation: 1,
        child: ListTile(
          dense: true,
          onTap: temAcesso
              ? () {
                  print('Clique detectado no conteúdo: ${conteudo['titulo']}');
                  _handleConteudoClick(conteudo);
                }
              : () {
                  print('Acesso negado - mostrando dialog');
                  _showAccessDeniedDialog();
                },
          leading: Container(
            padding: EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              icon,
              color: color,
              size: 16,
            ),
          ),
          title: Text(
            conteudo['titulo'] ?? 'Sem título',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 13,
              color: temAcesso ? Colors.black87 : Colors.grey[600],
            ),
          ),
          subtitle:
              conteudo['descricao'] != null && conteudo['descricao'].isNotEmpty
                  ? Text(
                      conteudo['descricao'],
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: temAcesso ? Colors.grey[700] : Colors.grey[500],
                      ),
                    )
                  : null,
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!temAcesso)
                Icon(
                  Icons.lock,
                  color: Colors.grey[400],
                  size: 16,
                )
              else
                Icon(
                  Icons.open_in_new,
                  color: Colors.grey[600],
                  size: 16,
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
            'A carregar conteúdo do curso...',
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
              onPressed: _fetchTopicos,
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
              Icons.library_books_outlined,
              color: Colors.grey[400],
              size: 64,
            ),
            SizedBox(height: 16),
            Text(
              'Nenhum conteúdo disponível',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Este curso ainda não possui conteúdos publicados.',
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

  Widget _buildAccessDeniedWidget() {
    return Center(
      child: Container(
        padding: EdgeInsets.all(24),
        margin: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange[200]!),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.lock_outline,
              color: Colors.orange[600],
              size: 64,
            ),
            SizedBox(height: 16),
            Text(
              'Acesso Restrito',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.orange[700],
              ),
            ),
            SizedBox(height: 8),
            Text(
              mensagemBloqueio,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.orange[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
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
                Icon(Icons.library_books, color: Colors.blue),
                SizedBox(width: 8),
                Text(
                  'Conteúdos do Curso',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Spacer(),
                IconButton(
                  onPressed: _fetchTopicos,
                  icon: Icon(Icons.refresh),
                  tooltip: 'Atualizar',
                ),
              ],
            ),
          ),

          // Conteúdo principal
          Expanded(
            child: loading
                ? _buildLoadingWidget()
                : error != null
                    ? _buildErrorWidget()
                    : !podeAcederConteudos
                        ? _buildAccessDeniedWidget()
                        : topicos.isEmpty
                            ? _buildEmptyWidget()
                            : RefreshIndicator(
                                onRefresh: _fetchTopicos,
                                child: ListView.builder(
                                  padding: EdgeInsets.all(16),
                                  itemCount: topicos.length,
                                  itemBuilder: (context, index) {
                                    return _buildTopicoItem(topicos[index]);
                                  },
                                ),
                              ),
          ),
        ],
      ),
    );
  }
}
