import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

/// Widget para exibir um único anexo
class AnexoWidget extends StatelessWidget {
  final Map<String, dynamic> anexo;
  final bool isPreview;
  final double? maxHeight;

  const AnexoWidget({
    Key? key,
    required this.anexo,
    this.isPreview = false,
    this.maxHeight,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final ApiService apiService = ApiService();

    final anexoUrl = anexo['anexo_url'] ?? anexo['url'];
    final anexoNome = anexo['anexo_nome'] ?? anexo['nome'] ?? 'Anexo';
    final tipoAnexo = anexo['tipo_anexo'] ?? anexo['tipo'] ?? 'arquivo';

    if (anexoUrl == null || anexoUrl.isEmpty) {
      return SizedBox.shrink();
    }

    // Construir URL completa
    final fullUrl = anexoUrl.startsWith('http')
        ? anexoUrl
        : '${apiService.apiBase.replaceAll('/api', '')}/$anexoUrl';

    switch (tipoAnexo.toLowerCase()) {
      case 'imagem':
        return _buildImageWidget(fullUrl, anexoNome, context);
      case 'video':
        return _buildVideoWidget(fullUrl, anexoNome, context);
      default:
        return _buildFileWidget(fullUrl, anexoNome, tipoAnexo, context);
    }
  }

  Widget _buildImageWidget(
      String imageUrl, String imageName, BuildContext context) {
    final height = isPreview ? 150.0 : (maxHeight ?? 250.0);

    return InkWell(
      onTap: () => _showImageDialog(context, imageUrl, imageName),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            imageUrl,
            height: height,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              height: height,
              color: Colors.grey[200],
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.broken_image, color: Colors.grey[400], size: 32),
                    SizedBox(height: 8),
                    Text(
                      'Erro ao carregar imagem',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                    if (!isPreview) ...[
                      SizedBox(height: 4),
                      Text(
                        imageName,
                        style: TextStyle(color: Colors.grey[500], fontSize: 10),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Container(
                height: height,
                child: Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                        : null,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildVideoWidget(
      String videoUrl, String videoName, BuildContext context) {
    return InkWell(
      onTap: () => _launchUrl(videoUrl),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8),
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(0xFF4A90E2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.play_arrow, color: Colors.white, size: 24),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    videoName,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Arquivo de vídeo',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.open_in_new, color: Colors.grey[600], size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildFileWidget(
      String fileUrl, String fileName, String fileType, BuildContext context) {
    IconData icon;
    Color iconColor;
    String tipoLabel;

    switch (fileType.toLowerCase()) {
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
      default:
        icon = Icons.insert_drive_file;
        iconColor = Color(0xFF4A90E2);
        tipoLabel = 'Arquivo';
    }

    return InkWell(
      onTap: () => _launchUrl(fileUrl),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8),
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
                    fileName,
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

  void _showImageDialog(
      BuildContext context, String imageUrl, String imageName) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        child: Container(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppBar(
                title: Text(imageName, style: TextStyle(color: Colors.white)),
                backgroundColor: Colors.black,
                iconTheme: IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: InteractiveViewer(
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.broken_image,
                              color: Colors.white, size: 64),
                          SizedBox(height: 16),
                          Text(
                            'Erro ao carregar imagem',
                            style: TextStyle(color: Colors.white),
                          ),
                          SizedBox(height: 8),
                          Text(
                            imageUrl,
                            style: TextStyle(
                                color: Colors.grey[400], fontSize: 12),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
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

  void _launchUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      debugPrint('Não foi possível abrir o URL: $url');
    }
  }
}

/// Widget para exibir uma lista de anexos
class ListaAnexos extends StatelessWidget {
  final List<dynamic> anexos;
  final bool isPreview;
  final double? maxHeight;

  const ListaAnexos({
    Key? key,
    required this.anexos,
    this.isPreview = false,
    this.maxHeight,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (anexos.isEmpty) {
      return SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: anexos.map<Widget>((anexo) {
        return AnexoWidget(
          anexo: anexo,
          isPreview: isPreview,
          maxHeight: maxHeight,
        );
      }).toList(),
    );
  }
}

/// Widget compacto para mostrar indicador de anexo
class IndicadorAnexo extends StatelessWidget {
  final String tipoAnexo;
  final String? nomeAnexo;

  const IndicadorAnexo({
    Key? key,
    required this.tipoAnexo,
    this.nomeAnexo,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (tipoAnexo.toLowerCase()) {
      case 'imagem':
        icon = Icons.image;
        color = Colors.green;
        break;
      case 'video':
        icon = Icons.video_file;
        color = Colors.red;
        break;
      case 'pdf':
        icon = Icons.picture_as_pdf;
        color = Colors.red;
        break;
      case 'doc':
      case 'docx':
        icon = Icons.description;
        color = Colors.blue;
        break;
      default:
        icon = Icons.attach_file;
        color = Color(0xFF4A90E2);
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          if (nomeAnexo != null) ...[
            SizedBox(width: 4),
            Flexible(
              child: Text(
                nomeAnexo!,
                style: TextStyle(
                  fontSize: 10,
                  color: color,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
