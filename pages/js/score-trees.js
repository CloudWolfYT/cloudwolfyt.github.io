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
  //if(fold.checked) {
  //  parse_output_folded(zip,parseInt(branches.value),folder.value,output.value,parseInt(start.value),parseInt(elements.value),namespace.value,player.value,objective.value);
  //} else {
    parse_output(zip,parseInt(branches.value),folder.value,output.value,parseInt(start.value),parseInt(elements.value),namespace.value,player.value,objective.value);
  //}
  getDatapack(zip);
}
async function getDatapack(zip) {
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `score-trees.zip`);
  //document.getElementById("pbarDiv").style = "visibility:hidden";
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
    id_end[i] = i+1+start;
  }

  m = 0; ins = ""; ins1 = ""; l = 0; y = 0;
  for(var i = 0; i < length; i+=tree) {
    for(var j = i; j < i+tree; j++) {
      if(j < length) {
        var cmd = command.replace(/\$score/g,j + start);
        cmd = cmd.replace(/\$objective/g,objective);
        cmd = cmd.replace(/\$props/g,"");
        cmd = cmd.replace(/\$nprops/g,"");
        ins = ins.concat(cmd+"\n"); 
      }
    }
    zip.file(["functions/"+folder+"/l"+l+"/l"+l+"_"+m+".mcfunction"],ins);
    m++;
    ins = "";
  }

  for(var l = 1; l < levels; l++) {
    zip.folder("functions/"+folder+"/l"+l);
    k = 0;
    p = 0;
    m=0;
    for(var i = 0; i < length; i+=tree) {
      var i2 = i+tree-1;
      if(i+tree >= length && (length % tree) > 0) {i2 = i + (length % tree) - 1;}
      ins = ins.concat("execute if score "+player+" "+objective+" matches "+id_front[i]+".."+id_end[i2]+" run function "+namespace+":"+folder+"/l"+(l-1)+"/l"+(l-1)+"_"+k+"\n");
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
    if(l==levels-1) {
      zip.file(["functions/"+folder+".mcfunction"],"function "+namespace+":"+folder+"/l"+l+"/l"+l+"_"+0);
    }
  }
}