import SwiftUI

struct InspectionView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    
    let property: AuctionProperty
    
    // 물건조사
    @State private var preservationRegistry = ""
    @State private var buildingAge = "중"
    @State private var meters = ""
    @State private var mailCheck = ""
    @State private var slope = ""
    @State private var lightingDirection = ""
    @State private var structureFloor = ""
    @State private var parking = ""
    @State private var waterLeakage = ""
    @State private var unpaidUtilities = ""
    @State private var gasType = ""
    @State private var gasUnpaid = ""
    @State private var residentsCheck = ""
    @State private var currentResidents = ""
    
    // 주변조사
    @State private var busRoutes = ""
    @State private var subway = ""
    @State private var shopping = ""
    @State private var schools = ""
    
    // 시세조사
    @State private var molitPrice = ""
    @State private var naverPrice = ""
    @State private var kbPrice = ""
    @State private var fieldPrice = ""
    
    // 특이사항
    @State private var specialNotes = ""
    
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                Form {
                    // 기본 정보
                    Section(header: Text("매물 정보")) {
                        HStack {
                            Text("주소")
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text(property.propertyLocation)
                                .font(.subheadline)
                                .foregroundColor(AppTheme.primary)
                        }
                        HStack {
                            Text("사건번호")
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text(property.caseNumber)
                                .font(.subheadline)
                                .foregroundColor(AppTheme.primary)
                        }
                    }
                    
                    // 물건조사
                    Section(header: Text("물건조사")) {
                        TextField("보존등기", text: $preservationRegistry)
                        
                        Picker("노후도", selection: $buildingAge) {
                            Text("상").tag("상")
                            Text("중").tag("중")
                            Text("하").tag("하")
                        }
                        
                        TextField("계량기", text: $meters)
                        TextField("우편물", text: $mailCheck)
                        TextField("경사도", text: $slope)
                        TextField("채광•방향", text: $lightingDirection)
                        TextField("구조/층", text: $structureFloor)
                        TextField("주차장", text: $parking)
                        TextField("방수/누수", text: $waterLeakage)
                        TextField("미납 공과금", text: $unpaidUtilities)
                        TextField("도시가스", text: $gasType)
                        TextField("가스 미납", text: $gasUnpaid)
                        TextField("전입세대열람", text: $residentsCheck)
                        TextField("현 거주자", text: $currentResidents)
                    }
                    
                    // 주변조사
                    Section(header: Text("주변조사")) {
                        TextField("버스노선", text: $busRoutes)
                        TextField("지하철", text: $subway)
                        TextField("마트/백화점", text: $shopping)
                        TextField("초중고", text: $schools)
                    }
                    
                    // 시세조사
                    Section(header: Text("시세조사")) {
                        TextField("국토교통부", text: $molitPrice)
                            .keyboardType(.numberPad)
                        TextField("네이버", text: $naverPrice)
                            .keyboardType(.numberPad)
                        TextField("KB시세", text: $kbPrice)
                            .keyboardType(.numberPad)
                        TextField("현장실사", text: $fieldPrice)
                            .keyboardType(.numberPad)
                    }
                    
                    // 특이사항
                    Section(header: Text("특이사항")) {
                        TextEditor(text: $specialNotes)
                            .frame(minHeight: 100)
                    }
                    
                    // 평가 점수
                    Section(header: Text("종합 평가")) {
                        HStack {
                            Text("평가 점수")
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text("\(calculateScore())점")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(scoreColor(calculateScore()))
                        }
                        
                        HStack {
                            Text("평가")
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text(getScoreEvaluation(calculateScore()))
                                .font(.subheadline)
                                .foregroundColor(scoreColor(calculateScore()))
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("물건조사")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("저장") {
                        saveInspection()
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
                loadInspectionData()
            }
        }
    }
    
    // MARK: - Load Inspection Data
    private func loadInspectionData() {
        guard let inspection = property.inspection else { return }
        
        preservationRegistry = inspection.preservationRegistry ?? ""
        buildingAge = inspection.buildingAge ?? "중"
        meters = inspection.meters ?? ""
        mailCheck = inspection.mailCheck ?? ""
        slope = inspection.slope ?? ""
        lightingDirection = inspection.lightingDirection ?? ""
        structureFloor = inspection.structureFloor ?? ""
        parking = inspection.parking ?? ""
        waterLeakage = inspection.waterLeakage ?? ""
        unpaidUtilities = inspection.unpaidUtilities ?? ""
        gasType = inspection.gasType ?? ""
        gasUnpaid = inspection.gasUnpaid ?? ""
        residentsCheck = inspection.residentsCheck ?? ""
        currentResidents = inspection.currentResidents ?? ""
        
        busRoutes = inspection.busRoutes ?? ""
        subway = inspection.subway ?? ""
        shopping = inspection.shopping ?? ""
        schools = inspection.schools ?? ""
        
        molitPrice = inspection.molitPrice ?? ""
        naverPrice = inspection.naverPrice ?? ""
        kbPrice = inspection.kbPrice ?? ""
        fieldPrice = inspection.fieldPrice ?? ""
        
        specialNotes = inspection.specialNotes ?? ""
    }
    
    // MARK: - Save Inspection
    private func saveInspection() {
        let inspection = PropertyInspection(
            preservationRegistry: preservationRegistry.isEmpty ? nil : preservationRegistry,
            buildingAge: buildingAge,
            meters: meters.isEmpty ? nil : meters,
            mailCheck: mailCheck.isEmpty ? nil : mailCheck,
            slope: slope.isEmpty ? nil : slope,
            lightingDirection: lightingDirection.isEmpty ? nil : lightingDirection,
            structureFloor: structureFloor.isEmpty ? nil : structureFloor,
            parking: parking.isEmpty ? nil : parking,
            waterLeakage: waterLeakage.isEmpty ? nil : waterLeakage,
            unpaidUtilities: unpaidUtilities.isEmpty ? nil : unpaidUtilities,
            gasType: gasType.isEmpty ? nil : gasType,
            gasUnpaid: gasUnpaid.isEmpty ? nil : gasUnpaid,
            residentsCheck: residentsCheck.isEmpty ? nil : residentsCheck,
            currentResidents: currentResidents.isEmpty ? nil : currentResidents,
            busRoutes: busRoutes.isEmpty ? nil : busRoutes,
            subway: subway.isEmpty ? nil : subway,
            shopping: shopping.isEmpty ? nil : shopping,
            schools: schools.isEmpty ? nil : schools,
            molitPrice: molitPrice.isEmpty ? nil : molitPrice,
            naverPrice: naverPrice.isEmpty ? nil : naverPrice,
            kbPrice: kbPrice.isEmpty ? nil : kbPrice,
            fieldPrice: fieldPrice.isEmpty ? nil : fieldPrice,
            specialNotes: specialNotes.isEmpty ? nil : specialNotes,
            finalScore: calculateScore(),
            inspectionDate: Date()
        )
        
        var updatedProperty = property
        updatedProperty.inspection = inspection
        
        dataManager.updateProperty(updatedProperty)
        
        dismiss()
    }
    
    // MARK: - Calculate Score
    private func calculateScore() -> Int {
        var score = 0
        
        // 물건조사 항목 (각 5점, 최대 70점)
        if !preservationRegistry.isEmpty { score += 5 }
        if !meters.isEmpty { score += 5 }
        if !mailCheck.isEmpty { score += 5 }
        if !slope.isEmpty { score += 5 }
        if !lightingDirection.isEmpty { score += 5 }
        if !structureFloor.isEmpty { score += 5 }
        if !parking.isEmpty { score += 5 }
        if !waterLeakage.isEmpty { score += 5 }
        if !unpaidUtilities.isEmpty { score += 5 }
        if !gasType.isEmpty { score += 5 }
        if !gasUnpaid.isEmpty { score += 5 }
        if !residentsCheck.isEmpty { score += 5 }
        if !currentResidents.isEmpty { score += 5 }
        
        // 노후도 평가 (10점)
        if buildingAge == "상" { score += 10 }
        else if buildingAge == "중" { score += 5 }
        
        // 주변조사 항목 (각 5점, 최대 20점)
        if !busRoutes.isEmpty { score += 5 }
        if !subway.isEmpty { score += 5 }
        if !shopping.isEmpty { score += 5 }
        if !schools.isEmpty { score += 5 }
        
        // 시세조사 항목 (각 5점, 최대 20점 - 실제로는 4개이므로)
        if !molitPrice.isEmpty { score += 5 }
        if !naverPrice.isEmpty { score += 5 }
        if !kbPrice.isEmpty { score += 5 }
        if !fieldPrice.isEmpty { score += 5 }
        
        return min(score, 100) // 최대 100점
    }
    
    // MARK: - Score Color
    private func scoreColor(_ score: Int) -> Color {
        if score >= 80 { return .green }
        if score >= 60 { return .orange }
        return .red
    }
    
    // MARK: - Score Evaluation
    private func getScoreEvaluation(_ score: Int) -> String {
        if score >= 90 { return "매우 우수" }
        if score >= 80 { return "우수" }
        if score >= 70 { return "양호" }
        if score >= 60 { return "보통" }
        if score >= 50 { return "미흡" }
        return "불량"
    }
}

