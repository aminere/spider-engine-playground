
const halfSize = 40;
const size = halfSize * 2;
const numRows = size + 1;
const numCols = numRows;

const currentPos = new spider.Vector3(-halfSize, 0, -halfSize);
const positions: number[] = [];
const colors: number[] = [];
const vertexCount = numRows * numCols;
positions.length = vertexCount * 3; // 3 components (x,y,z) per position
colors.length = positions.length;

// generate positions
let currentVertex = 0;
for (let i = 0; i < numRows; ++i) {
    for (let j = 0; j < numCols; ++j) {
        currentPos.toArray(positions, currentVertex * 3);

        colors[currentVertex * 3 + 0] = j / (numCols - 1);
        colors[currentVertex * 3 + 1] = 0;
        colors[currentVertex * 3 + 2] = i / (numRows - 1);

        currentPos.x++;
        currentVertex++;
    }
    currentPos.x = -halfSize;
    currentPos.z++;
}

// generate indices
const indices: number[] = [];
indices.length = size * size * 6; // 6 positions per cell
let currentIndex = 0;
for (let i = 0; i < size; ++i) {
    for (let j = 0; j < size; ++j) {
        const index0 = i * numRows + j;
        const index1 = index0 + 1;
        const index2 = index0 + numRows;
        const index3 = index1 + numRows;

        indices[currentIndex++] = index2;
        indices[currentIndex++] = index1;
        indices[currentIndex++] = index0;

        indices[currentIndex++] = index2;
        indices[currentIndex++] = index3;
        indices[currentIndex++] = index1;
    }
}

// Create vertex buffer
const vertexBuffer = new spider.VertexBuffer({
    attributes: {
        "position": positions,
        "color": colors
    },
    indices,
    primitiveType: "TRIANGLES",
    isDynamic: true
});

// Create dynamic mesh
const mesh = spider.Entities.create()
    .setComponent(spider.Visual, {
        material: new spider.Material({
            shader: spider.defaultAssets.shaders.diffuse,
            shaderParams: {
                ambient: spider.Color.white
            }
        }),
        geometry: new spider.DynamicGeometry({
            vertexBuffer
        })
    });

// Camera
spider.Entities.create()
    .setComponent(spider.Camera)
    .setComponent(spider.Transform, {
        position: new spider.Vector3(0, 30, 70),
        rotation: spider.Quaternion.fromEulerAngles(-Math.PI / 6, 0, 0)
    });

// Update callback
spider.Update.hook.attach(() => {
    // update geometry
    let currentVertex = 0;
    for (let i = 0; i < numRows; ++i) {
        for (let j = 0; j < numCols; ++j) {

            // update positions
            const height = Math.sin(spider.Time.time * 4 + 10 * (j / numCols))
                    * Math.sin(spider.Time.time * 4 + 10 * (i / numRows));

            positions[currentVertex * 3 + 1] = height * 4;

            // update colors
            const color = (height + 1) / 2;
            colors[currentVertex * 3 + 0] = j / (numCols - 1) * color;
            colors[currentVertex * 3 + 1] = 0;
            colors[currentVertex * 3 + 2] = i / (numRows - 1) * color;

            ++currentVertex;
        }
    }
    vertexBuffer.dirtifyAttribute("position");
    vertexBuffer.dirtifyAttribute("color");
});
