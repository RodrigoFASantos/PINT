import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:photo_view/photo_view.dart';
import 'package:video_player/video_player.dart';
import '../services/api_service.dart';

/// Widget para exibir uma lista de anexos
class ListaAnexos extends StatelessWidget {
  final List<dynamic> anexos;
  final bool isPreview;
  final Function(Map<String, dynamic>)? onAnexoTap;

  const ListaAnexos({
    Key? key,
    required this.anexos,
    this.isPreview = false,
    this.onAnexoTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (anexos.isEmpty) {
      return SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: anexos.map<Widget>((anexo) {
        return Container(
          margin: EdgeInsets.only(bottom: 8),
          child: AnexoItem(
            anexo: anexo,
            isPreview: isPreview,
            onTap: onAnexoTap != null ? () => onAnexoTap!(anexo) : null,
          ),
        );
      }).toList(),
    );
  }
}

/// Widget para exibir um anexo individual
class AnexoItem extends StatelessWidget {
  final Map<String, dynamic> anexo;
  final bool isPreview;
  final VoidCallback? onTap;

  const AnexoItem({
    Key? key,
    required this.anexo,
    this.isPreview = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final tipo = _getTipoAnexo();
    final nome = _getNomeAnexo();
    final url = _getUrlAnexo();

    if (tipo == 'imagem') {
      return _buildImagemAnexo(context, url, nome);
    } else if (tipo == 'video') {
      return _buildVideoAnexo(context, url, nome);
    } else {
      return _buildArquivoAnexo(context, nome, tipo);
    }
  }

  String _getTipoAnexo() {
    // Tentar diferentes campos para o tipo
    String? tipo = anexo['tipo_anexo'] ?? anexo['tipo'] ?? anexo['type'];

    if (tipo != null) return tipo.toLowerCase();

    // Se não tiver tipo, tentar inferir pela extensão
    final url = _getUrlAnexo();
    final extensao = _getExtensaoFromUrl(url);

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(extensao)) {
      return 'imagem';
    } else if (['mp4', 'avi', 'mov', 'webm'].contains(extensao)) {
      return 'video';
    }

    return 'arquivo';
  }

  String _getNomeAnexo() {
    return anexo['anexo_nome'] ??
        anexo['nome'] ??
        anexo['name'] ??
        anexo['filename'] ??
        'Anexo';
  }

  String _getUrlAnexo() {
    String? url =
        anexo['anexo_url'] ?? anexo['url'] ?? anexo['path'] ?? anexo['link'];

    if (url == null || url.isEmpty) {
      return '';
    }

    // Se a URL já for completa, retornar
    if (url.startsWith('http')) {
      return url;
    }

    // Construir URL completa se for relativa
    final apiService = ApiService();
    final baseUrl = apiService.apiBase.replaceAll('/api', '');

    // Remover barra inicial se existir
    if (url.startsWith('/')) {
      url = url.substring(1);
    }

    return '$baseUrl/$url';
  }

