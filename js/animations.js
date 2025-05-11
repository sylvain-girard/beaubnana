gsap.registerPlugin(SplitText, ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const introTexts = document.querySelectorAll('.intro-text_text');

  introTexts.forEach(textElement => {
    SplitText.create(textElement, {
      type: "chars, words", // We only need to split by characters for this effect
      // charsClass: "intro-char", // You can add a class to the characters if needed for styling
      onSplit(self) {
        // self.chars is an array of the individual character elements

        // Set initial opacity for the characters
        gsap.set(self.chars, { opacity: 0.1 });

        // Animate opacity on scroll
        gsap.to(self.chars, {
          opacity: 1,
          stagger: 0.05, // Small delay between each character's animation
          scrollTrigger: {
            trigger: textElement, // The parent element triggers the animation
            start: 'top 70%',    // Animation starts when the top of the element is 80% from the top of the viewport
            end: 'bottom 30%',   // Animation ends when the bottom of the element is 20% from the bottom of the viewport
            scrub: true,         // Smoothly scrubs the animation in both directions based on scroll
            markers: false,      // Set to true for debugging ScrollTrigger
          }
        });
      }
    });
  });
}); 