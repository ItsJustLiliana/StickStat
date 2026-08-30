import 'package:flutter_test/flutter_test.dart';
import 'package:stickstat_mobile/main.dart';

void main() {
  testWidgets('toont de StickStat Android-basis', (tester) async {
    await tester.pumpWidget(const StickStatApp());
    expect(find.text('StickStat'), findsOneWidget);
    expect(find.text('Android-basis staat klaar'), findsOneWidget);
    expect(find.text('Pakketnaam nl.stickstat.app'), findsOneWidget);
  });
}
