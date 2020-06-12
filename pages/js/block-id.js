var all_blocks = [];
var blocks = [];
var tree = 2;
var pbar = document.getElementById("progress_bar");

function get_zip() {
  pbar.value = 0;
  //document.getElementById("pbarDiv").style = "visibility:shown";
  document.getElementsByName('getZip').checked = false;
  get_jsons("../blocks.json");
}
function get_zip1() {
  var zip = new JSZip();
  zip.folder("bsc/tags/blocks");
  zip.folder("bsc/functions/read");
  block_tags(zip,tree);
  if(document.getElementsByName('read')[0].checked) {
    zip.folder("bsc/functions/read");
    parse_input(zip,tree,"read","execute if block ~ ~ ~ $block[$props] run scoreboard players set block bsc $id");
  }
  if(document.getElementsByName('opSetblock')[0].checked) {
    zip.folder("bsc/functions/setblock");
    parse_output(zip,tree,"setblock","execute if score block bsc matches $id run setblock ~ ~ ~ $block[$props]");
  }
  if(document.getElementsByName('opMirrored')[0].checked) {
    zip.folder("bsc/functions/mirrored");
    get_setblock_mirrored(zip,tree,"mirrored","setblock ~ ~ ~ ","");
  }
  if(document.getElementsByName('opFallBlock')[0].checked) {
    zip.folder("bsc/functions/falling_block");
    parse_output(zip,tree,'falling_block',"execute if score block bsc matches $id run summon falling_block ~ ~ ~ {BlockState:{Name:\"$block\",Properties:{$nprops}},Time:1}");
  }
  
  if(document.getElementsByName('customOutputCK')[0].checked) {
    parse_output(zip,tree,document.getElementsByName('customOutputName')[0].value,document.getElementsByName("customOutput")[0].value);
  }
  if(document.getElementsByName('customInputCK')[0].checked) {
    parse_input(zip,tree,document.getElementsByName('customInputName')[0].value,document.getElementsByName("customInput")[0].value);
  }

  getDatapack(zip);
}
async function getDatapack(zip) {
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `cw_bsc_namespace.zip`);
  //document.getElementById("pbarDiv").style = "visibility:hidden";
}

function get_jsons(block_list) { //transforms the blocks.json into a full length object
  fetch(block_list)
  .then(function(resp) {
    console.log(resp);
    return resp.json();
  })
  .then(function(data) {
    all_blocks = [];
    blocks = Object.keys(data);
    for(i in blocks) {
      for(j in data[blocks[i]].states) {
        const namespace = {"block": blocks[i]}
        all_blocks.push(Object.assign(data[blocks[i]].states[j],namespace));
      }
    }      get_zip1();
  });
}
function get_formatted_props(block) {
  var str = block.block+"[";
    for(k in block.properties) {
      str = str.concat(k+":"+block.properties[k]+",");
    }
    if(str.substr(-1) == ",") {
      str = str.substring(0, str.length - 1);
      str = str.concat("]");
    } else {
      str = str.substring(0, str.length - 1);
    }
    return str;
}


