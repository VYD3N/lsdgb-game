# LSDGB

A psychedelic arcade browser game inspired by classic shooters and trippy vibes.

## Play Online
You can play the game by opening `index.html` in your browser on desktop, mobile, or tablet devices.

## Game Description
- **LSDGB** ("LSD Gummy Bear") is a fast-paced, colorful shooter where you play as a groovy gummy bear fighting off conformity!
- **4:3 Playable Area:** The game action is strictly confined to a central 4:3 area (960x720) within a widescreen 16:9 canvas (1280x720). This ensures the controls never overlap the playfield.
- **Controls Anchored to Corners:** The D-pad and fire button are now anchored to the absolute bottom-left and bottom-right corners of the screen, maximizing comfort and keeping the playfield completely unobstructed.
- **Maximized Distance & Size:** Both controls are as far from the playfield as possible and are larger for easy, ergonomic use.
- **Visual Boundaries:** Faint lines mark the edges of the playfield for clarity.
- **Life Gummy Takes 3 Hits:** The extra-life gummy bear now requires three hits to disappear, flashing white each time it takes damage for clear feedback.
- Convert suits and cops into hippies with your acid vials.
- Collect life gummies to increase your lives. Reach 3 lives to win!
- **Dynamic difficulty**: Your fire rate and enemy spawn rate are tied to your score - the better you do, the faster you shoot and the more enemies spawn!
- **Responsive design**: The game scales to fit any screen size while maintaining the same gameplay experience.

## Sound Effects
- **p5.sound** is used for audio support.
- **shooting.mp3** is played every time the gummy bear shoots a rainbow ball of acid.
- **soundtrack.mp3** plays in a loop when the round begins, and stops on game over or win.
- **gummybear.mp3** plays when a LifeGummy (extra life) enters the playfield.
- **Recommended format:** MP3 (for best browser compatibility and performance).

## Controls
- **Desktop:**
  - **Move:** Arrow Keys or WASD
  - **Shoot:** Hold SPACEBAR to auto-shoot vibes
  - **Start/Restart:** Click the button or press ENTER
- **Mobile/Touch:**
  - **Move:** Use the large on-screen circular D-pad (anchored to the bottom-left corner, outside the playfield). Touch and drag in any direction for smooth 8-way movement. There is no dead zone—movement is active anywhere inside the D-pad. To stop, simply lift your thumb.
  - **Shoot:** Tap the red fire button (anchored to the bottom-right corner, outside the playfield)
  - **Start/Restart:** Tap the button or press ENTER

## How to Play
1. **Start the game** by clicking "START REVOLUTION" or pressing ENTER.
2. **Move** your gummy bear using keyboard (desktop) or the large circular D-pad (mobile) to dodge enemies and collect life gummies.
3. **Shoot** acid vials using spacebar (desktop) or the red fire button (mobile) to convert enemies into hippies.
4. **Collect 3 lives** to win. If you lose all your lives or your score drops below -5, the game is over.
5. **Life Gummy Strategy:** The extra-life gummy bear now takes 3 hits to destroy. It flashes white when hit, so plan your shots carefully to avoid losing your chance at an extra life!
6. **Watch your fire rate**: As your score increases, you'll shoot faster and enemies will spawn more frequently!

## Game Features
- **4:3 Playable Area:** All gameplay is confined to a central 4:3 region, with controls in dedicated sidebars.
- **Controls Anchored to Corners:** D-pad and fire button are maximally distant from the playfield for comfort and visibility.
- **Visual Boundaries:** Faint lines show the playfield edges for clarity.
- **Life Gummy Takes 3 Hits:** Extra-life gummies require three hits and flash white when damaged.
- **Dynamic Fire Rate**: Your shooting speed increases with your score
- **Adaptive Spawning**: Enemy spawn rate increases as you perform better
- **Life System**: Collect gummy life power-ups every 25 points
- **Enemy Types**: 
  - **Suits**: Convert to hippies with 1 hit
  - **Cops**: Require 3 hits to convert, and can revert hippies back to angry suits!
- **Responsive Canvas**: Game scales perfectly on any screen size
- **Touch Support**: Full mobile and tablet support with a professional, large, corner-anchored circular D-pad (no dead zone, visual feedback) and a dedicated fire button
- **Landscape Mode**: Enforced for best mobile experience

## Local Setup
1. Clone this repository:
   ```sh
   git clone https://github.com/VYD3N/lsdgb-game.git
   ```
2. Open `index.html` in your web browser.

No build or install steps are required—just open and play!

## License
MIT (add your preferred license here)

---
Made with ❤️ and p5.js 