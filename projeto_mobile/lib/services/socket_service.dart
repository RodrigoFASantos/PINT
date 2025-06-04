import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  Future<void> connect() async {
    if (_socket != null && _isConnected) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      _socket = IO.io('https://your-api-url.com', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'query': {'token': token},
      });

      _socket!.connect();

      _socket!.onConnect((_) {
        print('Socket conectado');
        _isConnected = true;
      });

      _socket!.onDisconnect((_) {
        print('Socket desconectado');
        _isConnected = false;
      });

      _socket!.onConnectError((error) {
        print('Erro na conexão socket: $error');
        _isConnected = false;
      });

    } catch (e) {
      print('Erro ao inicializar socket: $e');
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
    }
  }

  // Métodos para tópicos
  void joinTopic(int topicoId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinTopic', topicoId);
    }
  }

  void leaveTopic(int topicoId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leaveTopic', topicoId);
    }
  }

  // Métodos para temas
  void joinTema(int temaId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinTema', temaId);
    }
  }

  void leaveTema(int temaId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leaveTema', temaId);
    }
  }

  // Método para ouvir eventos
  void on(String event, Function(dynamic) callback) {
    if (_socket != null) {
      _socket!.on(event, callback);
    }
  }

  // Método para remover listeners
  void off(String event) {
    if (_socket != null) {
      _socket!.off(event);
    }
  }

  // Método para emitir eventos
  void emit(String event, dynamic data) {
    if (_socket != null && _isConnected) {
      _socket!.emit(event, data);
    }
  }
}