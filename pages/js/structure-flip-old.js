import * as THREE from '../js/libs/three/three.module.js';
import { OrbitControls } from '../js/libs/three/OrbitControls.js';

const cmd_box = document.getElementById("command-box");

let camera, controls, scene, renderer;
init();
animate();
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x222222 );
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

    renderer = new THREE.WebGLRenderer( { antialias: false , CullFaceFrontBack:true} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.set( 25, 25, 25 );
    camera.lookAt(new THREE.Vector3(0,0,0));

	controls = new OrbitControls( camera, renderer.domElement );
	controls.listenToKeyEvents( window ); // optional
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

	load();

	const dirLight1 = new THREE.DirectionalLight( 0xffffff );
	dirLight1.position.set( 1, 1, 1 );
	scene.add( dirLight1 );

	const dirLight2 = new THREE.DirectionalLight( 0x002288 );
	dirLight2.position.set( - 1, - 1, - 1 );
	scene.add( dirLight2 );

	const ambientLight = new THREE.AmbientLight( 0x222222 );
	scene.add( ambientLight );
    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
    requestAnimationFrame( animate );
    controls.update(); 
    render();
}
function render() {
    renderer.render( scene, camera );
}

function load() {    
    get_jsons("../json/"+"1.17"+"/blocks.json");
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
      }      list_of_materials();
    });
}

var ind = 0; var reps = 0; var block = -1;
var blocks = [0]; var size = [0,0,0]; var id_mapping = []; var block_ids = [];
function list_of_materials() {
    const pos_save_start = cmd_box.value.search("save") + 5;
    const pos_size_start = cmd_box.value.search("size") + 5;
    const pos_save_end = (cmd_box.value.slice(pos_save_start, pos_size_start - 5)).search("]") + pos_save_start + 1;
    const pos_size_end = (cmd_box.value.slice(pos_size_start, cmd_box.value.length)).search("]") + pos_size_start + 1;
    blocks = JSON.parse(cmd_box.value.slice(pos_save_start,pos_save_end));
    var sorted = JSON.parse(cmd_box.value.slice(pos_save_start,pos_save_end));
    size = JSON.parse(cmd_box.value.slice(pos_size_start,pos_size_end));
    size[1]--;
    
    // Sort so that you get 1 element per block type
    sorted.sort(function(a, b) {
        return a - b;
      });
    var bprev = 0; var k = 0;
    for(var i in sorted) {
        if(sorted[i] > 0) {
            if(sorted[i] != bprev) {
                bprev = sorted[i];
                block_ids[k] = all_blocks.filter(obj => {return obj.id === sorted[i];});
                id_mapping[k] = sorted[i];
                k++;
            }
        }
    }
    console.log(block_ids);

    var files = [];
    const path = '../assets/minecraft/models/block/';
    for(var i in block_ids) {
        var block_name = block_ids[i][0].block;
        block_name = block_name.slice(10,block_name.length);
        files[i] = path+block_name+'.json';
    }
    fetchAll(files);
}

function fetchAll(resources) {
    return Promise.all(resources.map(url => fetch(url).then(res => res.json()))).then(data => {load_materials(data);});
}

var material_list = [[]];
var geometry_list = [];
function load_materials(jsons) {
    for(var i in jsons) {
        console.log(jsons[i]);
        switch(jsons[i].parent) {
            case "minecraft:block/cube_bottom_top":
            case "block/block": {
                geometry_list[i] = new THREE.BoxGeometry( 1, 1, 1 );
                const path = '../assets/minecraft/textures/';
                material_list[i] = [new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.top) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.bottom) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) })];
                break;
            }
            case "minecraft:block/cube_all": {
                geometry_list[i] = new THREE.BoxGeometry( 1, 1, 1 );
                const path = '../assets/minecraft/textures/';
                material_list[i] =  new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.all) });
                break;
            }
            case "minecraft:block/slab": {
                var geometry = new THREE.BoxGeometry( 1, 0.5, 1 );
                const side_map = [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 0.5)];
                const top_map =  [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)];
                geometry.faceVertexUvs = [side_map, side_map, top_map, top_map, side_map, side_map]
                geometry_list[i] = geometry;

                const path = '../assets/minecraft/textures/';
                console.log(jsons[i].textures);
                material_list[i] = [new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.top) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.bottom) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) }),
                                    new THREE.MeshBasicMaterial({ map: new_texture(jsons[i].textures.side) })];
                break;
            }
            default: {
                geometry_list[i] = new THREE.BoxGeometry( 1, 1, 1 );
                material_list[i] =  new THREE.MeshPhongMaterial( { color: "hsl(0, 100%, 50%)", flatShading: true } );
            }
        }
    }
    console.log(material_list);
    console.log(geometry_list);

    build_space();
}

function new_texture(name) {
    const path = '../assets/minecraft/textures/';
    var clean_name = name.replace(/minecraft:/g, "");
    const texture = new THREE.TextureLoader().load(path+clean_name+'.png');
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter; //Unblurrify
    return texture;
}

function build_space() {
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
	const material = new THREE.MeshPhongMaterial( { color: "hsl(50, 100%, 50%)", flatShading: true } );

    //Domain Calculations
    var n_x = Math.floor(size[0] / 16);
    var edge_x = size[0] % 16;
    var n_z = Math.floor(size[2] / 16);
    var edge_z = size[2] % 16;

    var x = size[0] - (size[0] % 16);
    var y = size[1] + 10;
    var z = size[2] - (size[2] % 16);
    var xi = x; var zi = z;
    console.log(size);
    reps = 0; 
    ind = blocks.length - 1;
    block = -1;
    for (var i = n_z; i >= 0 ; i--) {
        for (var j = n_x; j >= 0; j--) {
            for(var k = 0; k <= y; k++) {
                if(i == n_z && j == n_x) {
                    zcurve_edge( xi, y - k, zi,edge_x,edge_z);
                } else if(i == n_z && j != n_x) {
                    zcurve_edge( xi, y - k, zi,15,edge_z);
                } else if(i != n_z && j == n_x) {
                    zcurve_edge( xi, y - k, zi,edge_x,15);
                } else {
                    zcurve( xi, y - k, zi);
                }
            }
            xi -= 16;
        }
        xi = x;
        zi -= 16;
    }
}

function make_cube(x, y ,z) {
    if(reps <= 1) {
        block = blocks[ind];
        ind--;
        if(blocks[ind] < 0) {
            reps = -(blocks[ind]);
            ind--;
        }
    } else {
        reps--;
    }
    if(block > 0) {
        const mesh = new THREE.Mesh( geometry_list[id_mapping.indexOf(block)], material_list[id_mapping.indexOf(block)] );

	    mesh.position.x = x;
	    mesh.position.y = y;
	    mesh.position.z = z;
	    mesh.updateMatrix();
	    mesh.matrixAutoUpdate = false;
	    scene.add( mesh );
    }
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