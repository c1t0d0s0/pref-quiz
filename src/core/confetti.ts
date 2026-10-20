// 高得点のときに画面いっぱいに舞う、チョーク色の紙ふぶき

const COLORS = ['#F4F1E8', '#F4A6B8', '#9FD3F0', '#F7E07B', '#A8E6A1', '#F6B97A'];
const COUNT = 90;
const DURATION = 4500; // ミリ秒

/** canvas に紙ふぶきを DURATION のあいだ降らせる。返り値の関数を呼ぶと途中で止める */
export function startConfetti(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 10 + 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 2 - 1,
    rotation: Math.random() * 360,
    rotSpeed: Math.random() * 4 - 2,
  }));

  const startTime = Date.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    }
    if (Date.now() - startTime < DURATION) frame = requestAnimationFrame(render);
    else stop();
  };
  render();
  return stop;
}
