
const postFxGroup = new spider.VisualGroup();

const sceneRenderTarget = new spider.RenderTarget();

// scene camera
const sceneCamera = spider.Entities.create()
    .setComponent(spider.Camera, {
        excludedGroups: [postFxGroup],
        renderTarget: sceneRenderTarget
    })
    .setComponent(spider.Transform, {
        position: new spider.Vector3(0, 20, 0),
        rotation: spider.Quaternion.fromEulerAngles(spider.MathEx.toRadians(-68), Math.PI, 0)
    });

// ASCII shader
const asciiShader = new spider.Shader({
    vertexCode: `        
attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUv = uv;    
}
    `,
    fragmentCode: `

precision mediump float;

uniform vec2 screenSize;

uniform sampler2D sceneTexture;
uniform sampler2D char1;
uniform sampler2D char2;
uniform sampler2D char3;
uniform sampler2D char4;
uniform sampler2D char5;
uniform sampler2D char6;
uniform sampler2D char7;
uniform sampler2D char8;

varying vec2 vUv;

const float blockSize = 20.;

void main()
{
    vec2 screenCoord = screenSize * vUv;
    vec2 blockCoord = screenCoord / blockSize;
    vec2 blockStart = vec2(floor(blockCoord.x), floor(blockCoord.y));    

    vec3 sceneColor = texture2D(sceneTexture, (blockStart * blockSize) / screenSize).rgb;

    vec4 charColor = vec4(0.);
    float luminosity = (sceneColor.r + sceneColor.g + sceneColor.b) / 3.;     
    vec2 localBlockCoord = blockCoord - blockStart;
    
    if (luminosity < .1) charColor = texture2D(char1, localBlockCoord);
    else if (luminosity < .2) charColor = texture2D(char2, localBlockCoord);
    else if (luminosity < .3) charColor = texture2D(char3, localBlockCoord);
    else if (luminosity < .4) charColor = texture2D(char4, localBlockCoord);
    else if (luminosity < .5) charColor = texture2D(char5, localBlockCoord);
    else if (luminosity < .6) charColor = texture2D(char6, localBlockCoord);
    else if (luminosity < .7) charColor = texture2D(char7, localBlockCoord);
    else charColor = texture2D(char8, localBlockCoord);
    
    gl_FragColor = vec4(sceneColor * (charColor.rgb), 1.);
}
    `
});

const fullScreenQuad = spider.Entities.create()
    .setComponent(spider.Visual, {
        geometry: new spider.CenteredQuad(),
        material: new spider.Material({
            shader: asciiShader,
            shaderParams: {
                sceneTexture: sceneRenderTarget,
                char1: "Assets/ASCII/Characters/46.png",
                char2: "Assets/ASCII/Characters/43.png",
                char3: "Assets/ASCII/Characters/126.png",
                char4: "Assets/ASCII/Characters/35.png",
                char5: "Assets/ASCII/Characters/36.png",
                char6: "Assets/ASCII/Characters/64.png",
                char7: "Assets/ASCII/Characters/65.png",
                char8: "Assets/ASCII/Characters/122.png"
            }
        }),
        group: postFxGroup
    });

spider.Assets.load("Assets/ASCII/Shooter.Prefab")
    .then(shooter => {
        spider.Entities.create({ prefab: shooter as spider.Prefab });


        // full screen camera
        spider.Entities.create()
            .setComponent(spider.Camera, {
                includedGroups: [postFxGroup]
            });
    });