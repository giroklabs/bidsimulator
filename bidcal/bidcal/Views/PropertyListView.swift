import SwiftUI

struct PropertyListView: View {
	var body: some View {
		NavigationStack {
			ZStack(alignment: .top) {
				AppTheme.backgroundGradient.ignoresSafeArea()
				VStack(spacing: 12) {
					// Summary card placeholder
					VStack(alignment: .leading, spacing: 8) {
						Text("경매일기")
							.font(.system(size: 24, weight: .bold))
							.foregroundColor(AppTheme.primary)
						Text("이번 달 0건 • 낙찰률 0% • 평균가 0원")
							.font(.system(size: 14, weight: .regular))
							.foregroundColor(AppTheme.secondary)
					}
					.padding(16)
					.background(
						RoundedRectangle(cornerRadius: AppTheme.cardCornerRadius)
							.fill(AppTheme.accentGradient)
					)
					.shadow(color: AppTheme.accentShadow, radius: 8, x: 0, y: 4)

					// Empty state card
					VStack(spacing: 8) {
						Image(systemName: "tray")
							.font(.system(size: 28, weight: .semibold))
							.foregroundColor(AppTheme.secondary)
						Text("등록된 매물이 없습니다")
							.font(.system(size: 16, weight: .semibold))
							.foregroundColor(AppTheme.primary)
						Text("+ 버튼으로 새로운 매물을 추가하세요")
							.font(.system(size: 14))
							.foregroundColor(AppTheme.secondary)
					}
					.frame(maxWidth: .infinity)
					.padding(24)
					.background(
						RoundedRectangle(cornerRadius: AppTheme.cardCornerRadius)
							.fill(AppTheme.cardBackground)
					)
					.shadow(color: AppTheme.cardShadow, radius: 8, x: 0, y: 2)
				}
				.padding(.horizontal, AppTheme.mediumPadding)
			}
			.navigationTitle("매물")
		}
	}
}
