import SwiftUI

struct PropertyListView: View {
    @StateObject private var dataManager = DataManager.shared
    @State private var searchText = ""
    @State private var showingAddProperty = false
    @State private var selectedProperty: AuctionProperty?
    @State private var filterStatus: AuctionStatus?
    @State private var filterType: PropertyType?
    
    var filteredProperties: [AuctionProperty] {
        var result = dataManager.properties
        
        // 검색 필터
        if !searchText.isEmpty {
            result = result.filter { property in
                property.caseNumber.localizedCaseInsensitiveContains(searchText) ||
                property.propertyLocation.localizedCaseInsensitiveContains(searchText) ||
                property.court.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // 상태 필터
        if let status = filterStatus {
            result = result.filter { $0.auctionStatus == status }
        }
        
        // 타입 필터
        if let type = filterType {
            result = result.filter { $0.propertyType == type }
        }
        
        return result
    }
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // 커스텀 헤더
                customHeader
                
                // 필터 섹션
                filterSection
                
                // 매물 목록
                if filteredProperties.isEmpty {
                    emptyStateView
                } else {
                    propertyListView
                }
            }
        }
        .sheet(isPresented: $showingAddProperty) {
            AddPropertyView()
        }
        .sheet(item: $selectedProperty) { property in
            PropertyDetailView(property: property)
        }
    }
    
    // MARK: - Custom Header
    private var customHeader: some View {
        HStack(spacing: 12) {
            // 앱 아이콘 이미지
            appIconImage
            
            Text("경매일기")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(AppTheme.primary)
            
            Spacer()
            
            // 추가 버튼
            Button {
                showingAddProperty = true
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundColor(AppTheme.accent)
                    .padding(.leading, 4)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(AppTheme.background)
    }
    
    // MARK: - App Icon Image
    private var appIconImage: some View {
        Group {
            if let icon = getAppIcon() {
                Image(uiImage: icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 32, height: 32)
                    .cornerRadius(6)
            } else {
                // Fallback: 건물 아이콘 (첨부파일과 유사한 스타일)
                Image(systemName: "building.2.fill")
                    .font(.system(size: 24))
                    .foregroundColor(AppTheme.accent)
                    .frame(width: 32, height: 32)
            }
        }
    }
    
    // AppIcon을 Bundle에서 가져오기
    private func getAppIcon() -> UIImage? {
        // 방법 1: AppIcon 이미지셋에서 직접 로드
        if let icon = UIImage(named: "AppIcon") {
            return icon
        }
        
        // 방법 2: 1024.png 파일 직접 로드
        if let iconPath = Bundle.main.path(forResource: "1024", ofType: "png", inDirectory: "AppIcon.appiconset"),
           let icon = UIImage(contentsOfFile: iconPath) {
            return icon
        }
        
        // 방법 3: Assets에서 AppIcon 이미지셋 찾기
        if let icon = UIImage(named: "AppIcon", in: Bundle.main, compatibleWith: nil) {
            return icon
        }
        
        return nil
    }
    
    // MARK: - Filter Section
    private var filterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // 상태 필터
                FilterChip(
                    title: "전체",
                    isSelected: filterStatus == nil,
                    action: { filterStatus = nil }
                )
                
                ForEach(AuctionStatus.allCases, id: \.self) { status in
                    FilterChip(
                        title: status.rawValue,
                        isSelected: filterStatus == status,
                        action: { filterStatus = status }
                    )
                }
                
                Divider()
                    .frame(height: 20)
                    .padding(.horizontal, 4)
                
                // 타입 필터
                ForEach(PropertyType.allCases, id: \.self) { type in
                    FilterChip(
                        title: type.rawValue,
                        icon: type.icon,
                        isSelected: filterType == type,
                        action: { filterType = type }
                    )
                }
            }
            .padding(.horizontal, AppTheme.largePadding)
            .padding(.vertical, AppTheme.smallPadding)
        }
        .background(AppTheme.cardBackground)
        .shadow(color: AppTheme.cardShadow, radius: 2, x: 0, y: 1)
    }
    
    // MARK: - Property List
    private var propertyListView: some View {
        ScrollView {
            LazyVStack(spacing: AppTheme.mediumPadding) {
                ForEach(filteredProperties) { property in
                    PropertyCard(property: property)
                        .onTapGesture {
                            selectedProperty = property
                        }
                        .contextMenu {
                            Button {
                                selectedProperty = property
                            } label: {
                                Label("상세보기", systemImage: "eye")
                            }
                            
                            Button(role: .destructive) {
                                dataManager.deleteProperty(property)
                            } label: {
                                Label("삭제", systemImage: "trash")
                            }
                        }
                }
            }
            .padding(AppTheme.largePadding)
        }
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "house.circle")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.secondary)
            
            Text("등록된 매물이 없습니다")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
            
            Text("우측 상단 + 버튼으로\n첫 경매 매물을 등록해보세요")
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
                .multilineTextAlignment(.center)
            
            Button {
                showingAddProperty = true
            } label: {
                Label("매물 등록", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.cornerRadius)
                            .fill(AppTheme.accentGradient)
                            .shadow(color: AppTheme.accentShadow, radius: 8, x: 0, y: 4)
                    )
            }
            .buttonStyle(ScaleButtonStyle())
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    var icon: String?
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .foregroundColor(isSelected ? .white : AppTheme.secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.smallCornerRadius)
                    .fill(isSelected ? AppTheme.accent : AppTheme.surfaceBackground)
            )
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Property Card
struct PropertyCard: View {
    let property: AuctionProperty
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            // 헤더: 사건번호 + 상태
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: property.propertyType.icon)
                        .font(.subheadline)
                        .foregroundColor(AppTheme.accent)
                    Text(property.propertyType.rawValue)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                }
                
                Spacer()
                
                StatusBadge(status: property.auctionStatus)
            }
            
            // 주소
            Text(property.propertyLocation)
                .font(.headline)
                .foregroundColor(AppTheme.primary)
                .lineLimit(2)
            
            // 사건번호 + 법원
            HStack(spacing: 12) {
                Label(property.caseNumber, systemImage: "doc.text")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                
                Label(property.court, systemImage: "building.columns")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
            }
            
            Divider()
            
            // 가격 정보
            HStack(spacing: 16) {
                PriceInfo(title: "입찰가", amount: property.bidPrice, color: AppTheme.accent)
                PriceInfo(title: "시세", amount: property.marketPrice, color: AppTheme.secondary)
                PriceInfo(title: "감정가", amount: property.appraisalPrice, color: AppTheme.tertiary)
                
                // 권장 입찰가 (시뮬레이션 결과가 있을 때만)
                if let result = property.simulationResult {
                    PriceInfo(title: "권장가", amount: result.recommendedBidPrice, color: .green)
                }
            }
            
            // 경매일
            HStack {
                Image(systemName: "calendar")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                Text("경매일: \(property.auctionDate, style: .date)")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                
                Spacer()
                
                if let result = property.simulationResult {
                    HStack(spacing: 4) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.caption2)
                        Text("수익률 \(String(format: "%.1f", result.profitRate))%")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(result.profitRate > 0 ? .green : .red)
                }
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: AuctionStatus
    
    var body: some View {
        Text(status.rawValue)
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(statusColor)
            )
    }
    
    private var statusColor: Color {
        switch status {
        case .inProgress: return .blue
        case .scheduled: return .orange
        case .completed: return .green
        case .failed: return .red
        }
    }
}

// MARK: - Price Info
struct PriceInfo: View {
    let title: String
    let amount: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundColor(color)
            Text(formatCurrency(amount))
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
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
