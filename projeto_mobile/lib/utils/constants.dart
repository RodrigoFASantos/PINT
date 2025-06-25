import 'package:flutter/material.dart';

/// Cores principais da aplicação
class AppColors {
  // Cores primárias (baseadas no CSS original)
  static const Color primary = Color(0xFFFF8000); // #ff8000 - Laranja principal
  static const Color secondary = Color(0xFFE67300); // #e67300 - Laranja hover
  static const Color darkBackground =
      Color(0xFF1A1A1A); // #1a1a1a - Fundo escuro

  // Cores de estado
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFF44336);
  static const Color warning = Color(0xFFFF8000);
  static const Color info = Color(0xFF2196F3);

  // Cores de status de curso
  static const Color statusDisponivel = Color(0xFF4CAF50); // Verde
  static const Color statusEmCurso = Color(0xFF2196F3); // Azul
  static const Color statusTerminado = Color(0xFF9E9E9E); // Cinza
  static const Color statusAgendado = Color(0xFFFF8000); // Laranja
  static const Color statusLotado = Color(0xFFF44336); // Vermelho

  // Cores neutras
  static const Color background = Color(0xFFF5F7FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color onSurface = Color(0xFF000000);

  // Cores de texto
  static const Color textPrimary = Color(0xFF212529);
  static const Color textSecondary = Color(0xFF6C757D);
  static const Color textLight = Color(0xFF9E9E9E);
  static const Color textWhite = Color(0xFFFFFFFF);

  // Cores específicas do tema
  static const Color cardBorder = Color(0xFFFF8000);
  static const Color glowEffect = Color(0x99FF8000); // FF8000 com 60% opacity
  static const Color hoverBackground = Color(0xFFE67300);

  // Cores de borda
  static const Color border = Color(0xFFE1E4E8);
  static const Color borderLight = Color(0xFFF0F0F0);
}

/// Espaçamentos padronizados
class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

/// Raios de borda padronizados
class AppRadius {
  static const double small = 4.0;
  static const double medium = 8.0;
  static const double large = 12.0;
  static const double xl = 16.0;
  static const double xxl = 20.0;
  static const double circular = 50.0;
}

/// Elevações padronizadas
class AppElevation {
  static const double none = 0.0;
  static const double low = 2.0;
  static const double medium = 4.0;
  static const double high = 8.0;
  static const double veryHigh = 16.0;
}

/// Estilos de texto padronizados
class AppTextStyles {
  // Cabeçalhos
  static const TextStyle headline1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    height: 1.2,
  );

  static const TextStyle headline2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static const TextStyle headline3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static const TextStyle headline4 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  // Texto de corpo
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  // Texto de botões e labels
  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.2,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.2,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w500,
    color: AppColors.textLight,
    height: 1.2,
  );

  // Texto de links
  static const TextStyle link = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: AppColors.primary,
    decoration: TextDecoration.underline,
    height: 1.5,
  );

  // Texto de caption
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textLight,
    fontStyle: FontStyle.italic,
    height: 1.3,
  );
}

/// Durações de animação padronizadas
class AppDurations {
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration medium = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration verySlow = Duration(milliseconds: 1000);
}

/// Configurações de responsividade
class AppBreakpoints {
  static const double mobile = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
  static const double largeDesktop = 1600;
}

/// Tamanhos de ícones padronizados
class AppIconSizes {
  static const double small = 16.0;
  static const double medium = 24.0;
  static const double large = 32.0;
  static const double xl = 48.0;
  static const double xxl = 64.0;
}

/// Configurações de imagem
class AppImageConfig {
  static const double avatarSizeSmall = 40.0;
  static const double avatarSizeMedium = 60.0;
  static const double avatarSizeLarge = 100.0;
  static const double avatarSizeXL = 160.0;

  static const double cardImageHeight = 140.0;
  static const double coverImageHeight = 200.0;
  static const double heroImageHeight = 300.0;
}

/// Configurações de loading
class AppLoadingConfig {
  static const double progressIndicatorSize = 24.0;
  static const double progressIndicatorSizeLarge = 48.0;
  static const Duration loadingDelay = Duration(milliseconds: 300);
}

/// Configurações de Cards
class AppCardConfig {
  static const double defaultElevation = AppElevation.medium;
  static const double defaultRadius = AppRadius.large;
  static const EdgeInsets defaultPadding = EdgeInsets.all(AppSpacing.md);
  static const EdgeInsets defaultMargin =
      EdgeInsets.only(bottom: AppSpacing.md);
}

/// Configurações de Formulários
class AppFormConfig {
  static const double inputHeight = 48.0;
  static const double inputBorderRadius = AppRadius.large;
  static const EdgeInsets inputPadding = EdgeInsets.symmetric(
    horizontal: AppSpacing.md,
    vertical: AppSpacing.sm,
  );
  static const Duration validationDelay = Duration(milliseconds: 500);
}

/// Configurações de Grid
class AppGridConfig {
  static const double defaultSpacing = AppSpacing.md;
  static const double defaultAspectRatio = 0.8;

