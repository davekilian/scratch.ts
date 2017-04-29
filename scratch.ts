// scratch.ts -- HTML5 canvas/TypeScript game starter kit
//
// Rather than a complete framework, scratch is a small implementation of basic
// building blocks for games (a main loop, rendering, input). Scratch's
// implementation is simple, documented, and meant to be read. The idea is to
// get you started on your game more quickly, by reading and extending the
// basic boilerplate rather than reimplementing it.
//
// Scratch is licensed under the MIT license. See below for more details:
//
// Copyright (c) Dave Kilian 2017
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/** 
 * Standard interface for things that need to run code during each tick of the
 * game's main loop.
 */
interface Updatable {
    /**
     * Runs this object's update logic. Should be called once for each tick of
     * the game's main loop, e.g. during a Scene's update() method.
     * 
     * @param {number} dt - The amount of time that elapsed between the start of
     * the previous iteration of the game's main loop, and the start of the
     * current iteration, in seconds. This value is usually passed as a
     * parameter to Scene.update().
     */
    update(dt: number): void;
}

/**
 * Interface for an object that implements logic for part of your game.
 * 
 * Each Scene has its own state (via private variables) and an update + render
 * loop. The Scene's update method is called once per iteration of the game's
 * main loop, and updates the state of the game world by collecting player
 * input and running the game logic. The render method is called to draw the
 * current game state on screen.
 * 
 * The Kernel object maintains a stack of Scenes. The top of the stack is the
 * currently-executing Scene, on which the Kernel calls update() and render()
 * at regular intervals. All Scenes below the top of the stack are suspended,
 * meaning update()/render() are not called. If the top Scene is popped off
 * the stack, the second Scene becomes the top of the stack, and is effectively
 * resumed.
 * 
 * An example where this is useful is a pause menu: when the user selects the
 * pause option in-game, the main game scene can push a new instance of the
 * pause menu scene to the top of the stack. This causes the Kernel to direct
 * all update()/render() calls to the 'pause' scene, but not the 'game' scene.
 * When the user selects unpause, the 'pause' scene pops itself off the top of
 * the stack, returning control to the 'game' scene below it.
 */
interface Scene {
    /**
     * Implements game logic for one tick of the game's main loop.
     * This is when Scenes normally collect player input.
     * This method should never render any content.
     * 
     * @param {number} dt - The amount of time that elapsed between the last
     * call to Scene.update() and the current call to Scene.update(), in
     * seconds (i.e. 0.5 is half a second).
     */
    update(dt: number): void;

    /**
     * Renders the current state of the game to the HTML canvas element.
     * 
     * @param {number} dt - The amount of time that elapsed between the last
     * call to Scene.render() and the current call, in seconds.
     * 
     * @param {CanvasRenderingContext2D} - The rendering context to use to
     * draw on the game's canvas.
     */
    render(dt: number, context: CanvasRenderingContext2D): void;
}

/** Collects user input in the form of a key or button press */
abstract class Button implements Updatable {
    private wasDown: boolean;

    protected constructor() {
        this.wasDown = false;
    }

    /** An ID which identifies this button, for debugging */
    abstract id(): string;

    /** true iff the user is currently holding the button down */
    abstract isDown(): boolean;

    /** true iff the user is not holding the button down */
    isUp(): boolean {
        return !this.isDown();
    }

    /** 
     * true iff this is the first game loop iteration for which the user is
     * holding the button down, after previously not holding the button down.
     * Useful for 'one-time only' actions like selecting a menu item.
     */
    pressed() {
        return this.isDown() && !this.wasDown;
    }

    /** 
     * true iff this is the first game loop iteration for which the user is not
     * holding the button down, after previously holding the button down.
     * Useful for 'one-time only' actions like selecting a menu item.
     */
    release() {
        return !this.isDown() && this.wasDown;
    }

    /** 
     * Polls the underlying device for new state of this button. Must be called
     * once per game update.
     */
    update(dt) {
        this.wasDown = this.isDown();
    }
}

/**
 * Virtual Button type which wraps two 'inner' Buttons. This button is 'down'
 * iff both inner buttons are both down; if either is up, this button is up.
 * 
 * Useful for implementing key combos (e.g. an AndButton wrapping both Ctrl and
 * S would only be 'down' if the user is pressing both Ctrl and S)
 */
