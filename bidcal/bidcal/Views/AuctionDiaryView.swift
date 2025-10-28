import SwiftUI

struct AuctionDiaryView: View {
    @StateObject private var dataManager = DataManager.shared
    @State private var showingAddEntry = false
    @State private var selectedEntry: AuctionProperty?
    @State private var searchText = ""
    @State private var filterStatus: AuctionStatus?
    
    var filteredEntries: [AuctionProperty] {
        var result = dataManager.properties
        
        if !searchText.isEmpty {
            result = result.filter { property in
                property.caseNumber.localizedCaseInsensitiveContains(searchText) ||
                property.propertyLocation.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        if let status = filterStatus {
            result = result.filter { $0.auctionStatus == status }
        }
        
        return result.sorted(by: { $0.auctionDate > $1.auctionDate })
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 필터 섹션
                    filterSection
                    
                    // 일지 목록
                    if filteredEntries.isEmpty {
                        emptyStateView
                    } else {
                        diaryListView
                    }
                }
            }
            .navigationTitle("경매 일지")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddEntry = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundColor(AppTheme.accent)
                    }
                }
            }
            .searchable(text: $searchText, prompt: "사건번호, 주소 검색")
            .sheet(isPresented: $showingAddEntry) {
                AddPropertyView()
            }
            .sheet(item: $selectedEntry) { entry in
                PropertyDetailView(property: entry)
            }
        }
    }
    
    // MARK: - Filter Section
    private var filterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppTheme.smallPadding) {
                // 전체 필터
                FilterChip(
                    title: "전체",
                    isSelected: filterStatus == nil,
                    action: { filterStatus = nil }
                )
                
                // 상태별 필터
                ForEach(AuctionStatus.allCases, id: \.self) { status in
                    FilterChip(
                        title: status.rawValue,
                        isSelected: filterStatus == status,
                        action: { filterStatus = status }
                    )
                }
            }
            .padding(.horizontal, AppTheme.largePadding)
            .padding(.vertical, AppTheme.smallPadding)
        }
        .background(AppTheme.cardBackground)
        .shadow(color: AppTheme.cardShadow, radius: 2, x: 0, y: 1)
    }
    
    // MARK: - Diary List
    private var diaryListView: some View {
        ScrollView {
            LazyVStack(spacing: AppTheme.mediumPadding) {
                ForEach(groupedEntries, id: \.key) { dateGroup in
                    Section(header: dateHeader(dateGroup.key)) {
                        ForEach(dateGroup.value) { entry in
                            DiaryEntryCard(entry: entry)
                                .onTapGesture {
                                    selectedEntry = entry
                                }
                        }
                    }
                }
            }
            .padding(AppTheme.largePadding)
        }
    }
    
    // MARK: - Grouped Entries
    private var groupedEntries: [(key: String, value: [AuctionProperty])] {
        let grouped = Dictionary(grouping: filteredEntries) { entry in
            Calendar.current.isDateInToday(entry.auctionDate) ? "오늘" :
            Calendar.current.isDateInYesterday(entry.auctionDate) ? "어제" :
            entry.auctionDate.formatted(date: .complete, time: .omitted)
        }
        
        return grouped.sorted { first, second in
            guard let firstDate = dateFromString(first.key),
                  let secondDate = dateFromString(second.key) else {
                return false
            }
            return firstDate > secondDate
        }
    }
    
    private func dateFromString(_ string: String) -> Date? {
        if string == "오늘" { return Date() }
        if string == "어제" { return Calendar.current.date(byAdding: .day, value: -1, to: Date()) }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy년 M월 d일"
        return formatter.date(from: string)
    }
    
    // MARK: - Date Header
    private func dateHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(AppTheme.primary)
            Spacer()
        }
        .padding(.top, AppTheme.mediumPadding)
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "book.closed")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.secondary)
            
            Text("일지가 없습니다")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
            
            Text("우측 상단 + 버튼으로\n경매 일지를 기록해보세요")
                .font(.subheadline)
                .foregroundColor(AppTheme.secondary)
                .multilineTextAlignment(.center)
            
            Button {
                showingAddEntry = true
            } label: {
                Label("일지 작성", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundColor(AppTheme.primary)
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

// MARK: - Diary Entry Card
struct DiaryEntryCard: View {
    let entry: AuctionProperty
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.mediumPadding) {
            // 경매일 + 상태
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar.circle.fill")
                            .font(.subheadline)
                            .foregroundColor(AppTheme.accent)
                        Text(entry.auctionDate.formatted(date: .abbreviated, time: .omitted))
                            .font(.subheadline)
                            .foregroundColor(AppTheme.secondary)
                    }
                    
                    Text(entry.propertyLocation)
                        .font(.headline)
                        .foregroundColor(AppTheme.primary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    StatusBadge(status: entry.auctionStatus)
                    
                    if let result = entry.simulationResult {
                        Text("수익률 \(String(format: "%.1f", result.profitRate))%")
                            .font(.caption)
                            .foregroundColor(result.profitRate > 0 ? .green : .red)
                    }
                }
            }
            
            Divider()
            
            // 사건번호 + 법원
            HStack(spacing: 16) {
                Label(entry.caseNumber, systemImage: "doc.text")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                
                Label(entry.court, systemImage: "building.columns")
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
            }
            
            // 간단한 메모 영역
            if let inspection = entry.inspection,
               let notes = inspection.specialNotes,
               !notes.isEmpty {
                Text(String(notes.prefix(100)))
                    .font(.caption)
                    .foregroundColor(AppTheme.secondary)
                    .lineLimit(2)
                    .padding(.top, 4)
            }
        }
        .padding(AppTheme.mediumPadding)
        .cardStyle()
    }
}

