import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notificacoes_provider.dart';
import '../components/sidebar_screen.dart';
import '../components/navbar_screen.dart';

class NotificacoesScreen extends StatefulWidget {
  const NotificacoesScreen({Key? key}) : super(key: key);

  @override
  State<NotificacoesScreen> createState() => _NotificacoesScreenState();
}

class _NotificacoesScreenState extends State<NotificacoesScreen> {
  String? _message;
  bool _showMessage = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _carregarNotificacoes();
    });
  }

  Future<void> _carregarNotificacoes() async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    await provider.buscarNotificacoes();
  }

  void _mostrarMensagem(String mensagem) {
    setState(() {
      _message = mensagem;
      _showMessage = true;
    });

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showMessage = false;
        });
      }
    });
  }

  Future<void> _marcarComoLida(int idNotificacao) async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    final result = await provider.marcarComoLida(idNotificacao);
    _mostrarMensagem(result['message'] ?? 'Notificação marcada como lida');
  }

  Future<void> _marcarTodasComoLidas() async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    final result = await provider.marcarTodasComoLidas();
    _mostrarMensagem(
        result['message'] ?? 'Todas as notificações foram marcadas como lidas');
  }

  // ✅ CORRIGIDO: Navegação para as páginas corretas
  void _navegarParaItem(Map<String, dynamic> notificacao) {
    if (notificacao['notificacao'] == null) {
      debugPrint('Dados de notificação inválidos: $notificacao');
      return;
    }

    final dados = notificacao['notificacao'];
    final tipo = dados['tipo'];
    final idReferencia = dados['id_referencia'];

    if (idReferencia == null) {
      debugPrint('ID de referência não encontrado na notificação');
      return;
    }

    debugPrint('Navegando para item de notificação: $notificacao');
    debugPrint('Tipo: $tipo, ID: $idReferencia');

    switch (tipo) {
      case 'curso_adicionado':
      case 'formador_alterado':
      case 'data_curso_alterada':
        // ✅ CORRIGIDO: Usar rota '/curso' (singular) com arguments
        Navigator.pushNamed(
          context,
          '/curso',
          arguments: idReferencia.toString(),
        );
        break;
      case 'formador_criado':
        // Para formadores, manter a navegação original ou ajustar conforme necessário
        Navigator.pushNamed(context, '/formadores/$idReferencia');
        break;
      case 'admin_criado':
        // Para admin, manter a navegação original ou ajustar conforme necessário
        Navigator.pushNamed(context, '/admin/users/$idReferencia');
        break;
      default:
        debugPrint('Tipo de notificação não reconhecido: $tipo');
        _mostrarMensagem('Tipo de notificação não suportado');
    }
  }

  Color _getNotificacaoCorDeFundo(String tipo, bool lida) {
    final baseColor = _getNotificacaoColor(tipo);
    return lida ? baseColor.withOpacity(0.1) : baseColor.withOpacity(0.2);
  }

  Color _getNotificacaoColor(String tipo) {
    switch (tipo) {
      case 'curso_adicionado':
        return Colors.blue;
      case 'formador_alterado':
      case 'formador_criado':
        return Colors.orange;
      case 'admin_criado':
        return Colors.purple;
      case 'data_curso_alterada':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      // ✅ ADICIONADO: Navbar sempre visível
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: null, // Você pode passar dados do usuário se disponível
        ),
      ),
      // ✅ ADICIONADO: Sidebar sem navbar integrada
      drawer: const SidebarScreen(
        currentRoute: '/notificacoes',
      ),
      body: Consumer<NotificacoesProvider>(
        builder: (context, provider, child) {
          return RefreshIndicator(
            onRefresh: provider.recarregarNotificacoes,
            child: Column(
              children: [
                // Header das notificações
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Notificações',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          if (provider.notificacoesNaoLidas > 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${provider.notificacoesNaoLidas}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (provider.notificacoesNaoLidas > 0)
                        ElevatedButton.icon(
                          onPressed: _marcarTodasComoLidas,
                          icon: const Icon(Icons.done_all, size: 16),
                          label: const Text('Marcar todas como lidas'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF8000),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                          ),
                        ),
                    ],
                  ),
                ),

                // Conteúdo principal
                Expanded(
                  child: _buildContent(provider),
                ),

                // Toast message
                if (_showMessage && _message != null)
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.white),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _message!,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent(NotificacoesProvider provider) {
    if (provider.loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFFFF8000)),
            SizedBox(height: 16),
            Text('Carregando notificações...'),
          ],
        ),
      );
    }

    if (provider.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              provider.error!,
              style: const TextStyle(fontSize: 16, color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _carregarNotificacoes,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }

    if (provider.notificacoes.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Você não tem notificações.',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: provider.notificacoes.length,
      itemBuilder: (context, index) {
        final notificacao = provider.notificacoes[index];
        return _buildNotificacaoItem(notificacao, provider);
      },
    );
  }

  Widget _buildNotificacaoItem(
      Map<String, dynamic> notificacao, NotificacoesProvider provider) {
    // Verificar estrutura da notificação
    if (notificacao['notificacao'] == null) {
      debugPrint('Notificação inválida: $notificacao');
      return const SizedBox.shrink();
    }

    final dados = notificacao['notificacao'];
    final tipo = dados['tipo'] ?? '';
    final titulo = dados['titulo'] ?? '';
    final mensagem = dados['mensagem'] ?? '';
    final dataCriacao = dados['data_criacao'];
    final idReferencia = dados['id_referencia'];
    final lida = notificacao['lida'] ?? false;
    final idNotificacao = notificacao['id_notificacao'] ?? notificacao['id'];

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: lida ? Colors.grey[300]! : _getNotificacaoColor(tipo),
          width: lida ? 1 : 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: idReferencia != null
            ? () {
                debugPrint('🔄 Clicando na notificação: $titulo');
                _navegarParaItem(notificacao);
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Ícone da notificação
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getNotificacaoCorDeFundo(tipo, lida),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Center(
                  child: Text(
                    provider.getNotificacaoIcon(tipo),
                    style: const TextStyle(fontSize: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Conteúdo da notificação
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      titulo,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: lida ? FontWeight.normal : FontWeight.bold,
                        color: lida ? Colors.grey[700] : Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      mensagem,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.access_time,
                            size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Text(
                          provider.formatRelativeTime(dataCriacao),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                        if (idReferencia != null) ...[
                          const SizedBox(width: 16),
                          Text(
                            'Ver detalhes',
                            style: TextStyle(
                              fontSize: 12,
                              color: _getNotificacaoColor(tipo),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Botão para marcar como lida
              if (!lida && idNotificacao != null)
                IconButton(
                  icon: const Icon(Icons.check_circle_outline),
                  color: _getNotificacaoColor(tipo),
                  onPressed: () => _marcarComoLida(idNotificacao),
                  tooltip: 'Marcar como lida',
                ),
            ],
          ),
        ),
      ),
    );
  }
}