class AndButton extends Button {
    private left: Button;
    private right: Button;

    constructor(left: Button, right: Button) {
        super();
        this.left = left;
        this.right = right;
    }

    isDown(): boolean {
        return this.left.isDown() && this.right.isDown();
    }

    id(): string {
        return `(${this.left.id()})&(${this.right.id})`;
    }
}

/**
 * Virtual Button type which wraps two 'inner' Buttons. This Button is down
 * when either inner Button is down; it is up only if both inner Buttons are
 * both up.
 * 
 * Useful for combining keys. For example, you could use an OrButton to
 * combine both LeftCtrl and RightCtrl, so the button is pressed if either
 * Ctrl key is pressed.
 */
class OrButton extends Button {
    private left: Button;
    private right: Button;

    constructor(left: Button, right: Button) {
        super();
        this.left = left;
        this.right = right;
    }

    isDown(): boolean {
        return this.left.isDown() || this.right.isDown();
    }

    id(): string {
        return `(${this.left.id()})|(${this.right.id})`;
    }
}

/** 
 * Virtual Button type which wraps an inner Button. This Button is down when
 * the inner Button is up, and vice versa.
 */
class NotButton extends Button {
    private inner: Button;

    constructor(inner: Button) {
        super();
        this.inner = inner;
    }

    isDown(): boolean {
        return !this.inner.isDown();
    }

    id(): string {
        return `!${this.id()}`;
    }
}

/**
 * Exposes user key presses as Buttons. Usually you access this by calling
 * Kernel.keyboard() instead of creating your own instance.
 */
class Keyboard implements Updatable {
    private keys: Key[];
    states: Object;

    constructor(canvas: HTMLCanvasElement) {
        this.states = { };
        this.keys = [ ];

        canvas.onkeydown = (e) => this.states[e.key] = true;
        canvas.onkeyup = (e) => delete this.states[e.key];
    }

    key(key: string): Button {
        let result = new Key(this, key);
        this.keys.push(result);

        return result;
    }

    update(dt): void {
        this.keys.forEach((key) => key.update(dt));
    }
}

/**
 * Exposes a single key of the keyboard as a button. Usually you create
 * instances of this class by calling Keyboard.key()
 */
class Key extends Button {
    private keyboard: Keyboard;
    private key: string;
    private state: boolean;

    constructor(keyboard: Keyboard, key: string) {
        super();

        this.keyboard = keyboard;
        this.key = key;
        this.state = false;
    }

    isDown(): boolean {
        return this.state;
    }

    id(): string {
        return `Keyboard.${this.key}`;
    }

    update(dt): void {
        super.update(dt);
        this.state = (this.keyboard.states[this.key] === true);
    }
}

/**
 * Internal helper which manages the game loop.
 * 
 * Internally, uses window.requestAnimationFrame() to schedule an internal
 * callback KernelScheduler.tick() to run whenever the browser is otherwise
 * idle and ready to process graphics events. Caps the frame rate if
 * requestAnimationFrame() returns sooner than desired.
 */
class KernelScheduler {
    private callback: (dt: number) => void;
    private targetFPS: number;
    private lastTick: number;
    private executing: boolean;

    constructor(callback: (number) => void, 
                targetFPS: number) {

        this.callback = callback;
        this.targetFPS = targetFPS;
        this.lastTick = 0;
        this.executing = false;
    }

    start() {
        if (!this.executing) {
            this.executing = true;
            this.scheduleTick();
        }
    }

    stop() {
        this.executing = false;
        this.lastTick = 0;
    }

    private scheduleTick() {
        window.requestAnimationFrame((t) => this.tick(t));
    }

    private tick(timeMS: number): void {
        if (this.executing) {
            let time = timeMS / 1000;

            if (time - this.lastTick > 1 / this.targetFPS) {
                this.callback(time - this.lastTick);
                this.lastTick = time;
            }

            this.scheduleTick();
        }
    }
}

/**
 * Main execution engine for the game. 
 * 
 * - Maintains global input state (e.g. the Keyboard object)
 * - Maintains the stack of executing Scenes
 * - Manages the game loop, forwarding update/render events to the active Scene
 * 
 * Once the kernel is created, it can be accessed at any time and from any
 * context, via a call to Kernel.current().
 */
