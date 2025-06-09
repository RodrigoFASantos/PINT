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
          debugPrint('🖼️ Erro ao carregar imagem: $url - Error: $error');

          // Se há URL de fallback, tentar carregar
          if (fallbackUrl != null &&
              fallbackUrl!.isNotEmpty &&
              fallbackUrl != imageUrl) {
            return CachedNetworkImage(
              imageUrl: fallbackUrl!,
              width: width,
              height: height,
              fit: fit,
              placeholder: (context, url) =>
                  placeholder ?? _buildDefaultPlaceholder(),
              errorWidget: (context, url, error) {
                debugPrint(
                    '🖼️ Erro ao carregar imagem de fallback: $url - Error: $error');
                return errorWidget ?? _buildDefaultErrorWidget();
              },
            );
          }

          return errorWidget ?? _buildDefaultErrorWidget();
        },
        httpHeaders: {
          'User-Agent': 'SoftSkills Mobile App',
          'Accept': 'image/*',
        },
      ),
    );
  }

  Widget _buildDefaultPlaceholder() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[200],
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.grey[400]!),
          ),
        ),
      ),
    );
  }

  Widget _buildDefaultErrorWidget() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[300],
      child: Icon(
        Icons.image_not_supported,
        color: Colors.grey[600],
        size: 32,
      ),
    );
  }
}

// Widget específico para avatar
class AvatarImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double radius;
  final Color backgroundColor;

  const AvatarImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.radius = 50,
    this.backgroundColor = Colors.grey,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: backgroundColor,
      child: ClipOval(
        child: CustomNetworkImage(
          imageUrl: imageUrl,
          fallbackUrl: fallbackUrl,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          errorWidget: Icon(
            Icons.person,
            size: radius,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

// Widget específico para imagens de curso
class CursoImage extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Gradient? gradient;

  const CursoImage({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.gradient,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: gradient,
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomNetworkImage(
              imageUrl: imageUrl,
              fallbackUrl: fallbackUrl,
              width: width,
              height: height,
              fit: fit,
              borderRadius: borderRadius,
              errorWidget: Container(
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
                  child: Icon(
                    Icons.school,
                    size: 48,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ),
            ),
          ),
          if (gradient != null)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  gradient: gradient,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
