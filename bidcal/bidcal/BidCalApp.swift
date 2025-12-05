import SwiftUI
import FirebaseCore
import GoogleMobileAds

@main
struct BidCalApp: App {
	init() {
		FirebaseApp.configure()
		// AdMob 초기화
        MobileAds.shared.start(completionHandler: nil)
	}
	
	var body: some Scene {
		WindowGroup {
			SplashView()
		}
	}
}

struct RootTabView: View {
	var body: some View {
		TabView {
			PropertyListView()
				.tabItem { Label("매물", systemImage: "house.fill") }
			StatisticsRootView()
				.tabItem { Label("통계", systemImage: "chart.bar.fill") }
			SettingsRootView()
				.tabItem { Label("설정", systemImage: "gearshape.fill") }
		}
		.accentColor(AppTheme.accent)
	}
}
