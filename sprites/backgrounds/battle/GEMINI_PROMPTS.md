# Battle Background Image Generation — Gemini Prompts

## Overview

Each terrain needs **3 variants** optimized for different screen layouts.
All images should share the same art style: **pixel-art-inspired Pokémon stadium arena**
(indoor stadium, audience in stands, dramatic lighting, battlefield floor in center).

The current `bg_neutral.png` (desktop) is the reference — match its style, perspective,
and level of detail across all generations.

## Target Dimensions & Aspect Ratios

| Layout      | Dimensions    | Aspect Ratio | Visible Area Description                                                          |
|-------------|---------------|--------------|-----------------------------------------------------------------------------------|
| **Desktop** | 1920 × 1080   | 16:9         | Full wide stadium. Bottom ~40% covered by UI. Arena floor center-left, foe top-right. |
| **Portrait**| 1080 × 1920   | 9:16         | Tall crop. Top ~45% is the arena (foe upper-right, player lower-left). Bottom 55% fully covered by UI (opaque). |
| **Landscape**| 1920 × 900   | ~2.13:1      | Ultra-wide. Bottom ~45% covered by UI. Sprites sit left/right. More horizontal space, less vertical. |

## Critical Composition Notes

- **Desktop**: Camera slightly elevated, angled down. Stadium + crowd fills upper half. Battlefield floor is visible center-bottom. Player sprite sits bottom-left, foe sprite sits upper-right.
- **Portrait**: Camera looking more straight ahead / slightly below horizon. The arena floor and foe area should be packed into the top ~45% of the image. The bottom half will be fully hidden by opaque UI — don't waste detail there, but still fill it so scrolling/animation looks natural.
- **Landscape**: Similar to desktop but even wider. The camera is a bit lower. Left and right edges matter more since sprites sit at the sides. The vertical center band (behind the UI) can have less detail.

## Color Palettes Per Terrain

| Terrain      | Primary Tones                | Floor / Ground Accent              | Atmosphere                     |
|--------------|------------------------------|------------------------------------|--------------------------------|
| **Neutral**  | Dark blue-gray, steel        | Gray stone / dark tile             | Spotlights, camera flashes     |
| **Grassy**   | Deep green, emerald          | Lush grass, flowers at edges       | Warm sunbeams, pollen particles|
| **Electric** | Yellow, amber, dark purple   | Crackling floor panels, lightning  | Electric arcs, glowing lines   |
| **Psychic**  | Pink-magenta, deep violet    | Glowing geometric patterns         | Floating particles, dream-like |
| **Misty**    | Soft pink, lavender, white   | Fog-covered, faintly visible floor | Dense low fog, ethereal glow   |

## File Naming Convention

```
sprites/backgrounds/battle/{layout}/bg_{terrain}.png

Examples:
  sprites/backgrounds/battle/desktop/bg_neutral.png
  sprites/backgrounds/battle/portrait/bg_grassy.png
  sprites/backgrounds/battle/landscape/bg_electric.png
```

## Full File List (15 images)

### Desktop (1920×1080)
1. `desktop/bg_neutral.png`
2. `desktop/bg_grassy.png`
3. `desktop/bg_electric.png`
4. `desktop/bg_psychic.png`
5. `desktop/bg_misty.png`

### Portrait (1080×1920)
6. `portrait/bg_neutral.png`
7. `portrait/bg_grassy.png`
8. `portrait/bg_electric.png`
9. `portrait/bg_psychic.png`
10. `portrait/bg_misty.png`

### Landscape (1920×900)
11. `landscape/bg_neutral.png`
12. `landscape/bg_grassy.png`
13. `landscape/bg_electric.png`
14. `landscape/bg_psychic.png`
15. `landscape/bg_misty.png`

---

## Gemini Prompts

Copy-paste these directly into Gemini image generation. Adjust the resolution parameter per model capabilities.

---

### TEMPLATE (replace {TERRAIN}, {LAYOUT}, {WIDTH}, {HEIGHT}, {COMPOSITION}, {PALETTE})

```
Generate a pixel-art-inspired Pokémon battle stadium background, {WIDTH}x{HEIGHT} pixels, PNG format.

Scene: Indoor battle stadium arena with audience in tiered stands. {COMPOSITION}

Terrain theme: {TERRAIN}
Color palette: {PALETTE}

Style: Semi-detailed pixel art with anti-aliased edges. Dark moody atmosphere with dramatic stadium lighting (spotlights from above, camera flashes from crowd). The battlefield floor is the focal point. No Pokémon or trainers in the image — just the empty arena.

Technical: Clean PNG, no text, no watermarks, no UI elements. The image will be used as a CSS background-image with background-size: cover.
```

---

### 1. NEUTRAL — Desktop (1920×1080)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x1080 pixels, PNG format.