class Kernel {
    private static currentInstance: Kernel;

    static current(): Kernel {
        return Kernel.currentInstance;
    }

    private canvas: HTMLCanvasElement;
    private scheduler: KernelScheduler;
    private keyboardDevice: Keyboard;
    private scenes: Scene[];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.scheduler = new KernelScheduler((dt) => this.tick(dt), 60);
        this.input = { };
        this.keyboardDevice = new Keyboard(canvas);
        this.scenes = [ ];

        Kernel.currentInstance = this;
    }

    /** Sets the given scene as active and starts the game loop */
    exec(scene: Scene) {
        this.scenes.push(scene);
        this.canvas.focus();
        this.scheduler.start();
    }

    /**
     * Runs one iteration of the game loop.
     * 
     * This method is passed to KernelScheduler's constructor as the callback
     * parameter, and is this invoked from KernelScheduler.tick() when the
     * browser is ready to run another iteration of the game loop.
     * 
     * Some game engines run the update and render loops on separate threads
     * for timing reasons, but in a browser all code runs on the same thread,
     * making separate loops pointless. Instead, each iteration of tick() both
     * updates the game state and renders it.
     */
    private tick(dt: number): void {
        // Poll for new input
        this.keyboardDevice.update(dt);

        // Update the active scene
        let scene = this.scene();
        if (scene != null) {
            scene.update(dt);
        }

        // Clear the existing contents of the canvas
        let c = this.canvas.getContext('2d');
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);

        // Render the scene
        if (scene != null) {
            scene.render(dt, c);
        }
    }

    /**
     * Maintains a game-wide mapping between ID strings and corresponding
     * button inputs, useful for allowing users to customize control schemes.
     * 
     * To add a mapping:
     * 
     *   let kernel = Kernel.current();
     *   kernel.input['MoveLeft'] = kernel.keyboard().key('W');
     * 
     * To use a mapping
     * 
     *   let kernel = Kernel.current();
     *   if ((kernel.input['MoveLeft'] as Button).isDown()) {
     *       // ... move character left
     *   }
     */
    input: Object;

    /** Gets the game's Keyboard objects, for querying input */
    keyboard(): Keyboard {
        return this.keyboardDevice;
    }

    /** Returns the active scene (at the top of the stack) */
    scene(): Scene {
        if (this.scenes.length > 0) {
            return this.scenes[this.scenes.length - 1];
        }
        else {
            return null;
        }
    }

    /** Pushes a new scene to the top of the stack, making it active */
    push(scene: Scene) {
        this.scenes.push(scene);
    }

    /** Pops the active Scene, returning control the second-topmost Scene */
    pop() {
        this.scenes.pop();
    }

    /** Pops the active Scene, then replaces it with the specified Scene */
    swap(scene: Scene) {
        this.scenes.pop();
        this.scenes.push(scene);
    }
}

/**
 * Simple 'proof of concept' Scene which demonstrates all major components are
 * working:
 * 
 * To demonstrate the Scene can render graphics, the Scene clears the screen
 * to a custom color.
 * 
 * To demonstrate the game loop is running, the Scene continually changes the
 * color it clears the screen to (fading to/from black slowly).
 * 
 * To demonstrate the Scene is collecting user input, the Scene changes the hue
 * of the clear color whenever the user presses the Enter key.
 */
class TestScene implements Scene {
    time: number;
    color: number[];

    constructor() {
        this.time = 0;
        this.color = [0, 128, 255];

        let kernel = Kernel.current();
        kernel.input['ResetColor'] = kernel.keyboard().key('Enter');
    }

    update(dt: number): void {
        this.time += dt;

        if ((Kernel.current().input['ResetColor'] as Button).pressed()) {
            this.color = [0, 0, 0].map(
                v => Math.floor(255 * Math.random())
            );
        }
    }

    render(t: number, c: CanvasRenderingContext2D): void {
        let shade = .75 + .25 * Math.sin(this.time);
        let color = this.color.map(v => Math.floor(v * shade));

        c.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    }
}

/** Called from index.html to start the demo scene */
function testmain() {
    let canvas = document.getElementById('canvas') as HTMLCanvasElement;
    let kernel = new Kernel(canvas);
    kernel.exec(new TestScene());
}
