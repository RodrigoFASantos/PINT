import 'package:flutter/material.dart';
// ✅ IMPORTS CORRIGIDOS E ADICIONADOS
import '../auth/login_screen.dart';
import '../auth/confirm_account_screen.dart';
import '../home/home_screen.dart';
import '../cursos/cursos_list_screen.dart';
import '../cursos/curso_detail_screen.dart';
import '../users/perfil_screen.dart';
import '../users/percurso_formativo_screen.dart';
import '../notificacoes/notificacoes_screen.dart';
import '../users/lista_formadores_screen.dart';
import '../users/detalhes_formador_screen.dart';
import '../users/area_formador_screen.dart';
import '../forum/forum_screen.dart';
import '../forum/topico_detail_screen.dart';
import '../forum/chat_conversas_screen.dart';
import '../forum/topicos_chat_screen.dart';
import '../users/detalhes_utilizador_screen.dart';
import '../../main.dart' show AuthWrapper;

class AppRouter {
  static Map<String, WidgetBuilder> get routes {
    return {
      // ✅ Rota inicial agora vai para AuthWrapper
      '/': (context) => AuthWrapper(),

      // Autenticação
      '/login': (context) =>
          LoginScreen(), // ✅ CORRIGIDO - Agora está importado
      '/confirm-account': (context) {
        final args =
            ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
        final token = args?['token'] as String?;
        return ConfirmAccountScreen(token: token);
      },

      // Principais
      '/home': (context) => HomeScreen(),
      '/cursos': (context) => CursosListScreen(),
      '/perfil': (context) =>
          PerfilScreen(), // ✅ CORRIGIDO - Agora está importado
      '/percurso-formativo': (context) =>
          PercursoFormativoScreen(), // ✅ CORRIGIDO
      '/notificacoes': (context) => NotificacoesScreen(),

      // Formadores
      '/formadores': (context) => FormadoresListScreen(), // ✅ CORRIGIDO
      '/formador/cursos': (context) => AreaFormadorScreen(), // ✅ CORRIGIDO

      // Fórum
      '/forum': (context) => ForumScreen(),

      // Debug (apenas para desenvolvimento)
      '/debug': (context) => DebugScreen(),
    };
  }

  // Rotas dinâmicas (com parâmetros)
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    final uri = Uri.parse(settings.name ?? '');
    final segments = uri.pathSegments;

    // /cursos/{id}
    if (segments.length == 2 && segments[0] == 'cursos') {
      final cursoId = int.tryParse(segments[1]);
      if (cursoId != null) {
        return MaterialPageRoute(
          builder: (context) => CursoDetailScreen(cursoId: cursoId),
          settings: settings,
        );
      }
    }

    // /formadores/{id}
    if (segments.length == 2 && segments[0] == 'formadores') {
      final formadorId = int.tryParse(segments[1]);
      if (formadorId != null) {
        return MaterialPageRoute(
          builder: (context) =>
              FormadorDetailScreen(formadorId: formadorId), // ✅ CORRIGIDO
          settings: settings,
        );
      }
    }

    // /forum/topico/{id}
    if (segments.length == 3 &&
        segments[0] == 'forum' &&
        segments[1] == 'topico') {
      final topicoId = int.tryParse(segments[2]);
      if (topicoId != null) {
        return MaterialPageRoute(
          builder: (context) => TopicoDetailScreen(topicoId: topicoId),
          settings: settings,
        );
      }
    }

    // /admin/users/{id}
    if (segments.length == 3 &&
        segments[0] == 'admin' &&
        segments[1] == 'users') {
      final userId = int.tryParse(segments[2]);
      if (userId != null) {
        return MaterialPageRoute(
          builder: (context) =>
              DetalhesUtilizadorScreen(utilizadorId: userId), // ✅ CORRIGIDO
          settings: settings,
        );
      }
    }

    // Chat de conversas: /forum/topico/{id}/chat
    if (segments.length == 4 &&
        segments[0] == 'forum' &&
        segments[1] == 'topico' &&
        segments[3] == 'chat') {
      final topicoId = int.tryParse(segments[2]);
      if (topicoId != null) {
        return MaterialPageRoute(
          builder: (context) => ChatConversasScreen(topicoId: topicoId),
          settings: settings,
        );
      }
    }

    // Chat de tema específico: /forum/topico/{topicoId}/tema/{temaId}
    if (segments.length == 5 &&
        segments[0] == 'forum' &&
        segments[1] == 'topico' &&
        segments[3] == 'tema') {
      final topicoId = int.tryParse(segments[2]);
      final temaId = int.tryParse(segments[4]);
      if (topicoId != null && temaId != null) {
        return MaterialPageRoute(
          builder: (context) => TopicosChatScreen(
            topicoId: topicoId,
            temaId: temaId,
          ),
          settings: settings,
        );
      }
    }

    // Rota não encontrada
    return MaterialPageRoute(
      builder: (context) => NotFoundScreen(),
      settings: settings,
    );
  }
}

// Tela de debug para desenvolvimento
class DebugScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Debug - Testes de Conectividade'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Modo Debug',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            Text('Esta tela é apenas para desenvolvimento.'),
            SizedBox(height: 10),
            Text('Funcionalidades:'),
            Text('• Testar conectividade com API'),
            Text('• Verificar autenticação'),
            Text('• Debug de rotas'),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/login'),
              child: Text('Ir para Login'),
            ),
            SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Voltar'),
            ),
          ],
        ),
      ),
    );
  }
}

// Tela para rotas não encontradas
class NotFoundScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Página Não Encontrada'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red,
            ),
            SizedBox(height: 20),
            Text(
              '404',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Página não encontrada',
              style: TextStyle(fontSize: 18),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pushNamedAndRemoveUntil(
                context,
                '/home',
                (route) => false,
              ),
              child: Text('Voltar ao Início'),
            ),
          ],
        ),
      ),
    );
  }
}
