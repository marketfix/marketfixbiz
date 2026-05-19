(() => {
  const root = document.documentElement;
  const shell = document.getElementById('cardShell');
  const card = document.getElementById('businessCard');
  const flipToBack = document.getElementById('flipToBack');
  const flipToFront = document.getElementById('flipToFront');
  const copyButton = document.getElementById('copyEmail');
  const motionButton = document.getElementById('motionButton');
  const toast = document.getElementById('toast');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let toastTimer;
  let hasMotion = false;

  const setTilt = (x, y) => {
    if (reduceMotion) return;
    const rx = clamp(-y * 9, -10, 10);
    const ry = clamp(x * 11, -12, 12);
    const mx = clamp(50 + x * 34, 8, 92);
    const my = clamp(42 + y * 30, 8, 92);
    const glow = clamp(0.35 + Math.abs(x) * 0.34 + Math.abs(y) * 0.22, 0.35, 0.92);

    root.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    root.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    root.style.setProperty('--mx', `${mx.toFixed(2)}%`);
    root.style.setProperty('--my', `${my.toFixed(2)}%`);
    root.style.setProperty('--glow', glow.toFixed(2));
  };

  const resetTilt = () => setTilt(0, 0);

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  };

  shell.addEventListener('pointermove', (event) => {
    if (hasMotion) return;
    const rect = shell.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt(x, y);
  });

  shell.addEventListener('pointerleave', () => {
    if (!hasMotion) resetTilt();
  });

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
    const x = clamp(event.gamma / 28, -1, 1);
    const y = clamp((event.beta - 45) / 32, -1, 1);
    setTilt(x, y);
  };

  const enableMotion = async () => {
    if (!('DeviceOrientationEvent' in window)) {
      showToast('Motion is not available here');
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          showToast('Motion permission not granted');
          return;
        }
      }

      window.addEventListener('deviceorientation', handleOrientation, true);
      hasMotion = true;
      motionButton.textContent = 'Motion shine enabled';
      motionButton.disabled = true;
      showToast('Move your phone to catch the light');
    } catch (_) {
      showToast('Motion could not be enabled');
    }
  };

  motionButton.addEventListener('click', enableMotion);

  if (!('DeviceOrientationEvent' in window)) {
    motionButton.hidden = true;
  }

  resetTilt();
})();
