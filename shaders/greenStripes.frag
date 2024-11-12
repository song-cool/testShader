uniform vec2 resolution;
uniform float uTime;
varying vec2 vUv;

// 부드러운 노이즈 함수
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 부드러운 보간 함수
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 개선된 펄린 노이즈 함수
float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // 4개의 코너에서의 그라디언트 벡터
    vec2 g00 = normalize(vec2(noise(i) - 0.5, noise(i + vec2(12.34, 56.78)) - 0.5));
    vec2 g10 = normalize(vec2(noise(i + vec2(1.0, 0.0)) - 0.5, noise(i + vec2(1.0, 0.0) + vec2(12.34, 56.78)) - 0.5));
    vec2 g01 = normalize(vec2(noise(i + vec2(0.0, 1.0)) - 0.5, noise(i + vec2(0.0, 1.0) + vec2(12.34, 56.78)) - 0.5));
    vec2 g11 = normalize(vec2(noise(i + vec2(1.0, 1.0)) - 0.5, noise(i + vec2(1.0, 1.0) + vec2(12.34, 56.78)) - 0.5));
    
    // 보간을 위한 부드러운 곡선
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // 그라디언트 벡터와 거리 벡터의 내적
    float n00 = dot(g00, f);
    float n10 = dot(g10, f - vec2(1.0, 0.0));
    float n01 = dot(g01, f - vec2(0.0, 1.0));
    float n11 = dot(g11, f - vec2(1.0, 1.0));
    
    // 보간
    return mix(
        mix(n00, n10, u.x),
        mix(n01, n11, u.x),
        u.y
    ) * 0.5 + 0.5;
}

// 여러 옥타브의 펄린 노이즈를 합성
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(float i = 0.0; i < 6.0; i++) {
        value += amplitude * perlin(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

// 유체 형태 생성 함수
float fluidNoiseMorph(vec2 uv, vec2 center, float time, float scale) {
    vec2 pos = (uv - center) * 3.0;
    float angle = atan(pos.y, pos.x);
    float radius = length(pos);
    
    // 시간에 따른 변형 - 속도 증가
    vec2 morphUv = vec2(
        pos.x + sin(time * 0.6) * 0.5,  // 0.3 -> 0.6
        pos.y + cos(time * 0.4) * 0.5   // 0.2 -> 0.4
    );
    
    // 기본 형태 - 변형 속도 증가
    float base = fbm(morphUv + time * 0.2);  // 0.1 -> 0.2
    
    // 추가적인 변형 레이어 - 속도 증가
    float morph1 = fbm(morphUv * 1.5 + time * 0.4);  // 0.2 -> 0.4
    float morph2 = fbm(morphUv * 2.0 - time * 0.3);  // 0.15 -> 0.3
    
    // 레이어 합성
    float shape = base * 0.5 + morph1 * 0.3 + morph2 * 0.2;
    
    // 중심에서 멀어질수록 감쇠
    float falloff = 1.0 - smoothstep(0.0, scale * 2.0, radius);
    
    return smoothstep(0.3, 0.7, shape) * falloff;
}

void main() {
    // 중심점 계산 - 움직임 속도 증가
    vec2 center1 = vec2(
        0.5 + sin(uTime * 0.4) * 0.2 + cos(uTime * 0.3) * 0.2,  // 0.2 -> 0.4, 0.15 -> 0.3
        0.5 + cos(uTime * 0.35) * 0.2 + sin(uTime * 0.25) * 0.2  // 0.15 -> 0.35, 0.2 -> 0.25
    );
    
    vec2 center2 = vec2(
        0.3 + cos(uTime * 0.45) * 0.25 + sin(uTime * 0.35) * 0.25,  // 0.15 -> 0.45, 0.2 -> 0.35
        0.6 + sin(uTime * 0.4) * 0.25 + cos(uTime * 0.3) * 0.25  // 0.2 -> 0.4, 0.25 -> 0.3
    );
    
    // 유체 형태 생성 - 변형 속도 증가
    float fluid1 = fluidNoiseMorph(vUv, center1, uTime * 1.5, 0.8);  // uTime -> uTime * 1.5
    float fluid2 = fluidNoiseMorph(vUv, center2, -uTime * 1.2, 0.7);  // -uTime * 0.8 -> -uTime * 1.2
    
    // 글로우 효과
    float glow1 = smoothstep(0.2, 0.0, length(vUv - center1)) * 1.5;
    float glow2 = smoothstep(0.2, 0.0, length(vUv - center2)) * 1.5;
    
    vec3 finalColor = vec3(0.0);
    
    // 색상 그라데이션 수정 (밝은 색상 조정)
    vec3 greenGlow = mix(
        vec3(0.2, 0.9, 0.3),  // 밝은 초록 (더 낮은 밝기)
        vec3(0.0, 0.5, 0.0),  // 짙은 초록
        pow(glow1, 1.5)       // 1.2 -> 1.5로 증가하여 밝은 영역 더 축소
    ) * 1.8;                  // 2.0 -> 1.8
    
    vec3 redGlow = mix(
        vec3(0.9, 0.2, 0.1),  // 밝은 빨강 (더 낮은 밝기)
        vec3(0.5, 0.0, 0.0),  // 짙은 빨강
        pow(glow2, 1.5)       // 1.2 -> 1.5
    ) * 1.8;                  // 2.0 -> 1.8
    
    // HDR 스타일 처리 수정
    vec3 color1 = greenGlow * pow(glow1, 0.9);  // 0.8 -> 0.9
    vec3 color2 = redGlow * pow(glow2, 0.9);    // 0.8 -> 0.9
    
    // 블렌딩 강도 추가 감소
    float overlap = glow1 * glow2 * 2.5;  // 3.0 -> 2.5
    vec3 blendColor = mix(greenGlow, redGlow, 0.5) * overlap;
    
    // 색상 합성
    finalColor = color1 + color2 + blendColor;
    
    // 블랙홀 효과 수정
    float greenBlob = mix(vec3(0.0), finalColor, fluid1).g;
    float redBlob = mix(vec3(0.0), finalColor, fluid2).r;
    float combinedBlob = max(greenBlob, redBlob);
    
    // 하이라이트 추가 감소
    float highlight = pow(max(glow1, glow2), 4.5) * 1.5;  // 4.0 -> 4.5, 2.0 -> 1.5
    finalColor += vec3(highlight) * 0.5;  // 0.7 -> 0.5
    
    // 노이즈 효과
    float noise = smoothNoise(vUv * 4.0 + uTime * 0.1) * 0.15;  // 0.2 -> 0.15
    vec3 noiseColor = vec3(noise);
    finalColor += noiseColor * length(finalColor) * 0.6;  // 0.8 -> 0.6
    
    // 콘트라스트 조정
    finalColor = pow(finalColor, vec3(0.85));  // 0.8 -> 0.85
    finalColor *= 1.3;  // 1.5 -> 1.3
    
    // 더 강한 콘트라스트 (밝은 영역 추가 축소)
    finalColor = smoothstep(vec3(0.2), vec3(0.7), finalColor);  // 0.8 -> 0.7
    
    // 유체 효과를 위한 추가적인 노이즈
    float fluidNoise = smoothNoise(vUv * 5.0 + uTime * 0.1) * 0.1;
    finalColor += vec3(fluidNoise) * length(finalColor) * 0.4;
    
    gl_FragColor = vec4(finalColor, 1.0);
} 