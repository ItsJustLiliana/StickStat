import 'package:flutter/material.dart';

void main() => runApp(const StickStatApp());

class StickStatApp extends StatelessWidget {
  const StickStatApp({super.key});

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF0C5C42);
    return MaterialApp(
      title: 'StickStat',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: green),
        scaffoldBackgroundColor: const Color(0xFFF5F7F4),
        useMaterial3: true,
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(20)),
            side: BorderSide(color: Color(0xFFDCE5DF)),
          ),
        ),
      ),
      home: const MobileFoundationPage(),
    );
  }
}

class MobileFoundationPage extends StatelessWidget {
  const MobileFoundationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF092F25),
        foregroundColor: Colors.white,
        title: const Row(
          children: [
            CircleAvatar(
              backgroundColor: Color(0xFFC9F45B),
              foregroundColor: Color(0xFF092F25),
              child: Text('S', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
            SizedBox(width: 12),
            Text('StickStat', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'YOUR TEAM. YOUR STATS.',
              style: TextStyle(
                color: Color(0xFF0C5C42),
                fontSize: 12,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Android-basis staat klaar',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Deze build gebruikt de bestaande Flutter- en Android-tooling. '
              'De volgende stap is authenticatie en de StickStat REST API koppelen.',
              style: TextStyle(color: Color(0xFF64756F), height: 1.5),
            ),
            const SizedBox(height: 24),
            const _StatusCard(
              icon: Icons.android,
              title: 'Android-project',
              subtitle: 'Gradle, Kotlin en Flutter zijn geconfigureerd',
            ),
            const _StatusCard(
              icon: Icons.dns_outlined,
              title: 'Backend-ready',
              subtitle: 'Ontworpen voor dezelfde StickStat REST API',
            ),
            const _StatusCard(
              icon: Icons.shield_outlined,
              title: 'Eigen app-identiteit',
              subtitle: 'Pakketnaam nl.stickstat.app',
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFEAF6CF),
          foregroundColor: const Color(0xFF0C5C42),
          child: Icon(icon),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 5),
          child: Text(subtitle),
        ),
        trailing: const Icon(Icons.check_circle, color: Color(0xFF0C5C42)),
      ),
    );
  }
}
