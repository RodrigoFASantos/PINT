import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:SoftSkills/main.dart';

void main() {
  group('SoftSkills App Tests', () {
    testWidgets('App should build without crashing',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Verify that the app builds successfully
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('AuthWrapper should show loading initially',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Verify that loading indicator appears initially
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('A verificar autenticação...'), findsOneWidget);
    });

    testWidgets('App should have correct title', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify the app title
      expect(materialApp.title, 'Plataforma de Aprendizagem');
    });

    testWidgets('App should not show debug banner',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify debug banner is disabled
      expect(materialApp.debugShowCheckedModeBanner, false);
    });

    testWidgets('App should have proper theme', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that theme is set
      expect(materialApp.theme, isNotNull);
      expect(materialApp.theme!.useMaterial3, true);
    });

    testWidgets('App should have initial route set to /',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify initial route
      expect(materialApp.initialRoute, '/');
    });

    testWidgets('AuthWrapper should be present', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Wait for the widget to settle
      await tester.pump();

      // Verify that AuthWrapper is in the widget tree
      expect(find.byType(AuthWrapper), findsOneWidget);
    });
  });

  group('Route Tests', () {
    testWidgets('App should have login route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that login route exists
      expect(materialApp.routes, containsPair('/login', isA<WidgetBuilder>()));
    });

    testWidgets('App should have home route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that home route exists
      expect(materialApp.routes, containsPair('/home', isA<WidgetBuilder>()));
    });

    testWidgets('App should have forum route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that forum route exists
      expect(materialApp.routes, containsPair('/forum', isA<WidgetBuilder>()));
    });

    testWidgets('App should have cursos route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that cursos route exists
      expect(materialApp.routes, containsPair('/cursos', isA<WidgetBuilder>()));
    });

    testWidgets('App should have perfil route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that perfil route exists
      expect(materialApp.routes, containsPair('/perfil', isA<WidgetBuilder>()));
    });

    testWidgets('App should have formadores route defined',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that formadores route exists
      expect(materialApp.routes,
          containsPair('/formadores', isA<WidgetBuilder>()));
    });
  });

  group('Error Handling Tests', () {
    testWidgets('App should handle route generation gracefully',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that onGenerateRoute is defined
      expect(materialApp.onGenerateRoute, isNotNull);
    });

    testWidgets('App should have 404 fallback route',
        (WidgetTester tester) async {
      // Build our app
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Test generating a non-existent route
      final route = materialApp
          .onGenerateRoute!(RouteSettings(name: '/non-existent-route'));

      // Verify that a route is returned (fallback 404 page)
      expect(route, isNotNull);
    });
  });

  group('Widget Integration Tests', () {
    testWidgets('Loading state should show correct message',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Should show loading message
      expect(find.text('A verificar autenticação...'), findsOneWidget);
    });

    testWidgets('App should have Material Design', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Verify Material Design is used
      expect(find.byType(Material), findsWidgets);
    });

    testWidgets('App should handle widget lifecycle correctly',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Pump and settle to let all async operations complete
      await tester.pumpAndSettle();

      // The app should still be running without errors
      expect(tester.takeException(), isNull);
    });

    testWidgets('App should initialize without errors',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Wait for initialization
      await tester.pump();

      // Verify no exceptions were thrown
      expect(tester.takeException(), isNull);
    });
  });

  group('Theme and Design Tests', () {
    testWidgets('App should use consistent color scheme',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that color scheme is set
      expect(materialApp.theme?.colorScheme, isNotNull);
    });

    testWidgets('App should have AppBar theme configured',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that AppBar theme is configured
      expect(materialApp.theme?.appBarTheme, isNotNull);
    });

    testWidgets('App should have card theme configured',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Get the MaterialApp widget
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));

      // Verify that card theme is configured
      expect(materialApp.theme?.cardTheme, isNotNull);
    });
  });

  group('Authentication Tests', () {
    testWidgets('AuthWrapper should handle authentication state',
        (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(MyApp());

      // Initially should show loading
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for authentication check to complete
      await tester.pumpAndSettle(Duration(seconds: 2));

      // Should either show login screen or home screen
      // (depending on authentication state)
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}
