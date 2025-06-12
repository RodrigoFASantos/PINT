import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CustomNetworkImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Widget? placeholder;
  final Widget? errorWidget;
  final BorderRadius? borderRadius;
  final Duration? cacheDuration;
  final Map<String, String>? headers;

  const CustomNetworkImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
    this.cacheDuration,
    this.headers,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) =>
            placeholder ?? _buildDefaultPlaceholder(),
        errorWidget: (context, url, error) {
          debugPrint('🖼️ [IMAGE] Erro ao carregar: $url');
          debugPrint('🖼️ [IMAGE] Erro detalhado: $error');

          // Se há URL de fallback, tentar carregar
          if (fallbackUrl != null &&
              fallbackUrl!.isNotEmpty &&
              fallbackUrl != imageUrl) {
            debugPrint('🖼️ [IMAGE] Tentando fallback: $fallbackUrl');
            return CachedNetworkImage(
              imageUrl: fallbackUrl!,
              width: width,
              height: height,
              fit: fit,
              placeholder: (context, url) =>
                  placeholder ?? _buildDefaultPlaceholder(),
              errorWidget: (context, url, error) {
                debugPrint('🖼️ [IMAGE] Fallback também falhou: $url');
                return errorWidget ?? _buildDefaultErrorWidget();
              },
              httpHeaders: _getHeaders(),
            );
          }

          return errorWidget ?? _buildDefaultErrorWidget();
        },
        httpHeaders: _getHeaders(),
        cacheManager: null, // Usar o padrão
        useOldImageOnUrlChange: true,
        fadeInDuration: Duration(milliseconds: 300),
        fadeOutDuration: Duration(milliseconds: 100),
      ),
    );
  }

  Map<String, String> _getHeaders() {
    final defaultHeaders = {
      'User-Agent': 'SoftSkills Mobile App',
      'Accept': 'image/*',
      'Cache-Control': 'max-age=3600', // Cache por 1 hora
    };

    if (headers != null) {
      defaultHeaders.addAll(headers!);
    }

    return defaultHeaders;
  }

  Widget _buildDefaultPlaceholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: borderRadius,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.grey[400]!),
              ),
            ),
            if (height == null || height! > 60) ...[
              SizedBox(height: 8),
              Text(
                'Carregando...',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultErrorWidget() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: borderRadius,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.image_not_supported,
              color: Colors.grey[500],
              size: (width != null && width! < 100) ? 24 : 32,
            ),
            if (height == null || height! > 60) ...[
              SizedBox(height: 4),
              Text(
                'Imagem\nindisponível',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// Widget específico para avatar - MELHORADO
class AvatarImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double radius;
  final Color backgroundColor;
  final Widget? placeholder;
  final VoidCallback? onTap;

  const AvatarImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.radius = 50,
    this.backgroundColor = Colors.grey,
    this.placeholder,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget avatar = CircleAvatar(
      radius: radius,
      backgroundColor: backgroundColor.withOpacity(0.1),
      child: ClipOval(
        child: CustomNetworkImage(
          imageUrl: imageUrl,
          fallbackUrl: fallbackUrl,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          placeholder: placeholder ??
              Container(
                width: radius * 2,
                height: radius * 2,
                color: backgroundColor.withOpacity(0.1),
                child: Center(
                  child: SizedBox(
                    width: radius * 0.4,
                    height: radius * 0.4,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(backgroundColor),
                    ),
                  ),
                ),
              ),
          errorWidget: Container(
            width: radius * 2,
            height: radius * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  backgroundColor.withOpacity(0.8),
                  backgroundColor,
                ],
              ),
            ),
            child: Icon(
              Icons.person,
              size: radius * 0.8,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: avatar,
      );
    }

    return avatar;
  }
}

// Widget específico para imagens de curso - MUITO MELHORADO
class CursoImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Gradient? gradient;
  final Widget? child; // Para overlay personalizado
  final String? cursoNome; // Para placeholder personalizado
  final VoidCallback? onTap;
  final bool showLoadingText;

  const CursoImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.gradient,
    this.child,
    this.cursoNome,
    this.onTap,
    this.showLoadingText = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget image = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
      ),
      child: Stack(
        children: [
          // Imagem principal
          Positioned.fill(
            child: CustomNetworkImage(
              imageUrl: imageUrl,
              fallbackUrl: fallbackUrl,
              width: width,
              height: height,
              fit: fit,
              borderRadius: borderRadius,
              placeholder: _buildCursoPlaceholder(),
              errorWidget: _buildCursoErrorWidget(),
            ),
          ),
          // Overlay gradiente se fornecido
          if (gradient != null)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  gradient: gradient,
                ),
              ),
            ),
          // Child personalizado (para textos, etc.)
          if (child != null) Positioned.fill(child: child!),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: image,
      );
    }

    return image;
  }

  Widget _buildCursoPlaceholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF8000).withOpacity(0.3),
            Color(0xFFFF6600).withOpacity(0.3),
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF8000)),
              ),
            ),
            if (showLoadingText && (height == null || height! > 80)) ...[
              SizedBox(height: 12),
              Text(
                'Carregando curso...',
                style: TextStyle(
                  color: Color(0xFFFF8000),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCursoErrorWidget() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF8000),
            Color(0xFFFF6600),
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.school,
              size: (width != null && width! < 150) ? 32 : 48,
              color: Colors.white.withOpacity(0.9),
            ),
            if (height == null || height! > 80) ...[
              SizedBox(height: 8),
              Text(
                cursoNome ?? 'Curso',
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: (width != null && width! < 150) ? 11 : 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// Widget para imagem de capa (banner)
class CapaImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double? width;
  final double? height;
  final Widget? overlay;
  final BorderRadius? borderRadius;

  const CapaImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.width,
    this.height,
    this.overlay,
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomNetworkImage(
              imageUrl: imageUrl,
              fallbackUrl: fallbackUrl,
              width: width,
              height: height,
              fit: BoxFit.cover,
              borderRadius: borderRadius,
              errorWidget: Container(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xFFFF8000),
                      Color(0xFFFF6600),
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.image,
                    size: 64,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ),
            ),
          ),
          if (overlay != null) Positioned.fill(child: overlay!),
        ],
      ),
    );
  }
}

// Extensões úteis para facilitar o uso
extension NetworkImageExtensions on Widget {
  Widget withNetworkImage({
    required String imageUrl,
    String? fallbackUrl,
    BoxFit fit = BoxFit.cover,
  }) {
    return CustomNetworkImage(
      imageUrl: imageUrl,
      fallbackUrl: fallbackUrl,
      fit: fit,
    );
  }
}
