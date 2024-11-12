uniform vec2 resolution;
uniform float uTime;
varying vec2 vUv;

// 펄린 노이즈 함수
float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float n00 = dot(random2(i), f);
    float n10 = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float n01 = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float n11 = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    
    return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

// 랜덤 벡터 생성 함수
vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// 메타볼릭 형태 생성 함수
float metaball(vec2 uv, vec2 center, float time, float scale) {
    vec2 pos = uv - center;
    float radius = length(pos);
    
    // 펄린 노이즈 기반의 변형
    float noise = perlin(pos * scale + time);
    
    // 메타볼릭 효과
    float metaball = exp(-radius * 4.0) + noise * 0.5;
    
    return metaball;
}

void main() {
    // 중심점 계산
    vec2 center = vec2(
        0.5 + sin(uTime * 0.3) * 0.2,
        0.5 + cos(uTime * 0.3) * 0.2
    );
    
    // 메타볼릭 형태 생성
    float shape = metaball(vUv, center, uTime, 3.0);
    
    // 노이즈 값에 따른 색상 구분
    vec3 color;
    if (shape < 0.2) {
        color = vec3(0.05, 0.15, 0.05);  // green 01
    } else if (shape < 0.4) {
        color = vec3(0.1, 0.3, 0.1);    // green 02
    } else if (shape < 0.6) {
        color = vec3(0.15, 0.45, 0.15); // green 03
    } else if (shape < 0.8) {
        color = vec3(0.2, 0.6, 0.2);    // green 04
    } else {
        color = vec3(0.25, 0.75, 0.25); // green 05
    }
    
    // 최종 색상
    gl_FragColor = vec4(color, 1.0);
} 