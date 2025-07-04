import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';

class PercursoFormativoScreen extends StatefulWidget {
  @override
  _PercursoFormativoScreenState createState() =>
      _PercursoFormativoScreenState();
}

class _PercursoFormativoScreenState extends State<PercursoFormativoScreen> {
  final _apiService = ApiService();

  List<dynamic> _cursosAgendados = [];
  List<dynamic> _cursosEmAndamento = [];
  List<dynamic> _cursosCompletos = [];
  Map<String, dynamic>? _currentUser;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPercursoFormativo();
  }

  Future<void> _loadPercursoFormativo() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carregar dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carregar inscrições
      final inscricoes = await _apiService.getMinhasInscricoes();

      debugPrint('🔍 [PERCURSO] Dados do utilizador: $userData');
      debugPrint(
          '🔍 [PERCURSO] Inscrições recebidas: ${inscricoes?.length ?? 0}');

      if (inscricoes != null && inscricoes.isNotEmpty) {
        // Log da primeira inscrição para debug
        debugPrint('🔍 [PERCURSO] Primeira inscrição: ${inscricoes[0]}');
        _organizarCursosPorStatus(inscricoes);
      } else {
        debugPrint('❌ [PERCURSO] Nenhuma inscrição encontrada');
      }

      setState(() {
        _currentUser = userData;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ [PERCURSO] Erro ao carregar: $e');
      setState(() {
        _error = 'Erro ao carregar cursos: $e';
        _isLoading = false;
      });
    }
  }

  void _organizarCursosPorStatus(List<dynamic> inscricoes) {
    final hoje = DateTime.now();
    final agendados = <dynamic>[];
    final emAndamento = <dynamic>[];
    final completos = <dynamic>[];

    debugPrint('🔄 [ORGANIZAR] Organizando ${inscricoes.length} inscrições');

    for (var inscricao in inscricoes) {
      debugPrint(
          '🔍 [CURSO] Processando: ${inscricao['nomeCurso']} - Status: ${inscricao['status']}');

      final curso = {
        'id': inscricao['cursoId'],
        'titulo': inscricao['nomeCurso'] ?? 'Sem título',
        'categoria': inscricao['categoria'] ?? 'Não especificada',
        'area': inscricao['area'] ?? 'Não especificada',
        'dataInicio': inscricao['dataInicio'],
        'dataFim': inscricao['dataFim'],
        'horasCurso': inscricao['cargaHoraria'] ?? 0,
        'horasPresenca': inscricao['horasPresenca'] ?? 0,
        'notaFinal': inscricao['notaFinal'],
        'status': inscricao['status'] ?? 'inscrito',
        'imagem_path': inscricao['imagem_path'],
      };

      debugPrint('📋 [CURSO] Mapeado: $curso');

      // Determinar status baseado nos dados da API
      final status =
          inscricao['status']?.toString().toLowerCase() ?? 'inscrito';

      if (status == 'concluído' || status == 'concluido') {
        debugPrint('✅ [STATUS] Curso ${curso['titulo']} -> COMPLETO');
        completos.add(curso);
      } else if (status == 'agendado') {
        debugPrint('📅 [STATUS] Curso ${curso['titulo']} -> AGENDADO');
        agendados.add(curso);
      } else {
        // Verificar por datas se o status não estiver claro
        final dataInicio = inscricao['dataInicio'] != null
            ? DateTime.tryParse(inscricao['dataInicio'])
            : null;
        final dataFim = inscricao['dataFim'] != null
            ? DateTime.tryParse(inscricao['dataFim'])
            : null;

        if (dataInicio != null && dataInicio.isAfter(hoje)) {
          debugPrint(
              '📅 [STATUS] Curso ${curso['titulo']} -> AGENDADO (por data)');
          agendados.add(curso);
        } else if (dataFim != null &&
            dataFim.isBefore(hoje) &&
            inscricao['notaFinal'] != null) {
          debugPrint(
              '✅ [STATUS] Curso ${curso['titulo']} -> COMPLETO (por data + nota)');
          completos.add(curso);
        } else {
          debugPrint('🔄 [STATUS] Curso ${curso['titulo']} -> EM ANDAMENTO');
          emAndamento.add(curso);
        }
      }
    }

    debugPrint(
        '📊 [RESULTADO] Agendados: ${agendados.length}, Em andamento: ${emAndamento.length}, Completos: ${completos.length}');

    setState(() {
      _cursosAgendados = agendados;
      _cursosEmAndamento = emAndamento;
      _cursosCompletos = completos;
    });
  }

  /// Método para gerar URL do certificado (alinhado com React)
  String? _getCertificadoUrl(String email, String nomeCurso) {
    try {
      debugPrint('🔍 [CERTIFICADO] === DEBUG CERTIFICADO ===');
      debugPrint('🔍 [CERTIFICADO] Email recebido: $email');
      debugPrint('🔍 [CERTIFICADO] Título do curso: $nomeCurso');
      debugPrint('🔍 [CERTIFICADO] API Base: ${_apiService.apiBase}');

      // Verificar se o email existe e não está vazio
      if (email.isEmpty || email.trim().isEmpty) {
        debugPrint('❌ [CERTIFICADO] Email vazio ou inválido');
        return null;
      }

      // Formatar email: @ vira _at_ e . vira _ (igual ao React)
      final emailFormatado = email.replaceAll('@', '_at_').replaceAll('.', '_');

      // Formatação simples do nome do curso (igual ao React)
      final cursoNomeFormatado = nomeCurso.replaceAll(RegExp(r'\s+'), '_');

      final nomeCertificado = 'certificado_$cursoNomeFormatado.pdf';
      final url =
          '${_apiService.apiBase}/uploads/users/$emailFormatado/certificados/$nomeCertificado';

      debugPrint('📜 [CERTIFICADO] Email formatado: $emailFormatado');
      debugPrint('📜 [CERTIFICADO] Curso formatado: $cursoNomeFormatado');
      debugPrint('📜 [CERTIFICADO] Nome do certificado: $nomeCertificado');
      debugPrint('📜 [CERTIFICADO] URL final gerada: $url');
      debugPrint('📜 [CERTIFICADO] ========================');

      return url;
    } catch (e) {
      debugPrint('❌ [CERTIFICADO] Erro ao gerar URL: $e');
      return null;
    }
  }

  /// Método para obter email do usuário (com múltiplas fontes)
  String? _getUserEmail() {
    try {
      // 1. Tentar obter do currentUser
      String? email = _currentUser?['email']?.toString();
      if (email != null && email.trim().isNotEmpty) {
        debugPrint('✅ [EMAIL] Encontrado em currentUser: $email');
        return email.trim();
      }

      // 2. Se não encontrou, logs de debug para investigar
      debugPrint('⚠️ [EMAIL] Não encontrado em currentUser');
      debugPrint('🔍 [EMAIL] currentUser completo: $_currentUser');
      debugPrint('🔍 [EMAIL] currentUser keys: ${_currentUser?.keys.toList()}');

      // 3. Verificar outras possíveis chaves
      final possibleKeys = ['email', 'user_email', 'userEmail', 'e_mail'];
      for (String key in possibleKeys) {
        final value = _currentUser?[key]?.toString();
        if (value != null && value.trim().isNotEmpty) {
          debugPrint('✅ [EMAIL] Encontrado em $key: $value');
          return value.trim();
        }
      }

      debugPrint('❌ [EMAIL] Nenhum email encontrado no currentUser');
      return null;
    } catch (e) {
      debugPrint('❌ [EMAIL] Erro ao obter email: $e');
      return null;
    }
  }

  /// Método para ver certificado
  Future<void> _verCertificado(Map<String, dynamic> curso) async {
    try {
      debugPrint(
          '🎯 [CERTIFICADO] Iniciando visualização para: ${curso['titulo']}');

      // Obter email usando método
      final email = _getUserEmail();
      if (email == null) {
        _showCertificadoError(
          'Email não encontrado',
          'Não foi possível obter o email do usuário.\n\n'
              'Dados do usuário atual:\n${_currentUser.toString()}\n\n'
              'Tente fazer logout e login novamente.',
        );
        return;
      }

      final url = _getCertificadoUrl(email, curso['titulo']);
      if (url == null) {
        _showCertificadoError(
          'Erro na URL',
          'Não foi possível gerar a URL do certificado.\n\n'
              'Email: $email\n'
              'Curso: ${curso['titulo']}',
        );
        return;
      }

      debugPrint('🚀 [CERTIFICADO] Tentando abrir URL: $url');

      // ESTRATÉGIA CORRIGIDA: Tentar abrir direto primeiro
      try {
        final uri = Uri.parse(url);

        // Verificar se pode abrir
        final canLaunch = await canLaunchUrl(uri);
        debugPrint('🔍 [CERTIFICADO] Pode abrir externamente: $canLaunch');

        if (canLaunch) {
          final launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );
          debugPrint('✅ [CERTIFICADO] Aberto externamente: $launched');

          if (launched) {
            // Mostrar confirmação de sucesso
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Certificado aberto no navegador externo'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
            return;
          }
        }

        // Se chegou aqui, usar WebView como fallback
        debugPrint('🌐 [CERTIFICADO] Usando WebView como fallback');
        _abrirComWebViewInterna(url, curso['titulo']);
      } catch (e) {
        debugPrint('❌ [CERTIFICADO] Erro ao abrir externamente: $e');
        // Fallback para WebView
        _abrirComWebViewInterna(url, curso['titulo']);
      }
    } catch (e) {
      debugPrint('❌ [CERTIFICADO] Erro inesperado: $e');
      _showCertificadoError(
        'Erro inesperado',
        'Ocorreu um erro ao tentar abrir o certificado:\n\n$e\n\n'
            'Tente novamente ou contate o suporte.',
      );
    }
  }

  /// WebView para certificados
  void _abrirComWebViewInterna(String url, String nomeCurso) {
    debugPrint('🌐 [CERTIFICADO] Abrindo com WebView interna: $url');

    // Mostrar aviso que está abrindo na WebView
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Abrindo certificado na visualização interna...'),
        backgroundColor: Colors.orange,
        duration: Duration(seconds: 2),
      ),
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _CertificadoWebViewScreen(
          url: url,
          titulo: 'Certificado - $nomeCurso',
          originalUrl: url, // URL original para botão de abertura externa
        ),
      ),
    );
  }

  /// Dialog de erro
  void _showCertificadoError(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 24),
            SizedBox(width: 8),
            Expanded(child: Text(title)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(message),
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Informações técnicas:',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Email atual: ${_getUserEmail() ?? 'não encontrado'}',
                      style: TextStyle(fontSize: 11, fontFamily: 'monospace'),
                    ),
                    Text(
                      'API Base: ${_apiService.apiBase}',
                      style: TextStyle(fontSize: 11, fontFamily: 'monospace'),
                    ),
                    Text(
                      'User keys: ${_currentUser?.keys.join(', ') ?? 'nenhuma'}',
                      style: TextStyle(fontSize: 11, fontFamily: 'monospace'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Fechar'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Recarregar dados do usuário
              _loadPercursoFormativo();
            },
            child: Text('Recarregar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Tentar novamente
              //  pode implementar uma lógica para tentar novamente aqui
            },
            child: Text('Tentar novamente'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFFFF8000),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursoCard(Map<String, dynamic> curso, String tipo) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _showCursoDetails(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header do curso
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: _getStatusColor(tipo),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _getStatusIcon(tipo),
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          curso['titulo'],
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${curso['categoria']} • ${curso['area']}',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Detalhes específicos por tipo
              if (tipo == 'completo') ...[
                _buildCursoConcluido(curso),
              ] else ...[
                _buildCursoBasico(curso),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCursoConcluido(Map<String, dynamic> curso) {
    final notaFinal = curso['notaFinal'];
    final horasCurso = curso['horasCurso'] ?? 0;
    final horasPresenca = curso['horasPresenca'] ?? 0;
    final percentualPresenca =
        horasCurso > 0 ? ((horasPresenca / horasCurso) * 100).round() : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Nota final
        if (notaFinal != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.grade,
                  color: Colors.green.shade700,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Nota: $notaFinal/20',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ] else ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.help_outline,
                  color: Colors.grey.shade600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Nota: Não avaliado',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Informações de horas
        _buildInfoRow('Carga horária:', '${horasCurso}h'),
        if (horasPresenca > 0) ...[
          _buildInfoRow('Presença:', '${horasPresenca}h'),
          _buildInfoRow('Assiduidade:', '$percentualPresenca%'),
        ] else ...[
          _buildInfoRow('Presença:', 'Não registrada'),
        ],

        const SizedBox(height: 16),

        // Botão de certificado
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => _verCertificado(curso),
            icon: const Icon(Icons.verified),
            label: const Text('Ver Certificado'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCursoBasico(Map<String, dynamic> curso) {
    final dataInicio = curso['dataInicio'];
    final dataFim = curso['dataFim'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (dataInicio != null || dataFim != null) ...[
          Row(
            children: [
              Icon(
                Icons.calendar_today,
                size: 16,
                color: Colors.grey.shade600,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _formatPeriodoCurso(dataInicio, dataFim),
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
        ],
        if (curso['horasCurso'] != null && curso['horasCurso'] > 0) ...[
          _buildInfoRow('Carga horária:', '${curso['horasCurso']}h'),
        ],
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String tipo) {
    switch (tipo) {
      case 'agendado':
        return Colors.blue;
      case 'andamento':
        return Colors.orange;
      case 'completo':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String tipo) {
    switch (tipo) {
      case 'agendado':
        return Icons.schedule;
      case 'andamento':
        return Icons.play_circle;
      case 'completo':
        return Icons.check_circle;
      default:
        return Icons.school;
    }
  }

  String _formatPeriodoCurso(String? dataInicio, String? dataFim) {
    if (dataInicio == null && dataFim == null) return 'Datas não definidas';

    final inicio = dataInicio != null ? _formatDate(dataInicio) : '?';
    final fim = dataFim != null ? _formatDate(dataFim) : '?';

    return '$inicio - $fim';
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

  void _showCursoDetails(Map<String, dynamic> curso) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['titulo']),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: ${curso['categoria']}'),
            const SizedBox(height: 8),
            Text('Área: ${curso['area']}'),
            const SizedBox(height: 8),
            Text('Status: ${curso['status'] ?? 'N/A'}'),
            if (curso['notaFinal'] != null) ...[
              const SizedBox(height: 8),
              Text('Nota Final: ${curso['notaFinal']}/20',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
            if (curso['horasPresenca'] != null &&
                curso['horasPresenca'] > 0) ...[
              const SizedBox(height: 8),
              Text('Horas de Presença: ${curso['horasPresenca']}h'),
            ],
            if (curso['horasCurso'] != null && curso['horasCurso'] > 0) ...[
              const SizedBox(height: 8),
              Text('Carga Horária: ${curso['horasCurso']}h'),
            ],
            if (curso['dataInicio'] != null) ...[
              const SizedBox(height: 8),
              Text('Início: ${_formatDate(curso['dataInicio'])}'),
            ],
            if (curso['dataFim'] != null) ...[
              const SizedBox(height: 8),
              Text('Fim: ${_formatDate(curso['dataFim'])}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  Widget _buildSecao(String titulo, List<dynamic> cursos, String tipo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            titulo,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        if (cursos.isEmpty) ...[
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(
                    _getStatusIcon(tipo),
                    size: 48,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _getEmptyMessage(tipo),
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: cursos
                  .map((curso) =>
                      _buildCursoCard(curso as Map<String, dynamic>, tipo))
                  .toList(),
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  String _getEmptyMessage(String tipo) {
    switch (tipo) {
      case 'agendado':
        return ' não tem cursos agendados.';
      case 'andamento':
        return ' não está inscrito em nenhum curso atualmente.';
      case 'completo':
        return ' ainda não concluiu nenhum curso.';
      default:
        return 'Nenhum curso encontrado.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meu Percurso Formativo'),
        backgroundColor: const Color(0xFFFF8000),
      ),
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/percurso-formativo',
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade300,
                      ),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadPercursoFormativo,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadPercursoFormativo,
                  color: const Color(0xFFFF8000),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        const SizedBox(height: 16),
                        _buildSecao(
                            'Cursos Agendados', _cursosAgendados, 'agendado'),
                        _buildSecao('Cursos em Andamento', _cursosEmAndamento,
                            'andamento'),
                        _buildSecao(
                            'Cursos Concluídos', _cursosCompletos, 'completo'),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }
}

// WebView Screen para certificados
class _CertificadoWebViewScreen extends StatefulWidget {
  final String url;
  final String titulo;
  final String? originalUrl;

  const _CertificadoWebViewScreen({
    required this.url,
    required this.titulo,
    this.originalUrl,
  });

  @override
  State<_CertificadoWebViewScreen> createState() =>
      _CertificadoWebViewScreenState();
}

class _CertificadoWebViewScreenState extends State<_CertificadoWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _error;
  int _currentViewMode = 0; // 0 = Google Docs Viewer, 1 = URL direta

  final List<String> _viewModes = [
    'Google Docs Viewer',
    'URL Direta',
  ];

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    String urlToLoad;

    if (_currentViewMode == 0) {
      // Usar Google Docs Viewer (modo padrão)
      final encodedUrl = Uri.encodeComponent(widget.originalUrl ?? widget.url);
      urlToLoad =
          'https://docs.google.com/viewer?url=$encodedUrl&embedded=true';
      debugPrint('🌐 [WEBVIEW] Carregando via Google Docs Viewer: $urlToLoad');
    } else {
      // URL direta
      urlToLoad = widget.originalUrl ?? widget.url;
      debugPrint('🌐 [WEBVIEW] Carregando URL direta: $urlToLoad');
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            debugPrint('🌐 [WEBVIEW] Página iniciada: $url');
          },
          onPageFinished: (String url) {
            debugPrint('✅ [WEBVIEW] Página carregada: $url');
            setState(() => _isLoading = false);
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('❌ [WEBVIEW] Erro: ${error.description}');
            setState(() {
              _error = 'Erro ao carregar certificado: ${error.description}';
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            debugPrint('🌐 [WEBVIEW] Navegação solicitada: ${request.url}');
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(urlToLoad));
  }

  void _changeViewMode() {
    setState(() {
      _currentViewMode = (_currentViewMode + 1) % _viewModes.length;
    });
    _initializeWebView();
  }

  Future<void> _openExternal() async {
    try {
      final url = widget.originalUrl ?? widget.url;
      final uri = Uri.parse(url);

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);

        // Mostrar confirmação
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Certificado aberto no navegador externo'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Não foi possível abrir no navegador externo'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ [WEBVIEW] Erro ao abrir externamente: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao abrir externamente: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.titulo,
          style: TextStyle(fontSize: 16),
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: const Color(0xFFFF8000),
        actions: [
          // Botão para trocar modo de visualização
          PopupMenuButton<int>(
            icon: Icon(Icons.view_module),
            tooltip: 'Modo de visualização',
            onSelected: (int mode) {
              if (mode != _currentViewMode) {
                setState(() => _currentViewMode = mode);
                _initializeWebView();
              }
            },
            itemBuilder: (context) => _viewModes.asMap().entries.map((entry) {
              final index = entry.key;
              final name = entry.value;
              return PopupMenuItem<int>(
                value: index,
                child: Row(
                  children: [
                    Icon(
                      index == _currentViewMode
                          ? Icons.check
                          : Icons.radio_button_unchecked,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(name),
                  ],
                ),
              );
            }).toList(),
          ),

          // Botão para abrir externamente
          IconButton(
            icon: const Icon(Icons.open_in_browser),
            tooltip: 'Abrir no navegador',
            onPressed: _openExternal,
          ),

          // Botão para recarregar
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Recarregar',
            onPressed: _initializeWebView,
          ),
        ],
      ),
      body: Column(
        children: [
          // Indicador do modo atual
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(8),
            color: Colors.grey.shade200,
            child: Text(
              'Modo: ${_viewModes[_currentViewMode]}',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
              textAlign: TextAlign.center,
            ),
          ),

          // Conteúdo principal
          Expanded(
            child: _error != null
                ? _buildErrorWidget()
                : Stack(
                    children: [
                      WebViewWidget(controller: _controller),
                      if (_isLoading) _buildLoadingWidget(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return Container(
      color: Colors.white,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
            ),
            SizedBox(height: 16),
            Text('Carregando certificado...'),
            SizedBox(height: 8),
            Text(
              'Isso pode levar alguns segundos',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red.shade300,
            ),
            SizedBox(height: 16),
            Text(
              'Erro ao carregar certificado',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600),
            ),
            SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: _initializeWebView,
                  icon: Icon(Icons.refresh),
                  label: Text('Tentar novamente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFFFF8000),
                    foregroundColor: Colors.white,
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _openExternal,
                  icon: Icon(Icons.open_in_browser),
                  label: Text('Abrir externamente'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
