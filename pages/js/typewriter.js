var editor = new Quill('#editor-container', {
    modules: {
      toolbar: '#toolbar'
    },
    placeholder: '',
    theme: 'snow'  // or 'bubble'
  });
  var selector = document.querySelector('#selector');
  selector.addEventListener('click', function() {
    var range = editor.getSelection();
    if (range) {
      if(editor.getFormat(range.index,range.length).background != '#cce8cc') {
      editor.formatText(range.index, range.length,'background','#cce8cc');
      } else {
        editor.removeFormat(range.index, range.length,'background');
      }
    }
  });
  
  editor.on('text-change', function() {
    var text = editor.getText();
    var raw = editor.root.innerHTML;
    var length = editor.getLength();
    var output = [""];
    var current_prop = {color:'black',bold:false,italic:false,underlined:false,strikethrough:false,obfuscated:false};
    
    for (i = 0; i < length-1; i++) {
     var char = text[i];
     //// Determine type of text /////////////////////////////////////
     var bg = editor.getFormat(i,1).background;
     var slength = 0;
     if(bg=="#cce8cc") { //Obtains the piece of the backgrounded text
       for(j = 0; j < length-1; j++) {
         var bg1 = editor.getFormat((i+j),1).background;
         slength++;
         if(bg1!="#cce8cc") {slength--; break;}
       }
       output.push({selector: text.slice(i,i+slength)});
       slength--;
     } else {
       output.push({text: char});
     }
     
     var color = editor.getFormat(i,1).color;
     var color_name = mc_colors(color);
     var bold = editor.getFormat(i,1).bold;
     if(bold == undefined) bold = false;
     var italics = editor.getFormat(i,1).italic;
     if(!italics) italics = false;
     var underlined = editor.getFormat(i,1).underline;
     if(!underlined) underlined = false;
     var strikethrough = editor.getFormat(i,1).strike;
     if(!strikethrough) strikethrough = false;
     
     // if(current_prop.color != color_name) {
         output[i+1].color = color_name;
     //     current_prop.color = color_name;
     // }
     // if(current_prop.bold != bold) {
      if(bold)
         output[i+1].bold = bold;
     //     current_prop.bold = bold;
     // }
     // if(current_prop.italics != italics) {
      if(italics)
         output[i+1].italic = italics;
     //     current_prop.italics = italics;
     // }
     // if(current_prop.underlined != underlined) {
      if(underlined)
         output[i+1].underlined = underlined;
     //     current_prop.underlined = underlined;
     // }
     // if(current_prop.strikethrough != strikethrough) {
      if(strikethrough)
         output[i+1].strikethrough = strikethrough;
     //     current_prop.strikethrough = strikethrough;
     // }
    
     i += (slength);
    }
    
    var command = "'" + JSON.stringify(output[1]) + "'";
    var elements = output.length - 1;
    if(elements>1) {
      for(i=0; i < elements - 1; i++) {
        command = command.concat(',',"'" + JSON.stringify(output[i+2]) + "'");
      }
    }
    document.getElementsByName('output')[0].value= 'execute at @e[tag=cw_typewriter] run replaceitem block ~ ~ ~ container.0 stick{cw_type:[' + command + ']}' + '\nexecute at @e[tag=cw_typewriter] run function cw_tw:type_write';
  });
  
  
  
  function mc_colors(color) {
    var color_name = 'black';
    switch(color) {
      case "#aa0000":
        color_name = 'dark_red';
        break;
      case "#ff5555":
        color_name = 'red';
        break;
      case "#ffaa00":
        color_name = 'gold';
        break;
      case "#ffff55":
        color_name = 'yellow';
        break;
      case "#00aa00":
        color_name = 'dark_green';
        break;
      case "#55ff55":
        color_name = 'green';
        break;   
      case "#55ffff":
        color_name = 'aqua';
        break;
      case "#00aaaa":
        color_name = 'dark_aqua';
        break;
      case "#0000aa":
        color_name = 'dark_blue';
        break;
      case "#5555ff":
        color_name = 'blue';
        break;
      case "#ff55ff":
        color_name = 'light_purple';
        break;
      case "#aa00aa":
        color_name = 'dark_purple';
        break;
      case "#ffffff":
        color_name = 'white';
        break;
      case "#aaaaaa":
        color_name = 'gray';
        break;
      case "#555555":
        color_name = 'dark_gray';
        break;
    }
    return color_name;
  }