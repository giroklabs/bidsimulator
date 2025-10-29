import SwiftUI

struct SplashView: View {
    @State private var isActive = false
    @State private var opacity: Double = 0.0
    
    // MaruBuri Bold 폰트 헬퍼
    private func maruBuriBoldFont(size: CGFloat) -> Font {
        if let font = UIFont(name: "MaruBuriot-Bold", size: size) {
            return Font(font)
        }
        // 폴백: 다른 가능한 폰트 이름 시도
        if let font = UIFont(name: "MaruBuriOTF Bold", size: size) {
            return Font(font)
        }
        // 최종 폴백: 시스템 폰트
        return .system(size: size, weight: .bold)
    }
    
    // 정사각형 박스 안에 텍스트를 넣는 뷰
    private func squareText(_ text: String, size: CGFloat) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white, lineWidth: 2)
                .frame(width: size, height: size)
            
            Text(text)
                .font(maruBuriBoldFont(size: size * 0.6))
                .foregroundColor(.white)
        }
    }
    
    var body: some View {
        if isActive {
            RootTabView()
        } else {
            ZStack {
                // 검정색 배경
                Color.black
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    Spacer()
                    
                    // 정사각형으로 배치된 제목
                    VStack(spacing: 8) {
                        // 상단: 경매
                        HStack(spacing: 8) {
                            squareText("경", size: 80)
                            squareText("매", size: 80)
                        }
                        
                        // 하단: 일기
                        HStack(spacing: 8) {
                            squareText("일", size: 80)
                            squareText("기", size: 80)
                        }
                    }
                    .opacity(opacity)
                    
                    Spacer()
                    
                    // 로딩 애니메이션 (점 3개)
                    HStack(spacing: 4) {
                        ForEach(0..<3) { index in
                            Circle()
                                .fill(Color.white.opacity(0.8))
                                .frame(width: 8, height: 8)
                                .scaleEffect(opacity * 0.8 + 0.2)
                                .animation(
                                    Animation.easeInOut(duration: 0.6)
                                        .repeatForever()
                                        .delay(Double(index) * 0.2),
                                    value: opacity
                                )
                        }
                    }
                    .opacity(opacity * 0.8)
                    .padding(.bottom, 60)
                }
            }
            .onAppear {
                withAnimation(Animation.easeInOut(duration: 0.8)) {
                    opacity = 1.0
                }
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                    withAnimation(.easeOut(duration: 0.3)) {
                        opacity = 0.0
                    }
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        isActive = true
                    }
                }
            }
        }
    }
}
