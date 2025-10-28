import SwiftUI

struct AddPropertyView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    
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
    @State private var competitorCount = "0"
    @State private var marketCondition = ""
    @State private var urgency = ""
    @State private var auctionType = ""
    @State private var failedCount = "0"
    @State private var targetProfitRate = "15"
    
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                Form {
                    // 기본 정보
                    Section(header: Text("기본 정보")) {
                        TextField("사건번호", text: $caseNumber)
                        TextField("물건지 주소", text: $propertyLocation)
                        
                        Picker("물건 종류", selection: $propertyType) {
                            ForEach(PropertyType.allCases, id: \.self) { type in
                                Label(type.rawValue, systemImage: type.icon).tag(type)
                            }
                        }
                        
                        TextField("관할 법원", text: $court)
                        
                        DatePicker("경매일", selection: $auctionDate, displayedComponents: .date)
                        
                        Picker("경매 상태", selection: $auctionStatus) {
                            ForEach(AuctionStatus.allCases, id: \.self) { status in
                                Text(status.rawValue).tag(status)
                            }
                        }
                    }
                    
                    // 가격 정보
                    Section(header: Text("가격 정보 (원)")) {
                        TextField("입찰가격", text: $bidPrice)
                            .keyboardType(.numberPad)
                        TextField("시세", text: $marketPrice)
                            .keyboardType(.numberPad)
                        TextField("감정가", text: $appraisalPrice)
                            .keyboardType(.numberPad)
                        TextField("최저입찰가", text: $minimumBid)
                            .keyboardType(.numberPad)
                        TextField("리모델링 비용", text: $renovationCost)
                            .keyboardType(.numberPad)
                    }
                    
                    // 지역 정보
                    Section(header: Text("지역 정보")) {
                        TextField("지역 (예: 서울)", text: $region)
                        TextField("구/군 (예: 강남구)", text: $district)
                    }
                    
                    // 입찰 전략
                    Section(header: Text("입찰 전략")) {
                        TextField("예상 경쟁자 수", text: $competitorCount)
                            .keyboardType(.numberPad)
                        TextField("시장 상황", text: $marketCondition)
                        TextField("입찰 긴급도", text: $urgency)
                        TextField("경매 유형", text: $auctionType)
                        TextField("유찰 횟수", text: $failedCount)
                            .keyboardType(.numberPad)
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
                }
                .scrollContentBackground(.hidden)
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
            marketCondition: marketCondition,
            urgency: urgency,
            auctionType: auctionType,
            failedCount: Int(failedCount) ?? 0,
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

