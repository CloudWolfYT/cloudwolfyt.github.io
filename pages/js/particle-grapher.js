const time_min = document.getElementById("time_min");
const time_max = document.getElementById("time_max");
const time_scale = document.getElementById("time_scale");
const particle = document.getElementById("particle");
const particle_extras = document.getElementById("particle_extras");
const particle_closer = document.getElementById("particle_closer");
const opacity_slider = document.getElementById("opacity");
const settings = document.getElementById("settings");
const is_animate = document.getElementById("is_animate");
const animate = document.getElementById("animate");
const ppf = document.getElementById("ppf");
const presets = document.getElementById("presets");
const namespace = document.getElementById("namespace");
const folder = document.getElementById("folder");
const is_global = document.getElementById("is_global");

var is_extras = false;
var plot_data = [];

// Adapted to 3D Plotting from: https://mathjs.org/examples/browser/plot.html.html
function draw() {
    try {
      // compile the expression once
	  const expr_x1 = document.getElementById('x1').value
	  const expr_y1 = document.getElementById('y1').value
	  const expr_z1 = document.getElementById('z1').value
	  const x1 = math.compile(expr_x1)
	  const z1 = math.compile(expr_y1)
	  const y1 = math.compile(expr_z1)

	  const tmax = time_max.value
	  const tmin = time_min.value
	  const tscale = (tmax - tmin) / time_scale.value
	  const points = time_scale.value;

	  // evaluate the expression repeatedly for different values of x
	  const tValues = math.range(tmin, tmax, tscale).toArray() 
	  const rValues = Array.from({length: points}, () => (Math.floor(Math.random() * points))/100);

	  const scope = {
		  t: 0,
		  r: 0
	  }
	  var xValues = new Array(points); 
	  var yValues = new Array(points); 
	  var zValues = new Array(points);
	  for (var i = 0; i < points; i++) {
		  scope.t = tValues[i]; scope.r = rValues[i]; 
		  xValues[i] = x1.evaluate(scope);
		  yValues[i] = y1.evaluate(scope);
		  zValues[i] = z1.evaluate(scope);
	  }

	  //const xValues = tValues.map(function (x) {return x1.evaluate({t: x})})
      //const yValues = tValues.map(function (x) {return y1.evaluate({t: x})})
	  //const zValues = tValues.map(function (x) {return z1.evaluate({t: x})})
	  plot_data = [xValues,yValues,zValues];
      // render the plot using plotly
      const trace1 = {
        x: xValues, y: yValues, z: zValues,
		type: 'scatter3d', mode: 'markers',
		marker: { size: 5, line: { color: 'rgba(217, 217, 217, 0.14)', width: 0.5}, opacity: opacity_slider.value/100},
	}
	
	  const data = [trace1]
	  var layout = {
	  paper_bgcolor: '#333',
	  margin: { l: 0, r: 0, b: 0, t: 0,},
	  title: 'Particle Graph',
	  showlegend: false,
	  scene:{
		xaxis: {
			backgroundcolor: "rgb(200, 200, 230)",
			gridcolor: "white",
			showbackground: true,
			zerolinecolor: "white",
			tickcolor: 'white',
			tickfont: {color: 'white'},
			title:{font: {color:'white'}}
		}, 
		yaxis: {
			backgroundcolor: "rgb(230, 200, 230)",
			gridcolor: "white",
			showbackground: true,
			zerolinecolor: "white",
			tickcolor: 'white',
			tickfont: {color: 'white'},
			title:{text: 'z', font: {color:'white'}}
		}, 
		zaxis: {
			backgroundcolor: "rgb(230, 230, 200)",
			gridcolor: "white",
			showbackground: true,
			zerolinecolor: "white",
			tickcolor: 'white',
			tickfont: {color: 'white'},
			title:{text: 'y', font: {color:'white'}}
		},
		camera: {
			up: {x:0, y:0, z:1},
    		center: {x:0, y:0, z:0},
    		eye:{x:1, y:-1, z:0.5}
		}}
	}

      Plotly.newPlot('plot', data, layout,{modeBarButtonsToRemove: ['toImage','hoverClosest3d','orbitRotation','resetCameraLastSave3d']})
    }
    catch (err) {
      console.error(err)
      alert(err)
    }
  }

draw()

function raw_particles(zip) {
	var commands = "#Particles Generated with: Cloud Wolf's Particle Grapher";
	for (const i in plot_data[0]) {
		if(is_extras) {
			commands = commands.concat("\nparticle "+particle.value+" "+particle_extras.value+" ^"+plot_data[0][i].toFixed(3)+" ^"+plot_data[2][i].toFixed(3)+" ^"+plot_data[1][i].toFixed(3)+" "+particle_closer.value);
		} else {
			commands = commands.concat("\nparticle "+particle.value+" ^"+plot_data[0][i].toFixed(3)+" ^"+plot_data[2][i].toFixed(3)+" ^"+plot_data[1][i].toFixed(3)+" "+particle_closer.value);
		}
	}
	zip.file(["particles.mcfunction"],commands);
}

