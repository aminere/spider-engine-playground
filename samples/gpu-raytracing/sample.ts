
const shader = new spider.Shader({
    vertexCode: `
attribute vec3 position;

void main() {
    gl_Position = vec4(position, 1.0);
}
    `,
    fragmentCode: `    
precision mediump float;

uniform vec2 screenSize;
uniform float time;

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Sphere {
    vec3 position;
    float radius;
    vec3 color;
};

struct Intersection {
    float dist;
    vec3 normal;
    vec3 color;
};

// collision routines by iq
// https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
float intersectSphere(in vec3 ro, in vec3 rd, in vec3 pos, in float ra) {    
	vec3 oc = ro - pos;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - ra * ra;
	float h = b * b - c;
	if (h < 0.0) {
        return -1.0;
    }
	return -b - sqrt(h);
}

float intersectPlane(in vec3 ro, in vec3 rd, in vec4 p) {
    return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}

Intersection rayCast(in Ray ray) {
    Intersection intersection = Intersection(-1., vec3(0., 0., 0.), vec3(0., 0., 0.));
    float minDist = 1e10;

    // ground
    vec4 ground = vec4(0, 1, 0, 1);
    float dist = intersectPlane(ray.origin, ray.direction, ground);
    if (dist > 0. && dist < minDist) {
        intersection.dist = dist;
        intersection.normal = ground.xyz;
        // checker pattern
        vec3 intersectionPoint = ray.origin + ray.direction * dist;
        float pattern = min(mod(floor(intersectionPoint.x) + floor(intersectionPoint.z), 2.0) * .3 + .0, 1.);
        intersection.color = vec3(pattern);
        minDist = dist;
    }

    // spheres
    const int sphereCount = 5;
    Sphere spheres[sphereCount];
    spheres[0] = Sphere(vec3(-2., 0. + sin(time) / 5., 0.), 1., vec3(1., 0., 0.));
    spheres[1] = Sphere(vec3(1.0, .3 + cos(time) / 10., -.9), 1.0, vec3(0., 0., 1.));    
    spheres[2] = Sphere(vec3(-0., 3. + sin(time) / 5., 0.), 1., vec3(1., 1., 0.));
    spheres[3] = Sphere(vec3(3.0, 2. + cos(time) / 10., -.9), 1.0, vec3(0., 1., 1.));    
    spheres[4] = Sphere(vec3(-4.0, .3 + cos(time) / 10., -2.), 1.0, vec3(1., .5, 0.));    
    for (int i = 0; i < sphereCount; i++) {
        float dist = intersectSphere(ray.origin, ray.direction, spheres[i].position, spheres[i].radius);
        if (dist > 0. && dist < minDist) {
            intersection.dist = dist;
            intersection.normal = normalize((ray.origin + ray.direction * dist) - spheres[i].position);
            intersection.color = spheres[i].color;
            minDist = dist;
        }
    }

    return intersection;
}

vec3 rayTrace(in Ray ray) {

    Intersection intersection = rayCast(ray);
    if (intersection.dist < 0.) {
        return vec3(0.);
    }

    // basic diffuse
    vec3 intersectionPoint = ray.origin + ray.direction * intersection.dist;
    vec3 lightPos = vec3(0., 6., -2.);        
    vec3 toLight = normalize(lightPos - intersectionPoint);
    vec3 color = intersection.color * clamp(dot(intersection.normal, toLight), 0., 1.);
    
    // shadows
    if (rayCast(Ray(intersectionPoint + toLight * 0.01, toLight)).dist > 0.) {
        color *= .3;
    }
    // reflections
    vec3 reflection = reflect(ray.direction, intersection.normal);
    ray = Ray(ray.origin + intersection.dist * ray.direction + .01 * reflection, reflection);
    const int iterations = 3;
    for (int i = iterations; i > 0; --i) {
        Intersection intersection = rayCast(ray);
        float reflectionIntensity = float(i) / float(iterations);
        if (intersection.dist > 0.) {
            vec3 intersectionPoint = ray.origin + ray.direction * intersection.dist;
            vec3 toLight = normalize(lightPos - intersectionPoint);
            color += intersection.color 
                * clamp(dot(intersection.normal, toLight), 0., 1.)
                * reflectionIntensity;
            vec3 reflection = reflect(ray.direction, intersection.normal);
            ray = Ray(ray.origin + intersection.dist * ray.direction + .01 * reflection, reflection);
        } else {            
            break;
        }
    }

    return color;
}

vec3 rotateY(in vec3 v, in float angle) {
    float x = v.x * cos(angle) - v.z * sin(angle);
    float z = v.x * sin(angle) + v.z * cos(angle);
    return vec3(x, v.y, z);
}

vec3 rotateX(in vec3 v, in float angle) {
    float y = v.y * cos(angle) - v.z * sin(angle);
    float z = v.y * sin(angle) + v.z * cos(angle);
    return vec3(v.x, y, z);
}

void main() {

    vec3 rayDirection = vec3(
        ((2. * gl_FragCoord.x) - screenSize.x) / screenSize.y,
        ((2. * gl_FragCoord.y) - screenSize.y) / screenSize.y,        
        1.
    );
    
    rayDirection = rotateX(rayDirection, sin(time / 10.) * .2);
    rayDirection = rotateY(rayDirection, sin(time / 4.) * .5);

    Ray ray = Ray(
        vec3(
            sin(time / 3.) * 1., 
            2. + sin(time / 10.), 
            -4. + sin(time / 10.)
        ),
        normalize(rayDirection)
    );

    vec3 color = rayTrace(ray);
    gl_FragColor = vec4(color, 1.);
}
    `
});

// Full screen quad
spider.Entities.create().setComponent(spider.Visual, {
    material: new spider.Material({
        shader
    }),
    geometry: new spider.CenteredQuad()
});

// Camera
spider.Entities.create().setComponent(spider.Camera);