  String? _getExtensaoFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final path = uri.path.toLowerCase();
      final lastDot = path.lastIndexOf('.');
      if (lastDot != -1 && lastDot < path.length - 1) {
        return path.substring(lastDot + 1);
      }
    } catch (e) {
      // Ignorar erro de parsing
    }
    return null;
  }

  Widget _buildImagemAnexo(BuildContext context, String url, String nome) {
    if (url.isEmpty) {
      return _buildErroAnexo('URL da imagem não disponível');
    }

    return InkWell(
      onTap: onTap ?? () => _mostrarImagemCompleta(context, url, nome),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: isPreview ? 150 : 300,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(
            imageUrl: url,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              height: isPreview ? 150 : 200,
              color: Colors.grey[200],
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(strokeWidth: 2),
                    SizedBox(height: 8),
                    Text(
                      'A carregar imagem...',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ),
            errorWidget: (context, url, error) =>
                _buildErroAnexo('Erro ao carregar imagem'),
          ),
        ),
      ),
    );
  }

  Widget _buildVideoAnexo(BuildContext context, String url, String nome) {
    return InkWell(
      onTap: onTap ?? () => _abrirVideo(context, url),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Color(0xFF4A90E2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.play_arrow,
                color: Colors.white,
                size: 30,
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    nome,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Vídeo',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.play_circle_fill, color: Color(0xFF4A90E2), size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildArquivoAnexo(BuildContext context, String nome, String tipo) {
    IconData icon;
    Color iconColor;
    String tipoLabel;

    switch (tipo.toLowerCase()) {
      case 'pdf':
        icon = Icons.picture_as_pdf;
        iconColor = Colors.red;
        tipoLabel = 'PDF';
        break;
      case 'doc':
      case 'docx':
        icon = Icons.description;
        iconColor = Colors.blue;
        tipoLabel = 'Documento';
        break;
      case 'txt':
        icon = Icons.text_snippet;
        iconColor = Colors.grey;
        tipoLabel = 'Texto';
        break;
      case 'xls':
      case 'xlsx':
        icon = Icons.table_chart;
        iconColor = Colors.green;
        tipoLabel = 'Planilha';
        break;
      case 'ppt':
      case 'pptx':
        icon = Icons.slideshow;
        iconColor = Colors.orange;
        tipoLabel = 'Apresentação';
        break;
      default:
        icon = Icons.insert_drive_file;
        iconColor = Color(0xFF4A90E2);
        tipoLabel = 'Arquivo';
    }

    return InkWell(
      onTap: onTap ?? () => _baixarArquivo(context, nome),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 32),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    nome,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    tipoLabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.download, color: Colors.grey[600], size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildErroAnexo(String mensagem) {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.broken_image, color: Colors.grey[400], size: 32),
            SizedBox(height: 8),
            Text(
              mensagem,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _mostrarImagemCompleta(BuildContext context, String url, String nome) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            iconTheme: IconThemeData(color: Colors.white),
            title: Text(
              nome,
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            actions: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: Colors.white),
              ),
            ],
          ),
          body: PhotoView(
            imageProvider: CachedNetworkImageProvider(url),
            minScale: PhotoViewComputedScale.contained,
            maxScale: PhotoViewComputedScale.covered * 3,
            heroAttributes: PhotoViewHeroAttributes(tag: url),
            loadingBuilder: (context, event) => Center(
              child: CircularProgressIndicator(
                color: Colors.white,
                value: event == null
                    ? 0
                    : event.cumulativeBytesLoaded /
                        (event.expectedTotalBytes ?? 1),
              ),
            ),
            errorBuilder: (context, error, stackTrace) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, color: Colors.white, size: 64),
                  SizedBox(height: 16),
                  Text(
                    'Erro ao carregar imagem',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _abrirVideo(BuildContext context, String url) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoPlayerScreen(
          videoUrl: url,
          videoName: _getNomeAnexo(),
        ),
      ),
    );
  }

  void _baixarArquivo(BuildContext context, String nome) {
    // Mostrar dialog de download
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Baixar Arquivo'),
        content: Text('Deseja baixar o arquivo "$nome"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Aqui você pode adicionar lógica para download
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                      'Funcionalidade de download será implementada em breve.'),
                ),
              );
            },
            child: Text('Baixar'),
          ),
        ],
      ),
    );
  }
}

/// Widget simplificado para preview de anexos
class AnexoPreview extends StatelessWidget {
  final Map<String, dynamic> anexo;
  final double size;

  const AnexoPreview({
    Key? key,
    required this.anexo,
    this.size = 40,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final tipo = anexo['tipo_anexo'] ?? anexo['tipo'] ?? 'arquivo';

    IconData icon;
    Color color;

    switch (tipo.toLowerCase()) {
      case 'imagem':
        icon = Icons.image;
        color = Color(0xFF4CAF50);
        break;
      case 'video':
        icon = Icons.video_file;
        color = Color(0xFF2196F3);
        break;
      case 'pdf':
        icon = Icons.picture_as_pdf;
        color = Colors.red;
        break;
      default:
        icon = Icons.attach_file;
        color = Color(0xFF4A90E2);
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        color: color,
        size: size * 0.6,
      ),
    );
  }
}

