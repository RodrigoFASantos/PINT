import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class CursoDetailScreen extends StatefulWidget {
  final int cursoId;

  const CursoDetailScreen({Key? key, required this.cursoId}) : super(key: key);

  @override
  _CursoDetailScreenState createState() => _CursoDetailScreenState();
}

class _CursoDetailScreenState extends State<CursoDetailScreen> {
  Map<String, dynamic>? _curso;
  bool _loading = true;
  bool _inscrito = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _carregarCurso();
    _verificarInscricao();
  }

  Future<void> _carregarCurso() async {
    try {
      final curso = await ApiService().getCurso(widget.cursoId);
      setState(() {
        _curso = curso;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar detalhes do curso';
        _loading = false;
      });
    }
  }

  Future<void> _verificarInscricao() async {
    try {
      final inscrito = await ApiService().verificarInscricao(widget.cursoId);
      setState(() => _inscrito = inscrito);
    } catch (e) {
      // Ignorar erro na verificação
    }
  }

  Future<void> _inscreverCurso() async {
    try {
      await ApiService().inscreverCurso(widget.cursoId);

      setState(() => _inscrito = true);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Inscrição realizada com sucesso!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro na inscrição: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _mostrarConfirmacaoInscricao() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirmar Inscrição'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Deseja inscrever-se no curso:'),
            SizedBox(height: 8),
            Text(
              _curso!['nome'] ?? '',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            if (_curso!['data_inicio'] != null) ...[
              SizedBox(height: 8),
              Text('Data de início: ${_formatDate(_curso!['data_inicio'])}'),
            ],
            if (_curso!['data_limite_inscricao'] != null) ...[
              SizedBox(height: 4),
              Text(
                  'Limite de inscrição: ${_formatDate(_curso!['data_limite_inscricao'])}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _inscreverCurso();
            },
            child: Text('Confirmar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Detalhes do Curso'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_error != null || _curso == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Detalhes do Curso'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, color: Colors.red, size: 48),
              SizedBox(height: 16),
              Text(_error ?? 'Curso não encontrado'),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _carregarCurso,
                child: Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    final estado = _curso!['estado'] ?? 'Disponível';
    final podeInscrever =
        estado == 'Disponível' && !_inscrito && _podeInscrever();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // AppBar com imagem
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    ApiService.cursoImagem(_curso!['nome'] ?? ''),
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.primary, AppColors.secondary],
                          ),
                        ),
                        child:
                            Icon(Icons.school, size: 80, color: Colors.white),
                      );
                    },
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.3),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Conteúdo
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Título e estado
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          _curso!['nome'] ?? 'Sem nome',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getStatusColor(estado),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          estado,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: 16),

                  // Informações principais
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow('Categoria',
                            _curso!['categoria']?['nome'] ?? 'N/A'),
                        if (_curso!['area']?['nome'] != null)
                          _buildInfoRow('Área', _curso!['area']['nome']),
                        if (_curso!['formador']?['nome'] != null)
                          _buildInfoRow(
                              'Formador', _curso!['formador']['nome']),
                        if (_curso!['tipo'] != null)
                          _buildInfoRow('Tipo', _curso!['tipo']),
                        if (_curso!['data_inicio'] != null)
                          _buildInfoRow('Data de início',
                              _formatDate(_curso!['data_inicio'])),
                        if (_curso!['data_fim'] != null)
                          _buildInfoRow(
                              'Data de fim', _formatDate(_curso!['data_fim'])),
                        if (_curso!['data_limite_inscricao'] != null)
                          _buildInfoRow('Limite de inscrição',
                              _formatDate(_curso!['data_limite_inscricao'])),
                        if (_curso!['vagas_total'] != null)
                          _buildInfoRow('Vagas',
                              '${_curso!['vagas_disponiveis'] ?? 0}/${_curso!['vagas_total']}'),
                        if (_curso!['numero_horas'] != null)
                          _buildInfoRow(
                              'Duração', '${_curso!['numero_horas']} horas'),
                      ],
                    ),
                  ),

                  SizedBox(height: 20),

                  // Descrição
                  if (_curso!['descricao'] != null) ...[
                    Text(
                      'Descrição',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Text(
                        _curso!['descricao'],
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.black54,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],

                  SizedBox(height: 30),

                  // Botão de inscrição
                  if (podeInscrever)
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _mostrarConfirmacaoInscricao,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add),
                            SizedBox(width: 8),
                            Text(
                              'Inscrever-me',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else if (_inscrito)
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green[200]!),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Colors.green[600]),
                          SizedBox(width: 8),
                          Text(
                            'Já está inscrito neste curso',
                            style: TextStyle(
                              color: Colors.green[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange[200]!),
                      ),
                      child: Text(
                        _getStatusMessage(estado),
                        style: TextStyle(
                          color: Colors.orange[700],
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
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

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _podeInscrever() {
    if (_curso!['data_limite_inscricao'] != null) {
      final dataLimite = DateTime.tryParse(_curso!['data_limite_inscricao']);
      if (dataLimite != null && DateTime.now().isAfter(dataLimite)) {
        return false;
      }
    }

    final vagas = _curso!['vagas_disponiveis'] ?? 0;
    return vagas > 0;
  }

  String _getStatusMessage(String estado) {
    switch (estado.toLowerCase()) {
      case 'terminado':
        return 'Este curso já terminou';
      case 'em curso':
        return 'Este curso já está em decorrer';
      case 'lotado':
        return 'Este curso está lotado';
      default:
        if (!_podeInscrever()) {
          return 'Prazo de inscrição expirado';
        }
        return 'Inscrições não disponíveis';
    }
  }

  Color _getStatusColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'disponível':
        return AppColors.statusDisponivel;
      case 'em curso':
        return AppColors.statusEmCurso;
      case 'terminado':
        return AppColors.statusTerminado;
      case 'lotado':
        return AppColors.statusLotado;
      default:
        return AppColors.primary;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
