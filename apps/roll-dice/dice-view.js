const DiceView = (() => {
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const subtract = (a, b) => a.map((value, i) => value - b[i]);
  const scale = (v, factor) => v.map((value) => value * factor);
  const cross = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
  const unit = (v) => scale(v, 1 / Math.hypot(...v));
  const center = (points) => [0, 1, 2].map((axis) =>
    points.reduce((sum, point) => sum + point[axis], 0) / points.length);

  function orderedFace(vertices, normal, midpoint) {
    const right = unit(subtract(vertices[0], midpoint));
    const up = cross(normal, right);
    const angle = (point) => {
      const offset = subtract(point, midpoint);
      return Math.atan2(dot(offset, up), dot(offset, right));
    };
    vertices.sort((a, b) => angle(a) - angle(b));
    return { vertices, midpoint, normal, right, up };
  }

  function hull(points) {
    // Each supporting plane defines one face, including coplanar vertices.
    const faces = new Map();
    for (let a = 0; a < points.length - 2; a++) {
      for (let b = a + 1; b < points.length - 1; b++) {
        for (let c = b + 1; c < points.length; c++) {
          let normal = cross(subtract(points[b], points[a]), subtract(points[c], points[a]));
          if (Math.hypot(...normal) < 1e-7) continue;
          normal = unit(normal);
          const plane = dot(normal, points[a]);
          const indices = [];
          let positive = false;
          let negative = false;
          for (const [i, point] of points.entries()) {
            const distance = dot(normal, point) - plane;
            if (distance > 1e-7) positive = true;
            else if (distance < -1e-7) negative = true;
            else indices.push(i);
            if (positive && negative) break;
          }
          if (positive && negative) continue;
          const key = indices.join(',');
          if (faces.has(key)) continue;

          const vertices = indices.map((i) => points[i]);
          const midpoint = center(vertices);
          if (dot(midpoint, normal) < 0) normal = scale(normal, -1);
          faces.set(key, orderedFace(vertices, normal, midpoint));
        }
      }
    }
    return [...faces.values()];
  }

  function dual(points) {
    return hull(points).map(({ normal, midpoint }) => scale(normal, 1 / dot(normal, midpoint)));
  }

  function hundredSidedMesh() {
    // Each point on the sphere defines one tangent plane and one numbered face.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const normals = Array.from({ length: 100 }, (_, i) => {
      const z = 1 - (2 * i + 1) / 100;
      const radius = Math.sqrt(1 - z * z);
      return [radius * Math.cos(i * goldenAngle), radius * Math.sin(i * goldenAngle), z];
    });
    const corners = hull(normals).map(({ vertices, normal, midpoint }) => ({
      vertices,
      point: scale(normal, 1 / dot(normal, midpoint)),
    }));
    const radius = Math.max(...corners.map(({ point }) => Math.hypot(...point)));
    return normals.map((normal) => {
      const vertices = corners.filter((corner) => corner.vertices.includes(normal))
        .map(({ point }) => scale(point, 1 / radius));
      // The tangent point centers each number within its face.
      return orderedFace(vertices, normal, scale(normal, 1 / radius));
    });
  }

  function bevel(faces) {
    const beveled = hull(faces.flatMap(({ vertices, midpoint }) =>
      vertices.map((vertex) => subtract(vertex, scale(subtract(vertex, midpoint), 0.18)))));
    // Preserve the original face order for numbering. The bevel faces are unnumbered.
    const numbered = faces.map(({ normal, midpoint }) =>
      beveled.find((face) => dot(normal, face.normal) > 1 - 1e-7
        && Math.abs(dot(normal, subtract(face.midpoint, midpoint))) < 1e-7));
    return [...numbered, ...beveled.filter((face) => !numbered.includes(face))];
  }

  const tetrahedron = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const cube = [...tetrahedron, ...tetrahedron.map((point) => scale(point, -1))];
  const octahedron = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].flatMap((point) =>
    [point, scale(point, -1)]);
  const phi = (1 + Math.sqrt(5)) / 2;
  const icosahedron = [-1, 1].flatMap((a) => [-phi, phi].flatMap((b) =>
    [[0, a, b], [b, 0, a], [a, b, 0]]));
  const antiprism = [-1, 1].flatMap((z, ring) =>
    Array.from({ length: 5 }, (_, i) => {
      const angle = (2 * i + ring) * Math.PI / 5;
      return [Math.cos(angle), Math.sin(angle), z * 0.76];
    }));
  // The side planes of the antiprism give the ten perimeter vertices. Its cap
  // planes give the two tips of the ten-sided die.
  const d10 = dual(antiprism);
  const meshes = new Map(Object.entries({
    4: tetrahedron, 6: cube, 8: octahedron, 10: d10, 12: dual(icosahedron), 20: icosahedron,
  }).map(([sides, vertices]) => {
    const radius = Math.max(...vertices.map((vertex) => Math.hypot(...vertex)));
    return [Number(sides), bevel(hull(vertices.map((vertex) => scale(vertex, 1 / radius))))];
  }));
  const light = unit([-0.4, 0.65, 1]);

  function draw(ctx, mesh, faceIndex, labels, progress, direction) {
    const target = mesh[faceIndex];
    const isTenSided = labels.length === 10;
    const isHundredSided = labels.length === 100;
    const spin = (1 - progress) ** 1.7;
    const bounce = Math.abs(Math.sin(progress * Math.PI * 3)) * spin;
    // The camera looks straight down the Z axis. Only the die rotates.
    const pitch = spin * 9 * direction;
    const yaw = spin * 12;
    const roll = spin * 5 * direction;
    const [cp, sp, cy, sy, cr, sr] = [
      Math.cos(pitch), Math.sin(pitch), Math.cos(yaw), Math.sin(yaw), Math.cos(roll), Math.sin(roll),
    ];
    function rotate(point) {
      const [x, y, z] = [dot(point, target.right), dot(point, target.up), dot(point, target.normal)];
      const vertical = y * cp - z * sp;
      const depth = y * sp + z * cp;
      const horizontal = x * cy + depth * sy;
      return [horizontal * cr - vertical * sr, horizontal * sr + vertical * cr, depth * cy - x * sy];
    }

    const offsetX = direction * spin * 19;
    const offsetY = -12 * spin;
    const project = ([x, y, z]) => {
      const perspective = 43 / (1 - (z + bounce * 0.65) / 4);
      return [64 + offsetX + x * perspective, 64 + offsetY - y * perspective];
    };

    ctx.clearRect(0, 0, 128, 128);
    const shadowX = 69 + offsetX + bounce * 12;
    const shadowY = 71 + offsetY + bounce * 13;
    const shadowRadius = 46 + bounce * 6;
    const shadow = ctx.createRadialGradient(shadowX, shadowY, 14, shadowX, shadowY, shadowRadius);
    shadow.addColorStop(0, `rgba(6, 3, 12, ${0.62 - bounce * 0.3})`);
    shadow.addColorStop(1, 'rgba(6, 3, 12, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(shadowX, shadowY, shadowRadius, 0, Math.PI * 2);
    ctx.fill();

    const cameraDepth = 4 - bounce * 0.65;
    const visible = mesh.map((face, i) => ({
      i, face, normal: rotate(face.normal), midpoint: rotate(face.midpoint),
    })).filter(({ normal, midpoint }) => cameraDepth * normal[2] > dot(normal, midpoint))
      .sort((a, b) => a.midpoint[2] - b.midpoint[2]);

    for (const { face, i, normal, midpoint } of visible) {
      const corners = face.vertices.map((vertex) => project(rotate(vertex)));
      const brightness = Math.max(0, dot(normal, light));
      ctx.beginPath();
      corners.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      const gradient = ctx.createLinearGradient(20, 15, 104, 115);
      gradient.addColorStop(0, `hsl(267 48% ${35 + brightness * 32}%)`);
      gradient.addColorStop(1, `hsl(280 49% ${19 + brightness * 26}%)`);
      ctx.fillStyle = gradient;
      ctx.fill();
      const edgeOpacity = 0.25 * (0.18 + brightness * 0.35);
      ctx.strokeStyle = `rgba(221, 199, 248, ${edgeOpacity})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      if (labels[i] === undefined || normal[2] < 0.25) continue;
      const [x, y] = project(midpoint);
      const right = rotate(face.right);
      const up = rotate(face.up);
      ctx.save();
      ctx.clip();
      ctx.transform(right[0], -right[1], -up[0], up[1], x, y);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const settled = isTenSided || isHundredSided ? Math.max(0, (progress - 0.72) / 0.28) : 0;
      const isWinningFace = i === faceIndex;
      const fontSize = isHundredSided
        ? 7 + (isWinningFace ? 4 * settled : 0)
        : 19 + settled * (isWinningFace ? 5 : -3);
      ctx.globalAlpha = isWinningFace ? 1 : 1 - settled * 0.38;
      ctx.font = `bold ${fontSize}px system-ui`;
      ctx.strokeStyle = '#25143b';
      ctx.lineWidth = isHundredSided ? 0.8 : 2;
      const label = labels.length > 6 && labels[i] === 6 ? '6.' : String(labels[i]);
      const textWidth = isHundredSided ? 15 : 128;
      ctx.strokeText(label, 0, 0, textWidth);
      ctx.fillStyle = '#fff5df';
      ctx.fillText(label, 0, 0, textWidth);
      ctx.restore();
    }
  }

  let frame;
  function render(tray, dice, faces) {
    cancelAnimationFrame(frame);
    if (faces === 100 && !meshes.has(faces)) meshes.set(faces, hundredSidedMesh());
    const mesh = meshes.get(faces);
    const labels = Array.from({ length: faces }, (_, i) => i + 1);
    const models = dice.slice(0, 12).map((value, index) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'die';
      if (faces === 100) canvas.classList.add('die-d100');
      const resolution = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = canvas.height = Math.round(128 * resolution);
      const context = canvas.getContext('2d');
      context?.scale(resolution, resolution);
      return { canvas, context, faceIndex: value - 1, direction: index % 2 ? -1 : 1 };
    });

    tray.replaceChildren(...models.map(({ canvas }) => canvas));
    if (dice.length > models.length) {
      const remaining = document.createElement('span');
      remaining.className = 'remaining-dice';
      remaining.textContent = `+${dice.length - models.length}`;
      tray.append(remaining);
    }

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    function animate(now) {
      let rolling = false;
      models.forEach(({ context, faceIndex, direction }, index) => {
        if (!context) return;
        const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (now - start - index * 24) / 800));
        rolling ||= progress < 1;
        draw(context, mesh, faceIndex, labels, progress, direction);
      });
      if (rolling) frame = requestAnimationFrame(animate);
    }
    animate(start);
  }

  return { render };
})();
