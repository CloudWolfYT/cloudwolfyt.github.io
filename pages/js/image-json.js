var canvas = document.createElement('canvas');
var ctx = canvas.getContext("2d");
var image;
var nw = 16;
var nh = 16;
var counter = document.getElementById("output");
var customBtn = document.getElementById("uploadFile");
var realFileBtn = document.getElementById("myFile");
var customTxt = document.getElementById("uploadText");
var myname = "";
var area = document.createElement('textarea');
var frame = 0;
var fps = 1;
var isIMG = 0;

customBtn.addEventListener("click", function() {
  realFileBtn.click();
});
document.getElementById('myFile').onchange = function (evt) {
    if (realFileBtn.value) {
    customTxt.innerHTML = realFileBtn.value.match(
      /[\/\\]([\w\d\s\.\-\(\)]+)$/
    )[1];
    myname = customTxt.innerHTML;
    myname = myname.substring(0, myname.indexOf('.'));
    } else {
      customTxt.innerHTML = "No file chosen, yet.";
    }
  
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr,files[0].name);
        fr.readAsDataURL(files[0]);
    }
}
function showImage(fileReader,name) {
    var img = document.createElement('img');
    img.onload = () => getImageData(img);
    img.src = fileReader.result;
    if(isImage(name)) {isIMG = 1;}
    if(isVideo(name)) {
      isIMG = 0;
      getVideoLength(img.src,processVideo);
    }
}
function getImageData(img) {
    nw = document.getElementById("width").value;
    nh = document.getElementById("height").value;
    ctx.scale(nw / img.width ,nh / img.height);
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, nw, nh).data;
    
}

function extract_data(imageData,ele,startpt) {
  var results = '';
  var px = 0;
  for(var i=0; i<ele; i+=4) {
    if(px < nw) {
      if(i < ele-4) {
        results = results.concat('{"text":"█","color":"#' + fullColorHex(imageData[i+startpt],imageData[i+1+startpt],imageData[i+2+startpt]) + '"},');
    } else {
        results = results.concat('{"text":"█","color":"#' + fullColorHex(imageData[i+startpt],imageData[i+1+startpt],imageData[i+2+startpt]) + '"}');
    }
    } else {
      results = results.concat('{"text":"\\n█","color":"#' + fullColorHex(imageData[i+startpt],imageData[i+1+startpt],imageData[i+2+startpt]) + '"},');
      px = 0;
    }
    px++;
  }
  return results;
}

function getCode() {
  if(document.getElementById("tellrawChoice").checked) {
  area.value = 'tellraw @s [' + extract_data(imageData,imageData.length,0) + ']';
  } else {
    area.value = '#list of summon entities';
    for(var i = 0; i < nh; i++) {
      area.value = area.value.concat('\nsummon area_effect_cloud ~ ~'+ ((nh - i)*0.225) +' ~ {Age:-2147483648,Duration:-1,WaitTime:-2147483648,Tags:["cw_hologram","'+myname +'"],CustomNameVisible:1b,CustomName:\'[' + extract_data(imageData,nh*4,i*nh*4) + ']\'}');    
    }
  }
  download(area.value,'export','.txt');
}

function copy_text() {
  if(isIMG) {
    getCode();
  } else {
    download(area.value,'export','.txt');
  }
}
var fullColorHex = function(r,g,b) {   
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return red+green+blue;
};
var rgbToHex = function (rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};
function isImage(filename) {
  var ext = getExtension(filename);
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'png':
      //etc
      return true;
  }
  return false;
}
function isVideo(filename) {
  var ext = getExtension(filename);
  switch (ext.toLowerCase()) {
    case 'mp4':
      // etc
      return true;
  }
  return false;
}
function getExtension(filename) {
  var parts = filename.split('.');
  return parts[parts.length - 1];
}

function processVideo(path,e,dur) {
   nw = document.getElementById("width").value;
   nh = document.getElementById("height").value;
   fps = document.getElementById('fps').value;
   counter.textContent = Math.floor(dur*fps);
   if(document.getElementById("tellrawChoice").checked) {
   area.value = "scoreboard players add @s cw_images 1\nscoreboard players set @s[scores={cw_images="+Math.floor(dur*fps)+"..}] cw_images 0";
   } else {
    area.value = "scoreboard players add "+myname+" cw_images 1\nexecute if score "+myname+" cw_images matches "+Math.floor(dur*fps)+".. run scoreboard players set "+myname+" cw_images 0";  
   }
   for(var i = 1; i < Math.floor(dur*fps) + 1; i++) {
     var k = i/fps;
     getVideoImageAsArray(path,k,vidDone);
   }
}
function vidDone(imageData,e,vidDur,pp) {
  if(document.getElementById("tellrawChoice").checked) {
  area.value = area.value.concat('\nexecute if score @s cw_images matches '+ pp + ' run tellraw @s [' + extract_data(imageData,imageData.length,0) + ']');
  } else {
    for(var i = 0; i < nh; i++) {
      area.value = area.value.concat('\nexecute if score '+myname +' cw_images matches '+ pp + ' run summon area_effect_cloud ~ ~'+ ((nh - i)*0.225) +' ~ {Age:-2147483648,Duration:-1,WaitTime:-2147483648,Tags:["cw_hologram","'+myname +'"],CustomNameVisible:1b,CustomName:\'[' + extract_data(imageData,nh*4,i*nh*4) + ']\'}');    
    }
  }
  counter.textContent = parseInt(counter.textContent) - 1;
  if(parseInt(counter.textContent) == 0) {
    counter.textContent = "Vid Loaded";
  }
}
function getVideoLength(path,callback) {
    var video = document.createElement('video');
    video.src = path;
    video.currentTime=1; 
    
    //On Frame change
    video.onseeked = function(e) {
        callback(path,e,video.duration);
    };
}
function getVideoImageAsArray(path, secs, callback) {
    var video = document.createElement('video');
    video.src = path;
    if (secs >= video.duration){
        console.log("Skipping out of bounds frame")
        return;
    }
    video.currentTime=secs; 
    
    //On Frame change
    video.onseeked = function(e) {
        var canvas = document.createElement('canvas');
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        var ctx = canvas.getContext('2d');
        ctx.scale(nw/canvas.width,nh/canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        //Get the image data as an array of [r][g][b][a]
        var imageData = ctx.getImageData(0, 0, nw, nh).data;
        if(imageData) {console.log("found");}
        //callback with the array
        callback(imageData,e,video.duration,secs*fps);
        canvas.remove();
    };
    //If there's an error
    video.onerror = function(e) {
        callback.call(this, undefined, undefined, e);
    };
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
        url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}