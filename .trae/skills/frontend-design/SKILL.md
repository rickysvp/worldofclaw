---
name: "frontend-design"
description: "Creates distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. Invoke when user needs UI/UX design, frontend components, or wants to build visually striking web interfaces."
---

# Frontend Design Skill

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## When to Invoke

- User needs a new UI component or page
- User wants to redesign an existing interface
- User asks for frontend/frontend development help
- User wants "better design" or "improved UI"
- Building landing pages, dashboards, or applications

## Design Thinking Process

Before coding, understand the context and commit to a BOLD aesthetic direction:

### 1. Purpose Analysis
- What problem does this interface solve?
- Who uses it?
- What emotions should it evoke?

### 2. Tone Selection (Pick an Extreme)
Choose a clear direction:
- **Brutally minimal** - Stark, essential, whitespace-heavy
- **Maximalist chaos** - Dense, layered, overwhelming detail
- **Retro-futuristic** - 80s sci-fi, CRT effects, neon
- **Organic/natural** - Flowing shapes, earth tones, soft
- **Luxury/refined** - Elegant typography, gold accents, sophisticated
- **Playful/toy-like** - Bright colors, rounded shapes, fun
- **Editorial/magazine** - Strong typography, grid-based, print-inspired
- **Brutalist/raw** - Exposed structure, raw concrete, unpolished
- **Art deco/geometric** - Bold geometry, gold/black, 1920s inspired
- **Soft/pastel** - Gentle colors, rounded corners, calming
- **Industrial/utilitarian** - Functional, exposed mechanics, worn textures
- **Wasteland/post-apocalyptic** - Rust, decay, survival, gritty

### 3. Constraints
- Technical requirements (framework, performance, accessibility)
- Target devices (mobile-first, desktop, responsive)
- Brand guidelines (if any)

### 4. Differentiation
**CRITICAL**: What makes this UNFORGETTABLE?
- What's the one thing someone will remember?
- What visual element is unique to this context?

## Implementation Guidelines

### Typography
- **NEVER use**: Arial, Inter, Roboto, system fonts as primary
- **DO use**: Distinctive, characterful fonts
- **Pair**: Display font + refined body font
- **Examples**: 
  - Display: Playfair Display, Bebas Neue, Space Grotesk (sparingly)
  - Body: Source Serif Pro, Crimson Text, IBM Plex Sans

### Color & Theme
- Use CSS variables for consistency
- Dominant colors with sharp accents
- Avoid: Purple gradients on white (cliché AI aesthetic)
- Commit to a cohesive palette

### Motion & Animation
- Prioritize CSS-only solutions for simple effects
- Use Framer Motion for React when complex
- **Focus on high-impact moments**:
  - One well-orchestrated page load with staggered reveals
  - Scroll-triggered animations
  - Surprising hover states
- Avoid scattered micro-interactions

### Spatial Composition
- **Unexpected layouts**: Asymmetry, overlap, diagonal flow
- **Grid-breaking elements**: Elements that break the grid intentionally
- **Negative space**: Generous OR controlled density (commit to one)
- **Layering**: Create depth through z-index and shadows

### Backgrounds & Visual Details
Create atmosphere and depth:
- Gradient meshes
- Noise textures (subtle grain)
- Geometric patterns
- Layered transparencies
- Dramatic shadows
- Decorative borders
- Custom cursors

## Anti-Patterns (NEVER DO)

❌ Generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial)
- Purple gradients on white backgrounds
- Predictable card-based layouts
- Cookie-cutter dashboard designs
- Generic "tech startup" look

❌ Common convergences:
- Space Grotesk for everything
- Glassmorphism without purpose
- Neumorphism (soft UI) everywhere
- Same hero section layout

## Execution Principles

### Maximalist Designs
- Elaborate code with extensive animations
- Layered effects and textures
- Rich visual details
- Complex interactions

### Minimalist/Refined Designs
- Restraint and precision
- Careful attention to spacing
- Subtle details that reward attention
- Typography-focused

### Industrial/Utilitarian Designs
- Functional over decorative
- Exposed structure
- Worn textures and weathering
- Mechanical/technical details

## Example Aesthetic Directions

### Wasteland/Post-Apocalyptic
```
Colors: Rust orange, ash gray, toxic green, deep black
Textures: Scratches, rust, concrete, metal
Typography: Industrial sans-serif, stencil fonts
Details: Warning labels, barcode elements, hazard stripes
```

### Editorial/Magazine
```
Colors: High contrast black/white with one accent
Typography: Serif display, clean sans-serif body
Layout: Asymmetric grids, large imagery, generous whitespace
Details: Pull quotes, drop caps, fine lines
```

### Retro-Futuristic
```
Colors: Neon cyan, magenta, black, dark purple
Effects: Scanlines, CRT flicker, glow effects
Typography: Monospace, pixel fonts, chrome effects
Details: Grid overlays, starfields, wireframes
```

## Output Format

Always provide:
1. **Design Concept**: Brief explanation of aesthetic direction
2. **Color Palette**: CSS variables or hex codes
3. **Typography Choices**: Font families and usage
4. **Working Code**: Production-ready implementation
5. **Key Details**: What makes it distinctive

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
