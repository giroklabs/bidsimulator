import SwiftUI

struct StatisticsRootView: View {
	var body: some View {
		NavigationStack {
			ZStack(alignment: .top) {
				AppTheme.backgroundGradient.ignoresSafeArea()
				VStack(spacing: 12) {
					VStack(alignment: .leading, spacing: 8) {
						Text("통계")
							.font(.system(size: 24, weight: .bold))
							.foregroundColor(AppTheme.primary)
						Text("차트와 요약 통계가 여기에 표시됩니다")
							.font(.system(size: 14))
							.foregroundColor(AppTheme.secondary)
					}
					.padding(16)
					.background(
						RoundedRectangle(cornerRadius: AppTheme.cardCornerRadius)
							.fill(AppTheme.cardBackground)
					)
					.shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
				}
				.padding(.horizontal, AppTheme.mediumPadding)
			}
			.navigationTitle("통계")
		}
	}
}