function block_tags(zip,tree) {
  var temp_blocks = blocks;
  var levels = Math.ceil(Math.log(blocks.length)/Math.log(tree));
  for(var l = 0; l<levels; l++) {
  var m = 0;
  var length = temp_blocks.length;
  var new_blocks = [];
  zip.folder("bsc/tags/blocks/l");
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "{\"values\":[";
      for(var j = 0; j < tree; j++) {
        if(typeof temp_blocks[i+j] != 'undefined') {
        if(j == tree - 1 || typeof temp_blocks[i+j+1] == 'undefined') {ins = ins.concat('"'+temp_blocks[i+j]+'"');} 
        else {ins = ins.concat('"'+temp_blocks[i+j]+'",');}
        }
      }
      ins = ins.concat(']}');
      new_blocks.push("#bsc:l"+l+"_"+m);
      zip.file(["bsc/tags/blocks/l"+l+"_"+m+".json"],ins);
      m++;
    }
    temp_blocks = new_blocks;
  }
}
function parse_output(zip,tree,folder,command) {
  var temp_blocks = blocks;
  var levels = Math.ceil(Math.log(blocks.length)/Math.log(tree));
  for(var l = 0; l<levels; l++) {
  var m = 0;
  var length = temp_blocks.length;
  var new_blocks = [];
  zip.folder("bsc/functions/"+folder+"/l"+l);
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "";
      for(var j = 0; j < tree; j++) {
        if(l==0 && typeof temp_blocks[i+j] != 'undefined') {
          var props = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i+j];
          })
          for(u in props) {
            var demo = command.replace(/\$id/g,props[u].id);
            demo = demo.replace(/\$block/g,temp_blocks[i+j]);
            var prop_list = "";
            var prop_list1 = "";
            if(props[u].properties) {
              var key = Object.keys(props[u].properties);
              for(v in key) {
                 prop_list = prop_list.concat(key[v]+"="+props[u].properties[key[v]]+",");
                 prop_list1 = prop_list1.concat(key[v]+":"+props[u].properties[key[v]]+",");
              }
              prop_list = prop_list.substring(0, prop_list.length - 1);
              prop_list1 = prop_list1.substring(0, prop_list1.length - 1);
            }
            demo = demo.replace(/\$props/g,prop_list);
            ins = ins.concat(demo.replace(/\$nprops/g,prop_list1)+"\n");
          }
        } else if(typeof temp_blocks[i+j] != 'undefined') {
          var current = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i-tree+1+j+1];
          })
          var next = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i-tree+1+j+1+1];
          })
          if(i+j>0) {
          if(current[0] && next[0]) {
            ins = ins.concat("execute if score block bsc matches "+current[0].id+".."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
            } else if(current[0] && !next[0]) {
              ins = ins.concat("execute if score block bsc matches "+current[0].id+".. run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
            } else if(!current[0] && next[0]) {
              ins = ins.concat("execute if score block bsc matches .."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
            }
          } else {
              ins = ins.concat("execute if score block bsc matches .."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
          }
        }
      }
      new_blocks.push(temp_blocks[i]);
      zip.file(["bsc/functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
      if(l==levels-1) {
        zip.file(["bsc/functions/"+folder+".mcfunction"],"function bsc:"+folder+"/l"+l+"/l"+l+"_"+m);
      }
      m++;
    }
    temp_blocks = new_blocks;
  }
}
function parse_input(zip,tree,folder,command) {
  var temp_blocks = blocks;
  var levels = Math.ceil(Math.log(blocks.length)/Math.log(tree));
  for(var l = 0; l<levels; l++) {
  var m = 0;
  var length = temp_blocks.length;
  var new_blocks = [];
  zip.folder("bsc/functions/"+folder+"/l"+l);
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "";
      for(var j = 0; j < tree; j++) {
        if(l==0 && typeof temp_blocks[i+j] != 'undefined') {
          var props = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i+j];
          })
          for(u in props) {
            var demo = command.replace(/\$id/g,props[u].id);
            demo = demo.replace(/\$block/g,temp_blocks[i+j]);
            var prop_list = "";
            var prop_list1 = "";
            if(props[u].properties) {
              var key = Object.keys(props[u].properties);
              for(v in key) {
                 prop_list = prop_list.concat(key[v]+"="+props[u].properties[key[v]]+",");
                 prop_list1 = prop_list1.concat(key[v]+":"+props[u].properties[key[v]]+",");
              }
              prop_list = prop_list.substring(0, prop_list.length - 1);
              prop_list1 = prop_list1.substring(0, prop_list1.length - 1);
            }
            demo = demo.replace(/\$props/g,prop_list);
            ins = ins.concat(demo.replace(/\$nprops/g,prop_list1)+"\n");
          }
        } else if(typeof temp_blocks[i+j] != 'undefined') {
          ins = ins.concat("execute if block ~ ~ ~ "+temp_blocks[i+j]+" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
        }
      }
      new_blocks.push("#bsc:l"+l+"_"+m);
      zip.file(["bsc/functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
      if(l==levels-1) {
        var master = "data remove storage bsc nbt\nexecute if data block ~ ~ ~ {} run data modify storage bsc nbt set from block ~ ~ ~"
        zip.file(["bsc/functions/"+folder+".mcfunction"],[master + "\nfunction bsc:"+folder+"/l"+l+"/l"+l+"_"+m]);
      }
      m++;
    }
    temp_blocks = new_blocks;
  }
}

