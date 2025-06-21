import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/api_service.dart';

/// Widget para exibir avatar do usuário com fallback
class ForumAvatar extends StatelessWidget {
  final Map<String, dynamic>? user;
  final double radius;
  final bool showOnlineStatus;

  const ForumAvatar({
    Key? key,
    this.user,
    this.radius = 20,
    this.showOnlineStatus = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final ApiService apiService = ApiService();

    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          backgroundColor: Color(0xFFFF8000),
          child: user?['foto_perfil'] != null
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: _getAvatarUrl(apiService),
                    width: radius * 2,
                    height: radius * 2,
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        CircularProgressIndicator(strokeWidth: 2),
                    errorWidget: (context, url, error) =>
                        _buildFallbackAvatar(),
                  ),
                )
              : _buildFallbackAvatar(),
        ),

        // Indicador de status online
        if (showOnlineStatus)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: radius * 0.4,
              height: radius * 0.4,
              decoration: BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  String _getAvatarUrl(ApiService apiService) {
    final fotoPerfil = user?['foto_perfil'];
    if (fotoPerfil == null) return apiService.defaultAvatarUrl;

    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }

    final email = user?['email'] ?? '';
    return apiService.getUserAvatarUrl(email);
  }

  Widget _buildFallbackAvatar() {
    final name = user?['nome'] ?? 'U';
    final initials = _getInitials(name);

    return Text(
      initials,
      style: TextStyle(
        color: Colors.white,
        fontSize: radius * 0.6,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  String _getInitials(String name) {
    final words = name.trim().split(' ');
    if (words.isEmpty) return 'U';
    if (words.length == 1) return words[0][0].toUpperCase();
    return '${words[0][0]}${words[words.length - 1][0]}'.toUpperCase();
  }
}

/// Widget para exibir anexos (imagens, vídeos, arquivos)
class ForumAnexo extends StatelessWidget {
  final Map<String, dynamic> anexo;
  final bool isPreview;
  final VoidCallback? onTap;

  const ForumAnexo({
    Key? key,
    required this.anexo,
    this.isPreview = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final tipo = anexo['tipo_anexo'] ?? anexo['tipo'];
    final url = anexo['anexo_url'] ?? anexo['url'];
    final nome = anexo['anexo_nome'] ?? anexo['nome'] ?? 'Anexo';

    if (tipo == 'imagem') {
      return _buildImageAnexo(url, nome);
    } else if (tipo == 'video') {
      return _buildVideoAnexo(url, nome);
    } else {
      return _buildFileAnexo(nome, tipo);
    }
  }

  Widget _buildImageAnexo(String url, String nome) {
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: isPreview
              ? Image.network(
                  url,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                      _buildErrorWidget(),
                )
              : CachedNetworkImage(
                  imageUrl: url,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 200,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => _buildErrorWidget(),
                ),
        ),
      ),
    );
  }

  Widget _buildVideoAnexo(String url, String nome) {
    return InkWell(
      onTap: onTap,
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

  Widget _buildFileAnexo(String nome, String? tipo) {
    IconData icon;
    Color iconColor;
    String tipoLabel;

    switch (tipo?.toLowerCase()) {
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
      onTap: onTap,
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

  Widget _buildErrorWidget() {
    return Container(
      height: 150,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.broken_image, color: Colors.grey[400], size: 32),
            SizedBox(height: 8),
            Text(
              'Erro ao carregar imagem',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Widget para exibir botões de ação (like, dislike, comentar, etc.)
class ForumActionButton extends StatelessWidget {
  final IconData icon;
  final String? label;
  final int? count;
  final bool isActive;
  final Color? activeColor;
  final VoidCallback? onPressed;
  final double iconSize;
  final bool isDisabled;

  const ForumActionButton({
    Key? key,
    required this.icon,
    this.label,
    this.count,
    this.isActive = false,
    this.activeColor,
    this.onPressed,
    this.iconSize = 16,
    this.isDisabled = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final color = isDisabled
        ? Colors.grey[400]
        : isActive
            ? (activeColor ?? Color(0xFF4A90E2))
            : Colors.grey[600];

    return InkWell(
      onTap: isDisabled ? null : onPressed,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isActive
              ? (activeColor ?? Color(0xFF4A90E2)).withOpacity(0.1)
              : null,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: iconSize, color: color),
            if (count != null || label != null) ...[
              SizedBox(width: 4),
              Text(
                label ?? count.toString(),
                style: TextStyle(
                  fontSize: 12,
                  color: color,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// 🚩 NOVO: Widget para botão de denúncia melhorado
class ForumDenunciaButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final bool foiDenunciado;
  final String tooltip;
  final double iconSize;

  const ForumDenunciaButton({
    Key? key,
    this.onPressed,
    this.foiDenunciado = false,
    this.tooltip = 'Denunciar',
    this.iconSize = 16,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: foiDenunciado
            ? Colors.red.withOpacity(0.1)
            : Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: foiDenunciado
            ? Border.all(color: Colors.red.withOpacity(0.3))
            : null,
      ),
      child: IconButton(
        onPressed: foiDenunciado ? null : onPressed,
        icon: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.flag,
              color: foiDenunciado ? Colors.red : Colors.grey[600],
              size: iconSize,
            ),
            if (foiDenunciado) ...[
              SizedBox(width: 4),
              Text(
                'Denunciado',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
        tooltip: foiDenunciado ? "Já denunciado" : tooltip,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

/// Widget para exibir indicador de status (denunciado, moderado, etc.)
class ForumStatusIndicator extends StatelessWidget {
  final String status;
  final Color? color;
  final IconData? icon;

  const ForumStatusIndicator({
    Key? key,
    required this.status,
    this.color,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    IconData statusIcon;

    switch (status.toLowerCase()) {
      case 'denunciado':
        statusColor = Colors.red;
        statusIcon = Icons.flag;
        break;
      case 'moderado':
        statusColor = Colors.orange;
        statusIcon = Icons.visibility_off;
        break;
      case 'aprovado':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.info;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (color ?? statusColor).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color ?? statusColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon ?? statusIcon,
            size: 12,
            color: color ?? statusColor,
          ),
          SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              fontSize: 10,
              color: color ?? statusColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget para exibir estatísticas (likes, comentários, visualizações, etc.)
class ForumStats extends StatelessWidget {
  final List<ForumStat> stats;
  final MainAxisAlignment alignment;

  const ForumStats({
    Key? key,
    required this.stats,
    this.alignment = MainAxisAlignment.start,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: alignment,
      children: stats
          .map(
            (stat) => Padding(
              padding: EdgeInsets.only(right: 16),
              child: Column(
                children: [
                  Icon(stat.icon, size: 20, color: Color(0xFF4A90E2)),
                  SizedBox(height: 4),
                  Text(
                    stat.value.toString(),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF333333),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    stat.label,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class ForumStat {
  final IconData icon;
  final String label;
  final int value;

  const ForumStat({
    required this.icon,
    required this.label,
    required this.value,
  });
}

/// Widget para exibir uma mensagem de estado vazio
class ForumEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const ForumEmptyState({
    Key? key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[400]),
          SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          if (subtitle != null) ...[
            SizedBox(height: 8),
            Text(
              subtitle!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (action != null) ...[
            SizedBox(height: 24),
            action!,
          ],
        ],
      ),
    );
  }
}

/// 🚩 NOVO: Widget para modal de denúncia
class ForumDenunciaModal extends StatefulWidget {
  final String tipo; // 'tema' ou 'comentario'
  final Function(String motivo) onDenunciar;

  const ForumDenunciaModal({
    Key? key,
    required this.tipo,
    required this.onDenunciar,
  }) : super(key: key);

  @override
  _ForumDenunciaModalState createState() => _ForumDenunciaModalState();
}

class _ForumDenunciaModalState extends State<ForumDenunciaModal> {
  String? motivoSelecionado;
  String motivoCustom = '';
  final TextEditingController _customController = TextEditingController();

  final List<String> motivosPreDefinidos = [
    'Spam',
    'Conteúdo ofensivo',
    'Discurso de ódio',
    'Assédio',
    'Conteúdo inadequado',
    'Informação falsa',
    'Outro'
  ];

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  String get motivoFinal =>
      motivoSelecionado == 'Outro' ? motivoCustom : (motivoSelecionado ?? '');
  bool get podeEnviar =>
      motivoSelecionado != null &&
      (motivoSelecionado != 'Outro' || motivoCustom.trim().isNotEmpty);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.flag, color: Colors.red),
          SizedBox(width: 8),
          Text('Denunciar ${widget.tipo == 'tema' ? 'Tema' : 'Comentário'}'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Por favor, selecione o motivo da denúncia:'),
            SizedBox(height: 16),

            // Motivos pré-definidos
            ...motivosPreDefinidos.map(
              (motivo) => RadioListTile<String>(
                value: motivo,
                groupValue: motivoSelecionado,
                onChanged: (value) {
                  setState(() {
                    motivoSelecionado = value;
                    if (value != 'Outro') {
                      motivoCustom = '';
                      _customController.clear();
                    }
                  });
                },
                title: Text(motivo, style: TextStyle(fontSize: 14)),
                dense: true,
              ),
            ),

            // Campo para "Outro"
            if (motivoSelecionado == 'Outro') ...[
              SizedBox(height: 8),
              TextField(
                controller: _customController,
                onChanged: (value) {
                  setState(() {
                    motivoCustom = value;
                  });
                },
                decoration: InputDecoration(
                  hintText: 'Descreva o motivo...',
                  border: OutlineInputBorder(),
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                maxLines: 3,
                maxLength: 500,
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: podeEnviar
              ? () {
                  widget.onDenunciar(motivoFinal);
                  Navigator.pop(context);
                }
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          child: Text('Denunciar'),
        ),
      ],
    );
  }
}

/// 🚩 FUNÇÃO AUXILIAR: Mostrar modal de denúncia
Future<void> showForumDenunciaModal({
  required BuildContext context,
  required String tipo,
  required Function(String motivo) onDenunciar,
}) {
  return showDialog(
    context: context,
    builder: (context) => ForumDenunciaModal(
      tipo: tipo,
      onDenunciar: onDenunciar,
    ),
  );
}

/// Função utilitária para formatar datas no contexto do fórum
String formatarDataForum(String? dataString) {
  if (dataString == null) return 'Data indisponível';

  try {
    final data = DateTime.parse(dataString);
    final agora = DateTime.now();
    final diferenca = agora.difference(data);

    if (diferenca.inMinutes < 1) {
      return 'Agora mesmo';
    } else if (diferenca.inHours < 1) {
      return '${diferenca.inMinutes} min atrás';
    } else if (diferenca.inDays < 1) {
      return '${diferenca.inHours}h atrás';
    } else if (diferenca.inDays < 7) {
      return '${diferenca.inDays}d atrás';
    } else {
      return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
    }
  } catch (error) {
    return 'Data inválida';
  }
}

/// Função utilitária para formatar texto longo com "Ver mais"
class ForumExpandableText extends StatefulWidget {
  final String text;
  final int maxLines;
  final TextStyle? style;

  const ForumExpandableText({
    Key? key,
    required this.text,
    this.maxLines = 3,
    this.style,
  }) : super(key: key);

  @override
  _ForumExpandableTextState createState() => _ForumExpandableTextState();
}

class _ForumExpandableTextState extends State<ForumExpandableText> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.text,
          style: widget.style,
          maxLines: _isExpanded ? null : widget.maxLines,
          overflow: _isExpanded ? null : TextOverflow.ellipsis,
        ),
        if (widget.text.length > 100) // Só mostra se o texto for longo
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Padding(
              padding: EdgeInsets.only(top: 4),
              child: Text(
                _isExpanded ? 'Ver menos' : 'Ver mais',
                style: TextStyle(
                  color: Color(0xFF4A90E2),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// 🚩 NOVO: Widget para mostrar feedback de denúncia
class ForumDenunciaFeedback extends StatelessWidget {
  final bool foiDenunciado;
  final String? motivoDenuncia;
  final VoidCallback? onCancelarDenuncia;

  const ForumDenunciaFeedback({
    Key? key,
    required this.foiDenunciado,
    this.motivoDenuncia,
    this.onCancelarDenuncia,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!foiDenunciado) return SizedBox.shrink();

    return Container(
      margin: EdgeInsets.only(top: 8),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.flag, color: Colors.red, size: 16),
          SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Conteúdo denunciado',
                  style: TextStyle(
                    color: Colors.red,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (motivoDenuncia != null) ...[
                  SizedBox(height: 2),
                  Text(
                    'Motivo: $motivoDenuncia',
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: 10,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (onCancelarDenuncia != null)
            TextButton(
              onPressed: onCancelarDenuncia,
              child: Text(
                'Cancelar',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
