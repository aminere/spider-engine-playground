
// Setup a full screen drawable texture
const { screenSize } = spider.Interfaces.renderer;
const texture = new spider.DrawableTexture();
texture.width = screenSize.x;
texture.height = screenSize.y;

const image = spider.Entities.create()
    .setComponent(spider.Image, {
        fill: new spider.TextureFill(texture)
    });

const _screen = spider.Entities.create()
    .setComponent(spider.Screen);

_screen.addChild(image);

// Setup perlin noise

// 2D Lookup table - pure random noise
const noiseLUTSize = 64;
const noiseLUT = Array.from(new Array(noiseLUTSize)).map(() => {
  return Array.from(new Array(noiseLUTSize)).map(() => Math.random())
});

// Get interpolated noise from the lookup table
function getNoise2D(x, y) {
    // Get the integer part, used as an index in the lookup table
    let xSample1 = Math.floor(x);    
    let ySample1 = Math.floor(y);

    // Save the fractional part for interpolation
    const fractX = x - xSample1;
    const fractY = y - ySample1;

    // Clamp the indexes to the lookup table size
    // And determine neighboring samples to interpolate with
    xSample1 = xSample1 % noiseLUT.length;
    const xSample2 = (xSample1 + 1) % noiseLUT.length;    
    ySample1 = ySample1 % noiseLUT.length;
    const ySample2 = (ySample1 + 1) % noiseLUT.length;

    // Interpolate across X
    const ny1x1 = noiseLUT[ySample1][xSample1];
    const ny1x2 = noiseLUT[ySample1][xSample2];    
    const ny2x1 = noiseLUT[ySample2][xSample1];
    const ny2x2 = noiseLUT[ySample2][xSample2];
    const iy1 = ny1x1 + (ny1x2 - ny1x1) * fractX;
    const iy2 = ny2x1 + (ny2x2 - ny2x1) * fractX;

    // Interpolate across Y
    const noise = iy1 + (iy2 - iy1) * fractY;
    return noise;
}

// Perlin noise
function perlinNoise2D(x, y, initialFreq, octaves) {
    let noise = 0;
    let weight = 1;
    let weights = 0;
    let freq = initialFreq;
    for (let i = 0; i < octaves; ++i) {
        noise += getNoise2D(x * freq, y * freq) * weight;
        weights += weight;
        freq *= 2;
        weight *= 0.5;
    }
    noise /= weights;
    return noise;
}

// Draw
for (let i = 0; i < texture.height; ++i) {
    for (let j = 0; j < texture.width; ++j) {
        const c = perlinNoise2D(j, i, .01, 10);
        texture.setPixel(j, i, new spider.Color(c, c, c));
    }
}