// Extra random stuff
function get_setblock_mirrored(zip,tree,folder,pre_cmd,post_cmd) {
  var temp_blocks = blocks;
  var levels = Math.ceil(Math.log(blocks.length)/Math.log(tree));
  for(var l = 0; l<levels; l++) {
  var m = 0;
  var length = temp_blocks.length;
  var new_blocks = [];
  zip.folder("bsc/functions/"+folder+"/l"+l);
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "";
      for(var j = 0; j < tree; j++) {
        if(l==0 && typeof temp_blocks[i+j] != 'undefined') {
          var props = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i+j];
          })
          for(u in props) {
            ins = ins.concat("execute if score block bsc matches "+props[u].id+" run "+pre_cmd+temp_blocks[i+j]);
            if(props[u].properties) {
              ins = ins.concat("[");
              var key = Object.keys(props[u].properties);
              for(v in key) {
                var type = key[v];
                var mirror = props[u].properties[key[v]];
                switch(type) {
                  case "rotation": 
                   const a = (parseInt(mirror) + 8); 
                   mirror = (a >= 16 ? (a - 16) : a).toString();
                   break;
                  case "east": type = "west"; break;
                  case "west": type = "east"; break;
                  case "north": type = "south"; break;
                  case "south": type = "north"; break;
                }
                 switch(mirror) {
                   case "east": mirror = "west"; break;
                   case "west": mirror = "east"; break;
                   case "north": mirror = "south"; break;
                   case "south": mirror = "north"; break;
                   case "north_east": mirror = "south_west"; break;
                   case "north_west": mirror = "south_east"; break;
                   case "south_east": mirror = "north_west"; break;
                   case "south_west": mirror = "north_east"; break;
                   case "ascending_east": mirror = "ascending_west"; break;
                   case "ascending_west": mirror = "ascending_east"; break;
                   case "ascending_north": mirror = "ascending_south"; break;
                   case "ascending_south": mirror = "ascending_north"; break;
                 }
                
                 ins = ins.concat(type+"="+mirror+",");
              }
              ins = ins.substring(0, ins.length - 1);
              ins = ins.concat("]"+post_cmd+"\n");
            } else {
              ins = ins.concat(post_cmd+"\n");
            }
          }
        } else if(typeof temp_blocks[i+j] != 'undefined') {
          var current = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i-tree+1+j+1];
          })
          var next = all_blocks.filter(obj => {
            return obj.block === temp_blocks[i-tree+1+j+1+1];
          })
          if(i+j>0) {
          if(current[0] && next[0]) {
            ins = ins.concat("execute if score block bsc matches "+current[0].id+".."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
            } else if(current[0] && !next[0]) {
              ins = ins.concat("execute if score block bsc matches "+current[0].id+".. run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
            } else if(!current[0] && next[0]) {
              ins = ins.concat("execute if score block bsc matches .."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
            }
          } else {
              ins = ins.concat("execute if score block bsc matches .."+ parseInt(next[0].id -1) +" run function bsc:"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
          }
        }
      }
      new_blocks.push(temp_blocks[i]);
      zip.file(["bsc/functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
      if(l==levels-1) {
        zip.file(["bsc/functions/"+folder+".mcfunction"],"function bsc:"+folder+"/l"+l+"/l"+l+"_"+m);
      }
      m++;
    }
    temp_blocks = new_blocks;
  }
}