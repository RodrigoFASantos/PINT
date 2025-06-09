import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../main.dart';
import '../../components/sidebar_screen.dart';
import '../../components/anexo_widget.dart';

class DetalheTopicoScreen extends StatefulWidget {
  final String topicoId;

  const DetalheTopicoScreen({Key? key, required this.topicoId})
      : super(key: key);

  @override
  _DetalheTopicoScreenState createState() => _DetalheTopicoScreenState();
}

class _DetalheTopicoScreenState extends State<DetalheTopicoScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? topico;
  Map<String, dynamic>? currentUser;
  bool loading = true;
  String? erro;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    try {
      await _loadUserData();
      await _loadTopicoDetails();
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar dados: $error';
        loading = false;
      });
    }
  }

  Future<void> _loadUserData() async {
    try {
      final response = await _apiService.get('/users/perfil');
      final data = _apiService.parseResponseToMap(response);

      if (data != null) {
        setState(() {
          currentUser = data;
        });
        debugPrint(
            '🔧 [DETALHE_TOPICO] Usuário carregado: ${currentUser?['nome']}');
      }
    } catch (error) {
      debugPrint('❌ [DETALHE_TOPICO] Erro ao carregar usuário: $error');
    }
  }

  Future<void> _loadTopicoDetails() async {
    try {
      debugPrint(
          '🔧 [DETALHE_TOPICO] Carregando tópico ID: ${widget.topicoId}');

      final response =
          await _apiService.get('/topicos-area/${widget.topicoId}');
      final data = _apiService.parseResponseToMap(response);

      if (data != null && data['data'] != null) {
        setState(() {
          topico = data['data'];
          loading = false;
        });
        debugPrint('✅ [DETALHE_TOPICO] Tópico carregado: ${topico?['titulo']}');
      } else {
        setState(() {
          erro = 'Tópico não encontrado';
          loading = false;
        });
      }
    } catch (error) {
      setState(() {
        erro = 'Erro ao carregar tópico: $error';
        loading = false;
      });
      debugPrint('❌ [DETALHE_TOPICO] Erro ao carregar tópico: $error');
    }
  }

  void _navegarParaConversas() {
    debugPrint(
        '🔧 [DETALHE_TOPICO] Navegando para conversas do tópico: ${widget.topicoId}');
    Navigator.pushNamed(context, '/forum/topico/${widget.topicoId}/conversas');
  }

  String _formatarData(String? dataString) {
    if (dataString == null) return 'Data indisponível';

    try {
      final data = DateTime.parse(dataString);
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year} às ${data.hour.toString().padLeft(2, '0')}:${data.minute.toString().padLeft(2, '0')}';
    } catch (error) {
      return 'Data inválida';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Detalhes do Tópico'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
              SizedBox(height: 16),
              Text('A carregar tópico...'),
            ],
          ),
        ),
      );
    }

    if (erro != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Erro'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text(
                'Erro ao carregar tópico',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  erro!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    loading = true;
                    erro = null;
                  });
                  _initializeData();
                },
                icon: Icon(Icons.refresh),
                label: Text('Tentar Novamente'),
              ),
              SizedBox(height: 12),
              TextButton.icon(
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/forum'),
                icon: Icon(Icons.arrow_back),
                label: Text('Voltar ao Fórum'),
              ),
            ],
          ),
        ),
      );
    }

    if (topico == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Tópico não encontrado'),
          backgroundColor: Color(0xFFFF8000),
        ),
        drawer: SidebarScreen(
          currentUser: currentUser,
          currentRoute: '/forum',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.topic_outlined, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text(
                'Tópico não encontrado',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/forum'),
                icon: Icon(Icons.arrow_back),
                label: Text('Voltar ao Fórum'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Detalhes do Tópico'),
        backgroundColor: Color(0xFFFF8000),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pushReplacementNamed(context, '/forum'),
        ),
      ),
      drawer: SidebarScreen(
        currentUser: currentUser,
        currentRoute: '/forum',
      ),
      body: Container(
        color: Color(0xFFF5F7FB),
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Breadcrumb
              Container(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  '${topico!['categoria']?['nome'] ?? 'Categoria'} > ${topico!['area']?['nome'] ?? 'Área'}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),

              // Card principal do tópico
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Título
                      Text(
                        topico!['titulo'] ?? 'Sem título',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF333333),
                        ),
                      ),

                      SizedBox(height: 12),

                      // Meta informações
                      Row(
                        children: [
                          Icon(Icons.person, size: 16, color: Colors.grey[600]),
                          SizedBox(width: 4),
                          Text(
                            'Por: ${topico!['criador']?['nome'] ?? 'Usuário'}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          SizedBox(width: 16),
                          Icon(Icons.access_time,
                              size: 16, color: Colors.grey[600]),
                          SizedBox(width: 4),
                          Text(
                            _formatarData(topico!['data_criacao']),
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 16),

                      // Descrição
                      if (topico!['descricao'] != null) ...[
                        Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Descrição',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF333333),
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                topico!['descricao'],
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF666666),
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 16),
                      ],

                      // 🆕 ANEXOS DO TÓPICO
                      if (topico!['anexos'] != null &&
                          topico!['anexos'].isNotEmpty) ...[
                        Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Color(0xFFF8F9FA),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.attach_file,
                                      size: 20, color: Color(0xFF4A90E2)),
                                  SizedBox(width: 8),
                                  Text(
                                    'Anexos',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF333333),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 12),
                              ListaAnexos(anexos: topico!['anexos']),
                            ],
                          ),
                        ),
                        SizedBox(height: 16),
                      ],

                      // Estatísticas
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Color(0xFFF0F2F5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem(
                              icon: Icons.topic,
                              label: 'Temas',
                              value: topico!['total_temas']?.toString() ?? '0',
                            ),
                            _buildStatItem(
                              icon: Icons.comment,
                              label: 'Comentários',
                              value: topico!['total_comentarios']?.toString() ??
                                  '0',
                            ),
                            _buildStatItem(
                              icon: Icons.people,
                              label: 'Participantes',
                              value:
                                  topico!['total_participantes']?.toString() ??
                                      '0',
                            ),
                            if (topico!['anexos'] != null &&
                                topico!['anexos'].isNotEmpty)
                              _buildStatItem(
                                icon: Icons.attach_file,
                                label: 'Anexos',
                                value: topico!['anexos'].length.toString(),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              SizedBox(height: 24),

              // Botão para entrar nas conversas
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _navegarParaConversas,
                  icon: Icon(Icons.chat),
                  label: Text('Entrar nas Conversas'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF4CAF50),
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

              SizedBox(height: 16),

              // Botão para voltar
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () =>
                      Navigator.pushReplacementNamed(context, '/forum'),
                  icon: Icon(Icons.arrow_back),
                  label: Text('Voltar ao Fórum'),
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 24, color: Color(0xFF5181B8)),
        SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF333333),
          ),
        ),
        SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}
