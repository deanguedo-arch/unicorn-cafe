from collections import deque
# Find the main alpha-connected silhouette; crop only, never redraw pixels.
def main_bounds(im):
 a=im.getchannel('A');w,h=im.size;pix=a.load();seen=set();best=[]
 for y in range(h):
  for x in range(w):
   if (x,y) in seen or pix[x,y]<=16:continue
   q=deque([(x,y)]);seen.add((x,y));comp=[]
   while q:
    px,py=q.popleft();comp.append((px,py))
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
     nx,ny=px+dx,py+dy
     if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen and pix[nx,ny]>16:seen.add((nx,ny));q.append((nx,ny))
   if len(comp)>len(best):best=comp
 xs=[p[0] for p in best];ys=[p[1] for p in best]
 return (max(0,min(xs)-2),max(0,min(ys)-2),min(w,max(xs)+3),min(h,max(ys)+3))
