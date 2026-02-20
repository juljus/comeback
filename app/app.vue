<template>
  <LocaleToggle />
  <NuxtPage />
</template>

<style>
html {
  font-size: 18px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Georgia', 'Times New Roman', serif;
  background: #f5f0e6;
  color: #3d3029;
  -webkit-font-smoothing: antialiased;
}

/* ── Global CSS tooltip system ── */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.2rem 0.4rem;
  background: #3d3029;
  color: #faf6ee;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 0.6rem;
  line-height: 1.3;
  white-space: nowrap;
  border: 1px solid #5a4a3a;
  border-radius: 2px;
  pointer-events: none;
  opacity: 0;
  z-index: 1000;
}

[data-tooltip]::after {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #3d3029;
  pointer-events: none;
  opacity: 0;
  z-index: 1000;
}

[data-tooltip]:hover::before,
[data-tooltip]:hover::after {
  opacity: 1;
}
</style>