  // Configurações responsivas para grid
  static int getGridCrossAxisCount(double screenWidth) {
    if (screenWidth >= AppBreakpoints.largeDesktop) return 4;
    if (screenWidth >= AppBreakpoints.desktop) return 3;
    if (screenWidth >= AppBreakpoints.tablet) return 3;
    if (screenWidth >= AppBreakpoints.mobile) return 2;
    return 1;
  }
}

/// Configurações de Paginação
class AppPaginationConfig {
  static const int defaultItemsPerPage = 10;
  static const int maxItemsPerPage = 50;
  static const double paginationHeight = 60.0;
}

/// Configurações de Toast/SnackBar
class AppToastConfig {
  static const Duration defaultDuration = Duration(seconds: 3);
  static const Duration longDuration = Duration(seconds: 5);
  static const Duration shortDuration = Duration(seconds: 1);
}

/// Configurações de Drawer/Sidebar
class AppDrawerConfig {
  static const double width = 280.0;
  static const Duration animationDuration = AppDurations.medium;
}

/// Configurações de AppBar
class AppBarConfig {
  static const double height = 56.0;
  static const double expandedHeight = 200.0;
  static const double collapsedHeight = 56.0;
}

/// Configurações de Tabs
class AppTabConfig {
  static const double height = 48.0;
  static const double indicatorWeight = 3.0;
  static const EdgeInsets padding = EdgeInsets.symmetric(
    horizontal: AppSpacing.md,
    vertical: AppSpacing.sm,
  );
}

/// Configurações de Diálogos
class AppDialogConfig {
  static const double maxWidth = 400.0;
  static const double borderRadius = AppRadius.xl;
  static const EdgeInsets padding = EdgeInsets.all(AppSpacing.lg);
  static const EdgeInsets margin = EdgeInsets.all(AppSpacing.xl);
}

/// Utilities para responsividade
class ResponsiveUtils {
  static bool isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < AppBreakpoints.mobile;
  }

  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= AppBreakpoints.mobile && width < AppBreakpoints.desktop;
  }

  static bool isDesktop(BuildContext context) {
    return MediaQuery.of(context).size.width >= AppBreakpoints.desktop;
  }

  static double getScreenWidth(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  static double getScreenHeight(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }

  static EdgeInsets getResponsivePadding(BuildContext context) {
    if (isMobile(context)) {
      return EdgeInsets.all(AppSpacing.md);
    } else if (isTablet(context)) {
      return EdgeInsets.all(AppSpacing.lg);
    } else {
      return EdgeInsets.all(AppSpacing.xl);
    }
  }

  static double getResponsiveFontSize(
      BuildContext context, double baseFontSize) {
    if (isMobile(context)) {
      return baseFontSize * 0.9;
    } else if (isTablet(context)) {
      return baseFontSize;
    } else {
      return baseFontSize * 1.1;
    }
  }
}

/// Configurações de tema
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: AppElevation.medium,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        elevation: AppCardConfig.defaultElevation,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppCardConfig.defaultRadius),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppFormConfig.inputBorderRadius),
        ),
        contentPadding: AppFormConfig.inputPadding,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.large),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.large),
          ),
        ),
      ),
      textTheme: TextTheme(
        headlineLarge: AppTextStyles.headline1,
        headlineMedium: AppTextStyles.headline2,
        headlineSmall: AppTextStyles.headline3,
        titleLarge: AppTextStyles.headline4,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
        labelLarge: AppTextStyles.labelLarge,
        labelMedium: AppTextStyles.labelMedium,
        labelSmall: AppTextStyles.labelSmall,
      ),
    );
  }

  // Tema escuro para login/confirmação
  static ThemeData get darkAuthTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
        background: AppColors.darkBackground,
        surface: AppColors.darkBackground,
      ),
      scaffoldBackgroundColor: AppColors.darkBackground,
      cardTheme: CardThemeData(
        color: AppColors.darkBackground,
        elevation: 12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
          side: BorderSide(color: AppColors.cardBorder, width: 2),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(5),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(vertical: 12, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(5),
          ),
        ),
      ),
    );
  }
}

/// Constantes diversas da aplicação
class AppConstants {
  static const String appName = 'Sistema de Formação';
  static const String appVersion = '1.0.0';

  // URLs de imagens padrão
  static const String defaultAvatar =
      'https://via.placeholder.com/150x150/E0E0E0/999999?text=Avatar';
  static const String defaultCover =
      'https://via.placeholder.com/800x600/E0E0E0/999999?text=Capa';
  static const String defaultCourse =
      'https://via.placeholder.com/400x300/E0E0E0/999999?text=Curso';

  // Configurações
  static const int paginationLimit = 10;
  static const int maxUploadSize = 5 * 1024 * 1024; // 5MB

  // Regex patterns
  static const String emailPattern = r'^[^@]+@[^@]+\.[^@]+$';
  static const String phonePattern = r'^\+?[0-9]{9,15}$';

  // Tipos de ficheiro permitidos
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  static const List<String> allowedDocumentTypes = [
    'pdf',
    'doc',
    'docx',
    'txt'
  ];
}
