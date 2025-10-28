import SwiftUI
import Combine

// MARK: - 로컬 데이터 관리자 (UserDefaults 기반)
class DataManager: ObservableObject {
    static let shared = DataManager()
    
    @Published var properties: [AuctionProperty] = []
    
    private let propertiesKey = "savedProperties"
    
    private init() {
        loadProperties()
    }
    
    // MARK: - Load Properties
    func loadProperties() {
        guard let data = UserDefaults.standard.data(forKey: propertiesKey),
              let decoded = try? JSONDecoder().decode([AuctionProperty].self, from: data) else {
            properties = []
            return
        }
        properties = decoded.sorted(by: { $0.lastModifiedDate > $1.lastModifiedDate })
    }
    
    // MARK: - Save Properties
    func saveProperties() {
        guard let encoded = try? JSONEncoder().encode(properties) else { return }
        UserDefaults.standard.set(encoded, forKey: propertiesKey)
    }
    
    // MARK: - Add Property
    func addProperty(_ property: AuctionProperty) {
        var newProperty = property
        newProperty.createdDate = Date()
        newProperty.lastModifiedDate = Date()
        properties.insert(newProperty, at: 0)
        saveProperties()
    }
    
    // MARK: - Update Property
    func updateProperty(_ property: AuctionProperty) {
        guard let index = properties.firstIndex(where: { $0.id == property.id }) else { return }
        var updatedProperty = property
        updatedProperty.lastModifiedDate = Date()
        properties[index] = updatedProperty
        saveProperties()
    }
    
    // MARK: - Delete Property
    func deleteProperty(_ property: AuctionProperty) {
        properties.removeAll(where: { $0.id == property.id })
        saveProperties()
    }
    
    // MARK: - Delete Properties (Multiple)
    func deleteProperties(at offsets: IndexSet) {
        properties.remove(atOffsets: offsets)
        saveProperties()
    }
    
    // MARK: - Get Property by ID
    func getProperty(by id: UUID) -> AuctionProperty? {
        return properties.first(where: { $0.id == id })
    }
    
    // MARK: - Filter Properties
    func filterProperties(by status: AuctionStatus? = nil, type: PropertyType? = nil) -> [AuctionProperty] {
        var filtered = properties
        
        if let status = status {
            filtered = filtered.filter { $0.auctionStatus == status }
        }
        
        if let type = type {
            filtered = filtered.filter { $0.propertyType == type }
        }
        
        return filtered
    }
    
    // MARK: - Search Properties
    func searchProperties(query: String) -> [AuctionProperty] {
        guard !query.isEmpty else { return properties }
        
        return properties.filter { property in
            property.caseNumber.localizedCaseInsensitiveContains(query) ||
            property.propertyLocation.localizedCaseInsensitiveContains(query) ||
            property.court.localizedCaseInsensitiveContains(query)
        }
    }
}

