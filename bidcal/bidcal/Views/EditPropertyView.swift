import SwiftUI

struct EditPropertyView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    
    let property: AuctionProperty
    
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
    @State private var marketCondition = ""
    @State private var urgency = ""
    @State private var auctionType = ""
    @State private var failedCount = ""
    @State private var targetProfitRate = ""
    
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
            .navigationTitle("매물 편집")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("저장") {
                        updateProperty()
                    }
                    .fontWeight(.semibold)
                }
            }
            .alert("알림", isPresented: $showingAlert) {
                Button("확인", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                loadPropertyData()
            }
        }
    }
    
    // MARK: - Load Property Data
    private func loadPropertyData() {
        caseNumber = property.caseNumber
        propertyLocation = property.propertyLocation
        propertyType = property.propertyType
        court = property.court
        auctionDate = property.auctionDate
        auctionStatus = property.auctionStatus
        
        bidPrice = String(format: "%.0f", property.bidPrice)
        marketPrice = String(format: "%.0f", property.marketPrice)
        appraisalPrice = String(format: "%.0f", property.appraisalPrice)
        minimumBid = String(format: "%.0f", property.minimumBid)
        renovationCost = String(format: "%.0f", property.renovationCost)
        
        region = property.region ?? ""
        district = property.district ?? ""
        
        competitorCount = "\(property.competitorCount)"
        marketCondition = property.marketCondition
        urgency = property.urgency
        auctionType = property.auctionType
        failedCount = "\(property.failedCount)"
        targetProfitRate = String(format: "%.1f", property.targetProfitRate)
    }
    
    // MARK: - Update Property
    private func updateProperty() {
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
        
        // AuctionProperty 업데이트
        var updatedProperty = property
        updatedProperty.caseNumber = caseNumber
        updatedProperty.propertyLocation = propertyLocation
        updatedProperty.propertyType = propertyType
        updatedProperty.court = court
        updatedProperty.auctionDate = auctionDate
        updatedProperty.auctionStatus = auctionStatus
        updatedProperty.bidPrice = bidPriceValue
        updatedProperty.marketPrice = marketPriceValue
        updatedProperty.appraisalPrice = appraisalPriceValue
        updatedProperty.minimumBid = minimumBidValue
        updatedProperty.renovationCost = renovationCostValue
        updatedProperty.region = region.isEmpty ? nil : region
        updatedProperty.district = district.isEmpty ? nil : district
        updatedProperty.competitorCount = Int(competitorCount) ?? 0
        updatedProperty.marketCondition = marketCondition
        updatedProperty.urgency = urgency
        updatedProperty.auctionType = auctionType
        updatedProperty.failedCount = Int(failedCount) ?? 0
        updatedProperty.targetProfitRate = Double(targetProfitRate) ?? 15.0
        
        // 저장
        dataManager.updateProperty(updatedProperty)
        
        // 화면 닫기
        dismiss()
    }
}

