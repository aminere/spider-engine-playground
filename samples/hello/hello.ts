
// Box
const box = spider.Entities.create()
    .setComponent(spider.Visual, {
        material: new spider.Material({
            shader: spider.defaultAssets.shaders.phong,
            shaderParams: {
                diffuse: spider.Color.white,
                diffuseMap: "Assets/spider-engine.png",
                ambient: new spider.Color(.1, .1, .2)
            }
        }),
        geometry: new spider.BoxGeometry(),
        receiveShadows: false
    });

// Camera
spider.Entities.create()
    .setComponent(spider.Camera)
    .setComponent(spider.Transform, {
        position: new spider.Vector3(0, 0, 4)
    });

// Light
spider.Entities.create()
    .setComponent(spider.Light, {
        "type": new spider.DirectionalLight()
    })
    .setComponent(spider.Transform, {
        rotation: spider.Quaternion.fromEulerAngles(
            spider.MathEx.toRadians(-15),
            spider.MathEx.toRadians(30),
            0
        )
    });

const angles = new spider.Vector3();

// Update callback
spider.Update.hook.attach(() => {
    box.updateComponent(spider.Transform, {
        rotation: spider.Quaternion.fromEulerAngles(
            spider.MathEx.toRadians(angles.x),
            spider.MathEx.toRadians(angles.y),
            spider.MathEx.toRadians(angles.z)
        )
    });
    angles.x = 30 * Math.sin(spider.Time.time);
    angles.y += 120 * spider.Time.deltaTime * Math.sin(spider.Time.time / 4);
});
