(() => {
  const root = document.documentElement;
  const shell = document.getElementById('cardShell');
  const card = document.getElementById('businessCard');
  const flipToBack = document.getElementById('flipToBack');
  const flipToFront = document.getElementById('flipToFront');
  const copyButton = document.getElementById('copyEmail');
  const toast = document.getElementById('toast');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const state = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, toastTimer: 0 };

  const applyTilt = () => {
    state.x += (state.tx - state.x) * 0.1;
    state.y += (state.ty - state.y) * 0.1;

    const rx = clamp(-state.y * 8, -9, 9);
    const ry = clamp(state.x * 10, -11, 11);
    const mx = clamp(50 + state.x * 34, 8, 92);
    const my = clamp(42 + state.y * 30, 8, 92);
    const glow = clamp(0.35 + Math.abs(state.x) * 0.32 + Math.abs(state.y) * 0.2, 0.35, 0.88);

    root.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    root.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    root.style.setProperty('--mx', `${mx.toFixed(2)}%`);
    root.style.setProperty('--my', `${my.toFixed(2)}%`);
    root.style.setProperty('--glow', glow.toFixed(2));

    if (Math.abs(state.tx - state.x) > 0.001 || Math.abs(state.ty - state.y) > 0.001) {
      state.raf = requestAnimationFrame(applyTilt);
    } else {
      state.raf = 0;
    }
  };

  const setTarget = (x, y) => {
    if (reduceMotion) return;
    state.tx = clamp(x, -1, 1);
    state.ty = clamp(y, -1, 1);
    if (!state.raf) state.raf = requestAnimationFrame(applyTilt);
  };

  const setTargetFromPoint = (clientX, clientY) => {
    const rect = shell.getBoundingClientRect();
    setTarget(((clientX - rect.left) / rect.width - 0.5) * 2, ((clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1600);
  };

  shell.addEventListener('pointermove', (event) => setTargetFromPoint(event.clientX, event.clientY), { passive: true });
  shell.addEventListener('pointerleave', () => setTarget(0, 0));
  shell.addEventListener('touchmove', (event) => {
    const touch = event.touches && event.touches[0];
    if (touch) setTargetFromPoint(touch.clientX, touch.clientY);
  }, { passive: true });
  shell.addEventListener('touchend', () => setTarget(0, 0), { passive: true });

  const setFlipped = (isFlipped) => {
    card.classList.toggle('is-flipped', isFlipped);
    flipToBack.setAttribute('aria-pressed', String(isFlipped));
  };

  flipToBack.addEventListener('click', () => setFlipped(true));
  flipToFront.addEventListener('click', () => setFlipped(false));

  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied');
    } catch (_) {
      window.location.href = `mailto:${email}`;
    }
  });

  const handleOrientation = (event) => {
    if (event.gamma === null || event.beta === null) return;
    setTarget(clamp(event.gamma / 28, -1, 1), clamp((event.beta - 45) / 32, -1, 1));
  };

  if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  setTarget(0, 0);
})();
