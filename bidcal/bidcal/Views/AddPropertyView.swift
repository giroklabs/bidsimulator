import SwiftUI
import UIKit

struct AddPropertyView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    @StateObject private var apiManager = APIManager.shared
    
    // 기본 정보
    @State private var caseNumber = ""
    @State private var propertyLocation = ""
    @State private var propertyType: PropertyType = .apartment
    @State private var court = ""
    @State private var auctionDate = Date()
    @State private var auctionStatus: AuctionStatus = .scheduled
    
    // 가격 정보
    @State private var bidPrice = ""
    @State private var marketPrice = ""
    @State private var appraisalPrice = ""
    @State private var minimumBid = ""
    @State private var renovationCost = ""
    
    // 지역 정보
    @State private var region = ""
    @State private var district = ""
    
    // 입찰 전략
    @State private var competitorCount = ""
    @State private var marketCondition: MarketCondition = .normal
    @State private var urgency: UrgencyLevel = .normal
    @State private var auctionType: AuctionType = .realEstate
    @State private var failedCount: FailedCount = .none
    @State private var targetProfitRate = "15"
    
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                formContent
                    .scrollContentBackground(.hidden)
                    .listStyle(.insetGrouped)
                    .environment(\.defaultMinListRowHeight, 44)
            }
            .navigationTitle("매물 등록")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("저장") {
                        saveProperty()
                    }
                    .fontWeight(.semibold)
                }
            }
            .alert("알림", isPresented: $showingAlert) {
                Button("확인", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    // MARK: - Form Content
    private var formContent: some View {
        Form {
            basicInfoSection
            priceInfoSection
            regionInfoSection
            strategySection
        }
    }
    
    // MARK: - Form Sections
    private var basicInfoSection: some View {
        Section {
            Group {
                HStack {
                    TextField("사건번호", text: $caseNumber)
                    
                    Button {
                        Task {
                            await searchAuctionData()
                        }
                    } label: {
                        Image(systemName: apiManager.isLoading ? "hourglass" : "magnifyingglass")
                            .foregroundColor(AppTheme.accent)
                            .font(.system(size: 18))
                    }
                    .disabled(apiManager.isLoading || caseNumber.isEmpty)
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("물건지 주소", text: $propertyLocation)
            }
            .listRowSeparator(.visible)
            
            // 물건 종류
            Group {
                Picker("물건 종류", selection: $propertyType) {
                    ForEach(PropertyType.allCases, id: \.self) { type in
                        Label(type.rawValue, systemImage: type.icon).tag(type)
                    }
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("관할 법원", text: $court)
            }
            .listRowSeparator(.visible)
            
            // 경매일과 경매 상태 같은 행
            Group {
                HStack(spacing: 12) {
                    HStack {
                        Text("경매일")
                            .frame(width: 60, alignment: .leading)
                        DatePicker("경매일", selection: $auctionDate, displayedComponents: .date)
                            .labelsHidden()
                    }
                    .frame(maxWidth: .infinity)
                    
                    Picker("경매 상태", selection: $auctionStatus) {
                        ForEach(AuctionStatus.allCases, id: \.self) { status in
                            Text(status.rawValue).tag(status)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
                }
            }
            .listRowSeparator(.visible)
        } header: {
            Text("기본 정보")
        }
        .listRowSeparator(.visible, edges: .all)
    }
    
    private var priceInfoSection: some View {
        Section(header: Text("가격 정보 (원)")) {
            Group {
                TextField("입찰가격", text: $bidPrice)
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("시세", text: $marketPrice)
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("감정가", text: $appraisalPrice)
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("최저입찰가", text: $minimumBid)
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("리모델링 비용", text: $renovationCost)
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
        }
        .listRowSeparator(.visible, edges: .all)
    }
    
    private var regionInfoSection: some View {
        Section(header: Text("지역 정보")) {
            Group {
                TextField("지역 (예: 서울)", text: $region)
            }
            .listRowSeparator(.visible)
            
            Group {
                TextField("구/군 (예: 강남구)", text: $district)
            }
            .listRowSeparator(.visible)
        }
        .listRowSeparator(.visible, edges: .all)
    }
    
    private var strategySection: some View {
        Section(header: Text("입찰 전략")) {
            Group {
                TextField("예상 경쟁자 수", text: $competitorCount, prompt: Text("예상 경쟁자 수").foregroundColor(AppTheme.tertiary))
                    .keyboardType(.numberPad)
            }
            .listRowSeparator(.visible)
            
            Group {
                Picker("시장 상황", selection: $marketCondition) {
                    ForEach(MarketCondition.allCases, id: \.self) { condition in
                        Text(condition.rawValue).tag(condition)
                    }
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                Picker("입찰 긴급도", selection: $urgency) {
                    ForEach(UrgencyLevel.allCases, id: \.self) { level in
                        Text(level.rawValue).tag(level)
                    }
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                Picker("경매 유형", selection: $auctionType) {
                    ForEach(AuctionType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                Picker("유찰 횟수", selection: $failedCount) {
                    ForEach(FailedCount.allCases, id: \.self) { count in
                        Text(count.displayName).tag(count)
                    }
                }
            }
            .listRowSeparator(.visible)
            
            Group {
                HStack {
                    Text("목표 수익률")
                    Spacer()
                    TextField("15", text: $targetProfitRate)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 60)
                    Text("%")
                }
            }
            .listRowSeparator(.visible)
        }
        .listRowSeparator(.visible, edges: .all)
    }
    // MARK: - Search Auction Data
    private func searchAuctionData() async {
        guard !caseNumber.isEmpty else {
            alertMessage = "사건번호를 입력해주세요."
            showingAlert = true
            return
        }
        
        do {
            if let data = try await apiManager.fetchAuctionData(caseNumber: caseNumber) {
                // 자동 채우기
                if !data.propertyLocation.isEmpty {
                    propertyLocation = data.propertyLocation
                }
                if !data.court.isEmpty {
                    court = data.court
                }
                if !data.marketPrice.isEmpty {
                    marketPrice = data.marketPrice
                }
                if !data.appraisalPrice.isEmpty {
                    appraisalPrice = data.appraisalPrice
                }
                if !data.minimumBid.isEmpty {
                    minimumBid = data.minimumBid
                }
                propertyType = data.propertyType
                auctionDate = data.auctionDate
                
                alertMessage = "데이터를 불러왔습니다."
                showingAlert = true
            } else {
                alertMessage = "데이터를 찾을 수 없습니다."
                showingAlert = true
            }
        } catch {
            alertMessage = apiManager.errorMessage ?? "데이터 조회 중 오류가 발생했습니다."
            showingAlert = true
        }
    }
    
    // MARK: - Save Property
    private func saveProperty() {
        // 필수 입력 검증
        guard !caseNumber.isEmpty else {
            alertMessage = "사건번호를 입력해주세요."
            showingAlert = true
            return
        }
        
        guard !propertyLocation.isEmpty else {
            alertMessage = "물건지 주소를 입력해주세요."
            showingAlert = true
            return
        }
        
        guard !court.isEmpty else {
            alertMessage = "관할 법원을 입력해주세요."
            showingAlert = true
            return
        }
        
        // 가격 정보 변환
        let bidPriceValue = Double(bidPrice) ?? 0
        let marketPriceValue = Double(marketPrice) ?? 0
        let appraisalPriceValue = Double(appraisalPrice) ?? 0
        let minimumBidValue = Double(minimumBid) ?? 0
        let renovationCostValue = Double(renovationCost) ?? 0
        
        guard bidPriceValue > 0 else {
            alertMessage = "입찰가격을 입력해주세요."
            showingAlert = true
            return
        }
        
        // AuctionProperty 생성
        let property = AuctionProperty(
            caseNumber: caseNumber,
            propertyLocation: propertyLocation,
            propertyType: propertyType,
            court: court,
            auctionDate: auctionDate,
            auctionStatus: auctionStatus,
            bidPrice: bidPriceValue,
            marketPrice: marketPriceValue,
            appraisalPrice: appraisalPriceValue,
            minimumBid: minimumBidValue,
            renovationCost: renovationCostValue,
            region: region.isEmpty ? nil : region,
            district: district.isEmpty ? nil : district,
            competitorCount: Int(competitorCount) ?? 0,
            marketCondition: marketCondition.rawValue,
            urgency: urgency.rawValue,
            auctionType: auctionType.rawValue,
            failedCount: failedCount.rawValue,
            targetProfitRate: Double(targetProfitRate) ?? 15.0,
            inspection: nil,
            simulationResult: nil,
            createdDate: Date(),
            lastModifiedDate: Date()
        )
        
        // 저장
        dataManager.addProperty(property)
        
        // 화면 닫기
        dismiss()
    }
}

// MARK: - View Modifiers
extension View {
    func addRequiredBadge() -> some View {
        self.modifier(RequiredBadgeModifier())
    }
    
    func addOptionalBadge() -> some View {
        self.modifier(OptionalBadgeModifier())
    }
}

struct RequiredBadgeModifier: ViewModifier {
    func body(content: Content) -> some View {
        HStack {
            content
            Spacer()
            Text("필수")
                .font(.caption2)
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.red)
                .cornerRadius(4)
        }
    }
}

struct OptionalBadgeModifier: ViewModifier {
    func body(content: Content) -> some View {
        HStack {
            content
            Spacer()
            Text("선택")
                .font(.caption2)
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.gray)
                .cornerRadius(4)
        }
    }
}

// MARK: - 입찰 전략 Enum
enum MarketCondition: String, CaseIterable {
    case hot = "활발한 시장"
    case normal = "보통 시장"
    case cold = "침체된 시장"
}

enum UrgencyLevel: String, CaseIterable {
    case high = "높음"
    case normal = "보통"
    case low = "낮음"
}

enum AuctionType: String, CaseIterable {
    case realEstate = "부동산 경매"
    case vehicle = "자동차 경매"
    case art = "예술품 경매"
    case general = "일반 물건 경매"
}

enum FailedCount: Int, CaseIterable {
    case none = 0      // 1회차
    case one = 1       // 2회차
    case two = 2       // 3회차
    case three = 3     // 4회차
    case four = 4      // 5회차 이상
    
    var displayName: String {
        switch self {
        case .none:
            return "1회차 (첫 경매)"
        case .one:
            return "2회차 (1회 유찰)"
        case .two:
            return "3회차 (2회 유찰)"
        case .three:
            return "4회차 (3회 유찰)"
        case .four:
            return "5회차 이상 (4회 이상 유찰)"
        }
    }
}

