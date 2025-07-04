import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notificacoes_provider.dart';
import '../components/sidebar_screen.dart';
import '../components/navbar_screen.dart';

/// Ecrã de Notificações
/// Este ecrã apresenta todas as notificações do utilizador
/// Permite marcar notificações como lidas e navegar para os respetivos conteúdos
class NotificacoesScreen extends StatefulWidget {
  const NotificacoesScreen({Key? key}) : super(key: key);

  @override
  State<NotificacoesScreen> createState() => _NotificacoesScreenState();
}

class _NotificacoesScreenState extends State<NotificacoesScreen> {
  // Variáveis para controlar as mensagens de feedback ao utilizador
  String? _message; // Mensagem a exibir
  bool _showMessage = false; // Controla se deve mostrar a mensagem

  @override
  void initState() {
    super.initState();
    // Executa o carregamento das notificações após o widget ser construído
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _carregarNotificacoes();
    });
  }

  /// Carrega as notificações do servidor
  /// Acede ao provider de notificações e solicita a lista atualizada
  Future<void> _carregarNotificacoes() async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    await provider.buscarNotificacoes();
  }

  /// Exibe uma mensagem temporária ao utilizador
  /// A mensagem aparece por 3 segundos e depois desaparece automaticamente
  void _mostrarMensagem(String mensagem) {
    setState(() {
      _message = mensagem;
      _showMessage = true;
    });

    // Remove a mensagem após 3 segundos
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showMessage = false;
        });
      }
    });
  }

  /// Marca uma notificação específica como lida
  /// Recebe o ID da notificação e chama o método correspondente no provider
  Future<void> _marcarComoLida(int idNotificacao) async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    final result = await provider.marcarComoLida(idNotificacao);
    _mostrarMensagem(result['message'] ?? 'Notificação marcada como lida');
  }

  /// Marca todas as notificações como lidas de uma só vez
  /// Útil quando o utilizador quer limpar todas as notificações não lidas
  Future<void> _marcarTodasComoLidas() async {
    final provider = Provider.of<NotificacoesProvider>(context, listen: false);
    final result = await provider.marcarTodasComoLidas();
    _mostrarMensagem(
        result['message'] ?? 'Todas as notificações foram marcadas como lidas');
  }

  /// Navega para o conteúdo relacionado com a notificação
  /// Analisa o tipo de notificação e redireciona para o ecrã apropriado
  void _navegarParaItem(Map<String, dynamic> notificacao) {
    // Verifica se a notificação tem dados válidos
    if (notificacao['notificacao'] == null) {
      debugPrint('Dados de notificação inválidos: $notificacao');
      return;
    }

    // Extrai os dados da notificação
    final dados = notificacao['notificacao'];
    final tipo = dados['tipo']; // Tipo da notificação (curso, formador, etc.)
    final idReferencia = dados['id_referencia']; // ID do item relacionado

    // Verifica se existe um ID de referência
    if (idReferencia == null) {
      debugPrint('ID de referência não encontrado na notificação');
      return;
    }

    debugPrint('Navegar para item de notificação: $notificacao');
    debugPrint('Tipo: $tipo, ID: $idReferencia');

    // Navega para o ecrã apropriado baseado no tipo de notificação
    switch (tipo) {
      case 'curso_':
      case 'formador_alterado':
      case 'data_curso_alterada':
        // Para notificações relacionadas com cursos
        Navigator.pushNamed(
          context,
          '/curso',
          arguments: idReferencia.toString(),
        );
        break;
      case 'formador_criado':
        // Para notificações sobre formadores
        Navigator.pushNamed(context, '/formadores/$idReferencia');
        break;
      case 'admin_criado':
        // Para notificações administrativas
        Navigator.pushNamed(context, '/admin/users/$idReferencia');
        break;
      default:
        // Tipo de notificação não reconhecido
        debugPrint('Tipo de notificação não reconhecido: $tipo');
        _mostrarMensagem('Tipo de notificação não suportado');
    }
  }

  /// Determina a cor de fundo da notificação baseada no tipo e estado
  /// Notificações não lidas têm uma opacidade maior
  Color _getNotificacaoCorDeFundo(String tipo, bool lida) {
    final baseColor = _getNotificacaoColor(tipo);
    return lida ? baseColor.withOpacity(0.1) : baseColor.withOpacity(0.2);
  }

  /// Define a cor principal da notificação baseada no seu tipo
  /// Cada tipo de notificação tem uma cor específica para fácil identificação
  Color _getNotificacaoColor(String tipo) {
    switch (tipo) {
      case 'curso_':
        return Colors.blue; // Azul para cursos
      case 'formador_alterado':
      case 'formador_criado':
        return Colors.orange; // Laranja para formadores
      case 'admin_criado':
        return Colors.purple; // Roxo para administração
      case 'data_curso_alterada':
        return Colors.green; // Verde para alterações de data
      default:
        return Colors.grey; // Cinzento para tipos desconhecidos
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50], // Fundo cinzento claro

      // Barra de navegação sempre visível no topo
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: null, // Pode passar dados do utilizador se disponível
        ),
      ),

      // Menu lateral (sidebar) sem barra de navegação integrada
      drawer: const SidebarScreen(
        currentRoute: '/notificacoes',
      ),

      // Corpo principal do ecrã
      body: Consumer<NotificacoesProvider>(
        builder: (context, provider, child) {
          return RefreshIndicator(
            // Permite atualizar as notificações puxando para baixo
            onRefresh: provider.recarregarNotificacoes,
            child: Column(
              children: [
                // Cabeçalho das notificações
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Título e contador de notificações não lidas
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
                          // Badge com número de notificações não lidas
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
                      // Botão para marcar todas as notificações como lidas
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

                // Área principal do conteúdo
                Expanded(
                  child: _buildContent(provider),
                ),

                // Mensagem toast (notificação temporária)
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

  /// Constrói o conteúdo principal do ecrã baseado no estado do provider
  /// Pode mostrar: loading, erro, lista vazia ou lista de notificações
  Widget _buildContent(NotificacoesProvider provider) {
    // Estado de carregamento
    if (provider.loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFFFF8000)),
            SizedBox(height: 16),
            Text('Carregar notificações...'),
          ],
        ),
      );
    }

    // Estado de erro
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

    // Estado de lista vazia
    if (provider.notificacoes.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Não tem notificações.',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    // Lista de notificações
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: provider.notificacoes.length,
      itemBuilder: (context, index) {
        final notificacao = provider.notificacoes[index];
        return _buildNotificacaoItem(notificacao, provider);
      },
    );
  }

  /// Constrói um item individual de notificação
  /// Cada notificação é apresentada como um cartão com informações e ações
  Widget _buildNotificacaoItem(
      Map<String, dynamic> notificacao, NotificacoesProvider provider) {
    // Verifica se a estrutura da notificação é válida
    if (notificacao['notificacao'] == null) {
      debugPrint('Notificação inválida: $notificacao');
      return const SizedBox.shrink(); // Retorna widget vazio
    }

    // Extrai os dados da notificação
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
        // Borda mais destacada para notificações não lidas
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
        // Permite clicar na notificação para navegar (se tiver referência)
        onTap: idReferencia != null
            ? () {
                debugPrint('🔄 Clicar na notificação: $titulo');
                _navegarParaItem(notificacao);
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Ícone circular da notificação
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

              // Conteúdo textual da notificação
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Título da notificação
                    Text(
                      titulo,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: lida ? FontWeight.normal : FontWeight.bold,
                        color: lida ? Colors.grey[700] : Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Mensagem da notificação
                    Text(
                      mensagem,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Informações adicionais (tempo e link)
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
                        // Indicação de que pode ver detalhes
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

              // Botão para marcar como lida (apenas se não estiver lida)
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
