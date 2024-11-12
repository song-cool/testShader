uniform float uTime;
uniform vec2 resolution;
uniform sampler2D tDiffuse;
varying vec2 vUv;

// 격자 생성 함수
vec2 getGrid(vec2 uv, float size) {
    return floor(uv * size) / size;
}

// 격자 내부 UV 계산 함수
vec2 getGridInnerUV(vec2 uv, float size) {
    return fract(uv * size);
}

// 넓은 범위 샘플링 함수
vec4 wideAreaSampling(vec2 uv, float gridSize, float localTime) {
    vec4 color = vec4(0.0);
    float total = 0.0;
    float sampleRadius = 1.0/gridSize * 1.25;
    
    // 시간에 따른 샘플링 위치 조정
    vec2 timeOffset = vec2(
        sin(localTime * 0.3) * 0.01,
        cos(localTime * 0.2) * 0.01
    );
    
    for(float y = -2.0; y <= 2.0; y++) {
        for(float x = -2.0; x <= 2.0; x++) {
            vec2 offset = vec2(x, y) * sampleRadius;
            
            // 시간 오프셋을 포함한 샘플링
            vec2 sampleUv = uv + offset + timeOffset;
            
            float dist = length(vec2(x, y)) / 20.0;
            float weight = exp(-dist * dist) * 1.2;
            
            color += texture2D(tDiffuse, sampleUv) * weight;
            total += weight;
        }
    }
    
    return color / total;
}

// 그리드별 시간 딜레이 계산 함수 수정
float getGridTimeDelay(vec2 gridPos) {
    // 좌하단(0,0)에서 우상단(1,1)로 갈수록 딜레이가 줄어듦
    float delayFactor = (gridPos.x + gridPos.y) * 0.5;  // 0~1 범위
    
    // 최대 2초까지 딜레이 (uTime 기준)
    float maxDelay = 2.0;
    float delay = maxDelay * (1.0 - delayFactor);
    
    return delay;
}

// 그리드 위치에 따른 반전 여부 결정 함수 수정
vec2 getGridFlip(vec2 gridPos) {
    // 모든 그리드에 대해 x, y축 모두 반전
    return vec2(1.0, 1.0);  // 항상 true (1.0)를 반환
}

// UV 좌표 반전 함수
vec2 flipUV(vec2 uv, vec2 flip) {
    return vec2(
        flip.x > 0.5 ? 1.0 - uv.x : uv.x,  // x축 반전
        flip.y > 0.5 ? 1.0 - uv.y : uv.y   // y축 반전
    );
}

void main() {
    vec2 uv = vUv;
    float gridSize = 16.0;
    
    // 격자의 기본 위치
    vec2 gridUv = getGrid(uv, gridSize);
    vec2 innerUv = getGridInnerUV(uv, gridSize);
    
    // 각 그리드의 반전 상태 결정
    vec2 flipState = getGridFlip(gridUv * gridSize);
    
    // 반전된 내부 UV 계산
    vec2 flippedInnerUv = flipUV(innerUv, flipState);
    
    // 시간 딜레이 계산
    float timeDelay = getGridTimeDelay(gridUv);
    float localTime = max(0.0, uTime * 0.2 - timeDelay);
    
    // 움직임에도 반전 적용
    vec2 movement = vec2(
        sin(localTime + gridUv.x * 4.0) * 0.01 * (flipState.x > 0.5 ? -1.0 : 1.0),
        cos(localTime + gridUv.y * 4.0) * 0.01 * (flipState.y > 0.5 ? -1.0 : 1.0)
    );
    
    // 최종 UV 계산
    vec2 finalUv = gridUv + flippedInnerUv/gridSize + movement;
    
    // 시간 딜레이를 반영한 샘플링
    vec4 color = wideAreaSampling(finalUv, gridSize, localTime);
    
    // 격자 위치에 따른 강도 조정
    float intensity = 1.0 - length(gridUv - 0.5) * 0.5;
    intensity = max(0.0, intensity);
    
    // 시간에 따른 페이드인 효과
    float fadeIn = smoothstep(0.0, 0.5, localTime);
    intensity *= fadeIn;
    
    // 최종 색상
    vec3 finalColor = color.rgb * intensity;
    float alpha = intensity * 0.6;
    
    gl_FragColor = vec4(finalColor, alpha);
} 