const time_min = document.getElementById("time_min");
const time_max = document.getElementById("time_max");
const time_scale = document.getElementById("time_scale");
const particle = document.getElementById("particle");
const particle_extras = document.getElementById("particle_extras");
const particle_closer = document.getElementById("particle_closer");
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
	  const y1 = math.compile(expr_y1)
	  const z1 = math.compile(expr_z1)

	  const tmax = time_max.value
	  const tmin = time_min.value
	  const tscale = (tmax - tmin) / time_scale.value

	  // evaluate the expression repeatedly for different values of x
	  const tValues = math.range(tmin, tmax, tscale).toArray()
      const xValues = tValues.map(function (x) {return x1.evaluate({t: x})})
      const yValues = tValues.map(function (x) {return y1.evaluate({t: x})})
	  const zValues = tValues.map(function (x) {return z1.evaluate({t: x})})
	  plot_data = [xValues,yValues,zValues];

      // render the plot using plotly
      const trace1 = {
        x: xValues, y: yValues, z: zValues,
		type: 'scatter3d', mode: 'markers',
		marker: { size: 5, line: { color: 'rgba(217, 217, 217, 0.14)', width: 0.5}, opacity: 0.8},
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
			tickfont: {color: 'white'}
		}, 
		yaxis: {
			backgroundcolor: "rgb(230, 200, 230)",
			gridcolor: "white",
			showbackground: true,
			zerolinecolor: "white",
			tickcolor: 'white',
			tickfont: {color: 'white'}
		}, 
		zaxis: {
			backgroundcolor: "rgb(230, 230, 200)",
			gridcolor: "white",
			showbackground: true,
			zerolinecolor: "white",
			tickcolor: 'white',
			tickfont: {color: 'white'}
		},
		camera: {
			up: {x:0, y:0, z:1},
    		center: {x:0, y:0, z:0},
    		eye:{x:-1, y:-1, z:0.5}
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
			commands = commands.concat("\nparticle "+particle.value+" "+particle_extras.value+" ^"+plot_data[0][i].toFixed(3)+" ^"+plot_data[1][i].toFixed(3)+" ^"+plot_data[2][i].toFixed(3)+" "+particle_closer.value);
		} else {
			commands = commands.concat("\nparticle "+particle.value+" ^"+plot_data[0][i].toFixed(3)+" ^"+plot_data[1][i].toFixed(3)+" ^"+plot_data[2][i].toFixed(3)+" "+particle_closer.value);
		}
	}
	zip.file(["particles.mcfunction"],commands);
}

function exports() {
	var zip = new JSZip();

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