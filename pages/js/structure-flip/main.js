const { mat4 } = glMatrix

const cmd_box = document.getElementById('cmd-box')
const image = document.getElementById('atlas')
if (image.complete) {
  loaded()
} else {
  image.addEventListener('load', loaded)
}

var ind = 0; var reps = 0; var block = -1; var blocks = [0]; var tsize = [0,0,0]; var structure; var resources; var renderer;
function loaded() {
	const blockDefinitions = {}
	Object.keys(assets.blockstates).forEach(id => {
		blockDefinitions['minecraft:' + id] = deepslate.BlockDefinition.fromJson(id, assets.blockstates[id])
	})

	const blockModels = {}
	Object.keys(assets.models).forEach(id => {
		blockModels['minecraft:' + id] = deepslate.BlockModel.fromJson(id, assets.models[id])
	})
	Object.values(blockModels).forEach(m => m.flatten({ getBlockModel: id => blockModels[id] }))

	const atlasCanvas = document.createElement('canvas')
	atlasCanvas.width = image.width
	atlasCanvas.height = image.height
	const atlasCtx = atlasCanvas.getContext('2d')
	atlasCtx.drawImage(image, 0, 0)
	const atlasData = atlasCtx.getImageData(0, 0, atlasCanvas.width, atlasCanvas.height)
	const part = 16 / atlasData.width
	const idMap = {}
	Object.keys(assets.textures).forEach(id => {
		const [u, v] = assets.textures[id]
		idMap['minecraft:' + id] = [u, v, u + part, v + part]
	})
	const textureAtlas = new deepslate.TextureAtlas(atlasData, idMap)

	resources = {
		getBlockDefinition(id) { return blockDefinitions[id] },
		getBlockModel(id) { return blockModels[id] },
		getTextureUV(id) { return textureAtlas.getTextureUV(id) },
		getTextureAtlas() { return textureAtlas.getTextureAtlas() },
		getBlockFlags(id) { return { opaque: opaqueBlocks.has(id) } },
		getBlockProperties(id) { return null },
		getDefaultBlockProperties(id) { return null },
	}

	get_jsons("../json/1.17/blocks.json")

    structure = new deepslate.Structure([0,0,0])
    const canvas = document.getElementById('canvas')
	const gl = canvas.getContext('webgl')
	renderer = new deepslate.StructureRenderer(gl, structure, resources, { useInvisibleBlockBuffer: false })
}

let viewDist = 10
let xRotation = 0.8
let yRotation = 0.5
function render() {
    yRotation = yRotation % (Math.PI * 2)
    xRotation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xRotation))
    viewDist = Math.max(1, Math.min(500, viewDist))

    const view = mat4.create()
    mat4.translate(view, view, [0, 0, -viewDist])
    mat4.rotate(view, view, xRotation, [1, 0, 0])
    mat4.rotate(view, view, yRotation, [0, 1, 0])
    mat4.translate(view, view, [-tsize[0] / 2, -tsize[1] / 2, -tsize[2] / 2])

    renderer.drawStructure(view)
}
requestAnimationFrame(render)

let dragPos = null
canvas.addEventListener('mousedown', evt => {
    if (evt.button === 0) {
        dragPos = [evt.clientX, evt.clientY]
    }
})
canvas.addEventListener('mousemove', evt => {
    if (dragPos) {
        yRotation += (evt.clientX - dragPos[0]) / 100
        xRotation += (evt.clientY - dragPos[1]) / 100
        dragPos = [evt.clientX, evt.clientY]
        requestAnimationFrame(render)
    }
})
canvas.addEventListener('mouseup', () => {
    dragPos = null
})
canvas.addEventListener('wheel', evt => {
    evt.preventDefault()
    viewDist += evt.deltaY / 100
    requestAnimationFrame(render)
})

var block_prop = {};
function make_cube(x, y ,z) {
    if(reps <= 1) {
        block = blocks[ind];
        block_prop = all_blocks[block];
        ind--;
        if(blocks[ind] < 0) {
            reps = -(blocks[ind]);
            ind--;
        }
    } else {
        reps--;
    }
    if(block > 0) {
        structure.addBlock([x, y, z], block_prop.block, block_prop.properties)
    }
}

var all_blocks = [];
var temp = [];
function get_jsons(block_list) { //transforms the blocks.json into a full length object
    fetch(block_list)
    .then(function(resp) {
      return resp.json();
    })
    .then(function(data) {
      all_blocks = [];
      temp = Object.keys(data);
      for(var i in temp) {
        for(var j in data[temp[i]].states) {
          const namespace = {"block": temp[i]}
          all_blocks.push(Object.assign(data[temp[i]].states[j],namespace));
        }
      }      finish_load();
    });
}


