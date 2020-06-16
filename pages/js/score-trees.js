var all_blocks = [];
var blocks = [];
var branches = document.getElementById("branches");
var folder = document.getElementById("folder");
var fold = document.getElementById("fold");
var player = document.getElementById("player");
var elements = document.getElementById("elements");
var start = document.getElementById("start_pt");
var objective = document.getElementById("objective");
var namespace = document.getElementById("namespace");
var output = document.getElementById("output");
var pbar = document.getElementById("progress_bar");

function get_zip() {
  var zip = new JSZip();
  zip.folder("functions");
  if(fold.checked) {
    parse_output_folded(zip,parseInt(branches.value),folder.value,output.value,parseInt(elements.value),parseInt(start.value),namespace.value,player.value,objective.value);
  } else {
    parse_output(zip,parseInt(branches.value),folder.value,output.value,parseInt(elements.value),parseInt(start.value),namespace.value,player.value,objective.value);
  }
  getDatapack(zip);
}
async function getDatapack(zip) {
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `score-trees.zip`);
  //document.getElementById("pbarDiv").style = "visibility:hidden";
}

function parse_output(zip,tree,folder,command,length,start_pt,namespace,player,objective) {
  //establish tree numberspace and settings
  var levels = Math.ceil(Math.log(length)/Math.log(tree));
  var numLine = [];
  for (var i = 0; i <= length; i++) {
    numLine[i] = i+start_pt;
  }

  for(var l = 0; l<levels+1; l++) {
    var m = 0;
    var length = numLine.length;
    var new_numLine = [];
    zip.folder("functions/"+folder+"/l"+l);
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "";
    if(l==0) {
      for(k = i; (k < (i + tree) && !(k>=length)); k++) {
        var demo = command.replace(/\$score/g,numLine[k]);
        demo = demo.replace(/\$objective/g,objective);
        new_numLine.push(numLine[k]);
        zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+k+".mcfunction"],demo);
      }
    } else {
      for(var j = 0; j < tree; j++) {
          if(l==1) {
            ins = ins.concat("execute if score "+player+" "+objective+" matches "+numLine[i-tree+1+j+1]+" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n")
          } else {
            var current = numLine[i-tree+1+j+1];
            var next = numLine[i-tree+1+j+1+1];
            if(i+j>0) {
            if(current && next) {
              ins = ins.concat("execute if score "+player+" "+objective+" matches "+current+".."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
              } else if(current && !next) {
                ins = ins.concat("execute if score "+player+" "+objective+" matches "+current+".. run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
              } else if(!current && next) {
                ins = ins.concat("execute if score "+player+" "+objective+" matches .."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
              }
            } else {
                ins = ins.concat("execute if score "+player+" "+objective+" matches .."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
            }
          }
        }
        new_numLine.push(numLine[i]);
        zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
        if(l==levels) {
          zip.file(["functions/"+folder+".mcfunction"],"function "+namespace+":"+folder+"/l"+l+"/l"+l+"_"+m);
        }
      }
      m++;
    }
    numLine = new_numLine;
  }
}
function parse_output_folded(zip,tree,folder,command,length,start_pt,namespace,player,objective) {
  //establish tree numberspace and settings
  var levels = Math.ceil(Math.log(length)/Math.log(tree));
  var numLine = [];
  for (var i = 0; i <= length; i++) {
    numLine[i] = i+start_pt;
  }

  for(var l = 0; l<levels; l++) {
    var m = 0;
    var length = numLine.length;
    var new_numLine = [];
    zip.folder("functions/"+folder+"/l"+l);
  for(var i = 0; i < length; i+=(tree)) {
    var ins = "";
      for(var j = 0; j < tree; j++) {
          if(l==0) {
            var demo = command.replace(/\$score/g,numLine[i-tree+1+j+1]);
            demo = demo.replace(/\$objective/g,objective);
            ins = ins.concat(demo + '\n');
          } else {
            var current = numLine[i-tree+1+j+1];
            var next = numLine[i-tree+1+j+1+1];
            if(i+j>0) {
            if(current && next) {
              ins = ins.concat("execute if score "+player+" "+objective+" matches "+current+".."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
              } else if(current && !next) {
                ins = ins.concat("execute if score "+player+" "+objective+" matches "+current+".. run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");
              } else if(!current && next) {
                ins = ins.concat("execute if score "+player+" "+objective+" matches .."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
              }
            } else {
                ins = ins.concat("execute if score "+player+" "+objective+" matches .."+ parseInt(next -1) +" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+parseInt(i+j)+"\n");   
            }
          }
        }
        new_numLine.push(numLine[i]);
        zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
        if(l==levels-1) {
          zip.file(["functions/"+folder+".mcfunction"],"function "+namespace+":"+folder+"/l"+l+"/l"+l+"_"+m);
        }
      m++;
    }
    numLine = new_numLine;
  }
}