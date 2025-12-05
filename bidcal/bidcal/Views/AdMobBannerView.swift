import SwiftUI
import GoogleMobileAds
import UIKit

// MARK: - AdMob Banner Coordinator
class AdMobBannerCoordinator: NSObject, BannerViewDelegate {
    var parent: AdMobBannerView
    
    init(parent: AdMobBannerView) {
        self.parent = parent
    }
    
    func bannerViewDidReceiveAd(_ bannerView: BannerView) {
        print("AdMob: 배너 광고 로드 성공")
    }
    
    func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
        print("AdMob: 배너 광고 로드 실패 - \(error.localizedDescription)")
    }
}

// MARK: - AdMob Banner View
struct AdMobBannerView: UIViewRepresentable {
    let adUnitID: String
    
    init(adUnitID: String = "ca-app-pub-3940256099942544/2934735716") { // 테스트 광고 ID
        self.adUnitID = adUnitID
    }
    
    func makeCoordinator() -> AdMobBannerCoordinator {
        AdMobBannerCoordinator(parent: self)
    }
    
    func makeUIView(context: Context) -> BannerView {
        // BannerView 초기화 (adSize만 사용)
        let bannerView = BannerView(adSize: AdSizeBanner)
        bannerView.adUnitID = adUnitID
        bannerView.delegate = context.coordinator
        
        // rootViewController 찾기
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootViewController = windowScene.windows.first?.rootViewController {
            bannerView.rootViewController = rootViewController
        }
        
        // 광고 요청
        let request = Request()
        bannerView.load(request)
        
        return bannerView
    }
    
    func updateUIView(_ uiView: BannerView, context: Context) {
        // 업데이트가 필요할 때 호출됩니다
    }
}


