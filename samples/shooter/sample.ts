
// Camera
const camera = spider.Entities.create()
    .setComponent(spider.Camera)
    .setComponent(spider.Transform, {
        position: new spider.Vector3(0, 20, 0),
        rotation: spider.Quaternion.fromEulerAngles(
            spider.MathEx.toRadians(-68), 
            spider.MathEx.toRadians(0), 
            0
        )
    });

// Enemy
class Enemy extends spider.Component {

    onDestroyed = () => {};

    private _health = 10;

    constructor(props: spider.ObjectProps<Enemy>) {
        super();
        this.setState(props);
    }

    takeDamage() {
        --this._health;
        this.entity.findChild("Mesh")
            .getComponent(spider.AnimationComponent)
            .playAnimation(0, false);

        if (this._health <= 0) {
            this.entity.getComponent(spider.BehaviorComponent).sendSignal("explode");
            this.onDestroyed();
        }
    }
}

// Player
class Player {
    static get position() { return Player._entity.transform.position; }

    private static _entity: spider.Entity;

    constructor(prefab: spider.Prefab) {
        console.assert(!Player._entity, "Multiple player instances not allowed");
        const player = spider.Entities.create({ prefab });
        player.setComponent(spider.Collider, {
            shapes: [
                new spider.SphereCollisionShape({
                    radius: 1.5
                }),
                new spider.ParticlesCollisionShape({
                    particlesEntity: player.findChild("LeftCannon")
                }),
                new spider.ParticlesCollisionShape({
                    particlesEntity: player.findChild("RightCannon")
                }),
            ],
            onCollision: (collision) => {
                // player bullet hit enemy
                if (collision.myShape.particles) {
                    // kill bullet particle                    
                    collision.myShape.particles.setParticleLife(collision.particleIndex, 0);
                    // apply damage
                    collision.collider.entity.getComponent(Enemy).takeDamage();
                }
                // enemy bullet hit player
                if (collision.otherShape.tag === "EnemyBullet") {
                    // kill bullet particle                    
                    collision.otherShape.particles.setParticleLife(collision.particleIndex, 0);
                    // take damage
                    player
                        .findChild("Mesh")
                        .getComponent(spider.AnimationComponent)
                        .playAnimation(0, false);
                }
            }
        })
        .setComponent(spider.Transform, {
            rotation: spider.Quaternion.fromEulerAngles(0, Math.PI, 0)
        });

        Player._entity = player;
        spider.Input.touchMoved.attach(({ x, y, pressed }) => pressed && this.updatePosition(x, y));
        spider.Input.touchPressed.attach(({ x, y }) => this.updatePosition(x, y));
    }

    private updatePosition(touchX: number, touchY: number) {
        const ray = camera.getComponent(spider.Camera).getWorldRay(touchX, touchY);
        const groundPlane = spider.Plane.fromPool().set(spider.Vector3.up, 0);
        const { intersection } = ray.castOnPlane(groundPlane);
        Player._entity.transform.position = intersection;
    }
}

class Enemies {
    private static maxCount = 8;
    private static spawnFrequency = .8;
    private static spawnDistance = -25;
    private static spawnRange = [-10, 10];
    private static moveSpeed = 10;
    private static endLine = 5;

    private _pool: spider.Entity[] = [];
    private _spawnTimer = -1;

    constructor(prefab: spider.Prefab) {

        const createEnemy = (poolIndex: number) => {
            const enemy = spider.Entities.create({ prefab });
            enemy.setComponent(spider.Collider, {
                shapes: [
                    new spider.BoxCollisionShape(),
                    new spider.ParticlesCollisionShape({
                        tag: "EnemyBullet",
                        particlesEntity: enemy.findChild("Bullets")
                    })
                ]
            }).setComponent(Enemy, {
                onDestroyed: () => {
                    // enemy was destroyed. Replace it in the pool with a fresh one.
                    this._pool[poolIndex] = createEnemy(poolIndex);
                }
            });

            enemy.active = false;
            return enemy;
        };

        for (let i = 0; i < Enemies.maxCount; ++i) {
            this._pool.push(createEnemy(i));
        }
    }

    update() {
        // spawn enemies
        if (this._spawnTimer < 0) {
            this.spawn();
            this._spawnTimer = Enemies.spawnFrequency;
        } else {
            this._spawnTimer -= spider.Time.deltaTime;
        }

        // update active enemies
        this._pool
            .filter(e => e.active)
            .forEach(e => {
                // move
                e.transform.position.z += Enemies.moveSpeed * spider.Time.deltaTime;
                // aim at player
                const toPlayer = spider.Vector3.fromPool()
                    .copy(Player.position)
                    .substract(e.transform.position)
                    .normalize();
                e.transform.rotation.lookAt(toPlayer, spider.Vector3.up);

                if (e.transform.position.z > Enemies.endLine) {
                    e.active = false;
                }
            });
    }

    private spawn() {
        const candidate = this._pool.findIndex(e => !e.active);
        if (candidate >= 0) {
            const enemy = this._pool[candidate];
            enemy.updateComponent(spider.Transform, {
                position: new spider.Vector3(
                    spider.Random.range(Enemies.spawnRange[0], Enemies.spawnRange[1]),
                    0,
                    Enemies.spawnDistance
                )
            });
            enemy.active = true;
        }
    }
}

Promise.all([
    spider.Assets.load("Assets/Shooter/Player.Prefab"),
    spider.Assets.load("Assets/Shooter/Enemy.Prefab"),
]).then(([
    playerPrefab,
    enemyPrefab
]) => {

    const player = new Player(playerPrefab as spider.Prefab);
    const enemies = new Enemies(enemyPrefab as spider.Prefab);

    // stars
    spider.Entities.create()
        .setComponent(spider.Particles, {
            isLooping: true,
            maxParticles: 256,
            particlesPerSecond: 20,
            life: new spider.Range(5, 5),
            gravity: 0,
            volume: new spider.BoxVolume({
                extent: new spider.Vector3(40, 10, 5)
            }),
            direction: spider.ParticleEmitDirection.Forward,
            initialSpeed: new spider.Range(8, 15),
            initialSize: new spider.Range(.1, .2),
        })
        .setComponent(spider.Transform, {
            position: new spider.Vector3(0, 0, -20.15),            
        });

    // update hook
    spider.Update.hook.attach(() => {
        enemies.update();
    });
});
