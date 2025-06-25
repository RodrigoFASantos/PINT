import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mime/mime.dart';
import '../../services/api_service.dart';
import '../../main.dart';

class CriarTemaModal extends StatefulWidget {
  final String topicoId;
  final Function(Map<String, dynamic>) onSuccess;

  const CriarTemaModal({
    Key? key,
    required this.topicoId,
    required this.onSuccess,
  }) : super(key: key);

  @override
  _CriarTemaModalState createState() => _CriarTemaModalState();
}

class _CriarTemaModalState extends State<CriarTemaModal> {
  final ApiService _apiService = ApiService();
  final _tituloController = TextEditingController();
  final _textoController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();

  bool _enviando = false;
  String? _erro;
  File? _anexo;
  Map<String, String>? _anexoInfo;

  @override
  void dispose() {
    _tituloController.dispose();
    _textoController.dispose();
    super.dispose();
  }

  // Detectar Content-Type baseado na extensão
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
        _adicionarAnexo(File(image.path), 'imagem', image.name, image.mimeType);
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
        _adicionarAnexo(File(image.path), 'imagem', image.name, image.mimeType);
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
        allowMultiple: false,
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

        // USAR O MIME TYPE DO FILE PICKER SE DISPONÍVEL
        final mimeType =
            lookupMimeType(file.path) ?? _detectContentType(file.path, null);