function finish_load() {
    
	/* My Structure Stuff */
	const pos_save_start = cmd_box.value.search("save") + 5;
    const pos_size_start = cmd_box.value.search("size") + 5;
    const pos_save_end = (cmd_box.value.slice(pos_save_start, pos_size_start - 5)).search("]") + pos_save_start + 1;
    const pos_size_end = (cmd_box.value.slice(pos_size_start, cmd_box.value.length)).search("]") + pos_size_start + 1;
    blocks = JSON.parse(cmd_box.value.slice(pos_save_start,pos_save_end));
    tsize = JSON.parse(cmd_box.value.slice(pos_size_start,pos_size_end));
    tsize[1]--;
    
    var tlsize = [];
    tlsize[0] = tsize[0] + 5; tlsize[2] = tsize[2] + 5; tlsize[1] = tsize[1] + 5;
	structure = new deepslate.Structure(tlsize)
	
	//Domain Calculations
    var n_x = Math.floor(tsize[0] / 16);
    var edge_x = tsize[0] % 16;
    var n_z = Math.floor(tsize[2] / 16);
    var edge_z = tsize[2] % 16;

    var x = tsize[0] - (tsize[0] % 16);
    var y = tsize[1];
    var z = tsize[2] - (tsize[2] % 16);
    var xi = x; var zi = z;
    reps = 0; 
    ind = blocks.length - 1;
    block = -1;
    for (var i = n_z; i >= 0 ; i--) {
        for (var j = n_x; j >= 0; j--) {
            for(var k = 0; k <= y; k++) {
                if(i == n_z && j == n_x) {
                    zcurve_edge( xi, k, zi, edge_x, edge_z);
                } else if(i == n_z && j != n_x) {
                    zcurve_edge( xi, k, zi, 15, edge_z);
                } else if(i != n_z && j == n_x) {
                    zcurve_edge( xi, k, zi, edge_x, 15);
                } else {
                    zcurve( xi, k, zi);
                }
            }
            xi -= 16;
        }
        xi = x;
        zi -= 16;
    }
    console.log("built");

    renderer.setStructure(structure);
    requestAnimationFrame(render)
}

