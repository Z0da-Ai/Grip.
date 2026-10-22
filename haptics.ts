// Vibration API & Web Haptics support for Mobile & PWA experience
export const hapticFeedback = {
  // Light tick for buttons, tabs, switches
  light() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  },

  // Medium impact for task completion, adding items
  medium() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
  },

  // Heavy snap for locking, alarm activation, chain snaps
  heavy() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 60]);
      } catch {
        // ignore
      }
    }
  },

  // Wake-up alarm pulsing pattern
  alarm() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 600]);
      } catch {
        // ignore
      }
    }
  },

  // Success celebration rhythm
  success() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 40, 30]);
      } catch {
        // ignore
      }
    }
  },
};
