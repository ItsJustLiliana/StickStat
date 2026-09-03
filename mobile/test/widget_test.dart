import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stickstat_mobile/main.dart';

void main() {
  test('de standaardserver is de StickStat Tailscale-server', () {
    expect(stickStatUrl, 'http://archlinux.tail50bfa9.ts.net:4000');
  });

  testWidgets('toont een bruikbare verbindingsfout', (tester) async {
    await tester.pumpWidget(
      StickStatApp(
        home: ConnectionErrorPanel(
          technicalMessage: 'testfout',
          onRetry: () {},
        ),
      ),
    );

    expect(find.text('StickStat niet bereikbaar'), findsOneWidget);
    expect(find.textContaining('Tailscale'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Opnieuw proberen'), findsOneWidget);
    expect(find.text('testfout'), findsOneWidget);
  });
}
