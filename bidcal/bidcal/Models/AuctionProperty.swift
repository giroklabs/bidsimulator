import Foundation

// MARK: - 경매 매물 모델
struct AuctionProperty: Identifiable, Codable {
    var id = UUID()
    var caseNumber: String              // 사건번호
    var propertyLocation: String        // 물건지 주소
    var propertyType: PropertyType      // 물건 종류
    var court: String                   // 관할 법원
    var auctionDate: Date               // 경매일
    var auctionStatus: AuctionStatus    // 경매 상태
    
    // 가격 정보
    var bidPrice: Double                // 입찰가격
    var marketPrice: Double             // 시세
    var appraisalPrice: Double          // 감정가
    var minimumBid: Double              // 최저입찰가
    var renovationCost: Double          // 리모델링 비용
    
    // 지역 정보
    var region: String?                 // 지역 (서울, 경기 등)
    var district: String?               // 구/군
    
    // 입찰 전략 정보
    var competitorCount: Int            // 예상 경쟁자 수
    var marketCondition: String         // 시장 상황
    var urgency: String                 // 입찰 긴급도
    var auctionType: String             // 경매 유형
    var failedCount: Int                // 유찰 횟수
    var targetProfitRate: Double        // 목표 수익률 (%)
    
    // 물건조사
    var inspection: PropertyInspection?
    
    // 시뮬레이션 결과
    var simulationResult: SimulationResult?
    
    var createdDate: Date
    var lastModifiedDate: Date
}

// MARK: - 물건 종류
enum PropertyType: String, Codable, CaseIterable {
    case apartment = "아파트"
    case officetel = "오피스텔"
    case villa = "빌라"
    case house = "단독주택"
    case shop = "상가"
    case office = "사무실"
    case land = "토지"
    case other = "기타"
    
    var icon: String {
        switch self {
        case .apartment: return "building.2"
        case .officetel: return "building"
        case .villa: return "house"
        case .house: return "house.circle"
        case .shop: return "storefront"
        case .office: return "building.2"
        case .land: return "mappin.circle"
        case .other: return "square.grid.2x2"
        }
    }
    
    /// 문자열로부터 PropertyType 생성 (API 응답용)
    static func from(string: String) -> PropertyType {
        let lowercased = string.lowercased()
        
        if lowercased.contains("아파트") || lowercased.contains("apartment") {
            return .apartment
        } else if lowercased.contains("오피스텔") || lowercased.contains("officetel") {
            return .officetel
        } else if lowercased.contains("빌라") || lowercased.contains("villa") {
            return .villa
        } else if lowercased.contains("단독주택") || lowercased.contains("house") {
            return .house
        } else if lowercased.contains("상가") || lowercased.contains("shop") {
            return .shop
        } else if lowercased.contains("사무실") || lowercased.contains("office") {
            return .office
        } else if lowercased.contains("토지") || lowercased.contains("land") {
            return .land
        } else {
            return .other
        }
    }
}

// MARK: - 경매 상태
enum AuctionStatus: String, Codable, CaseIterable {
    case inProgress = "진행중"
    case scheduled = "예정"
    case completed = "종료"
    case failed = "유찰"
    
    var color: String {
        switch self {
        case .inProgress: return "blue"
        case .scheduled: return "orange"
        case .completed: return "green"
        case .failed: return "red"
        }
    }
}

// MARK: - 관할 법원
enum Court: String, Codable, CaseIterable {
    // 서울
    case seoulCentral = "서울중앙지방법원"
    case seoulSouth = "서울남부지방법원"
    case seoulNorth = "서울북부지방법원"
    case seoulEast = "서울동부지방법원"
    case seoulWest = "서울서부지방법원"
    
    // 인천
    case incheon = "인천지방법원"
    
    // 경기
    case suwon = "수원지방법원"
    case uijeongbu = "의정부지방법원"
    
    // 강원
    case chuncheon = "춘천지방법원"
    case wonju = "원주지방법원"
    
    // 충북
    case cheongju = "청주지방법원"
    
