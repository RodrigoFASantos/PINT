import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // ✅ ADICIONADO: Importação para MediaType
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mime/mime.dart'; // ✅ ADICIONAR ESTA DEPENDÊNCIA
import '../../services/api_service.dart';
import '../../main.dart';

class NovoComentarioForm extends StatefulWidget {
  final String temaId;
  final Function(Map<String, dynamic>) onSuccess;
  final String? placeholder;

  const NovoComentarioForm({
    Key? key,
    required this.temaId,
    required this.onSuccess,
    this.placeholder,
  }) : super(key: key);

  @override
  _NovoComentarioFormState createState() => _NovoComentarioFormState();
}

class _NovoComentarioFormState extends State<NovoComentarioForm> {
  final ApiService _apiService = ApiService();
  final TextEditingController _controller = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  final FocusNode _focusNode = FocusNode();

  bool _enviando = false;
  String? _erro;
  File? _anexo;
  String? _anexoTipo;
  String? _anexoNome;
  String? _anexoMimeType; // ✅ ADICIONAR CAMPO PARA MIME TYPE

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  // ✅ NOVA FUNÇÃO: Detectar Content-Type baseado na extensão
  String _detectContentType(String filePath, String? originalMimeType) {
    // Primeiro, tentar usar o MIME type original se disponível e válido
    if (originalMimeType != null &&
        originalMimeType != 'application/octet-stream' &&
        originalMimeType.isNotEmpty) {
      return originalMimeType;
    }

    // Se não tiver MIME type válido, detectar pela extensão
    final mimeType = lookupMimeType(filePath);
    if (mimeType != null) {
      return mimeType;
    }

    // Fallback baseado na extensão manual
    final extension = filePath.toLowerCase().split('.').last;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/quicktime';
      case 'webm':
        return 'video/webm';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      default:
        return 'application/octet-stream'; // Último recurso
    }
  }

  Future<void> _selecionarImagem() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _anexo = File(image.path);
          _anexoTipo = 'imagem';
          _anexoNome = image.name;
          _anexoMimeType = _detectContentType(
              image.path, image.mimeType); // ✅ DETECTAR MIME TYPE
        });

        debugPrint('📎 [IMAGEM] Selecionada: ${image.name}');
        debugPrint('📎 [IMAGEM] MIME Type: $_anexoMimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao selecionar imagem: $error');
    }
  }

  Future<void> _tirarFoto() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _anexo = File(image.path);
          _anexoTipo = 'imagem';
          _anexoNome = image.name;
          _anexoMimeType = _detectContentType(
              image.path, image.mimeType); // ✅ DETECTAR MIME TYPE
        });

        debugPrint('📎 [FOTO] Tirada: ${image.name}');
        debugPrint('📎 [FOTO] MIME Type: $_anexoMimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao tirar foto: $error');
    }
  }

  Future<void> _selecionarArquivo() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: [
          'pdf',
          'doc',
          'docx',
          'txt',
          'mp4',
          'avi',
          'mov',
          'jpg',
          'jpeg',
          'png'
        ],
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final extension = result.files.single.extension?.toLowerCase();
        final nome = result.files.single.name;

        String tipo = 'arquivo';
        if (['jpg', 'jpeg', 'png', 'gif'].contains(extension)) {
          tipo = 'imagem';
        } else if (['mp4', 'avi', 'mov', 'webm'].contains(extension)) {
          tipo = 'video';
        }

        // ✅ DETECTAR MIME TYPE
        final mimeType = _detectContentType(file.path, null);

        setState(() {
          _anexo = file;
          _anexoTipo = tipo;
          _anexoNome = nome;
          _anexoMimeType = mimeType; // ✅ GUARDAR MIME TYPE
        });

        debugPrint('📎 [ARQUIVO] Selecionado: $nome');
        debugPrint('📎 [ARQUIVO] Tipo: $tipo');
        debugPrint('📎 [ARQUIVO] MIME Type: $mimeType');
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao selecionar arquivo: $error');
    }
  }

  void _mostrarOpcoesAnexo() {
    // Blur do input
    _focusNode.unfocus();

    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Adicionar Anexo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),

            // Opções em linha como na web
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildOpcaoAnexo(
                  icon: Icons.camera_alt,
                  label: 'Câmera',
                  color: Colors.green,
                  onTap: () {
                    Navigator.pop(context);
                    _tirarFoto();
                  },
                ),
                _buildOpcaoAnexo(
                  icon: Icons.photo_library,
                  label: 'Galeria',
                  color: Colors.blue,
                  onTap: () {
                    Navigator.pop(context);
                    _selecionarImagem();
                  },
                ),
                _buildOpcaoAnexo(
                  icon: Icons.attach_file,
                  label: 'Arquivo',
                  color: Colors.orange,
                  onTap: () {
                    Navigator.pop(context);
                    _selecionarArquivo();
                  },
                ),
              ],
            ),
            SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildOpcaoAnexo({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 28),
            SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _removerAnexo() {
    setState(() {
      _anexo = null;
      _anexoTipo = null;
      _anexoNome = null;
      _anexoMimeType = null; // ✅ LIMPAR MIME TYPE
    });
  }

  Future<void> _enviarComentario() async {
    if (_controller.text.trim().isEmpty && _anexo == null) {
      setState(() {
        _erro =
            'O comentário não pode estar vazio e deve incluir texto ou anexo.';
      });
      return;
    }

    setState(() {
      _enviando = true;
      _erro = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      var request = http.MultipartRequest(
        'POST',
        Uri.parse(
            '${_apiService.apiBase}/forum-tema/tema/${widget.temaId}/comentario'),
      );

      // Headers
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Campo de texto
      request.fields['texto'] = _controller.text;

      // ✅ CORRIGIDO: Adicionar Content-Type correto ao anexo
      if (_anexo != null) {
        var stream = http.ByteStream(_anexo!.openRead());
        var length = await _anexo!.length();

        // ✅ DETECTAR E DEFINIR CONTENT-TYPE CORRETO
        final contentType = _detectContentType(_anexo!.path, _anexoMimeType);

        debugPrint('📎 [UPLOAD] Comentário - Arquivo: $_anexoNome');
        debugPrint('📎 [UPLOAD] Content-Type detectado: $contentType');
        debugPrint('📎 [UPLOAD] Tamanho: $length bytes');

        var multipartFile = http.MultipartFile(
          'anexo',
          stream,
          length,
          filename:
              _anexoNome ?? 'anexo_${DateTime.now().millisecondsSinceEpoch}',
          contentType:
              MediaType.parse(contentType), // ✅ CONTENT-TYPE ADICIONADO
        );

        request.files.add(multipartFile);
      }

      debugPrint(
          '🚀 [COMENTARIO] Enviando comentário${_anexo != null ? ' com anexo' : ''}');

      // Enviar requisição
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      debugPrint('📡 [COMENTARIO] Status: ${response.statusCode}');
      debugPrint('📡 [COMENTARIO] Response: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data != null && data['data'] != null) {
          widget.onSuccess(data['data']);

          // Limpar formulário
          setState(() {
            _controller.clear();
            _anexo = null;
            _anexoTipo = null;
            _anexoNome = null;
            _anexoMimeType = null; // ✅ LIMPAR MIME TYPE
          });

          AppUtils.showSuccess(context, 'Comentário enviado com sucesso!');
        } else {
          throw Exception('Erro ao enviar comentário');
        }
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro no servidor');
      }
    } catch (error) {
      setState(() {
        _erro = 'Erro ao enviar comentário: $error';
      });
      debugPrint('❌ [COMENTARIO] Erro: $error');
    } finally {
      setState(() {
        _enviando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview do anexo
          if (_anexo != null) ...[
            _buildAnexoPreview(),
            SizedBox(height: 12),
          ],

          // Mensagem de erro
          if (_erro != null) ...[
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _erro!,
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 12),
          ],

          // Campo de texto e botões
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Campo de texto
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Input de texto
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          focusNode: _focusNode,
                          decoration: InputDecoration(
                            hintText: widget.placeholder ??
                                'Escreva um comentário...',
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                          ),
                          maxLines: null,
                          maxLength: 1000,
                          keyboardType: TextInputType.multiline,
                          textInputAction: TextInputAction.newline,
                          enabled: !_enviando,
                          buildCounter: (context,
                              {required currentLength,
                              required isFocused,
                              maxLength}) {
                            // Ocultar contador
                            return null;
                          },
                        ),
                      ),

                      // Botão anexar
                      Container(
                        margin: EdgeInsets.only(right: 4, bottom: 4),
                        child: IconButton(
                          onPressed: _enviando ? null : _mostrarOpcoesAnexo,
                          icon: Icon(Icons.attach_file),
                          color: Color(0xFF4A90E2),
                          iconSize: 24,
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              SizedBox(width: 8),

              // Botão enviar
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFF8000),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFFFF8000).withOpacity(0.3),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  onPressed: _enviando ? null : _enviarComentario,
                  icon: _enviando
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Icon(Icons.send),
                  color: Colors.white,
                  iconSize: 24,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnexoPreview() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          // Preview do conteúdo
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
            ),
            child: _anexoTipo == 'imagem'
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      _anexo!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  )
                : Container(
                    decoration: BoxDecoration(
                      color: Color(0xFF4A90E2).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _anexoTipo == 'video'
                          ? Icons.video_file
                          : Icons.insert_drive_file,
                      color: Color(0xFF4A90E2),
                      size: 30,
                    ),
                  ),
          ),

          SizedBox(width: 12),

          // Informações do arquivo
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _anexoNome ?? 'Arquivo',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Text(
                  _anexoTipo == 'imagem'
                      ? 'Imagem'
                      : _anexoTipo == 'video'
                          ? 'Vídeo'
                          : 'Documento',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                // ✅ MOSTRAR MIME TYPE PARA DEBUG
                if (_anexoMimeType != null) ...[
                  SizedBox(height: 2),
                  Text(
                    'Tipo: $_anexoMimeType',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[500],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
                SizedBox(height: 4),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Pronto para enviar',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.green[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Botão remover
          IconButton(
            onPressed: _enviando ? null : _removerAnexo,
            icon: Icon(Icons.close, size: 20),
            color: Colors.red,
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}
