import Foundation

// MARK: - 경매 계산기
class AuctionCalculator {
    static let shared = AuctionCalculator()
    
    private init() {}
    
    // MARK: - 시뮬레이션 실행
    func runSimulation(for property: AuctionProperty) -> SimulationResult {
        // 1. 매각가율 가져오기
        let salePriceRate = getSalePriceRate(region: property.region, district: property.district)
        
        // 2. 예상 낙찰가 계산
        let expectedAuctionPrice = property.marketPrice * (salePriceRate / 100.0)
        
        // 3. 권장 입찰가 계산
        let recommendedBidPrice = calculateRecommendedBidPrice(
            marketPrice: property.marketPrice,
            salePriceRate: salePriceRate,
            targetProfitRate: property.targetProfitRate,
            renovationCost: property.renovationCost
        )
        
        // 4. 낙찰 확률 계산
        let winningProbability = calculateWinningProbability(
            bidPrice: property.bidPrice,
            recommendedBidPrice: recommendedBidPrice,
            competitorCount: property.competitorCount,
            failedCount: property.failedCount
        )
        
        // 5. 비용 상세 계산
        let costs = calculateDetailedCosts(
            bidPrice: property.bidPrice,
            renovationCost: property.renovationCost
        )
        
        // 6. 수익 계산
        let expectedProfit = property.marketPrice - property.bidPrice - costs.totalCost
        let profitRate = (expectedProfit / property.bidPrice) * 100.0
        
        // 7. 가격 비율
        let marketRatio = (property.bidPrice / property.marketPrice) * 100.0
        let appraisalRatio = property.appraisalPrice > 0 ? (property.bidPrice / property.appraisalPrice) * 100.0 : 0
        
        return SimulationResult(
            recommendedBidPrice: recommendedBidPrice,
            winningProbability: winningProbability,
            expectedProfit: expectedProfit,
            totalCost: costs.totalCost,
            profitRate: profitRate,
            depositAmount: costs.depositAmount,
            remainingPayment: costs.remainingPayment,
            acquisitionTax: costs.acquisitionTax,
            localEducationTax: costs.localEducationTax,
            ruralSpecialTax: costs.ruralSpecialTax,
            registrationFees: costs.registrationFees,
            professionalFees: costs.professionalFees,
            otherCosts: costs.otherCosts,
            marketRatio: marketRatio,
            appraisalRatio: appraisalRatio
        )
    }
    
    // MARK: - 권장 입찰가 계산
    private func calculateRecommendedBidPrice(
        marketPrice: Double,
        salePriceRate: Double,
        targetProfitRate: Double,
        renovationCost: Double
    ) -> Double {
        // 1. 매각가율을 적용한 예상 낙찰가
        let expectedAuctionPrice = marketPrice * (salePriceRate / 100.0)
        
        // 2. 추가 비용 (수리비 + 세금 등)
        let additionalCosts = renovationCost + (expectedAuctionPrice * 0.015) // 취득세 1.5%
        
        // 3. 수수료 (경매 수수료 + 등기 비용)
        let fees = expectedAuctionPrice * 0.03 // 약 3%
        
        // 4. 목표 수익
        let targetProfit = expectedAuctionPrice * (targetProfitRate / 100.0)
        
        // 5. 권장 입찰가 = 예상 낙찰가 - 비용 - 수수료 - 목표 수익
        let recommendedBidPrice = expectedAuctionPrice - additionalCosts - fees - targetProfit
        
        // 6. 최소 입찰가 보장 (시세의 30% 이상)
        let minBidPrice = marketPrice * 0.3
        
        return max(recommendedBidPrice, minBidPrice)
    }
    
    // MARK: - 낙찰 확률 계산
    private func calculateWinningProbability(
        bidPrice: Double,
        recommendedBidPrice: Double,
        competitorCount: Int,
        failedCount: Int
    ) -> Double {
        // 기본 확률 (입찰가와 권장가 비율)
        let bidRatio = bidPrice / recommendedBidPrice
        var baseProbability = min(bidRatio * 50.0, 90.0) // 최대 90%
        
        // 경쟁자 수에 따른 조정
        let competitorAdjustment = Double(competitorCount) * -3.0 // 경쟁자 1명당 -3%
        baseProbability += competitorAdjustment
        
        // 유찰 횟수에 따른 조정 (유찰이 많을수록 확률 증가)
        let failedAdjustment = Double(failedCount) * 5.0 // 유찰 1회당 +5%
        baseProbability += failedAdjustment
        
        // 확률 범위 제한 (10% ~ 95%)
        return max(10.0, min(baseProbability, 95.0))
    }
    
    // MARK: - 비용 상세 계산
    private func calculateDetailedCosts(
        bidPrice: Double,
        renovationCost: Double
    ) -> (
        totalCost: Double,
        depositAmount: Double,
        remainingPayment: Double,
        acquisitionTax: Double,
        localEducationTax: Double,
        ruralSpecialTax: Double,
        registrationFees: Double,
        professionalFees: Double,
        otherCosts: Double
    ) {
        // 1. 입찰보증금 (낙찰가의 10%)
        let depositAmount = bidPrice * 0.1
        
        // 2. 잔금 (낙찰가의 90%)
        let remainingPayment = bidPrice * 0.9
        
        // 3. 취득세 (낙찰가의 4%)
        let acquisitionTax = bidPrice * 0.04
        
        // 4. 지방교육세 (취득세의 10%)
        let localEducationTax = acquisitionTax * 0.1
        
        // 5. 농어촌특별세 (취득세의 10%, 조건부)
        let ruralSpecialTax = acquisitionTax * 0.1
        
        // 6. 등기비용 (약 1%)
        let registrationFees = bidPrice * 0.01
        
        // 7. 전문가 수수료 (법무사, 감정평가 등, 약 0.5%)
        let professionalFees = bidPrice * 0.005
        
        // 8. 기타 비용 (리모델링 등)
        let otherCosts = renovationCost
        
        // 9. 총 비용
        let totalCost = acquisitionTax + localEducationTax + ruralSpecialTax +
                       registrationFees + professionalFees + otherCosts
        
        return (
            totalCost: totalCost,
            depositAmount: depositAmount,
            remainingPayment: remainingPayment,
            acquisitionTax: acquisitionTax,
            localEducationTax: localEducationTax,
            ruralSpecialTax: ruralSpecialTax,
            registrationFees: registrationFees,
            professionalFees: professionalFees,
            otherCosts: otherCosts
        )
    }
    
    // MARK: - 매각가율 조회
    private func getSalePriceRate(region: String?, district: String?) -> Double {
        guard let region = region else { return 80.0 }
        
        // RegionDataLoader에서 매각가율 조회
        let rate = RegionDataLoader.shared.getSalePriceRate(region: region, district: district)
        return rate > 0 ? rate : 80.0
    }
}

