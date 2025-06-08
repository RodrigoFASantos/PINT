import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../main.dart'; // Para AppUtils
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

      if (inscricoes != null) {
        _organizarCursosPorStatus(inscricoes);
      }

      setState(() {
        _currentUser = userData;
        _isLoading = false;
      });
    } catch (e) {
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

    for (var inscricao in inscricoes) {
      final curso = {
        'id': inscricao['cursoId'],
        'titulo': inscricao['nomeCurso'],
        'categoria': inscricao['categoria'] ?? 'Não especificada',
        'area': inscricao['area'] ?? 'Não especificada',
        'dataInicio': inscricao['dataInicio'],
        'dataFim': inscricao['dataFim'],
        'horasCurso': inscricao['cargaHoraria'] ?? 0,
        'horasPresenca': inscricao['horasPresenca'],
        'notaFinal': inscricao['notaFinal'],
        'status': inscricao['status'],
        'imagem_path': inscricao['imagem_path'],
      };

      final dataInicio = inscricao['dataInicio'] != null
          ? DateTime.tryParse(inscricao['dataInicio'])
          : null;
      final dataFim = inscricao['dataFim'] != null
          ? DateTime.tryParse(inscricao['dataFim'])
          : null;

      if (dataInicio != null && dataInicio.isAfter(hoje)) {
        // Curso agendado (ainda não começou)
        agendados.add(curso);
      } else if (inscricao['status'] == 'Concluído' ||
          (dataFim != null && dataFim.isBefore(hoje))) {
        // Curso concluído
        completos.add(curso);
      } else {
        // Curso em andamento
        emAndamento.add(curso);
      }
    }

    setState(() {
      _cursosAgendados = agendados;
      _cursosEmAndamento = emAndamento;
      _cursosCompletos = completos;
    });
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
        if (horasPresenca != null) ...[
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
            if (curso['horasPresenca'] != null) ...[
              const SizedBox(height: 8),
              Text('Horas de Presença: ${curso['horasPresenca']}h'),
            ],
            if (curso['horasCurso'] != null) ...[
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
          if (curso['notaFinal'] == null) // Só mostra se não estiver concluído
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                AppUtils.showInfo(
                    context, 'Acesso ao curso em desenvolvimento');
              },
              child: const Text('Ver Curso'),
            ),
        ],
      ),
    );
  }

  void _verCertificado(Map<String, dynamic> curso) {
    // Simular geração de URL do certificado
    final cursoNome = curso['titulo'];

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Certificado'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.verified,
              size: 64,
              color: const Color(0xFFFF8000),
            ),
            const SizedBox(height: 16),
            Text(
              'Certificado do curso:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              cursoNome,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'Funcionalidade de download em desenvolvimento',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              AppUtils.showInfo(
                  context, 'Download do certificado em desenvolvimento');
            },
            icon: const Icon(Icons.download),
            label: const Text('Download'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF8000),
            ),
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
        return 'Você não tem cursos agendados.';
      case 'andamento':
        return 'Você não está inscrito em nenhum curso atualmente.';
      case 'completo':
        return 'Você ainda não concluiu nenhum curso.';
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
