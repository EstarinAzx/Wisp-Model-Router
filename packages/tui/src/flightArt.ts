// Draw in Braille's native 2 × 4 dot grid.
export const colors = ['#100e17', '#614980', '#895baa', '#ad77ef', '#d3a7ff', '#fff0ff']
export type Run = { text: string, ink: number }
type Point = readonly [number, number]
type Bezier = readonly [Point, Point, Point, Point]
function curve([a,b,c,d]: Bezier, steps=72) {
  return Array.from({ length: steps+1 }, (_, i): Point => {
    const t = i / steps, u = 1 - t
    const at = (k: number) => u**3*a[k] + 3*u*u*t*b[k] + 3*u*t*t*c[k] + t**3*d[k]
    return [at(0),at(1)]
  })
}
function drawing(width: number, height: number) {
  const dots = Array.from({length: height*4}, () => new Uint8Array(width*2))
  const solid = dots.map(row => new Uint8Array(row.length))
  function dot(x: number, y: number, tone: number) {
    const row = dots[Math.round(y)]
    const col = Math.round(x)
    if (row && col >= 0 && col < row.length) row[col] = Math.max(tone, row[col])
  }
  function line(path: Bezier, tone: number) {
    for (const [x,y] of curve(path,Math.max(72,Math.ceil(Math.abs(path[3][0]-path[0][0]))))) dot(x,y,tone)
  }
  function fill(points: Point[], tone: number) {
    for (let y = Math.max(0, Math.floor(Math.min(...points.map(p => p[1])))); y < height*4; y++) {
      const crossings = []
      for (let i = 0; i < points.length; i++) {
        const [x1,y1] = points[i], [x2,y2] = points[(i+1)%points.length]
        if ((y1 > y) !== (y2 > y)) crossings.push(x1 + (y-y1)*(x2-x1)/(y2-y1))
      }
      crossings.sort((a,b) => a-b)
      for (let i=0; i+1<crossings.length; i+=2) {
        for (let x=Math.max(0,Math.ceil(crossings[i])); x<=Math.min(width*2-1,crossings[i+1]); x++) solid[y][x]=tone
      }
    }
  }
  function flame(x: number,y: number,scale: number) {
    function layer(segments: Bezier[], tone: number) {
      const shape = segments.flatMap(segment=>curve(segment)).map(([u,v]): Point => [x+u*scale,y+v*scale])
      fill(shape,tone)
    }
    layer([
      [[0,11],[-10,12],[-17,5],[-12,-7]],
      [[-12,-7],[-12,0],[-6,0],[-6,-5]],
      [[-6,-5],[-8,-14],[5,-15],[4,-23]],
      [[4,-23],[16,-15],[4,-10],[6,-3]],
      [[6,-3],[11,-4],[13,-9],[12,-12]],
      [[12,-12],[20,-2],[9,11],[0,11]],
    ],3)
    layer([
      [[0,11],[-10,8],[-8,2],[-6,0]],
      [[-6,0],[-7,5],[-3,5],[-2,2]],
      [[-2,2],[-2,-6],[6,-6],[6,-13]],
      [[6,-13],[11,-8],[3,-1],[6,2]],
      [[6,2],[9,4],[9,0],[10,-1]],
      [[10,-1],[11,4],[5,10],[0,11]],
    ],4)
    layer([[[0,9],[-6,8],[-8,4],[-6,1]], [[-6,1],[-4,7],[2,3],[4,-3]], [[4,-3],[7,4],[3,8],[0,9]]],5)
  }
  function finish(): Run[][] {
    const bits = [[1,8],[2,16],[4,32],[64,128]]
    return Array.from({length:height}, (_, row) => {
      const runs: Run[] = []
      for (let col=0; col<width; col++) {
        let code=0, ink=0
        for (let v=0; v<4; v++) for (let u=0; u<2; u++) {
          const t = dots[row*4+v][col*2+u]
          if (t) { code |= bits[v][u]; ink = Math.max(ink,t) }
        }
        let ch = code ? String.fromCharCode(0x2800 + code) : ' '
        // Quadrants give the flame solid ink. Braille gives its fine wake eight dots per cell.
        let mask=0
        for (let v=0; v<2; v++) for (let u=0; u<2; u++) {
          const tone=Math.max(solid[row*4+2*v][col*2+u], solid[row*4+2*v+1][col*2+u])
          if (tone) { mask |= 1 << (2*v+u); ink=Math.max(ink,tone) }
        }
        if (mask) ch=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'[mask]
        if (runs.at(-1)?.ink === ink) runs[runs.length-1].text += ch
        else runs.push({text:ch,ink})
      }
      return runs
    })
  }
  return {line, dot, flame, finish}
}
export function routeArt(target: number) {
  const d = drawing(21,8)
  const end = 6+target*10
  d.line([[0,14],[16,15],[17,end-10],[34,end]],4)
  d.line([[6,16],[19,18],[21,end-7],[34,end+1]],2)
  d.flame(36,end-1,.26)
  return d.finish()
}