function animate_particles(zip) {
	const points = parseInt(time_scale.value);
	const pointsf = parseInt(ppf.value);
	if(pointsf >= 8) {
		var k = 0;
		for(var i = 0; i < points; i += pointsf) {
			var commands = "";
			for(var j = i; j < (i + pointsf); j++) {
				if(j < points) {
					if(is_extras) {
						commands = commands.concat("\nparticle "+particle.value+" "+particle_extras.value+" ^"+plot_data[0][j].toFixed(3)+" ^"+plot_data[2][j].toFixed(3)+" ^"+plot_data[1][j].toFixed(3)+" "+particle_closer.value);
					} else {
						commands = commands.concat("\nparticle "+particle.value+" ^"+plot_data[0][j].toFixed(3)+" ^"+plot_data[2][j].toFixed(3)+" ^"+plot_data[1][j].toFixed(3)+" "+particle_closer.value);
					}
				}
			}
			zip.file(["functions/"+folder.value+"/frames/f"+k+".mcfunction"],commands);
			k++;
		}
	}
	// fake player names randomly (global context only)
	var id_name = "@s";
	if(is_global.checked)
		id_name = "$"+Math.floor(Math.random() * 32768);
		
	parse_output(zip,8,folder.value,"execute if score "+id_name+" $objective matches $score run function "+namespace.value+":"+folder.value+"/frames/f$score",0,k,namespace.value,id_name,"cw_particleplot");
}

function parse_output(zip,tree,folder,command,start,end,namespace,player,objective) {
	if(start > end) {
	  var l = start;
	  start = end;
	  end = l;
	}
	var length = end - start;
	var levels = Math.ceil(Math.log(length)/Math.log(tree));
	var id_front = [length];
	var id_end = [length];
	var ins = "";
  
	for(var i = 0; i < length; i++) {
	  id_front[i] = i+start;
	  id_end[i] = i+start;
	}
  
	m = 0; ins = ""; ins1 = ""; l = 0; y = 0;
	for(var i = 0; i < length; i+=tree) {
	  for(var j = i; j < i+tree; j++) {
		if(j < length) {
		  var cmd = command.replace(/\$score/g,j + start);
		  cmd = cmd.replace(/\$objective/g,objective);
		  ins = ins.concat(cmd+"\n"); 
		}
	  }
	  zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
	  m++;
	  ins = "";
	}
	var q = 0;
	for(var l = 1; l < levels; l++) {
		q++;
	  zip.folder("functions/"+folder+"/l"+l);
	  k = 0;
	  p = 0;
	  m=0;
	  for(var i = 0; i < length; i+=tree) {
		var i2 = i+tree-1;
		if(i+tree >= length && (length % tree) > 0) {i2 = i + (length % tree) - 1;}
		ins = ins.concat("execute if score "+player+" "+objective+" matches "+id_front[i]+".."+( id_end[i2] )+" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+k+"\n");
		id_front[k] = id_front[i];
		id_end[k] = id_end[i2];
		p++;
		if(p==tree || i+tree >= length) {
		  zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
		  p = 0;
		  m++;
		  ins = "";
		}
		k++;
	  }
	  length = Math.floor(length / tree);
	}
	  var commands = "#Particles Generated with: Cloud Wolf's Particle Grapher";
	  commands = commands.concat("\nscoreboard objectives add "+objective+" dummy");
	  commands = commands.concat("\nfunction "+namespace+":"+folder+"/l"+q+"/l"+q+"_"+0);
	  commands = commands.concat("\nscoreboard players add "+player+" "+objective+" 1");
	  commands = commands.concat("\nexecute if score "+player+" "+objective+" matches "+end+".. run scoreboard players set "+player+" "+objective+" 0");
	  zip.file(["functions/"+folder+"/animate.mcfunction"],commands);
	
  }

function exports() {
	var zip = new JSZip();
	if(is_animate.checked)
		animate_particles(zip);
	else
		raw_particles(zip);
	
	getZip(zip);
}

async function getZip(zip) {
	const content = await zip.generateAsync({ type: "blob" });
	saveAs(content, `particle_grapher.zip`);
	//document.getElementById("pbarDiv").style = "visibility:hidden";
  }



function particle_handler() {
	const part = particle.value;
	is_extras = true; 
	switch(part) {
		case "block": particle_extras.style.display = "inline"; particle_extras.value = "minecraft:dirt";break;
		case "falling_dust": particle_extras.style.display = "inline"; particle_extras.value = "minecraft:dirt";break;
		case "item": particle_extras.style.display = "inline"; particle_extras.value = "minecraft:apple";break;
		case "dust": particle_extras.style.display = "inline"; particle_extras.value = "1.0 0.5 0.5 1.0";break;
		default: is_extras = false; particle_extras.style.display = "none"; particle_extras.value = ""; break;
	}
}

function preset_handler() {
	const v = presets.value;
	const x = document.getElementById('x1');
	const y = document.getElementById('y1');
	const z = document.getElementById('z1'); 
	switch(v) {
		case "conic_spiral": x.value = "t*sin(t)"; y.value = "t*cos(t)"; z.value = "t"; time_scale.value = 100; break;
		case "cylindric_spiral": x.value = "sin(t)"; y.value = "cos(t)"; z.value = "t"; time_scale.value = 100; break;
		case "sphere": x.value = "sin(t/10*pi)"; y.value = "sin((t%10)*pi)cos(t/10*pi)"; 
					   z.value = "cos((t%10)*pi)cos(t/10*pi)"; time_scale.value = 400; break;
		
		default: break;
	}
	document.getElementById("time_result").value = parseInt(time_scale.value);
	draw();
}

function settings_toggle() {
	if (settings.style.display === "none") {
	   settings.style.display = "block";
	} else {
	   settings.style.display = "none";
	}
}
settings_toggle();

function animate_toggle() {
	if (animate.style.display === "none") {
		animate.style.display = "block";
	} else {
		animate.style.display = "none";
	}
}
animate_toggle();