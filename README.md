A simple starter kit for writing HTML5/Canvas games in TypeScript.

Rather than providing an entire game engine or graphics framework, this project
is a simple base on which you can build your own game, with custom code.
Scratch comes with small implementations of a main game loop and a keyboard
input-polling system.

The implementation is small, simple, well-documented, and licensed
permissively. It is meant to be easy to read in a relatively short sitting, and
modifying it to suit your own purposes should be straightforward.

## Getting Started

Scratch is implemented as a 'hello world' scene, in which:

* A main game loop is running at a normal frame rate
* A scene is being rendered during the main game loop
* The game is responding to user input

To get started, compile `scratch.ts` to `scratch.js`, using a 2.x version of
the TypeScript compiler. Then, making sure `scratch.js` appears alongside
`index.html`, open `index.html` in any web browser which supports the HTML 5
`<canvas>` element. You should see a pulsing blue screen, which changes color
whenever you press the Enter key on your keyboard.

From there, you can read scratch.ts to understand how it works, debugging if
needed. You can choose to continue your game using scratch as your basis, or
you can pull out the pieces you want and add them to your own project.

## License

Scratch is licensed under the MIT License. For more information, see
[LICENSE](LICENSE).

