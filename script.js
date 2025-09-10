// 한국 경매 입찰가격 시뮬레이션 서비스
class AuctionSimulator {
    constructor() {
        this.initializeEventListeners();
        this.chart = null;
    }

    // 숫자 포맷팅 함수 (천단위 콤마)
    formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    // 원 단위로 변환 (만원 → 원)
    convertToWon(amount) {
        return amount * 10000;
    }

    // 원 단위를 만원 단위로 변환 (원 → 만원)
    convertToManWon(amount) {
        return amount / 10000;
    }

    initializeEventListeners() {
        console.log('이벤트 리스너 등록 시작');
        
        // 폼 제출 이벤트
        const form = document.getElementById('auctionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                console.log('폼 제출 이벤트 발생');
                e.preventDefault();
                this.runSimulation();
            });
            console.log('폼 이벤트 리스너 등록 완료');
        } else {
            console.error('auctionForm 요소를 찾을 수 없습니다');
        }
        
        // 버튼 클릭 이벤트 (백업)
        const button = document.querySelector('.simulate-btn');
        if (button) {
            button.addEventListener('click', (e) => {
                console.log('버튼 클릭 이벤트 발생');
                e.preventDefault();
                this.runSimulation();
            });
            console.log('버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('simulate-btn 요소를 찾을 수 없습니다');
        }
    }

    // 경매 유형별 수수료율 정의
    getAuctionFees(auctionType) {
        const fees = {
            realEstate: {
                auctionFee: 0.02, // 2% 경매 수수료
                registrationFee: 0.001, // 0.1% 등기비용
                tax: 0.04, // 4% 취득세
                additionalCosts: 0.005 // 0.5% 기타 비용
            },
            vehicle: {
                auctionFee: 0.03, // 3% 경매 수수료
                registrationFee: 0.002, // 0.2% 등록비용
                tax: 0.03, // 3% 개별소비세
                additionalCosts: 0.003 // 0.3% 기타 비용
            },
            art: {
                auctionFee: 0.15, // 15% 경매 수수료
                registrationFee: 0.001, // 0.1% 등록비용
                tax: 0.10, // 10% 부가가치세
                additionalCosts: 0.005 // 0.5% 기타 비용
            },
            general: {
                auctionFee: 0.05, // 5% 경매 수수료
                registrationFee: 0.001, // 0.1% 등록비용
                tax: 0.10, // 10% 부가가치세
                additionalCosts: 0.003 // 0.3% 기타 비용
            }
        };
        return fees[auctionType] || fees.general;
    }

    // 시장 상황별 가중치 계산
    getMarketWeight(marketCondition) {
        const weights = {
            hot: 1.4,    // 활발한 시장: 40% 높은 경쟁
            normal: 1.0,  // 보통 시장
            cold: 0.6    // 침체된 시장: 40% 낮은 경쟁
        };
        return weights[marketCondition] || 1.0;
    }

    // 긴급도별 입찰 전략 가중치 (더 극명한 차이)
    getUrgencyWeight(urgency) {
        const weights = {
            high: 1.3,    // 높음: 30% 더 높은 입찰
            medium: 1.0,  // 보통
            low: 0.7      // 낮음: 30% 더 낮은 입찰
        };
        return weights[urgency] || 1.0;
    }

    // 유찰 횟수에 따른 가격 조정
    getFailedCountAdjustment(failedCount) {
        const adjustments = {
            0: 1.0,    // 첫 경매: 조정 없음
            1: 0.95,   // 1회 유찰: 5% 하향
            2: 0.90,   // 2회 유찰: 10% 하향
            3: 0.85,   // 3회 유찰: 15% 하향
            4: 0.80    // 4회 이상 유찰: 20% 하향
        };
        return adjustments[failedCount] || 1.0;
    }

    // 감정가 대비 적정 입찰가 비율 계산
    getAppraisalRatioWeight(appraisalPrice, marketPrice) {
        const appraisalRatio = appraisalPrice / marketPrice;
        
        if (appraisalRatio > 1.1) {
            return 0.9;  // 감정가가 시세보다 10% 이상 높으면 보수적 입찰
        } else if (appraisalRatio < 0.9) {
            return 1.1;  // 감정가가 시세보다 10% 이상 낮으면 적극적 입찰
        } else {
            return 1.0;  // 감정가가 시세와 비슷하면 보통 입찰
        }
    }

    // 시세 대비 수익성 분석
    calculateMarketProfitability(bidPrice, marketPrice, totalCost) {
        const marketProfit = marketPrice - totalCost;
        const marketProfitRatio = (marketProfit / totalCost) * 100;
        
        return {
            marketProfit: marketProfit,
            marketProfitRatio: marketProfitRatio,
            isProfitable: marketProfit > 0
        };
    }

    // 간단하고 현실적인 낙찰 확률 계산
    calculateWinProbability(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        // 1. 기본 확률 (가격 대비)
        const priceRatio = bidPrice / propertyValue;
        let baseProbability = this.calculateSimpleBaseProbability(priceRatio);
        
        // 2. 경쟁자 수 조정
        const competitorFactor = this.calculateSimpleCompetitorFactor(competitorCount);
        
        // 3. 시장 상황 조정
        const marketFactor = marketWeight;
        
        // 4. 긴급도 조정
        const urgencyFactor = urgencyWeight;
        
        // 5. 유찰 횟수 조정
        const failedFactor = this.calculateSimpleFailedFactor(failedCount);
        
        // 6. 최저입찰가 대비 조정
        const minimumBidFactor = this.calculateMinimumBidFactor(bidPrice, minimumBid);
        
        // 7. 감정가 대비 조정
        const appraisalFactor = this.calculateAppraisalFactor(bidPrice, appraisalPrice);
        
        // 8. 최종 확률 계산
        const finalProbability = baseProbability * competitorFactor * marketFactor * urgencyFactor * 
                                failedFactor * minimumBidFactor * appraisalFactor;
        
        return Math.max(0.01, Math.min(0.99, finalProbability));
    }

    // 간단한 기본 확률 계산
    calculateSimpleBaseProbability(priceRatio) {
        if (priceRatio < 0.7) return 0.1;      // 70% 미만: 10%
        if (priceRatio < 0.8) return 0.3;      // 70-80%: 30%
        if (priceRatio < 0.9) return 0.6;      // 80-90%: 60%
        if (priceRatio < 1.0) return 0.8;      // 90-100%: 80%
        if (priceRatio < 1.1) return 0.9;      // 100-110%: 90%
        if (priceRatio < 1.2) return 0.95;     // 110-120%: 95%
        return 0.98;                           // 120% 이상: 98%
    }

    // 간단한 경쟁자 수 조정
    calculateSimpleCompetitorFactor(competitorCount) {
        if (competitorCount <= 1) return 0.95;
        if (competitorCount === 2) return 0.7;
        if (competitorCount === 3) return 0.5;
        if (competitorCount === 4) return 0.35;
        if (competitorCount === 5) return 0.25;
        if (competitorCount <= 8) return 0.15;
        return 0.1; // 9명 이상
    }

    // 간단한 유찰 횟수 조정
    calculateSimpleFailedFactor(failedCount) {
        if (failedCount === 0) return 1.0;
        if (failedCount === 1) return 0.9;
        if (failedCount === 2) return 0.8;
        if (failedCount === 3) return 0.7;
        return 0.6; // 4회 이상
    }

    // 최저입찰가 대비 조정
    calculateMinimumBidFactor(bidPrice, minimumBid) {
        const ratio = bidPrice / minimumBid;
        if (ratio < 1.05) return 0.5;      // 최저가 근처: 50%
        if (ratio < 1.1) return 0.7;       // 최저가 110%: 70%
        if (ratio < 1.2) return 0.9;       // 최저가 120%: 90%
        if (ratio < 1.5) return 1.0;       // 최저가 150%: 100%
        return 1.1;                        // 그 이상: 110%
    }

    // 감정가 대비 조정
    calculateAppraisalFactor(bidPrice, appraisalPrice) {
        const ratio = bidPrice / appraisalPrice;
        if (ratio < 0.8) return 0.6;       // 감정가 80% 미만: 60%
        if (ratio < 0.9) return 0.8;       // 감정가 80-90%: 80%
        if (ratio < 1.1) return 1.0;       // 감정가 90-110%: 100%
        if (ratio < 1.3) return 1.1;       // 감정가 110-130%: 110%
        return 1.2;                        // 그 이상: 120%
    }

    // 간단한 특성 추출 (Monte Carlo 제거)
    extractFeatures(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        return {
            priceRatio: bidPrice / propertyValue,
            appraisalRatio: bidPrice / appraisalPrice,
            minimumBidRatio: bidPrice / minimumBid,
            marketRatio: bidPrice / marketPrice,
            competitorCount: competitorCount,
            marketWeight: marketWeight,
            urgencyWeight: urgencyWeight,
            failedCount: failedCount
        };
    }

    // 간단한 경쟁자 행동 예측 (Monte Carlo 제거)
    predictCompetitorBehavior(features) {
        // 간단한 경쟁자 행동 예측
        const baseProb = 0.5;
        const competitorFactor = features.competitorCount <= 3 ? 0.8 : 0.3;
        const marketFactor = features.marketWeight;
        
        return {
            average: baseProb * competitorFactor * marketFactor,
            weighted: baseProb * competitorFactor * marketFactor,
            variance: 0.1,
            confidence: 0.8
        };
    }

    // 간단한 시장 트렌드 분석 (Monte Carlo 제거)
    analyzeMarketTrend(features) {
        return {
            trend: 'stable',
            strength: 0.1,
            seasonality: 1.0,
            volatility: 0.15,
            momentum: 0.0
        };
    }

    // 간단한 지역 특성 (Monte Carlo 제거)
    calculateLocationFactor(features) {
        return {
            accessibility: 0.8,
            infrastructure: 0.7,
            populationDensity: 0.6,
            developmentPlan: 0.5,
            overall: 0.65
        };
    }

    // 간단한 시뮬레이션 (Monte Carlo 제거)
    runMonteCarloSimulation(features, competitorBehavior) {
        return {
            mean: 0.5,
            median: 0.5,
            stdDev: 0.1,
            percentiles: { p25: 0.4, p50: 0.5, p75: 0.6, p90: 0.7, p95: 0.8 },
            winRate: 0.5
        };
    }

    // 간단한 앙상블 모델 (Monte Carlo 제거)
    calculateEnsembleProbability(competitorBehavior, marketTrend, locationFactor, monteCarloResult) {
        return competitorBehavior.weighted;
    }

    // 간단한 불확실성 정량화 (Monte Carlo 제거)
    quantifyUncertainty(features, probability) {
        return {
            dataQuality: 0.9,
            modelUncertainty: 0.1,
            marketUncertainty: 0.1,
            total: 0.1,
            confidence: 0.9
        };
    }

    // 간단한 확률 조정 (Monte Carlo 제거)
    adjustProbabilityWithUncertainty(probability, uncertainty) {
        return probability;
    }

    // 간단한 헬퍼 함수들 (Monte Carlo 제거)
    calculateVariance(predictions) {
        return 0.1; // 고정값
    }

    calculateConfidence(predictions) {
        return 0.8; // 고정값
    }

    // 기본 확률 계산 (개선된 S자 곡선 모델)
    calculateBaseProbability(priceRatio) {
        // 최저입찰가 근처에서의 확률을 더 현실적으로 조정
        if (priceRatio < 0.7) {
            return 0.15; // 70% 미만: 15% (0.05 → 0.15)
        } else if (priceRatio < 0.8) {
            return 0.35; // 70-80%: 35%
        } else if (priceRatio < 0.9) {
            return 0.60; // 80-90%: 60%
        } else if (priceRatio < 1.0) {
            return 0.80; // 90-100%: 80%
        } else if (priceRatio < 1.1) {
            return 0.90; // 100-110%: 90%
        } else if (priceRatio < 1.2) {
            return 0.95; // 110-120%: 95%
        } else {
            return 0.98; // 120% 이상: 98%
        }
    }

    // 경쟁자 수에 따른 확률 조정 (개선된 모델)
    calculateCompetitorFactor(competitorCount) {
        if (competitorCount <= 1) {
            return 0.95; // 경쟁자 없거나 1명이면 95%
        }
        
        // 경쟁자 수에 따른 기본 확률 (더 현실적으로 조정)
        const baseProbabilities = {
            2: 0.70,  // 2명: 70%
            3: 0.50,  // 3명: 50%
            4: 0.35,  // 4명: 35%
            5: 0.25,  // 5명: 25%
            6: 0.18,  // 6명: 18%
            7: 0.13,  // 7명: 13%
            8: 0.10,  // 8명: 10%
            9: 0.08,  // 9명: 8%
            10: 0.06  // 10명: 6%
        };
        
        // 10명 이상인 경우 지수적 감소
        if (competitorCount > 10) {
            return Math.max(0.01, 0.06 * Math.pow(0.8, competitorCount - 10));
        }
        
        return baseProbabilities[competitorCount] || 0.05;
    }

    // 시장 상황별 가중치 (더 정교한 모델)
    calculateMarketFactor(marketWeight, competitorCount) {
        // 시장 상황에 따른 기본 가중치
        let baseFactor = marketWeight;
        
        // 경쟁자 수와 시장 상황의 상호작용
        if (competitorCount >= 5) {
            // 경쟁자가 많을 때는 시장 상황이 더 중요
            baseFactor = Math.pow(marketWeight, 1.5);
        } else if (competitorCount <= 2) {
            // 경쟁자가 적을 때는 시장 상황 영향 감소
            baseFactor = Math.pow(marketWeight, 0.7);
        }
        
        return Math.max(0.1, Math.min(2.0, baseFactor));
    }

    // 입찰자 행동 패턴 모델링 (개선된 모델)
    calculateBehaviorFactor(bidPrice, appraisalPrice, minimumBid, failedCount) {
        const appraisalRatio = bidPrice / appraisalPrice;
        const minimumBidRatio = bidPrice / minimumBid;
        
        let behaviorFactor = 1.0;
        
        // 1. 감정가 대비 입찰가 패턴
        if (appraisalRatio < 0.7) {
            behaviorFactor *= 0.3; // 매우 보수적 (0.2 → 0.3)
        } else if (appraisalRatio < 0.85) {
            behaviorFactor *= 0.6; // 보수적 (0.5 → 0.6)
        } else if (appraisalRatio < 1.15) {
            behaviorFactor *= 1.0; // 정상
        } else if (appraisalRatio < 1.4) {
            behaviorFactor *= 1.3; // 적극적
        } else {
            behaviorFactor *= 1.6; // 매우 적극적
        }
        
        // 2. 최저입찰가 대비 패턴 (개선)
        if (minimumBidRatio < 1.01) {
            behaviorFactor *= 0.8; // 최저가와 거의 동일 (0.3 → 0.8)
        } else if (minimumBidRatio < 1.05) {
            behaviorFactor *= 0.9; // 최저가 근처 (0.3 → 0.9)
        } else if (minimumBidRatio < 1.2) {
            behaviorFactor *= 1.0; // 최저가 조금 초과 (0.7 → 1.0)
        } else if (minimumBidRatio < 1.5) {
            behaviorFactor *= 1.1; // 적정 범위 (1.0 → 1.1)
        } else {
            behaviorFactor *= 1.2; // 높은 가격
        }
        
        // 3. 유찰 횟수에 따른 행동 변화 (완화)
        const failedAdjustment = Math.pow(0.95, failedCount); // 유찰할수록 보수적 (0.9 → 0.95)
        behaviorFactor *= failedAdjustment;
        
        return Math.max(0.2, Math.min(2.0, behaviorFactor)); // 최소값 0.1 → 0.2
    }

    // 긴급도에 따른 전략적 조정
    calculateUrgencyFactor(urgencyWeight, competitorCount) {
        let urgencyFactor = urgencyWeight;
        
        // 경쟁자 수에 따른 긴급도 효과 조정
        if (competitorCount >= 5) {
            // 경쟁자가 많을 때는 긴급도 효과 증대
            urgencyFactor = Math.pow(urgencyWeight, 1.3);
        } else if (competitorCount <= 2) {
            // 경쟁자가 적을 때는 긴급도 효과 감소
            urgencyFactor = Math.pow(urgencyWeight, 0.8);
        }
        
        return Math.max(0.5, Math.min(1.5, urgencyFactor));
    }

    // 총 비용 계산 (수수료, 세금 포함)
    calculateTotalCost(bidPrice, auctionType, renovationCost = 0) {
        const fees = this.getAuctionFees(auctionType);
        
        const auctionFee = bidPrice * fees.auctionFee;
        const registrationFee = bidPrice * fees.registrationFee;
        const tax = bidPrice * fees.tax;
        const additionalCosts = bidPrice * fees.additionalCosts;
        
        return {
            bidPrice: bidPrice,
            auctionFee: auctionFee,
            registrationFee: registrationFee,
            tax: tax,
            additionalCosts: additionalCosts,
            renovationCost: renovationCost,
            totalCost: bidPrice + auctionFee + registrationFee + tax + additionalCosts + renovationCost
        };
    }

    // 예상 수익률 계산 (기본)
    calculateExpectedProfit(propertyValue, totalCost) {
        return ((propertyValue - totalCost) / totalCost) * 100;
    }

    // 리스크 조정 수익률 계산 (샤프 비율 기반)
    calculateRiskAdjustedProfit(propertyValue, totalCost, winProbability, marketCondition, failedCount) {
        const basicProfit = this.calculateExpectedProfit(propertyValue, totalCost);
        
        // 1. 낙찰 확률에 따른 기대 수익률
        const expectedProfit = basicProfit * winProbability;
        
        // 2. 리스크 프리미엄 계산
        const riskPremium = this.calculateRiskPremium(marketCondition, failedCount, winProbability);
        
        // 3. 변동성 조정 (불확실성 반영)
        const volatilityAdjustment = this.calculateVolatilityAdjustment(winProbability, marketCondition);
        
        // 4. 최종 리스크 조정 수익률
        const riskAdjustedProfit = expectedProfit + riskPremium - volatilityAdjustment;
        
        return Math.max(-50, Math.min(200, riskAdjustedProfit)); // -50% ~ 200% 범위 제한
    }

    // 리스크 프리미엄 계산
    calculateRiskPremium(marketCondition, failedCount, winProbability) {
        let riskPremium = 0;
        
        // 1. 시장 상황별 리스크 프리미엄
        const marketRisk = {
            'hot': 5,    // 활발한 시장: 5% 프리미엄
            'normal': 0, // 보통 시장: 프리미엄 없음
            'cold': -3   // 침체 시장: -3% 할인
        };
        riskPremium += marketRisk[marketCondition] || 0;
        
        // 2. 유찰 횟수별 리스크 프리미엄
        const failedRisk = failedCount * -2; // 유찰 1회당 -2%
        riskPremium += failedRisk;
        
        // 3. 낙찰 확률별 리스크 프리미엄
        if (winProbability < 0.3) {
            riskPremium += 10; // 낮은 확률: 10% 프리미엄
        } else if (winProbability < 0.6) {
            riskPremium += 5;  // 보통 확률: 5% 프리미엄
        } else {
            riskPremium += 0;  // 높은 확률: 프리미엄 없음
        }
        
        return riskPremium;
    }

    // 변동성 조정 계산
    calculateVolatilityAdjustment(winProbability, marketCondition) {
        // 불확실성이 높을수록 변동성 조정 증가
        const uncertainty = 1 - winProbability;
        const baseVolatility = uncertainty * 15; // 최대 15% 조정
        
        // 시장 상황별 변동성 조정
        const marketVolatility = {
            'hot': 1.5,   // 활발한 시장: 변동성 증가
            'normal': 1.0, // 보통 시장: 기본 변동성
            'cold': 0.7   // 침체 시장: 변동성 감소
        };
        
        return baseVolatility * (marketVolatility[marketCondition] || 1.0);
    }

    // 최적 입찰가격 계산
    calculateOptimalBid(propertyValue, auctionType, competitorCount, marketCondition, urgency, marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost) {
        console.log('calculateOptimalBid 시작:', {
            propertyValue, auctionType, competitorCount, marketCondition, urgency, 
            marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
        });
        
        const marketWeight = this.getMarketWeight(marketCondition);
        const urgencyWeight = this.getUrgencyWeight(urgency);
        const appraisalWeight = this.getAppraisalRatioWeight(appraisalPrice, marketPrice);
        
        console.log('가중치 계산:', { marketWeight, urgencyWeight, appraisalWeight });
        
        // 다양한 입찰가격에 대해 시뮬레이션
        const bidPrices = [];
        const probabilities = [];
        const profits = [];
        
        // 현실적인 입찰가격 범위 설정
        const baseMinBid = Math.max(minimumBid * 1.1, propertyValue * 0.7);
        
        // 최대 입찰가격을 시세의 100%로 제한 (수익성 보장)
        const realisticMaxBid = Math.min(
            marketPrice * 0.95,  // 시세의 95% (수익성 보장)
            appraisalPrice * 1.1,  // 감정가의 110%
            propertyValue * 0.9   // 목표가의 90%
        );
        
        console.log('입찰가격 범위:', { baseMinBid, realisticMaxBid, minimumBid, marketPrice, appraisalPrice, propertyValue });
        
        // 1. 긴급도 조정 (제한된 범위)
        const urgencyMultiplier = Math.min(1.2, Math.max(0.8, urgencyWeight)); // 0.8 ~ 1.2 범위로 제한
        
        // 2. 시장 상황 조정 (제한된 범위)
        const marketMultiplier = Math.min(1.2, Math.max(0.8, marketWeight)); // 0.8 ~ 1.2 범위로 제한
        
        // 3. 경쟁자 수 조정 (제한된 범위)
        const competitorMultiplier = Math.min(1.2, Math.max(0.9, 1.0 + (competitorCount - 1) * 0.05)); // 0.9 ~ 1.2 범위
        
        // 4. 유찰 횟수 조정 (제한된 범위)
        const failedMultiplier = Math.max(0.8, Math.min(1.1, 1.0 - failedCount * 0.05)); // 0.8 ~ 1.1 범위
        
        // 5. 종합 조정 (더 보수적으로)
        const totalMultiplier = Math.min(1.3, Math.max(0.7, 
            urgencyMultiplier * marketMultiplier * competitorMultiplier * failedMultiplier
        ));
        
        console.log('조정 계수들:', { urgencyMultiplier, marketMultiplier, competitorMultiplier, failedMultiplier, totalMultiplier });
        
        // 긴급도에 따른 입찰가격 범위 조정
        let urgencyBidAdjustment = 1.0;
        if (urgency === 'high') {
            urgencyBidAdjustment = 1.15; // 긴급시 15% 상향 조정
        } else if (urgency === 'medium') {
            urgencyBidAdjustment = 1.0; // 보통시 기본값
        } else if (urgency === 'low') {
            urgencyBidAdjustment = 0.9; // 낮을시 10% 하향 조정
        }
        
        // 입찰가격 범위를 긴급도에 따라 조정
        const minBid = Math.max(baseMinBid * 0.8, minimumBid * 1.05) * urgencyBidAdjustment;
        const maxBid = Math.min(realisticMaxBid, baseMinBid * 1.3) * urgencyBidAdjustment;
        
        console.log('긴급도 조정:', { urgency, urgencyBidAdjustment, minBid, maxBid });
        
        const step = (maxBid - minBid) / 20;
        
        console.log('최종 입찰가격 범위:', { minBid, maxBid, step, totalMultiplier });
        
        // 입찰가격 범위 검증
        if (minBid >= maxBid || step <= 0) {
            console.error('입찰가격 범위 오류:', { minBid, maxBid, step });
            return {
                recommendedBid: minimumBid,
                winProbability: 0.5,
                expectedProfit: 0,
                bidPrices: [minimumBid],
                probabilities: [0.5],
                profits: [0]
            };
        }
        
        for (let bidPrice = minBid; bidPrice <= maxBid; bidPrice += step) {
            const winProbability = this.calculateWinProbability(
                bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, 
                failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost
            );
            const costInfo = this.calculateTotalCost(bidPrice, auctionType, renovationCost);
            const expectedProfit = this.calculateExpectedProfit(propertyValue, costInfo.totalCost);
            const riskAdjustedProfit = this.calculateRiskAdjustedProfit(
                propertyValue, costInfo.totalCost, winProbability, marketCondition, failedCount
            );
            
            bidPrices.push(Math.round(bidPrice));
            probabilities.push(winProbability);
            profits.push(riskAdjustedProfit); // 리스크 조정 수익률 사용
        }
        
        // 현실적인 기대값 계산 (수익성 우선)
        let bestBidIndex = 0;
        let bestExpectedValue = -Infinity;
        
        for (let i = 0; i < bidPrices.length; i++) {
            const winProb = probabilities[i];
            const profit = profits[i];
            const bidPrice = bidPrices[i];
            
            // 1. 수익성 체크: 시세 대비 수익이 마이너스면 제외
            const marketPriceManWon = marketPrice / 10000;
            const totalCostManWon = (bidPrice + this.calculateTotalCost(bidPrice, auctionType, renovationCost).totalCost) / 10000;
            const marketProfit = marketPriceManWon - totalCostManWon;
            
            // 시세 대비 수익이 마이너스면 기대값을 매우 낮게 설정
            if (marketProfit < 0) {
                const expectedValue = -1000; // 매우 낮은 기대값
                if (expectedValue > bestExpectedValue) {
                    bestExpectedValue = expectedValue;
                    bestBidIndex = i;
                }
                continue;
            }
            
            // 2. 기본 기대값: 성공시 수익률 × 성공확률
            const basicExpectedValue = winProb * profit;
            
            // 3. 수익성 보너스 (수익이 높을수록 보너스)
            const profitBonus = Math.max(0, marketProfit / 1000) * 5; // 수익 1000만원당 5점 보너스
            
            // 4. 최저입찰가 근처 페널티
            const minimumBidRatio = bidPrice / minimumBid;
            let minimumBidPenalty = 0;
            if (minimumBidRatio < 1.15) {
                minimumBidPenalty = 10;
            }
            
            // 5. 감정가 근처 보너스
            const appraisalRatio = bidPrice / appraisalPrice;
            let appraisalBonus = 0;
            if (appraisalRatio >= 0.95 && appraisalRatio <= 1.05) {
                appraisalBonus = 15;
            }
            
            // 6. 실패시 페널티
            const failurePenalty = (1 - winProb) * 5;
            
            // 7. 긴급도 보너스 (긴급할수록 높은 입찰가 선호)
            let urgencyBonus = 0;
            if (urgency === 'high') {
                urgencyBonus = bidPrice / 1000 * 0.1; // 긴급시 입찰가 1000만원당 0.1점 보너스
            } else if (urgency === 'low') {
                urgencyBonus = -bidPrice / 1000 * 0.05; // 낮을시 입찰가 1000만원당 0.05점 페널티
            }
            
            // 8. 최종 기대값
            const expectedValue = basicExpectedValue + profitBonus - minimumBidPenalty + appraisalBonus - failurePenalty + urgencyBonus;
            
            if (expectedValue > bestExpectedValue) {
                bestExpectedValue = expectedValue;
                bestBidIndex = i;
            }
        }
        
        return {
            recommendedBid: bidPrices[bestBidIndex],
            winProbability: probabilities[bestBidIndex],
            expectedProfit: profits[bestBidIndex],
            bidPrices: bidPrices,
            probabilities: probabilities,
            profits: profits
        };
    }

    // 입찰 전략 조언 생성
    generateStrategyAdvice(winProbability, expectedProfit, competitorCount, marketCondition, 
                          appraisalRatio, marketRatio, minimumRatio, failedCount, marketProfitability) {
        let advice = "";
        
        if (winProbability >= 0.8) {
            advice += `<p class="high-probability">🎯 <strong>높은 낙찰 확률</strong> - 현재 전략이 효과적입니다.</p>`;
        } else if (winProbability >= 0.5) {
            advice += `<p class="medium-probability">⚖️ <strong>보통 낙찰 확률</strong> - 입찰가를 조정해보세요.</p>`;
        } else {
            advice += `<p class="low-probability">⚠️ <strong>낮은 낙찰 확률</strong> - 입찰가를 대폭 상향 조정이 필요합니다.</p>`;
        }
        
        advice += `<ul>`;
        
        // 경쟁자 수 관련 조언
        if (competitorCount >= 10) {
            advice += `<li>경쟁자가 많으므로 입찰가를 10-15% 상향 조정을 고려하세요.</li>`;
        } else if (competitorCount <= 3) {
            advice += `<li>경쟁자가 적으므로 보수적인 입찰가로도 충분할 수 있습니다.</li>`;
        }
        
        // 시장 상황 관련 조언
        if (marketCondition === 'hot') {
            advice += `<li>활발한 시장이므로 입찰가를 5-10% 상향 조정하세요.</li>`;
        } else if (marketCondition === 'cold') {
            advice += `<li>침체된 시장이므로 보수적인 입찰가로도 기회가 있을 수 있습니다.</li>`;
        }
        
        // 유찰 횟수 관련 조언
        if (failedCount >= 3) {
            advice += `<li>⚠️ 3회 이상 유찰된 물건입니다. 입찰가를 15-20% 대폭 하향 조정하세요.</li>`;
        } else if (failedCount >= 1) {
            advice += `<li>유찰 이력이 있으므로 입찰가를 5-10% 하향 조정을 고려하세요.</li>`;
        }
        
        // 감정가 대비 입찰가 조언
        if (appraisalRatio < 80) {
            advice += `<li>감정가의 80% 미만으로 입찰하고 있습니다. 낙찰 확률이 매우 낮습니다.</li>`;
        } else if (appraisalRatio > 130) {
            advice += `<li>감정가의 130% 이상으로 입찰하고 있습니다. 과도한 입찰가일 수 있습니다.</li>`;
        } else {
            advice += `<li>감정가 대비 적정 범위의 입찰가입니다.</li>`;
        }
        
        // 시세 대비 수익성 조언
        if (marketProfitability.isProfitable) {
            advice += `<li>✅ 시세 대비 수익성이 양호합니다 (${Math.round(marketProfitability.marketProfitRatio)}%).</li>`;
        } else {
            advice += `<li>⚠️ 시세 대비 수익성이 마이너스입니다. 입찰을 재검토하세요.</li>`;
        }
        
        // 최저입찰가 대비 조언
        if (minimumRatio < 110) {
            advice += `<li>최저입찰가에 가까운 가격입니다. 낙찰 확률이 낮을 수 있습니다.</li>`;
        } else if (minimumRatio > 200) {
            advice += `<li>최저입찰가의 2배 이상으로 입찰하고 있습니다. 과도할 수 있습니다.</li>`;
        }
        
        // 수익률 관련 조언
        if (expectedProfit < 0) {
            advice += `<li>⚠️ 예상 수익률이 마이너스입니다. 입찰을 재검토하세요.</li>`;
        } else if (expectedProfit < 10) {
            advice += `<li>낮은 수익률이 예상됩니다. 비용 절감 방안을 고려하세요.</li>`;
        } else {
            advice += `<li>✅ 양호한 수익률이 예상됩니다.</li>`;
        }
        
        advice += `<li>입찰 전 최종 10분에 입찰하는 것이 유리할 수 있습니다.</li>`;
        advice += `<li>경쟁자의 입찰 패턴을 관찰하고 적절한 타이밍에 입찰하세요.</li>`;
        advice += `</ul>`;
        
        return advice;
    }

    // 차트 생성
    createChart(bidPrices, probabilities) {
        const ctx = document.getElementById('probabilityChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: bidPrices.map(price => this.formatNumber(price) + '원'),
                datasets: [{
                    label: '낙찰 확률 (%)',
                    data: probabilities.map(p => Math.round(p * 100)),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '입찰가격별 낙찰 확률',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '낙찰 확률 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '입찰가격'
                        }
                    }
                }
            }
        });
    }

    // 시뮬레이션 실행
    runSimulation() {
        console.log('시뮬레이션 시작');
        
        // 입력값 가져오기 (원 단위로 입력받음)
        const propertyValue = parseInt(document.getElementById('propertyValue').value);
        const auctionType = document.getElementById('auctionType').value;
        const competitorCount = parseInt(document.getElementById('competitorCount').value);
        const marketCondition = document.getElementById('marketCondition').value;
        const urgency = document.getElementById('urgency').value;
        const marketPrice = parseInt(document.getElementById('marketPrice').value);
        const appraisalPrice = parseInt(document.getElementById('appraisalPrice').value);
        const minimumBid = parseInt(document.getElementById('minimumBid').value);
        const failedCount = parseInt(document.getElementById('failedCount').value);
        const renovationCost = parseInt(document.getElementById('renovationCost').value);

        console.log('입력값 확인:', {
            propertyValue, auctionType, competitorCount, marketCondition, 
            urgency, marketPrice, appraisalPrice, minimumBid, failedCount, renovationCost
        });

        // 내부 계산을 위해 만원 단위로 변환
        const propertyValueManWon = this.convertToManWon(propertyValue);
        const marketPriceManWon = this.convertToManWon(marketPrice);
        const appraisalPriceManWon = this.convertToManWon(appraisalPrice);
        const minimumBidManWon = this.convertToManWon(minimumBid);
        
        console.log('만원 단위 변환:', {
            propertyValueManWon, marketPriceManWon, appraisalPriceManWon, minimumBidManWon
        });

        try {
            console.log('최적 입찰가격 계산 시작');
            console.log('입력값 검증:', {
                propertyValueManWon, auctionType, competitorCount, marketCondition, urgency,
                marketPriceManWon, appraisalPriceManWon, minimumBidManWon, failedCount, renovationCost
            });
            
            // 최적 입찰가격 계산 (만원 단위로 계산)
            const renovationCostManWon = this.convertToManWon(renovationCost);
            console.log('renovationCostManWon:', renovationCostManWon);
            
            const result = this.calculateOptimalBid(
                propertyValueManWon, auctionType, competitorCount, marketCondition, urgency,
                marketPriceManWon, appraisalPriceManWon, minimumBidManWon, failedCount, renovationCostManWon
            );
            console.log('최적 입찰가격 계산 완료:', result);
            
            console.log('총 비용 계산 시작');
            // 총 비용 계산 (만원 단위로 계산)
            const costInfo = this.calculateTotalCost(result.recommendedBid, auctionType, renovationCostManWon);
            console.log('총 비용 계산 완료:', costInfo);
            
            console.log('시세 대비 수익성 분석 시작');
            // 시세 대비 수익성 분석 (만원 단위로 계산)
            const marketProfitability = this.calculateMarketProfitability(result.recommendedBid, marketPriceManWon, costInfo.totalCost);
            console.log('시세 대비 수익성 분석 완료:', marketProfitability);
            
            console.log('결과 표시 시작');
            // 결과 표시 (원 단위로 표시)
            this.displayResults(result, costInfo, propertyValue, competitorCount, marketCondition, urgency,
                              marketPrice, appraisalPrice, minimumBid, marketProfitability, failedCount, renovationCost);
            console.log('결과 표시 완료');
            
            console.log('차트 생성 시작');
            // 차트 생성 (원 단위로 변환)
            const bidPricesInWon = result.bidPrices.map(price => this.convertToWon(price));
            this.createChart(bidPricesInWon, result.probabilities);
            console.log('차트 생성 완료');
            
            console.log('결과 섹션 활성화 시작');
            // 결과 섹션 활성화
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.classList.add('active');
                console.log('결과 섹션 활성화 완료');
            } else {
                console.error('resultsSection 요소를 찾을 수 없습니다');
            }
            
        } catch (error) {
            console.error('시뮬레이션 실행 중 오류 발생:', error);
            alert('시뮬레이션 실행 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 결과 표시
    displayResults(result, costInfo, propertyValue, competitorCount, marketCondition, urgency,
                  marketPrice, appraisalPrice, minimumBid, marketProfitability, failedCount, renovationCost) {
        // 초기 메시지 숨기기
        const initialMessage = document.getElementById('initialMessage');
        if (initialMessage) {
            initialMessage.style.display = 'none';
        }
        
        // 결과 섹션들 보이기
        const resultSections = [
            'result-cards', 'detailed-results', 'price-analysis', 
            'chart-container', 'strategy-section'
        ];
        resultSections.forEach(sectionId => {
            const section = document.querySelector(`.${sectionId}`);
            if (section) {
                section.style.display = 'block';
            }
        });
        
        // 주요 결과 (원 단위로 변환하여 표시)
        const recommendedBidInWon = this.convertToWon(result.recommendedBid);
        document.getElementById('recommendedPrice').textContent = this.formatNumber(recommendedBidInWon);
        document.getElementById('winProbability').textContent = Math.round(result.winProbability * 100) + '%';
        document.getElementById('expectedProfit').textContent = Math.round(result.expectedProfit) + '%';
        
        // 상세 비용 (원 단위로 변환하여 표시)
        const totalCostInWon = this.convertToWon(costInfo.totalCost);
        
        // 리스크 조정 수익률 계산 및 표시
        const riskAdjustedProfit = this.calculateRiskAdjustedProfit(
            propertyValue, totalCostInWon / 10000, result.winProbability, marketCondition, failedCount
        );
        document.getElementById('riskAdjustedProfit').textContent = Math.round(riskAdjustedProfit) + '%';
        
        // 모델 신뢰도 계산 및 표시
        const marketWeight = this.getMarketWeight(marketCondition);
        const urgencyWeight = this.getUrgencyWeight(urgency);
        const features = this.extractFeatures(
            result.recommendedBid, propertyValue, competitorCount, marketWeight, urgencyWeight, 
            failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost
        );
        const uncertainty = this.quantifyUncertainty(features, result.winProbability);
        const confidence = Math.round(uncertainty.confidence * 100);
        document.getElementById('modelConfidence').textContent = confidence + '%';
        const auctionFeeInWon = this.convertToWon(costInfo.auctionFee);
        const registrationFeeInWon = this.convertToWon(costInfo.registrationFee);
        const taxInWon = this.convertToWon(costInfo.tax);
        
        document.getElementById('totalCost').textContent = this.formatNumber(Math.round(totalCostInWon)) + '원';
        document.getElementById('auctionFee').textContent = this.formatNumber(Math.round(auctionFeeInWon)) + '원';
        document.getElementById('registrationFee').textContent = this.formatNumber(Math.round(registrationFeeInWon)) + '원';
        document.getElementById('tax').textContent = this.formatNumber(Math.round(taxInWon)) + '원';
        document.getElementById('renovationCostDisplay').textContent = this.formatNumber(renovationCost) + '원';
        
        // 총 투자 비용 계산 (입찰가 + 수수료 + 리모델링 비용)
        const totalInvestment = totalCostInWon + renovationCost;
        document.getElementById('totalInvestment').textContent = this.formatNumber(Math.round(totalInvestment)) + '원';
        
        // 가격 분석 (원 단위 기준으로 계산)
        const appraisalRatio = ((recommendedBidInWon / appraisalPrice) * 100).toFixed(1);
        const marketRatio = ((recommendedBidInWon / marketPrice) * 100).toFixed(1);
        const minimumRatio = ((recommendedBidInWon / minimumBid) * 100).toFixed(1);
        
        document.getElementById('appraisalRatio').textContent = appraisalRatio + '%';
        document.getElementById('marketRatio').textContent = marketRatio + '%';
        document.getElementById('minimumRatio').textContent = minimumRatio + '%';
        document.getElementById('marketProfit').textContent = this.formatNumber(Math.round(marketProfitability.marketProfit * 10000)) + '원';
        
        // 전략 조언
        const strategyAdvice = this.generateStrategyAdvice(
            result.winProbability, result.expectedProfit, competitorCount, marketCondition,
            appraisalRatio, marketRatio, minimumRatio, failedCount, marketProfitability
        );
        document.getElementById('strategyAdvice').innerHTML = strategyAdvice;
    }
}

// 페이지 로드 시 시뮬레이터 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 시뮬레이터 초기화 시작');
    try {
        new AuctionSimulator();
        console.log('시뮬레이터 초기화 완료');
    } catch (error) {
        console.error('시뮬레이터 초기화 오류:', error);
    }
});
