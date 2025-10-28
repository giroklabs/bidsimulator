import SwiftUI
import Charts

struct SimulationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var dataManager = DataManager.shared
    
    let property: AuctionProperty
    @State private var simulationResult: SimulationResult?
    @State private var isCalculating = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: AppTheme.largePadding) {
                        // 입력 정보 요약
                        inputSummaryCard
                        
                        if let result = simulationResult {
                            // 핵심 지표
                            keyMetricsCard(result)
                            
                            // 권장 입찰가
                            recommendedBidCard(result)
                            
                            // 비용 상세
                            costDetailCard(result)
                            
                            // 가격 비교 차트
                            priceComparisonChart(result)
                            
                            // 비용 구성 차트
                            costBreakdownChart(result)
                        } else if isCalculating {
                            ProgressView("계산 중...")
                                .padding()
                        }
                    }
                    .padding(AppTheme.largePadding)
                }
            }
            .navigationTitle("시뮬레이션")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("닫기") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        runSimulation()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(AppTheme.accent)
                    }
                }
            }
            .onAppear {
                if simulationResult == nil {
                    runSimulation()
                }
            }
        }
    }
    
    // MARK: - Input Summary Card
    private var inputSummaryCard: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(AppTheme.accent)
                Text("입력 정보")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            DetailRow(icon: "mappin.circle", title: "주소", value: property.propertyLocation)
            DetailRow(icon: "wonsign.circle", title: "입찰가", value: formatCurrency(property.bidPrice))
            DetailRow(icon: "chart.line.uptrend.xyaxis", title: "시세", value: formatCurrency(property.marketPrice))
            if property.appraisalPrice > 0 {
                DetailRow(icon: "doc.text", title: "감정가", value: formatCurrency(property.appraisalPrice))
            }
            DetailRow(icon: "percent", title: "목표 수익률", value: "\(String(format: "%.1f", property.targetProfitRate))%")
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Key Metrics Card
    private func keyMetricsCard(_ result: SimulationResult) -> some View {
        VStack(spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.xyaxis.line")
                    .foregroundColor(AppTheme.accent)
                Text("핵심 지표")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
                Spacer()
            }
            
            HStack(spacing: 12) {
                MetricBox(
                    title: "낙찰확률",
                    value: "\(String(format: "%.1f", result.winningProbability))%",
                    color: probabilityColor(result.winningProbability),
                    icon: "target"
                )
                MetricBox(
                    title: "수익률",
                    value: "\(String(format: "%.1f", result.profitRate))%",
                    color: result.profitRate > 0 ? .green : .red,
                    icon: "chart.line.uptrend.xyaxis"
                )
                MetricBox(
                    title: "예상수익",
                    value: formatShortCurrency(result.expectedProfit),
                    color: result.expectedProfit > 0 ? .green : .red,
                    icon: "dollarsign.circle"
                )
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Recommended Bid Card
    private func recommendedBidCard(_ result: SimulationResult) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(AppTheme.accent)
                Text("권장 입찰가")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("권장 입찰가")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                    Text(formatCurrency(result.recommendedBidPrice))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.accent)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("현재 입찰가")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.secondary)
                    Text(formatCurrency(property.bidPrice))
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                }
            }
            
            // 입찰가 비교
            let difference = property.bidPrice - result.recommendedBidPrice
            let differencePercent = (difference / result.recommendedBidPrice) * 100.0
            
            HStack {
                Image(systemName: difference > 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                    .foregroundColor(difference > 0 ? .red : .green)
                Text("권장가 대비 \(difference > 0 ? "+" : "")\(formatCurrency(abs(difference))) (\(String(format: "%.1f", abs(differencePercent)))%)")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.secondary)
            }
            .padding(.top, 4)
            
            // 조언
            Text(getBidAdvice(difference: difference, probability: result.winningProbability))
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
                .padding(.top, 8)
                .padding(.horizontal, 8)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.smallCornerRadius)
                        .fill(AppTheme.accentPale)
                )
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Cost Detail Card
    private func costDetailCard(_ result: SimulationResult) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "list.bullet.rectangle")
                    .foregroundColor(AppTheme.accent)
                Text("비용 상세")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            CostRow(title: "입찰보증금 (10%)", amount: result.depositAmount)
            CostRow(title: "잔금 (90%)", amount: result.remainingPayment)
            
            Divider()
            
            CostRow(title: "취득세", amount: result.acquisitionTax)
            CostRow(title: "지방교육세", amount: result.localEducationTax)
            CostRow(title: "농어촌특별세", amount: result.ruralSpecialTax)
            CostRow(title: "등기비용", amount: result.registrationFees)
            CostRow(title: "전문가 수수료", amount: result.professionalFees)
            
            if result.otherCosts > 0 {
                CostRow(title: "기타 비용", amount: result.otherCosts)
            }
            
            Divider()
            
            HStack {
                Text("총 비용")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
                Spacer()
                Text(formatCurrency(result.totalCost))
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.accent)
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Price Comparison Chart
    private func priceComparisonChart(_ result: SimulationResult) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundColor(AppTheme.accent)
                Text("가격 비교")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if #available(iOS 16.0, *) {
                Chart {
                    BarMark(
                        x: .value("금액", property.bidPrice),
                        y: .value("구분", "입찰가")
                    )
                    .foregroundStyle(Color.blue)
                    
                    BarMark(
                        x: .value("금액", result.recommendedBidPrice),
                        y: .value("구분", "권장가")
                    )
                    .foregroundStyle(AppTheme.accent)
                    
                    BarMark(
                        x: .value("금액", property.marketPrice),
                        y: .value("구분", "시세")
                    )
                    .foregroundStyle(Color.green)
                    
                    if property.appraisalPrice > 0 {
                        BarMark(
                            x: .value("금액", property.appraisalPrice),
                            y: .value("구분", "감정가")
                        )
                        .foregroundStyle(Color.orange)
                    }
                }
                .frame(height: 200)
                .chartXAxis {
                    AxisMarks(values: .automatic) { value in
                        AxisValueLabel {
                            if let doubleValue = value.as(Double.self) {
                                Text(formatShortCurrency(doubleValue))
                                    .font(.caption2)
                            }
                        }
                    }
                }
            } else {
                // iOS 16 미만 버전용 대체 UI
                VStack(spacing: 8) {
                    PriceBar(title: "입찰가", amount: property.bidPrice, maxAmount: property.marketPrice, color: .blue)
                    PriceBar(title: "권장가", amount: result.recommendedBidPrice, maxAmount: property.marketPrice, color: AppTheme.accent)
                    PriceBar(title: "시세", amount: property.marketPrice, maxAmount: property.marketPrice, color: .green)
                    if property.appraisalPrice > 0 {
                        PriceBar(title: "감정가", amount: property.appraisalPrice, maxAmount: property.marketPrice, color: .orange)
                    }
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Cost Breakdown Chart
    private func costBreakdownChart(_ result: SimulationResult) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.pie.fill")
                    .foregroundColor(AppTheme.accent)
                Text("비용 구성")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if #available(iOS 16.0, *) {
                let costData = [
                    ("취득세", result.acquisitionTax),
                    ("지방교육세", result.localEducationTax),
                    ("농어촌특별세", result.ruralSpecialTax),
                    ("등기비용", result.registrationFees),
                    ("전문가수수료", result.professionalFees),
                    ("기타비용", result.otherCosts)
                ].filter { $0.1 > 0 }
                
                Chart(costData, id: \.0) { item in
                    SectorMark(
                        angle: .value("금액", item.1),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(by: .value("구분", item.0))
                }
                .frame(height: 250)
                .chartLegend(position: .bottom)
            } else {
                // iOS 16 미만 버전용 대체 UI
                VStack(spacing: 8) {
                    CostPercentageRow(title: "취득세", amount: result.acquisitionTax, total: result.totalCost)
                    CostPercentageRow(title: "지방교육세", amount: result.localEducationTax, total: result.totalCost)
                    CostPercentageRow(title: "농어촌특별세", amount: result.ruralSpecialTax, total: result.totalCost)
                    CostPercentageRow(title: "등기비용", amount: result.registrationFees, total: result.totalCost)
                    CostPercentageRow(title: "전문가수수료", amount: result.professionalFees, total: result.totalCost)
                    if result.otherCosts > 0 {
                        CostPercentageRow(title: "기타비용", amount: result.otherCosts, total: result.totalCost)
                    }
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Run Simulation
    private func runSimulation() {
        isCalculating = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let result = AuctionCalculator.shared.runSimulation(for: property)
            
            // 결과 저장
            var updatedProperty = property
            updatedProperty.simulationResult = result
            dataManager.updateProperty(updatedProperty)
            
            withAnimation {
                simulationResult = result
                isCalculating = false
            }
        }
    }
    
    // MARK: - Helper Functions
    private func probabilityColor(_ probability: Double) -> Color {
        if probability >= 70 { return .green }
        if probability >= 40 { return .orange }
        return .red
    }
    
    private func getBidAdvice(difference: Double, probability: Double) -> String {
        if difference > 0 {
            if probability > 70 {
                return "💡 현재 입찰가가 권장가보다 높습니다. 낙찰 확률이 높지만 수익률이 낮아질 수 있습니다."
            } else {
                return "⚠️ 입찰가가 높아 낙찰되더라도 수익률이 낮을 수 있습니다. 재검토를 권장합니다."
            }
        } else {
            if probability < 40 {
                return "⚠️ 현재 입찰가가 권장가보다 낮아 낙찰 확률이 낮습니다. 입찰가 상향을 고려하세요."
            } else {
                return "✅ 적절한 입찰가입니다. 합리적인 수익률과 낙찰 확률을 기대할 수 있습니다."
            }
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
    
    private func formatShortCurrency(_ value: Double) -> String {
        if value >= 100000000 {
            return String(format: "%.1f억", value / 100000000)
        } else if value >= 10000 {
            return String(format: "%.0f만", value / 10000)
        } else {
            return String(format: "%.0f", value)
        }
    }
}

// MARK: - Metric Box
struct MetricBox: View {
    let title: String
    let value: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.mediumPadding)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.cornerRadius)
                .fill(color.opacity(0.1))
        )
    }
}

// MARK: - Cost Row
struct CostRow: View {
    let title: String
    let amount: Double
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
            Spacer()
            Text(formatCurrency(amount))
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(AppTheme.primary)
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

// MARK: - Price Bar (iOS 15 fallback)
struct PriceBar: View {
    let title: String
    let amount: Double
    let maxAmount: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                Spacer()
                Text(formatCurrency(amount))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(AppTheme.surfaceBackground)
                        .frame(height: 20)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * (amount / maxAmount), height: 20)
                        .cornerRadius(4)
                }
            }
            .frame(height: 20)
        }
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

// MARK: - Cost Percentage Row (iOS 15 fallback)
struct CostPercentageRow: View {
    let title: String
    let amount: Double
    let total: Double
    
    var body: some View {
        HStack {
            Circle()
                .fill(AppTheme.accent)
                .frame(width: 8, height: 8)
            
            Text(title)
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
            
            Spacer()
            
            Text("\(String(format: "%.1f", (amount / total) * 100))%")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
            
            Text(formatCurrency(amount))
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        if value >= 10000 {
            return String(format: "%.0f만", value / 10000)
        } else {
            return String(format: "%.0f", value)
        }
    }
}

