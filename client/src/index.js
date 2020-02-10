// onCollisionOptions - collides, - 1score, +1 score, you respawn, bad dude respawns, trigger pathfinding
// make size of player size, yours is a white pixel.
// test physics collisions to breaking point and find BVH bug
// make it easier to edit objects
// make it easier for admin to clear/move specific objects
// set game boundaries for both performance and hero position reset
// grid world pathfinding
// preset worlds
// Change 'spawn point'
// shadow player ( that editor can play with in their own simulation )
// instead of just instant grid just have an instant option
// treasure chest delayed queued updates
// toggle for score

// procedural

// an out of bounds selector for object garbage collection
// basic physics or properties within the grid system
// MORE PRESETS. On ice is basically just switching between position and velocity input prop...
// a preset for the camera to be exact specifications based on spawn point.
// optimize shadow feature, not all vertices!
// CREATE A FULL GAME LOOP
import './styles/index.scss'
import './styles/jsoneditor.css'
import chat from './js/chat.js'
import physics from './js/physics.js'
import input from './js/input.js'
import camera from './js/camera.js'
import playEditor from './js/playeditor.js'
import shadow from './js/shadow.js'
import shoot from './js/shoot.js'
import intelligence from './js/intelligence.js'
import grid from './js/grid.js'
// import objects from './js/objects.js'
import battle from './js/battle.js'
import feedback from './js/feedback.js'
import io from 'socket.io-client'

window.divideScreenSizeBy = 3
const socket = io('192.168.0.14:8081')
window.socket = socket
window.preferences = {}
window.objects = []
window.CONSTANTS = {
	PLAYER_CANVAS_WIDTH: 1920/window.divideScreenSizeBy,
	PLAYER_CANVAS_HEIGHT: 1080/window.divideScreenSizeBy,
}

window.usePlayEditor = localStorage.getItem('useMapEditor') === 'true'

if(window.usePlayEditor) {
	 window.socket.on('onUpdateObjects', (updatedObjects) => {
		 Object.assign(window.objects, updatedObjects)
	 })
} else {
	window.socket.emit('askObjects')
	window.socket.on('onAddObjects', (objectsAdded) => {
		if(window.hero.inputControlProp === 'grid') {
			objectsAdded.forEach((object) => {
				grid.snapObjectToGrid(object)
			})
		}
		window.objects.push(...objectsAdded)
		objectsAdded.forEach((object) => {
			physics.addObject(object)
		})
	})
	window.socket.on('onResetObjects', (updatedObjects) => {
		window.objects.forEach((object) => {
			physics.removeObject(object)
		})
		window.objects.length = 0
		window.location.reload()
	})
}



// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.CONSTANTS.PLAYER_CANVAS_WIDTH;
canvas.height = window.CONSTANTS.PLAYER_CANVAS_HEIGHT;
canvas.id = 'game'
document.body.appendChild(canvas);

// Game objects
const defaultHero = {
	width: 100/window.divideScreenSizeBy,
	height: 100/window.divideScreenSizeBy,
  paused: false,
	id: 'hero',
  x: 50 , y: 250,
	velocityX: 0,
	velocityY: 0,
	velocityMax: 250,
	accY: 0,
	accX: 0,
	accDecayX: 0,
	accDecayY: 0,
	speed: 250,
	inputControlProp: 'position',
	jumpVelocity: -1500/window.divideScreenSizeBy,
	spawnPointX: 0,
	spawnPointY: 0,
	gravity: 0,
	tags: ['hero'],
}

window.hero = {...defaultHero}
window.hero.reachablePlatformHeight = resetReachablePlatformHeight()
window.hero.reachablePlatformWidth = resetReachablePlatformWidth()

if(!window.usePlayEditor) {
	var editor = document.getElementById("play-editor");
	editor.style = 'display:none';

	let savedHero = JSON.parse(localStorage.getItem('hero'));
	if(savedHero) Object.assign(window.hero, savedHero);

	window.socket.on('onUpdateHeroPos', (updatedHero) => {
		if(updatedHero.jumpVelocity !== window.hero.jumpVelocity) {
			updatedHero.reachablePlatformHeight = resetReachablePlatformHeight()
		}
		if(updatedHero.jumpVelocity !== window.hero.jumpVelocity || updatedHero.speed !== window.hero.speed) {
			updatedHero.reachablePlatformWidth = resetReachablePlatformWidth()
		}
		window.resetHero(updatedHero)
	})

	window.deleteObject = function(objectId) {
		physics.removeObjectById(objectId)
	}

	window.socket.on('onSnapAllObjectsToGrid', () => {
		window.snapAllObjectsToGrid()
	})
}

window.socket.on('onResetHero', () => {
	window.resetHero()
})

