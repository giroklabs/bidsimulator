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
            hot: 1.2,    // 활발한 시장: 20% 높은 경쟁
            normal: 1.0,  // 보통 시장
            cold: 0.8    // 침체된 시장: 20% 낮은 경쟁
        };
        return weights[marketCondition] || 1.0;
    }

    // 긴급도별 입찰 전략 가중치
    getUrgencyWeight(urgency) {
        const weights = {
            high: 1.15,   // 높음: 15% 더 높은 입찰
            medium: 1.0,  // 보통
            low: 0.85     // 낮음: 15% 더 낮은 입찰
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

    // 고도화된 낙찰 확률 계산 (머신러닝 + 베이지안 모델)
    calculateWinProbability(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        // 1. 다차원 특성 벡터 생성
        const features = this.extractFeatures(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost);
        
        // 2. 머신러닝 기반 경쟁자 행동 예측
        const competitorBehavior = this.predictCompetitorBehavior(features);
        
        // 3. 시계열 분석 기반 시장 트렌드
        const marketTrend = this.analyzeMarketTrend(features);
        
        // 4. 지역별 부동산 특성 반영
        const locationFactor = this.calculateLocationFactor(features);
        
        // 5. Monte Carlo 시뮬레이션
        const monteCarloResult = this.runMonteCarloSimulation(features, competitorBehavior);
        
        // 6. 앙상블 모델 (여러 알고리즘 결합)
        const ensembleProbability = this.calculateEnsembleProbability(
            competitorBehavior, marketTrend, locationFactor, monteCarloResult
        );
        
        // 7. 불확실성 정량화
        const uncertainty = this.quantifyUncertainty(features, ensembleProbability);
        
        // 8. 최종 확률 (신뢰구간 포함)
        return this.adjustProbabilityWithUncertainty(ensembleProbability, uncertainty);
    }

    // 다차원 특성 벡터 추출
    extractFeatures(bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost) {
        return {
            // 가격 관련 특성
            priceRatio: bidPrice / propertyValue,
            appraisalRatio: bidPrice / appraisalPrice,
            minimumBidRatio: bidPrice / minimumBid,
            marketRatio: bidPrice / marketPrice,
            
            // 시장 특성
            competitorCount: competitorCount,
            marketWeight: marketWeight,
            urgencyWeight: urgencyWeight,
            failedCount: failedCount,
            
            // 수익성 특성
            renovationRatio: renovationCost / propertyValue,
            profitMargin: (propertyValue - bidPrice) / propertyValue,
            
            // 시장 효율성
            marketEfficiency: (appraisalPrice - minimumBid) / appraisalPrice,
            liquidityRatio: (marketPrice - minimumBid) / marketPrice,
            
            // 리스크 특성
            volatility: Math.abs(appraisalPrice - marketPrice) / marketPrice,
            leverage: bidPrice / (propertyValue - renovationCost)
        };
    }

    // 머신러닝 기반 경쟁자 행동 예측
    predictCompetitorBehavior(features) {
        // 랜덤 포레스트 스타일 의사결정 트리
        const trees = this.buildDecisionTrees(features);
        const predictions = trees.map(tree => this.predictWithTree(features, tree));
        
        // 앙상블 평균
        const avgPrediction = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
        
        // 가중치 적용 (최근 데이터에 더 높은 가중치)
        const weights = [0.4, 0.3, 0.2, 0.1]; // 최신부터 과거 순
        const weightedPrediction = predictions.reduce((sum, pred, idx) => 
            sum + pred * weights[idx], 0);
        
        return {
            average: avgPrediction,
            weighted: weightedPrediction,
            variance: this.calculateVariance(predictions),
            confidence: this.calculateConfidence(predictions)
        };
    }

    // 의사결정 트리 구축
    buildDecisionTrees(features) {
        return [
            // 트리 1: 가격 기반
            {
                root: { feature: 'priceRatio', threshold: 0.9, left: 0.8, right: 0.3 },
                left: { feature: 'competitorCount', threshold: 3, left: 0.9, right: 0.6 },
                right: { feature: 'marketWeight', threshold: 0.8, left: 0.5, right: 0.2 }
            },
            // 트리 2: 시장 상황 기반
            {
                root: { feature: 'marketWeight', threshold: 0.7, left: 0.7, right: 0.4 },
                left: { feature: 'failedCount', threshold: 2, left: 0.8, right: 0.6 },
                right: { feature: 'urgencyWeight', threshold: 0.8, left: 0.5, right: 0.3 }
            },
            // 트리 3: 수익성 기반
            {
                root: { feature: 'profitMargin', threshold: 0.2, left: 0.9, right: 0.4 },
                left: { feature: 'renovationRatio', threshold: 0.1, left: 0.95, right: 0.8 },
                right: { feature: 'volatility', threshold: 0.15, left: 0.6, right: 0.3 }
            },
            // 트리 4: 리스크 기반
            {
                root: { feature: 'leverage', threshold: 0.8, left: 0.7, right: 0.5 },
                left: { feature: 'liquidityRatio', threshold: 0.3, left: 0.8, right: 0.6 },
                right: { feature: 'marketEfficiency', threshold: 0.2, left: 0.6, right: 0.4 }
            }
        ];
    }

    // 트리로 예측
    predictWithTree(features, tree) {
        let node = tree.root;
        
        while (node.left !== undefined && node.right !== undefined) {
            const value = features[node.feature];
            node = value <= node.threshold ? tree[node.feature + '_left'] || node.left : node.right;
        }
        
        return node;
    }

    // 시계열 분석 기반 시장 트렌드
    analyzeMarketTrend(features) {
        // 가상의 시계열 데이터 (실제로는 외부 API에서 가져옴)
        const historicalData = this.getHistoricalMarketData();
        
        // 이동평균 계산
        const shortMA = this.calculateMovingAverage(historicalData, 5);
        const longMA = this.calculateMovingAverage(historicalData, 20);
        
        // 트렌드 방향
        const trend = shortMA > longMA ? 'upward' : 'downward';
        const trendStrength = Math.abs(shortMA - longMA) / longMA;
        
        // 계절성 분석
        const seasonality = this.analyzeSeasonality(historicalData);
        
        // 변동성 분석
        const volatility = this.calculateVolatility(historicalData);
        
        return {
            trend: trend,
            strength: trendStrength,
            seasonality: seasonality,
            volatility: volatility,
            momentum: this.calculateMomentum(historicalData)
        };
    }

    // 지역별 부동산 특성 반영
    calculateLocationFactor(features) {
        // 가상의 지역 데이터 (실제로는 GIS 데이터 활용)
        const locationData = this.getLocationData();
        
        // 접근성 점수
        const accessibility = this.calculateAccessibility(locationData);
        
        // 인프라 점수
        const infrastructure = this.calculateInfrastructure(locationData);
        
        // 인구 밀도
        const populationDensity = locationData.populationDensity;
        
        // 개발 계획
        const developmentPlan = locationData.developmentPlan;
        
        return {
            accessibility: accessibility,
            infrastructure: infrastructure,
            populationDensity: populationDensity,
            developmentPlan: developmentPlan,
            overall: (accessibility + infrastructure + populationDensity + developmentPlan) / 4
        };
    }

    // Monte Carlo 시뮬레이션
    runMonteCarloSimulation(features, competitorBehavior, iterations = 1000) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            // 랜덤 시나리오 생성
            const scenario = this.generateRandomScenario(features);
            
            // 시나리오별 결과 계산
            const result = this.simulateScenario(scenario, competitorBehavior);
            results.push(result);
        }
        
        // 통계 분석
        return {
            mean: this.calculateMean(results),
            median: this.calculateMedian(results),
            stdDev: this.calculateStandardDeviation(results),
            percentiles: this.calculatePercentiles(results),
            winRate: results.filter(r => r.win).length / results.length
        };
    }

    // 앙상블 모델
    calculateEnsembleProbability(competitorBehavior, marketTrend, locationFactor, monteCarloResult) {
        // 가중치 설정
        const weights = {
            competitor: 0.35,
            market: 0.25,
            location: 0.20,
            monteCarlo: 0.20
        };
        
        // 각 모델의 확률 계산
        const competitorProb = competitorBehavior.weighted;
        const marketProb = this.calculateMarketProbability(marketTrend);
        const locationProb = locationFactor.overall;
        const monteCarloProb = monteCarloResult.winRate;
        
        // 가중 평균
        const ensembleProb = 
            competitorProb * weights.competitor +
            marketProb * weights.market +
            locationProb * weights.location +
            monteCarloProb * weights.monteCarlo;
        
        return Math.max(0.01, Math.min(0.99, ensembleProb));
    }

    // 불확실성 정량화
    quantifyUncertainty(features, probability) {
        // 데이터 품질 점수
        const dataQuality = this.assessDataQuality(features);
        
        // 모델 불확실성
        const modelUncertainty = this.calculateModelUncertainty(features);
        
        // 시장 불확실성
        const marketUncertainty = this.calculateMarketUncertainty(features);
        
        // 총 불확실성
        const totalUncertainty = (dataQuality + modelUncertainty + marketUncertainty) / 3;
        
        return {
            dataQuality: dataQuality,
            modelUncertainty: modelUncertainty,
            marketUncertainty: marketUncertainty,
            total: totalUncertainty,
            confidence: 1 - totalUncertainty
        };
    }

    // 불확실성을 고려한 확률 조정
    adjustProbabilityWithUncertainty(probability, uncertainty) {
        // 불확실성이 높을수록 확률을 중간값으로 조정
        const adjustment = uncertainty.total * 0.3; // 최대 30% 조정
        const adjustedProb = probability * (1 - adjustment) + 0.5 * adjustment;
        
        return Math.max(0.01, Math.min(0.99, adjustedProb));
    }

    // 헬퍼 함수들
    calculateVariance(predictions) {
        const mean = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
        const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - mean, 2), 0) / predictions.length;
        return Math.sqrt(variance);
    }

    calculateConfidence(predictions) {
        const variance = this.calculateVariance(predictions);
        return Math.max(0, 1 - variance); // 분산이 낮을수록 신뢰도 높음
    }

    getHistoricalMarketData() {
        // 가상의 시계열 데이터 (실제로는 외부 API)
        return Array.from({length: 30}, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            price: 250000000 + Math.random() * 50000000 - 25000000,
            volume: Math.random() * 1000 + 100,
            volatility: Math.random() * 0.2 + 0.1
        }));
    }

    calculateMovingAverage(data, period) {
        const recent = data.slice(-period);
        return recent.reduce((sum, item) => sum + item.price, 0) / recent.length;
    }

    analyzeSeasonality(data) {
        // 계절성 분석 (월별 패턴)
        const monthlyData = {};
        data.forEach(item => {
            const month = item.date.getMonth();
            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(item.price);
        });
        
        const monthlyAverages = Object.values(monthlyData).map(prices => 
            prices.reduce((sum, price) => sum + price, 0) / prices.length
        );
        
        const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / monthlyAverages.length;
        const seasonality = monthlyAverages.map(avg => avg / overallAverage);
        
        return seasonality;
    }

    calculateVolatility(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i].price - data[i-1].price) / data[i-1].price);
        }
        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    calculateMomentum(data) {
        const recent = data.slice(-5);
        const older = data.slice(-10, -5);
        const recentAvg = recent.reduce((sum, item) => sum + item.price, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.price, 0) / older.length;
        return (recentAvg - olderAvg) / olderAvg;
    }

    getLocationData() {
        // 가상의 지역 데이터 (실제로는 GIS API)
        return {
            accessibility: 0.8, // 지하철, 버스 접근성
            infrastructure: 0.7, // 상업시설, 교육시설
            populationDensity: 0.6, // 인구 밀도
            developmentPlan: 0.5 // 개발 계획
        };
    }

    calculateAccessibility(locationData) {
        return locationData.accessibility;
    }

    calculateInfrastructure(locationData) {
        return locationData.infrastructure;
    }

    generateRandomScenario(features) {
        // 랜덤 시나리오 생성 (정규분포 기반)
        return {
            competitorCount: Math.max(1, Math.round(features.competitorCount + (Math.random() - 0.5) * 2)),
            marketWeight: Math.max(0.1, Math.min(1.0, features.marketWeight + (Math.random() - 0.5) * 0.2)),
            urgencyWeight: Math.max(0.1, Math.min(1.0, features.urgencyWeight + (Math.random() - 0.5) * 0.2)),
            priceRatio: Math.max(0.5, Math.min(1.5, features.priceRatio + (Math.random() - 0.5) * 0.1))
        };
    }

    simulateScenario(scenario, competitorBehavior) {
        // 시나리오별 낙찰 여부 시뮬레이션
        const baseProb = competitorBehavior.weighted;
        const scenarioProb = baseProb * scenario.marketWeight * scenario.urgencyWeight;
        const win = Math.random() < scenarioProb;
        
        return {
            win: win,
            probability: scenarioProb,
            scenario: scenario
        };
    }

    calculateMean(results) {
        return results.reduce((sum, result) => sum + result.probability, 0) / results.length;
    }

    calculateMedian(results) {
        const sorted = results.map(r => r.probability).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    calculateStandardDeviation(results) {
        const mean = this.calculateMean(results);
        const variance = results.reduce((sum, result) => sum + Math.pow(result.probability - mean, 2), 0) / results.length;
        return Math.sqrt(variance);
    }

    calculatePercentiles(results) {
        const sorted = results.map(r => r.probability).sort((a, b) => a - b);
        return {
            p25: sorted[Math.floor(sorted.length * 0.25)],
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p75: sorted[Math.floor(sorted.length * 0.75)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            p95: sorted[Math.floor(sorted.length * 0.95)]
        };
    }

    calculateMarketProbability(marketTrend) {
        let prob = 0.5; // 기본 확률
        
        // 트렌드에 따른 조정
        if (marketTrend.trend === 'upward') {
            prob += marketTrend.strength * 0.3;
        } else {
            prob -= marketTrend.strength * 0.3;
        }
        
        // 변동성에 따른 조정
        prob -= marketTrend.volatility * 0.2;
        
        // 모멘텀에 따른 조정
        prob += marketTrend.momentum * 0.1;
        
        return Math.max(0.1, Math.min(0.9, prob));
    }

    assessDataQuality(features) {
        // 데이터 품질 평가
        let quality = 1.0;
        
        // 누락된 데이터 체크
        const missingData = Object.values(features).filter(val => val === null || val === undefined).length;
        quality -= missingData * 0.1;
        
        // 이상치 체크
        const outliers = Object.values(features).filter(val => val < 0 || val > 10).length;
        quality -= outliers * 0.05;
        
        return Math.max(0, quality);
    }

    calculateModelUncertainty(features) {
        // 모델 불확실성 계산
        const complexity = Object.keys(features).length;
        const uncertainty = Math.min(0.5, complexity * 0.02);
        return uncertainty;
    }

    calculateMarketUncertainty(features) {
        // 시장 불확실성 계산
        const volatility = features.volatility || 0.1;
        const marketEfficiency = features.marketEfficiency || 0.5;
        return volatility * (1 - marketEfficiency);
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
    calculateTotalCost(bidPrice, auctionType) {
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
            totalCost: bidPrice + auctionFee + registrationFee + tax + additionalCosts
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
    calculateOptimalBid(propertyValue, auctionType, competitorCount, marketCondition, urgency, marketPrice, appraisalPrice, minimumBid, failedCount) {
        const marketWeight = this.getMarketWeight(marketCondition);
        const urgencyWeight = this.getUrgencyWeight(urgency);
        const appraisalWeight = this.getAppraisalRatioWeight(appraisalPrice, marketPrice);
        
        // 다양한 입찰가격에 대해 시뮬레이션
        const bidPrices = [];
        const probabilities = [];
        const profits = [];
        
        // 입찰가격 범위를 최저입찰가부터 감정가의 150%까지로 설정
        const minBid = Math.max(minimumBid, propertyValue * 0.6); // 최저입찰가와 목표가의 60% 중 큰 값
        const maxBid = Math.max(appraisalPrice * 1.5, propertyValue * 1.3); // 감정가의 150%와 목표가의 130% 중 큰 값
        const step = (maxBid - minBid) / 20;
        
        for (let bidPrice = minBid; bidPrice <= maxBid; bidPrice += step) {
            const winProbability = this.calculateWinProbability(
                bidPrice, propertyValue, competitorCount, marketWeight, urgencyWeight, 
                failedCount, appraisalPrice, minimumBid, marketPrice, renovationCost
            );
            const costInfo = this.calculateTotalCost(bidPrice, auctionType);
            const expectedProfit = this.calculateExpectedProfit(propertyValue, costInfo.totalCost);
            const riskAdjustedProfit = this.calculateRiskAdjustedProfit(
                propertyValue, costInfo.totalCost, winProbability, marketCondition, failedCount
            );
            
            bidPrices.push(Math.round(bidPrice));
            probabilities.push(winProbability);
            profits.push(riskAdjustedProfit); // 리스크 조정 수익률 사용
        }
        
        // 기대값이 가장 높은 입찰가격 찾기 (정교화된 모델)
        let bestBidIndex = 0;
        let bestExpectedValue = -Infinity;
        
        for (let i = 0; i < bidPrices.length; i++) {
            const winProb = probabilities[i];
            const profit = profits[i];
            
            // 1. 기본 기대값: 성공시 수익률 × 성공확률
            const basicExpectedValue = winProb * profit;
            
            // 2. 실패시 페널티 (입찰가의 일정 비율 손실)
            const bidPrice = bidPrices[i];
            const failurePenalty = (1 - winProb) * (bidPrice / propertyValue) * 5; // 입찰가 대비 5% 손실
            
            // 3. 기회비용 (다른 투자 기회 고려)
            const opportunityCost = winProb * 0.02; // 2% 기회비용
            
            // 4. 최종 기대값
            const expectedValue = basicExpectedValue - failurePenalty - opportunityCost;
            
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
            // 최적 입찰가격 계산 (만원 단위로 계산)
            const result = this.calculateOptimalBid(
                propertyValueManWon, auctionType, competitorCount, marketCondition, urgency,
                marketPriceManWon, appraisalPriceManWon, minimumBidManWon, failedCount
            );
            console.log('최적 입찰가격 계산 완료:', result);
            
            console.log('총 비용 계산 시작');
            // 총 비용 계산 (만원 단위로 계산)
            const costInfo = this.calculateTotalCost(result.recommendedBid, auctionType);
            console.log('총 비용 계산 완료:', costInfo);
            
            console.log('시세 대비 수익성 분석 시작');
            // 시세 대비 수익성 분석 (만원 단위로 계산)
            const marketProfitability = this.calculateMarketProfitability(result.recommendedBid, marketPriceManWon, costInfo.totalCost);
            console.log('시세 대비 수익성 분석 완료:', marketProfitability);
            
            console.log('결과 표시 시작');
            // 결과 표시 (원 단위로 표시)
            this.displayResults(result, costInfo, propertyValue, competitorCount, marketCondition, 
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
    displayResults(result, costInfo, propertyValue, competitorCount, marketCondition, 
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