    // 충남
    case daejeon = "대전지방법원"
    case seosan = "서산지방법원"
    
    // 전북
    case jeonju = "전주지방법원"
    
    // 전남
    case gwangju = "광주지방법원"
    case mokpo = "목포지방법원"
    
    // 경북
    case daegu = "대구지방법원"
    case andong = "안동지방법원"
    case pohang = "포항지방법원"
    
    // 경남
    case busan = "부산지방법원"
    case changwon = "창원지방법원"
    case jinju = "진주지방법원"
    
    // 부산
    case busanDistrict = "부산지방법원 동부지원"
    case busanWest = "부산지방법원 서부지원"
    case busanNorth = "부산지방법원 북부지원"
    
    // 울산
    case ulsan = "울산지방법원"
    
    // 제주
    case jeju = "제주지방법원"
    
    // 기타
    case other = "기타"
    
    /// 전체 법원 목록을 지역별로 그룹화
    static var groupedCourts: [(region: String, courts: [Court])] {
        return [
            ("서울", [.seoulCentral, .seoulSouth, .seoulNorth, .seoulEast, .seoulWest]),
            ("인천", [.incheon]),
            ("경기", [.suwon, .uijeongbu]),
            ("강원", [.chuncheon, .wonju]),
            ("충북", [.cheongju]),
            ("충남", [.daejeon, .seosan]),
            ("전북", [.jeonju]),
            ("전남", [.gwangju, .mokpo]),
            ("경북", [.daegu, .andong, .pohang]),
            ("경남", [.busan, .changwon, .jinju]),
            ("부산", [.busanDistrict, .busanWest, .busanNorth]),
            ("울산", [.ulsan]),
            ("제주", [.jeju]),
            ("기타", [.other])
        ]
    }
}

// MARK: - 물건조사
struct PropertyInspection: Codable {
    // 물건조사
    var preservationRegistry: String?   // 보존등기
    var buildingAge: String?            // 노후도 (상, 중, 하)
    var meters: String?                 // 계량기
    var mailCheck: String?              // 우편물
    var slope: String?                  // 경사도
    var lightingDirection: String?      // 채광•방향
    var structureFloor: String?         // 구조/층
    var parking: String?                // 주차장
    var waterLeakage: String?           // 방수/누수
    var unpaidUtilities: String?        // 미납 공과금
    var gasType: String?                // 도시가스
    var gasUnpaid: String?              // 가스 미납
    var residentsCheck: String?         // 전입세대열람
    var currentResidents: String?       // 현 거주자
    
    // 주변조사
    var busRoutes: String?              // 버스노선
    var subway: String?                 // 지하철
    var shopping: String?               // 마트/백화점
    var schools: String?                // 초중고
    
    // 시세조사
    var molitPrice: String?             // 국토교통부
    var naverPrice: String?             // 네이버
    var kbPrice: String?                // KB시세
    var fieldPrice: String?             // 현장실사
    
    // 특이사항
    var specialNotes: String?
    var finalScore: Int?
    var inspectionDate: Date?
}

// MARK: - 시뮬레이션 결과
struct SimulationResult: Codable {
    var recommendedBidPrice: Double     // 권장 입찰가
    var winningProbability: Double      // 낙찰 확률 (%)
    var expectedProfit: Double          // 예상 수익
    var totalCost: Double               // 총 비용
    var profitRate: Double              // 수익률 (%)
    
    // 상세 비용
    var depositAmount: Double           // 입찰보증금
    var remainingPayment: Double        // 잔금
    var acquisitionTax: Double          // 취득세
    var localEducationTax: Double       // 지방교육세
    var ruralSpecialTax: Double         // 농어촌특별세
    var registrationFees: Double        // 등기비용
    var professionalFees: Double        // 전문가 수수료
    var otherCosts: Double              // 기타 비용
    
    // 가격 분석
    var marketRatio: Double             // 시세 대비 (%)
    var appraisalRatio: Double          // 감정가 대비 (%)
    var minimumRatio: Double            // 최저입찰가 대비 (%)
}

