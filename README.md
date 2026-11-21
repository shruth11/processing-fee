# PROCESSING FEE

A camera with no viewfinder. You take a picture of yourself and you cannot see
it. To see it you mix the chemistry and develop it, and every development
damages the negative a little more. There is no correct version.

**Live:** https://shruth11.github.io/processing-fee/

Creative Coding Lab F26 · Project B Prototype · Shruthi Swaminathan

## Run it locally
Open `index.html` with Live Server in VS Code. It needs camera permission.
p5 loads from a CDN, so you need internet. To run offline, swap the two script
tags in `main.html` for the local `libraries/p5.js`.

## The class the project is built around

**`Negative`** holds `latent` (the frame the camera caught, never altered),
`image` (what came out of the tank this run) and `wear` (permanent damage that
grows every time).

`develop(dev, temp, agit, age)` is the whole piece. It copies the latent frame
with `get()`, walks every pixel, and applies four chemicals:

| Chemical | What it does to each pixel |
|---|---|
| DEVELOPER | multiplies brightness, so time in the tank |
| TEMPERATURE | pushes values away from mid grey, so contrast |
| FIXER AGE | highlights drift red, shadows drift blue |
| AGITATION | adds a random amount, so grain |

`random()` is inside the grain line, so the same dial settings still give a
different picture every press. `wear` feeds back in as more grain and less
contrast, and it is never reset except by a new frame.

**`Dial`** is one chemical you drag, plus the line of darkroom teaching that
appears when you hover it.

**`Receipt`** is built only when someone presses KEEP IT. Every number on it
already existed, taken from the dials and from `wear`.

## The invisible capture
In `draw()`, when the shutter fires, the webcam is painted into the frame and
read straight back with `get()` in the same pass, then covered by the interface
before that frame reaches the screen. The picture is taken. Nobody sees it.

## The thing that would break it
The pixel loop runs once, on a button press, never inside `draw()`.

## Controls
SPACE or SHUTTER to take it. DEVELOP to process. KEEP IT to save the png and
print the receipt. NEW FRAME or R to start over. Resets itself after 40 seconds
idle, for the exhibition.
