import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../main.dart';
import '../components/sidebar_screen.dart';
import '../components/navbar_screen.dart';

/// Ecrã Principal (Home)
/// Este é o ecrã inicial da aplicação que mostra:
/// - Cursos em que o utilizador está inscrito
/// - Cursos sugeridos disponíveis para inscrição
/// - Navegação rápida para outras secções
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Serviço para comunicação com a API
  final _apiService = ApiService();

  // Variáveis de estado para armazenar dados
  List<dynamic>?
      _inscricoes; // Lista de cursos em que o utilizador está inscrito
  List<dynamic>? _cursosSugeridos; // Lista de cursos disponíveis para inscrição
  Map<String, dynamic>? _currentUser; // Dados do utilizador atual

  // Variáveis de controlo de estado
  bool _isLoading = true; // Indica se os dados estão a ser carregados
  String? _error; // Mensagem de erro, se existir

  @override
  void initState() {
    super.initState();
    // Carrega os dados quando o widget é inicializado
    _loadHomeData();
  }

  /// Carrega todos os dados necessários para o ecrã inicial
  /// Faz chamadas à API para obter dados do utilizador, inscrições e cursos
  Future<void> _loadHomeData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Carrega dados do utilizador atual
      final userData = await _apiService.getCurrentUser();

      // Carrega inscrições do utilizador (cursos em que está inscrito)
      final inscricoes = await _apiService.getMinhasInscricoes();

      // Carrega cursos sugeridos (todos os cursos disponíveis)
      final cursosSugeridos = await _apiService.getCursos();

      // Atualiza o estado apenas se o widget ainda estiver montado
      if (mounted) {
        setState(() {
          _currentUser = userData;
          _inscricoes = inscricoes ?? [];
          _cursosSugeridos = cursosSugeridos ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      // Trata erros no carregamento dos dados
      if (mounted) {
        setState(() {
          _error = 'Erro ao carregar dados: $e';
          _isLoading = false;
        });
      }
    }
  }

  /// Constrói um cartão para mostrar um curso inscrito
  /// Exibe informações do curso como nome, categoria, área e estado
  Widget _buildCursoCard(Map<String, dynamic> curso) {
    // Extrai o nome do curso com fallback para valores padrão
    final nomeCurso = curso['nomeCurso'] ?? curso['nome'] ?? 'Curso sem nome';

    // Extrai a categoria - pode ser string ou objeto
    String categoria = 'Não especificada';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrai a área - pode ser string ou objeto
    String area = 'Não especificada';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    final status = curso['status'] ?? 'Inscrito';

    // Define a cor do estado baseada no seu valor
    Color statusColor;
    switch (status.toLowerCase()) {
      case 'concluído':
        statusColor = Colors.green; // Verde para concluído
        break;
      case 'em andamento':
        statusColor = Colors.orange; // Laranja para em andamento
        break;
      case 'agendado':
        statusColor = Colors.blue; // Azul para agendado
        break;
      default:
        statusColor = Colors.grey; // Cinzento para outros estados
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 3, // Sombra do cartão
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        // Permite clicar no cartão para navegar para o curso
        onTap: () => _navigateToCurso(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Ícone do curso
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF8000), // Cor laranja da marca
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.school, // Ícone de escola
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Informações textuais do curso
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomeCurso,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2, // Máximo 2 linhas
                          overflow: TextOverflow.ellipsis, // Corta com ...
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Categoria: $categoria',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Área: $area',
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
              const SizedBox(height: 12),
              // Badge do estado do curso
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color:
                      statusColor.withOpacity(0.1), // Fundo com transparência
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Constrói um cartão para mostrar um curso sugerido
  /// Similar ao cartão de curso inscrito mas com algumas diferenças visuais
  Widget _buildCursoSugeridoCard(Map<String, dynamic> curso) {
    final nomeCurso = curso['nome'] ?? 'Curso sem nome';

    // Extrai categoria (igual ao método anterior)
    String categoria = 'Não especificada';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Extrai área (igual ao método anterior)
    String area = 'Não especificada';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _navigateToCurso(curso),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Ícone do curso (cinzento para diferenciá-lo dos inscritos)
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors
                          .grey.shade400, // Cinzento para cursos sugeridos
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.school_outlined, // Ícone outline
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
                          nomeCurso,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Categoria: $categoria',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Área: $area',
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
              const SizedBox(height: 12),
              // Badge "Disponível" para cursos sugeridos
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Text(
                  'Disponível',
                  style: TextStyle(
                    color: Colors.blue,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Navega para a página individual do curso
  /// Tenta obter o ID do curso de diferentes campos possíveis
  void _navigateToCurso(Map<String, dynamic> curso) {
    // Procura o ID do curso em diferentes campos
    final cursoId = curso['id_curso']?.toString() ??
        curso['id']?.toString() ??
        curso['cursoId']?.toString();

    if (cursoId != null && cursoId.isNotEmpty) {
      // Navega para o ecrã do curso com o ID como argumento
      Navigator.pushNamed(
        context,
        '/curso',
        arguments: cursoId,
      );
    } else {
      // Mostra erro se não conseguir encontrar o ID
      AppUtils.showError(context, 'ID do curso não encontrado');
    }
  }

  /// Mostra um diálogo com detalhes do curso inscrito
  /// Útil para mostrar informações rápidas sem sair do ecrã
  void _showCursoDetails(Map<String, dynamic> curso) {
    // Processa categoria (igual aos métodos anteriores)
    String categoria = 'N/A';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    // Processa área (igual aos métodos anteriores)
    String area = 'N/A';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    // Mostra diálogo com informações detalhadas
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nomeCurso'] ?? curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: $categoria'),
            const SizedBox(height: 8),
            Text('Área: $area'),
            const SizedBox(height: 8),
            Text('Estado: ${curso['status'] ?? 'N/A'}'),
            // Mostra datas se disponíveis
            if (curso['dataInicio'] != null) ...[
              const SizedBox(height: 8),
              Text('Data Início: ${_formatDate(curso['dataInicio'])}'),
            ],
            if (curso['dataFim'] != null) ...[
              const SizedBox(height: 8),
              Text('Data Fim: ${_formatDate(curso['dataFim'])}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToCurso(curso);
            },
            child: const Text('Ver Curso'),
          ),
        ],
      ),
    );
  }

  /// Mostra um diálogo com detalhes do curso sugerido
  /// Similar ao anterior mas com informações específicas de cursos não inscritos
  void _showCursoSugeridoDetails(Map<String, dynamic> curso) {
    // Processa categoria e área (igual aos métodos anteriores)
    String categoria = 'N/A';
    if (curso['categoria'] != null) {
      if (curso['categoria'] is String) {
        categoria = curso['categoria'];
      } else if (curso['categoria'] is Map &&
          curso['categoria']['nome'] != null) {
        categoria = curso['categoria']['nome'];
      }
    }

    String area = 'N/A';
    if (curso['area'] != null) {
      if (curso['area'] is String) {
        area = curso['area'];
      } else if (curso['area'] is Map && curso['area']['nome'] != null) {
        area = curso['area']['nome'];
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(curso['nome'] ?? 'Curso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Categoria: $categoria'),
            const SizedBox(height: 8),
            Text('Área: $area'),
            // Informações específicas de cursos sugeridos
            if (curso['descricao'] != null) ...[
              const SizedBox(height: 8),
              Text('Descrição: ${curso['descricao']}'),
            ],
            if (curso['vagas'] != null) ...[
              const SizedBox(height: 8),
              Text('Vagas: ${curso['vagas']}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToCurso(curso);
            },
            child: const Text('Ver Curso'),
          ),
        ],
      ),
    );
  }

  /// Formata uma data para o formato português (dd/mm/yyyy)
  /// Trata erros de parsing e retorna a string original se falhar
  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString; // Retorna a string original se não conseguir fazer parse
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Barra de navegação sempre visível no topo
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: NavbarScreen(
          currentUser: _currentUser,
        ),
      ),

      // Menu lateral (SidebarScreen) como Drawer
      drawer: SidebarScreen(
        currentUser: _currentUser,
        currentRoute: '/home', // Indica que estamos no ecrã inicial
      ),

      // Corpo principal do ecrã
      body: _isLoading
          ? // Estado de carregamento
          const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
            )
          : _error != null
              ? // Estado de erro
              Center(
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
                        onPressed: _loadHomeData,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : // Estado normal - mostra o conteúdo
              RefreshIndicator(
                  // Permite atualizar puxando para baixo
                  onRefresh: _loadHomeData,
                  color: const Color(0xFFFF8000),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Conteúdo principal
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Secção de Cursos Inscritos
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Cursos Inscritos',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey.shade800,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Verifica se há cursos inscritos
                              if (_inscricoes == null || _inscricoes!.isEmpty)
                                // Mostra mensagem quando não há cursos inscritos
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.school_outlined,
                                        size: 48,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Não está inscrito em nenhum curso.',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 16,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 12),
                                      ElevatedButton(
                                        onPressed: () => Navigator.pushNamed(
                                            context, '/cursos'),
                                        child: const Text('Explorar Cursos'),
                                      ),
                                    ],
                                  ),
                                )
                              else
                                // Mostra lista de cursos inscritos
                                ...(_inscricoes!
                                    .map((curso) => _buildCursoCard(
                                        curso as Map<String, dynamic>))
                                    .toList()),

                              const SizedBox(height: 32),

                              // Secção de Cursos Sugeridos
                              Text(
                                'Cursos Sugeridos',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade800,
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Botão "Ver todos" com design atrativo
                              if (_cursosSugeridos != null &&
                                  _cursosSugeridos!.isNotEmpty)
                                Container(
                                  width: double.infinity,
                                  margin: const EdgeInsets.only(bottom: 16),
                                  child: ElevatedButton.icon(
                                    onPressed: () =>
                                        Navigator.pushNamed(context, '/cursos'),
                                    icon: const Icon(
                                      Icons.explore_outlined,
                                      size: 18,
                                    ),
                                    label: const Text(
                                      'Ver todos os cursos',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFFF8000),
                                      foregroundColor: Colors.white,
                                      elevation: 2,
                                      shadowColor: const Color(0xFFFF8000)
                                          .withOpacity(0.3),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 20,
                                        vertical: 12,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(25),
                                      ),
                                    ),
                                  ),
                                ),

                              // Verifica se há cursos sugeridos
                              if (_cursosSugeridos == null ||
                                  _cursosSugeridos!.isEmpty)
                                // Mostra mensagem quando não há cursos disponíveis
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.explore_outlined,
                                        size: 48,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Nenhum curso disponível no momento.',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 16,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                )
                              else
                                // Mostra apenas os primeiros 5 cursos sugeridos
                                ..._cursosSugeridos!
                                    .take(5)
                                    .map((curso) => _buildCursoSugeridoCard(
                                        curso as Map<String, dynamic>))
                                    .toList(),

                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
