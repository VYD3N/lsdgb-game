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
- **Life Gummy is Animated:** The extra-life gummy bear now uses a 2-frame animated sprite (`lifegummy1.png`, `lifegummy2.png`) for a lively effect, just like the player and enemies.
- **All Characters Use Sprites:** The player, suits, cops, hippies, angry suits, and life gummy all use 2-frame image-based sprites for smooth animation.
- Convert suits and cops into hippies with your acid vials.
- Collect life gummies to increase your lives. Reach 3 lives to win!
- **Dynamic difficulty**: Your fire rate and enemy spawn rate are tied to your score - the better you do, the faster you shoot and the more enemies spawn!
- **Responsive design**: The game scales to fit any screen size while maintaining the same gameplay experience.
- **Tiled Background:** The grass background (`grass.png`) is tiled vertically to fill the entire browser canvas, ensuring a seamless look on all screen sizes.

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
5. **Life Gummy Strategy:** The extra-life gummy bear now takes 3 hits to destroy and is animated with 2 frames. It flashes white when hit, so plan your shots carefully to avoid losing your chance at an extra life!
6. **Watch your fire rate**: As your score increases, you'll shoot faster and enemies will spawn more frequently!

## Difficulty Levels

### Normal Mode
- Classic gameplay with standard difficulty.
- Grass background (`grass.png`).
- Player starts with 1 life, max 3 lives, win at 3.
- Life gummies and cops require 3 hits.
- Suits and angry suits have standard speed.
- Game over at -5 score.

### Hard Mode (New!)
- Increased enemy speed and spawn rate.
- Player starts with 1 life, max 2 lives, win at 4.
- Life gummies and cops require 5 hits.
- Angry suits move faster and chase more aggressively.
- Game over at -3 score.
- HUD is red for extra tension.
- **Parking lot background** (`parkinglot.png`) for a more intense vibe.

## Game Features
- **4:3 Playable Area:** All gameplay is confined to a central 4:3 region, with controls in dedicated sidebars.
- **Controls Anchored to Corners:** D-pad and fire button are maximally distant from the playfield for comfort and visibility.
- **Visual Boundaries:** Faint lines show the playfield edges for clarity.
- **Life Gummy is Animated:** Extra-life gummies use a 2-frame sprite and require three hits (five in hard mode), flashing white when damaged.
- **All Characters Animated:** Player, suits, cops, hippies, angry suits, and life gummy all use 2-frame image-based sprites for smooth animation.
- **Dynamic Fire Rate**: Your shooting speed increases with your score
- **Adaptive Spawning**: Enemy spawn rate increases as you perform better
- **Life System**: Collect gummy life power-ups every 25 points
- **Enemy Types**: 
  - **Suits**: Convert to hippies with 1 hit
  - **Cops**: Require 3 hits to convert (5 in hard mode), and can revert hippies back to angry suits! (Note: Only hippies that originated as Suits can be reverted. This logic could be adapted for an 'ultra boss' scenario in future versions.)
- **Responsive Canvas**: Game scales perfectly on any screen size
- **Touch Support**: Full mobile and tablet support with a professional, large, corner-anchored circular D-pad (no dead zone, visual feedback) and a dedicated fire button
- **Landscape Mode**: Enforced for best mobile experience
- **Tiled Background:** The grass background is tiled vertically to fill the browser window in normal mode; the parking lot background is used in hard mode.

## Assets
- **All image and sound assets must be present in the project directory for full functionality:**
  - `gummy.png`, `suit1.png`, `suit2.png`, `cop1.png`, `cop2.png`, `hippie1.png`, `hippie2.png`, `angrysuit1.png`, `angrysuit2.png`, `lifegummy1.png`, `lifegummy2.png`, `grass.png`, `parkinglot.png`
  - `shooting.mp3`, `soundtrack.mp3`, `gummybear.mp3`

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