/// Função utilitária para obter ícone baseado no tipo de arquivo
IconData getIconeParaTipoArquivo(String tipo) {
  switch (tipo.toLowerCase()) {
    case 'imagem':
    case 'image':
      return Icons.image;
    case 'video':
      return Icons.video_file;
    case 'pdf':
      return Icons.picture_as_pdf;
    case 'doc':
    case 'docx':
      return Icons.description;
    case 'txt':
      return Icons.text_snippet;
    case 'xls':
    case 'xlsx':
      return Icons.table_chart;
    case 'ppt':
    case 'pptx':
      return Icons.slideshow;
    default:
      return Icons.insert_drive_file;
  }
}

/// Função utilitária para obter cor baseada no tipo de arquivo
Color getCorParaTipoArquivo(String tipo) {
  switch (tipo.toLowerCase()) {
    case 'imagem':
    case 'image':
      return Color(0xFF4CAF50);
    case 'video':
      return Color(0xFF2196F3);
    case 'pdf':
      return Colors.red;
    case 'doc':
    case 'docx':
      return Color(0xFF1976D2);
    case 'txt':
      return Colors.grey;
    case 'xls':
    case 'xlsx':
      return Color(0xFF4CAF50);
    case 'ppt':
    case 'pptx':
      return Color(0xFFFF9800);
    default:
      return Color(0xFF4A90E2);
  }
}

/// Tela para reprodução de vídeos
class VideoPlayerScreen extends StatefulWidget {
  final String videoUrl;
  final String videoName;

  const VideoPlayerScreen({
    Key? key,
    required this.videoUrl,
    required this.videoName,
  }) : super(key: key);

  @override
  _VideoPlayerScreenState createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  VideoPlayerController? _controller;
  bool _isLoading = true;
  bool _hasError = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    try {
      _controller =
          VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      await _controller!.initialize();

      setState(() {
        _isLoading = false;
      });

      // Auto-play
      _controller!.play();
    } catch (error) {
      setState(() {
        _isLoading = false;
        _hasError = true;
        _errorMessage = 'Erro ao carregar vídeo: $error';
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: IconThemeData(color: Colors.white),
        title: Text(
          widget.videoName,
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          if (_controller != null && _controller!.value.isInitialized)
            IconButton(
              onPressed: () {
                setState(() {
                  if (_controller!.value.isPlaying) {
                    _controller!.pause();
                  } else {
                    _controller!.play();
                  }
                });
              },
              icon: Icon(
                _controller!.value.isPlaying ? Icons.pause : Icons.play_arrow,
                color: Colors.white,
              ),
            ),
        ],
      ),
      body: Center(
        child: _isLoading
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.white),
                  SizedBox(height: 16),
                  Text(
                    'Carregando vídeo...',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              )
            : _hasError
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error, color: Colors.red, size: 64),
                      SizedBox(height: 16),
                      Text(
                        'Erro ao carregar vídeo',
                        style: TextStyle(color: Colors.white, fontSize: 18),
                      ),
                      SizedBox(height: 8),
                      Text(
                        _errorMessage ?? 'Erro desconhecido',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Voltar'),
                      ),
                    ],
                  )
                : _controller!.value.isInitialized
                    ? Stack(
                        alignment: Alignment.center,
                        children: [
                          AspectRatio(
                            aspectRatio: _controller!.value.aspectRatio,
                            child: VideoPlayer(_controller!),
                          ),
                          // Controles de vídeo
                          Positioned(
                            bottom: 20,
                            left: 20,
                            right: 20,
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    onPressed: () {
                                      setState(() {
                                        if (_controller!.value.isPlaying) {
                                          _controller!.pause();
                                        } else {
                                          _controller!.play();
                                        }
                                      });
                                    },
                                    icon: Icon(
                                      _controller!.value.isPlaying
                                          ? Icons.pause
                                          : Icons.play_arrow,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Expanded(
                                    child: VideoProgressIndicator(
                                      _controller!,
                                      allowScrubbing: true,
                                      colors: VideoProgressColors(
                                        playedColor: Color(0xFFFF8000),
                                        bufferedColor: Colors.grey,
                                        backgroundColor: Colors.white24,
                                      ),
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    '${_formatDuration(_controller!.value.position)} / ${_formatDuration(_controller!.value.duration)}',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      )
                    : Container(),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "${twoDigits(duration.inHours)}:$twoDigitMinutes:$twoDigitSeconds";
  }
}
