import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/common/custom_sidebar.dart';
import '../../utils/constants.dart';

class NotificacoesScreen extends StatefulWidget {
  @override
  _NotificacoesScreenState createState() => _NotificacoesScreenState();
}

class _NotificacoesScreenState extends State<NotificacoesScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<dynamic> _notificacoes = [];
  bool _loading = true;
  String? _error;
  String _message = '';
  bool _showMessage = false;

  @override
  void initState() {
    super.initState();
    _buscarNotificacoes();
  }

  Future<void> _buscarNotificacoes() async {
    try {
      setState(() => _loading = true);

      final notificacoes = await ApiService.getNotificacoes();

      setState(() {
        _notificacoes = notificacoes;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar notificações';
        _loading = false;
      });
    }
  }

  Future<void> _marcarComoLida(int idNotificacao) async {
    try {
      await ApiService.marcarNotificacaoLida(idNotificacao);

      setState(() {
        // Atualizar estado local da notificação
        final index = _notificacoes.indexWhere(
            (n) => (n['id'] ?? n['id_notificacao']) == idNotificacao);
        if (index != -1) {
          _notificacoes[index]['lida'] = true;
        }
      });

      _showTemporaryMessage('Notificação marcada como lida');
    } catch (e) {
      _showTemporaryMessage('Erro ao marcar notificação como lida');
    }
  }

  Future<void> _marcarTodasComoLidas() async {
    try {
      // Marcar todas as não lidas
      final naoLidas = _notificacoes.where((n) => !n['lida']).toList();

      for (final notificacao in naoLidas) {
        final id = notificacao['id'] ?? notificacao['id_notificacao'];
        await ApiService.marcarNotificacaoLida(id);
      }

      setState(() {
        // Atualizar estado local
        for (final notificacao in _notificacoes) {
          notificacao['lida'] = true;
        }
      });

      _showTemporaryMessage('Todas as notificações foram marcadas como lidas');
    } catch (e) {
      _showTemporaryMessage('Erro ao marcar todas as notificações como lidas');
    }
  }

  void _showTemporaryMessage(String message) {
    setState(() {
      _message = message;
      _showMessage = true;
    });

    Future.delayed(Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _showMessage = false);
      }
    });
  }

  void _navegarParaItem(Map<String, dynamic> notificacao) {
    if (notificacao['notificacao'] == null) return;

    final tipo = notificacao['notificacao']['tipo'];
    final idReferencia = notificacao['notificacao']['id_referencia'];

    if (idReferencia == null) return;

    switch (tipo) {
      case 'curso_adicionado':
      case 'formador_alterado':
      case 'data_curso_alterada':
        Navigator.pushNamed(context, '/cursos/$idReferencia');
        break;
      case 'formador_criado':
        Navigator.pushNamed(context, '/formadores/$idReferencia');
        break;
      case 'admin_criado':
        Navigator.pushNamed(context, '/admin/users/$idReferencia');
        break;
    }
  }

  String _getNotificacaoIcon(String? tipo) {
    switch (tipo) {
      case 'curso_adicionado':
        return '📚';
      case 'formador_alterado':
        return '✏️';
      case 'formador_criado':
        return '👤';
      case 'admin_criado':
        return '👑';
      case 'data_curso_alterada':
        return '📅';
      default:
        return '🔔';
    }
  }

  Color _getNotificacaoColor(String? tipo) {
    switch (tipo) {
      case 'curso_adicionado':
        return Colors.blue;
      case 'formador_alterado':
      case 'formador_criado':
        return Colors.green;
      case 'admin_criado':
        return Colors.purple;
      case 'data_curso_alterada':
        return Colors.orange;
      default:
        return AppColors.primary;
    }
  }

  String _formatRelativeTime(String? dateString) {
    if (dateString == null) return 'data desconhecida';

    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inSeconds < 60) return 'há poucos segundos';
      if (difference.inMinutes < 60)
        return 'há ${difference.inMinutes} minuto${difference.inMinutes > 1 ? 's' : ''}';
      if (difference.inHours < 24)
        return 'há ${difference.inHours} hora${difference.inHours > 1 ? 's' : ''}';
      if (difference.inDays < 30)
        return 'há ${difference.inDays} dia${difference.inDays > 1 ? 's' : ''}';

      final months = (difference.inDays / 30).floor();
      return 'há $months mês${months > 1 ? 'es' : ''}';
    } catch (e) {
      return 'data inválida';
    }
  }

  int get _notificacoesNaoLidas =>
      _notificacoes.where((n) => !n['lida']).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: CustomSidebar(),
      appBar: AppBar(
        title: Row(
          children: [
            Text('Notificações'),
            if (_notificacoesNaoLidas > 0) ...[
              SizedBox(width: AppSpacing.sm),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _notificacoesNaoLidas.toString(),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_notificacoesNaoLidas > 0)
            TextButton(
              onPressed: _marcarTodasComoLidas,
              child: Text(
                'Marcar todas',
                style: TextStyle(color: Colors.white),
              ),
            ),
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _buscarNotificacoes,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Conteúdo principal
          RefreshIndicator(
            onRefresh: _buscarNotificacoes,
            child: _buildContent(),
          ),

          // Toast message
          if (_showMessage)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.success,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  _message,
                  style: TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: AppSpacing.md),
            Text('Carregando notificações...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: AppColors.error, size: 64),
            SizedBox(height: AppSpacing.md),
            Text(_error!, style: TextStyle(color: AppColors.error)),
            SizedBox(height: AppSpacing.md),
            ElevatedButton(
              onPressed: _buscarNotificacoes,
              child: Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }

    if (_notificacoes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 80, color: Colors.grey[400]),
            SizedBox(height: AppSpacing.lg),
            Text(
              'Você não tem notificações.',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: AppSpacing.sm),
            Text(
              'As suas notificações aparecerão aqui.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(AppSpacing.md),
      itemCount: _notificacoes.length,
      itemBuilder: (context, index) {
        final notificacao = _notificacoes[index];
        return _buildNotificacaoItem(notificacao);
      },
    );
  }

  Widget _buildNotificacaoItem(Map<String, dynamic> notificacao) {
    if (notificacao['notificacao'] == null) return SizedBox.shrink();

    final data = notificacao['notificacao'];
    final tipo = data['tipo'];
    final titulo = data['titulo'] ?? 'Notificação';
    final mensagem = data['mensagem'] ?? '';
    final dataCriacao = data['data_criacao'];
    final isLida = notificacao['lida'] ?? false;
    final temReferencia = data['id_referencia'] != null;
    final cor = _getNotificacaoColor(tipo);

    return Container(
      margin: EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: isLida ? Colors.white : cor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLida ? Colors.grey[300]! : cor.withOpacity(0.3),
          width: isLida ? 1 : 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: temReferencia ? () => _navegarParaItem(notificacao) : null,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                // Ícone da notificação
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: cor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      _getNotificacaoIcon(tipo),
                      style: TextStyle(fontSize: 24),
                    ),
                  ),
                ),

                SizedBox(width: AppSpacing.md),

                // Conteúdo da notificação
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titulo,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight:
                              isLida ? FontWeight.w500 : FontWeight.bold,
                          color: isLida ? Colors.black87 : Colors.black,
                        ),
                      ),
                      SizedBox(height: AppSpacing.xs),
                      Text(
                        mensagem,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          height: 1.3,
                        ),
                      ),
                      SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          Text(
                            _formatRelativeTime(dataCriacao),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                          ),
                          if (temReferencia) ...[
                            Spacer(),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: cor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'Ver detalhes',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cor,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                // Botão de marcar como lida
                if (!isLida)
                  Container(
                    margin: EdgeInsets.only(left: AppSpacing.sm),
                    child: IconButton(
                      onPressed: () {
                        final id =
                            notificacao['id'] ?? notificacao['id_notificacao'];
                        _marcarComoLida(id);
                      },
                      icon: Icon(Icons.check_circle_outline),
                      color: cor,
                      tooltip: 'Marcar como lida',
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
