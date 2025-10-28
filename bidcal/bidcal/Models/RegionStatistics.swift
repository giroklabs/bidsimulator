import Foundation

// MARK: - 지역별 통계
struct RegionStatistics: Codable, Identifiable {
    var id = UUID()
    var region: String                  // 지역명
    var district: String?               // 구/군
    var salePriceRate: Double           // 매각가율 (%)
    var saleSuccessRate: Double         // 매각률 (%)
    var averageBidCount: Double         // 평균 입찰 건수
    var period: String                  // 기간
    var investmentRecommendation: String? // 투자 추천
    
    // 투자 추천 등급 계산
    var recommendationStars: String {
        guard let recommendation = investmentRecommendation else {
            return ""
        }
        return recommendation
    }
}

// MARK: - 지역 데이터 매니저
class RegionData: ObservableObject {
    static let shared = RegionData()
    
    @Published var statistics: [RegionStatistics] = []
    
    // 한국 주요 지역 리스트
    static let regions: [String] = [
        "서울", "경기", "인천", "부산", 
        "대구", "광주", "대전", "울산", "세종"
    ]
    
    // 지역별 구/군 리스트
    static func districts(for region: String) -> [String] {
        switch region {
        case "서울":
            return ["강남구", "서초구", "송파구", "강동구", "광진구", "성동구", "중구", "용산구", "마포구", "서대문구", "은평구", "종로구", "중랑구", "동대문구", "성북구", "강북구", "도봉구", "노원구", "양천구", "강서구"]
        case "경기":
            return ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "평택시", "시흥시", "김포시"]
        case "인천":
            return ["계양구", "미추홀구", "남동구", "서구", "강화군", "옹진군"]
        case "부산":
            return ["해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"]
        case "대구":
            return ["수성구", "달서구", "중구", "남구", "북구", "서구"]
        case "광주":
            return ["광산구", "서구", "남구", "동구", "북구"]
        case "대전":
            return ["유성구", "서구", "중구", "동구"]
        case "울산":
            return ["남구", "북구", "중구", "울주군"]
        case "세종":
            return ["조치원읍", "연기면", "소정면", "전의면", "전동면"]
        default:
            return []
        }
    }
    
    private init() {}
    
    // 지역별 통계 로드
    func loadStatistics(for region: String) {
        // TODO: Firebase Storage에서 로드
        // 임시로 하드코딩된 데이터 사용
        statistics = sampleData
    }
    
    // 매각가율 조회
    func getSalePriceRate(region: String, district: String?) -> Double {
        if let district = district {
            return statistics.first { $0.region == region && $0.district == district }?.salePriceRate ?? 80.0
        }
        return statistics.first { $0.region == region }?.salePriceRate ?? 80.0
    }
    
    // 샘플 데이터
    private let sampleData: [RegionStatistics] = [
        RegionStatistics(region: "서울", district: "강남구", salePriceRate: 85.3, saleSuccessRate: 78.5, averageBidCount: 8.2, period: "2024.08-2025.09", investmentRecommendation: "⭐⭐⭐⭐"),
        RegionStatistics(region: "서울", district: "서초구", salePriceRate: 82.7, saleSuccessRate: 72.1, averageBidCount: 7.5, period: "2024.08-2025.09", investmentRecommendation: "⭐⭐⭐"),
        RegionStatistics(region: "서울", district: "송파구", salePriceRate: 87.1, saleSuccessRate: 80.3, averageBidCount: 9.1, period: "2024.08-2025.09", investmentRecommendation: "⭐⭐⭐⭐⭐"),
        RegionStatistics(region: "경기", district: "수원시", salePriceRate: 78.5, saleSuccessRate: 75.2, averageBidCount: 6.8, period: "2024.08-2025.09", investmentRecommendation: "⭐⭐⭐"),
        RegionStatistics(region: "부산", district: "해운대구", salePriceRate: 80.2, saleSuccessRate: 71.8, averageBidCount: 7.3, period: "2024.08-2025.09", investmentRecommendation: "⭐⭐⭐")
    ]
}

