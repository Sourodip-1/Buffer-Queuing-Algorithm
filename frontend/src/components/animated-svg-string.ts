export const animatedSvgString = `
<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1774 887" width="100%" height="100%">
  <defs>
    <style>
      /* --- LOGO STYLES --- */
      .a { fill: #41a4ea; stroke: #fff; paint-order: stroke fill markers; stroke-linejoin: round; stroke-width: 34; }
      .b { fill: #fff; }
      
      /* --- BACKGROUND --- */
      .bg { fill: transparent; }

      /* --- ANIMATION SETTINGS --- */
      .dot {
        fill: #41a4ea;
      }
      
      .dot, .goo-logo-wrapper, .crisp-logo-wrapper {
        animation-duration: 6s;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        animation-iteration-count: 1;
        animation-fill-mode: forwards;
      }

      .goo-group { filter: url(#goo); }

      /* 
       * DOT ANIMATIONS (ACCELERATED SHRINK)
       * The dots now scale all the way down to 0 by 78%. 
       * This rapid shrink guarantees the gooey bridges between the F's 
       * snap smoothly and immediately, leaving no lingering artifacts.
       */
      @keyframes d1 {
        0%, 2%   { opacity: 0; transform: translate(887px, 750px) scale(0); }
        20%      { opacity: 1; transform: translate(500px, 300px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(350px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(350px, 443px) scale(0); opacity: 0; }
      }
      @keyframes d2 {
        0%, 5%   { opacity: 0; transform: translate(887px, 750px) scale(0); }
        22%      { opacity: 1; transform: translate(650px, 360px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(564px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(564px, 443px) scale(0); opacity: 0; }
      }
      @keyframes d3 {
        0%, 8%   { opacity: 0; transform: translate(887px, 750px) scale(0); }
        24%      { opacity: 1; transform: translate(800px, 280px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(778px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(778px, 443px) scale(0); opacity: 0; }
      }
      @keyframes d4 {
        0%, 11%  { opacity: 0; transform: translate(887px, 750px) scale(0); }
        26%      { opacity: 1; transform: translate(950px, 390px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(992px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(992px, 443px) scale(0); opacity: 0; }
      }
      @keyframes d5 {
        0%, 14%  { opacity: 0; transform: translate(887px, 750px) scale(0); }
        28%      { opacity: 1; transform: translate(1100px, 310px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(1206px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(1206px, 443px) scale(0); opacity: 0; }
      }
      @keyframes d6 {
        0%, 17%  { opacity: 0; transform: translate(887px, 750px) scale(0); }
        30%      { opacity: 1; transform: translate(1250px, 360px) scale(1); }
        45%, 52% { transform: translate(887px, 443px) scale(3.5); opacity: 1; }
        65%, 70% { transform: translate(1420px, 443px) scale(1.5); opacity: 1; }
        78%, 100%{ transform: translate(1420px, 443px) scale(0); opacity: 0; }
      }

      /* 
       * THE MORPH BRIDGE (QUICKER SETTLE)
       * Fades out slightly faster (by 84%) so that the solid blue shape 
       * gets out of the way, perfectly revealing the white hole inside the 'e'.
       */
      .goo-logo-wrapper {
        transform-origin: 887px 443px;
        animation-name: goo-reveal;
        opacity: 0;
      }
      @keyframes goo-reveal {
        0%, 65%   { opacity: 0; transform: scale(0.9); }
        72%       { opacity: 1; transform: scale(1.03); } 
        78%       { opacity: 1; transform: scale(1); }    
        84%, 100% { opacity: 0; transform: scale(0.99); } 
      }

      /* 
       * THE FINAL CRISP LOGO
       * Times perfectly with the bridge fading out, allowing the cutouts 
       * to emerge exactly as the liquid recedes.
       */
      .crisp-logo-wrapper {
        transform-origin: 887px 443px;
        animation-name: crisp-reveal;
        opacity: 0;
      }
      @keyframes crisp-reveal {
        0%, 74%   { opacity: 0; }
        82%, 100% { opacity: 1; } 
      }

      /* Assign animations */
      .dot1 { animation-name: d1; }
      .dot2 { animation-name: d2; }
      .dot3 { animation-name: d3; }
      .dot4 { animation-name: d4; }
      .dot5 { animation-name: d5; }
      .dot6 { animation-name: d6; }
    </style>

    <!-- Liquid Matrix -->
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -13" result="goo" />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>

  <!-- Canvas Background - CHANGED TO TRANSPARENT -->
  <rect class="bg" width="1774" height="887" />

  <!-- LAYER 1: THE LIQUID MORPH ENGINE -->
  <g class="goo-group">
    <!-- The 6 dynamic dots -->
    <circle class="dot dot1" cx="0" cy="0" r="45" />
    <circle class="dot dot2" cx="0" cy="0" r="40" />
    <circle class="dot dot3" cx="0" cy="0" r="38" />
    <circle class="dot dot4" cx="0" cy="0" r="38" />
    <circle class="dot dot5" cx="0" cy="0" r="40" />
    <circle class="dot dot6" cx="0" cy="0" r="45" />

    <!-- Solid blue shape (No strokes) to catch the dots seamlessly -->
    <g class="goo-logo-wrapper">
      <path fill="#41a4ea" stroke="none" d="m357.4 669.9h-237.4v-469.7h229.6q48.7 0 81.9 16.1 34.2 15.7 51 43.6 18.3 27.8 18.3 64 0 31.3-12.2 52.8-11.1 21-31.6 33.5-20.4 12.1-46.8 16.6v5.3q32 4.1 54.2 17.7 23.2 13.2 34.9 36.9 12.4 22.8 12.4 55.5 0 37.8-18.4 66.6-17.6 28.7-52.4 45-34.1 16.1-83.5 16.1zm39.1-331.3q0-26.4-17.3-39.1-16.5-12.9-47.4-12.9h-108.6v103.8h107.7q30.9 0 47.6-12.4 18-13.4 18-39.4zm-173.3 133.7v111.2h117.7q31.8 0 49-13.6 18.2-14.4 18.2-41.5 0-28-18.8-41.7-18.6-14.4-50.2-14.4zm589.9-137.9v335.5h-88.9l-6.9-36.9q-16.3 19-39 30.9-22.5 10.7-49.1 10.7-37.8 0-65.6-16.8-27.7-17-43-49-15.1-32.6-15.1-78.7v-195.7h97.5v183.9q0 33.6 13.6 51.6 14 17.2 42 17.2 27.3 0 41.9-17.8 15-18.3 15-52.1v-182.8zm25.9 0v-24.9q0-47.6 17.1-75.7 18.1-29.3 51-40.3 33.9-12.3 82.2-6.7v86.6q-27.1-3.8-40.6 8-12.2 10.6-12.2 35.2v17.8h55.8v86.4h-55.8v249.1h-97.5v-249.1h-38.8v-86.4zm159 0v-24.9q0-47.6 17.2-75.7 18.1-29.3 51-40.3 33.9-12.3 82.2-6.7v86.6q-27.1-3.8-40.6 8-12.2 10.6-12.2 35.2v17.8h55.7v86.4h-55.7v249.1h-97.6v-249.1h-38.7v-86.4zm289.8 340.2q-51.4 0-90.4-21.5-37.8-22.3-59-61.7-21-39.8-21-92.4 0-49.4 21-87.4 21-38.5 58.3-59.8 37.4-22.1 85.5-22.1 49.9 0 86.3 20.8 37.8 20.4 58.4 58.4 20.8 36.9 20.8 86.8 0 7.6-1.3 16.5-0.3 8.7-1.6 19.2h-222.9q3.1 18.4 12.4 31.8 10 13.1 24.2 20.8 14.9 6.4 33.3 6.4 21.3 0 37.8-8.4 16.9-9.3 25.2-25l87.3 23.7q-20.2 45.2-60.8 69.7-39.6 24.2-93.5 24.2zm-64.8-206.7h118.2q-0.7-16.5-8.9-28.8-7.7-13.5-20.8-20.8-12.5-7.5-28.4-7.1-15 0.5-28 8.4-12.4 6.6-21.5 19.5-8.4 12.2-10.6 28.8zm217.4 202v-335.5h88.6l6.7 44.3q13.2-17.7 30.8-28.9 17.8-11.8 39.6-16.1 22-4.2 47.9 0.7v92q-17.7-5.6-37.9-2.8-20 1.9-38.2 13.5-17.6 10.5-28.9 32.2-11 21.1-11 54.1v146.5z"/>
    </g>
  </g>

  <!-- LAYER 2: THE FINAL CRISP LOGO -->
  <!-- Contains the sharp styling, white strokes, and white cutouts -->
  <g class="crisp-logo-wrapper">
    <path class="a" d="m357.4 669.9h-237.4v-469.7h229.6q48.7 0 81.9 16.1 34.2 15.7 51 43.6 18.3 27.8 18.3 64 0 31.3-12.2 52.8-11.1 21-31.6 33.5-20.4 12.1-46.8 16.6v5.3q32 4.1 54.2 17.7 23.2 13.2 34.9 36.9 12.4 22.8 12.4 55.5 0 37.8-18.4 66.6-17.6 28.7-52.4 45-34.1 16.1-83.5 16.1zm39.1-331.3q0-26.4-17.3-39.1-16.5-12.9-47.4-12.9h-108.6v103.8h107.7q30.9 0 47.6-12.4 18-13.4 18-39.4zm-173.3 133.7v111.2h117.7q31.8 0 49-13.6 18.2-14.4 18.2-41.5 0-28-18.8-41.7-18.6-14.4-50.2-14.4zm589.9-137.9v335.5h-88.9l-6.9-36.9q-16.3 19-39 30.9-22.5 10.7-49.1 10.7-37.8 0-65.6-16.8-27.7-17-43-49-15.1-32.6-15.1-78.7v-195.7h97.5v183.9q0 33.6 13.6 51.6 14 17.2 42 17.2 27.3 0 41.9-17.8 15-18.3 15-52.1v-182.8zm25.9 0v-24.9q0-47.6 17.1-75.7 18.1-29.3 51-40.3 33.9-12.3 82.2-6.7v86.6q-27.1-3.8-40.6 8-12.2 10.6-12.2 35.2v17.8h55.8v86.4h-55.8v249.1h-97.5v-249.1h-38.8v-86.4zm159 0v-24.9q0-47.6 17.2-75.7 18.1-29.3 51-40.3 33.9-12.3 82.2-6.7v86.6q-27.1-3.8-40.6 8-12.2 10.6-12.2 35.2v17.8h55.7v86.4h-55.7v249.1h-97.6v-249.1h-38.7v-86.4zm289.8 340.2q-51.4 0-90.4-21.5-37.8-22.3-59-61.7-21-39.8-21-92.4 0-49.4 21-87.4 21-38.5 58.3-59.8 37.4-22.1 85.5-22.1 49.9 0 86.3 20.8 37.8 20.4 58.4 58.4 20.8 36.9 20.8 86.8 0 7.6-1.3 16.5-0.3 8.7-1.6 19.2h-222.9q3.1 18.4 12.4 31.8 10 13.1 24.2 20.8 14.9 6.4 33.3 6.4 21.3 0 37.8-8.4 16.9-9.3 25.2-25l87.3 23.7q-20.2 45.2-60.8 69.7-39.6 24.2-93.5 24.2zm-64.8-206.7h118.2q-0.7-16.5-8.9-28.8-7.7-13.5-20.8-20.8-12.5-7.5-28.4-7.1-15 0.5-28 8.4-12.4 6.6-21.5 19.5-8.4 12.2-10.6 28.8zm217.4 202v-335.5h88.6l6.7 44.3q13.2-17.7 30.8-28.9 17.8-11.8 39.6-16.1 22-4.2 47.9 0.7v92q-17.7-5.6-37.9-2.8-20 1.9-38.2 13.5-17.6 10.5-28.9 32.2-11 21.1-11 54.1v146.5z"/>
    <path fill-rule="evenodd" class="b" d="m813 334v87h-21v-87z"/>
    <path fill-rule="evenodd" class="b" d="m980 332v92h-21v-92z"/>
  </g>
</svg>
`;
