---
name: "interaction-design"
description: "Specialized skill for designing user interactions, animations, and micro-interactions. Invoke when user needs motion design, state transitions, or interactive prototypes."
---

# Interaction Design Skill

Specialized skill for designing user interactions, animations, and micro-interactions that bring interfaces to life.

## When to Invoke

- Designing animations and transitions
- Creating interactive prototypes
- Need micro-interactions
- Page load sequences
- Scroll-based animations
- Hover and click effects
- Gesture interactions
- State change animations

## Core Principles

### 1. Purposeful Motion
Every animation should:
- Guide attention
- Provide feedback
- Show relationships
- Create delight

### 2. Timing & Easing
- **Duration**: 200-300ms for micro-interactions, 400-600ms for larger transitions
- **Easing**: Use ease-out for entering, ease-in for exiting
- **Stagger**: 50-100ms delay between sequential items
- **Consistency**: Same timing for similar actions

### 3. Performance
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

## Animation Types

### Micro-interactions
```css
/* Button hover */
.button {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Loading spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
}
```

### Page Transitions
```css
/* Fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
```

### Scroll Animations
```javascript
// Intersection Observer for scroll triggers
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, { threshold: 0.1 });
```

### Stagger Effects
```css
/* Stagger children */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
```

## Common Patterns

### Button Interactions
- Hover: Lift + shadow
- Active: Press down
- Loading: Spinner + disabled
- Success: Checkmark animation

### Form Interactions
- Input focus: Border color + subtle glow
- Validation: Shake on error, check on success
- Submit: Loading state, success confirmation

### Card Interactions
- Hover: Lift + shadow increase
- Click: Scale down briefly
- Expand: Smooth height transition

### Modal/Dialog
- Open: Fade in + scale up
- Close: Fade out + scale down
- Backdrop: Fade in separately

### List Items
- Enter: Slide in from side
- Exit: Slide out + fade
- Reorder: Smooth position transition

## Tools & Libraries

### CSS Only
- `@keyframes` for complex animations
- `transition` for simple state changes
- CSS custom properties for dynamic values

### React
- **Framer Motion**: Declarative animations
- **React Spring**: Physics-based animations
- **GSAP**: Complex timeline animations

### Vanilla JS
- **GSAP**: Industry standard
- **Anime.js**: Lightweight alternative
- **Lottie**: Complex vector animations

## Implementation Guidelines

### CSS Animations
```css
/* Good: GPU accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Bad: Triggers layout */
.element {
  left: 100px;
  width: 200px;
}
```

### React/Framer Motion
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>
```

### Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Design Process

1. **Identify Opportunities**
   - Where can motion add value?
   - What feedback is missing?
   - What relationships need clarity?

2. **Sketch Animations**
   - Storyboard key transitions
   - Define timing and easing
   - Consider sequence and overlap

3. **Prototype**
   - Build in code or tools
   - Test on target devices
   - Iterate on timing

4. **Implement**
   - Choose appropriate technology
   - Optimize for performance
   - Add reduced-motion support

5. **Test**
   - Test on low-end devices
   - Verify 60fps
   - Check accessibility

## Common Mistakes

❌ **Over-animating**
- Too many simultaneous animations
- Distracting rather than helpful

❌ **Inconsistent timing**
- Different durations for similar actions
- Confusing user expectations

❌ **Blocking interactions**
- Animations that prevent user input
- Long transitions without purpose

❌ **Performance issues**
- Animating layout properties
- Not using GPU acceleration

## Output Format

1. **Animation Specs**
   - Duration values
   - Easing functions
   - Stagger delays
   - Keyframe definitions

2. **Implementation Code**
   - CSS or library code
   - Component integration
   - Performance optimizations

3. **Interaction Flow**
   - State diagrams
   - Trigger conditions
   - Edge cases
