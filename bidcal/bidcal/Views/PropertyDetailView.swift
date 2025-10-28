import SwiftUI

struct PropertyDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    
    let property: AuctionProperty
    @State private var showingEditView = false
    @State private var showingDeleteAlert = false
    @State private var showingSimulationView = false
    @State private var showingInspectionView = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: AppTheme.largePadding) {
                        // 헤더 카드
                        headerCard
                        
                        // 가격 정보 카드
                        priceInfoCard
                        
                        // 입찰 전략 카드
                        strategyCard
                        
                        // 지역 정보 카드
                        if property.region != nil || property.district != nil {
                            regionCard
                        }
                        
                        // 시뮬레이션 결과 카드
                        if let result = property.simulationResult {
                            simulationResultCard(result)
                        } else {
                            addSimulationCard
                        }
                        
                        // 물건조사 카드
                        if property.inspection != nil {
                            inspectionCard
                        } else {
                            addInspectionCard
                        }
                    }
                    .padding(AppTheme.largePadding)
                }
            }
            .navigationTitle("매물 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("닫기") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showingEditView = true
                        } label: {
                            Label("편집", systemImage: "pencil")
                        }
                        
                        Button(role: .destructive) {
                            showingDeleteAlert = true
                        } label: {
                            Label("삭제", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingEditView) {
                EditPropertyView(property: property)
            }
            .sheet(isPresented: $showingSimulationView) {
                SimulationView(property: property)
            }
            .sheet(isPresented: $showingInspectionView) {
                InspectionView(property: property)
            }
            .alert("매물 삭제", isPresented: $showingDeleteAlert) {
                Button("취소", role: .cancel) { }
                Button("삭제", role: .destructive) {
                    dataManager.deleteProperty(property)
                    dismiss()
                }
            } message: {
                Text("이 매물을 삭제하시겠습니까?")
            }
        }
    }
    
    // MARK: - Header Card
    private var headerCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: property.propertyType.icon)
                        .font(.title3)
                        .foregroundColor(AppTheme.accent)
                    Text(property.propertyType.rawValue)
                        .font(.headline)
                        .foregroundColor(AppTheme.primary)
                }
                
                Spacer()
                
                StatusBadge(status: property.auctionStatus)
            }
            
            Text(property.propertyLocation)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(AppTheme.primary)
            
            Divider()
            
            DetailRow(icon: "doc.text", title: "사건번호", value: property.caseNumber)
            DetailRow(icon: "building.columns", title: "관할법원", value: property.court)
            DetailRow(icon: "calendar", title: "경매일", value: property.auctionDate.formatted(date: .long, time: .omitted))
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Price Info Card
    private var priceInfoCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .foregroundColor(AppTheme.accent)
                Text("가격 정보")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            PriceDetailRow(title: "입찰가격", amount: property.bidPrice, highlight: true)
            PriceDetailRow(title: "시세", amount: property.marketPrice)
            PriceDetailRow(title: "감정가", amount: property.appraisalPrice)
            PriceDetailRow(title: "최저입찰가", amount: property.minimumBid)
            
            if property.renovationCost > 0 {
                PriceDetailRow(title: "리모델링비용", amount: property.renovationCost)
            }
            
            // 가격 비율
            if property.marketPrice > 0 {
                Divider()
                HStack {
                    Text("시세 대비")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                    Spacer()
                    Text("\(String(format: "%.1f", (property.bidPrice / property.marketPrice) * 100))%")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                }
            }
            
            if property.appraisalPrice > 0 {
                HStack {
                    Text("감정가 대비")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                    Spacer()
                    Text("\(String(format: "%.1f", (property.bidPrice / property.appraisalPrice) * 100))%")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Strategy Card
    private var strategyCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(AppTheme.accent)
                Text("입찰 전략")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if property.competitorCount > 0 {
                DetailRow(icon: "person.3", title: "예상 경쟁자", value: "\(property.competitorCount)명")
            }
            
            if !property.marketCondition.isEmpty {
                DetailRow(icon: "chart.bar", title: "시장 상황", value: property.marketCondition)
            }
            
            if !property.urgency.isEmpty {
                DetailRow(icon: "clock", title: "긴급도", value: property.urgency)
            }
            
            if !property.auctionType.isEmpty {
                DetailRow(icon: "tag", title: "경매 유형", value: property.auctionType)
            }
            
            if property.failedCount > 0 {
                DetailRow(icon: "arrow.triangle.2.circlepath", title: "유찰 횟수", value: "\(property.failedCount)회")
            }
            
            DetailRow(icon: "percent", title: "목표 수익률", value: "\(String(format: "%.1f", property.targetProfitRate))%")
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Region Card
    private var regionCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "map")
                    .foregroundColor(AppTheme.accent)
                Text("지역 정보")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if let region = property.region {
                DetailRow(icon: "mappin.circle", title: "지역", value: region)
            }
            
            if let district = property.district {
                DetailRow(icon: "location", title: "구/군", value: district)
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Add Simulation Card
    private var addSimulationCard: some View {
        Button {
            showingSimulationView = true
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "chart.xyaxis.line")
                            .foregroundColor(AppTheme.accent)
                        Text("시뮬레이션 실행")
                            .font(.headline)
                            .foregroundColor(AppTheme.primary)
                    }
                    Text("낙찰 확률과 예상 수익을 계산해보세요")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(AppTheme.secondary)
            }
            .padding(AppTheme.mediumPadding)
            .cardStyle()
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    // MARK: - Simulation Result Card
    private func simulationResultCard(_ result: SimulationResult) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.xyaxis.line")
                    .foregroundColor(AppTheme.accent)
                Text("시뮬레이션 결과")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
                
                Spacer()
                
                Button {
                    showingSimulationView = true
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.accent)
                }
            }
            
            Divider()
            
            // 핵심 지표
            HStack(spacing: 16) {
                ResultMetric(
                    title: "낙찰확률",
                    value: "\(String(format: "%.1f", result.winningProbability))%",
                    color: .blue
                )
                ResultMetric(
                    title: "수익률",
                    value: "\(String(format: "%.1f", result.profitRate))%",
                    color: result.profitRate > 0 ? .green : .red
                )
                ResultMetric(
                    title: "예상수익",
                    value: formatCurrency(result.expectedProfit),
                    color: .orange
                )
            }
            
            Divider()
            
            PriceDetailRow(title: "권장 입찰가", amount: result.recommendedBidPrice, highlight: true)
            PriceDetailRow(title: "총 비용", amount: result.totalCost)
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Add Inspection Card
    private var addInspectionCard: some View {
        Button {
            showingInspectionView = true
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "doc.text.magnifyingglass")
                            .foregroundColor(AppTheme.accent)
                        Text("물건조사 작성")
                            .font(.headline)
                            .foregroundColor(AppTheme.primary)
                    }
                    Text("현장조사 내용을 기록해보세요")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(AppTheme.secondary)
            }
            .padding(AppTheme.mediumPadding)
            .cardStyle()
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    // MARK: - Inspection Card
    private var inspectionCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "doc.text.magnifyingglass")
                    .foregroundColor(AppTheme.accent)
                Text("물건조사")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
                
                Spacer()
                
                if let score = property.inspection?.finalScore {
                    Text("\(score)점")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor(score))
                }
            }
            
            Divider()
            
            Text("물건조사 내용이 기록되어 있습니다")
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
            
            Button {
                showingInspectionView = true
            } label: {
                Text("상세보기")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.accent)
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Helper Functions
    private func scoreColor(_ score: Int) -> Color {
        if score >= 80 { return .green }
        if score >= 60 { return .orange }
        return .red
    }
    
    private func formatCurrency(_ value: Double) -> String {
        if value >= 100000000 {
            return String(format: "%.1f억", value / 100000000)
        } else if value >= 10000 {
            return String(format: "%.0f만", value / 10000)
        } else {
            return String(format: "%.0f", value)
        }
    }
}

// MARK: - Detail Row
struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Label {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(AppTheme.secondary)
            } icon: {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(AppTheme.accent)
            }
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(AppTheme.primary)
        }
    }
}

// MARK: - Price Detail Row
struct PriceDetailRow: View {
    let title: String
    let amount: Double
    var highlight: Bool = false
    
    var body: some View {
        HStack {
            Text(title)
                .font(highlight ? .headline : .subheadline)
                .foregroundColor(highlight ? AppTheme.primary : AppTheme.secondary)
            
            Spacer()
            
            Text(formatCurrency(amount))
                .font(highlight ? .headline : .subheadline)
                .fontWeight(highlight ? .bold : .semibold)
                .foregroundColor(highlight ? AppTheme.accent : AppTheme.primary)
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        if value >= 100000000 {
            return String(format: "%.2f억원", value / 100000000)
        } else if value >= 10000 {
            return String(format: "%.0f만원", value / 10000)
        } else {
            return String(format: "%.0f원", value)
        }
    }
}

// MARK: - Result Metric
struct ResultMetric: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
    }
}