function zcurve_edge(x,y,z,edge_x,edge_z) {
    if(edge_x>=15 && edge_z >=15) {make_cube(x+15,y,z+15);}
    if(edge_x>=14 && edge_z >=15) {make_cube(x+14,y,z+15);}
    if(edge_x>=15 && edge_z >=14) {make_cube(x+15,y,z+14);}
    if(edge_x>=14 && edge_z >=14) {make_cube(x+14,y,z+14);}
    if(edge_x>=13 && edge_z >=15) {make_cube(x+13,y,z+15);}
    if(edge_x>=12 && edge_z >=15) {make_cube(x+12,y,z+15);}
    if(edge_x>=13 && edge_z >=14) {make_cube(x+13,y,z+14);}
    if(edge_x>=12 && edge_z >=14) {make_cube(x+12,y,z+14);}
    if(edge_x>=15 && edge_z >=13) {make_cube(x+15,y,z+13);}
    if(edge_x>=14 && edge_z >=13) {make_cube(x+14,y,z+13);}
    if(edge_x>=15 && edge_z >=12) {make_cube(x+15,y,z+12);}
    if(edge_x>=14 && edge_z >=12) {make_cube(x+14,y,z+12);}
    if(edge_x>=13 && edge_z >=13) {make_cube(x+13,y,z+13);}
    if(edge_x>=12 && edge_z >=13) {make_cube(x+12,y,z+13);}
    if(edge_x>=13 && edge_z >=12) {make_cube(x+13,y,z+12);}
    if(edge_x>=12 && edge_z >=12) {make_cube(x+12,y,z+12);}
    if(edge_x>=11 && edge_z >=15) {make_cube(x+11,y,z+15);}
    if(edge_x>=10 && edge_z >=15) {make_cube(x+10,y,z+15);}
    if(edge_x>=11 && edge_z >=14) {make_cube(x+11,y,z+14);}
    if(edge_x>=10 && edge_z >=14) {make_cube(x+10,y,z+14);}
    if(edge_x>=9  && edge_z >=15) {make_cube(x+9,y,z+15);}
    if(edge_x>=8  && edge_z >=15) {make_cube(x+8,y,z+15);}
    if(edge_x>=9  && edge_z >=14) {make_cube(x+9,y,z+14);}
    if(edge_x>=8  && edge_z >=14) {make_cube(x+8,y,z+14);}
    if(edge_x>=11 && edge_z >=13) {make_cube(x+11,y,z+13);}
    if(edge_x>=10 && edge_z >=13) {make_cube(x+10,y,z+13);}
    if(edge_x>=11 && edge_z >=12) {make_cube(x+11,y,z+12);}
    if(edge_x>=10 && edge_z >=12) {make_cube(x+10,y,z+12);}
    if(edge_x>=9  && edge_z >=13) {make_cube(x+9,y,z+13);}
    if(edge_x>=8  && edge_z >=13) {make_cube(x+8,y,z+13);}
    if(edge_x>=9  && edge_z >=12) {make_cube(x+9,y,z+12);}
    if(edge_x>=8  && edge_z >=12) {make_cube(x+8,y,z+12);}
    if(edge_x>=15 && edge_z >=11) {make_cube(x+15,y,z+11);}
    if(edge_x>=14 && edge_z >=11) {make_cube(x+14,y,z+11);}
    if(edge_x>=15 && edge_z >=10) {make_cube(x+15,y,z+10);}
    if(edge_x>=14 && edge_z >=10) {make_cube(x+14,y,z+10);}
    if(edge_x>=13 && edge_z >=11) {make_cube(x+13,y,z+11);}
    if(edge_x>=12 && edge_z >=11) {make_cube(x+12,y,z+11);}
    if(edge_x>=13 && edge_z >=10) {make_cube(x+13,y,z+10);}
    if(edge_x>=12 && edge_z >=10) {make_cube(x+12,y,z+10);}
    if(edge_x>=15 && edge_z >=9 ) {make_cube(x+15,y,z+9);}
    if(edge_x>=14 && edge_z >=9 ) {make_cube(x+14,y,z+9);}
    if(edge_x>=15 && edge_z >=8 ) {make_cube(x+15,y,z+8);}
    if(edge_x>=14 && edge_z >=8 ) {make_cube(x+14,y,z+8);}
    if(edge_x>=13 && edge_z >=9 ) {make_cube(x+13,y,z+9);}
    if(edge_x>=12 && edge_z >=9 ) {make_cube(x+12,y,z+9);}
    if(edge_x>=13 && edge_z >=8 ) {make_cube(x+13,y,z+8);}
    if(edge_x>=12 && edge_z >=8 ) {make_cube(x+12,y,z+8);}
    if(edge_x>=11 && edge_z >=11) {make_cube(x+11,y,z+11);}
    if(edge_x>=10 && edge_z >=11) {make_cube(x+10,y,z+11);}
    if(edge_x>=11 && edge_z >=10) {make_cube(x+11,y,z+10);}
    if(edge_x>=10 && edge_z >=10) {make_cube(x+10,y,z+10);}
    if(edge_x>=9  && edge_z >=11) {make_cube(x+9,y,z+11);}
    if(edge_x>=8  && edge_z >=11) {make_cube(x+8,y,z+11);}
    if(edge_x>=9  && edge_z >=10) {make_cube(x+9,y,z+10);}
    if(edge_x>=8  && edge_z >=10) {make_cube(x+8,y,z+10);}
    if(edge_x>=11 && edge_z >=9 ) {make_cube(x+11,y,z+9);}
    if(edge_x>=10 && edge_z >=9 ) {make_cube(x+10,y,z+9);}
    if(edge_x>=11 && edge_z >=8 ) {make_cube(x+11,y,z+8);}
    if(edge_x>=10 && edge_z >=8 ) {make_cube(x+10,y,z+8);}
    if(edge_x>=9  && edge_z >=9 ) {make_cube(x+9,y,z+9);}
    if(edge_x>=8  && edge_z >=9 ) {make_cube(x+8,y,z+9);}
    if(edge_x>=9  && edge_z >=8 ) {make_cube(x+9,y,z+8);}
    if(edge_x>=8  && edge_z >=8 ) {make_cube(x+8,y,z+8);}
    if(edge_x>=7  && edge_z >=15) {make_cube(x+7,y,z+15);}
    if(edge_x>=6  && edge_z >=15) {make_cube(x+6,y,z+15);}
    if(edge_x>=7  && edge_z >=14) {make_cube(x+7,y,z+14);}
    if(edge_x>=6  && edge_z >=14) {make_cube(x+6,y,z+14);}
    if(edge_x>=5  && edge_z >=15) {make_cube(x+5,y,z+15);}
    if(edge_x>=4  && edge_z >=15) {make_cube(x+4,y,z+15);}
    if(edge_x>=5  && edge_z >=14) {make_cube(x+5,y,z+14);}
    if(edge_x>=4  && edge_z >=14) {make_cube(x+4,y,z+14);}
    if(edge_x>=7  && edge_z >=13) {make_cube(x+7,y,z+13);}
    if(edge_x>=6  && edge_z >=13) {make_cube(x+6,y,z+13);}
    if(edge_x>=7  && edge_z >=12) {make_cube(x+7,y,z+12);}
    if(edge_x>=6  && edge_z >=12) {make_cube(x+6,y,z+12);}
    if(edge_x>=5  && edge_z >=13) {make_cube(x+5,y,z+13);}
    if(edge_x>=4  && edge_z >=13) {make_cube(x+4,y,z+13);}
    if(edge_x>=5  && edge_z >=12) {make_cube(x+5,y,z+12);}
    if(edge_x>=4  && edge_z >=12) {make_cube(x+4,y,z+12);}
    if(edge_x>=3  && edge_z >=15) {make_cube(x+3,y,z+15);}
    if(edge_x>=2  && edge_z >=15) {make_cube(x+2,y,z+15);}
    if(edge_x>=3  && edge_z >=14) {make_cube(x+3,y,z+14);}
    if(edge_x>=2  && edge_z >=14) {make_cube(x+2,y,z+14);}
    if(edge_x>=1  && edge_z >=15) {make_cube(x+1,y,z+15);}
    if(edge_x>=0  && edge_z >=15) {make_cube(x+0,y,z+15);}
    if(edge_x>=1  && edge_z >=14) {make_cube(x+1,y,z+14);}
    if(edge_x>=0  && edge_z >=14) {make_cube(x+0,y,z+14);}
    if(edge_x>=3  && edge_z >=13) {make_cube(x+3,y,z+13);}
    if(edge_x>=2  && edge_z >=13) {make_cube(x+2,y,z+13);}
    if(edge_x>=3  && edge_z >=12) {make_cube(x+3,y,z+12);}
    if(edge_x>=2  && edge_z >=12) {make_cube(x+2,y,z+12);}
    if(edge_x>=1  && edge_z >=13) {make_cube(x+1,y,z+13);}
    if(edge_x>=0  && edge_z >=13) {make_cube(x+0,y,z+13);}
    if(edge_x>=1  && edge_z >=12) {make_cube(x+1,y,z+12);}
    if(edge_x>=0  && edge_z >=12) {make_cube(x+0,y,z+12);}
    if(edge_x>=7  && edge_z >=11) {make_cube(x+7,y,z+11);}
    if(edge_x>=6  && edge_z >=11) {make_cube(x+6,y,z+11);}
    if(edge_x>=7  && edge_z >=10) {make_cube(x+7,y,z+10);}
    if(edge_x>=6  && edge_z >=10) {make_cube(x+6,y,z+10);}
    if(edge_x>=5  && edge_z >=11) {make_cube(x+5,y,z+11);}
    if(edge_x>=4  && edge_z >=11) {make_cube(x+4,y,z+11);}
    if(edge_x>=5  && edge_z >=10) {make_cube(x+5,y,z+10);}
    if(edge_x>=4  && edge_z >=10) {make_cube(x+4,y,z+10);}
    if(edge_x>=7  && edge_z >=9 ) {make_cube(x+7,y,z+9);}
    if(edge_x>=6  && edge_z >=9 ) {make_cube(x+6,y,z+9);}
    if(edge_x>=7  && edge_z >=8 ) {make_cube(x+7,y,z+8);}
    if(edge_x>=6  && edge_z >=8 ) {make_cube(x+6,y,z+8);}
    if(edge_x>=5  && edge_z >=9 ) {make_cube(x+5,y,z+9);}
    if(edge_x>=4  && edge_z >=9 ) {make_cube(x+4,y,z+9);}
    if(edge_x>=5  && edge_z >=8 ) {make_cube(x+5,y,z+8);}
    if(edge_x>=4  && edge_z >=8 ) {make_cube(x+4,y,z+8);}
    if(edge_x>=3  && edge_z >=11) {make_cube(x+3,y,z+11);}
    if(edge_x>=2  && edge_z >=11) {make_cube(x+2,y,z+11);}
    if(edge_x>=3  && edge_z >=10) {make_cube(x+3,y,z+10);}
    if(edge_x>=2  && edge_z >=10) {make_cube(x+2,y,z+10);}
    if(edge_x>=1  && edge_z >=11) {make_cube(x+1,y,z+11);}
    if(edge_x>=0  && edge_z >=11) {make_cube(x+0,y,z+11);}
    if(edge_x>=1  && edge_z >=10) {make_cube(x+1,y,z+10);}
    if(edge_x>=0  && edge_z >=10) {make_cube(x+0,y,z+10);}
    if(edge_x>=3  && edge_z >=9 ) {make_cube(x+3,y,z+9);}
    if(edge_x>=2  && edge_z >=9 ) {make_cube(x+2,y,z+9);}
    if(edge_x>=3  && edge_z >=8 ) {make_cube(x+3,y,z+8);}
    if(edge_x>=2  && edge_z >=8 ) {make_cube(x+2,y,z+8);}
    if(edge_x>=1  && edge_z >=9 ) {make_cube(x+1,y,z+9);}
    if(edge_x>=0  && edge_z >=9 ) {make_cube(x+0,y,z+9);}
    if(edge_x>=1  && edge_z >=8 ) {make_cube(x+1,y,z+8);}
    if(edge_x>=0  && edge_z >=8 ) {make_cube(x+0,y,z+8);}
    if(edge_x>=15 && edge_z >=7 ) {make_cube(x+15,y,z+7);}
    if(edge_x>=14 && edge_z >=7 ) {make_cube(x+14,y,z+7);}
    if(edge_x>=15 && edge_z >=6 ) {make_cube(x+15,y,z+6);}
    if(edge_x>=14 && edge_z >=6 ) {make_cube(x+14,y,z+6);}
    if(edge_x>=13 && edge_z >=7 ) {make_cube(x+13,y,z+7);}
    if(edge_x>=12 && edge_z >=7 ) {make_cube(x+12,y,z+7);}
    if(edge_x>=13 && edge_z >=6 ) {make_cube(x+13,y,z+6);}
    if(edge_x>=12 && edge_z >=6 ) {make_cube(x+12,y,z+6);}
    if(edge_x>=15 && edge_z >=5 ) {make_cube(x+15,y,z+5);}
    if(edge_x>=14 && edge_z >=5 ) {make_cube(x+14,y,z+5);}
    if(edge_x>=15 && edge_z >=4 ) {make_cube(x+15,y,z+4);}
    if(edge_x>=14 && edge_z >=4 ) {make_cube(x+14,y,z+4);}
    if(edge_x>=13 && edge_z >=5 ) {make_cube(x+13,y,z+5);}
    if(edge_x>=12 && edge_z >=5 ) {make_cube(x+12,y,z+5);}
    if(edge_x>=13 && edge_z >=4 ) {make_cube(x+13,y,z+4);}
    if(edge_x>=12 && edge_z >=4 ) {make_cube(x+12,y,z+4);}
    if(edge_x>=11 && edge_z >=7 ) {make_cube(x+11,y,z+7);}
    if(edge_x>=10 && edge_z >=7 ) {make_cube(x+10,y,z+7);}
    if(edge_x>=11 && edge_z >=6 ) {make_cube(x+11,y,z+6);}
    if(edge_x>=10 && edge_z >=6 ) {make_cube(x+10,y,z+6);}
    if(edge_x>=9  && edge_z >=7 ) {make_cube(x+9,y,z+7);}
    if(edge_x>=8  && edge_z >=7 ) {make_cube(x+8,y,z+7);}
    if(edge_x>=9  && edge_z >=6 ) {make_cube(x+9,y,z+6);}
    if(edge_x>=8  && edge_z >=6 ) {make_cube(x+8,y,z+6);}
    if(edge_x>=11 && edge_z >=5 ) {make_cube(x+11,y,z+5);}
    if(edge_x>=10 && edge_z >=5 ) {make_cube(x+10,y,z+5);}
    if(edge_x>=11 && edge_z >=4 ) {make_cube(x+11,y,z+4);}
    if(edge_x>=10 && edge_z >=4 ) {make_cube(x+10,y,z+4);}
    if(edge_x>=9  && edge_z >=5 ) {make_cube(x+9,y,z+5);}
    if(edge_x>=8  && edge_z >=5 ) {make_cube(x+8,y,z+5);}
    if(edge_x>=9  && edge_z >=4 ) {make_cube(x+9,y,z+4);}
    if(edge_x>=8  && edge_z >=4 ) {make_cube(x+8,y,z+4);}
    if(edge_x>=15 && edge_z >=3 ) {make_cube(x+15,y,z+3);}
    if(edge_x>=14 && edge_z >=3 ) {make_cube(x+14,y,z+3);}
    if(edge_x>=15 && edge_z >=2 ) {make_cube(x+15,y,z+2);}
    if(edge_x>=14 && edge_z >=2 ) {make_cube(x+14,y,z+2);}
    if(edge_x>=13 && edge_z >=3 ) {make_cube(x+13,y,z+3);}
    if(edge_x>=12 && edge_z >=3 ) {make_cube(x+12,y,z+3);}
    if(edge_x>=13 && edge_z >=2 ) {make_cube(x+13,y,z+2);}
    if(edge_x>=12 && edge_z >=2 ) {make_cube(x+12,y,z+2);}
    if(edge_x>=15 && edge_z >=1 ) {make_cube(x+15,y,z+1);}
    if(edge_x>=14 && edge_z >=1 ) {make_cube(x+14,y,z+1);}
    if(edge_x>=15 && edge_z >=0 ) {make_cube(x+15,y,z+0);}
    if(edge_x>=14 && edge_z >=0 ) {make_cube(x+14,y,z+0);}
    if(edge_x>=13 && edge_z >=1 ) {make_cube(x+13,y,z+1);}
    if(edge_x>=12 && edge_z >=1 ) {make_cube(x+12,y,z+1);}
    if(edge_x>=13 && edge_z >=0 ) {make_cube(x+13,y,z+0);}
    if(edge_x>=12 && edge_z >=0 ) {make_cube(x+12,y,z+0);}
    if(edge_x>=11 && edge_z >=3 ) {make_cube(x+11,y,z+3);}
    if(edge_x>=10 && edge_z >=3 ) {make_cube(x+10,y,z+3);}
    if(edge_x>=11 && edge_z >=2 ) {make_cube(x+11,y,z+2);}
    if(edge_x>=10 && edge_z >=2 ) {make_cube(x+10,y,z+2);}
    if(edge_x>=9  && edge_z >=3 ) {make_cube(x+9,y,z+3);}
    if(edge_x>=8  && edge_z >=3 ) {make_cube(x+8,y,z+3);}
    if(edge_x>=9  && edge_z >=2 ) {make_cube(x+9,y,z+2);}
    if(edge_x>=8  && edge_z >=2 ) {make_cube(x+8,y,z+2);}
    if(edge_x>=11 && edge_z >=1 ) {make_cube(x+11,y,z+1);}
    if(edge_x>=10 && edge_z >=1 ) {make_cube(x+10,y,z+1);}
    if(edge_x>=11 && edge_z >=0 ) {make_cube(x+11,y,z+0);}
    if(edge_x>=10 && edge_z >=0 ) {make_cube(x+10,y,z+0);}
    if(edge_x>=9  && edge_z >=1 ) {make_cube(x+9,y,z+1);}
    if(edge_x>=8  && edge_z >=1 ) {make_cube(x+8,y,z+1);}
    if(edge_x>=9  && edge_z >=0 ) {make_cube(x+9,y,z+0);}
    if(edge_x>=8  && edge_z >=0 ) {make_cube(x+8,y,z+0);}
    if(edge_x>=7  && edge_z >=7 ) {make_cube(x+7,y,z+7);}
    if(edge_x>=6  && edge_z >=7 ) {make_cube(x+6,y,z+7);}
    if(edge_x>=7  && edge_z >=6 ) {make_cube(x+7,y,z+6);}
    if(edge_x>=6  && edge_z >=6 ) {make_cube(x+6,y,z+6);}
    if(edge_x>=5  && edge_z >=7 ) {make_cube(x+5,y,z+7);}
    if(edge_x>=4  && edge_z >=7 ) {make_cube(x+4,y,z+7);}
    if(edge_x>=5  && edge_z >=6 ) {make_cube(x+5,y,z+6);}
    if(edge_x>=4  && edge_z >=6 ) {make_cube(x+4,y,z+6);}
    if(edge_x>=7  && edge_z >=5 ) {make_cube(x+7,y,z+5);}
    if(edge_x>=6  && edge_z >=5 ) {make_cube(x+6,y,z+5);}
    if(edge_x>=7  && edge_z >=4 ) {make_cube(x+7,y,z+4);}
    if(edge_x>=6  && edge_z >=4 ) {make_cube(x+6,y,z+4);}
    if(edge_x>=5  && edge_z >=5 ) {make_cube(x+5,y,z+5);}
    if(edge_x>=4  && edge_z >=5 ) {make_cube(x+4,y,z+5);}
    if(edge_x>=5  && edge_z >=4 ) {make_cube(x+5,y,z+4);}
    if(edge_x>=4  && edge_z >=4 ) {make_cube(x+4,y,z+4);}
    if(edge_x>=3  && edge_z >=7 ) {make_cube(x+3,y,z+7);}
    if(edge_x>=2  && edge_z >=7 ) {make_cube(x+2,y,z+7);}
    if(edge_x>=3  && edge_z >=6 ) {make_cube(x+3,y,z+6);}
    if(edge_x>=2  && edge_z >=6 ) {make_cube(x+2,y,z+6);}
    if(edge_x>=1  && edge_z >=7 ) {make_cube(x+1,y,z+7);}
    if(edge_x>=0  && edge_z >=7 ) {make_cube(x+0,y,z+7);}
    if(edge_x>=1  && edge_z >=6 ) {make_cube(x+1,y,z+6);}
    if(edge_x>=0  && edge_z >=6 ) {make_cube(x+0,y,z+6);}
    if(edge_x>=3  && edge_z >=5 ) {make_cube(x+3,y,z+5);}
    if(edge_x>=2  && edge_z >=5 ) {make_cube(x+2,y,z+5);}
    if(edge_x>=3  && edge_z >=4 ) {make_cube(x+3,y,z+4);}
    if(edge_x>=2  && edge_z >=4 ) {make_cube(x+2,y,z+4);}
    if(edge_x>=1  && edge_z >=5 ) {make_cube(x+1,y,z+5);}
    if(edge_x>=0  && edge_z >=5 ) {make_cube(x+0,y,z+5);}
    if(edge_x>=1  && edge_z >=4 ) {make_cube(x+1,y,z+4);}
    if(edge_x>=0  && edge_z >=4 ) {make_cube(x+0,y,z+4);}
    if(edge_x>=7  && edge_z >=3 ) {make_cube(x+7,y,z+3);}
    if(edge_x>=6  && edge_z >=3 ) {make_cube(x+6,y,z+3);}
    if(edge_x>=7  && edge_z >=2 ) {make_cube(x+7,y,z+2);}
    if(edge_x>=6  && edge_z >=2 ) {make_cube(x+6,y,z+2);}
    if(edge_x>=5  && edge_z >=3 ) {make_cube(x+5,y,z+3);}
    if(edge_x>=4  && edge_z >=3 ) {make_cube(x+4,y,z+3);}
    if(edge_x>=5  && edge_z >=2 ) {make_cube(x+5,y,z+2);}
    if(edge_x>=4  && edge_z >=2 ) {make_cube(x+4,y,z+2);}
    if(edge_x>=7  && edge_z >=1 ) {make_cube(x+7,y,z+1);}
    if(edge_x>=6  && edge_z >=1 ) {make_cube(x+6,y,z+1);}
    if(edge_x>=7  && edge_z >=0 ) {make_cube(x+7,y,z+0);}
    if(edge_x>=6  && edge_z >=0 ) {make_cube(x+6,y,z+0);}
    if(edge_x>=5  && edge_z >=1 ) {make_cube(x+5,y,z+1);}
    if(edge_x>=4  && edge_z >=1 ) {make_cube(x+4,y,z+1);}
    if(edge_x>=5  && edge_z >=0 ) {make_cube(x+5,y,z+0);}
    if(edge_x>=4  && edge_z >=0 ) {make_cube(x+4,y,z+0);}
    if(edge_x>=3  && edge_z >=3 ) {make_cube(x+3,y,z+3);}
    if(edge_x>=2  && edge_z >=3 ) {make_cube(x+2,y,z+3);}
    if(edge_x>=3  && edge_z >=2 ) {make_cube(x+3,y,z+2);}
    if(edge_x>=2  && edge_z >=2 ) {make_cube(x+2,y,z+2);}
    if(edge_x>=1  && edge_z >=3 ) {make_cube(x+1,y,z+3);}
    if(edge_x>=0  && edge_z >=3 ) {make_cube(x+0,y,z+3);}
    if(edge_x>=1  && edge_z >=2 ) {make_cube(x+1,y,z+2);}
    if(edge_x>=0  && edge_z >=2 ) {make_cube(x+0,y,z+2);}
    if(edge_x>=3  && edge_z >=1 ) {make_cube(x+3,y,z+1);}
    if(edge_x>=2  && edge_z >=1 ) {make_cube(x+2,y,z+1);}
    if(edge_x>=3  && edge_z >=0 ) {make_cube(x+3,y,z+0);}
    if(edge_x>=2  && edge_z >=0 ) {make_cube(x+2,y,z+0);}
    if(edge_x>=1  && edge_z >=1 ) {make_cube(x+1,y,z+1);}
    if(edge_x>=0  && edge_z >=1 ) {make_cube(x+0,y,z+1);}
    if(edge_x>=1  && edge_z >=0 ) {make_cube(x+1,y,z+0);}
    if(edge_x>=0  && edge_z >=0 ) {make_cube(x+0,y,z+0);}    
}
function zcurve(x,y,z) {
make_cube(x+15,y,z+15);
make_cube(x+14,y,z+15);
make_cube(x+15,y,z+14);
make_cube(x+14,y,z+14);
make_cube(x+13,y,z+15);
make_cube(x+12,y,z+15);
make_cube(x+13,y,z+14);
make_cube(x+12,y,z+14);
make_cube(x+15,y,z+13);
make_cube(x+14,y,z+13);
make_cube(x+15,y,z+12);
make_cube(x+14,y,z+12);
make_cube(x+13,y,z+13);
make_cube(x+12,y,z+13);
make_cube(x+13,y,z+12);
make_cube(x+12,y,z+12);
make_cube(x+11,y,z+15);
make_cube(x+10,y,z+15);
make_cube(x+11,y,z+14);
make_cube(x+10,y,z+14);
make_cube(x+9,y,z+15);
make_cube(x+8,y,z+15);
make_cube(x+9,y,z+14);
make_cube(x+8,y,z+14);
make_cube(x+11,y,z+13);
make_cube(x+10,y,z+13);
make_cube(x+11,y,z+12);
make_cube(x+10,y,z+12);
make_cube(x+9,y,z+13);
make_cube(x+8,y,z+13);
make_cube(x+9,y,z+12);
make_cube(x+8,y,z+12);
make_cube(x+15,y,z+11);
make_cube(x+14,y,z+11);
make_cube(x+15,y,z+10);
make_cube(x+14,y,z+10);
make_cube(x+13,y,z+11);
make_cube(x+12,y,z+11);
make_cube(x+13,y,z+10);
make_cube(x+12,y,z+10);
make_cube(x+15,y,z+9);
make_cube(x+14,y,z+9);
make_cube(x+15,y,z+8);
make_cube(x+14,y,z+8);
make_cube(x+13,y,z+9);
make_cube(x+12,y,z+9);
make_cube(x+13,y,z+8);
make_cube(x+12,y,z+8);
make_cube(x+11,y,z+11);
make_cube(x+10,y,z+11);
make_cube(x+11,y,z+10);
make_cube(x+10,y,z+10);
make_cube(x+9,y,z+11);
make_cube(x+8,y,z+11);
make_cube(x+9,y,z+10);
make_cube(x+8,y,z+10);
make_cube(x+11,y,z+9);
make_cube(x+10,y,z+9);
make_cube(x+11,y,z+8);
make_cube(x+10,y,z+8);
make_cube(x+9,y,z+9);
make_cube(x+8,y,z+9);
make_cube(x+9,y,z+8);
make_cube(x+8,y,z+8);
make_cube(x+7,y,z+15);
make_cube(x+6,y,z+15);
make_cube(x+7,y,z+14);
make_cube(x+6,y,z+14);
make_cube(x+5,y,z+15);
make_cube(x+4,y,z+15);
make_cube(x+5,y,z+14);
make_cube(x+4,y,z+14);
make_cube(x+7,y,z+13);
make_cube(x+6,y,z+13);
make_cube(x+7,y,z+12);
make_cube(x+6,y,z+12);
make_cube(x+5,y,z+13);
make_cube(x+4,y,z+13);
make_cube(x+5,y,z+12);
make_cube(x+4,y,z+12);
make_cube(x+3,y,z+15);
make_cube(x+2,y,z+15);
make_cube(x+3,y,z+14);
make_cube(x+2,y,z+14);
make_cube(x+1,y,z+15);
make_cube(x+0,y,z+15);
make_cube(x+1,y,z+14);
make_cube(x+0,y,z+14);
make_cube(x+3,y,z+13);
make_cube(x+2,y,z+13);
make_cube(x+3,y,z+12);
make_cube(x+2,y,z+12);
make_cube(x+1,y,z+13);
make_cube(x+0,y,z+13);
make_cube(x+1,y,z+12);
make_cube(x+0,y,z+12);
make_cube(x+7,y,z+11);
make_cube(x+6,y,z+11);
make_cube(x+7,y,z+10);
make_cube(x+6,y,z+10);
make_cube(x+5,y,z+11);
make_cube(x+4,y,z+11);
make_cube(x+5,y,z+10);
make_cube(x+4,y,z+10);
make_cube(x+7,y,z+9);
make_cube(x+6,y,z+9);
make_cube(x+7,y,z+8);
make_cube(x+6,y,z+8);
make_cube(x+5,y,z+9);
make_cube(x+4,y,z+9);
make_cube(x+5,y,z+8);
make_cube(x+4,y,z+8);
make_cube(x+3,y,z+11);
make_cube(x+2,y,z+11);
make_cube(x+3,y,z+10);
make_cube(x+2,y,z+10);
make_cube(x+1,y,z+11);
make_cube(x+0,y,z+11);
make_cube(x+1,y,z+10);
make_cube(x+0,y,z+10);
make_cube(x+3,y,z+9);
make_cube(x+2,y,z+9);
make_cube(x+3,y,z+8);
make_cube(x+2,y,z+8);
make_cube(x+1,y,z+9);
make_cube(x+0,y,z+9);
make_cube(x+1,y,z+8);
make_cube(x+0,y,z+8);
make_cube(x+15,y,z+7);
make_cube(x+14,y,z+7);
make_cube(x+15,y,z+6);
make_cube(x+14,y,z+6);
make_cube(x+13,y,z+7);
make_cube(x+12,y,z+7);
make_cube(x+13,y,z+6);
make_cube(x+12,y,z+6);
make_cube(x+15,y,z+5);
make_cube(x+14,y,z+5);
make_cube(x+15,y,z+4);
make_cube(x+14,y,z+4);
make_cube(x+13,y,z+5);
make_cube(x+12,y,z+5);
make_cube(x+13,y,z+4);
make_cube(x+12,y,z+4);
make_cube(x+11,y,z+7);
make_cube(x+10,y,z+7);
make_cube(x+11,y,z+6);
make_cube(x+10,y,z+6);
make_cube(x+9,y,z+7);
make_cube(x+8,y,z+7);
make_cube(x+9,y,z+6);
make_cube(x+8,y,z+6);
make_cube(x+11,y,z+5);
make_cube(x+10,y,z+5);
make_cube(x+11,y,z+4);
make_cube(x+10,y,z+4);
make_cube(x+9,y,z+5);
make_cube(x+8,y,z+5);
make_cube(x+9,y,z+4);
make_cube(x+8,y,z+4);
make_cube(x+15,y,z+3);
make_cube(x+14,y,z+3);
make_cube(x+15,y,z+2);
make_cube(x+14,y,z+2);
make_cube(x+13,y,z+3);
make_cube(x+12,y,z+3);
make_cube(x+13,y,z+2);
make_cube(x+12,y,z+2);
make_cube(x+15,y,z+1);
make_cube(x+14,y,z+1);
make_cube(x+15,y,z+0);
make_cube(x+14,y,z+0);
make_cube(x+13,y,z+1);
make_cube(x+12,y,z+1);
make_cube(x+13,y,z+0);
make_cube(x+12,y,z+0);
make_cube(x+11,y,z+3);
make_cube(x+10,y,z+3);
make_cube(x+11,y,z+2);
make_cube(x+10,y,z+2);
make_cube(x+9,y,z+3);
make_cube(x+8,y,z+3);
make_cube(x+9,y,z+2);
make_cube(x+8,y,z+2);
make_cube(x+11,y,z+1);
make_cube(x+10,y,z+1);
make_cube(x+11,y,z+0);
make_cube(x+10,y,z+0);
make_cube(x+9,y,z+1);
make_cube(x+8,y,z+1);
make_cube(x+9,y,z+0);
make_cube(x+8,y,z+0);
make_cube(x+7,y,z+7);
make_cube(x+6,y,z+7);
make_cube(x+7,y,z+6);
make_cube(x+6,y,z+6);
make_cube(x+5,y,z+7);
make_cube(x+4,y,z+7);
make_cube(x+5,y,z+6);
make_cube(x+4,y,z+6);
make_cube(x+7,y,z+5);
make_cube(x+6,y,z+5);
make_cube(x+7,y,z+4);
make_cube(x+6,y,z+4);
make_cube(x+5,y,z+5);
make_cube(x+4,y,z+5);
make_cube(x+5,y,z+4);
make_cube(x+4,y,z+4);
make_cube(x+3,y,z+7);
make_cube(x+2,y,z+7);
make_cube(x+3,y,z+6);
make_cube(x+2,y,z+6);
make_cube(x+1,y,z+7);
make_cube(x+0,y,z+7);
make_cube(x+1,y,z+6);
make_cube(x+0,y,z+6);
make_cube(x+3,y,z+5);
make_cube(x+2,y,z+5);
make_cube(x+3,y,z+4);
make_cube(x+2,y,z+4);
make_cube(x+1,y,z+5);
make_cube(x+0,y,z+5);
make_cube(x+1,y,z+4);
make_cube(x+0,y,z+4);
make_cube(x+7,y,z+3);
make_cube(x+6,y,z+3);
make_cube(x+7,y,z+2);
make_cube(x+6,y,z+2);
make_cube(x+5,y,z+3);
make_cube(x+4,y,z+3);
make_cube(x+5,y,z+2);
make_cube(x+4,y,z+2);
make_cube(x+7,y,z+1);
make_cube(x+6,y,z+1);
make_cube(x+7,y,z+0);
make_cube(x+6,y,z+0);
make_cube(x+5,y,z+1);
make_cube(x+4,y,z+1);
make_cube(x+5,y,z+0);
make_cube(x+4,y,z+0);
make_cube(x+3,y,z+3);
make_cube(x+2,y,z+3);
make_cube(x+3,y,z+2);
make_cube(x+2,y,z+2);
make_cube(x+1,y,z+3);
make_cube(x+0,y,z+3);
make_cube(x+1,y,z+2);
make_cube(x+0,y,z+2);
make_cube(x+3,y,z+1);
make_cube(x+2,y,z+1);
make_cube(x+3,y,z+0);
make_cube(x+2,y,z+0);
make_cube(x+1,y,z+1);
make_cube(x+0,y,z+1);
make_cube(x+1,y,z+0);
make_cube(x+0,y,z+0);    
}