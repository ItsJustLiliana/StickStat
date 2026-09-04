import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

const stickStatUrl = String.fromEnvironment(
  'STICKSTAT_URL',
  defaultValue: 'http://archlinux.tail50bfa9.ts.net:4000',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0xFF092F25),
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF092F25),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const StickStatApp());
}

class StickStatApp extends StatelessWidget {
  const StickStatApp({super.key, this.home = const StickStatWebApp()});

  final Widget home;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StickStat',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0C5C42)),
        scaffoldBackgroundColor: const Color(0xFFF5F7F4),
        useMaterial3: true,
      ),
      home: home,
    );
  }
}

class StickStatWebApp extends StatefulWidget {
  const StickStatWebApp({super.key});

  @override
  State<StickStatWebApp> createState() => _StickStatWebAppState();
}

class _StickStatWebAppState extends State<StickStatWebApp> {
  late final WebViewController _controller;
  int _progress = 0;
  String? _mainFrameError;
  bool _checkingForUpdate = false;
  bool _isFirstLoad = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF5F7F4))
      ..addJavaScriptChannel(
        'StickStatApp',
        onMessageReceived: (message) {
          if (message.message == 'check-update') _checkForUpdate();
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (_) {
            if (mounted) {
              setState(() {
                _progress = 0;
                _mainFrameError = null;
              });
            }
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _progress = 100);
            _publishInstalledVersion();
            _disableScrollbarAndOverscroll();
            if (!_isFirstLoad) {
              _checkForUpdate();
            }
            _isFirstLoad = false;
          },
          onWebResourceError: (error) {
            if ((error.isForMainFrame ?? true) && mounted) {
              setState(() => _mainFrameError = error.description);
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri == null || (uri.scheme != 'http' && uri.scheme != 'https')) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(stickStatUrl));
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkForUpdate());
  }

  static List<int> _versionParts(String value) => value.split('.').map((part) => int.tryParse(part) ?? 0).toList();
  static bool _isNewer(String remote, String local) {
    final a = _versionParts(remote), b = _versionParts(local);
    for (var index = 0; index < 3; index++) { final left = index < a.length ? a[index] : 0, right = index < b.length ? b[index] : 0; if (left != right) return left > right; }
    return false;
  }

  Future<void> _publishInstalledVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final payload = jsonEncode({
        'version': info.version,
        'buildNumber': info.buildNumber,
      });
      await _controller.runJavaScript('''
        window.localStorage.setItem('stickstat-installed-app-version', JSON.stringify($payload));
        window.dispatchEvent(new Event('stickstat-app-version'));
      ''');
    } catch (_) {
      // Versie tonen op de profielpagina mag navigatie nooit blokkeren.
    }
  }

  Future<void> _disableScrollbarAndOverscroll() async {
    try {
      await _controller.runJavaScript('''
        const style = document.createElement('style');
        style.textContent = `
          ::-webkit-scrollbar { display: none !important; }
          * { scrollbar-width: none !important; }
          html { overscroll-behavior: none !important; overflow: hidden auto !important; }
        `;
        document.head.appendChild(style);
        document.documentElement.style.overscrollBehavior = 'none';
      ''');
    } catch (_) {
      // Scrollbar-styling mag niet blokkeren.
    }
  }

  Future<void> _checkForUpdate() async {
    if (_checkingForUpdate) return;
    _checkingForUpdate = true;
    try {
      final response = await http.get(Uri.parse('$stickStatUrl/api/app/releases/latest')).timeout(const Duration(seconds: 8));
      if (response.statusCode != 200 || !mounted) return;
      final release = jsonDecode(response.body)['data'] as Map<String, dynamic>?;
      if (release == null) return;
      final info = await PackageInfo.fromPlatform();
      final remoteBuild = (release['buildNumber'] as num?)?.toInt() ?? 0;
      final localBuild = int.tryParse(info.buildNumber) ?? 0;
      final updateAvailable = remoteBuild > localBuild || _isNewer(release['version'] as String, info.version);
      if (!updateAvailable || !mounted) return;
      await showDialog<void>(context: context, barrierDismissible: false, builder: (dialogContext) => AlertDialog(title: Text('StickStat ${release['version']} beschikbaar'), content: const Text('Er is een nieuwe versie. De APK wordt veilig gecontroleerd voordat Android de installatie opent.'), actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Later')), FilledButton(onPressed: () { Navigator.pop(dialogContext); _downloadAndInstall(release); }, child: const Text('Downloaden'))]));
    } catch (_) { /* Updates mogen het starten van de app nooit blokkeren. */ }
    finally { _checkingForUpdate = false; }
  }

  Future<void> _downloadAndInstall(Map<String, dynamic> release) async {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Update downloaden…'), duration: Duration(seconds: 20)));
    try {
      final response = await http.get(Uri.parse(release['downloadUrl'] as String)).timeout(const Duration(minutes: 3));
      if (response.statusCode != 200) throw const HttpException('Download mislukt');
      final actual = sha256.convert(response.bodyBytes).toString();
      if (actual.toLowerCase() != (release['sha256'] as String).toLowerCase()) throw const FormatException('Controlegetal klopt niet');
      final directory = await getTemporaryDirectory(), file = File('${directory.path}/StickStat-${release['version']}.apk');
      await file.writeAsBytes(response.bodyBytes, flush: true);
      if (mounted) ScaffoldMessenger.of(context).hideCurrentSnackBar();
      await OpenFilex.open(file.path, type: 'application/vnd.android.package-archive');
    } catch (error) {
      if (mounted) { ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Update installeren mislukt: $error'))); }
    }
  }

  Future<void> _retry() async {
    setState(() {
      _mainFrameError = null;
      _progress = 0;
    });
    await _controller.loadRequest(Uri.parse(stickStatUrl));
  }

  Future<void> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    } else {
      await SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(child: WebViewWidget(controller: _controller)),
              if (_progress < 100 && _mainFrameError == null)
                Align(
                  alignment: Alignment.topCenter,
                  child: LinearProgressIndicator(
                    value: _progress == 0 ? null : _progress / 100,
                    minHeight: 3,
                    color: const Color(0xFFC9F45B),
                    backgroundColor: const Color(0xFF092F25),
                  ),
                ),
              if (_mainFrameError != null)
                Positioned.fill(
                  child: ConnectionErrorPanel(
                    technicalMessage: _mainFrameError!,
                    onRetry: _retry,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class ConnectionErrorPanel extends StatelessWidget {
  const ConnectionErrorPanel({
    required this.technicalMessage,
    required this.onRetry,
    super.key,
  });

  final String technicalMessage;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFF5F7F4),
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(
                  radius: 32,
                  backgroundColor: Color(0xFFEAF6CF),
                  foregroundColor: Color(0xFF0C5C42),
                  child: Icon(Icons.wifi_off_rounded, size: 32),
                ),
                const SizedBox(height: 20),
                Text(
                  'StickStat niet bereikbaar',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Controleer of Tailscale op deze telefoon verbonden is en '
                  'of de StickStat-server draait.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64756F), height: 1.45),
                ),
                const SizedBox(height: 22),
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Opnieuw proberen'),
                ),
                const SizedBox(height: 16),
                Text(
                  technicalMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF89958F),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