window.socket.on('onUpdateHero', (updatedHero) => {
	window.resetHero(updatedHero)
})

window.resetHero = function(updatedHero) {
	physics.removeObject(window.hero)
	if(updatedHero) {
		Object.assign(window.hero, updatedHero)
	} else {
		Object.assign(window.hero, defaultHero)
	}
	localStorage.setItem('hero', JSON.stringify(window.hero));
	physics.addObject(window.hero)
}

window.resetObjects = function() {
	window.objects.length = 0
	window.socket.emit('updateObjects', [])
}

window.removeObject = function(id) {
	for(let i = 0; i < window.objects.length; i++) {
		if(window.objects[i].id === id){
			window.objects.splice(i, 1)
			break;
		}
	}
	physics.removeObjectById(id)
	window.socket.emit('removeObject', id)
}


function resetReachablePlatformHeight() {
	let velocity = window.hero.jumpVelocity
	let gravity = 1000
	let delta = (0 - velocity)/gravity
	let height = (velocity * delta) +  ((gravity * (delta * delta))/2)
	return height
}

function resetReachablePlatformWidth() {
	let velocity = window.hero.speed
	let gravity = 1000
	let deltaInAir = (0 - window.hero.jumpVelocity)/gravity
	let width = (velocity * deltaInAir)
	return width * 2
}

physics.addObject(window.hero)

window.socket.emit('askPreferences')
window.socket.on('onUpdatePreferences', (updatedPreferences) => {
	for(let key in updatedPreferences) {
		const value = updatedPreferences[key]
		window.preferences[key] = value

		if(key === 'lockCamera' && !window.usePlayEditor) {
			if(value.limitX) {
				camera.setLimit(value.limitX, value.limitY, value.centerX, value.centerY)
			} else {
				camera.clearLimit();
			}
		}
	}
})

var game = {
  paused: false,
}

var flags = {
  showChat: false,
  heroPaused: false,
}

const current = {
  chat: []
}

var start = function () {
  input.init(hero)
	grid.init()
  chat.init(current, flags)
	shoot.init(hero)
  if(usePlayEditor) playEditor.init(ctx, window.objects, hero, camera)
	main()
};

// Update game objects
var update = function (delta) {
  if(game.mode === 'battle'){
    battle.update(ctx, delta)
    return
  }
  if(game.paused) return

  input.update(flags, hero, delta)

	chat.update(current.chat)
	intelligence.update(window.hero, window.objects)

	if(window.hero.inputControlProp !== 'grid') {
		physics.update(window.hero, window.objects, delta)
	} else {
		grid.update(window.hero, window.objects)
	}

	window.socket.emit('updateObjects', objects)

  localStorage.setItem('hero', JSON.stringify(window.hero));
};

// Draw everything
var render = function () {
	let vertices = [...window.objects].reduce((prev, object) => {
		prev.push({a:{x:object.x,y:object.y}, b:{x:object.x + object.width,y:object.y}})
		prev.push({a:{x:object.x + object.width,y:object.y}, b:{x:object.x + object.width,y:object.y + object.height}})
		prev.push({a:{x:object.x + object.width,y:object.y + object.height}, b:{x:object.x,y:object.y + object.height}})
		prev.push({a:{x:object.x,y:object.y + object.height}, b:{x:object.x,y:object.y}})
		return prev
	}, [])

  if(game.mode === 'battle'){
    battle.render(ctx)

    return
  }

  //reset background
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//set camera so we render everything in the right place
  camera.set(ctx, hero)

	window.preferences.renderStyle = 'outlines'
 	if (window.preferences.renderStyle === 'outlines') {
		ctx.strokeStyle = "#999";
		for(var i=0;i<vertices.length;i++){
			camera.drawVertice(ctx, vertices[i])
		}
		ctx.fillStyle = 'white';
		camera.drawObject(ctx, window.hero)
	} else if(window.preferences.renderStyle === 'physics'){
		physics.drawSystem(ctx, vertices)
	} else {
		for(let i = 0; i < window.objects.length; i++){
			camera.drawObject(ctx, window.objects[i])
		}
	}

	window.preferences.shadows = false
	if(window.preferences.shadows === true) {
		shadow.draw(ctx, vertices, hero)
	}

  camera.drawObject(ctx, hero);
  chat.render(ctx, flags, current.chat);
	feedback.draw(ctx);
}

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;
	if(delta > 23) delta = 23

	if(usePlayEditor) {
		playEditor.update(delta)
    playEditor.render(ctx, window.hero, window.objects);
  }else {
		update(delta / 1000);
		window.socket.emit('updateHeroPos', window.hero)
    render();
		// physics.drawSystem(ctx, hero)
  }

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
setTimeout(start, 1000);