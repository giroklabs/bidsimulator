import SwiftUI
import Charts

struct StatisticsRootView: View {
    @StateObject private var regionDataLoader = RegionDataLoader.shared
    @StateObject private var dataManager = DataManager.shared
    
    @State private var selectedRegion: String = "전체"
    @State private var selectedTab: StatisticsTab = .regional
    
    enum StatisticsTab: String, CaseIterable {
        case regional = "지역별 통계"
        case myData = "내 데이터"
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 탭 선택
                    tabSelector
                    
                    // 콘텐츠
                    if selectedTab == .regional {
                        regionalStatisticsView
                    } else {
                        myDataStatisticsView
                    }
                }
            }
            .navigationTitle("통계")
        }
    }
    
    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(StatisticsTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 8) {
                        Text(tab.rawValue)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(selectedTab == tab ? AppTheme.primary : AppTheme.secondary)
                        
                        Rectangle()
                            .fill(selectedTab == tab ? AppTheme.accent : Color.clear)
                            .frame(height: 2)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, AppTheme.largePadding)
        .background(AppTheme.cardBackground)
        .shadow(color: AppTheme.cardShadow, radius: 2, x: 0, y: 1)
    }
    
    // MARK: - Regional Statistics View
    private var regionalStatisticsView: some View {
        ScrollView {
            VStack(spacing: AppTheme.largePadding) {
                // 지역 선택
                regionSelector
                
                // 지역별 통계 카드들
                ForEach(filteredStatistics) { stat in
                    RegionalStatCard(stat: stat)
                }
                
                if filteredStatistics.isEmpty {
                    emptyStateView
                }
            }
            .padding(AppTheme.largePadding)
        }
    }
    
    // MARK: - My Data Statistics View
    private var myDataStatisticsView: some View {
        ScrollView {
            VStack(spacing: AppTheme.largePadding) {
                if dataManager.properties.isEmpty {
                    emptyDataView
                } else {
                    // 요약 카드
                    summaryCard
                    
                    // 물건 종류별 분포
                    propertyTypeChart
                    
                    // 가격 분포
                    priceDistributionChart
                    
                    // 상태별 분포
                    statusDistributionChart
                }
            }
            .padding(AppTheme.largePadding)
        }
    }
    
    // MARK: - Region Selector
    private var regionSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                RegionChip(title: "전체", isSelected: selectedRegion == "전체") {
                    selectedRegion = "전체"
                }
                
                ForEach(["서울", "경기", "부산", "인천", "대구", "광주", "대전", "울산", "세종"], id: \.self) { region in
                    RegionChip(title: region, isSelected: selectedRegion == region) {
                        selectedRegion = region
                    }
                }
            }
        }
    }
    
    // MARK: - Filtered Statistics
    private var filteredStatistics: [RegionStatistics] {
        if selectedRegion == "전체" {
            return regionDataLoader.statistics
        }
        return regionDataLoader.statistics.filter { $0.region == selectedRegion }
    }
    
    // MARK: - Summary Card
    private var summaryCard: some View {
        VStack(spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.bar.doc.horizontal")
                    .foregroundColor(AppTheme.accent)
                Text("내 매물 요약")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
                Spacer()
            }
            
            Divider()
            
            HStack(spacing: 12) {
                SummaryBox(
                    title: "총 매물",
                    value: "\(dataManager.properties.count)",
                    icon: "house.fill",
                    color: .blue
                )
                SummaryBox(
                    title: "평균 입찰가",
                    value: formatShortCurrency(averageBidPrice),
                    icon: "wonsign.circle.fill",
                    color: AppTheme.accent
                )
                SummaryBox(
                    title: "평균 수익률",
                    value: "\(String(format: "%.1f", averageProfitRate))%",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .green
                )
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Property Type Chart
    private var propertyTypeChart: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.pie.fill")
                    .foregroundColor(AppTheme.accent)
                Text("물건 종류별 분포")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if #available(iOS 16.0, *) {
                Chart(propertyTypeData, id: \.type) { item in
                    SectorMark(
                        angle: .value("개수", item.count),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(by: .value("종류", item.type.rawValue))
                }
                .frame(height: 250)
                .chartLegend(position: .bottom)
            } else {
                VStack(spacing: 8) {
                    ForEach(propertyTypeData, id: \.type) { item in
                        HStack {
                            Circle()
                                .fill(AppTheme.accent)
                                .frame(width: 8, height: 8)
                            Text(item.type.rawValue)
                                .font(.subheadline)
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text("\(item.count)건")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(AppTheme.primary)
                        }
                    }
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Price Distribution Chart
    private var priceDistributionChart: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundColor(AppTheme.accent)
                Text("가격대별 분포")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if #available(iOS 16.0, *) {
                Chart(priceRangeData, id: \.range) { item in
                    BarMark(
                        x: .value("구간", item.range),
                        y: .value("개수", item.count)
                    )
                    .foregroundStyle(AppTheme.accentGradient)
                }
                .frame(height: 200)
            } else {
                VStack(spacing: 8) {
                    ForEach(priceRangeData, id: \.range) { item in
                        HStack {
                            Text(item.range)
                                .font(.subheadline)
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text("\(item.count)건")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(AppTheme.primary)
                        }
                    }
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Status Distribution Chart
    private var statusDistributionChart: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                Image(systemName: "chart.bar.xaxis")
                    .foregroundColor(AppTheme.accent)
                Text("상태별 분포")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
            }
            
            Divider()
            
            if #available(iOS 16.0, *) {
                Chart(statusData, id: \.status) { item in
                    BarMark(
                        x: .value("개수", item.count),
                        y: .value("상태", item.status.rawValue)
                    )
                    .foregroundStyle(statusColor(item.status))
                }
                .frame(height: 150)
            } else {
                VStack(spacing: 8) {
                    ForEach(statusData, id: \.status) { item in
                        HStack {
                            Circle()
                                .fill(statusColor(item.status))
                                .frame(width: 8, height: 8)
                            Text(item.status.rawValue)
                                .font(.subheadline)
                                .foregroundColor(AppTheme.secondary)
                            Spacer()
                            Text("\(item.count)건")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(AppTheme.primary)
                        }
                    }
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.bar.xaxis")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.secondary)
            
            Text("통계 데이터가 없습니다")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
            
            Text("해당 지역의 경매 통계를\n준비 중입니다")
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Empty Data View
    private var emptyDataView: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.secondary)
            
            Text("등록된 매물이 없습니다")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
            
            Text("매물을 등록하면\n나만의 통계를 확인할 수 있습니다")
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    // MARK: - Data Calculations
    private var averageBidPrice: Double {
        guard !dataManager.properties.isEmpty else { return 0 }
        let total = dataManager.properties.reduce(0.0) { $0 + $1.bidPrice }
        return total / Double(dataManager.properties.count)
    }
    
    private var averageProfitRate: Double {
        let propertiesWithSimulation = dataManager.properties.filter { $0.simulationResult != nil }
        guard !propertiesWithSimulation.isEmpty else { return 0 }
        let total = propertiesWithSimulation.reduce(0.0) { $0 + ($1.simulationResult?.profitRate ?? 0) }
        return total / Double(propertiesWithSimulation.count)
    }
    
    private var propertyTypeData: [(type: PropertyType, count: Int)] {
        let grouped = Dictionary(grouping: dataManager.properties) { $0.propertyType }
        return grouped.map { (type: $0.key, count: $0.value.count) }
            .sorted { $0.count > $1.count }
    }
    
    private var priceRangeData: [(range: String, count: Int)] {
        let ranges = [
            ("1억 미만", 0.0..<100000000.0),
            ("1억~3억", 100000000.0..<300000000.0),
            ("3억~5억", 300000000.0..<500000000.0),
            ("5억~10억", 500000000.0..<1000000000.0),
            ("10억 이상", 1000000000.0..<Double.infinity)
        ]
        
        return ranges.map { label, range in
            let count = dataManager.properties.filter { range.contains($0.bidPrice) }.count
            return (range: label, count: count)
        }
    }
    
    private var statusData: [(status: AuctionStatus, count: Int)] {
        let grouped = Dictionary(grouping: dataManager.properties) { $0.auctionStatus }
        return AuctionStatus.allCases.map { status in
            (status: status, count: grouped[status]?.count ?? 0)
        }
    }
    
    // MARK: - Helper Functions
    private func statusColor(_ status: AuctionStatus) -> Color {
        switch status {
        case .inProgress: return .blue
        case .scheduled: return .orange
        case .completed: return .green
        case .failed: return .red
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

// MARK: - Region Chip
struct RegionChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? AppTheme.primary : AppTheme.secondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.smallCornerRadius)
                        .fill(isSelected ? AppTheme.accent : AppTheme.surfaceBackground)
                )
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Regional Stat Card
struct RegionalStatCard: View {
    let stat: RegionStatistics
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(stat.region)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.primary)
                    
                    if let district = stat.district {
                        Text(district)
                            .font(.subheadline)
                            .foregroundColor(AppTheme.secondary)
                    }
                }
                
                Spacer()
                
                Text(stat.investmentRecommendation)
                    .font(.title2)
            }
            
            Divider()
            
            VStack(spacing: 8) {
                StatRow(
                    icon: "percent.circle.fill",
                    title: "매각가율",
                    value: "\(String(format: "%.1f", stat.salePriceRate))%",
                    color: .blue
                )
                StatRow(
                    icon: "checkmark.circle.fill",
                    title: "매각률",
                    value: "\(String(format: "%.1f", stat.saleSuccessRate))%",
                    color: .green
                )
                StatRow(
                    icon: "person.3.fill",
                    title: "평균 입찰 건수",
                    value: "\(String(format: "%.1f", stat.averageBidCount))건",
                    color: .orange
                )
            }
            
            HStack {
                Image(systemName: "calendar")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                Text("기간: \(stat.period)")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
}

// MARK: - Stat Row
struct StatRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
        }
    }
}

// MARK: - Summary Box
struct SummaryBox: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(AppTheme.primary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(AppTheme.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.smallPadding)
    }
}
