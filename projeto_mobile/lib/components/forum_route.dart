import 'package:flutter/material.dart';
import '../screens/forum/chat_conversas_screen.dart';
import '../screens/forum/topicos_chat_screen.dart';

/// Sistema de rotas dinâmicas para o módulo do fórum
class ForumRoutes {
  /// Verifica se a rota pertence ao sistema de fórum
  static bool isForumRoute(String? routeName) {
    if (routeName == null) return false;

    return routeName.startsWith('/forum/') && routeName != '/forum';
  }

  /// Gera as rotas do fórum dinamicamente
  static Route<dynamic>? generateRoute(RouteSettings settings) {
    final String routeName = settings.name ?? '';

    debugPrint('🔧 [FORUM_ROUTES] Processando rota: $routeName');

    // Padrões de rotas do fórum
    final RegExp conversasPattern = RegExp(r'^/forum/topico/(\d+)/conversas$');
    final RegExp chatPattern = RegExp(r'^/forum/topico/(\d+)/tema/(\d+)$');

    // 1. Lista de conversas: /forum/topico/:id/conversas
    final conversasMatch = conversasPattern.firstMatch(routeName);
    if (conversasMatch != null) {
      final topicoId = conversasMatch.group(1)!;
      debugPrint('✅ [FORUM_ROUTES] Conversas do tópico: $topicoId');

      return MaterialPageRoute(
        builder: (context) => ChatConversasScreen(topicoId: topicoId),
        settings: settings,
      );
    }

    // 2. Chat de tema específico: /forum/topico/:topicoId/tema/:temaId
    final chatMatch = chatPattern.firstMatch(routeName);
    if (chatMatch != null) {
      final topicoId = chatMatch.group(1)!;
      final temaId = chatMatch.group(2)!;
      debugPrint('✅ [FORUM_ROUTES] Chat do tema: $temaId (tópico: $topicoId)');

      return MaterialPageRoute(
        builder: (context) => TopicosChatScreen(
          topicoId: topicoId,
          temaId: temaId,
        ),
        settings: settings,
      );
    }

    // 3. Rotas futuras do fórum (para expansão)

    // Administração do fórum (para admins/formadores)
    if (routeName.startsWith('/forum/admin/')) {
      return _buildNotImplementedRoute(settings, 'Administração do Fórum');
    }

    // Moderação
    if (routeName.startsWith('/forum/moderacao/')) {
      return _buildNotImplementedRoute(settings, 'Moderação do Fórum');
    }

    // Pesquisa no fórum
    if (routeName.startsWith('/forum/pesquisa/')) {
      return _buildNotImplementedRoute(settings, 'Pesquisa no Fórum');
    }

    // Perfil do usuário no fórum
    if (routeName.startsWith('/forum/utilizador/')) {
      return _buildNotImplementedRoute(settings, 'Perfil do Utilizador');
    }

    // Notificações do fórum
    if (routeName.startsWith('/forum/notificacoes/')) {
      return _buildNotImplementedRoute(settings, 'Notificações do Fórum');
    }

    debugPrint('❌ [FORUM_ROUTES] Rota do fórum não reconhecida: $routeName');
    return null;
  }

  /// Constrói uma rota para funcionalidades não implementadas
  static Route<dynamic> _buildNotImplementedRoute(
      RouteSettings settings, String funcionalidade) {
    return MaterialPageRoute(
      builder: (context) => _NotImplementedPage(
        funcionalidade: funcionalidade,
        routeName: settings.name ?? '',
      ),
      settings: settings,
    );
  }
}

/// Página para funcionalidades não implementadas
class _NotImplementedPage extends StatelessWidget {
  final String funcionalidade;
  final String routeName;

  const _NotImplementedPage({
    required this.funcionalidade,
    required this.routeName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(funcionalidade),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pushReplacementNamed(context, '/forum'),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.construction,
              size: 64,
              color: Colors.orange.shade300,
            ),
            SizedBox(height: 16),
            Text(
              'Funcionalidade em Desenvolvimento',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.orange.shade700,
              ),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'A funcionalidade "$funcionalidade" ainda está em desenvolvimento.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Rota: $routeName',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                  fontFamily: 'monospace',
                ),
              ),
            ),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () =>
                  Navigator.pushReplacementNamed(context, '/forum'),
              icon: Icon(Icons.forum),
              label: Text('Voltar ao Fórum'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFFF8000),
              ),
            ),
            SizedBox(height: 12),
            TextButton.icon(
              onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
              icon: Icon(Icons.home),
              label: Text('Voltar ao Início'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Extensões utilitárias para navegação do fórum
extension ForumNavigation on BuildContext {
  /// Navegar diretamente para conversas do tópico (substituindo detalhes)
  void navegarParaTopico(String topicoId) {
    Navigator.pushNamed(this, '/forum/topico/$topicoId/conversas');
  }

  /// Navegar para conversas do tópico
  void navegarParaConversas(String topicoId) {
    Navigator.pushNamed(this, '/forum/topico/$topicoId/conversas');
  }

  /// Navegar para chat do tema
  void navegarParaChat(String topicoId, String temaId) {
    Navigator.pushNamed(this, '/forum/topico/$topicoId/tema/$temaId');
  }

  /// Voltar ao fórum principal
  void voltarAoForum() {
    Navigator.pushNamedAndRemoveUntil(
      this,
      '/forum',
      (route) => route.settings.name == '/home',
    );
  }
}

/// Validações para IDs do fórum
class ForumValidation {
  /// Valida se um ID é válido (numérico e positivo)
  static bool isValidId(String? id) {
    if (id == null || id.isEmpty) return false;

    final numericId = int.tryParse(id);
    return numericId != null && numericId > 0;
  }

  /// Valida tópico ID
  static bool isValidTopicoId(String? topicoId) {
    return isValidId(topicoId);
  }

  /// Valida tema ID
  static bool isValidTemaId(String? temaId) {
    return isValidId(temaId);
  }

  /// Valida combinação de tópico e tema
  static bool isValidTopicoTema(String? topicoId, String? temaId) {
    return isValidTopicoId(topicoId) && isValidTemaId(temaId);
  }
}

/// Constantes do fórum
class ForumConstants {
  // Rotas base
  static const String routeBase = '/forum';
  static const String routeTopico = '/forum/topico';
  static const String routeConversas = '/conversas';
  static const String routeTema = '/tema';

  // Limites
  static const int maxAnexosPorTema = 1; // ✅ Corrigido: apenas 1 anexo por tema
  static const int maxAnexosPorComentario =
      1; // ✅ Corrigido: apenas 1 anexo por comentário
  static const int maxTamanhoArquivo = 10 * 1024 * 1024; // 10MB

  // Tipos de arquivo permitidos
  static const List<String> tiposImagemPermitidos = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp'
  ];

  static const List<String> tiposVideoPermitidos = [
    'mp4',
    'avi',
    'mov',
    'webm'
  ];

  static const List<String> tiposDocumentoPermitidos = [
    'pdf',
    'doc',
    'docx',
    'txt'
  ];

  /// Obter todos os tipos permitidos
  static List<String> get todosTiposPermitidos => [
        ...tiposImagemPermitidos,
        ...tiposVideoPermitidos,
        ...tiposDocumentoPermitidos,
      ];

  /// Verificar se tipo de arquivo é permitido
  static bool isTipoArquivoPermitido(String? extensao) {
    if (extensao == null) return false;
    return todosTiposPermitidos.contains(extensao.toLowerCase());
  }
}
