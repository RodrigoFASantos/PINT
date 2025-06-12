import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart'; // Add this import for Color class
import '../../services/api_service.dart';

class NotificacoesProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<dynamic> _notificacoes = [];
  int _notificacoesNaoLidas = 0;
  bool _loading = false;
  String? _error;

  // Getters
  List<dynamic> get notificacoes => _notificacoes;
  int get notificacoesNaoLidas => _notificacoesNaoLidas;
  bool get loading => _loading;
  String? get error => _error;

  /// Buscar todas as notificações
  Future<void> buscarNotificacoes() async {
    _setLoading(true);
    _error = null;

    try {
      debugPrint('🔔 [PROVIDER] Buscando notificações...');

      final notificacoes = await _apiService.getNotificacoes();

      if (notificacoes != null) {
        _notificacoes = notificacoes;
        _calcularNotificacoesNaoLidas();
        debugPrint(
          '✅ [PROVIDER] ${_notificacoes.length} notificações carregadas',
        );
      } else {
        _error = 'Erro ao carregar notificações';
        debugPrint('❌ [PROVIDER] Erro ao carregar notificações');
      }
    } catch (e) {
      _error = 'Erro de conexão';
      debugPrint('❌ [PROVIDER] Exceção ao buscar notificações: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Buscar apenas a contagem de notificações não lidas
  Future<void> buscarContadorNotificacoes() async {
    try {
      debugPrint('🔔 [PROVIDER] Buscando contador de notificações...');
      final count = await _apiService.getNotificacoesNaoLidasContagem();
      _notificacoesNaoLidas = count;
      debugPrint('✅ [PROVIDER] $count notificações não lidas');
      notifyListeners();
    } catch (e) {
      debugPrint('❌ [PROVIDER] Erro ao buscar contador: $e');
    }
  }

  /// Marcar uma notificação como lida
  Future<Map<String, dynamic>> marcarComoLida(int idNotificacao) async {
    try {
      debugPrint(
        '✅ [PROVIDER] Marcando notificação $idNotificacao como lida...',
      );

      final result = await _apiService.marcarNotificacaoComoLida(idNotificacao);

      if (result != null && result['success'] == true) {
        // Atualizar localmente
        _atualizarNotificacaoLocal(idNotificacao, true);
        _calcularNotificacoesNaoLidas();
        notifyListeners();

        return {
          'success': true,
          'message': result['message'] ?? 'Notificação marcada como lida',
        };
      } else {
        return {
          'success': false,
          'message': result?['message'] ?? 'Erro ao marcar notificação',
        };
      }
    } catch (e) {
      debugPrint('❌ [PROVIDER] Erro ao marcar como lida: $e');
      return {'success': false, 'message': 'Erro de conexão'};
    }
  }

  /// Marcar todas as notificações como lidas
  Future<Map<String, dynamic>> marcarTodasComoLidas() async {
    try {
      debugPrint('✅ [PROVIDER] Marcando todas as notificações como lidas...');

      final result = await _apiService.marcarTodasNotificacoesComoLidas();

      if (result != null && result['success'] == true) {
        // Atualizar todas localmente
        for (var notificacao in _notificacoes) {
          notificacao['lida'] = true;
          notificacao['data_leitura'] = DateTime.now().toIso8601String();
        }
        _notificacoesNaoLidas = 0;
        notifyListeners();

        return {
          'success': true,
          'message': result['message'] ??
              'Todas as notificações foram marcadas como lidas',
        };
      } else {
        return {
          'success': false,
          'message': result?['message'] ?? 'Erro ao marcar notificações',
        };
      }
    } catch (e) {
      debugPrint('❌ [PROVIDER] Erro ao marcar todas como lidas: $e');
      return {'success': false, 'message': 'Erro de conexão'};
    }
  }

  /// Atualizar uma notificação específica localmente
  void _atualizarNotificacaoLocal(int idNotificacao, bool lida) {
    final index = _notificacoes.indexWhere(
      (n) => (n['id_notificacao'] ?? n['id']) == idNotificacao,
    );

    if (index != -1) {
      _notificacoes[index]['lida'] = lida;
      if (lida) {
        _notificacoes[index]['data_leitura'] = DateTime.now().toIso8601String();
      }
    }
  }

  /// Calcular número de notificações não lidas
  void _calcularNotificacoesNaoLidas() {
    _notificacoesNaoLidas = _notificacoes.where((n) => !n['lida']).length;
  }

  /// Definir estado de loading
  void _setLoading(bool loading) {
    _loading = loading;
    notifyListeners();
  }

  /// Adicionar nova notificação (para uso com WebSocket/push notifications)
  void adicionarNotificacao(Map<String, dynamic> novaNotificacao) {
    _notificacoes.insert(0, novaNotificacao);
    if (!novaNotificacao['lida']) {
      _notificacoesNaoLidas++;
    }
    notifyListeners();
    debugPrint(
      '🔔 [PROVIDER] Nova notificação adicionada: ${novaNotificacao['titulo'] ?? novaNotificacao['mensagem']}',
    );
  }

  /// Limpar todas as notificações
  void limparNotificacoes() {
    _notificacoes.clear();
    _notificacoesNaoLidas = 0;
    _error = null;
    notifyListeners();
    debugPrint('🗑️ [PROVIDER] Notificações limpas');
  }

  /// Recarregar notificações (pull-to-refresh)
  Future<void> recarregarNotificacoes() async {
    await buscarNotificacoes();
  }

  // Métodos auxiliares para UI

  /// Obter ícone da notificação
  String getNotificacaoIcon(String tipo) {
    return _apiService.getNotificacaoIcon(tipo);
  }

  /// Obter cor da notificação
  Color getNotificacaoColor(String tipo) {
    return _apiService.getNotificacaoColor(tipo);
  }

  /// Formatar tempo relativo
  String formatRelativeTime(String? dateString) {
    return _apiService.formatRelativeTime(dateString);
  }
}