Scene: Indoor battle stadium arena with audience in tiered stands. Camera slightly elevated, angled down at the arena. Stadium crowd fills the upper half with camera flashes. The dark stone/tile battlefield floor is visible in the center-bottom area. A large screen/jumbotron is visible behind the far side of the arena.

Terrain theme: Neutral / Standard
Color palette: Dark blue-gray and steel tones. Gray stone floor with subtle tile pattern. Cool white spotlights with warm camera flash accents from the crowd.

Style: Semi-detailed pixel art with anti-aliased edges. Dark moody atmosphere with dramatic stadium lighting. No Pokémon or trainers — just the empty arena.

Technical: Clean PNG, no text, no watermarks. Used as CSS background-image with cover sizing.
```

### 2. NEUTRAL — Portrait (1080×1920)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1080x1920 pixels, PNG format.

Scene: Indoor battle stadium arena, TALL vertical composition. Camera looking more straight ahead at the arena. The arena floor and far-side stands + jumbotron should be packed into the top 45% of the image. The audience wraps around left and right. The bottom half can have floor/ground detail but will be mostly hidden by UI overlay.

Terrain theme: Neutral / Standard
Color palette: Dark blue-gray and steel tones. Gray stone floor. Cool spotlights, camera flashes from crowd.

Style: Semi-detailed pixel art with anti-aliased edges. Dark moody atmosphere with dramatic stadium lighting. No Pokémon or trainers — just the empty arena.

Technical: Clean PNG, no text, no watermarks. Top portion is most important visually.
```

### 3. NEUTRAL — Landscape (1920×900)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x900 pixels, PNG format.

Scene: Indoor battle stadium arena, ULTRA-WIDE horizontal composition. Camera at a slightly lower angle than standard. The stadium extends wide left-to-right with audience visible on both sides. The battlefield floor stretches across the full width. A jumbotron/screen is visible in the far center-top.

Terrain theme: Neutral / Standard
Color palette: Dark blue-gray and steel tones. Gray stone floor. Cool spotlights, camera flashes.

Style: Semi-detailed pixel art with anti-aliased edges. Dark moody atmosphere. No Pokémon or trainers — just the empty arena.

Technical: Clean PNG, no text, no watermarks. Left and right edges are important (sprites sit there).
```

### 4. GRASSY — Desktop (1920×1080)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x1080 pixels, PNG format.

Scene: Indoor battle stadium arena with audience in tiered stands. Camera slightly elevated, angled down. The battlefield floor is covered in lush green grass with small flowers at the edges. Vines and foliage creep up the arena walls. A jumbotron glows behind the far stands.

Terrain theme: Grassy Terrain
Color palette: Deep emerald greens, warm sunbeam yellows filtering through. The grass floor is vibrant with subtle light dappling. Warm golden-green atmosphere with pollen particles floating.

Style: Semi-detailed pixel art with anti-aliased edges. Warm natural lighting mixed with stadium spotlights. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks.
```

### 5. GRASSY — Portrait (1080×1920)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1080x1920 pixels, PNG format.

Scene: Indoor battle stadium arena, TALL vertical composition. Camera straight ahead. Lush grass covers the battlefield floor in the top 45% of the image. Vines on arena walls, flowers at edges. Audience and jumbotron visible in the upper portion.

Terrain theme: Grassy Terrain
Color palette: Deep emerald greens, warm sunbeam yellows, pollen particles. Vibrant grass floor.

Style: Semi-detailed pixel art, warm natural lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Top portion most important.
```

### 6. GRASSY — Landscape (1920×900)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x900 pixels, PNG format.

Scene: Indoor battle stadium arena, ULTRA-WIDE. Camera slightly lower. Lush grass battlefield extends the full width. Flowers and vines at the arena edges. Wide audience view on both sides.

Terrain theme: Grassy Terrain
Color palette: Deep emerald greens, warm yellows, floating pollen. Vibrant grass floor.

Style: Semi-detailed pixel art, warm natural + stadium lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Left/right edges important.
```

### 7. ELECTRIC — Desktop (1920×1080)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x1080 pixels, PNG format.

Scene: Indoor battle stadium arena with audience. Camera slightly elevated. The battlefield floor has glowing electric panel lines and crackling energy. Lightning arcs between floor segments. The jumbotron behind the arena pulses with electric energy. The crowd is lit by yellow-amber flashes.

Terrain theme: Electric Terrain
Color palette: Bright yellow, amber, dark purple shadows. Glowing electric-blue and yellow floor lines. Electric arcs and sparks in the air. High contrast between dark arena walls and bright electric elements.