        _adicionarAnexo(file, tipo, nome, mimeType);
      }
    } catch (error) {
      AppUtils.showError(context, 'Erro ao selecionar arquivo: $error');
    }
  }

  // ATUALIZADA: Incluir mimeType
  void _adicionarAnexo(File file, String tipo, String nome, String? mimeType) {
    setState(() {
      _anexo = file;
      _anexoInfo = {
        'tipo': tipo,
        'nome': nome,
        'path': file.path,
        'mimeType': mimeType ??
            _detectContentType(file.path, null), // GUARDAR MIME TYPE
      };
    });

    debugPrint('📎 [ANEXO] Adicionado: $nome');
    debugPrint('📎 [ANEXO] Tipo: $tipo');
    debugPrint('📎 [ANEXO] MIME Type: ${_anexoInfo!['mimeType']}');
  }

  void _removerAnexo() {
    setState(() {
      _anexo = null;
      _anexoInfo = null;
    });
  }

  void _mostrarOpcoesAnexo() {
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildOpcaoAnexo(
                  icon: Icons.camera_alt,
                  label: 'Câmera',
                  onTap: () {
                    Navigator.pop(context);
                    _tirarFoto();
                  },
                ),
                _buildOpcaoAnexo(
                  icon: Icons.photo_library,
                  label: 'Galeria',
                  onTap: () {
                    Navigator.pop(context);
                    _selecionarImagem();
                  },
                ),
                _buildOpcaoAnexo(
                  icon: Icons.attach_file,
                  label: 'Arquivo',
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
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Color(0xFF4A90E2).withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Color(0xFF4A90E2), size: 28),
            SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: Color(0xFF4A90E2),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _criarTema() async {
    if (_textoController.text.trim().isEmpty &&
        _tituloController.text.trim().isEmpty &&
        _anexo == null) {
      setState(() {
        _erro = 'É necessário fornecer título, texto ou anexo para o tema.';
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
            '${_apiService.apiBase}/forum-tema/topico/${widget.topicoId}/tema'),
      );

      // Headers
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Campos de texto
      request.fields['titulo'] = _tituloController.text;
      request.fields['texto'] = _textoController.text;

      // Adicionar Content-Type correto ao anexo
      if (_anexo != null && _anexoInfo != null) {
        var stream = http.ByteStream(_anexo!.openRead());
        var length = await _anexo!.length();

        // DETECTAR E DEFINIR CONTENT-TYPE CORRETO
        final contentType =
            _detectContentType(_anexo!.path, _anexoInfo!['mimeType']);

        debugPrint('📎 [UPLOAD] Arquivo: ${_anexoInfo!['nome']}');
        debugPrint('📎 [UPLOAD] Content-Type detectado: $contentType');
        debugPrint('📎 [UPLOAD] Tamanho: $length bytes');

        var multipartFile = http.MultipartFile(
          'anexo',
          stream,
          length,
          filename: _anexoInfo!['nome'],
          contentType:
              MediaType.parse(contentType),
        );

        request.files.add(multipartFile);
      }

      debugPrint(
          '🚀 [CRIAR_TEMA] Enviando tema${_anexo != null ? ' com anexo' : ''}');

      // Enviar requisição
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      debugPrint('📡 [CRIAR_TEMA] Status: ${response.statusCode}');
      debugPrint('📡 [CRIAR_TEMA] Response: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body);
        if (data != null && data['success'] == true && data['data'] != null) {
          widget.onSuccess(data['data']);
          Navigator.pop(context);
          AppUtils.showSuccess(context, 'Tema criado com sucesso!');
        } else {
          throw Exception('Resposta inválida do servidor');
        }
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro no servidor');
      }
    } catch (error) {
      setState(() {
        _erro = 'Erro ao criar tema: $error';
      });
      debugPrint('❌ [CRIAR_TEMA] Erro: $error');
    } finally {
      setState(() {
        _enviando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        padding: EdgeInsets.all(24),
        constraints: BoxConstraints(
          maxWidth: 500,
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Criar Novo Tema',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF333333),
                  ),
                ),
                IconButton(
                  onPressed: _enviando ? null : () => Navigator.pop(context),
                  icon: Icon(Icons.close),
                  color: Colors.grey[600],
                ),
              ],
            ),

            SizedBox(height: 20),

            // Formulário
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Campo título
                    TextField(
                      controller: _tituloController,
                      decoration: InputDecoration(
                        labelText: 'Título do tema (opcional)',
                        hintText: 'Digite um título para o seu tema...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        prefixIcon: Icon(Icons.title),
                      ),
                      enabled: !_enviando,
                    ),

                    SizedBox(height: 16),

                    // Campo texto
                    TextField(
                      controller: _textoController,
                      decoration: InputDecoration(
                        labelText: 'Conteúdo do tema',
                        hintText:
                            'Sobre o que deseja conversar? Inicie uma discussão ou coloque uma pergunta...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignLabelWithHint: true,
                      ),
                      maxLines: 6,
                      enabled: !_enviando,
                    ),

                    SizedBox(height: 16),

                    // Preview do anexo
                    if (_anexo != null && _anexoInfo != null) ...[
                      Text(
                        'Anexo:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: 8),
                      _buildAnexoPreview(),
                      SizedBox(height: 16),
                    ],

                    // Botão anexar
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _enviando ? null : _mostrarOpcoesAnexo,
                        icon: Icon(Icons.attach_file),
                        label: Text(_anexo == null
                            ? 'Anexar Arquivo'
                            : 'Alterar Anexo'),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),

                    // Mensagem de erro
                    if (_erro != null) ...[
                      SizedBox(height: 16),
                      Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: Colors.red),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _erro!,
                                style: TextStyle(color: Colors.red.shade700),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            SizedBox(height: 20),

            // Botões de ação
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: _enviando ? null : () => Navigator.pop(context),
                  child: Text('Cancelar'),
                ),
                SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _enviando ? null : _criarTema,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF4CAF50),
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: _enviando
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                            SizedBox(width: 8),
                            Text('A publicar...'),
                          ],
                        )
                      : Text('Publicar'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnexoPreview() {
    if (_anexo == null || _anexoInfo == null) return SizedBox.shrink();

    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          // Preview do anexo
          if (_anexoInfo!['tipo'] == 'imagem') ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(
                _anexo!,
                height: 50,
                width: 50,
                fit: BoxFit.cover,
              ),
            ),
          ] else ...[
            Container(
              height: 50,
              width: 50,
              decoration: BoxDecoration(
                color: Color(0xFF4A90E2).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _anexoInfo!['tipo'] == 'video'
                    ? Icons.video_file
                    : Icons.insert_drive_file,
                color: Color(0xFF4A90E2),
                size: 24,
              ),
            ),
          ],

          SizedBox(width: 12),

          // Info do arquivo
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _anexoInfo!['nome'] ?? 'Arquivo',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Text(
                  _anexoInfo!['tipo'] == 'imagem'
                      ? 'Imagem'
                      : _anexoInfo!['tipo'] == 'video'
                          ? 'Vídeo'
                          : 'Documento',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                // MOSTRAR MIME TYPE PARA DEBUG
                if (_anexoInfo!['mimeType'] != null) ...[
                  SizedBox(height: 2),
                  Text(
                    'Tipo: ${_anexoInfo!['mimeType']}',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.grey[500],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
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

// Função auxiliar para mostrar o modal
void showCriarTemaModal({
  required BuildContext context,
  required String topicoId,
  required Function(Map<String, dynamic>) onSuccess,
}) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => CriarTemaModal(
      topicoId: topicoId,
      onSuccess: onSuccess,
    ),
  );
}
