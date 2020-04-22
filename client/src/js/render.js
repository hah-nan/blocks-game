import camera from './camera.js'
import chat from './chat.js'
import feedback from './feedback.js'

function update() {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'none';

  ctx.filter = "drop-shadow(4px 4px 8px #fff)";
  ctx.filter = "none"
  let vertices = [...w.game.objects].reduce((prev, object) => {
    if(object.removed) return prev
    if(object.tags.filled) return prev
    if(object.tags.invisible) return prev
    let extraProps = {}
    if(object.tags.glowing) {
      extraProps.glow = 3
      extraProps.thickness = 2
      extraProps.color = 'white'
    }
    if(object.color) extraProps.color = object.color
		prev.push({a:{x:object.x,y:object.y}, b:{x:object.x + object.width,y:object.y}, ...extraProps})
		prev.push({a:{x:object.x + object.width,y:object.y}, b:{x:object.x + object.width,y:object.y + object.height}, ...extraProps})
		prev.push({a:{x:object.x + object.width,y:object.y + object.height}, b:{x:object.x,y:object.y + object.height}, ...extraProps})
		prev.push({a:{x:object.x,y:object.y + object.height}, b:{x:object.x,y:object.y}, ...extraProps})
		return prev
	}, [])

  //reset background
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//set camera so we render everything in the right place
  camera.set(ctx, window.hero)

	w.game.world.renderStyle = 'outlines'
 	if (w.game.world.renderStyle === 'outlines') {
		ctx.strokeStyle = "#999";
		for(var i=0;i<vertices.length;i++){
			camera.drawVertice(ctx, vertices[i])
		}
		ctx.fillStyle = 'white';
		camera.drawObject(ctx, window.hero)
    for(let i = 0; i < w.game.objects.length; i++){
      if(!w.game.objects[i].tags.filled) continue
      if(w.game.objects[i].removed) continue
      if(w.game.objects[i].tags.invisible) continue
      camera.drawObject(ctx, w.game.objects[i])
    }
	} else if(w.game.world.renderStyle === 'physics'){
		physics.drawSystem(ctx, vertices)
	} else {
		for(let i = 0; i < w.game.objects.length; i++){
      if(w.game.objects[i].removed) continue
      if(w.game.objects[i].tags.invisible) continue
			camera.drawObject(ctx, w.game.objects[i])
		}
	}

  for(var heroId in w.game.heros) {
    if(heroId === window.hero.id) continue;
    let currentHero = w.game.heros[heroId];
    camera.drawObject(ctx, currentHero);
  }

  w.game.world.shadows = false
  if(w.game.world.shadows === true) {
    shadow.draw(ctx, vertices, hero)
  }

  w.game.objects.forEach((obj) => {
    if(obj.name) {
      if(obj.nameCenter) camera.drawNameCenter(ctx, obj)
      if(obj.nameAbove) camera.drawNameAbove(ctx, obj)
    }
  })

  ctx.font =`24pt Arial`
	ctx.fillStyle="rgba(255,255,255,0.3)"
  ctx.fillText(Math.ceil(window.fps), window.CONSTANTS.PLAYER_CANVAS_WIDTH - 50, 40)

  if(window.ghost) {
    ctx.font =`24pt Arial`
    ctx.fillStyle="rgba(255,255,255,0.3)"
    ctx.fillText('Ghost View Id: ' + window.hero.id, 10, 40)
  }

  chat.render(ctx);
	feedback.draw(ctx);
}

export default {
  update
}