Style: Semi-detailed pixel art, dramatic electric lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks.
```

### 8. ELECTRIC — Portrait (1080×1920)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1080x1920 pixels, PNG format.

Scene: Indoor battle stadium, TALL vertical. Camera straight ahead. Electric crackling floor panels in top 45%. Lightning arcs between segments. Audience and glowing jumbotron above.

Terrain theme: Electric Terrain
Color palette: Yellow, amber, dark purple. Glowing floor lines, electric arcs.

Style: Semi-detailed pixel art, dramatic electric lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Top portion most important.
```

### 9. ELECTRIC — Landscape (1920×900)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x900 pixels, PNG format.

Scene: Indoor battle stadium, ULTRA-WIDE. Camera lower angle. Wide electric floor with glowing panel lines stretching edge to edge. Lightning arcs. Wide audience view.

Terrain theme: Electric Terrain
Color palette: Yellow, amber, dark purple. Glowing lines, electric sparks.

Style: Semi-detailed pixel art, dramatic lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Left/right edges important.
```

### 10. PSYCHIC — Desktop (1920×1080)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x1080 pixels, PNG format.

Scene: Indoor battle stadium arena. Camera slightly elevated. The battlefield floor has glowing geometric/mandala patterns. The arena feels surreal and dreamlike. Floating light particles hover above the floor. The crowd and stands have a slight ethereal pink-purple tint. The jumbotron emits a soft glow.

Terrain theme: Psychic Terrain
Color palette: Pink-magenta and deep violet. Glowing geometric floor patterns in pink/white. Floating luminous particles. Dream-like atmospheric haze.

Style: Semi-detailed pixel art, mystical ethereal lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks.
```

### 11. PSYCHIC — Portrait (1080×1920)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1080x1920 pixels, PNG format.

Scene: Indoor battle stadium, TALL vertical. Camera straight ahead. Glowing geometric floor patterns in top 45%. Floating particles, ethereal haze. Dreamlike atmosphere.

Terrain theme: Psychic Terrain
Color palette: Pink-magenta, deep violet. Glowing patterns, floating particles.

Style: Semi-detailed pixel art, mystical lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Top portion most important.
```

### 12. PSYCHIC — Landscape (1920×900)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x900 pixels, PNG format.

Scene: Indoor battle stadium, ULTRA-WIDE. Camera lower. Wide geometric-patterned floor. Floating particles and ethereal glow spanning the full width. Dreamlike wide atmosphere.

Terrain theme: Psychic Terrain
Color palette: Pink-magenta, deep violet. Glowing patterns, particles.

Style: Semi-detailed pixel art, mystical lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Left/right edges important.
```

### 13. MISTY — Desktop (1920×1080)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x1080 pixels, PNG format.

Scene: Indoor battle stadium arena. Camera slightly elevated. Dense low-lying fog covers the battlefield floor — the floor is barely visible through the mist. The fog has a soft pink-lavender tint. The stands and crowd are partially obscured by rising mist. The jumbotron glows softly through the haze. An ethereal, fairy-tale atmosphere.

Terrain theme: Misty Terrain
Color palette: Soft pink, lavender, white. The fog is pink-white with subtle sparkle. Cool blue-pink undertones in the stadium. Ethereal soft-focus glow.

Style: Semi-detailed pixel art, soft ethereal lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks.
```

### 14. MISTY — Portrait (1080×1920)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1080x1920 pixels, PNG format.

Scene: Indoor battle stadium, TALL vertical. Camera straight ahead. Dense pink-lavender fog covers the floor in the top 45%. Stands barely visible through mist. Soft ethereal glow.

Terrain theme: Misty Terrain
Color palette: Soft pink, lavender, white fog. Ethereal sparkle.

Style: Semi-detailed pixel art, soft lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Top portion most important.
```

### 15. MISTY — Landscape (1920×900)

```
Generate a pixel-art-inspired Pokémon battle stadium background, 1920x900 pixels, PNG format.

Scene: Indoor battle stadium, ULTRA-WIDE. Camera lower. Dense pink fog stretches edge to edge. The wide stadium is shrouded in ethereal mist. Soft glowing atmosphere.

Terrain theme: Misty Terrain
Color palette: Soft pink, lavender, white. Ethereal sparkle, fog.

Style: Semi-detailed pixel art, soft lighting. No Pokémon or trainers.

Technical: Clean PNG, no text, no watermarks. Left/right edges important.
```

---

## After Generating

1. Save each image with the correct filename into the correct subfolder
2. The code will automatically pick the right image based on the current `data-battle-layout` attribute
3. Test all 3 layouts:
   - **Desktop**: open in a normal browser window (1280×720+)
   - **Portrait**: use Chrome DevTools → toggle device toolbar → select a phone in portrait
   - **Landscape**: same but rotate to landscape, or resize window to wide+short (e.g. 900×450)
